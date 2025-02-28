use crate::download_manager::download_service::DownloadService;
use std::{env, path::PathBuf, str::FromStr};
use tauri::{webview::DownloadEvent, App, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

pub async fn build_window(app: &mut App) -> WebviewWindow {
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
                db_key: "{}"
            }}
        "#,
        db_key
    );

    let window_builder = WebviewWindowBuilder::new(app, "app", url)
        .title("")
        .user_agent(user_agent)
        .visible(false)
        .inner_size(1200.0, 800.0)
        .decorations(false)
        .initialization_script(config_script)
        .initialization_script(include_str!("./scripts/icons.js"))
        .initialization_script(include_str!("./scripts/helpers.js"))
        .initialization_script(include_str!("./scripts/styles.js"))
        .initialization_script(include_str!("./scripts/app_bar.js"))
        .initialization_script(include_str!("./scripts/download_manager.js"))
        .on_download(move |webveiw, ev| {
            // let b = a.unmanage();
            if let DownloadEvent::Requested { url, destination } = ev {
                let download_service = DownloadService::new(webveiw);
                download_service.on_download(url);
            }
            return false;
        });

    window_builder.build().expect("Failed to build window")
}
