import "./App.css";
import AppBar from "./components/app-bar";
import License from "./components/license";
import DownloadsManager from "./components/downloads";
import { getAllWebviews, getCurrentWebview } from "@tauri-apps/api/webview";
import { useEffect, useState } from "react";
import Settings from "./components/settings";

function App() {
  const webview = getCurrentWebview();

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

  useEffect(() => {
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
    return <License />;
  } else if (webview.label === "downloads") {
    document.body.style.maxHeight = "501px";
    document.body.style.overflow = "hidden";

    return <DownloadsManager setOpen={setDownloadsOpen} />;
  } else if (webview.label === "settings") {
    document.body.style.maxHeight = "300px";
    document.body.style.overflow = "hidden";

    return <Settings setOpen={setSettingsOpen} />;
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
