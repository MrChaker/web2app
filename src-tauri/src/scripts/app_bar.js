const barHeight = 38;

document.addEventListener("DOMContentLoaded", () => {
  const tauri = window.__TAURI__;
  const appWindow = tauri.window.getCurrentWindow();

  function create_app_bar() {
    const app_bar_html = `
    <div class="title"></div>
    <div class="buttons">
      <div class="window-controls">
        <div id="downloads-manager">
          <button id="download-btn">${window.icons.download}</button>
        </div>
        <button id="settings-btn">${window.icons.settings}</button>
      </div>
      <div class="window-controls">
        <button id="hide-btn">${window.icons.hide}</button>
        <button id="maximize-btn">${window.icons.maximize}</button>
        <button id="minimize-btn" style="display: none">${window.icons.minimize}</button>
        <button id="close-btn">${window.icons.close}</button>
      </div>
    </div>

  `;

    // wrap the body content in a div
    // const body_content = document.createElement("div");
    // body_content.innerHTML = document.body.innerHTML;
    // body_content.style.overflowY = "auto";
    // body_content.style.height = `calc(100vh - ${barHeight}px)`;
    // body_content.style.position = `relative`;

    // document.body.innerHTML = body_content.outerHTML;
    // document.body.style.overflow = "hidden";

    const app_bar = document.createElement("div");
    app_bar.id = "appbar";
    app_bar.innerHTML = app_bar_html;
    app_bar.style.height = `${barHeight}px`;
    app_bar.setAttribute("data-tauri-drag-region", "");
    document.body.prepend(app_bar);

    // const spacer = document.createElement("div");
    // spacer.id = "spacer";
    // spacer.style.marginBottom = `${barHeight}px`;

    // document.body.prepend(spacer);

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

    document.getElementById("download-btn").addEventListener("click", () => {
      const display = document.getElementById("downloads-window").style.display;
      document.getElementById("downloads-window").style.display =
        display === "block" ? "none" : "block";
      window.dispatchUpdate();
    });

    document.getElementById("close-btn").addEventListener("click", () => {
      appWindow.close();
    });

    function changeFixedElements() {
      const elements = document.querySelectorAll("*");
      elements.forEach((element) => {
        if (element.id === "appbar") {
          return;
        }
        const computedStyle = window.getComputedStyle(element);
        const position = computedStyle.position;

        if (position === "fixed" || position === "sticky") {
          const currentTop = parseFloat(computedStyle.top) || 0;
          element.style.top = `${currentTop + barHeight}px !important`;
        }
      });
    }

    changeFixedElements();
    document.addEventListener("wheel", changeFixedElements);

    setInterval(() => {
      // make sure body overflow is hidden
      document.body.style.overflow = "hidden";
      changeFixedElements();
    }, 200);
  }

  setTimeout(() => {
    create_app_bar();
  }, 100);
});
