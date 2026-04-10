// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use clap::Parser;
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[command(version, about)]
pub struct CliArgs {
    #[arg(default_value = ".")]
    path: PathBuf,
}

fn main() {
    let args = CliArgs::parse();

    let resolved_path = if args.path == PathBuf::from(".") {
        std::env::current_dir().unwrap_or(args.path)
    } else {
        args.path.canonicalize().unwrap_or_else(|_| args.path)
    };

    let path_str = resolved_path.to_string_lossy().to_string();

    std::env::set_var("VIGIL_DEFAULT_PATH", &path_str);

    vigil_lib::run()
}
