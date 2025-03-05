document.addEventListener("DOMContentLoaded", async () => {
  const tauri = window.__TAURI__;
  const invoke = tauri.core.invoke;
  const appWindow = tauri.window.getCurrentWindow();

  const license = await getLicense(invoke);

  let html = `
    <h4 style="text-align: center; margin: 1rem 0;">-- License --</h4>
    <p><span style="font-weight: bold">Status:<span> ${
      license.valid ? "🟢" : "🔴"
    }</p>
    <p><span style="font-weight: bold">Valid Until:<span> ${
      window.formatTimeStringToDate(license?.expiry) || "-"
    }</p>
    <div id="deactivateBtn">De-activate license</div>
  `;
  const parent = document.createElement("div");
  parent.innerHTML = html;

  setTimeout(() => {
    document.getElementById("settings-list")?.append(parent);
    document
      .getElementById("deactivateBtn")
      .addEventListener("click", async () => {
        await resetLicense(invoke);
        // console.log(await tauri.webview.getAllWebviews());
        const allWindows = await tauri.window.getAllWindows();
        const mainWindow = allWindows.find((w) => w.label == "main");
        mainWindow.show();
        appWindow.hide();
      });
  }, 1000);
});

function isKeygenError(error) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "detail" in error &&
    typeof error.code === "string" &&
    typeof error.detail === "string"
  );
}

class KeygenError extends Error {
  constructor({ code, detail }) {
    super(`Keygen Error: ${code}: ${detail}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "KeygenError";
    this.code = code;
    this.detail = detail;
  }
}

async function getLicense(invoke) {
  const res = await invoke("plugin:keygen|get_license");
  return res;
}

async function resetLicense(invoke) {
  try {
    return await invoke("plugin:keygen|reset_license");
  } catch (e) {
    if (isKeygenError(e)) {
      throw new KeygenError({ code: e.code, detail: e.detail });
    } else {
      throw new KeygenError({ code: "unknown", detail: getErrorMessage(e) });
    }
  }
}
