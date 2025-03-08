import { CircleX } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { formatTimeStringToDate, deactivateMachine } from "../utils";
import {
  getLicense,
  KeygenLicense,
  resetLicense,
} from "tauri-plugin-keygen-api";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getAllWindows } from "@tauri-apps/api/window";

const Settings = ({
  setOpen,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const webview = getCurrentWebview();

  const listenForOutSideClick = async () => {
    const unlisten = webview.listen("outside-click", () => {
      if (!(window as any).listening) {
        (window as any).listening = true;
        return;
      }
      setOpen(false);
    });
    return unlisten;
  };

  useEffect(() => {
    const unlisten = listenForOutSideClick();
    (window as any).listening = true;

    return () => {
      const un = async () => {
        await unlisten;
      };
      un();
    };
  }, []);

  return (
    <div
      id="settings-window"
      onMouseDown={() => ((window as any).listening = false)}>
      <h3>
        Settings <CircleX onClick={() => setOpen(false)} />{" "}
      </h3>
      <div id="settings-list">
        <LicenseInfo />
      </div>
    </div>
  );
};

const LicenseInfo = () => {
  const [license, setLicense] = useState<KeygenLicense | null>();
  const fetchLicense = async () => {
    const l = await getLicense();
    setLicense(l);
  };
  useEffect(() => {
    fetchLicense();
  }, []);

  return (
    <div style={{ textAlign: "center", margin: "1rem 0" }}>
      <h4>-- License --</h4>
      <p>
        <span style={{ fontWeight: "bold" }}>Status:</span>{" "}
        {license?.valid ? "🟢" : "🔴"}
      </p>
      <p>
        <span style={{ fontWeight: "bold" }}>Issued on:</span>{" "}
        {formatTimeStringToDate((license as any)?.created) || "-"}
      </p>
      <p>
        <span style={{ fontWeight: "bold" }}>Valid Until:</span>{" "}
        {formatTimeStringToDate(license?.expiry || "") || "-"}
      </p>
      <div
        id="deactivateBtn"
        onClick={async () => {
          await deactivateMachine((license as any).id, license?.key!)
            .then(async () => {
              await resetLicense();
              const allWindows = await getAllWindows();
              const mainWindow = allWindows.find((w) => w.label == "main");
              const appWindow = allWindows.find((w) => w.label == "container");

              mainWindow?.show();
              appWindow?.hide();
            })
            .catch(() => {});
        }}
        style={{
          cursor: "pointer",
        }}>
        De-activate license
      </div>
    </div>
  );
};

export default Settings;
