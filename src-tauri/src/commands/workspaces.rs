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
    pub agent: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Group {
    pub id: String,
    pub workspace_id: String,
    pub order_index: i32,
    pub size: f64,
    pub split_type: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Pane {
    pub id: String,
    pub group_id: String,
    pub order_index: i32,
    pub size: f64,
    pub mode: String,
    pub agent_command: Option<String>,
    pub terminal_pid: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceCreateInput {
    pub name: String,
    pub color: String,
    pub path: Option<String>,
    pub agent: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceUpdateInput {
    pub name: Option<String>,
    pub color: Option<String>,
    pub path: Option<String>,
    pub description: Option<String>,
    pub is_pinned: Option<i32>,
    pub agent: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GroupCreateInput {
    pub workspace_id: String,
    pub order_index: i32,
    pub size: Option<f64>,
    pub split_type: String,
}

#[derive(Debug, Deserialize)]
pub struct GroupUpdateInput {
    pub order_index: Option<i32>,
    pub size: Option<f64>,
    pub split_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaneCreateInput {
    pub group_id: String,
    pub order_index: i32,
    pub size: Option<f64>,
    pub mode: String,
    pub agent_command: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PaneUpdateInput {
    pub order_index: Option<i32>,
    pub size: Option<f64>,
    pub mode: Option<String>,
    pub agent_command: Option<String>,
    pub terminal_pid: Option<i32>,
}

fn generate_workspace_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    format!("ws-{}", timestamp)
}

fn generate_group_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
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
    format!("group-{}-{}", timestamp, random_suffix)
}

fn generate_pane_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
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
    format!("pane-{}-{}", timestamp, random_suffix)
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
    let ws_id = generate_workspace_id();

    let workspace = sqlx::query_as::<_, Workspace>(
        "INSERT INTO workspaces (id, name, color, path, agent) VALUES (?, ?, ?, ?, ?) RETURNING *"
    )
    .bind(&ws_id)
    .bind(&input.name)
    .bind(&input.color)
    .bind(&input.path)
    .bind(&input.agent)
    .fetch_one(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    // Create default group and pane
    let group_id = generate_group_id();
    sqlx::query(
        "INSERT INTO groups (id, workspace_id, order_index, size, split_type) VALUES (?, ?, 0, 50.0, 'VERTICAL')"
    )
    .bind(&group_id)
    .bind(&ws_id)
    .execute(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    let pane_id = generate_pane_id();
    sqlx::query(
        "INSERT INTO panes (id, group_id, order_index, size, mode) VALUES (?, ?, 0, 100.0, 'TERMINAL')"
    )
    .bind(&pane_id)
    .bind(&group_id)
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
    let mut updates: Vec<&str> = Vec::new();
    let mut has_updates = false;

    if input.name.is_some() {
        updates.push("name = ?");
        has_updates = true;
    }
    if input.color.is_some() {
        updates.push("color = ?");
        has_updates = true;
    }
    if input.path.is_some() {
        updates.push("path = ?");
        has_updates = true;
    }
    if input.description.is_some() {
        updates.push("description = ?");
        has_updates = true;
    }
    if input.is_pinned.is_some() {
        updates.push("is_pinned = ?");
        has_updates = true;
    }
    if input.agent.is_some() {
        updates.push("agent = ?");
        has_updates = true;
    }

    if !has_updates {
        return Err("No fields to update".to_string());
    }

    let query = format!(
        "UPDATE workspaces SET {}, updated_at = datetime('now') WHERE id = ? RETURNING *",
        updates.join(", ")
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
    if let Some(ref agent) = input.agent {
        query_builder = query_builder.bind(agent);
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
pub async fn get_groups(
    state: State<'_, AppState>,
    workspace_id: String,
) -> Result<Vec<Group>, String> {
    sqlx::query_as::<_, Group>(
        "SELECT * FROM groups WHERE workspace_id = ? ORDER BY order_index"
    )
    .bind(&workspace_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_group(
    state: State<'_, AppState>,
    input: GroupCreateInput,
) -> Result<Group, String> {
    let id = generate_group_id();
    let size = input.size.unwrap_or(50.0);

    sqlx::query_as::<_, Group>(
        "INSERT INTO groups (id, workspace_id, order_index, size, split_type) VALUES (?, ?, ?, ?, ?) RETURNING *"
    )
    .bind(&id)
    .bind(&input.workspace_id)
    .bind(input.order_index)
    .bind(size)
    .bind(&input.split_type)
    .fetch_one(&state.db)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_group(
    state: State<'_, AppState>,
    id: String,
    input: GroupUpdateInput,
) -> Result<Group, String> {
    let mut updates: Vec<&str> = Vec::new();
    let mut has_updates = false;

    if input.order_index.is_some() {
        updates.push("order_index = ?");
        has_updates = true;
    }
    if input.size.is_some() {
        updates.push("size = ?");
        has_updates = true;
    }
    if input.split_type.is_some() {
        updates.push("split_type = ?");
        has_updates = true;
    }

    if !has_updates {
        return Err("No fields to update".to_string());
    }

    let query = format!(
        "UPDATE groups SET {} WHERE id = ? RETURNING *",
        updates.join(", ")
    );

    let mut query_builder = sqlx::query_as::<_, Group>(&query).bind(&id);

    if let Some(order_index) = input.order_index {
        query_builder = query_builder.bind(order_index);
    }
    if let Some(size) = input.size {
        query_builder = query_builder.bind(size);
    }
    if let Some(ref split_type) = input.split_type {
        query_builder = query_builder.bind(split_type);
    }

    query_builder
        .fetch_one(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_group(state: State<'_, AppState>, id: String) -> Result<(), String> {
    sqlx::query("DELETE FROM groups WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_panes(
    state: State<'_, AppState>,
    group_id: String,
) -> Result<Vec<Pane>, String> {
    sqlx::query_as::<_, Pane>(
        "SELECT * FROM panes WHERE group_id = ? ORDER BY order_index"
    )
    .bind(&group_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_panes(
    state: State<'_, AppState>,
    workspace_id: String,
) -> Result<Vec<Pane>, String> {
    sqlx::query_as::<_, Pane>(
        "SELECT panes.* FROM panes 
         JOIN groups ON panes.group_id = groups.id 
         WHERE groups.workspace_id = ?
         ORDER BY panes.order_index"
    )
    .bind(&workspace_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_pane(
    state: State<'_, AppState>,
    input: PaneCreateInput,
) -> Result<Pane, String> {
    let id = generate_pane_id();
    let size = input.size.unwrap_or(50.0);

    sqlx::query_as::<_, Pane>(
        "INSERT INTO panes (id, group_id, order_index, size, mode, agent_command) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
    )
    .bind(&id)
    .bind(&input.group_id)
    .bind(input.order_index)
    .bind(size)
    .bind(&input.mode)
    .bind(&input.agent_command)
    .fetch_one(&state.db)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_pane(
    state: State<'_, AppState>,
    id: String,
    input: PaneUpdateInput,
) -> Result<Pane, String> {
    let mut updates: Vec<&str> = Vec::new();
    let mut has_updates = false;

    if input.order_index.is_some() {
        updates.push("order_index = ?");
        has_updates = true;
    }
    if input.size.is_some() {
        updates.push("size = ?");
        has_updates = true;
    }
    if input.mode.is_some() {
        updates.push("mode = ?");
        has_updates = true;
    }
    if input.agent_command.is_some() {
        updates.push("agent_command = ?");
        has_updates = true;
    }
    if input.terminal_pid.is_some() {
        updates.push("terminal_pid = ?");
        has_updates = true;
    }

    if !has_updates {
        return Err("No fields to update".to_string());
    }

    let query = format!(
        "UPDATE panes SET {} WHERE id = ? RETURNING *",
        updates.join(", ")
    );

    let mut query_builder = sqlx::query_as::<_, Pane>(&query).bind(&id);

    if let Some(order_index) = input.order_index {
        query_builder = query_builder.bind(order_index);
    }
    if let Some(size) = input.size {
        query_builder = query_builder.bind(size);
    }
    if let Some(ref mode) = input.mode {
        query_builder = query_builder.bind(mode);
    }
    if let Some(ref agent_command) = input.agent_command {
        query_builder = query_builder.bind(agent_command);
    }
    if let Some(terminal_pid) = input.terminal_pid {
        query_builder = query_builder.bind(terminal_pid);
    }

    query_builder
        .fetch_one(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_pane(state: State<'_, AppState>, id: String) -> Result<(), String> {
    sqlx::query("DELETE FROM panes WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_config() -> Result<AppConfig, String> {
    Ok(crate::config::load_config())
}

#[tauri::command]
pub fn save_config(config: AppConfig) -> Result<(), String> {
    crate::config::save_config(&config)
}