use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize, Child};
use parking_lot::Mutex;
use std::collections::HashMap;
use std::sync::Arc;
use std::thread;
use tauri::{AppHandle, Emitter};

pub type PtyManagerState = Arc<Mutex<PtyManager>>;

pub struct PtySession {
    id: String,
    master: Box<dyn MasterPty + Send>,
    child: Box<dyn Child + Send>,
}

pub struct PtyManager {
    sessions: HashMap<String, Arc<Mutex<PtySession>>>,
}

impl Default for PtyManager {
    fn default() -> Self {
        Self::new()
    }
}

impl PtyManager {
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
        }
    }

    pub fn create_session(
        &mut self,
        id: String,
        rows: u16,
        cols: u16,
        shell: Option<String>,
    ) -> Result<(), String> {
        let pty_system = native_pty_system();

        let pair = pty_system
            .openpty(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("Failed to open PTY: {}", e))?;

        let shell = shell.unwrap_or_else(|| {
            if cfg!(target_os = "windows") {
                "powershell.exe".to_string()
            } else {
                std::env::var("SHELL").unwrap_or_else(|_| "bash".to_string())
            }
        });

        let mut cmd = CommandBuilder::new(&shell);
        #[cfg(not(target_os = "windows"))]
        {
            cmd.env("TERM", "xterm-256color");
        }

        let child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| format!("Failed to spawn command: {}", e))?;

        drop(pair.slave);

        let master = pair.master;
        let session_id = id.clone();

        let session = Arc::new(Mutex::new(PtySession {
            id: session_id,
            master,
            child,
        }));

        self.sessions.insert(id, session);
        Ok(())
    }

    pub fn write(&self, id: &str, data: &str) -> Result<(), String> {
        let session = self
            .sessions
            .get(id)
            .ok_or_else(|| format!("Session not found: {}", id))?;

        let session = session.lock();
        let mut writer = session
            .master
            .take_writer()
            .map_err(|e| format!("Failed to get writer: {}", e))?;

        use std::io::Write;
        writer
            .write_all(data.as_bytes())
            .map_err(|e| format!("Failed to write: {}", e))?;

        writer.flush().map_err(|e| format!("Failed to flush: {}", e))?;

        Ok(())
    }

    pub fn resize(&self, id: &str, rows: u16, cols: u16) -> Result<(), String> {
        let session = self
            .sessions
            .get(id)
            .ok_or_else(|| format!("Session not found: {}", id))?;

        let session = session.lock();
        session
            .master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("Failed to resize: {}", e))?;

        Ok(())
    }

    pub fn kill(&mut self, id: &str) -> Result<(), String> {
        let session = self
            .sessions
            .remove(id)
            .ok_or_else(|| format!("Session not found: {}", id))?;

        let mut session = session.lock();
        session.child.kill().map_err(|e| format!("Failed to kill: {}", e))?;

        Ok(())
    }

    pub fn kill_all_for_workspace(&mut self, workspace_id: &str) -> Result<(), String> {
        let ids_to_kill: Vec<String> = self
            .sessions
            .keys()
            .filter(|id| id.starts_with(&format!("{}-", workspace_id)))
            .cloned()
            .collect();

        for id in ids_to_kill {
            let _ = self.kill(&id);
        }
        Ok(())
    }

    pub fn try_read(&self, id: &str, buf: &mut [u8]) -> Result<usize, String> {
        let session = self
            .sessions
            .get(id)
            .ok_or_else(|| format!("Session not found: {}", id))?;

        let session = session.lock();
        let mut reader = session
            .master
            .try_clone_reader()
            .map_err(|e| format!("Failed to clone reader: {}", e))?;
        
        match reader.read(buf) {
            Ok(n) => Ok(n),
            Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => Ok(0),
            Err(e) => Err(format!("Read error: {}", e)),
        }
    }

    pub fn is_alive(&self, id: &str) -> bool {
        if let Some(session) = self.sessions.get(id) {
            let mut session = session.lock();
            matches!(session.child.try_wait(), Ok(None))
        } else {
            false
        }
    }
}

#[tauri::command]
pub async fn pty_create(
    id: String,
    rows: u16,
    cols: u16,
    shell: Option<String>,
    manager: tauri::State<'_, PtyManagerState>,
) -> Result<(), String> {
    let mut mgr = manager.lock();
    mgr.create_session(id, rows, cols, shell)
}

#[tauri::command]
pub async fn pty_write(
    id: String,
    data: String,
    manager: tauri::State<'_, PtyManagerState>,
) -> Result<(), String> {
    let mgr = manager.lock();
    mgr.write(&id, &data)
}

#[tauri::command]
pub async fn pty_resize(
    id: String,
    rows: u16,
    cols: u16,
    manager: tauri::State<'_, PtyManagerState>,
) -> Result<(), String> {
    let mgr = manager.lock();
    mgr.resize(&id, rows, cols)
}

#[tauri::command]
pub async fn pty_kill(
    id: String,
    manager: tauri::State<'_, PtyManagerState>,
) -> Result<(), String> {
    let mut mgr = manager.lock();
    mgr.kill(&id)
}

#[tauri::command]
pub async fn pty_kill_workspace(
    workspace_id: String,
    manager: tauri::State<'_, PtyManagerState>,
) -> Result<(), String> {
    let mut mgr = manager.lock();
    mgr.kill_all_for_workspace(&workspace_id)
}

pub fn start_pty_reader_loop(
    manager: PtyManagerState,
    app: AppHandle,
) {
    thread::spawn(move || {
        loop {
            let session_ids: Vec<String> = {
                let mgr = manager.lock();
                mgr.sessions.keys().cloned().collect()
            };

            for id in session_ids {
                let mut data_buf = [0u8; 4096];
                let data_len = {
                    let mgr = manager.lock();
                    match mgr.try_read(&id, &mut data_buf) {
                        Ok(n) => Some(n),
                        Err(_) => None,
                    }
                };

                if let Some(n) = data_len {
                    if n > 0 {
                        let data = String::from_utf8_lossy(&data_buf[..n]).to_string();
                        let _ = app.emit(&format!("pty-data-{}", id), data);
                    }
                }

                let alive = {
                    let mgr = manager.lock();
                    mgr.is_alive(&id)
                };

                if !alive {
                    let _ = app.emit(&format!("pty-exit-{}", id), ());
                }
            }

            thread::sleep(std::time::Duration::from_millis(10));
        }
    });
}