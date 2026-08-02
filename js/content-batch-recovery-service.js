import { deleteAdminContentSafely } from "./admin-history-repository.js";
import { importContentBatchItems } from "./content-batch-import-repository.js";
import { loadContentQualityDashboard } from "./content-quality-repository.js";
import { normalizeContentQualityDashboard } from "./content-quality-model.js";
import { recoverableBatchItems, rollbackCandidateItems } from "./content-batch-history-model.js";

function key(type, id) {
  return `${String(type || "lesson").toLowerCase()}:${String(id || "").trim()}`;
}

export async function retryBatchFailures(supabase, record, { existingIds = {} } = {}) {
  const failed = recoverableBatchItems(record);
  const existing = {
    lesson: new Set(existingIds.lesson || []),
    problem: new Set(existingIds.problem || []),
    exam: new Set(existingIds.exam || [])
  };
  const items = failed.map((historyItem) => ({
    ...historyItem.retryItem,
    skipInsert: historyItem.contentInserted || existing[historyItem.storageType]?.has(historyItem.id)
  }));
  return importContentBatchItems(supabase, items, {
    skipInsert: (item) => Boolean(item.skipInsert)
  });
}

export async function inspectBatchRollback(supabase, record) {
  const candidates = rollbackCandidateItems(record);
  if (!candidates.length) return [];
  const raw = await loadContentQualityDashboard(supabase, { limit: 1000 });
  const dashboard = normalizeContentQualityDashboard(raw);
  const qualityByContent = new Map(dashboard.items.map((item) => [key(item.content_type, item.content_id), item]));
  return candidates.map((item) => {
    const quality = qualityByContent.get(key(item.storageType, item.id));
    if (!quality) {
      return { ...item, eligible: false, message: "editorial_state_missing" };
    }
    if (quality.status !== "draft") {
      return { ...item, eligible: false, message: `status_${quality.status}` };
    }
    if (quality.publication_state !== "unpublished" || quality.published) {
      return { ...item, eligible: false, message: "content_is_published" };
    }
    return { ...item, eligible: true, message: "rollback_available" };
  });
}

export async function rollbackBatchDrafts(supabase, record) {
  const inspected = await inspectBatchRollback(supabase, record);
  const results = [];
  for (const item of inspected) {
    if (!item.eligible) {
      results.push({ type: item.storageType, id: item.id, ok: false, eligible: false, message: item.message });
      continue;
    }
    try {
      await deleteAdminContentSafely(supabase, item.table, item.id);
      results.push({ type: item.storageType, id: item.id, ok: true, eligible: true, message: "draft_deleted" });
    } catch (error) {
      results.push({ type: item.storageType, id: item.id, ok: false, eligible: true, message: String(error?.message || error) });
    }
  }
  return results;
}
