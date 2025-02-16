pub mod invoke;
pub mod utils;
pub mod window;

use crate::invoke::{
    download_binary_file::download_binary_file, download_file::download_file,
    try_download_file::try_download_file,
};
use window::build_window;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default();

    app.plugin(tauri_plugin_prevent_default::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            download_file,
            download_binary_file,
            try_download_file
        ])
        .setup(move |app| {
            let window = build_window(app);
            window.show().unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
