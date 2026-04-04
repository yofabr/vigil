use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    SqlitePool,
};

use crate::paths::get_db_path;

pub async fn init() -> SqlitePool {
    let db_path = get_db_path();

    let parent = db_path.parent().unwrap();
    if !parent.exists() {
        std::fs::create_dir_all(parent).expect("Could not create app directory");
    }

    // Use SqliteConnectOptions with create_if_missing to auto-create database
    let db_url = format!("file:{}", db_path.display());
    eprintln!("[DEBUG] DB URL: {}", db_url);

    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await
        .map_err(|e| {
            eprintln!("[ERROR] Failed to connect: {}", e);
            e
        })
        .expect("Failed to connect to SQLite");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Migration failed");

    eprintln!("[DEBUG] Database initialized successfully");
    pool
}
