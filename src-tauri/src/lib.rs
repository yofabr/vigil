mod commands;
mod config;
mod db;
mod paths;
mod state;

use commands::workspaces::*;
use state::AppState;
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

    tauri::Builder::default()
        .setup(move |app| {
            let pool = tauri::async_runtime::block_on(db::init());
            app.manage(AppState {
                db: pool,
                cli_default_path: cli_default_path.clone(),
            });
            Ok(())
        })
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}