use std::{path::PathBuf, str::FromStr};
use tauri::{App, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

pub fn data_dir(app_name: String) -> PathBuf {
    PathBuf::from_str(&format!("/Users/mac27/Downloads/{app_name}")).unwrap()
}

pub fn build_window(app: &mut App) -> WebviewWindow {
    let package_name = "Google".to_string();
    let _data_dir = data_dir(package_name);

    let url = WebviewUrl::App(
        PathBuf::from_str(
            "http://127.0.0.1:5500/page.html",
            // "https://developer.microsoft.com/en-us/microsoft-edge/webview2/?form=MA13LH#download",
        )
        .unwrap(),
    );

    let window_builder = WebviewWindowBuilder::new(app, "app", url)
        .title("")
        .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15")
        .visible(false)
        .decorations(false)
        .initialization_script(include_str!("./scripts/download.js"))
        .initialization_script(include_str!("./scripts/app_bar.js"));

    window_builder.build().expect("Failed to build window")
}
