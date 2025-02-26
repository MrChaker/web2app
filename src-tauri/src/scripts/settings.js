document.addEventListener("DOMContentLoaded", async () => {
  const tauri = window.__TAURI__;
  const invoke = tauri.core.invoke;
  const webview = tauri.window.getCurrentWindow();
  const db = await tauri.sql.load("sqlite:test.db").catch((err) => {
    console.error(err);
  });
  window.db = db;
  createSettingsWindow();
  console.log(tauri);

  // listen for outside click
  document.addEventListener("click", async (event) => {
    const settingsList = document.getElementById("settings-window");
    const settingsBtn = document.getElementById("settings-btn");

    if (
      !settingsList.contains(event.target) &&
      !settingsBtn.contains(event.target)
    ) {
      settingsList.style.display = "none";
    }
  });
});

// *** Elements ***
const createSettingsWindow = async () => {
  const downloadList = document.createElement("div");
  downloadList.innerHTML = `
    <h3>Settings</h3>
    <div id="settings-list"></div>
  `;
  downloadList.id = "settings-window";

  let managerDiv = document.getElementById("settings-manager");
  while (!managerDiv) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    managerDiv = document.getElementById("settings-manager");
  }

  document.getElementById("settings-manager").appendChild(downloadList);
};
