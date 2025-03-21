import "./App.css";
import AppBar from "./components/app-bar";
import License, { getLicenseKey } from "./components/license";
import DownloadsManager from "./components/downloads";
import { getAllWebviews, getCurrentWebview } from "@tauri-apps/api/webview";
import { useEffect, useState } from "react";
import Settings from "./components/settings";
import {
  getCurrentWindow,
  PhysicalPosition,
  PhysicalSize,
} from "@tauri-apps/api/window";
import { validateKey } from "tauri-plugin-keygen-api";
import {
  deactivateMachine,
  getLicenseMachine,
  onMacOnWindows,
  showLicenseFrom,
  updater,
} from "./utils";
import { Database } from "./global";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const webview = getCurrentWebview();

  const sql: Database = (window as any).__TAURI__.sql;

  const appWindow = getCurrentWindow();
  const [db, setDb] = useState<Database | null>(null);

  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const getWebview = async (label: string) => {
    const webviews = await getAllWebviews();
    return webviews.find((w) => w.label === label);
  };

  const toggleDownloadOpen = async () => {
    const downloadWebview = await getWebview("downloads");
    if (downloadsOpen) {
      downloadWebview?.show();
    } else {
      downloadWebview?.hide();
    }
    webview.emit("download_toggled", downloadsOpen);
  };

  const toggleSettingsOpen = async () => {
    const settingWebview = await getWebview("settings");
    if (settingsOpen) {
      settingWebview?.show();
    } else {
      settingWebview?.hide();
    }
    webview.emit("settings_toggled", settingsOpen);
  };

  const checkLicense = async (db: Database) => {
    if (webview.label === "container") {
      let license = await validateKey({
        key: await getLicenseKey(db!),
      });
      let expired = license?.expiry && new Date(license?.expiry) <= new Date();
      let machineId =
        license && (await getLicenseMachine((license as any).id, license.key));

      if (!license?.valid || expired || !machineId) {
        await deactivateMachine(
          (license as any).id,
          license?.key!,
          machineId
        ).then(async () => {
          showLicenseFrom(db);
        });
      }
    }
  };
  const initializeDb = async () => {
    try {
      const _path = await invoke<string>("plugin:sql|load_with_options", {
        params: {
          db: "sqlite:test-encryption.db",
          encryption_key: await invoke("get_env", { name: "DATABASE_KEY" }),
        },
      });

      setDb(new (sql as any)(_path));
      return db;
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    initializeDb().then((db) => {
      checkLicense(db!);
    });

    if (appWindow.label === "container") {
      appWindow.onResized(async ({ payload: size }) => {
        let pos = await webview.position();
        if (webview.label === "downloads") {
          webview.setPosition(
            new PhysicalPosition(size.width - onMacOnWindows(1000, 650), pos.y)
          );
        }
        if (webview.label === "settings") {
          webview.setPosition(
            new PhysicalPosition(size.width - onMacOnWindows(600, 250), pos.y)
          );
        }

        if (webview.label === "app_bar") {
          let appBarSize = await webview.size();
          webview.setSize(new PhysicalSize(size.width, appBarSize.height));
        }
      });
    }

    setTimeout(async () => {
      if (!(await appWindow.isVisible())) return;
      if (webview.label !== "main" && webview.label !== "app_bar") return;
      // run only on opened window . if container is opened run only on app_bar
      updater();
    }, 2000);

    const unlisteners = [
      webview.listen("download_toggled", (event) => {
        setDownloadsOpen(event.payload as boolean);
      }),
      webview.listen("settings_toggled", (event) => {
        setSettingsOpen(event.payload as boolean);
      }),
    ];

    return () => {
      unlisteners.forEach(async (un) => await un);
    };
  }, []);

  useEffect(() => {
    toggleDownloadOpen();
  }, [downloadsOpen]);

  useEffect(() => {
    toggleSettingsOpen();
  }, [settingsOpen]);

  if (webview.label === "main") {
    return <License db={db} />;
  } else if (webview.label === "downloads") {
    document.body.style.maxHeight = "501px";
    document.body.style.overflow = "hidden";

    return <DownloadsManager db={db} setOpen={setDownloadsOpen} />;
  } else if (webview.label === "settings") {
    document.body.style.maxHeight = "320px";
    document.body.style.overflow = "hidden";

    return <Settings db={db} setOpen={setSettingsOpen} />;
  } else if (webview.label === "app_bar") {
    return (
      <AppBar
        setDownloadsOpen={setDownloadsOpen}
        setSettingsOpen={setSettingsOpen}
      />
    );
  }
}

export default App;
