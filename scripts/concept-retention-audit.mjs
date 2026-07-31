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

const model = read("js/concept-retention-model.js");
const repository = read("js/concept-retention-repository.js");
const analyticsRepository = read("js/analytics-repository.js");
const controller = read("js/analytics-controller.js");
const css = read("css/analytics.css");

if (!repository.includes('"mh_get_concept_retention"')) {
  errors.push("Concept retention repository is missing mh_get_concept_retention().");
}
if (!repository.includes("not_installed") || !repository.includes("PGRST202")) {
  errors.push("Concept retention must fail softly when SQL 049 is not installed yet.");
}
if (!model.includes("normalizeConceptRetentionPayload") ||
    !model.includes("buildConceptReviewQueue") ||
    !model.includes("retentionConceptTitle")) {
  errors.push("Concept retention model helpers are incomplete.");
}
if (!analyticsRepository.includes("loadConceptRetention") ||
    !analyticsRepository.includes("conceptRetention")) {
  errors.push("Analytics must load concept retention with the existing analytics payload.");
}
if (!controller.includes("renderConceptRetention") ||
    !controller.includes("mh-analytics-concept-retention") ||
    !controller.includes("retentionHint")) {
  errors.push("Analytics concept retention rendering is incomplete.");
}
if (!css.includes(".mh-analytics-concept-retention") ||
    !css.includes(".mh-analytics-review-row") ||
    !css.includes(".mh-analytics-retention-track")) {
  errors.push("Concept retention responsive styles are incomplete.");
}

const sqlFiles = findSqlFiles(root);
if (sqlFiles.length) errors.push(`SQL files must stay outside the repository: ${sqlFiles.join(", ")}`);

console.log("MathHard Concept Retention audit");
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("- server-derived retention repository: present");
  console.log("- normalized review queue model: present");
  console.log("- Analytics review plan and deploy fallback: present");
  console.log("- responsive retention UI: present");
  console.log("- SQL kept outside Git: confirmed");
  console.log("MathHard Concept Retention audit passed.");
}
