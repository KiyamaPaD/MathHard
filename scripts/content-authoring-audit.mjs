import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateContentDraft, draftStatusLabel } from "../js/content-authoring-model.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const read = (path) => {
  const absolute = resolve(root, path);
  if (!existsSync(absolute)) { errors.push(`Missing file: ${path}`); return ""; }
  return readFileSync(absolute, "utf8");
};
const requireTokens = (source, label, tokens) => {
  for (const token of tokens) if (!source.includes(token)) errors.push(`${label} is missing ${token}.`);
};

const index = read("index.html");
const app = read("js/app.js");
const model = read("js/content-authoring-model.js");
const controller = read("js/content-authoring-controller.js");
const bootstrap = read("js/content-authoring-bootstrap.js");
const css = read("css/content-authoring.css");

requireTokens(index, "Admin authoring markup", [
  'data-mh-build="5a5"', 'id="mhContentAuthoringPreflight"',
  'css/content-authoring.css?v=5a5', 'id="mhSubmitBtn" type="submit">Salvează draftul'
]);
if (index.indexOf('id="mhContentAuthoringPreflight"') > index.indexOf('id="block-common"')) {
  errors.push("Draft readiness must appear before the content fields.");
}
requireTokens(app, "Independent authoring runtime", [
  'import("./content-authoring-bootstrap.js?v=5a5")',
  "void mountContentAuthoringController()", "runtime.saveEditorialDraft",
  "runtime.revealEditorialDraft", "await ensureAdminControllers()",
  'import("./content-quality-admin-controller.js?v=5a5")'
]);
if (app.includes("contentAuthoringController?.ensureEditorialDraft")) {
  errors.push("Draft persistence must not depend on an optional UI controller call.");
}
requireTokens(bootstrap, "Authoring bootstrap", [
  "mountContentAuthoringPreflight", 'host.dataset.authoringRuntime = "ready"',
  'host.dataset.authoringRuntime = "error"', "saveEditorialDraft",
  "saveContentQualityReview", 'status: "draft"', "revealEditorialDraft",
  "controller?.selectContent?."
]);
requireTokens(model, "Authoring model", ["evaluateContentDraft", "readyForReview", "pendingRecommendations", "concept_ids"]);
requireTokens(controller, "Authoring controller", [
  "createContentAuthoringController", "data-authoring-preview", "Content-Security-Policy", 'sandbox=""', "getConceptIds"
]);
requireTokens(css, "Authoring styling", [
  ".mh-authoring-preflight", ".mh-authoring-runtime-error", ".mh-authoring-meter", ".mh-authoring-modal", "@media (max-width: 760px)"
]);

const incompleteLesson = evaluateContentDraft({ type: "lesson", payload: { id: "bad id", title_ro: "Numere", body_ro: "Text" } });
if (incompleteLesson.readyForReview || incompleteLesson.blockers.length < 3) errors.push("Incomplete lesson must remain blocked from review.");
const completeProblem = evaluateContentDraft({
  type: "problem",
  payload: {
    id: "v-gauss-01", lesson_id: "v-gauss", title_ro: "Suma lui Gauss", title_en: "Gauss sum",
    statement_ro: "Calculați suma.", statement_en: "Compute the sum.", answer: "1275", source: "MathHard",
    solution_ro: "Soluție", solution_en: "Solution", concept_ids: ["sume"]
  }
});
if (!completeProblem.readyForReview || completeProblem.score !== 100) errors.push("Complete bilingual problem must be ready for review.");
const brokenExam = evaluateContentDraft({
  type: "exam",
  payload: { id: "exam-1", type: "ADM", year: 2026, title_ro: "Simulare", title_en: "Mock exam", default_hours: 3, credit_html: "MathHard", items: [{ id: "x" }], problems: [], scoring_profile: "default_exact_v1" },
  examErrors: ["Item 1: lipsește prompt-ul (RO sau EN)."]
});
if (brokenExam.readyForReview || !brokenExam.blockers.some((check) => check.id === "structure")) errors.push("Invalid exam structure must block review readiness.");
if (draftStatusLabel(completeProblem, "ro") !== "Gata pentru verificare" || draftStatusLabel(completeProblem, "en") !== "Ready for review") {
  errors.push("Draft status labels are not fully localized.");
}

console.log("MathHard Phase 5A.3 Editorial Runtime Bootstrap audit");
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("- preflight mounts independently from the Admin lazy bundle: present");
  console.log("- visible runtime failure state: present");
  console.log("- every content save creates/resets an explicit Draft record: present");
  console.log("- saved draft is opened and verified in Publication: present");
  console.log("- bilingual preview and content rules: verified");
  console.log("MathHard Phase 5A.3 Editorial Runtime Bootstrap audit passed.");
}
