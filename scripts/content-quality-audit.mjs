import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function read(relativePath) {
  const absolute = resolve(root, relativePath);
  if (!existsSync(absolute)) {
    errors.push(`Missing file: ${relativePath}`);
    return "";
  }
  return readFileSync(absolute, "utf8");
}

function findSqlFiles(directory, prefix = "") {
  const rows = [];
  for (const name of readdirSync(directory)) {
    if ([".git", "node_modules", "local-sql"].includes(name)) continue;
    const absolute = join(directory, name);
    const relative = prefix ? `${prefix}/${name}` : name;
    if (statSync(absolute).isDirectory()) rows.push(...findSqlFiles(absolute, relative));
    else if (name.toLowerCase().endsWith(".sql")) rows.push(relative);
  }
  return rows;
}

const index = read("index.html");
const app = read("js/app.js");
const model = read("js/content-quality-model.js");
const repository = read("js/content-quality-repository.js");
const controller = read("js/content-quality-admin-controller.js");
const css = read("css/content-quality-studio.css");
const adminStudio = read("js/admin-studio-controller.js");

for (const token of [
  'data-admin-panel-target="quality"',
  'data-admin-panel="quality"',
  'id="mhContentQualityAdminStudio"',
  'css/content-quality-studio.css'
]) {
  if (!index.includes(token)) errors.push(`Admin quality UI is missing ${token}.`);
}

if (!app.includes('import("./content-quality-admin-controller.js?v=5a5")') ||
    app.includes('from "./content-quality-admin-controller.js"')) {
  errors.push("Content Quality controller must be loaded dynamically.");
}
if (!app.includes("createContentQualityAdminController") ||
    !app.includes('panelName === "quality"')) {
  errors.push("Content Quality controller is not integrated with Admin Studio.");
}
if (!repository.includes('"mh_admin_get_content_quality_dashboard"') ||
    !repository.includes('"mh_admin_save_content_quality"') ||
    !repository.includes('"mh_admin_reset_content_quality"')) {
  errors.push("Content Quality repository RPC contract is incomplete.");
}
if (!model.includes("normalizeContentQualityDashboard") ||
    !model.includes("qualityChecklist") ||
    !model.includes("qualityIssueLabel")) {
  errors.push("Content Quality model helpers are incomplete.");
}
if (!controller.includes("createContentQualityAdminController") ||
    !controller.includes("data-quality-publish") ||
    !controller.includes("data-quality-bulk-publish") ||
    !controller.includes("blocking_issues")) {
  errors.push("Content Quality / Publication Admin controller is incomplete.");
}
if (!css.includes(".mh-quality-layout") ||
    !css.includes(".mh-quality-auto-checks") ||
    !css.includes(".mh-quality-modal") ||
    !css.includes("@media(max-width:700px)")) {
  errors.push("Content Quality responsive styling is incomplete.");
}
if (!adminStudio.includes('"concepts", "quality"')) {
  errors.push("Admin panel persistence does not allow the Quality panel.");
}

const sqlFiles = findSqlFiles(root);
if (sqlFiles.length) errors.push(`SQL files must stay outside the repository: ${sqlFiles.join(", ")}`);

console.log("MathHard Content Quality audit");
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("- editorial quality model and RPC repository: present");
  console.log("- Admin Studio Quality workspace: present");
  console.log("- server-gated verification and publication UI contract: present");
  console.log("- responsive layout: present");
  console.log("- SQL kept outside Git: confirmed");
  console.log("MathHard Content Quality audit passed.");
}
