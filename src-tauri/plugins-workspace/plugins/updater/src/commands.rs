// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

use crate::{Result, Update, UpdaterExt};

use serde::Serialize;
use tauri::{ipc::Channel, Manager, Resource, ResourceId, Runtime, Webview};

use std::time::Duration;
use url::Url;

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "event", content = "data")]
pub enum DownloadEvent {
    #[serde(rename_all = "camelCase")]
    Started {
        content_length: Option<u64>,
    },
    #[serde(rename_all = "camelCase")]
    Progress {
        chunk_length: usize,
    },
    Finished,
}

#[derive(Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Metadata {
    rid: Option<ResourceId>,
    available: bool,
    current_version: String,
    version: String,
    date: Option<String>,
    body: Option<String>,
}

struct DownloadedBytes(pub Vec<u8>);
impl Resource for DownloadedBytes {}

#[tauri::command]
pub(crate) async fn check<R: Runtime>(
    webview: Webview<R>,
    headers: Option<Vec<(String, String)>>,
    timeout: Option<u64>,
    proxy: Option<String>,
    target: Option<String>,
) -> Result<Metadata> {
    let mut builder = webview.updater_builder();
    if let Some(headers) = headers {
        for (k, v) in headers {
            builder = builder.header(k, v)?;
        }
    }
    if let Some(timeout) = timeout {
        builder = builder.timeout(Duration::from_secs(timeout));
    }
    if let Some(ref proxy) = proxy {
        let url = Url::parse(proxy.as_str())?;
        builder = builder.proxy(url);
    }
    if let Some(target) = target {
        builder = builder.target(target);
    }

    let updater = builder.build()?;
    let update = updater.check().await?;
    let mut metadata = Metadata::default();
    if let Some(update) = update {
        metadata.available = true;
        metadata.current_version.clone_from(&update.current_version);
        metadata.version.clone_from(&update.version);
        metadata.date = update.date.map(|d| d.to_string());
        metadata.body.clone_from(&update.body);
        metadata.rid = Some(webview.resources_table().add(update));
    }

    Ok(metadata)
}

#[tauri::command]
pub(crate) async fn download<R: Runtime>(
    webview: Webview<R>,
    rid: ResourceId,
    on_event: Channel<DownloadEvent>,
) -> Result<ResourceId> {
    let update = webview.resources_table().get::<Update>(rid)?;
    let mut first_chunk = true;
    let bytes = update
        .download(
            |chunk_length, content_length| {
                if first_chunk {
                    first_chunk = !first_chunk;
                    let _ = on_event.send(DownloadEvent::Started { content_length });
                }
                let _ = on_event.send(DownloadEvent::Progress { chunk_length });
            },
            || {
                let _ = on_event.send(DownloadEvent::Finished);
            },
        )
        .await?;
    Ok(webview.resources_table().add(DownloadedBytes(bytes)))
}

#[tauri::command]
pub(crate) async fn install<R: Runtime>(
    webview: Webview<R>,
    update_rid: ResourceId,
    bytes_rid: ResourceId,
) -> Result<()> {
    let update = webview.resources_table().get::<Update>(update_rid)?;
    let bytes = webview
        .resources_table()
        .get::<DownloadedBytes>(bytes_rid)?;
    update.install(&bytes.0)?;
    let _ = webview.resources_table().close(bytes_rid);
    Ok(())
}

#[tauri::command]
pub(crate) async fn download_and_install<R: Runtime>(
    webview: Webview<R>,
    rid: ResourceId,
    on_event: Channel<DownloadEvent>,
) -> Result<()> {
    let update = webview.resources_table().get::<Update>(rid)?;

    let mut first_chunk = true;

    update
        .download_and_install(
            |chunk_length, content_length| {
                if first_chunk {
                    first_chunk = !first_chunk;
                    let _ = on_event.send(DownloadEvent::Started { content_length });
                }
                let _ = on_event.send(DownloadEvent::Progress { chunk_length });
            },
            || {
                let _ = on_event.send(DownloadEvent::Finished);
            },
        )
        .await?;

    Ok(())
}
