use crate::download_manager::download_service::DownloadService;
use std::{env, path::PathBuf, str::FromStr};
use tauri::{webview::DownloadEvent, App, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

pub async fn build_window(app: &mut App) -> Vec<WebviewWindow> {
    // let package_name = "Google".to_string();

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

    let container_height = 600.0;
    let container_top = 100.0;
    let app_bar_height = 38.0;

    // app bar window
    //
    let app_bar_url = WebviewUrl::App(PathBuf::from_str("http://localhost:1420/app-bar").unwrap());
    let app_bar_window = WebviewWindowBuilder::new(app, "app_bar", app_bar_url)
        .visible(false)
        .inner_size(1200.0, container_height)
        .position(200.0, container_top)
        // .resizable(false)
        .decorations(false)
        .initialization_script(config_script)
        .initialization_script(include_str!("./scripts/helpers.js"))
        .build()
        .expect("Failed to build window");

    let app_window = WebviewWindowBuilder::new(app, "app", url)
        .title("")
        .parent(&app_bar_window)
        .expect("Failed to find container window")
        .user_agent(user_agent)
        .visible(false)
        .inner_size(1200.0, container_height - app_bar_height)
        .position(200.0, container_top + app_bar_height)
        .auto_resize()
        .resizable(false)
        .decorations(false)
        .initialization_script(config_script)
        .initialization_script(include_str!("./scripts/icons.js"))
        .initialization_script(include_str!("./scripts/helpers.js"))
        .initialization_script(include_str!("./scripts/styles.js"))
        .initialization_script(include_str!("./scripts/download_manager.js"))
        .on_download(move |webveiw, ev| {
            // let b = a.unmanage();
            if let DownloadEvent::Requested { url, destination } = ev {
                let download_service = DownloadService::new(webveiw);
                download_service.on_download(url);
            }
            return false;
        })
        .build()
        .expect("Failed to build window");

    vec![app_bar_window, app_window]
}
