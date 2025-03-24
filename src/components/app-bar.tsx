import {
  DownloadIcon,
  Maximize,
  Minimize,
  Minus,
  SettingsIcon,
  X,
} from "lucide-react";
import { getAllWindows, getCurrentWindow } from "@tauri-apps/api/window";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { getSettings, Option, Setting } from "./settings";
import { Database } from "../global";
import { TrayIcon } from "@tauri-apps/api/tray";

const AppBar = ({
  setDownloadsOpen,
  setSettingsOpen,
  db,
}: {
  setDownloadsOpen: Dispatch<SetStateAction<boolean>>;
  setSettingsOpen: Dispatch<SetStateAction<boolean>>;
  db: Database | null;
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

  const minimize = async () => {
    const res: Setting[] = await getSettings(db!);

    const minimizeTr = Boolean(
      res.find((row) => row.option === Option.MINIMIZE_TRAY)?.value == "true"
    );
    if (minimizeTr) {
      appWindow.hide();
      return;
    }
    await appWindow.setFullscreen(false);
    appWindow.minimize();
  };

  const close = async () => {
    const res: Setting[] = await getSettings(db!);
    const closeTr = Boolean(
      res.find((row) => row.option === Option.CLOSE_TRAY)?.value == "true"
    );

    if (closeTr) {
      appWindow.hide();
      return;
    }
    const all = await getAllWindows();
    all.forEach((window) => window.destroy());
  };

  return (
    <div
      id="appbar"
      style={{ height: barHeight }}
      data-tauri-drag-region={true}>
      <div data-tauri-drag-region={true} className="title">
        {(window as any).config.icon && (
          <img
            data-tauri-drag-region={true}
            src={(window as any).config.icon}
          />
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
          <button onClick={minimize}>
            <Minus />
          </button>
          <button
            onClick={async () => {
              appWindow.setFullscreen(!(await appWindow.isFullscreen()));
              setIsMaximized((prev) => !prev);
            }}>
            {isMaximized ? <Minimize /> : <Maximize />}
          </button>

          <button onClick={close}>
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppBar;
