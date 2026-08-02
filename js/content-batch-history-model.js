const BATCH_STATUSES = new Set([
  "importing",
  "completed",
  "partial",
  "failed",
  "interrupted",
  "rolling_back",
  "rollback_partial",
  "rolled_back"
]);

function text(value) {
  return String(value ?? "").trim();
}

function nowIso() {
  return new Date().toISOString();
}

function randomPart() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function fingerprintBatchSource(source) {
  const input = String(source ?? "").replace(/\r\n?/g, "\n").trim();
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a-${hash.toString(16).padStart(8, "0")}-${input.length}`;
}

export function batchHistoryStatusLabel(status, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  const labels = english
    ? {
        importing: "Importing",
        completed: "Completed",
        partial: "Partial",
        failed: "Failed",
        interrupted: "Interrupted",
        rolling_back: "Rolling back",
        rollback_partial: "Partial rollback",
        rolled_back: "Rolled back"
      }
    : {
        importing: "Se importă",
        completed: "Finalizat",
        partial: "Parțial",
        failed: "Eșuat",
        interrupted: "Întrerupt",
        rolling_back: "Se anulează",
        rollback_partial: "Anulare parțială",
        rolled_back: "Anulat"
      };
  return labels[BATCH_STATUSES.has(status) ? status : "failed"];
}

export function createBatchHistoryRecord({ userId, source, analysis } = {}) {
  const createdAt = nowIso();
  const items = (analysis?.validItems || []).map((item) => ({
    index: Number(item.index || 0),
    type: text(item.type),
    storageType: text(item.storageType),
    table: text(item.table),
    id: text(item.payload?.id),
    state: "pending",
    ok: false,
    contentInserted: false,
    message: "pending",
    rollbackState: "not_checked",
    retryItem: item
  }));
  return {
    id: `batch-${randomPart()}`,
    userId: text(userId),
    fingerprint: fingerprintBatchSource(source),
    createdAt,
    updatedAt: createdAt,
    status: "importing",
    sourceBytes: typeof TextEncoder === "function" ? new TextEncoder().encode(String(source || "")).byteLength : String(source || "").length,
    summary: {
      total: Number(analysis?.summary?.total || items.length),
      attempted: items.length,
      imported: 0,
      failed: 0,
      pending: items.length,
      rolledBack: 0,
      readyForReview: Number(analysis?.summary?.readyForReview || 0),
      incompleteDrafts: Number(analysis?.summary?.incompleteDrafts || 0)
    },
    items
  };
}

function summarize(items = []) {
  const imported = items.filter((item) => item.ok).length;
  const failed = items.filter((item) => item.state === "failed").length;
  const pending = items.filter((item) => item.state === "pending").length;
  const rolledBack = items.filter((item) => item.rollbackState === "rolled_back").length;
  return { imported, failed, pending, rolledBack };
}

export function applyBatchItemResult(record, result, position) {
  const items = [...(record?.items || [])];
  const index = Number.isInteger(position)
    ? position
    : items.findIndex((item) => item.id === result?.id && item.type === result?.type && item.state === "pending");
  if (index < 0 || !items[index]) return record;
  const current = items[index];
  items[index] = {
    ...current,
    state: result?.ok ? "imported" : "failed",
    ok: Boolean(result?.ok),
    contentInserted: Boolean(result?.contentInserted || result?.ok),
    message: text(result?.message || (result?.ok ? "draft_created" : "failed")),
    rollbackState: result?.ok ? "available" : current.rollbackState,
    retryItem: result?.ok ? null : current.retryItem
  };
  const counts = summarize(items);
  return {
    ...record,
    updatedAt: nowIso(),
    items,
    summary: { ...record.summary, ...counts }
  };
}

export function finalizeBatchHistoryRecord(record) {
  const counts = summarize(record?.items || []);
  const status = counts.pending
    ? "interrupted"
    : counts.imported && counts.failed
      ? "partial"
      : counts.imported
        ? "completed"
        : "failed";
  return {
    ...record,
    status,
    updatedAt: nowIso(),
    summary: { ...record.summary, ...counts }
  };
}

export function mergeBatchRetryResults(record, results = []) {
  let next = { ...record, status: "importing", updatedAt: nowIso() };
  for (const result of results) {
    const position = next.items.findIndex((item) => item.id === result.id && item.type === result.type && !item.ok && item.rollbackState !== "rolled_back");
    next = applyBatchItemResult(next, result, position);
  }
  return finalizeBatchHistoryRecord(next);
}

export function applyRollbackResults(record, results = []) {
  const byKey = new Map(results.map((result) => [`${result.type}:${result.id}`, result]));
  const items = (record?.items || []).map((item) => {
    const result = byKey.get(`${item.storageType || item.type}:${item.id}`) || byKey.get(`${item.type}:${item.id}`);
    if (!result) return item;
    return {
      ...item,
      rollbackState: result.ok ? "rolled_back" : (result.eligible === false ? "blocked" : "failed"),
      rollbackMessage: text(result.message)
    };
  });
  const counts = summarize(items);
  const candidates = items.filter((item) => item.contentInserted || item.ok);
  const allRolledBack = candidates.length > 0 && candidates.every((item) => item.rollbackState === "rolled_back");
  return {
    ...record,
    status: allRolledBack ? "rolled_back" : "rollback_partial",
    updatedAt: nowIso(),
    items,
    summary: { ...record.summary, ...counts }
  };
}

export function recoverableBatchItems(record) {
  return (record?.items || []).filter((item) => !item.ok && item.rollbackState !== "rolled_back" && item.retryItem);
}

export function rollbackCandidateItems(record) {
  return (record?.items || []).filter((item) => (item.ok || item.contentInserted) && item.rollbackState !== "rolled_back");
}

export function normalizeBatchHistoryRecord(value) {
  if (!value || typeof value !== "object") return null;
  const status = BATCH_STATUSES.has(value.status) ? value.status : "failed";
  return {
    ...value,
    id: text(value.id),
    userId: text(value.userId),
    fingerprint: text(value.fingerprint),
    status,
    items: Array.isArray(value.items) ? value.items : [],
    summary: value.summary && typeof value.summary === "object" ? value.summary : {}
  };
}
