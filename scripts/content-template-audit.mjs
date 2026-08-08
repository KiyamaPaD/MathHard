import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { evaluateContentDraft } from "../js/content-authoring-model.js";
import {
  CONTENT_TEMPLATES,
  contentTemplateById,
  contentTemplatesForType,
  hasTemplatePlaceholder,
  templatePlaceholderCount
} from "../js/content-template-model.js";
import { applyContentTemplate } from "../js/content-template-controller.js";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const index = read("index.html");
const app = read("js/app.js");
const bootstrap = read("js/content-authoring-bootstrap.js");
const controller = read("js/content-template-controller.js");
const model = read("js/content-template-model.js");
const authoringModel = read("js/content-authoring-model.js");
const css = read("css/content-authoring.css");
const errors = [];
const requireToken = (source, token, label) => { if (!source.includes(token)) errors.push(`${label}: ${token}`); };

requireToken(index, 'data-mh-build="5a7"', "Build marker is stale");
requireToken(index, 'id="mhContentTemplateStudio"', "Template host is missing");
requireToken(index, 'css/content-authoring.css?v=5a7', "Template CSS cache version is stale");
requireToken(app, "contentTemplateController", "Template controller state is not mounted");
requireToken(app, "runtime.mountContentTemplates", "Template runtime is not connected to the Editor");
requireToken(app, "contentTemplateController?.refreshLanguage()", "Template localization refresh is missing");
requireToken(bootstrap, "createContentTemplateController", "Template controller is not isolated behind authoring bootstrap");
requireToken(bootstrap, "mountContentTemplates", "Template mount contract is missing");
requireToken(controller, "isSafeToFill", "Non-destructive template application is missing");
requireToken(controller, "idInput?.disabled", "Templates are not restricted from edit mode");
requireToken(controller, "dispatchFieldChange", "Template application does not notify autosave/preflight listeners");
requireToken(model, "lesson-standard", "Standard lesson template is missing");
requireToken(model, "lesson-proof", "Proof lesson template is missing");
requireToken(model, "research-note", "Research template is missing");
requireToken(model, "history-concept", "History template is missing");
requireToken(model, "problem-standard", "Standard problem template is missing");
requireToken(model, "problem-admission", "Admission problem template is missing");
requireToken(model, "problem-olympiad", "Olympiad problem template is missing");
requireToken(model, "exam-practice", "Practice exam template is missing");
requireToken(model, "exam-bac", "BAC template is missing");
requireToken(model, "exam-admission", "Admission exam template is missing");
requireToken(authoringModel, "TEMPLATE_PLACEHOLDER_PATTERN", "Draft readiness does not recognize template placeholders");
requireToken(css, ".mh-content-template-panel", "Template panel styling is missing");
requireToken(css, ".mh-content-template-controls", "Template controls styling is missing");

assert.equal(CONTENT_TEMPLATES.length, 10);
assert.equal(contentTemplatesForType("lesson", "ro").length, 2);
assert.equal(contentTemplatesForType("problem", "ro").length, 3);
assert.equal(contentTemplatesForType("exam", "en").length, 3);
assert.equal(contentTemplatesForType("research", "ro").length, 1);
assert.equal(contentTemplatesForType("history", "ro").length, 1);
assert.equal(contentTemplatesForType("unknown", "ro")[0].id, "lesson-standard");
assert.equal(hasTemplatePlaceholder("Text [[de completat]]"), true);
assert.equal(hasTemplatePlaceholder("Text final"), false);
assert.equal(templatePlaceholderCount("[[a]] + [[b]]"), 2);
assert.equal(contentTemplateById("problem-olympiad").fields.mh_olymp_level, "nationala");

const templateLesson = contentTemplateById("lesson-standard");
const readiness = evaluateContentDraft({
  type: "lesson",
  payload: {
    id: "v-template-test",
    title_ro: "Titlu",
    title_en: "Title",
    body_ro: templateLesson.fields.mh_body_ro,
    body_en: templateLesson.fields.mh_body_en,
    sources: [templateLesson.fields.mh_sources]
  }
});
assert.equal(readiness.readyForReview, false);
assert.ok(readiness.blockers.some((check) => check.id === "body_ro"));
assert.ok(readiness.blockers.some((check) => check.id === "source"));

function fakeField(id, value = "") {
  return { id, value, events: [], dispatchEvent(event) { this.events.push(event.type); return true; } };
}
const fields = new Map([
  ["mh_difficulty", fakeField("mh_difficulty", "1")],
  ["mh_statement_ro", fakeField("mh_statement_ro", "Enunț deja scris")],
  ["mh_statement_en", fakeField("mh_statement_en", "")],
  ["mh_hint1_ro", fakeField("mh_hint1_ro", "")],
  ["mh_hint1_en", fakeField("mh_hint1_en", "")],
  ["mh_hint2_ro", fakeField("mh_hint2_ro", "")],
  ["mh_hint2_en", fakeField("mh_hint2_en", "")],
  ["mh_solution_ro", fakeField("mh_solution_ro", "")],
  ["mh_solution_en", fakeField("mh_solution_en", "")],
  ["mh_explanation_simple_ro", fakeField("mh_explanation_simple_ro", "")],
  ["mh_explanation_simple_en", fakeField("mh_explanation_simple_en", "")],
  ["mh_explanation_boss_ro", fakeField("mh_explanation_boss_ro", "")],
  ["mh_explanation_boss_en", fakeField("mh_explanation_boss_en", "")],
  ["mh_source", fakeField("mh_source", "")]
]);
const fakeForm = { querySelector(selector) { return fields.get(selector.slice(1)) || null; } };
const applied = applyContentTemplate(fakeForm, "problem-standard");
assert.equal(fields.get("mh_difficulty").value, "2");
assert.equal(fields.get("mh_statement_ro").value, "Enunț deja scris");
assert.ok(fields.get("mh_statement_en").value.includes("[[problem statement]]"));
assert.ok(applied.preserved.includes("mh_statement_ro"));
assert.ok(applied.changed.includes("mh_difficulty"));

console.log("MathHard Phase 5A.7 Content Templates audit");
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exitCode = 1;
} else {
  console.log("- type-aware lesson/problem/exam templates: present");
  console.log("- research and history templates: present");
  console.log("- non-destructive fill policy: verified");
  console.log("- template placeholders remain editorial blockers: verified");
  console.log("- create-mode guard and responsive UI: present");
  console.log("MathHard Phase 5A.7 Content Templates audit passed.");
}
