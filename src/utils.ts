import { resetLicense } from "tauri-plugin-keygen-api";
import { Database } from "./global";
import { getAllWindows } from "@tauri-apps/api/window";
import { TrayIcon } from "@tauri-apps/api/tray";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { invoke } from "@tauri-apps/api/core";

export const durationPastFromDate = (date: string | number | Date): string => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(diff / 2592000000);

  if (months > 0) {
    return `${months} month${months > 1 ? "s" : ""}`;
  } else if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  } else {
    return `${seconds} second${seconds > 1 ? "s" : ""}`;
  }
};

export const formatTimeStringToDate = (
  time: string | number | Date
): string | undefined => {
  if (!time) return;
  const date = new Date(time);
  const formattedDate = `${date.getDate().toString().padStart(2, "0")}-${(
    date.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${date.getFullYear()}`;
  return formattedDate;
};

export const formatFileSize = (size: number): string => {
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1048576) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else if (size < 1073741824) {
    return `${(size / 1048576).toFixed(2)} MB`;
  } else {
    return `${(size / 1073741824).toFixed(2)} GB`;
  }
};

export function getParentDirectory(path: string): string {
  let normalizedPath = path.replace(/\\/g, "/");

  normalizedPath = normalizedPath.replace(/\/+$/, "");

  let splits = normalizedPath.split("/");

  splits.pop();

  let parentPath = splits.join("/");
  if (navigator.platform.includes("Win")) {
    parentPath = parentPath.replace(/\//g, "\\");
  }

  return parentPath;
}

const keygenId = async () =>
  await invoke("get_env", { name: "KEYGEN_ACCOUNT_ID" });

export const getLicenseMachine = async (id: string, key: string) => {
  // get machine
  const res = await fetch(
    `https://api.keygen.sh/v1/accounts/${await keygenId()}/licenses/${id}/machines`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        Authorization: `License ${key}`,
      },
    }
  );
  const { data: machines } = await res.json();
  return machines?.[0]?.id;
};

export const deactivateMachine = async (
  id: string,
  key: string,
  machineId: string | null | undefined = undefined
) => {
  // get machine
  machineId = machineId || (await getLicenseMachine(id, key));

  const deleteRes = await fetch(
    `https://api.keygen.sh/v1/accounts/${await keygenId()}/machines/${machineId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        Authorization: `License ${key}`,
      },
    }
  );
  return deleteRes;
};

export const pingHeartbeat = async (
  id: string,
  key: string,
  machineId: string | null | undefined = undefined
) => {
  // get machine
  machineId = machineId || (await getLicenseMachine(id, key));

  return await fetch(
    `https://api.keygen.sh/v1/accounts/${await keygenId()}/machines/${machineId}/actions/ping`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        Authorization: `License ${key}`,
      },
    }
  );
};

export const showLicenseFrom = async (db: Database | null) => {
  await resetLicense();
  await deleteLicenseKey(db);
  const allWindows = await getAllWindows();
  const mainWindow = allWindows.find((w) => w.label == "main");
  const appWindow = allWindows.find((w) => w.label == "container");

  const trayIcon = await TrayIcon.getById("tray");
  trayIcon?.setVisible(false);

  mainWindow?.show();
  appWindow?.hide();
};

const deleteLicenseKey = async (db: Database | null): Promise<void> => {
  if (db) await db.execute("DELETE FROM license_key");
};

export const onMacOnWindows = (mac: any, windows: any) => {
  if (navigator.platform.includes("Mac")) {
    return mac;
  } else {
    return windows;
  }
};

export const updater = async () => {
  const update = await check({
    headers: {
      Authorization:
        "Bearer prod-d59bec7f5bd44da80bbdfedafddb55a219b240f371afbc2ed31a757c5e5834f0v3",
    },
  });
  if (update) {
    const install = await confirm(
      "Found new version " + update.version + "\nDo you want to install ?"
    );
    if (install) {
      let downloaded = 0;
      let contentLength = 0;
      // alternatively we could also call update.download() and update.install() separately
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength || 0;
            console.log(
              `started downloading ${event.data.contentLength} bytes`
            );
            alert(
              `Downloading new version ${formatFileSize(
                contentLength
              )} \nPlease wait ...`
            );
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            console.log(`downloaded ${downloaded} from ${contentLength}`);
            break;
          case "Finished":
            console.log("download finished");
            break;
        }
      });

      console.log("update installed");
      await relaunch();
    }
  }
};
