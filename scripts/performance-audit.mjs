import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = resolve(root, "index.html");
const indexHtml = readFileSync(indexPath, "utf8");
const errors = [];

function fail(message) {
  errors.push(message);
}

function localScriptReferences(html) {
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)]
    .map((match) => match[1].split(/[?#]/)[0])
    .filter((src) => !/^https?:\/\//i.test(src))
    .map((src) => src.replace(/^\/+/, ""))
    .filter((src) => src.startsWith("js/"));
}

function staticImports(source) {
  const imports = [];
  const pattern = /(?:import|export)\s+(?:[^;]*?\s+from\s+)?["'](\.[^"']+)["']/g;
  for (const match of source.matchAll(pattern)) imports.push(match[1]);
  return imports;
}

function collectEagerGraph(entryFiles) {
  const seen = new Set();
  const queue = [...entryFiles];

  while (queue.length) {
    const relativePath = queue.pop();
    if (seen.has(relativePath)) continue;
    const absolutePath = resolve(root, relativePath);
    if (!existsSync(absolutePath)) {
      fail(`Missing eager script: ${relativePath}`);
      continue;
    }

    seen.add(relativePath);
    if (!relativePath.endsWith(".js")) continue;
    const source = readFileSync(absolutePath, "utf8");
    for (const importPath of staticImports(source)) {
      const importedAbsolute = resolve(dirname(absolutePath), importPath);
      const importedRelative = relative(root, importedAbsolute).replaceAll("\\", "/");
      if (!importedRelative.startsWith("..")) queue.push(importedRelative);
    }
  }

  const bytes = [...seen].reduce((total, relativePath) => {
    const source = readFileSync(resolve(root, relativePath));
    return total + source.byteLength;
  }, 0);

  return { files: [...seen].sort(), bytes };
}

const directScripts = localScriptReferences(indexHtml);
const forbiddenEagerScripts = [
  "js/animation-numberline.js",
  "js/analytics-controller.js",
  "js/gamification-controller.js",
  "js/onboarding-controller.js",
  "js/quick-nav-controller.js",
  "js/section-layout-controller.js",
  "js/runtime-diagnostics.js"
];

if (!directScripts.includes("js/performance-bootstrap.js")) {
  fail("index.html must load js/performance-bootstrap.js.");
}
for (const script of forbiddenEagerScripts) {
  if (directScripts.includes(script)) fail(`${script} must not be loaded eagerly by index.html.`);
}

const eagerGraph = collectEagerGraph(directScripts);
if (eagerGraph.files.length > 40) {
  fail(`Eager local JS graph is too broad: ${eagerGraph.files.length} files (limit 40).`);
}
if (eagerGraph.bytes > 600 * 1024) {
  fail(`Eager local JS graph is too large: ${eagerGraph.bytes} bytes (limit 614400).`);
}

const appSource = readFileSync(resolve(root, "js/app.js"), "utf8");
const bootstrapSource = readFileSync(resolve(root, "js/performance-bootstrap.js"), "utf8");
const runtimeLoaderSource = readFileSync(resolve(root, "js/runtime-loader.js"), "utf8");
const analyticsSource = readFileSync(resolve(root, "js/analytics-controller.js"), "utf8");
const gamificationSource = readFileSync(resolve(root, "js/gamification-controller.js"), "utf8");

for (const modulePath of [
  "./lesson-quiz-admin-controller.js",
  "./roadmap-admin-controller.js",
  "./admin-studio-controller.js",
  "./admin-draft-controller.js",
  "./admin-history-controller.js",
  "./gamification-admin-controller.js",
  "./concept-admin-controller.js"
]) {
  if (!appSource.includes(`import(\"${modulePath}\")`)) {
    fail(`Admin module must be dynamically imported: ${modulePath}`);
  }
  if (appSource.includes(`from \"${modulePath}\"`)) {
    fail(`Admin module must not be statically imported: ${modulePath}`);
  }
}

if (!bootstrapSource.includes("requestIdleCallback") ||
    !bootstrapSource.includes("mh:analytics-route") ||
    !bootstrapSource.includes("mh:gamification-route")) {
  fail("Performance bootstrap is missing idle or route-aware loading guards.");
}
if (!runtimeLoaderSource.includes("loadNumberLineRuntime") ||
    !runtimeLoaderSource.includes("classicScriptLoads")) {
  fail("Number-line runtime is missing single-flight lazy loading.");
}
if (!analyticsSource.includes("loadPromise") || !analyticsSource.includes("reloadAfterCurrent")) {
  fail("Analytics requests are missing duplicate-load coalescing.");
}
if (!gamificationSource.includes("loadPromise") || !gamificationSource.includes("reloadAfterCurrent")) {
  fail("Gamification requests are missing duplicate-load coalescing.");
}

console.log("MathHard performance audit");
console.log(`- direct local scripts: ${directScripts.length}`);
console.log(`- eager local JS files: ${eagerGraph.files.length}`);
console.log(`- eager local JS bytes: ${eagerGraph.bytes}`);

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("MathHard performance audit passed.");
}
