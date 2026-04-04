use serde::{Deserialize, Serialize};
use std::fs;

use crate::paths::get_config_path;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppConfig {
    #[serde(default)]
    pub app: AppSettings,
    #[serde(default)]
    pub ui: UiSettings,
    #[serde(default)]
    pub terminal: TerminalSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppSettings {
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(default = "default_save_interval")]
    pub save_interval: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UiSettings {
    #[serde(default = "default_sidebar_width")]
    pub default_sidebar_width: u32,
    #[serde(default = "default_true")]
    pub show_status_bar: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TerminalSettings {
    #[serde(default = "default_shell")]
    pub default_shell: String,
    #[serde(default = "default_font_size")]
    pub font_size: u32,
    #[serde(default = "default_font_family")]
    pub font_family: String,
}

fn default_theme() -> String {
    "dark".to_string()
}

fn default_save_interval() -> u32 {
    30
}

fn default_sidebar_width() -> u32 {
    200
}

fn default_true() -> bool {
    true
}

fn default_shell() -> String {
    "bash".to_string()
}

fn default_font_size() -> u32 {
    12
}

fn default_font_family() -> String {
    "JetBrains Mono".to_string()
}

pub fn load_config() -> AppConfig {
    let config_path = get_config_path();

    if config_path.exists() {
        if let Ok(content) = fs::read_to_string(&config_path) {
            if let Ok(config) = toml::from_str(&content) {
                return config;
            }
        }
    }

    AppConfig::default()
}

pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let config_path = get_config_path();

    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let content = toml::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(&config_path, content).map_err(|e| e.to_string())?;

    Ok(())
}
