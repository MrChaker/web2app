import {
  DownloadIcon,
  Maximize,
  Minimize,
  Minus,
  Settings,
  X,
} from "lucide-react";
import "./app-bar.css";
import {
  getCurrentWindow,
  getAllWindows,
  PhysicalPosition,
  PhysicalSize,
} from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getAllWebviews } from "@tauri-apps/api/webview";

const AppBar = () => {
  const appWindow = getCurrentWindow();
  const barHeight = 38;
  const barHeightPhysical = navigator.platform.toLowerCase().includes("win")
    ? barHeight + 8
    : barHeight * 2;
  const [isMaximized, setIsMaximized] = useState(false);

  const checkMaximized = async () => {
    setIsMaximized(await appWindow.isMaximized());
  };

  useEffect(() => {
    checkMaximized();
    document.addEventListener("click", async (event) => {
      const downloadBtn = document.getElementById("download-btn")!;
      if (!downloadBtn.contains(event.target as Node)) {
        appWindow.emit("close_download_window");
      }
    });
  }, []);

  return (
    <div
      id="appbar"
      style={{ height: barHeight }}
      data-tauri-drag-region={true}>
      <div className="title"></div>
      <div className="buttons">
        <div className="window-controls">
          <div id="downloads-manager">
            <button
              id="download-btn"
              onClick={() => {
                appWindow.emit("show_download_window");
              }}>
              <DownloadIcon />
            </button>
          </div>
          <button id="settings-btn">
            <Settings />
          </button>
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
