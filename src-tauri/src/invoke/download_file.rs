use std::{
    fs::File,
    io::{copy, Write},
    str::FromStr,
};
use tauri::{command, http::Method, AppHandle, Manager, Url};
use tauri_plugin_http::reqwest::{ClientBuilder, Request};

use crate::utils::check_file_or_append;

#[derive(serde::Deserialize)]
pub struct DownloadFileParams {
    url: String,
    filename: String,
}

#[command]
pub async fn download_file(app: AppHandle, params: DownloadFileParams) {
    // Implement custom download logic here
    println!("Downloading file from {}", params.filename);
    let output_path = app.path().download_dir().unwrap().join(params.filename);
    let output_path = check_file_or_append(output_path.to_str().unwrap());
    let mut file = File::create(output_path.clone()).unwrap();

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
            return;
        }
    };

    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;

    while let Some(chunk) = response.chunk().await.unwrap() {
        downloaded += chunk.len() as u64;
        file.write_all(&chunk).unwrap();
        println!("Downloaded {} of {} bytes", downloaded, total_size);
    }

    if response.status().is_success() {
        println!("File downloaded to {:?}", output_path);
    } else {
        println!("Failed to download file: {:?}", response.status());
    }
}
