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
    if ([".git", "node_modules", "local-sql"].includes(name)) continue;
    const absolute = join(directory, name);
    const relative = prefix ? `${prefix}/${name}` : name;
    if (statSync(absolute).isDirectory()) rows.push(...findSqlFiles(absolute, relative));
    else if (name.toLowerCase().endsWith(".sql")) rows.push(relative);
  }
  return rows;
}

const app = read("js/app.js");
const repository = read("js/concept-repository.js");
const model = read("js/concept-model.js");
const admin = read("js/concept-admin-controller.js");
const roadmap = read("js/roadmap-controller.js");
const studioCss = read("css/concept-studio.css");
const roadmapCss = read("css/roadmap.css");

if (!repository.includes("mh_admin_get_concept_coverage") || !repository.includes("loadConceptCoverage")) {
  errors.push("Concept repository is missing the admin coverage RPC.");
}
if (!model.includes("normalizeConceptCoverage") ||
    !model.includes("buildRoadmapConceptCoverage") ||
    !model.includes("conceptsForRoadmapNode")) {
  errors.push("Concept coverage model helpers are incomplete.");
}
if (!admin.includes('data-concept-view="coverage"') || !admin.includes("renderCoverage")) {
  errors.push("Concept Admin Studio is missing the coverage view.");
}
if (!roadmap.includes("mh-roadmap-node-concepts") || !roadmap.includes("buildRoadmapConceptCoverage")) {
  errors.push("Roadmap concept integration is missing.");
}
if (!app.includes("getConceptCatalog: () => CONCEPT_CATALOG")) {
  errors.push("app.js does not provide Concept Layer data to the roadmap controller.");
}
if (!studioCss.includes(".mh-concept-coverage") || !roadmapCss.includes(".mh-roadmap-node-concepts")) {
  errors.push("Concept coverage or roadmap concept styles are missing.");
}

const sqlFiles = findSqlFiles(root);
if (sqlFiles.length) errors.push(`SQL files must stay outside the repository: ${sqlFiles.join(", ")}`);

console.log("MathHard Concept Coverage audit");
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("- admin coverage RPC contract: present");
  console.log("- coverage normalization and metrics: present");
  console.log("- Admin Studio coverage view: present");
  console.log("- roadmap concept chips and coverage: present");
  console.log("- SQL kept outside Git: confirmed");
  console.log("MathHard Concept Coverage audit passed.");
}
