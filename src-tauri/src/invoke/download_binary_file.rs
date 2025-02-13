use std::fs::write;
use tauri::{command, AppHandle, Manager};

use crate::utils::check_file_or_append;

#[derive(serde::Deserialize)]
pub struct BinaryDownloadParams {
    filename: String,
    binary: Vec<u8>,
}

#[command]
pub fn download_binary_file(app: AppHandle, params: BinaryDownloadParams) {
    // Implement custom download logic here
    println!("Downloading file from {}", params.filename);
    let output_path = app.path().download_dir().unwrap().join(params.filename);
    let output_path = check_file_or_append(output_path.to_str().unwrap());
    let download_file_result = write(output_path.clone(), &params.binary);

    match download_file_result {
        Ok(_) => {
            println!("File downloaded to {:?}", output_path);
        }
        Err(e) => {
            println!("Failed to download file: {:?}", e);
        }
    }
}
