// install.js
const { execSync } = require("child_process");
const { platform } = require("os");

try {
  switch (platform()) {
    case "linux":
      execSync(
        "npm install @rollup/rollup-linux-x64-gnu @tauri-apps/cli-linux-x64-gnu --no-save",
        {
          stdio: "inherit",
        }
      );
      break;
    case "win32":
      execSync(
        "npm install @rollup/rollup-win32-x64-msvc @tauri-apps/cli-win32-x64-msvc  --no-save",
        {
          stdio: "inherit",
        }
      );
      break;
    default:
      console.log("No OS-specific package for this platform.");
  }
} catch (error) {
  console.error("Installation failed:", error);
  process.exit(1);
}
