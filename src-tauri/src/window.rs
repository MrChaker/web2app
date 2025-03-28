use crate::download_manager::download_service::DownloadService;
use serde::{Deserialize, Serialize};
use std::{error::Error, path::PathBuf, str::FromStr};
use tauri::{
    http::Method, webview::DownloadEvent, App, LogicalPosition, LogicalSize, Url, WebviewUrl,
    Window,
};
use tauri_plugin_http::reqwest::{ClientBuilder, Request};

#[derive(Serialize, Deserialize, Clone)]
struct AppConfig {
    name: String,
    url: String,
    icon: String,
}

pub async fn build_window(app: &mut App) -> Window {
    // let package_name = "Google".to_string();

    let app_config: AppConfig = serde_json::from_str(include_str!("../../app-config.json"))
        .expect("Failed to parse app config");

    let user_agent = if cfg!(target_os = "macos") {
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15"
    } else if cfg!(target_os = "windows") {
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    } else if cfg!(target_os = "linux") {
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    } else {
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    };

    let config_script = &format!(
        r#"
            window.config = {{
                app_name: "{}",
                icon: "{}",
            }}
        "#,
        app_config.name, app_config.icon
    );

    let width = 1200.;
    let height = 800.;
    let app_bar_height = 38.0;

    let react_url = if cfg!(debug_assertions) {
        WebviewUrl::App(PathBuf::from_str("http://localhost:1420").unwrap())
    } else {
        WebviewUrl::App(PathBuf::from_str("./dist/index.html").unwrap())
    };

    let container_window = tauri::window::WindowBuilder::new(app, "container")
        .inner_size(width, height)
        .decorations(false)
        .resizable(true)
        .visible(false)
        .title("Main Window")
        .build()
        .expect("Failed to build window");

    let url = WebviewUrl::App(PathBuf::from_str(&app_config.url).unwrap());
    let client = ClientBuilder::new().build().unwrap();
    let response = client
        .execute(Request::new(
            Method::HEAD,
            Url::from_str(&app_config.url).unwrap(),
        ))
        .await;

    let _app_window = match response {
        Err(e) => {
            let mut errors = vec![];
            let mut source = e.source();
            while let Some(s) = source {
                errors.push(format!("{s}"));
                source = s.source();
            }

            println!(
                "Caused by: {}",
                errors
                    .iter()
                    .map(|s| s.as_str())
                    .collect::<Vec<&str>>()
                    .join("-")
            );

            container_window.add_child(
                tauri::webview::WebviewBuilder::new("error", react_url.clone())
                    .initialization_script(&format!(
                        r#"
                        window.error = "{}"
                    "#,
                        errors
                            .iter()
                            .map(|s| s.as_str())
                            .collect::<Vec<&str>>()
                            .join("-")
                    ))
                    .auto_resize(),
                LogicalPosition::new(0., app_bar_height - 1.2),
                LogicalSize::new(width, height - app_bar_height),
            )
        }
        Ok(_) => {
            container_window.add_child(
                tauri::webview::WebviewBuilder::new("app", url)
                    .user_agent(user_agent)
                    .initialization_script(config_script)
                    .initialization_script(include_str!("./scripts/helpers.js"))
                    .on_download(move |webveiw, ev| {
                        // let b = a.unmanage();
                        if let DownloadEvent::Requested {
                            url,
                            destination: _,
                        } = ev
                        {
                            let download_service = DownloadService::new(webveiw);
                            download_service.on_download(url);
                        }
                        return false;
                    })
                    .auto_resize(),
                LogicalPosition::new(0., app_bar_height - 1.2),
                LogicalSize::new(width, height - app_bar_height),
            )
        }
    };

    let _app_bar_window = container_window.add_child(
        tauri::webview::WebviewBuilder::new("app_bar", react_url.clone())
            .initialization_script(config_script),
        LogicalPosition::new(0., 0.),
        LogicalSize::new(width, app_bar_height),
    );

    let _downloads_window = container_window.add_child(
        tauri::webview::WebviewBuilder::new("downloads", react_url.clone())
            .initialization_script(config_script),
        LogicalPosition::new(width - 600., app_bar_height),
        LogicalSize::new(400., 510.0),
    );

    let _settings_window = container_window.add_child(
        tauri::webview::WebviewBuilder::new("settings", react_url)
            .initialization_script(config_script),
        LogicalPosition::new(width - 300., app_bar_height),
        LogicalSize::new(250., 300.0),
    );

    container_window
}
