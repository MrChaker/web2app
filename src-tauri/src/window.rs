use crate::utils::{check_file_or_append, get_filename_from_url};
use std::{path::PathBuf, str::FromStr};
use tauri::{
    webview::DownloadEvent, App, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
};

pub fn build_window(app: &mut App) -> WebviewWindow {
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

    let download_path = app.path().download_dir().unwrap();

    let window_builder = WebviewWindowBuilder::new(app, "app", url)
        .title("")
        .user_agent(user_agent)
        .visible(false)
        .inner_size(1200.0, 800.0)
        .decorations(false)
        .initialization_script(include_str!("./scripts/app_bar.js"))
        .on_download(move |_, ev| {
            match ev {
                DownloadEvent::Requested { url, destination } => {
                    let output_path = download_path.join(get_filename_from_url(url.to_string()));
                    let output_path = check_file_or_append(output_path.to_str().unwrap());
                    println!("Download started: {} to {}", url, output_path.clone());
                    *destination = output_path.into();
                }
                DownloadEvent::Finished { url, path, success } => {
                    if !success {
                        println!("Download Failed");
                    } else {
                        println!("Download complete: {} -> {:?}", url, path);
                    }
                }
                _ => (),
            }
            true
        });

    window_builder.build().expect("Failed to build window")
}
