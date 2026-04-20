/**
 * OneDrive / Dropbox / iCloud / Google Drive often corrupt `.next` Webpack chunks.
 * Runs before **production builds** only (`prebuild`). We intentionally do **not** wipe
 * before every `next dev`: deleting `.next` while a dev server (or a second terminal)
 * is still using it causes `ENOENT routes-manifest.json` and a blank "Internal Server Error".
 *
 * When chunks look corrupt during dev, run: `npm run dev:fresh` (or `npm run clean` then `npm run dev`).
 *
 * Set SKIP_CLOUD_SYNC_CLEAN=1 to disable (e.g. CI or if you trust your setup).
 */
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

if (process.env.SKIP_CLOUD_SYNC_CLEAN === "1") {
  process.exit(0);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const n = root.replace(/\\/g, "/").toLowerCase();
const cloud =
  n.includes("/onedrive/") ||
  n.includes("/dropbox/") ||
  n.includes("icloud") ||
  n.includes("google drive");

if (!cloud) {
  process.exit(0);
}

console.log(
  "[luxxelounge] Cloud-sync folder detected — clearing .next so Webpack chunks stay valid (set SKIP_CLOUD_SYNC_CLEAN=1 to skip)."
);
execSync("node scripts/clean-next.mjs", { cwd: root, stdio: "inherit" });
