pub mod download_manager;
pub mod invoke;
pub mod migrations;
pub mod utils;
pub mod window;
use crate::invoke::{
    build_window::build_window, cancel_download::cancel_download,
    download_binary_file::download_binary_file, download_file::download_file,
};
use migrations::get_migrations;
use std::sync::Mutex;
use tauri::Manager;

#[derive(Default)]
pub struct AppState {
    canceled_downloads: Vec<String>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default();

    app
        // .plugin(tauri_plugin_prevent_default::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_keygen::Builder::new(
                "bd4b05a9-b8eb-4a87-8f7e-3d5c933cff3a",
                "b8b94aa4f795a0263b8cd87ac98565a05f7d691803acfbb68d998c53321a03d0",
            )
            .build(),
        )
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:test.db", get_migrations())
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
