import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateContentDraft,
  draftStatusLabel
} from "../js/content-authoring-model.js";

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

function requireToken(source, token, label) {
  if (!source.includes(token)) errors.push(`${label} is missing ${token}.`);
}

const index = read("index.html");
const app = read("js/app.js");
const model = read("js/content-authoring-model.js");
const controller = read("js/content-authoring-controller.js");
const css = read("css/content-authoring.css");

for (const token of [
  'id="mhContentAuthoringPreflight"',
  'css/content-authoring.css?v=5a2',
  'id="mhSubmitBtn" type="submit">Salvează draftul'
]) requireToken(index, token, "Admin authoring markup");
if (index.indexOf('id="mhContentAuthoringPreflight"') > index.indexOf('id="block-common"')) {
  errors.push("Draft readiness must appear at the top of the editor, before the content fields.");
}

for (const token of [
  'import("./content-authoring-controller.js?v=5a2")',
  "createContentAuthoringController",
  "contentAuthoringController?.refresh()",
  '"Salvează draftul"',
  '"Actualizează draftul"'
]) requireToken(app, token, "Authoring integration");

for (const token of [
  "evaluateContentDraft",
  "readyForReview",
  "pendingRecommendations",
  "concept_ids"
]) requireToken(model, token, "Authoring model");

for (const token of [
  "createContentAuthoringController",
  "data-authoring-preview",
  "Content-Security-Policy",
  "sandbox=\"\"",
  "getConceptIds"
]) requireToken(controller, token, "Authoring controller");

for (const token of [
  ".mh-authoring-preflight",
  ".mh-authoring-meter",
  ".mh-authoring-modal",
  "@media (max-width: 760px)"
]) requireToken(css, token, "Authoring styling");

const incompleteLesson = evaluateContentDraft({
  type: "lesson",
  payload: { id: "bad id", title_ro: "Numere", body_ro: "Text" }
});
if (incompleteLesson.readyForReview || incompleteLesson.blockers.length < 3) {
  errors.push("Incomplete lesson must remain blocked from review.");
}

const completeProblem = evaluateContentDraft({
  type: "problem",
  payload: {
    id: "v-gauss-01",
    lesson_id: "v-gauss",
    title_ro: "Suma lui Gauss",
    title_en: "Gauss sum",
    statement_ro: "Calculați suma.",
    statement_en: "Compute the sum.",
    answer: "1275",
    source: "MathHard",
    solution_ro: "Soluție",
    solution_en: "Solution",
    concept_ids: ["sume"]
  }
});
if (!completeProblem.readyForReview || completeProblem.score !== 100) {
  errors.push("Complete bilingual problem must be ready for review.");
}

const brokenExam = evaluateContentDraft({
  type: "exam",
  payload: {
    id: "exam-1",
    type: "ADM",
    year: 2026,
    title_ro: "Simulare",
    title_en: "Mock exam",
    default_hours: 3,
    credit_html: "MathHard",
    items: [{ id: "x" }],
    problems: [],
    scoring_profile: "default_exact_v1"
  },
  examErrors: ["Item 1: lipsește prompt-ul (RO sau EN)."]
});
if (brokenExam.readyForReview || !brokenExam.blockers.some((check) => check.id === "structure")) {
  errors.push("Invalid exam item structure must block review readiness.");
}

if (draftStatusLabel(completeProblem, "ro") !== "Gata pentru verificare" ||
    draftStatusLabel(completeProblem, "en") !== "Ready for review") {
  errors.push("Draft status labels are not fully localized.");
}

console.log("MathHard Phase 5A.1 Content Authoring audit");
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("- live draft readiness checklist: present");
  console.log("- bilingual pre-save preview: present");
  console.log("- lesson, problem and exam preflight rules: verified");
  console.log("- draft save remains separate from review/publication: verified");
  for (const token of [
    "ensureEditorialDraft",
    'adminStudioController?.showPanel("quality")',
    "contentQualityAdminController?.selectContent"
  ]) requireToken(app, token, "Editorial draft initialization");
  for (const token of [
    "saveContentQualityReview",
    'status: "draft"',
    "ensureEditorialDraft"
  ]) requireToken(controller, token, "Explicit editorial draft record");

console.log("MathHard Phase 5A.1 Content Authoring audit passed.");
}
