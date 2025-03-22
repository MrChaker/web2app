pub mod download_manager;
pub mod invoke;
pub mod migrations;
pub mod utils;
pub mod window;
use crate::invoke::{
    cancel_download::cancel_download, download_binary_file::download_binary_file,
    download_file::download_file, show_container_window::show_container_window,
};
use cryptify;
use dotenvy_macro::dotenv;
use migrations::get_migrations;
use std::env;
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_sql::SqliteConnectOptions;
use window::build_window;
#[derive(Default)]
pub struct AppState {
    canceled_downloads: Vec<String>,
}

#[tauri::command]
fn get_env(name: &str) -> String {
    let res = match name {
        // all vars needed by frontend
        "HEARTBEAT_INTERVAL" => dotenv!("HEARTBEAT_INTERVAL"),
        "KEYGEN_ACCOUNT_ID" => dotenv!("KEYGEN_ACCOUNT_ID"),
        "DATABASE_KEY" => dotenv!("DATABASE_KEY"),
        _ => "",
    };
    res.to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default();

    // let _ = dotenv();
    let db_key = dotenv!("DATABASE_KEY");

    app
        // .plugin(tauri_plugin_prevent_default::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_keygen::Builder::new(
                dotenv!("KEYGEN_ACCOUNT_ID"),
                dotenv!("KEYGEN_VERIFY_KEY"),
                "test-encryption.db",
                db_key,
            )
            .build(),
        )
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:test-encryption.db", get_migrations())
                .add_sqlite_options(
                    "sqlite:test-encryption.db",
                    SqliteConnectOptions::new().pragma("key", db_key),
                )
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .setup(move |app| {
            // println!("conifg {:?}", app.path().app_config_dir());
            app.manage(Mutex::new(AppState::default()));
            tauri::async_runtime::block_on(async move {
                let window = build_window(app).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            download_file,
            download_binary_file,
            cancel_download,
            show_container_window,
            get_env
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
