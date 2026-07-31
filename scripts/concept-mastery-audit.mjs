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

const model = read("js/concept-mastery-model.js");
const repository = read("js/concept-mastery-repository.js");
const analyticsRepository = read("js/analytics-repository.js");
const controller = read("js/analytics-controller.js");
const css = read("css/analytics.css");

if (!repository.includes('"mh_get_concept_mastery"')) {
  errors.push("Concept mastery repository is missing mh_get_concept_mastery().");
}
if (!repository.includes("not_installed") || !repository.includes("PGRST202")) {
  errors.push("Concept mastery must fail softly when SQL 048 is not installed yet.");
}
if (!model.includes("normalizeConceptMasteryPayload") ||
    !model.includes("buildConceptMasteryHighlights") ||
    !model.includes("conceptTitle")) {
  errors.push("Concept mastery model helpers are incomplete.");
}
if (!analyticsRepository.includes("loadConceptMastery") || !analyticsRepository.includes("Promise.all")) {
  errors.push("Analytics must load base analytics and concept mastery in parallel.");
}
if (!controller.includes("renderConceptMastery") ||
    !controller.includes("mh-analytics-concept-mastery") ||
    !controller.includes("conceptMasteryHint")) {
  errors.push("Analytics concept mastery rendering is incomplete.");
}
if (!css.includes(".mh-analytics-concept-mastery") ||
    !css.includes(".mh-analytics-concept-columns") ||
    !css.includes(".mh-analytics-concept-row")) {
  errors.push("Concept mastery responsive styles are incomplete.");
}

const sqlFiles = findSqlFiles(root);
if (sqlFiles.length) errors.push(`SQL files must stay outside the repository: ${sqlFiles.join(", ")}`);

console.log("MathHard Concept Mastery audit");
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("- secure derived mastery repository: present");
  console.log("- normalized concept evidence model: present");
  console.log("- Analytics integration and deploy fallback: present");
  console.log("- responsive mastery UI: present");
  console.log("- SQL kept outside Git: confirmed");
  console.log("MathHard Concept Mastery audit passed.");
}
