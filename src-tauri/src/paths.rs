use std::path::PathBuf;

pub fn get_app_dir() -> PathBuf {
    if cfg!(windows) {
        directories::BaseDirs::new()
            .map(|dirs| dirs.data_dir().join("vigil"))
            .unwrap_or_else(|| {
                std::env::var("APPDATA")
                    .map(PathBuf::from)
                    .unwrap_or_else(|_| PathBuf::from("vigil"))
                    .join("vigil")
            })
    } else {
        directories::UserDirs::new()
            .and_then(|dirs| dirs.home_dir().join(".vigil").into())
            .unwrap_or_else(|| {
                std::env::var("HOME")
                    .map(|h| PathBuf::from(h).join(".vigil"))
                    .unwrap_or_else(|_| PathBuf::from(".vigil"))
            })
    }
}

pub fn get_config_path() -> PathBuf {
    get_app_dir().join("config.toml")
}

pub fn get_db_path() -> PathBuf {
    let path = get_app_dir().join("vigil.db");
    eprintln!("[DEBUG] DB path: {:?}", path);
    path
}
