mod commands;
mod config;
mod db;
mod paths;
mod pty;
mod state;

use commands::workspaces::*;
use pty::{PtyManager, start_pty_reader_loop, PtyManagerState, pty_create, pty_write, pty_resize, pty_kill, pty_kill_workspace};
use state::AppState;
use parking_lot::Mutex;
use std::sync::Arc;
use tauri::Manager;

#[tauri::command]
fn get_cli_args() -> Option<String> {
    std::env::var("VIGIL_DEFAULT_PATH").ok()
}

#[tauri::command]
fn get_initial_route() -> String {
    match std::env::var("VIGIL_DEFAULT_PATH") {
        Ok(path) if !path.is_empty() => "/workspace/create".to_string(),
        _ => "/".to_string(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let cli_default_path = std::env::var("VIGIL_DEFAULT_PATH").ok();

    let pty_manager: PtyManagerState = Arc::new(Mutex::new(PtyManager::new()));
    let pty_manager_for_setup = pty_manager.clone();

    tauri::Builder::default()
        .setup(move |app| {
            let pool = tauri::async_runtime::block_on(db::init());
            app.manage(AppState {
                db: pool,
                cli_default_path: cli_default_path.clone(),
            });

            start_pty_reader_loop(pty_manager_for_setup, app.handle().clone());

            Ok(())
        })
        .manage(pty_manager)
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_workspaces,
            get_workspace,
            create_workspace,
            update_workspace,
            delete_workspace,
            get_panes,
            create_pane,
            update_pane,
            delete_pane,
            get_config,
            save_config,
            get_cli_args,
            get_initial_route,
            pty_create,
            pty_write,
            pty_resize,
            pty_kill,
            pty_kill_workspace,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}