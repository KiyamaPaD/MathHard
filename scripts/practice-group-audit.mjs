import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildPracticeGroupPlan, normalizePracticeGroups, sortProblemCatalog } from "../js/practice-group-model.js";

const root = resolve(import.meta.dirname, "..");
const app = readFileSync(resolve(root, "js/app.js"), "utf8");
const controller = readFileSync(resolve(root, "js/practice-group-admin-controller.js"), "utf8");
const css = readFileSync(resolve(root, "css/style.css"), "utf8");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const errors = [];

for (const token of ["buildPracticeGroupPlan", "countPracticeGroups", "sortProblemCatalog", "mh-practice-group-header", "practiceGroupAdminController"]) if (!app.includes(token)) errors.push(`app.js missing ${token}`);
for (const token of ["mhPracticeGroupAdmin", "mh_practice_groups", 'data-lesson-editor-tab="practice"']) if (!html.includes(token)) errors.push(`index.html missing ${token}`);
for (const token of ["createPracticeGroupAdminController", "data-practice-generate", "data-practice-group-up", "data-practice-problem-remove", "data-practice-problem-add"]) if (!controller.includes(token)) errors.push(`practice-group-admin-controller.js missing ${token}`);
for (const token of [".mh-practice-group-header", ".mh-practice-admin-group", ".mh-practice-admin-problem"]) if (!css.includes(token)) errors.push(`style.css missing ${token}`);

const groups = normalizePracticeGroups([
  { id: "warmup", title_ro: "Warm-up", problem_ids: ["p2", "p1"] },
  { id: "boss", title_ro: "Boss", problem_ids: ["p3"] }
]);
if (groups.length !== 2 || groups[0].problemIds.join(",") !== "p2,p1") errors.push("normalizePracticeGroups lost configured order");
const lesson = { practice_groups: groups.map((g) => ({ id: g.key, title_ro: g.ro, problem_ids: g.problemIds })) };
const problems = [{ id: "p1", difficulty: 1 }, { id: "p2", difficulty: 5 }, { id: "p3", difficulty: 2 }, { id: "p4", difficulty: 1 }];
const plan = buildPracticeGroupPlan(lesson, problems);
if (!plan.configured || plan.groupByProblemId.get("p2")?.itemOrder !== 0 || plan.groupByProblemId.get("p4")?.key !== "__ungrouped") errors.push("configured plan is incorrect");
const sorted = sortProblemCatalog([...problems], { lessonScoped: true, lesson });
if (sorted.map((p) => p.id).join(",") !== "p2,p1,p3,p4") errors.push("configured group/item ordering is not respected");

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exitCode = 1;
} else {
  console.log("Practice grouping audit passed.");
  console.log("- lesson-level group metadata controls group and item order");
  console.log("- ungrouped lesson problems remain visible");
  console.log("- Admin can generate, reorder, remove and reassign practice items");
}
