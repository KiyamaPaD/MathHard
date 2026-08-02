import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const index = read("index.html");
const netlify = read("netlify.toml");
const packageJson = JSON.parse(read("package.json"));
const app = read("js/app.js");
const staticBuilder = read("scripts/build-static-site.mjs");

const build = index.match(/data-mh-build="([^"]+)"/)?.[1];
const appVersion = index.match(/\/js\/app\.js\?v=([^"&]+)/)?.[1];
const cssVersion = index.match(/css\/content-authoring\.css\?v=([^"&]+)/)?.[1];
if (!build || build !== appVersion || build !== cssVersion) {
  throw new Error(`Top-level build mismatch: html=${build}, app=${appVersion}, css=${cssVersion}.`);
}
if (!index.includes("window.__MH_DEPLOY_STATUS") || !index.includes("/deploy-manifest.json?t=")) throw new Error("Inline deploy integrity guard is missing.");
if (!netlify.includes('base = "."') || !netlify.includes('publish = ".netlify-dist"')) throw new Error("Netlify base/publish root is not explicit.");
if (!netlify.includes('command = "npm run build"')) throw new Error("Netlify does not run the full build contract.");
if (packageJson.scripts?.build !== "npm test && npm run build:manifest && npm run build:site") throw new Error("package.json build script is stale.");
if (!staticBuilder.includes(".netlify-dist") || !staticBuilder.includes("runtimeEntries")) throw new Error("Static site builder contract is missing.");
if (app.includes('content-authoring-bootstrap.js?v=5a3') || app.includes('content-quality-admin-controller.js?v=5a3')) {
  throw new Error("Editorial runtime imports still point to build 5a3.");
}
if (index.includes('app.js?v=4j1') || index.includes('pattern="[A-Za-z0-9][A-Za-z0-9_-]{1,199}"')) {
  throw new Error("A known stale 4j1/invalid-pattern artifact is present.");
}

const generated = spawnSync(process.execPath, [resolve(root, "scripts/write-deploy-manifest.mjs")], {
  cwd: root,
  encoding: "utf8"
});
if (generated.status !== 0) throw new Error(generated.stderr || generated.stdout || "Deploy manifest generation failed.");
const manifest = JSON.parse(read("deploy-manifest.json"));
if (manifest.build !== build || manifest.appVersion !== build) throw new Error("Generated deploy manifest does not match the HTML build.");

console.log(`MathHard deployment contract audit passed (build ${build}).`);
