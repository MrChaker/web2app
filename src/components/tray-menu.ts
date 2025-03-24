import { defaultWindowIcon } from "@tauri-apps/api/app";
import { Menu } from "@tauri-apps/api/menu";
import { TrayIcon } from "@tauri-apps/api/tray";
import { getAllWindows, getCurrentWindow } from "@tauri-apps/api/window";

export const setUpTray = async () => {
  const window = getCurrentWindow();
  if (window.label == "main") return;

  const items = [
    {
      id: "close",
      text: "Close",
      action: async () => {
        const all = await getAllWindows();
        all.forEach((window) => window.destroy());
      },
    },
    {
      id: "minimize",
      text: "Minimize",
      action: () => {
        window.hide();
      },
    },
    {
      id: "show",
      text: "Show",
      action: () => {
        window.show();
      },
    },
  ];

  return await TrayIcon.new({
    id: "tray",
    menu: await Menu.new({ items }),
    icon: (await defaultWindowIcon()) || undefined,
  });
};
