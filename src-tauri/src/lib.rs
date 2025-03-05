pub mod download_manager;
pub mod invoke;
pub mod migrations;
pub mod utils;
pub mod window;
use crate::invoke::{
    build_window::build_window, cancel_download::cancel_download,
    download_binary_file::download_binary_file, download_file::download_file,
};
use dotenv::dotenv;
use migrations::get_migrations;
use std::env;
use std::sync::Mutex;
use tauri::Manager;

#[derive(Default)]
pub struct AppState {
    canceled_downloads: Vec<String>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default();
    let _ = dotenv().expect("Failed to load .env file");

    app
        // .plugin(tauri_plugin_prevent_default::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_keygen::Builder::new(
                env::var("KEYGEN_ACCOUNT_ID").unwrap(),
                env::var("KEYGEN_VERIFY_KEY").unwrap(),
            )
            .build(),
        )
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:test-encryption.db", get_migrations())
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .setup(move |app| {
            // println!("conifg {:?}", app.path().app_config_dir());
            app.manage(Mutex::new(AppState::default()));
            // tauri::async_runtime::block_on(async move {
            //     let window = build_window(app).await;
            //     window.show().unwrap();
            // });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            download_file,
            download_binary_file,
            cancel_download,
            build_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
