import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const moduleJsFiles = [
  "js/app.js",
  "js/profile.js",
  "js/supabase-client.js",
  "js/content-repository.js",
  "js/progress-repository.js"
];

const classicJsFiles = [
  "js/animation-numberline.js",
  "js/data.js",
  "js/katex-init.js"
];

const requiredFiles = [
  "index.html",
  "profile.html",
  "README.md",
  "data/problems.json",
  "scripts/test-repositories.mjs",
  "scripts/content-tools-lib.mjs",
  "scripts/audit-content.mjs",
  "scripts/export-content-sql.mjs",
  ...classicJsFiles,
  ...moduleJsFiles
];

const productionTextFiles = [
  "index.html",
  "profile.html",
  "README.md",
  ...classicJsFiles,
  ...moduleJsFiles
];

const forbiddenPatterns = [
  /ADMIN_PASS/i,
  /sb_secret_[A-Za-z0-9_-]+/i,
  /service[_-]?role\s*[:=]/i,
  /create_content\.php/i,
  /admin_login\.php/i,
  /get_problems\.php/i,
  /id=["']mh_secret["']/i,
  /Smecherul\.1978/i
];

let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

for (const relativePath of requiredFiles) {
  if (!existsSync(resolve(root, relativePath))) {
    fail(`Missing required file: ${relativePath}`);
  }
}

function checkClassicScript(relativePath) {
  execFileSync(process.execPath, ["--check", resolve(root, relativePath)], {
    stdio: "pipe"
  });
}

function checkModuleScript(relativePath) {
  const source = readFileSync(resolve(root, relativePath), "utf8");
  execFileSync(process.execPath, ["--input-type=module", "--check"], {
    input: source,
    stdio: ["pipe", "pipe", "pipe"]
  });
}

for (const relativePath of classicJsFiles) {
  try {
    checkClassicScript(relativePath);
  } catch (error) {
    fail(`JavaScript syntax error in ${relativePath}\n${error.stderr?.toString() || error.message}`);
  }
}

for (const relativePath of moduleJsFiles) {
  try {
    checkModuleScript(relativePath);
  } catch (error) {
    fail(`JavaScript module syntax error in ${relativePath}\n${error.stderr?.toString() || error.message}`);
  }
}

for (const relativePath of moduleJsFiles) {
  const source = readFileSync(resolve(root, relativePath), "utf8");
  const importPattern = /from\s+["'](\.\.?\/[^"']+)["']/g;
  for (const match of source.matchAll(importPattern)) {
    const importedPath = resolve(root, dirname(relativePath), match[1]);
    if (!existsSync(importedPath)) {
      fail(`${relativePath} imports missing module: ${match[1]}`);
    }
  }
}

try {
  JSON.parse(readFileSync(resolve(root, "data/problems.json"), "utf8"));
} catch (error) {
  fail(`Invalid JSON in data/problems.json: ${error.message}`);
}

for (const relativePath of productionTextFiles) {
  const content = readFileSync(resolve(root, relativePath), "utf8");
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      fail(`Forbidden legacy/secret pattern ${pattern} in ${relativePath}`);
    }
  }
}

const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
if (!/id=["']adminBtn["'][^>]*\bhidden\b/i.test(indexHtml)) {
  fail("Admin button must be hidden by default in index.html.");
}

const appSource = readFileSync(resolve(root, "js/app.js"), "utf8");
const profileSource = readFileSync(resolve(root, "js/profile.js"), "utf8");
if (!appSource.includes('from "./content-repository.js"')) {
  fail("app.js must use content-repository.js.");
}
if (!appSource.includes("loadContentCatalog")) {
  fail("app.js must load the unified catalog through loadContentCatalog().");
}
if (!appSource.includes("getContentItemSources")) {
  fail("Admin must display content provenance.");
}
if (!appSource.includes('from "./progress-repository.js"')) {
  fail("app.js must use progress-repository.js.");
}
if (!appSource.includes("let MH_AUTH_USER = null")) {
  fail("app.js must keep auth state separate from progress-query state.");
}
if (!/function isGuestContentLocked\(\)\s*\{[\s\S]{0,400}return false;/.test(appSource)) {
  fail("Public learning content must not be blocked by progress/auth loading.");
}
if (!appSource.includes('.from("user_problem_progress")\n          .select("*")')) {
  fail("app.js must load progress with schema-compatible select(*).");
}
if (/const safe(?:Lesson|Problem|Exam)Rows\s*=\s*[^;]*\bsafe(?:Lesson|Problem|Exam)Rows\b/.test(profileSource)) {
  fail("profile.js contains a self-referencing safe progress variable.");
}
if (/\.from\(["']user_(lesson|problem|exam)_progress["']\)[\s\S]{0,180}\.(insert|upsert|update|delete)\(/.test(appSource)) {
  fail("app.js contains a direct progress-table mutation; use progress-repository.js instead.");
}
if (/exam_type:\s*document\.getElementById\(["']mh_exam_type/.test(appSource)) {
  fail("Admin exam payload still uses legacy exam_type instead of canonical type.");
}
if (!/default_hours:\s*Number\(document\.getElementById\(["']mh_exam_hours/.test(appSource)) {
  fail("Admin exam payload must write canonical default_hours.");
}

if (/function reconcileProgressAfterMutationError[\s\S]{0,500}loadAppProgressFromDb/.test(appSource)) {
  fail("Progress mutation errors must not immediately reload and erase optimistic UI state.");
}
if (!appSource.includes("if (terminalEvent) {\n    renderCards();")) {
  fail("Solved problem mutations must refresh problem cards immediately.");
}

if (!appSource.includes('.from("mh_lessons").upsert(payload, { onConflict: "id" })')) {
  fail("Editing a bundled lesson must create/update a Supabase override via upsert.");
}
if (!appSource.includes("Șterge override")) {
  fail("Admin must distinguish deleting a Supabase override from deleting bundled content.");
}

try {
  execFileSync(process.execPath, [resolve(root, "scripts/audit-content.mjs")], {
    cwd: root,
    stdio: "pipe"
  });
} catch (error) {
  fail(`Content audit failed.\n${error.stdout?.toString() || ""}${error.stderr?.toString() || error.message}`);
}

try {
  execFileSync(process.execPath, [resolve(root, "scripts/test-repositories.mjs")], {
    cwd: root,
    stdio: "pipe"
  });
} catch (error) {
  fail(`Repository tests failed.\n${error.stdout?.toString() || ""}${error.stderr?.toString() || error.message}`);
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("MathHard validation passed.");
}
