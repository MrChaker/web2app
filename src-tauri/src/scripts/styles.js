const css = `

     #downloads-window {
      position: fixed;
      top: 0;
      right: 0;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
      border-radius: 1rem;
      padding: 1rem 0;
      display: none;
      background-color: white;
      font-size: 0.8rem;
      color: rgb(80, 80, 80);
    }

    #downloads-window h3 {
      padding: 0 1.5rem 1rem;
      margin: 0;
      border-bottom: 1px solid rgb(232, 232, 232);

    }

    #download-list {
      max-height: 328px;
      overflow-y: auto;
    }

    .file-row {
      padding: 1rem 1.5rem;
      cursor: default;
    }
    .failed {
      background-color: rgba(255, 0, 0, 0.2);
    }

    .file-row-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
    }
    .file-row:hover {
      background-color: #f5f5f5;
    }
    #info, .actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    #info h4 {
      text-wrap: nowrap;
      overflow: hidden;
      margin-top: 0rem;
      margin-bottom: 0.5rem;
    }
    #info p {
      font-size: 0.7rem;
      margin: 0;
      color: #666;
    }
    .actions button:hover {
      border-radius: 100%;
    }

    .progress-bar {
      width: 100%;
      background-color: #f5f5f5;
      height: 4px;
      margin-top: 0.5rem;
    }

    .progress {
      background-color: #aeaeae;
      height: 100%;
    }
  `;

document.addEventListener("DOMContentLoaded", () => {
  const styles = document.createElement("style");
  styles.innerHTML = css;
  document.body.appendChild(styles);
});
