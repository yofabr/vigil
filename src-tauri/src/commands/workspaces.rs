use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use tauri::State;

use crate::config::AppConfig;
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub color: String,
    pub path: Option<String>,
    pub description: Option<String>,
    pub is_pinned: i32,
    pub created_at: String,
    pub updated_at: String,
    pub last_opened_at: Option<String>,
    pub open_count: i32,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct PaneTree {
    pub workspace_id: String,
    pub active_pane_index: i32,
    pub tree_json: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceCreateInput {
    pub name: String,
    pub color: String,
    pub path: Option<String>,
    pub layout: Option<String>,
    pub terminal_count: Option<i32>,
    pub agent: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceUpdateInput {
    pub name: Option<String>,
    pub color: Option<String>,
    pub path: Option<String>,
    pub description: Option<String>,
    pub is_pinned: Option<i32>,
}

fn generate_workspace_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    format!("ws-{}", timestamp)
}

fn default_pane_tree_json() -> String {
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let random_suffix: String = (0..8)
        .map(|_| {
            let idx = rand_simple() % 36;
            if idx < 10 {
                (b'0' + idx as u8) as char
            } else {
                (b'a' + (idx - 10) as u8) as char
            }
        })
        .collect();

    format!(
        r#"{{"id":"pane-{}-{}","split":"horizontal","children":[{{"id":"pane-{}-{}","split":"vertical","children":[{{"id":"pane-{}-{}"}}]}}]}}"#,
        timestamp, random_suffix,
        timestamp, random_suffix,
        timestamp, random_suffix
    )
}

fn rand_simple() -> u32 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    (nanos % 36) as u32
}

#[tauri::command]
pub async fn get_workspaces(state: State<'_, AppState>) -> Result<Vec<Workspace>, String> {
    sqlx::query_as::<_, Workspace>("SELECT * FROM workspaces ORDER BY is_pinned DESC, name ASC")
        .fetch_all(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_workspace(state: State<'_, AppState>, id: String) -> Result<Option<Workspace>, String> {
    sqlx::query_as::<_, Workspace>("SELECT * FROM workspaces WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_workspace(
    state: State<'_, AppState>,
    input: WorkspaceCreateInput,
) -> Result<Workspace, String> {
    let id = generate_workspace_id();
    let default_tree = default_pane_tree_json();

    let workspace = sqlx::query_as::<_, Workspace>(
        "INSERT INTO workspaces (id, name, color, path) VALUES (?, ?, ?, ?) RETURNING *"
    )
    .bind(&id)
    .bind(&input.name)
    .bind(&input.color)
    .bind(&input.path)
    .fetch_one(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "INSERT INTO pane_trees (workspace_id, tree_json) VALUES (?, ?)"
    )
    .bind(&id)
    .bind(&default_tree)
    .execute(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(workspace)
}

#[tauri::command]
pub async fn update_workspace(
    state: State<'_, AppState>,
    id: String,
    input: WorkspaceUpdateInput,
) -> Result<Workspace, String> {
    let mut updates = Vec::new();
    let mut needs_comma = false;

    if input.name.is_some() {
        updates.push("name = ?");
        needs_comma = true;
    }
    if input.color.is_some() {
        if needs_comma {
            updates.push(", color = ?");
        } else {
            updates.push("color = ?");
            needs_comma = true;
        }
    }
    if input.path.is_some() {
        if needs_comma {
            updates.push(", path = ?");
        } else {
            updates.push("path = ?");
            needs_comma = true;
        }
    }
    if input.description.is_some() {
        if needs_comma {
            updates.push(", description = ?");
        } else {
            updates.push("description = ?");
            needs_comma = true;
        }
    }
    if input.is_pinned.is_some() {
        if needs_comma {
            updates.push(", is_pinned = ?");
        } else {
            updates.push("is_pinned = ?");
        }
    }

    updates.push(", updated_at = datetime('now')");

    let query = format!(
        "UPDATE workspaces SET {} WHERE id = ? RETURNING *",
        updates.join("")
    );

    let mut query_builder = sqlx::query_as::<_, Workspace>(&query).bind(&id);

    if let Some(ref name) = input.name {
        query_builder = query_builder.bind(name);
    }
    if let Some(ref color) = input.color {
        query_builder = query_builder.bind(color);
    }
    if let Some(ref path) = input.path {
        query_builder = query_builder.bind(path);
    }
    if let Some(ref description) = input.description {
        query_builder = query_builder.bind(description);
    }
    if let Some(is_pinned) = input.is_pinned {
        query_builder = query_builder.bind(is_pinned);
    }

    query_builder
        .fetch_one(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_workspace(state: State<'_, AppState>, id: String) -> Result<(), String> {
    sqlx::query("DELETE FROM workspaces WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_pane_tree(
    state: State<'_, AppState>,
    workspace_id: String,
) -> Result<Option<PaneTree>, String> {
    sqlx::query_as::<_, PaneTree>("SELECT * FROM pane_trees WHERE workspace_id = ?")
        .bind(&workspace_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_pane_tree(
    state: State<'_, AppState>,
    workspace_id: String,
    tree_json: String,
    active_pane_index: i32,
) -> Result<PaneTree, String> {
    sqlx::query_as::<_, PaneTree>(
        "INSERT INTO pane_trees (workspace_id, tree_json, active_pane_index) VALUES (?, ?, ?) 
         ON CONFLICT(workspace_id) DO UPDATE SET tree_json = ?, active_pane_index = ?, updated_at = datetime('now')
         RETURNING *"
    )
    .bind(&workspace_id)
    .bind(&tree_json)
    .bind(active_pane_index)
    .bind(&tree_json)
    .bind(active_pane_index)
    .fetch_one(&state.db)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_config() -> Result<AppConfig, String> {
    Ok(crate::config::load_config())
}

#[tauri::command]
pub fn save_config(config: AppConfig) -> Result<(), String> {
    crate::config::save_config(&config)
}
