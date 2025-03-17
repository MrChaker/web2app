import { CircleX } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import {
  formatTimeStringToDate,
  deactivateMachine,
  getLicenseMachine,
  pingHeartbeat,
  showLicenseFrom,
} from "../utils";
import {
  getLicense,
  KeygenLicense,
  resetLicense,
} from "tauri-plugin-keygen-api";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getAllWindows } from "@tauri-apps/api/window";
import { Database } from "../global";
import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart";

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
        <SystemSettings />
        <LicenseInfo db={db} />
      </div>
    </div>
  );
};

const SystemSettings = () => {
  const [autoStart, setAutoStart] = useState(false);

  const initIsEnabled = async () => setAutoStart(await isEnabled());

  useEffect(() => {
    initIsEnabled();
  }, []);

  return (
    <div style={{ textAlign: "center", margin: "1rem 0" }}>
      <h4>---- System settings ----</h4>
      <div style={{ fontWeight: "bold" }}>
        <input
          type="checkbox"
          style={{ marginRight: "0.5rem" }}
          checked={autoStart}
          onChange={async (e) => {
            if (autoStart) disable();
            else enable();
            setAutoStart(e.target.checked);
          }}
        />
        Auto start Enabled
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
