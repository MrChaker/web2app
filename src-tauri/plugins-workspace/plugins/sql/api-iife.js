if ("__TAURI__" in window) {
  var __TAURI_PLUGIN_SQL__ = (function () {
    "use strict";
    async function t(t, e = {}, n) {
      return window.__TAURI_INTERNALS__.invoke(t, e, n);
    }
    "function" == typeof SuppressedError && SuppressedError;
    class e {
      constructor(t) {
        this.path = t;
      }
      static async load(n) {
        const s = await t("plugin:sql|load", { db: n });
        return new e(s);
      }
      static async load_with_options(n, s) {
        const r = await t("plugin:sql|load_with_options", {
          params: { db: n, encryption_key: s.encryption_key },
        });
        return new e(r);
      }
      static get(t) {
        return new e(t);
      }
      async execute(e, n) {
        const [s, r] = await t("plugin:sql|execute", {
          db: this.path,
          query: e,
          values: n ?? [],
        });
        return { lastInsertId: r, rowsAffected: s };
      }
      async select(e, n) {
        return await t("plugin:sql|select", {
          db: this.path,
          query: e,
          values: n ?? [],
        });
      }
      async close(e) {
        return await t("plugin:sql|close", { db: e });
      }
    }
    return e;
  })();
  Object.defineProperty(window.__TAURI__, "sql", {
    value: __TAURI_PLUGIN_SQL__,
  });
}

console.log("whyyy");
