use crate::utils::{check_file_or_append, get_filename_from_url};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{Emitter, Manager, Url, Webview};

pub struct DownloadService {
    webveiw: Webview,
}

#[derive(Deserialize, Serialize, Clone)]
struct DownloadPayload {
    url: String,
    output_path: String,
    file_name: String,
    file_size: u64,
    progress: u64,
}

#[derive(Deserialize, Serialize, Clone)]
struct DownloadProgressPayload {
    id: String,
    file_size: u64,
    progress: u64,
}

impl DownloadService {
    pub fn new(webveiw: Webview) -> Self {
        Self { webveiw }
    }

    fn download_path(&self) -> PathBuf {
        self.webveiw.path().download_dir().unwrap()
    }

    pub async fn on_download(&self, url: Url) -> () {
        let output_path = self
            .download_path()
            .join(get_filename_from_url(url.to_string()));
        let output_path = check_file_or_append(output_path.to_str().unwrap());

        println!("Download started: {} to {}", url, output_path.as_str());
        let _ = self.webveiw.emit(
            "download-started",
            DownloadPayload {
                url: url.to_string(),
                output_path: output_path.clone(),
                file_name: get_filename_from_url(output_path),
                file_size: 0,
                progress: 0,
            },
        );
        ()
    }
}
