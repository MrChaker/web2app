import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  getLicense,
  KeygenError,
  KeygenLicense,
  validateKey,
} from "tauri-plugin-keygen-api";
import { Database } from "../global";
import { pingHeartbeat } from "../utils";

const License = ({ db }: { db: Database | null }) => {
  // license validation logic

  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const appWindow = (window as any).__TAURI__.window.getCurrentWindow();

  const beforeLoad = async () => {
    let license = await getLicense();

    if (!license?.valid) {
      setKey(key);
      appWindow.show();
      return;
    }
    invoke("show_container_window");
    appWindow.emit("licensed");
    return;
  };
  useEffect(() => {
    beforeLoad();
  }, []);

  const validate = async () => {
    setErr("");
    setLoading(true);

    let license: KeygenLicense;

    // validate license key
    try {
      license = await validateKey({ key });
    } catch (e) {
      const { code, detail } = e as KeygenError;
      setErr(`${code}: ${detail}`);
      setLoading(false);
      return;
    }

    // check license
    if (license.valid) {
      if (db) await putLicenseKey(db, license.key);
      invoke("show_container_window");
      appWindow.emit("licensed");
      return;
    }
    if (license.code === "HEARTBEAT_NOT_STARTED") {
      await pingHeartbeat((license as any).id, license.key)
        .then(async () => {
          await validateKey({ key }); // validate again to update
          if (db) await putLicenseKey(db, license.key);
          invoke("show_container_window");
          appWindow.emit("licensed");
        })
        .catch(() => setErr(`${license.code}: ${license.detail}`));
      setLoading(false);
      return;
    }
    setErr(`${license.code}: ${license.detail}`);

    setLoading(false);
  };

  return (
    <div className="form">
      <label htmlFor="license-key">License Key</label>
      <input
        autoFocus
        id="license-key"
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />
      <button onClick={validate}>Validate</button>
      {loading && <div>validating license...</div>}
      {err !== "" && <div style={{ color: "#ef0222" }}>{err}</div>}
    </div>
  );
};

export const getLicenseKey = async (db: Database): Promise<string> => {
  const key: { key: string }[] = await db.select("SELECT * FROM license_key");
  return key?.[0]?.key || "";
};

const putLicenseKey = async (db: Database, key: string): Promise<void> => {
  await db.execute("DELETE FROM license_key WHERE id = 1");
  await db.execute("INSERT INTO license_key (key) VALUES ($1)", [key]);
};

export default License;
