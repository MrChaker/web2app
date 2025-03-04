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
    appWindow.onResized(async ({ payload: size }) => {
      const pos = await appWindow.innerPosition();
      // update app window
      const windows = await getAllWindows();
      const app_window = windows.find((w) => w.label == "app");

      app_window?.setPosition(
        new PhysicalPosition(pos.x, pos.y + barHeightPhysical)
      );
      app_window?.setSize(
        new PhysicalSize(size.width, size.height - barHeightPhysical)
      );
    });

    appWindow.onMoved(async ({ payload: position }) => {
      const windows = await getAllWindows();
      const app_window = windows.find((w) => w.label == "app");

      app_window?.setPosition(
        new PhysicalPosition(position.x, position.y + barHeightPhysical)
      );
    });

    document.addEventListener("click", async (event) => {
      const downloadBtn = document.getElementById("download-btn")!;
      if (!downloadBtn.contains(event.target as Node)) {
        appWindow.emitTo("app", "close_download_window");
      }
    });
  }, []);

  return (
    <div
      id="appbar"
      style={{ height: barHeight }}
      data-tauri-drag-region={true}
    >
      <div className="title"></div>
      <div className="buttons">
        <div className="window-controls">
          <div id="downloads-manager">
            <button
              id="download-btn"
              onClick={() => {
                appWindow
                  .emitTo("app", "show_download_window")
                  .then(() => console.log("done"))
                  .catch((err) => console.log(err));
              }}
            >
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
            }}
          >
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
