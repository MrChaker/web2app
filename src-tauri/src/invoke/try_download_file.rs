use std::{
    fs::{write, File},
    io::{copy, Write},
    str::FromStr,
};
use tauri::{command, http::Method, AppHandle, Manager, Url};
use tauri_plugin_http::reqwest::{ClientBuilder, Request};

use crate::utils::{check_file_or_append, get_filename_from_url, is_file};

#[derive(serde::Deserialize)]
pub struct DownloadFileParams {
    url: String,
}

#[command]
pub async fn try_download_file(app: AppHandle, params: DownloadFileParams) {
    // check if link responds with a file url
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
            println!("Failed to call url: {:?}", e);
            return;
        }
    };

    if !response.status().is_success() {
        println!("Failed to download file: {:?}", response.status());
        return;
    }

    if !is_file(
        response
            .headers()
            .get("content-type")
            .unwrap()
            .to_str()
            .unwrap_or("")
            .to_string(),
    ) {
        println!("Url did not respond with a file");
        return;
    }

    let output_path = app
        .path()
        .download_dir()
        .unwrap()
        .join(get_filename_from_url(response.url().to_string()));
    let output_path = check_file_or_append(output_path.to_str().unwrap());

    let mut file = File::create(output_path.clone()).unwrap();
    // let bytes = response.bytes().await.unwrap();

    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;

    while let Some(chunk) = response.chunk().await.unwrap() {
        downloaded += chunk.len() as u64;
        file.write_all(&chunk).unwrap();
        println!("Downloaded {} of {} bytes", downloaded, total_size);
    }

    println!("File downloaded to {:?}", output_path);
}
