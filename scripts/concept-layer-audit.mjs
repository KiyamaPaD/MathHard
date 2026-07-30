import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function read(relativePath) {
  const path = resolve(root, relativePath);
  if (!existsSync(path)) {
    errors.push(`Missing file: ${relativePath}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function findSqlFiles(directory, prefix = "") {
  const rows = [];
  for (const name of readdirSync(directory)) {
    if (name === ".git" || name === "node_modules" || name === "local-sql") continue;
    const absolute = join(directory, name);
    const relative = prefix ? `${prefix}/${name}` : name;
    if (statSync(absolute).isDirectory()) rows.push(...findSqlFiles(absolute, relative));
    else if (name.toLowerCase().endsWith(".sql")) rows.push(relative);
  }
  return rows;
}

const app = read("js/app.js");
const index = read("index.html");
const model = read("js/concept-model.js");
const repository = read("js/concept-repository.js");
const admin = read("js/concept-admin-controller.js");
const runtime = read("js/runtime-config.js");
const conceptsCss = read("css/concepts.css");
const studioCss = read("css/concept-studio.css");
const gitignore = read(".gitignore");

for (const rpc of [
  "mh_get_concept_catalog",
  "mh_admin_save_concept",
  "mh_admin_replace_concept_prerequisites",
  "mh_admin_replace_content_concepts",
  "mh_admin_delete_concept_safe"
]) {
  if (!repository.includes(rpc)) errors.push(`Concept repository is missing RPC: ${rpc}`);
}

if (!app.includes('import("./concept-admin-controller.js")')) {
  errors.push("Concept Admin Studio must remain dynamically imported.");
}
if (!app.includes("refreshConceptCatalog") || !app.includes("replaceContentConcepts")) {
  errors.push("Concept catalog or content mapping integration is missing from app.js.");
}
if (!index.includes('id="mhConceptAdminStudio"') || !index.includes('id="mh_concept_ids"')) {
  errors.push("Concept Admin panel or content mapping field is missing from index.html.");
}
if (!runtime.includes("concepts: []") || !runtime.includes("contentConcepts: []")) {
  errors.push("Runtime data does not expose the Concept Layer collections.");
}
if (!model.includes("<details class=\"mh-concept-disclosure\">") ||
    !conceptsCss.includes(".mh-concept-disclosure")) {
  errors.push("Concept details must use collapsed progressive disclosure.");
}
if (!admin.includes("createConceptAdminController") || !studioCss.includes(".mh-concept-admin-shell")) {
  errors.push("Concept Admin Studio controller or styles are incomplete.");
}
if (!gitignore.split(/\r?\n/).includes("/local-sql/")) {
  errors.push(".gitignore must ignore /local-sql/.");
}

const sqlFiles = findSqlFiles(root);
if (sqlFiles.length) {
  errors.push(`SQL files must stay outside the repository: ${sqlFiles.join(", ")}`);
}

console.log("MathHard Concept Layer audit");
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("- canonical concept model: present");
  console.log("- Supabase RPC repository: present");
  console.log("- compact student disclosure: present");
  console.log("- Admin Concept Studio: present");
  console.log("- SQL kept outside Git: confirmed");
  console.log("MathHard Concept Layer audit passed.");
}
