document.addEventListener("DOMContentLoaded", async () => {
  const webviews = await window.__TAURI__.webview.getAllWebviews();
  const webview = await window.__TAURI__.webview.getCurrentWebview();

  document.addEventListener("mouseup", () => {
    console.log("clicked");
    webview.emit("outside-click");
    // webviews.find((w) => w.label === "downloads")?.hide();
    // webviews.find((w) => w.label === "settings")?.hide();
  });
});
