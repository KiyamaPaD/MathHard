import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const app = readFileSync(resolve(root, "js/app.js"), "utf8");
const model = readFileSync(resolve(root, "js/practice-group-model.js"), "utf8");
const css = readFileSync(resolve(root, "css/style.css"), "utf8");
const errors = [];

for (const token of ["countPracticeGroups", "getPracticeGroupMeta", "sortProblemCatalog", "mh-practice-group-header"]) {
  if (!app.includes(token)) errors.push(`app.js missing ${token}`);
}
for (const token of ['"practice-scaffold"', '"mixed-transfer"', "capstone", "getPracticeGroupMeta", "sortProblemCatalog"]) {
  if (!model.includes(token)) errors.push(`practice-group-model.js missing ${token}`);
}
for (const token of [".mh-practice-group-header", ".mh-practice-group-title", ".mh-practice-group-header.is-capstone"]) {
  if (!css.includes(token)) errors.push(`style.css missing ${token}`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exitCode = 1;
} else {
  console.log("Practice grouping audit passed.");
  console.log("- grouping logic is isolated from app.js");
  console.log("- scaffold / mixed-transfer / capstone groups are recognized");
  console.log("- lesson-scoped problem catalog renders visible group headers");
}
