use sqlx::SqlitePool;

pub struct AppState {
    pub db: SqlitePool,
    pub cli_default_path: Option<String>,
}
