import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  applyBatchItemResult,
  applyRollbackResults,
  createBatchHistoryRecord,
  finalizeBatchHistoryRecord,
  fingerprintBatchSource,
  recoverableBatchItems,
  rollbackCandidateItems
} from "../js/content-batch-history-model.js";
import { createMemoryBatchHistoryRepository } from "../js/content-batch-history-repository.js";
import { retryBatchFailures, rollbackBatchDrafts } from "../js/content-batch-recovery-service.js";
import { analyzeContentBatch } from "../js/content-batch-import-model.js";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const index = read("index.html");
const app = read("js/app.js");
const controller = read("js/content-batch-import-controller.js");
const importRepository = read("js/content-batch-import-repository.js");
const historyRepository = read("js/content-batch-history-repository.js");
const recovery = read("js/content-batch-recovery-service.js");
const css = read("css/content-authoring.css");

const errors = [];
const requireToken = (source, token, label) => {
  if (!source.includes(token)) errors.push(`${label}: ${token}`);
};

requireToken(index, 'data-mh-build="5a7"', "Current build marker is missing");
requireToken(index, '/js/app.js?v=5a7', "Top-level app cache version is stale");
requireToken(app, 'content-batch-import-controller.js?v=5a7', "Batch controller cache version is stale");
requireToken(app, 'getUserId: () => MH_AUTH_USER?.id || ""', "Import history is not scoped to the current account");
requireToken(controller, "createContentBatchHistoryRepository", "Persistent history repository is not mounted");
requireToken(controller, "fingerprintBatchSource", "Repeated batch protection is missing");
requireToken(controller, "retryHistoryBatch", "Failed-item retry action is missing");
requireToken(controller, "rollbackHistoryBatch", "Safe rollback action is missing");
requireToken(controller, "Draft și Nepublicat", "Rollback safety warning is missing");
requireToken(controller, "expandedHistoryId", "Controlled history-card state is missing");
requireToken(controller, "toggleHistoryCard", "Single-click history-card toggle is missing");
requireToken(controller, "data-history-toggle", "Accessible history-card toggle button is missing");
if (controller.includes('<details class="mh-batch-history-card"')) errors.push("History cards still use native details and may lose open state during rerenders.");
requireToken(importRepository, "skipInsert", "Editorial recovery cannot skip an existing content insert");
requireToken(importRepository, "onResult", "Per-item crash recovery checkpoint is missing");
requireToken(historyRepository, "indexedDB.open", "IndexedDB history storage is missing");
requireToken(historyRepository, "MAX_RECORDS_PER_USER = 25", "Per-account history retention is unbounded");
requireToken(recovery, 'quality.status !== "draft"', "Rollback does not enforce Draft status");
requireToken(recovery, 'quality.publication_state !== "unpublished"', "Rollback does not enforce unpublished state");
requireToken(recovery, "deleteAdminContentSafely", "Rollback does not use the safe deletion RPC");
requireToken(css, ".mh-batch-history", "History layout is missing");
requireToken(css, ".mh-batch-history-actions", "Recovery action styles are missing");
requireToken(css, ".mh-batch-history-toggle", "Controlled history-card button styles are missing");
requireToken(css, "user-select:none", "History-card text selection hardening is missing");

const source = JSON.stringify({ items: [
  { type: "lesson", id: "batch-ok", title_ro: "OK" },
  { type: "problem", id: "batch-fail", lesson_id: "batch-ok", answer: "2" }
] });
const analysis = analyzeContentBatch(source);
let record = createBatchHistoryRecord({ userId: "admin-1", source, analysis });
assert.equal(record.status, "importing");
assert.equal(record.items.length, 2);
assert.equal(record.fingerprint, fingerprintBatchSource(source));
record = applyBatchItemResult(record, { ok: true, id: "batch-ok", type: "lesson", contentInserted: true, message: "draft_created" }, 0);
record = applyBatchItemResult(record, { ok: false, id: "batch-fail", type: "problem", contentInserted: false, message: "network" }, 1);
record = finalizeBatchHistoryRecord(record);
assert.equal(record.status, "partial");
assert.equal(record.summary.imported, 1);
assert.equal(record.summary.failed, 1);
assert.equal(recoverableBatchItems(record).length, 1);
assert.equal(rollbackCandidateItems(record).length, 1);

const memory = createMemoryBatchHistoryRepository();
await memory.save("admin-1", record);
assert.equal((await memory.list("admin-1")).length, 1);
assert.equal((await memory.list("admin-2")).length, 0);
assert.equal((await memory.get("admin-1", record.id)).status, "partial");

const insertCalls = [];
const rpcCalls = [];
const retrySupabase = {
  auth: { getUser: async () => ({ data: { user: { id: "admin-1" } }, error: null }) },
  from: (table) => ({ insert: async (payload) => { insertCalls.push({ table, payload }); return { error: null }; } }),
  rpc: async (name, args) => { rpcCalls.push({ name, args }); return { data: { ok: true }, error: null }; }
};
const retryRecord = {
  ...record,
  items: record.items.map((item) => item.id === "batch-fail" ? { ...item, contentInserted: true } : item)
};
const retried = await retryBatchFailures(retrySupabase, retryRecord, { existingIds: { problem: ["batch-fail"] } });
assert.equal(retried[0].ok, true);
assert.equal(retried[0].recoveredExisting, true);
assert.equal(insertCalls.length, 0);
assert.ok(rpcCalls.some((entry) => entry.name === "mh_admin_save_content_quality"));

const rollbackRpcCalls = [];
const rollbackSupabase = {
  auth: { getUser: async () => ({ data: { user: { id: "admin-1" } }, error: null }) },
  rpc: async (name, args) => {
    rollbackRpcCalls.push({ name, args });
    if (name === "mh_admin_get_content_quality_dashboard") {
      return { data: { items: [
        { content_type: "lesson", content_id: "batch-ok", status: "draft", publication: { state: "unpublished", published: false } }
      ] }, error: null };
    }
    return { data: { ok: true }, error: null };
  }
};
const rollbackResults = await rollbackBatchDrafts(rollbackSupabase, record);
assert.equal(rollbackResults[0].ok, true);
assert.ok(rollbackRpcCalls.some((entry) => entry.name === "mh_admin_delete_content_safe"));
const rolledBack = applyRollbackResults(record, rollbackResults);
assert.equal(rolledBack.status, "rolled_back");
assert.equal(rolledBack.summary.rolledBack, 1);

const publishedSupabase = {
  ...rollbackSupabase,
  rpc: async (name) => name === "mh_admin_get_content_quality_dashboard"
    ? { data: { items: [{ content_type: "lesson", content_id: "batch-ok", status: "verified", publication: { state: "published", published: true } }] }, error: null }
    : { data: { ok: true }, error: null }
};
const blockedRollback = await rollbackBatchDrafts(publishedSupabase, record);
assert.equal(blockedRollback[0].ok, false);
assert.equal(blockedRollback[0].eligible, false);

console.log("MathHard Phase 5A.6 Import History & Recovery audit");
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exitCode = 1;
} else {
  console.log("- per-account IndexedDB import history: present");
  console.log("- per-item checkpoints and interrupted import recovery: present");
  console.log("- failed-item retry without duplicate insertion: present");
  console.log("- Draft + Unpublished rollback gate: present");
  console.log("- safe deletion RPC and rollback reporting: present");
  console.log("- one-click controlled history-card interaction: present");
  console.log("MathHard Phase 5A.6 Import History & Recovery audit passed.");
}
