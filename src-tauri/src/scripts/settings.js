document.addEventListener("DOMContentLoaded", async () => {
  const tauri = window.__TAURI__;
  const invoke = tauri.core.invoke;
  const webview = tauri.window.getCurrentWindow();
  const db = await tauri.sql
    .load("sqlite:test-encryption.db", window.config.db_key)
    .catch((err) => {
      console.error(err);
    });

  window.db = db;
  createSettingsWindow();

  webview.listen("show_settings_window", async (event) => {
    document.getElementById("settings-window").style.display = "block";
    document.body.style.position = "relative";
  });

  webview.listen("close_settings_window", async (event) => {
    if (document.getElementById("settingss-window")) {
      document.getElementById("settingss-window").style.display = "none";
    }
  });

  // listen for outside click
  document.addEventListener("click", async (event) => {
    const settingsList = document.getElementById("settings-window");

    if (!settingsList.contains(event.target)) {
      settingsList.style.display = "none";
    }
  });
});

// *** Elements ***
const createSettingsWindow = async () => {
  const settingsWindow = document.createElement("div");
  settingsWindow.innerHTML = `
    <h3>Settings</h3>
    <div id="settings-list"></div>
  `;
  settingsWindow.id = "settings-window";

  document.body.appendChild(settingsWindow);
};
