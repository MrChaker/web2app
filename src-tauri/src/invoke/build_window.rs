use crate::download_manager::download_service::DownloadService;
use serde::Deserialize;
use std::{env, path::PathBuf, str::FromStr};
use tauri::{
    command, webview::DownloadEvent, App, AppHandle, LogicalPosition, LogicalSize, Manager,
    WebviewUrl, WebviewWindow, WebviewWindowBuilder,
};

#[derive(Deserialize, Clone)]
pub struct Params {
    expiry: String,
    key: String,
}

#[command]
pub fn build_window(app: AppHandle, params: Params) {
    // let package_name = "Google".to_string();
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.hide();
    };

    let url = WebviewUrl::App(PathBuf::from_str("https://desktop.github.com/download/").unwrap());

    let user_agent = if cfg!(target_os = "macos") {
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15"
    } else if cfg!(target_os = "windows") {
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    } else if cfg!(target_os = "linux") {
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    } else {
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    };

    let db_key = env::var("DATABASE_KEY").expect("DATABASE_KEY not found");

    let config_script = &format!(
        r#"
            window.config = {{
                db_key: "{}",
            }}
        "#,
        db_key,
    );

    let width = 1200.;
    let height = 800.;
    let app_bar_height = 38.0;
    let app_bar_url = WebviewUrl::App(PathBuf::from_str("http://localhost:1420/app-bar").unwrap());

    let container_window = tauri::window::WindowBuilder::new(&app, "container")
        .inner_size(width, height)
        .decorations(false)
        .resizable(true)
        .visible(false)
        .title("Container Window")
        .build()
        .expect("Failed to build window");

    let _app_bar_window = container_window.add_child(
        tauri::webview::WebviewBuilder::new("app_bar", app_bar_url)
            .initialization_script(config_script)
            .initialization_script(include_str!("../scripts/helpers.js"))
            .auto_resize(),
        LogicalPosition::new(0., 0.),
        LogicalSize::new(width, app_bar_height),
    );
    let _app_window = container_window.add_child(
        tauri::webview::WebviewBuilder::new("app", url)
            .user_agent(user_agent)
            .initialization_script(config_script)
            .initialization_script(include_str!("../scripts/icons.js"))
            .initialization_script(include_str!("../scripts/helpers.js"))
            .initialization_script(include_str!("../scripts/styles.js"))
            .initialization_script(include_str!("../scripts/download_manager.js"))
            .initialization_script(include_str!("../scripts/settings.js"))
            .initialization_script(include_str!("../scripts/license.js"))
            .on_download(move |webveiw, ev| {
                // let b = a.unmanage();
                if let DownloadEvent::Requested { url, destination } = ev {
                    let download_service = DownloadService::new(webveiw);
                    download_service.on_download(url);
                }
                return false;
            })
            .auto_resize(),
        LogicalPosition::new(0., app_bar_height - 1.2),
        LogicalSize::new(width, height - app_bar_height),
    );
    container_window.show().unwrap();
}
