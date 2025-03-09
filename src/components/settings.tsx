import { CircleX } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { formatTimeStringToDate, deactivateMachine } from "../utils";
import {
  getLicense,
  KeygenLicense,
  resetLicense,
} from "tauri-plugin-keygen-api";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getAllWindows } from "@tauri-apps/api/window";
import { Database } from "../global";

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
  const sql: Database = (window as any).__TAURI__.sql;
  const dbRef = useRef<Database | null>(null);

  const initialize = async () => {
    try {
      const db = await sql.load(
        "sqlite:test-encryption.db",
        import.meta.env.VITE_DATABASE_KEY
      );
      dbRef.current = db;
    } catch (err) {
      console.error(err);
    }
  };

  const webview = getCurrentWebview();
  const fetchLicense = async () => {
    const l = await getLicense();
    setLicense(l);
  };
  useEffect(() => {
    initialize();
    fetchLicense();

    webview.listen("licensed", () => {
      fetchLicense();
    });
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
              await deleteLicenseKey(dbRef.current);
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

const deleteLicenseKey = async (db: Database | null): Promise<void> => {
  if (db) await db.execute("DELETE FROM license_key WHERE id = 1");
};

export default Settings;
