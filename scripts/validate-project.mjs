import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

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

const jsFiles = [...classicJsFiles, ...moduleJsFiles];

const requiredFiles = [
  "index.html",
  "profile.html",
  "data/problems.json",
  ...jsFiles
];

const forbiddenPatterns = [
  /ADMIN_PASS/i,
  /sb_secret_[A-Za-z0-9_-]+/i,
  /service[_-]?role\s*[:=]/i,
  /create_content\.php/i,
  /admin_login\.php/i,
  /get_problems\.php/i,
  /id=["']mh_secret["']/i
];

const productionTextFiles = [
  "index.html",
  "profile.html",
  "README.md",
  "js/app.js",
  "js/profile.js",
  "js/supabase-client.js",
  "js/content-repository.js",
  "js/progress-repository.js"
];

let failed = false;

for (const relativePath of requiredFiles) {
  if (!existsSync(resolve(root, relativePath))) {
    console.error(`Missing required file: ${relativePath}`);
    failed = true;
  }
}

function checkClassicScript(relativePath) {
  execFileSync(process.execPath, ["--check", resolve(root, relativePath)], {
    stdio: "pipe"
  });
}

function checkModuleScript(relativePath) {
  const source = readFileSync(resolve(root, relativePath), "utf8");

  // Node treats .js files as CommonJS when there is no package.json with
  // "type": "module". These browser files are ES modules, so parse their
  // contents through stdin with module syntax enabled instead of importing
  // or executing them.
  execFileSync(process.execPath, ["--input-type=module", "--check"], {
    input: source,
    stdio: ["pipe", "pipe", "pipe"]
  });
}

for (const relativePath of classicJsFiles) {
  try {
    checkClassicScript(relativePath);
  } catch (error) {
    console.error(`JavaScript syntax error in ${relativePath}`);
    console.error(error.stderr?.toString() || error.message);
    failed = true;
  }
}

for (const relativePath of moduleJsFiles) {
  try {
    checkModuleScript(relativePath);
  } catch (error) {
    console.error(`JavaScript module syntax error in ${relativePath}`);
    console.error(error.stderr?.toString() || error.message);
    failed = true;
  }
}

try {
  JSON.parse(readFileSync(resolve(root, "data/problems.json"), "utf8"));
} catch (error) {
  console.error(`Invalid JSON in data/problems.json: ${error.message}`);
  failed = true;
}

for (const relativePath of productionTextFiles) {
  const fullPath = resolve(root, relativePath);
  if (!existsSync(fullPath)) continue;

  const content = readFileSync(fullPath, "utf8");
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      console.error(`Forbidden legacy/secret pattern ${pattern} in ${relativePath}`);
      failed = true;
    }
  }
}

const appSource = readFileSync(resolve(root, "js/app.js"), "utf8");
const profileSource = readFileSync(resolve(root, "js/profile.js"), "utf8");

for (const [relativePath, source] of [
  ["js/app.js", appSource],
  ["js/profile.js", profileSource]
]) {
  if (!source.includes('from "./content-repository.js"')) {
    console.error(`${relativePath} must use the shared content repository.`);
    failed = true;
  }
}

if (!appSource.includes('from "./progress-repository.js"')) {
  console.error("js/app.js must use the secure progress repository.");
  failed = true;
}

for (const table of [
  "user_lesson_progress",
  "user_problem_progress",
  "user_exam_progress"
]) {
  const directWritePattern = new RegExp(
    `\\.from\\([\"']${table}[\"']\\)\\s*\\.(?:insert|upsert|update|delete)\\(`,
    "s"
  );

  if (directWritePattern.test(appSource)) {
    console.error(`Direct browser write to ${table} is forbidden; use RPC progress events.`);
    failed = true;
  }
}

for (const rpcName of [
  "mh_mark_lesson_learned",
  "mh_record_problem_event",
  "mh_start_exam_attempt",
  "mh_finish_exam_attempt"
]) {
  const repositorySource = readFileSync(resolve(root, "js/progress-repository.js"), "utf8");
  if (!repositorySource.includes(rpcName)) {
    console.error(`Missing secure progress RPC binding: ${rpcName}`);
    failed = true;
  }
}

for (const legacyLoader of [
  "loadJsonDataForTotals",
  "loadContentTotals",
  "async function loadJsonData()",
  "async function loadSupabaseData()",
  "SERVER_DATA"
]) {
  if (appSource.includes(legacyLoader) || profileSource.includes(legacyLoader)) {
    console.error(`Legacy duplicate catalog loader still present: ${legacyLoader}`);
    failed = true;
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("MathHard validation passed.");
}
