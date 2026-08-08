import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  analyzeContentBatch,
  batchExample,
  normalizeContentBatchItem,
  parseContentBatchJson
} from "../js/content-batch-import-model.js";
import { importContentBatchItems } from "../js/content-batch-import-repository.js";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const index = read("index.html");
const app = read("js/app.js");
const controller = read("js/content-batch-import-controller.js");
const repository = read("js/content-batch-import-repository.js");
const model = read("js/content-batch-import-model.js");
const css = read("css/content-authoring.css");

const errors = [];
const requireToken = (source, token, label) => {
  if (!source.includes(token)) errors.push(`${label}: ${token}`);
};

requireToken(index, 'data-mh-build="5a7"', "Current build marker is missing");
requireToken(index, 'id="mhContentBatchImport"', "Batch intake host is missing");
requireToken(index, 'css/content-authoring.css?v=5a7', "Batch intake CSS cache version is stale");
requireToken(app, 'import("./content-batch-import-controller.js?v=5a7")', "Batch intake controller is not lazy-loaded");
requireToken(app, "createContentBatchImportController", "Batch intake controller is not mounted");
requireToken(app, "getCatalog: () => DATA", "Current catalog is not supplied to batch validation");
requireToken(app, "contentBatchImportController?.reset()", "Batch source is not cleared across account changes");
requireToken(controller, "analyzeContentBatch", "Batch validation is missing");
requireToken(repository, ".insert(item.payload)", "Batch import must be create-only");
requireToken(repository, "saveEditorialDraft", "Imported content is not initialized as Draft");
requireToken(repository, "replaceContentConcepts", "Batch concept mappings are not persisted");
requireToken(controller, "importContentBatchItems", "Batch controller does not use the tested import service");
requireToken(model, "existing_id", "Existing ID protection is missing");
requireToken(model, "CONTENT_BATCH_LIMIT = 100", "Batch item limit is missing");
requireToken(model, "CONTENT_BATCH_MAX_BYTES", "Batch byte limit is missing");
requireToken(css, ".mh-content-batch", "Batch intake layout is missing");
requireToken(css, ".mh-batch-table", "Batch validation table styles are missing");

const example = analyzeContentBatch(batchExample(), { existingIds: {} });
assert.equal(example.globalErrors.length, 0);
assert.equal(example.summary.total, 2);
assert.equal(example.summary.valid, 2);
assert.equal(example.summary.readyForReview, 2);
assert.equal(example.canImport, true);

const existing = analyzeContentBatch(batchExample(), {
  existingIds: { lesson: ["v-exemplu-lectie"] }
});
assert.equal(existing.summary.invalid, 1);
assert.ok(existing.items[0].errors.includes("existing_id"));
assert.equal(existing.validItems.some((item) => item.payload.id === "v-exemplu-lectie"), false);

const incomplete = analyzeContentBatch(JSON.stringify([
  { type: "lesson", id: "v-draft-minim", title_ro: "Draft minim" }
]));
assert.equal(incomplete.summary.valid, 1);
assert.equal(incomplete.summary.incompleteDrafts, 1);
assert.equal(incomplete.items[0].readiness.readyForReview, false);

const duplicateLessonStorage = analyzeContentBatch(JSON.stringify([
  { type: "lesson", id: "shared-id", title_ro: "Lecție" },
  { type: "research", id: "shared-id", title_ro: "Cercetare" }
]));
assert.equal(duplicateLessonStorage.summary.invalid, 1);
assert.ok(duplicateLessonStorage.items[1].errors.includes("duplicate_batch_id"));

const exam = normalizeContentBatchItem({
  type: "exam",
  payload: {
    id: "ubb-test-2027",
    type: "admitere",
    year: 2027,
    title_ro: "Test",
    title_en: "Test",
    default_hours: 3,
    credit_html: "MathHard",
    items: [{ id: "p1", type: "open", points: 1, prompt_ro: "1+1", prompt_en: "1+1", answer: "2" }]
  }
});
assert.equal(exam.payload.type, "admitere");
assert.deepEqual(exam.errors, []);
assert.equal(exam.readiness.readyForReview, true);

assert.throws(() => parseContentBatchJson("{}"), /batch_must_be_array/);
assert.throws(() => parseContentBatchJson("[]"), /empty_batch/);

const inserted = [];
const rpcCalls = [];
const supabase = {
  auth: { getUser: async () => ({ data: { user: { id: "admin-audit" } }, error: null }) },
  from: (table) => ({ insert: async (payload) => { inserted.push({ table, payload }); return { error: null }; } }),
  rpc: async (name, args) => { rpcCalls.push({ name, args }); return { data: { ok: true }, error: null }; }
};
const runtimeDraft = normalizeContentBatchItem({ type: "lesson", id: "runtime-batch", title_ro: "Runtime" });
runtimeDraft.valid = true;
const runtimeResults = await importContentBatchItems(supabase, [runtimeDraft]);
assert.equal(runtimeResults[0].ok, true);
assert.equal(inserted[0].table, "mh_lessons");
assert.ok(rpcCalls.some((entry) => entry.name === "mh_admin_save_content_quality"));
assert.equal(rpcCalls.some((entry) => entry.name === "mh_admin_publish_content"), false);

console.log("MathHard Phase 5A.5 Batch Content Intake audit");
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exitCode = 1;
} else {
  console.log("- JSON/file batch intake UI: present");
  console.log("- create-only ID collision protection: present");
  console.log("- draft readiness and structural validation: present");
  console.log("- imported items initialize as unpublished Drafts: present");
  console.log("- account-switch memory isolation: present");
  console.log("MathHard Phase 5A.5 Batch Content Intake audit passed.");
}
