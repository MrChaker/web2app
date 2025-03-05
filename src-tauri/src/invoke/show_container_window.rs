use crate::download_manager::download_service::DownloadService;
use serde::Deserialize;
use std::{env, path::PathBuf, str::FromStr};
use tauri::{
    command, webview::DownloadEvent, App, AppHandle, LogicalPosition, LogicalSize, Manager,
    WebviewUrl, WebviewWindow, WebviewWindowBuilder,
};

#[command]
pub fn show_container_window(app: AppHandle) {
    // let package_name = "Google".to_string();
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.hide();
    };
    if let Some(container) = app.get_window("container") {
        let _ = container.hide();
    };
}
