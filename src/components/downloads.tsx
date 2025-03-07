import React, {
  useState,
  useEffect,
  useRef,
  Dispatch,
  SetStateAction,
} from "react";
import { getCurrentWindow, getAllWindows } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
// import Database from "@tauri-apps/plugin-sql";
import {
  durationPastFromDate,
  formatFileSize,
  getParentDirectory,
} from "../utils";
import { CircleXIcon, FileIcon, FolderIcon } from "lucide-react";
import * as shell from "@tauri-apps/plugin-shell";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { UnlistenFn } from "@tauri-apps/api/event";

enum State {
  starting = "starting",
  canceled = "canceled",
  in_progress = "in_progress",
  failed = "failed",
  finished = "finished",
}

type DownloadType = {
  id: string;
  file_name: string;
  file_size: number;
  progress: number;
  output_path: string;
  url: string;
  state: State;
  created_at: string;
};

interface Database {
  load: (url: string, key: string) => Promise<Database>;
  execute: (query: string, params?: any[]) => Promise<{ lastInsertId: number }>;
  select: (query: string) => Promise<any>;
}

const DownloadsManager = ({
  setOpen,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const [downloads, setDownloads] = useState<DownloadType[]>([]);

  const webview = getCurrentWebview();
  const windowRef = useRef<HTMLDivElement | null>(null);
  const sql: Database = (window as any).__TAURI__.sql;
  const dbRef = useRef<Database | null>(null);

  const listenForOutSideClick = async () => {
    const unlisten = webview.listen("outside-click", () => {
      if (!(window as any).listening) {
        (window as any).listening = true;
        return;
      }
      setOpen(false);
    });
    return unlisten;
  };

  useEffect(() => {
    const unlisten = listenForOutSideClick();
    (window as any).listening = true;

    return () => {
      const un = async () => {
        await unlisten;
      };
      un();
    };
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        const db = await sql.load(
          "sqlite:test-encryption.db",
          (window as any).config.db_key
        );

        dbRef.current = db;
        await cancelAllDownloadsInProgress(db);
        loadDownloads(db);
      } catch (err) {
        console.error(err);
      }
    };

    initialize();

    const listeners = [
      webview.listen("show_download_window", () => {
        setOpen(true);
      }),
      webview.listen("download-started", handleDownloadStarted),
      webview.listen("download-progress", handleDownloadProgress),
      webview.listen("download-success", handleDownloadSuccess),
      webview.listen("download-failed", handleDownloadFailed),
      webview.listen("close_download_window", () => setOpen(false)),
    ];

    // Click outside handler
    const handleClickOutside = (event: any) => {
      if (windowRef.current && !windowRef.current.contains(event.target)) {
        // setOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);

    return () => {
      listeners.forEach(async (unlisten) => await unlisten);
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const loadDownloads = async (db: Database) => {
    const downloads = await getDownloads(db);
    setDownloads(downloads);
  };

  const handleDownloadStarted = async (event: any) => {
    setOpen(true);

    const id = await addDownload(dbRef.current!, event.payload);
    await loadDownloads(dbRef.current!);
    invoke("download_file", {
      params: {
        id: String(id),
        url: event.payload.url,
        output_path: event.payload.output_path,
      },
    });
  };

  const handleDownloadProgress = async (event: any) => {
    await updateDownload(dbRef.current!, {
      ...event.payload,
      state: State.in_progress,
    });
    loadDownloads(dbRef.current!);
  };

  const handleDownloadSuccess = async (event: any) => {
    await updateDownload(dbRef.current!, {
      ...event.payload,
      state: State.finished,
    });
    loadDownloads(dbRef.current!);
  };

  const handleDownloadFailed = async (event: any) => {
    await updateDownload(dbRef.current!, {
      ...event.payload,
      state: State.failed,
    });
    loadDownloads(dbRef.current!);
  };

  return (
    <div
      id="downloads-window"
      onMouseDown={() => ((window as any).listening = false)}
      ref={windowRef}>
      <h3>
        Recent Downloads{" "}
        <CircleXIcon
          onClick={() => {
            setOpen(false);
          }}
        />
      </h3>
      <div id="download-list">
        {downloads.map((download) => (
          <DownloadRow
            key={download.id}
            download={download}
            db={dbRef.current}
          />
        ))}
      </div>
    </div>
  );
};

const DownloadRow = ({
  download,
  db,
}: {
  download: DownloadType;
  db: Database | null;
}) => {
  const handleOpenFile = () => {
    if (download.state === State.finished) {
      shell.open(download.output_path);
    }
  };

  const handleOpenFolder = () => {
    const parentDir = getParentDirectory(download.output_path);
    shell.open(parentDir);
  };

  const handleCancel = async () => {
    await invoke("cancel_download", {
      params: { id: String(download.id) },
    });
    await updateDownload(db!, { id: download.id, state: State.canceled });
    // window.dispatchUpdate();
  };

  const inProgress = download.state === State.in_progress;
  const failed = download.state === State.failed;

  return (
    <div className={`file-row ${failed ? "failed" : ""}`}>
      <div className="file-row-info">
        <div
          id="info"
          onClick={handleOpenFile}
          data-output-path={download.output_path}>
          <div className="file-icon">
            <FileIcon />
          </div>
          <div id="file-info">
            <h4>{download.file_name}</h4>
            <p>
              {downloadProgressAndSize(download)} •{" "}
              {durationPastFromDate(download.created_at)} ago
            </p>
          </div>
        </div>
        <div className="actions">{renderActions()}</div>
      </div>
      {inProgress && (
        <ProgressBar progress={download.progress / download.file_size} />
      )}
    </div>
  );

  function renderActions() {
    switch (download.state) {
      case State.in_progress:
        return (
          <button onClick={handleCancel}>
            <CircleXIcon />
          </button>
        );
      case State.canceled:
        return <p>Canceled</p>;
      case State.failed:
        return <p>Failed</p>;
      default:
        return (
          <button onClick={handleOpenFolder}>
            <FolderIcon />
          </button>
        );
    }
  }
};

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="progress-bar">
    <div className="progress" style={{ width: `${progress * 100}%` }} />
  </div>
);

// Helper functions remain mostly the same
const downloadProgressAndSize = (download: DownloadType) => {
  const inProgress = download.state === State.in_progress;
  return `${
    inProgress ? `${formatFileSize(download.progress)} / ` : ""
  }${formatFileSize(download.file_size)}`;
};

// SQL operations remain the same as original
const addDownload = async (
  db: Database,
  payload: DownloadType
): Promise<number> => {
  let res = await db.execute(
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
  return res.lastInsertId;
};
const updateDownload = async (
  db: Database,
  payload: Partial<DownloadType>
): Promise<void> => {
  let sqlString = "UPDATE downloads SET ";
  let payloadKeys = Object.keys(payload).filter((key) => key !== "id");
  payloadKeys.forEach((key, i) => {
    sqlString += `${key} = $${i + 1} `;
    if (i + 1 !== payloadKeys.length) {
      sqlString += ", ";
    }
  });
  sqlString += `WHERE id = $${payloadKeys.length + 1}`;
  await db.execute(sqlString, [
    ...payloadKeys.map((key) => payload[key as keyof DownloadType]),
    payload.id,
  ]);
};
const getDownloads = async (db: Database): Promise<DownloadType[]> => {
  const downloads: DownloadType[] = await db.select(
    "SELECT * FROM downloads ORDER BY created_at DESC"
  );
  return downloads;
};
const cancelAllDownloadsInProgress = async (db: Database): Promise<void> => {
  await db.execute("UPDATE downloads SET state = $1 WHERE state = $2", [
    State.canceled,
    State.in_progress,
  ]);
};

export default DownloadsManager;
