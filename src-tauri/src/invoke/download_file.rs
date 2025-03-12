use crate::{
    utils::{check_file_or_append, get_filename_from_url},
    AppState,
};
use async_std::path::{Path, PathBuf};
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
struct DownloadUpdatePayload {
    id: String,
    file_name: String,
    output_path: String,
}

#[derive(serde::Serialize, Clone)]
struct DownloadEndPayload {
    id: String,
    file_size: u64,
}

fn extract_filename(value: &str) -> Option<String> {
    // Check for the `filename=` or `filename*=` prefix
    let filename_prefix = if value.contains("filename=") {
        "filename="
    } else if value.contains("filename*=") {
        "filename*="
    } else {
        return None; // No filename found
    };

    // Find the starting position of the filename
    let filename_start = value.find(filename_prefix)? + filename_prefix.len();

    // Extract the substring starting from the filename
    let remaining = &value[filename_start..];

    // Handle quoted filenames
    if remaining.starts_with('\"') {
        let filename_start = 1; // Skip the opening quote
        let filename_end = remaining[filename_start..].find('\"')? + filename_start;
        Some(remaining[filename_start..filename_end].to_string())
    }
    // Handle unquoted filenames
    else {
        // Find the end of the filename (either a semicolon or the end of the string)
        let filename_end = remaining.find(';').unwrap_or(remaining.len());
        Some(remaining[..filename_end].trim().to_string())
    }
}

#[command]
pub async fn download_file(app: AppHandle, params: DownloadFileParams) {
    let mut file = File::create(params.output_path.clone()).unwrap();

    println!("Downloading file: {}", params.url);
    let client = ClientBuilder::new().build().unwrap();
    let response = client
        .execute(Request::new(
            Method::GET,
            Url::from_str(&params.url.clone()).unwrap(),
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

    let mut override_file_name: String = get_filename_from_url(params.url);
    let mut override_output_path: String = get_filename_from_url(params.output_path.clone());

    let disposition = response.headers().get("content-disposition");
    if let Some(disposition) = disposition {
        if let Ok(value) = disposition.to_str() {
            if let Some(file_name) = extract_filename(value) {
                let mut new_path = PathBuf::from_str(&params.output_path.clone()).unwrap();
                new_path.pop();
                new_path = new_path.join(file_name);

                override_output_path = check_file_or_append(new_path.to_str().unwrap());
                override_file_name = get_filename_from_url(override_output_path.clone());

                std::fs::rename(&params.output_path, &override_output_path).unwrap();
                let _ = app.emit(
                    "download-update",
                    DownloadUpdatePayload {
                        id: params.id.clone(),
                        file_name: override_file_name,
                        output_path: override_output_path,
                    },
                );
            }
        }
    }

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
                    file_size: if total_size == 0 {
                        downloaded
                    } else {
                        total_size
                    },
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
                file_size: if total_size == 0 {
                    downloaded
                } else {
                    total_size
                },
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
