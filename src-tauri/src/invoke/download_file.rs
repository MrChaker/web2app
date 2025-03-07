use crate::AppState;
use std::{
    fs::File,
    io::Write,
    str::FromStr,
    sync::{Arc, Mutex},
};
use tauri::{command, http::Method, AppHandle, Emitter, Listener, Manager, Url};
use tauri_plugin_http::reqwest::{ClientBuilder, Request};

#[derive(serde::Deserialize)]
pub struct DownloadFileParams {
    id: String,
    url: String,
    output_path: String,
}

#[derive(serde::Serialize, Clone)]
struct DownloadProgressPayload {
    id: String,
    progress: u64,
    file_size: u64,
}

#[derive(serde::Serialize, Clone)]
struct DownloadEndPayload {
    id: String,
    file_size: u64,
}

#[command]
pub async fn download_file(app: AppHandle, params: DownloadFileParams) {
    let mut file = File::create(params.output_path.clone()).unwrap();

    println!("Downloading file: {}", params.url);
    let client = ClientBuilder::new().build().unwrap();
    let response = client
        .execute(Request::new(
            Method::GET,
            Url::from_str(&params.url).unwrap(),
        ))
        .await;

    let mut response = match response {
        Ok(response) => response,
        Err(e) => {
            println!("Failed to download file: {:?}", e);
            let _ = app.emit(
                "download-failed",
                DownloadEndPayload {
                    id: params.id.clone(),
                    file_size: 0,
                },
            );
            return;
        }
    };

    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut start_time = std::time::Instant::now();

    while let Some(chunk) = response.chunk().await.unwrap() {
        let state = app.state::<Mutex<AppState>>();
        let state = state.lock().unwrap();

        if state.canceled_downloads.contains(&params.id) {
            println!("Download canceled");
            let _ = std::fs::remove_file(params.output_path);
            return;
        }

        downloaded += chunk.len() as u64;
        file.write_all(&chunk).unwrap();
        if start_time.elapsed().as_secs() >= 1 {
            println!("Downloaded {} of {} bytes", downloaded, total_size);
            let _ = app.emit(
                "download-progress",
                DownloadProgressPayload {
                    id: params.id.clone(),
                    progress: downloaded,
                    file_size: total_size,
                },
            );
            start_time = std::time::Instant::now();
        }
    }

    if response.status().is_success() {
        let _ = app.emit(
            "download-success",
            DownloadEndPayload {
                id: params.id.clone(),
                file_size: total_size,
            },
        );
    } else {
        println!("Failed to download file: {:?}", response.status());
        let _ = app.emit(
            "download-failed",
            DownloadEndPayload {
                id: params.id.clone(),
                file_size: total_size,
            },
        );
    }
}
