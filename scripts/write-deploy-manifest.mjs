import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const index = readFileSync(resolve(root, "index.html"), "utf8");
const build = index.match(/<html[^>]*data-mh-build="([^"]+)"/i)?.[1];
const appVersion = index.match(/\/js\/app\.js\?v=([^"&]+)/i)?.[1];

if (!build) throw new Error("index.html does not expose data-mh-build.");
if (!appVersion) throw new Error("index.html does not expose an app.js cache version.");
if (build !== appVersion) throw new Error(`Build mismatch: HTML=${build}, app.js=${appVersion}.`);

const manifest = {
  build,
  appVersion,
  commit: process.env.COMMIT_REF || process.env.GITHUB_SHA || "local",
  branch: process.env.BRANCH || process.env.HEAD || "local",
  generatedAt: new Date().toISOString()
};

writeFileSync(resolve(root, "deploy-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`MathHard deploy manifest generated for build ${build}.`);
