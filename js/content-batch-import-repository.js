import { replaceContentConcepts } from "./concept-repository.js";
import { saveEditorialDraft } from "./content-authoring-bootstrap.js";
import { contentTableForType } from "./content-batch-import-model.js";

function requireSupabase(supabase) {
  if (!supabase?.from || !supabase?.auth || typeof supabase.rpc !== "function") {
    throw new Error("Supabase is required for batch content import.");
  }
}

export async function importContentBatchItem(supabase, item) {
  requireSupabase(supabase);
  const id = String(item?.payload?.id || "").trim();
  const type = String(item?.type || "").trim();
  if (!id || !type || item?.valid === false) throw new TypeError("A valid batch item is required.");

  const table = contentTableForType(type);
  const { error } = await supabase.from(table).insert(item.payload);
  if (error) throw error;

  try {
    await saveEditorialDraft(supabase, { type, payload: item.payload });
    if (type !== "exam" && Array.isArray(item.conceptIds) && item.conceptIds.length) {
      await replaceContentConcepts(supabase, {
        contentType: item.storageType,
        contentId: id,
        conceptIds: item.conceptIds
      });
    }
    return { ok: true, id, type, table, contentInserted: true };
  } catch (error) {
    error.contentInserted = true;
    throw error;
  }
}

export async function importContentBatchItems(supabase, items = []) {
  requireSupabase(supabase);
  const results = [];
  for (const item of Array.isArray(items) ? items : []) {
    try {
      const result = await importContentBatchItem(supabase, item);
      results.push({ ...result, message: "draft_created" });
    } catch (error) {
      results.push({
        ok: false,
        id: String(item?.payload?.id || "").trim() || "unknown",
        type: String(item?.type || "").trim(),
        contentInserted: Boolean(error?.contentInserted),
        message: String(error?.message || error)
      });
    }
  }
  return results;
}
