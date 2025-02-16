const closeBtnSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

const hideBtnSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus"><path d="M5 12h14"/></svg>`;

const minimizeBtnSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minimize-2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="21" y1="10" y2="3"/><line x1="3" x2="10" y1="21" y2="14"/></svg>`;

const maximizeBtnSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-maximize-2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>`;

const settingsBtnSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`;

const downloadBtnSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`;

const barHeight = 38;

document.addEventListener("DOMContentLoaded", () => {
  const tauri = window.__TAURI__;
  const appWindow = tauri.window.getCurrentWindow();

  const app_bar_html = `
    <div class="title"></div>
    <div class="buttons">
      <div class="window-controls">
        <button id="download-btn">${downloadBtnSvg}</button>
        <button id="settings-btn">${settingsBtnSvg}</button>
      </div>
      <div class="window-controls">
        <button id="hide-btn">${hideBtnSvg}</button>
        <button id="maximize-btn">${maximizeBtnSvg}</button>
        <button id="minimize-btn" style="display: none">${minimizeBtnSvg}</button>
        <button id="close-btn">${closeBtnSvg}</button>
      </div>
    </div>

  `;

  const css = `
    #appbar {
      height: ${barHeight}px;
      background: #fefefe;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 10px;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      user-select: none;
      z-index: 99999999;
    }

    #appbar .buttons {
      display: flex;
      gap: 40px;
    }

    #appbar .window-controls {
      display: flex;
      gap: 8px;
    }

    #appbar button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #appbar button:hover {
      background: #eaeaea;
    }

    #spacer {
      margin-bottom: ${barHeight}px;
    }
  `;

  // wrap the body content in a div
  const body_content = document.createElement("div");
  body_content.innerHTML = document.body.innerHTML;
  body_content.style.overflowY = "auto";
  body_content.style.height = "100%";

  document.body.innerHTML = body_content.outerHTML;
  document.body.style.overflow = "hidden";
  document.body.style.height = "100vh";

  const app_bar = document.createElement("div");
  app_bar.id = "appbar";
  app_bar.innerHTML = app_bar_html;
  app_bar.setAttribute("data-tauri-drag-region", "");
  document.body.prepend(app_bar);

  const spacer = document.createElement("div");
  spacer.id = "spacer";
  document.body.prepend(spacer);

  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);

  document.getElementById("hide-btn").addEventListener("click", () => {
    appWindow.minimize();
  });

  document.getElementById("maximize-btn").addEventListener("click", () => {
    appWindow.toggleMaximize();
    document.getElementById("maximize-btn").style.display = "none";
    document.getElementById("minimize-btn").style.display = "block";
  });

  document.getElementById("minimize-btn").addEventListener("click", () => {
    appWindow.toggleMaximize();
    document.getElementById("minimize-btn").style.display = "none";
    document.getElementById("maximize-btn").style.display = "block";
  });

  document.getElementById("close-btn").addEventListener("click", () => {
    appWindow.close();
  });

  document.addEventListener("scroll", () => {
    const elements = document.querySelectorAll("*");
    elements.forEach((element) => {
      if (element.id === "appbar") {
        return;
      }
      const computedStyle = window.getComputedStyle(element);
      const position = computedStyle.position;

      if (position === "fixed" || position === "sticky") {
        const currentTop = computedStyle.top;
        if (currentTop === "0px") {
          element.style.top = `${barHeight}px`;
        }
      }
    });
  });
});
