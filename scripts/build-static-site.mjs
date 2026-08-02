import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
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
