import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}
function fail(message) { errors.push(message); }
function warn(message) { warnings.push(message); }

const htmlFiles = ["index.html", "profile.html"];
const performanceBootstrap = read("js/performance-bootstrap.js");
const jsFiles = readdirSync(resolve(root, "js"))
  .filter((name) => name.endsWith(".js"))
  .map((name) => `js/${name}`);

for (const htmlPath of htmlFiles) {
  const html = read(htmlPath);
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length) fail(`${htmlPath}: duplicate static IDs: ${duplicates.join(", ")}`);

  const buttons = [...html.matchAll(/<button\b[^>]*>/gi)].map((match) => match[0]);
  const missingTypes = buttons.filter((tag) => !/\btype\s*=/.test(tag));
  if (missingTypes.length) fail(`${htmlPath}: ${missingTypes.length} button(s) miss an explicit type attribute.`);

  const localReferences = [
    ...html.matchAll(/<(?:script|img)\b[^>]*\b(?:src)=["']([^"']+)["']/gi),
    ...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["']/gi),
    ...html.matchAll(/<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/gi)
  ].map((match) => match[1]);

  for (const reference of localReferences) {
    if (!reference.startsWith("/") || reference.startsWith("//")) continue;
    const clean = reference.split(/[?#]/)[0].replace(/^\/+/, "");
    if (clean && !existsSync(resolve(root, clean))) {
      fail(`${htmlPath}: missing local asset ${reference}`);
    }
  }

  const diagnosticsLoaded = html.includes('/js/runtime-diagnostics.js') ||
    (htmlPath === "index.html" &&
      html.includes('/js/performance-bootstrap.js') &&
      performanceBootstrap.includes('./runtime-diagnostics.js'));
  if (!diagnosticsLoaded) {
    fail(`${htmlPath}: runtime diagnostics module is not loaded.`);
  }
  if (!/<meta\s+name=["']viewport["'][^>]*width=device-width/i.test(html)) {
    fail(`${htmlPath}: responsive viewport metadata is missing.`);
  }
  if (!html.includes('/css/mobile-hardening.css')) {
    fail(`${htmlPath}: Phase 18C mobile hardening stylesheet is not loaded.`);
  }
}

for (const jsPath of jsFiles) {
  const source = read(jsPath);
  for (const match of source.matchAll(/from\s+["'](\.\.?\/[^"']+)["']/g)) {
    const imported = resolve(root, dirname(jsPath), match[1]);
    if (!existsSync(imported)) fail(`${jsPath}: missing import ${match[1]}`);
  }

  const dynamicButtons = [...source.matchAll(/<button\b[^>]*>/gi)].map((match) => match[0]);
  const missingDynamicTypes = dynamicButtons.filter((tag) => !/\btype\s*=/.test(tag));
  if (missingDynamicTypes.length) {
    fail(`${jsPath}: ${missingDynamicTypes.length} generated button(s) miss an explicit type attribute.`);
  }
}

const mobileHardening = read("css/mobile-hardening.css");
if (!mobileHardening.includes("overflow-x: clip") ||
    !mobileHardening.includes(".mh-admin-content-title-row strong") ||
    !mobileHardening.includes(".profile-tabs")) {
  fail("css/mobile-hardening.css: expected shell, Admin and profile overflow guards are missing.");
}

const app = read("js/app.js");
const profile = read("js/profile.js");
const contentRepository = read("js/content-repository.js");
const roadmapRepository = read("js/roadmap-repository.js");
const appProgress = read("js/app-progress.js");
const secureProblem = read("js/secure-problem-controller.js");
const runtimeDiagnostics = read("js/runtime-diagnostics.js");

const sensitivePatterns = [
  /globalThis\.supabase\s*=/,
  /console\.log\(["']AUTH EVENT:/,
  /console\.log\(["']GET USER RESULT:/,
  /console\.log\(["']LOGIN RESULT:/,
  /console\.log\(["']SIGNUP RESULT:/,
  /console\.log\(["']DELETE FUNCTION RESULT:/
];
for (const [path, source] of [["js/app.js", app], ["js/profile.js", profile]]) {
  for (const pattern of sensitivePatterns) {
    if (pattern.test(source)) fail(`${path}: sensitive/noisy debug statement remains (${pattern}).`);
  }
}

if (/JSON\.parse\(localStorage\.getItem\(["']mh_(?:attempts|quiz_attempts|today_training)/.test(app)) {
  fail("js/app.js: legacy user-global JSON.parse storage remains unguarded.");
}
if (/localStorage\.setItem\(["']mh_(?:attempts|quiz_attempts|today_training_v2)/.test(app)) {
  fail("js/app.js: legacy user-global storage write remains.");
}
if (!app.includes('from "./browser-state.js"')) fail("js/app.js: browser-state recovery helpers are not wired.");
if (!app.includes("await persistAllLocalAnswers();")) fail("js/app.js: final exam submission does not flush local answers.");
if (/if\s*\(\s*!timedOut\s*\)\s*await\s+persistAllLocalAnswers/.test(app)) {
  fail("js/app.js: timeout path still skips the final autosave flush.");
}
if (!app.includes("secure-exam:${attemptId}:${itemId}")) fail("js/app.js: exam answers are not serialized per item.");
if (!contentRepository.includes("CACHE_TTL_MS") || !contentRepository.includes("loadEpoch")) {
  fail("js/content-repository.js: cache TTL/race protection is missing.");
}
if (!roadmapRepository.includes("loadEpoch")) fail("js/roadmap-repository.js: stale request protection is missing.");
if (/for\s*\(const row of rows\)/.test(roadmapRepository) && roadmapRepository.includes("update({ position:")) {
  warn("js/roadmap-repository.js: roadmap reordering still uses multiple non-transactional updates.");
}
if (!appProgress.includes("userChanged") || !appProgress.includes("keeping the last known state")) warn("js/app-progress.js: could not confirm same-user progress preservation markers.");
if (!secureProblem.includes("workspaceSaveChain")) fail("js/secure-problem-controller.js: workspace writes are not serialized.");
if (!secureProblem.includes("Array.isArray(attempts[problem.id])")) {
  fail("js/secure-problem-controller.js: legacy attempt cache shape is not defended.");
}
if (!runtimeDiagnostics.includes("collectLayoutDiagnostics") ||
    !runtimeDiagnostics.includes("getPerformanceSnapshot")) {
  fail("js/runtime-diagnostics.js: Phase 18C layout/performance snapshot is missing.");
}
const layoutDiagnosticsBlock = runtimeDiagnostics.slice(
  runtimeDiagnostics.indexOf("export function collectLayoutDiagnostics"),
  runtimeDiagnostics.indexOf("function getPerformanceSnapshot")
);
if (layoutDiagnosticsBlock.includes("innerText") ||
    layoutDiagnosticsBlock.includes("textContent") ||
    layoutDiagnosticsBlock.includes(".value")) {
  fail("js/runtime-diagnostics.js: layout diagnostics must not collect page text.");
}

const indexHtml = read("index.html");
if (indexHtml.includes('/img/preview.png')) fail("index.html: og:image still references missing /img/preview.png.");

for (const jsPath of jsFiles) {
  const lines = read(jsPath).split(/\r?\n/).length;
  if (lines > 5000) warn(`${jsPath}: ${lines} lines; still a high-risk monolith for future changes.`);
}

const inlineHandlers = htmlFiles.reduce((count, path) => count + ([...read(path).matchAll(/\son(?:click|change|submit|input|keydown)\s*=/gi)].length), 0);
if (inlineHandlers) warn(`${inlineHandlers} inline event handler(s) remain in static HTML.`);

console.log("MathHard debug audit");
for (const message of errors) console.error(`ERROR: ${message}`);
for (const message of warnings) console.warn(`WARN: ${message}`);
console.log(`- errors: ${errors.length}`);
console.log(`- warnings: ${warnings.length}`);

if (errors.length) process.exit(1);
console.log("MathHard debug audit passed.");
