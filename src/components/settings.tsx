import { CircleX } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  formatTimeStringToDate,
  deactivateMachine,
  pingHeartbeat,
  showLicenseFrom,
} from "../utils";
import { getLicense, KeygenLicense } from "tauri-plugin-keygen-api";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { Database } from "../global";
import { enable, disable } from "@tauri-apps/plugin-autostart";
import { TrayIcon } from "@tauri-apps/api/tray";
import { setUpTray } from "./tray-menu";

const Settings = ({
  setOpen,
  db,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
  db: Database | null;
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
        <SystemSettings db={db} />
        <LicenseInfo db={db} />
      </div>
    </div>
  );
};

enum Option {
  AUTO_START = "auto_start",
  CLOSE_TRAY = "close_tray",
  MINIMIZE_TRAY = "minimize_tray",
}

type Setting = {
  option: Option;
  value: string;
};

const SystemSettings = ({ db }: { db: Database | null }) => {
  const [trayIcon, setTrayIcon] = useState<TrayIcon | null>(null);
  const [autoStart, setAutoStart] = useState(true);
  const [minizeSystemTray, setMinizeSystemTray] = useState(false);
  const [closeSystemTray, setCloseSystemTray] = useState(false);
  const webview = getCurrentWebview();

  const autoStartDefault = async (db: Database) => {
    // if there's no data in auto_start ( first time using app ) . autostart should be enabled
    const res: Setting[] = await db.select("SELECT * FROM settings");
    const autoStart = Boolean(
      res.find((row) => row.option === Option.AUTO_START)?.value == "true"
    );
    const closeTr = Boolean(
      res.find((row) => row.option === Option.CLOSE_TRAY)?.value == "true"
    );
    const minimizeTr = Boolean(
      res.find((row) => row.option === Option.MINIMIZE_TRAY)?.value == "true"
    );

    setAutoStart(autoStart);
    setCloseSystemTray(closeTr);
    setMinizeSystemTray(minimizeTr);

    setTrayIcon(
      (await setUpTray(
        closeTr,
        minimizeTr,
        await TrayIcon.getById("app-tray") // pass existing to not create new one
      )) || null
    );
  };

  useEffect(() => {
    if (db) {
      autoStartDefault(db);
      webview.listen("licensed", async () => {
        (await TrayIcon.getById("app-tray"))?.setVisible(true);
      });
    }
  }, [db]);

  const updateOption = async (option: Option, value: boolean) => {
    await db?.execute("UPDATE settings SET value = $1 where option = $2", [
      String(value),
      option,
    ]);
  };

  return (
    <div style={{ margin: "1rem 0" }}>
      <h4 style={{ textAlign: "center" }}>---- System settings ----</h4>
      <div style={{ fontWeight: "bold" }}>
        <div>
          <input
            type="checkbox"
            style={{ marginRight: "0.5rem" }}
            checked={autoStart}
            onChange={async (e) => {
              if (autoStart) disable();
              else enable();
              updateOption(Option.AUTO_START, e.target.checked);
              setAutoStart(e.target.checked);
            }}
          />
          Auto start
        </div>
        <div>
          <input
            type="checkbox"
            style={{ marginRight: "0.5rem" }}
            checked={minizeSystemTray}
            onChange={async (e) => {
              updateOption(Option.MINIMIZE_TRAY, e.target.checked);
              setMinizeSystemTray(e.target.checked);
              setUpTray(closeSystemTray, e.target.checked, trayIcon);
            }}
          />
          Minimize In System Tray
        </div>
        <div>
          <input
            type="checkbox"
            style={{ marginRight: "0.5rem" }}
            checked={closeSystemTray}
            onChange={async (e) => {
              updateOption(Option.CLOSE_TRAY, e.target.checked);
              setCloseSystemTray(e.target.checked);
              setUpTray(e.target.checked, minizeSystemTray, trayIcon);
            }}
          />
          Close In System Tray
        </div>
      </div>
    </div>
  );
};

const LicenseInfo = ({ db }: { db: Database | null }) => {
  const [license, setLicense] = useState<KeygenLicense | null>();
  const [err, setErr] = useState("");

  const webview = getCurrentWebview();
  const fetchLicense = async () => {
    const l = await getLicense();
    setLicense(l);
  };

  const heartbeat = () => {
    const trigger = async (ci: number | undefined = undefined) => {
      try {
        const res = await pingHeartbeat((license as any).id, license?.key!);
        if (!res.ok) throw new Error(res.status + " " + res.statusText);
        setErr("");
      } catch (error: any) {
        setErr((error.message as string) || "Error");
        if (ci) clearInterval(ci);
        showLicenseFrom(db);
      }
    };
    trigger();
    const ci = setInterval(async () => {
      trigger(ci);
    }, import.meta.env.VITE_HEARTBEAT_INTERVAL * 1000 - 10000); // ping before 10 seconds of end
    return ci;
  };

  useEffect(() => {
    let interval: number;
    if (license?.valid) interval = heartbeat();
    else if (db) showLicenseFrom(db);
    return () => {
      clearInterval(interval);
    };
  }, [license, db]);

  useEffect(() => {
    fetchLicense();
    webview.listen("licensed", async () => {
      fetchLicense();
    });
  }, []);

  return (
    <div style={{ textAlign: "center", margin: "1rem 0" }}>
      <h4>----- License -----</h4>
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
              showLicenseFrom(db);
            })
            .catch(() => {});
        }}
        style={{
          cursor: "pointer",
        }}>
        De-activate license
      </div>
      {err && <p style={{ color: "red" }}>{err}</p>}
    </div>
  );
};

export default Settings;
