import {
  DownloadIcon,
  Maximize,
  Minimize,
  Minus,
  SettingsIcon,
  X,
} from "lucide-react";
import { getCurrentWindow, getAllWindows } from "@tauri-apps/api/window";
import { getCurrentWebview, getAllWebviews } from "@tauri-apps/api/webview";

import { Dispatch, SetStateAction, useEffect, useState } from "react";

const AppBar = ({
  setDownloadsOpen,
  setSettingsOpen,
}: {
  setDownloadsOpen: Dispatch<SetStateAction<boolean>>;
  setSettingsOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const appWindow = getCurrentWindow();
  const barHeight = 38;
  const [isMaximized, setIsMaximized] = useState(false);

  const checkMaximized = async () => {
    setIsMaximized(await appWindow.isMaximized());
  };

  useEffect(() => {
    checkMaximized();
    document.addEventListener("click", async (event) => {
      const downloadBtn = document.getElementById("download-btn")!;
      if (!downloadBtn.contains(event.target as Node)) {
        setDownloadsOpen(false);
      }

      const settingsBtn = document.getElementById("settings-btn")!;
      if (!settingsBtn.contains(event.target as Node)) {
        appWindow.emit("close_settings_window");
      }
    });
  }, []);

  return (
    <div
      id="appbar"
      style={{ height: barHeight }}
      data-tauri-drag-region={true}>
      <div className="title">
        {(window as any).config.icon && (
          <img src={(window as any).config.icon} />
        )}
        {(window as any).config.app_name}
      </div>
      <div className="buttons">
        <div className="window-controls">
          <div id="downloads-manager">
            <button
              id="download-btn"
              onClick={() => {
                setDownloadsOpen((prev) => !prev);
              }}>
              <DownloadIcon />
            </button>
          </div>
          <div id="settings-manager">
            <button
              id="settings-btn"
              onClick={() => {
                setSettingsOpen((prev) => !prev);
              }}>
              <SettingsIcon />
            </button>
          </div>
        </div>
        <div className="window-controls">
          <button onClick={() => appWindow.minimize()}>
            <Minus />
          </button>
          <button
            onClick={() => {
              appWindow.toggleMaximize();
              setIsMaximized((prev) => !prev);
            }}>
            {isMaximized ? <Minimize /> : <Maximize />}
          </button>

          <button onClick={() => appWindow.close()}>
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppBar;
