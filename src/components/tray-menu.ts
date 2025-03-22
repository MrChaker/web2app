import { defaultWindowIcon } from "@tauri-apps/api/app";
import { Menu } from "@tauri-apps/api/menu";
import { TrayIcon } from "@tauri-apps/api/tray";
import { getAllWindows, getCurrentWindow } from "@tauri-apps/api/window";

export const setUpTray = async (
  showCloseBtn: boolean,
  showMinimizeBtn: boolean,
  trayIcon: TrayIcon | null = null
) => {
  const window = getCurrentWindow();
  if (window.label == "main") return;

  const items = [];
  if (showCloseBtn)
    items.push({
      id: "close",
      text: "Close",
      action: async () => {
        const all = await getAllWindows();
        all.forEach((window) => window.destroy());
      },
    });
  if (showMinimizeBtn) {
    items.push({
      id: "minimize",
      text: "Minimize",
      action: () => {
        window.hide();
      },
    });
    items.push({
      id: "show",
      text: "Show",
      action: () => {
        window.show();
      },
    });
  }

  if (trayIcon) {
    trayIcon.setMenu(await Menu.new({ items }));
    return trayIcon;
  }
  return await TrayIcon.new({
    id: "app-tray",
    menu: await Menu.new({ items }),
    icon: (await defaultWindowIcon()) || undefined,
  });
};
