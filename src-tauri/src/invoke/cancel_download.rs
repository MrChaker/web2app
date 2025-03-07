use crate::AppState;
use serde::Deserialize;
use std::sync::Mutex;
use tauri::{command, AppHandle, Manager};

#[derive(Deserialize)]
pub struct Params {
    id: String,
}

#[command]
pub async fn cancel_download(app: AppHandle, params: Params) {
    let state = app.state::<Mutex<AppState>>();

    // Lock the mutex to get mutable access:
    let mut state = state.lock();
    if let Ok(ref mut state) = state {
        state.canceled_downloads.push(params.id);
    }
}
