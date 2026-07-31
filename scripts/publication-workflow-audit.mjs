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

const app = read("js/app.js");
const controller = read("js/content-quality-admin-controller.js");
const qualityModel = read("js/content-quality-model.js");
const publicationModel = read("js/content-publication-model.js");
const publicationRepository = read("js/content-publication-repository.js");
const css = read("css/content-quality-studio.css");
const index = read("index.html");
const contentRepository = read("js/content-repository.js");
const conceptRepository = read("js/concept-repository.js");

for (const token of [
  "mh_admin_get_editorial_dashboard",
  "mh_admin_publish_content",
  "mh_admin_unpublish_content",
  "mh_admin_bulk_set_publication",
  "mh_admin_duplicate_content",
  "mh_admin_preview_content"
]) {
  if (!publicationRepository.includes(token)) errors.push(`Publication repository is missing ${token}.`);
}

for (const token of [
  "normalizePublication",
  "publicationStateLabel",
  "publicationBatchItems"
]) {
  if (!publicationModel.includes(token)) errors.push(`Publication model is missing ${token}.`);
}

for (const token of [
  "publication_state",
  "publication_mode",
  "ready_to_publish",
  "data-quality-bulk-publish",
  "data-quality-preview",
  "data-quality-edit",
  "data-quality-duplicate"
]) {
  const source = token.startsWith("data-") ? controller : qualityModel;
  if (!source.includes(token)) errors.push(`Editorial workflow is missing ${token}.`);
}

if (!app.includes("onChanged: async () =>") || !app.includes("onEditContent:")) {
  errors.push("Publication workflow is not connected to catalogue refresh/editor navigation.");
}
if (!index.includes("Verificare și publicare")) errors.push("Admin navigation label was not upgraded.");
if (!css.includes(".mh-quality-bulk-bar") || !css.includes(".mh-quality-modal-card")) {
  errors.push("Publication workflow styling is incomplete.");
}
if (!controller.includes("setSelectionRange") || !controller.includes("data-quality-query")) {
  errors.push("Editorial search does not preserve focus during live filtering.");
}
if (!contentRepository.includes("CACHE_VERSION = 14")) {
  errors.push("Content cache version was not invalidated for the publication gate.");
}
if (!conceptRepository.includes("CACHE_VERSION = 2")) {
  errors.push("Concept cache version was not invalidated for publication filtering.");
}

const sqlFiles = findSqlFiles(root);
if (sqlFiles.length) errors.push(`SQL files must stay outside the repository: ${sqlFiles.join(", ")}`);

console.log("MathHard Phase 02B/02C Publication Workflow audit");
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("- verified publication repository contract: present");
  console.log("- individual, batch and duplicate editorial actions: present");
  console.log("- student-safe preview and publication history: present");
  console.log("- catalogue refresh, cache invalidation and editor navigation: present");
  console.log("- live search focus preservation: present");
  console.log("- SQL kept outside Git: confirmed");
  console.log("MathHard Phase 02B/02C Publication Workflow audit passed.");
}
