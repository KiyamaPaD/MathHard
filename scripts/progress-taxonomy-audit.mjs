import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function read(relativePath) {
  const absolutePath = resolve(root, relativePath);
  if (!existsSync(absolutePath)) {
    errors.push(`Missing file: ${relativePath}`);
    return "";
  }
  return readFileSync(absolutePath, "utf8");
}

function requireTokens(source, label, tokens) {
  for (const token of tokens) {
    if (!source.includes(token)) errors.push(`${label} is missing: ${token}`);
  }
}

function forbidTokens(source, label, tokens) {
  for (const token of tokens) {
    if (source.includes(token)) errors.push(`${label} still contains obsolete copy: ${token}`);
  }
}

const app = read("js/app.js");
const appProgress = read("js/app-progress.js");
const analytics = read("js/analytics-controller.js");
const profile = read("profile.html");
const profileJs = read("js/profile.js");
const workspace = read("js/learning-workspace-controller.js");
const secureProblem = read("js/secure-problem-controller.js");
const roadmapModel = read("js/roadmap-model.js");
const problemCss = read("css/problem-workspace.css");

requireTokens(appProgress, "App progress taxonomy", [
  "attemptedProblemSet",
  "openedProblemSet",
  "loadProgressTaxonomy",
  "markProblemOpened",
  "markProblemAttempted"
]);
requireTokens(app, "Index progress UI", [
  "Lecții citite",
  "Lecții învățate",
  "Rezolvate",
  "Încercate",
  "Deschise",
  "Nedeschise",
  "onProblemOpened: markProblemOpened",
  "onProblemAttempted: markProblemAttempted"
]);
requireTokens(analytics, "Analytics taxonomy", [
  "renderProgressTaxonomy",
  "lessonsReadOnly",
  "problemsAttempted",
  "problemsOpened",
  "problemsUnopened",
  "lesson_read"
]);
requireTokens(profile, "Profile taxonomy", [
  "profileRead",
  "detailProblemsAttempted",
  "detailProblemsOpened",
  "detailProblemsUnopened",
  "detailLessonsReadOnly",
  "detailLessonsUnread"
]);
requireTokens(profileJs, "Profile taxonomy loading", ["loadProgressTaxonomy", "counts.readOnly", "counts.attempted"]);
requireTokens(workspace, "Mobile problem navigation", [
  "relatedLesson",
  "Roadmap",
  "aria-label",
  "context || translated(item, lang)"
]);
requireTokens(problemCss, "Mobile problem layout", [
  "grid-template-columns: repeat(3, minmax(0, 1fr))",
  "[data-learning-close]",
  ".mh-problem-progress-box"
]);
requireTokens(secureProblem, "Problem progress panel", [
  "Progres problemă",
  "onProblemOpened(problem.id)",
  "onProblemAttempted(problem.id)",
  "Notița se salvează automat."
]);
requireTokens(roadmapModel, "UBB roadmap copy", [
  "Pregătire UBB — Matematică",
  "Parcurge materia în ordine"
]);

forbidTokens(app, "Student exam copy", [
  "Examen pregătit",
  "Itemii și cheile de corectare nu sunt trimiși în browser",
  "Road to UBB Admitere",
  "Traseu pilot construit peste conținutul MathHard existent",
  "XP total (doar probleme normale)"
]);
forbidTokens(secureProblem, "Problem workspace copy", [
  "După afișarea soluției, problema nu mai acordă XP.",
  "Salvare automată per cont",
  "după reveal"
]);
forbidTokens(workspace, "Problem navigation metadata", ["dificultate", "difficulty ${item.difficulty}"]);

const { normalizeProgressTaxonomy, problemStatusForId } = await import(
  pathToFileURL(resolve(root, "js/progress-taxonomy-model.js")).href
);
const normalized = normalizeProgressTaxonomy({
  lessons: { total: 5, read: 4, learned: 2, read_only: 2, unread: 1, read_ids: ["l1", "l2", "l3", "l4"], learned_ids: ["l1", "l2"] },
  problems: { total: 8, solved: 2, attempted: 2, opened: 1, unopened: 3, solved_ids: ["p1", "p2"], attempted_ids: ["p3", "p4"], opened_ids: ["p5"], unopened_ids: ["p6", "p7", "p8"] }
});
assert.equal(normalized.lessons.readOnly, 2);
assert.equal(normalized.problems.unopened, 3);
assert.equal(problemStatusForId("p3", normalized), "attempted");
assert.equal(problemStatusForId("p5", normalized), "opened");

console.log("MathHard Phase 3B Progress & Mobile UX audit");
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("- read and learned lesson states: present");
  console.log("- solved, attempted, opened and unopened problem states: present");
  console.log("- Index, Profile and Analytics integration: present");
  console.log("- learner-facing technical copy cleanup: confirmed");
  console.log("- compact mobile problem navigation: present");
  console.log("MathHard Phase 3B Progress & Mobile UX audit passed.");
}
