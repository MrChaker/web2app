const states = {
  starting: "starting",
  canceled: "canceled",
  in_progress: "in_progress",
  failed: "failed",
  finished: "finished",
};
Object.freeze(states);

document.addEventListener("DOMContentLoaded", async () => {
  const tauri = window.__TAURI__;
  const invoke = tauri.core.invoke;
  const webview = tauri.window.getCurrentWindow();

  const db = await tauri.sql
    .load("sqlite:test-encryption.db", window.config.db_key)
    .catch((err) => {
      console.error(err);
    });
  window.db = db;

  createDownloadsList();
  // when launching all download that were in progress before closing the app should now be canceled
  await cancel_all_downloads_in_progress_state(db);

  webview.listen("download-started", async (event) => {
    console.log(event.payload);

    document.getElementById("downloads-window").style.display = "block";
    let id = await addDownload(db, event.payload);
    dispatchUpdate();

    invoke("download_file", {
      // this starts the download
      params: {
        id: String(id),
        url: event.payload.url,
        output_path: event.payload.output_path,
      },
    });
  });

  webview.listen("download-progress", async (event) => {
    await updateDownload(db, { ...event.payload, state: states.in_progress });
    dispatchUpdate();
  });

  webview.listen("download-success", async (event) => {
    await updateDownload(db, {
      ...event.payload,
      state: states.finished,
    });
    dispatchUpdate();
  });

  webview.listen("download-failed", async (event) => {
    await updateDownload(db, {
      ...event.payload,
      state: states.failed,
    });
    dispatchUpdate();
  });

  // called whenever there is an update to db
  document.addEventListener("update-downloads", async (event) => {
    const downloads = await getDownloads(db);
    updateList(downloads);
  });

  // listen for click outside the download window to close it
  document.addEventListener("click", async (event) => {
    const downloadList = document.getElementById("downloads-window");
    const downloadBtn = document.getElementById("download-btn");

    if (
      !downloadList.contains(event.target) &&
      !downloadBtn.contains(event.target)
    ) {
      downloadList.style.display = "none";
    }
  });
});

// called whenever there is an update to db
const dispatchUpdate = () => {
  const updateEvent = new CustomEvent("update-downloads");
  document.dispatchEvent(updateEvent);
};
window.dispatchUpdate = dispatchUpdate;

const updateList = (data) => {
  const downloadList = document.getElementById("download-list");
  downloadList.innerHTML = "";
  data.forEach((download) => {
    downloadList.appendChild(createDownloadRow(download));
  });
};

// *** Elements ***
const createDownloadsList = async () => {
  const downloadList = document.createElement("div");
  downloadList.innerHTML = `
    <h3>Recent Downloads</h3>
    <div id="download-list"></div>
  `;
  downloadList.id = "downloads-window";

  let managerDiv = document.getElementById("downloads-manager");
  while (!managerDiv) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    managerDiv = document.getElementById("downloads-manager");
  }

  document.getElementById("downloads-manager").appendChild(downloadList);
  dispatchUpdate();
};

const downloadProgressAndSize = (download) => {
  const inProgress = download.state == states.in_progress;
  return `${
    inProgress ? `${window.formatFileSize(download.progress)} / ` : ""
  }${window.formatFileSize(download.file_size)}`;
};

const progressBar = (download) => {
  const progress = (download.progress / download.file_size) * 100;
  return `
    <div class="progress-bar">
      <div class="progress" style="width: ${progress}%"></div>
    </div>
  `;
};

const createDownloadRow = (download) => {
  const tauri = window.__TAURI__;
  const invoke = tauri.core.invoke;

  const inProgress = download.state == states.in_progress;
  const failed = download.state == states.failed;

  const actionsInnerHHTML = () => {
    switch (download.state) {
      case states.in_progress:
        return `
        <button id="cancel" data-id="${download.id}" >${window.icons.cancel}</button>
        `;
      case states.canceled:
        return `<p>Canceled</p>`;
      case states.failed:
        return "<p>Failed</p>";
      default:
        return `
        <button id="file-location" data-output-path="${download.output_path}" >${window.icons.folder}</button>
        `;
    }
  };
  const rowHtml = `
    <div class="${"file-row " + (failed ? "failed" : "")}">
      <div class="file-row-info">
        <div id="info" data-output-path="${download.output_path}">
          <div class="file-icon">${window.icons.file}</div>
          <div class="file-info">
            <h4>${download.file_name}</h4>
            <p>${downloadProgressAndSize(
              download
            )} • ${window.durationPastFromDate(download.created_at)} ago </p>
          </div>
        </div>
        <div class="actions">
          ${actionsInnerHHTML()}
        </div>
      </div>
      ${inProgress ? progressBar(download) : ""}
    </div>
  `;

  const downloadDiv = document.createElement("div");
  downloadDiv.innerHTML = rowHtml;

  downloadDiv.querySelector("#info")?.addEventListener("click", (event) => {
    const outputPath = event.currentTarget.getAttribute("data-output-path");

    if (download.state === states.finished)
      window.__TAURI__.shell.open(outputPath);
  });

  downloadDiv
    .querySelector("#file-location")
    ?.addEventListener("click", (event) => {
      const outputPath = event.currentTarget.getAttribute("data-output-path");
      window.__TAURI__.shell.open(window.getParentDirectory(outputPath));
    });

  downloadDiv
    .querySelector("#cancel")
    ?.addEventListener("click", async (event) => {
      invoke("cancel_download", { params: { id: String(download.id) } });
      await updateDownload(window.db, {
        id: download.id,
        state: states.canceled,
      });
      dispatchUpdate();
    });

  return downloadDiv;
};

// *** SQL Operations ***
const addDownload = async (database, payload) => {
  const result = await database.execute(
    "INSERT into downloads (file_name, file_size, url, output_path, progress, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    [
      payload.file_name,
      payload.file_size,
      payload.url,
      payload.output_path,
      0,
      new Date().toISOString(),
    ]
  );

  return result.lastInsertId;
};

const updateDownload = async (database, payload) => {
  let sqlString = "UPDATE downloads SET ";
  let payloadKeys = Object.keys(payload).filter((key) => key !== "id");
  payloadKeys.forEach((key, i) => {
    sqlString += `${key} = $${i + 1} `;
    if (i + 1 !== payloadKeys.length) {
      sqlString += ", ";
    }
  });
  sqlString += `WHERE id = $${payloadKeys.length + 1}`;
  const result = await database.execute(sqlString, [
    ...payloadKeys.map((key) => payload[key]),
    payload.id,
  ]);

  return result;
};

const getDownloads = async (database) => {
  const downloads = await database.select(
    "SELECT * FROM downloads ORDER BY created_at DESC"
  );
  return downloads;
};

const cancel_all_downloads_in_progress_state = async (database) => {
  const result = await database.execute(
    "UPDATE downloads SET state = $1 WHERE state = $2",
    [states.canceled, states.in_progress]
  );
  return result;
};
