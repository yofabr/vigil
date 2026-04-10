use crate::pty::PtyManager;
use std::sync::Arc;
use parking_lot::Mutex;
use tauri::State;

pub type PtyManagerState = Arc<Mutex<PtyManager>>;

#[tauri::command]
pub async fn pty_create(
    id: String,
    rows: u16,
    cols: u16,
    shell: Option<String>,
    manager: State<'_, PtyManagerState>,
) -> Result<(), String> {
    let mut mgr = manager.lock();
    mgr.create_session(id, rows, cols, shell)
}

#[tauri::command]
pub async fn pty_write(
    id: String,
    data: String,
    manager: State<'_, PtyManagerState>,
) -> Result<(), String> {
    let mgr = manager.lock();
    mgr.write(&id, &data)
}

#[tauri::command]
pub async fn pty_resize(
    id: String,
    rows: u16,
    cols: u16,
    manager: State<'_, PtyManagerState>,
) -> Result<(), String> {
    let mgr = manager.lock();
    mgr.resize(&id, rows, cols)
}

#[tauri::command]
pub async fn pty_kill(
    id: String,
    manager: State<'_, PtyManagerState>,
) -> Result<(), String> {
    let mut mgr = manager.lock();
    mgr.kill(&id)
}