function isDownloadLink(url) {
  // prettier-ignore
  const fileExtensions = [
    '3gp', '7z', 'ai', 'apk', 'avi', 'bmp', 'csv', 'dmg', 'doc', 'docx',
    'fla', 'flv', 'gif', 'gz', 'gzip', 'ico', 'iso', 'indd', 'jar', 'jpeg',
    'jpg', 'm3u8', 'mov', 'mp3', 'mp4', 'mpa', 'mpg', 'mpeg', 'msi', 'odt',
    'ogg', 'ogv', 'pdf', 'png', 'ppt', 'pptx', 'psd', 'rar', 'raw', 'cab',
    'svg', 'swf', 'tar', 'tif', 'tiff', 'ts', 'txt', 'wav', 'webm', 'webp',
    'wma', 'wmv', 'xls', 'xlsx', 'xml', 'zip', 'json', 'yaml', '7zip', 'mkv',
  ];
  const downloadLinkPattern = new RegExp(
    `\\.(${fileExtensions.join("|")})$`,
    "i"
  );
  return downloadLinkPattern.test(url);
}

function getFilenameFromUrl(url) {
  const urlPath = new URL(url).pathname;
  return urlPath.substring(urlPath.lastIndexOf("/") + 1);
}

function canDownload(url, anchorElement) {
  return anchorElement.download || isDownloadLink(url);
}

function noneHttpLinkDownload(url) {
  return ["blob", "data"].some((protocol) => url.startsWith(protocol));
}

document.addEventListener("DOMContentLoaded", () => {
  const tauri = window.__TAURI__;
  const appWindow = tauri.window.getCurrentWindow();
  const invoke = tauri.core.invoke;

  function downloadFromDataUri(dataURI, filename) {
    const byteString = atob(dataURI.split(",")[1]);
    const bufferArray = new ArrayBuffer(byteString.length);
    const binary = new Uint8Array(bufferArray);

    for (let i = 0; i < byteString.length; i++) {
      binary[i] = byteString.charCodeAt(i);
    }

    invoke("download_binary_file", {
      params: {
        filename,
        binary: Array.from(binary),
      },
    });
  }

  function downloadFromBlobUrl(blobUrl, filename) {
    fetch(blobUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const reader = new FileReader();

        reader.readAsArrayBuffer(blob);
        reader.onload = () => {
          invoke("download_binary_file", {
            params: {
              filename,
              binary: new Uint8Array(reader.result),
            },
          });
        };
      });
  }

  const detectAnchorElementClick = (e) => {
    const anchorElement = e.target.closest("a");

    if (anchorElement && anchorElement.href) {
      const hrefUrl = new URL(anchorElement.href);
      const absoluteUrl = hrefUrl.href;
      let filename = anchorElement.download || getFilenameFromUrl(absoluteUrl);

      if (noneHttpLinkDownload(absoluteUrl)) return;

      e.preventDefault();
      if (canDownload(absoluteUrl, anchorElement)) {
        invoke("download_file", {
          params: { url: absoluteUrl, filename },
        });
        return;
      }
      invoke("try_download_file", {
        params: { url: absoluteUrl },
      });
    }
  };

  // Websites use createElement("a") to download files, so we need to detect this situation
  // by overwriting the createElement function and attach listener to anchor elements .
  function handleDownloadsTriggeredByCreatingHref() {
    const createEle = document.createElement;
    document.createElement = (el) => {
      if (el !== "a") return createEle.call(document, el);
      const anchorEle = createEle.call(document, el);

      // use addEventListener to avoid overriding the original click event.
      anchorEle.addEventListener(
        "click",
        (e) => {
          const url = anchorEle.href;
          const filename = anchorEle.download || getFilenameFromUrl(url);
          if (url.startsWith("blob:")) {
            downloadFromBlobUrl(url, filename);
          } else if (url.startsWith("data:")) {
            downloadFromDataUri(url, filename);
          }
        },
        true
      );

      return anchorEle;
    };
  }

  document.addEventListener("click", detectAnchorElementClick, true);
  handleDownloadsTriggeredByCreatingHref();

  console.log(appWindow, appWindow?.listen);
  appWindow.listen("link-not-downloadable", (event) => {
    console.log(event);
    const { url } = event.payload;
    location.assign(url);
  });
});
