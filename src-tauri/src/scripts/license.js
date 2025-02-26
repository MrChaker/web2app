document.addEventListener("DOMContentLoaded", async () => {
  const tauri = window.__TAURI__;
  const invoke = tauri.core.invoke;
  const webview = tauri.window.getCurrentWindow();
  const db = await tauri.sql.load("sqlite:test.db").catch((err) => {
    console.error(err);
  });

  const deactivateBtn = document.createElement("button");
  deactivateBtn.innerHTML = "De-activate license";
  deactivateBtn.addEventListener("click", async () => {
    await resetLicense(invoke);
  });

  setTimeout(() => {
    document.getElementById("settings-window")?.append(deactivateBtn);
  }, 200);
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
