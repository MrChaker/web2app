import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  getLicense,
  KeygenError,
  KeygenLicense,
  resetLicenseKey,
  validateKey,
} from "tauri-plugin-keygen-api";
import { Database } from "../global";
import { getCurrentWindow } from "@tauri-apps/api/window";

const License = () => {
  // license validation logic

  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const appWindow = (window as any).__TAURI__.window.getCurrentWindow();
  const sql: Database = (window as any).__TAURI__.sql;
  const dbRef = useRef<Database | null>(null);

  const initialize = async () => {
    try {
      const db = await sql.load(
        "sqlite:test-encryption.db",
        import.meta.env.VITE_DATABASE_KEY
      );
      dbRef.current = db;
      setKey((await getLicenseKey(db)) || "");
    } catch (err) {
      console.error(err);
    }
  };

  const beforeLoad = async () => {
    let license = await getLicense();

    if (license === null) {
      setKey(key);
      appWindow.show();
    } else {
      invoke("show_container_window");
      appWindow.emit("licensed");
    }
  };
  useEffect(() => {
    initialize();
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

    // // remove license key from cache
    // await resetLicenseKey();

    // store it in db
    if (dbRef.current) await putLicenseKey(dbRef.current, license.key);
    // check license
    if (license.valid) {
      invoke("show_container_window");
      appWindow.emit("licensed");
    } else {
      setErr(`${license.code}: ${license.detail}`);
    }

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

const getLicenseKey = async (db: Database): Promise<string> => {
  const key: { key: string }[] = await db.select("SELECT * FROM license_key");
  return key?.[0]?.key || "";
};

const putLicenseKey = async (db: Database, key: string): Promise<void> => {
  await db.execute("DELETE FROM license_key WHERE id = 1");
  await db.execute("INSERT INTO license_key (key) VALUES ($1)", [key]);
};

export default License;
