import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const destination = resolve(root, ".netlify-dist");
const runtimeEntries = [
  "index.html",
  "profile.html",
  "u.html",
  "404.html",
  "offline.html",
  "robots.txt",
  "sitemap.xml",
  "site.webmanifest",
  "deploy-manifest.json",
  "css",
  "js",
  "data",
  "img"
];

rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });

for (const entry of runtimeEntries) {
  const source = resolve(root, entry);
  if (!existsSync(source)) throw new Error(`Missing deploy runtime entry: ${entry}`);
  cpSync(source, resolve(destination, entry), { recursive: true });
}

console.log(`MathHard static deploy directory created with ${runtimeEntries.length} runtime entries.`);


const builtIndexPath = resolve(destination, "index.html");
const builtIndex = readFileSync(builtIndexPath, "utf8");
const adminStartMarker = "  <!-- Admin Studio -->";
const adminEndMarker = "  <!-- Modal -->";
const adminStart = builtIndex.indexOf(adminStartMarker);
const adminEnd = builtIndex.indexOf(adminEndMarker);

if (adminStart < 0 || adminEnd < 0 || adminEnd <= adminStart) {
  throw new Error("Admin Studio markers could not be extracted from index.html.");
}

const adminFragment = builtIndex.slice(
  adminStart + adminStartMarker.length,
  adminEnd
).trim();

if (!adminFragment.includes('id="adminDrawer"')) {
  throw new Error("Extracted Admin Studio fragment is invalid.");
}

writeFileSync(resolve(destination, "admin-studio.html"), `${adminFragment}\n`, "utf8");
writeFileSync(
  builtIndexPath,
  `${builtIndex.slice(0, adminStart)}  <div id="mhAdminMount"></div>\n\n${builtIndex.slice(adminEnd)}`,
  "utf8"
);
writeFileSync(
  resolve(destination, "_headers"),
  "/admin-studio.html\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: private, no-store\n",
  "utf8"
);

console.log("Admin Studio removed from the public HTML and emitted as an admin-only lazy fragment.");
