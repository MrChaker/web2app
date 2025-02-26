pub mod download_manager;
pub mod invoke;
pub mod migrations;
pub mod utils;
pub mod window;
use crate::invoke::{
    cancel_download::cancel_download, download_binary_file::download_binary_file,
    download_file::download_file,
};
use dotenv::dotenv;
use migrations::get_migrations;
use std::env;
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_sql::SqliteConnectOptions;
use window::build_window;
#[derive(Default)]
pub struct AppState {
    canceled_downloads: Vec<String>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default();
    let _ = dotenv().expect("Failed to load .env file");
    let db_key = env::var("DATABASE_KEY").expect("DATABASE_KEY not found");

    app
        // .plugin(tauri_plugin_prevent_default::init())
        .plugin(tauri_plugin_shell::init())
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
            app.manage(Mutex::new(AppState::default()));
            tauri::async_runtime::block_on(async move {
                let window = build_window(app).await;
                window.show().unwrap();
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            download_file,
            download_binary_file,
            cancel_download
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
