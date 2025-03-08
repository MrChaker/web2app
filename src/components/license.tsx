import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  getLicense,
  getLicenseKey,
  KeygenError,
  KeygenLicense,
  validateKey,
} from "tauri-plugin-keygen-api";

const License = () => {
  // license validation logic
  const params = new URLSearchParams(location.search);
  const cachedKey = params.get("cachedKey");

  const [key, setKey] = useState(cachedKey || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const beforeLoad = async () => {
    let license = await getLicense();
    let licenseKey = await getLicenseKey();

    if (license === null) {
      setKey(licenseKey || "");
    } else {
      invoke("show_container_window");
    }
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
      invoke("show_container_window");
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

export default License;
