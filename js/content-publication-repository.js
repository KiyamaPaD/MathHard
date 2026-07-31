import {
  normalizeEditorialPreview,
  publicationBatchItems
} from "./content-publication-model.js";

const MISSING_RPC_CODES = new Set(["PGRST202", "42883"]);

function requireClient(supabase) {
  if (!supabase?.auth || typeof supabase.rpc !== "function") {
    throw new Error("Supabase client is required for editorial operations.");
  }
}

async function requireUser(supabase) {
  requireClient(supabase);
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error("Authentication is required.");
  return data.user;
}

function unwrap(data) {
  return Array.isArray(data) && data.length === 1 ? data[0] : data;
}

function isMissingRpc(error) {
  if (!error) return false;
  if (MISSING_RPC_CODES.has(String(error.code || ""))) return true;
  const message = String(error.message || error.details || "").toLowerCase();
  return message.includes("could not find the function") || message.includes("does not exist");
}

async function rpc(supabase, name, args = {}) {
  await requireUser(supabase);
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return unwrap(data);
}

export async function loadEditorialDashboard(supabase, {
  query = null,
  status = null,
  publication = null,
  limit = 1000,
  fallback = null
} = {}) {
  try {
    return await rpc(supabase, "mh_admin_get_editorial_dashboard", {
      p_query: String(query || "").trim() || null,
      p_status: String(status || "").trim() || null,
      p_publication: String(publication || "").trim() || null,
      p_limit: Math.max(1, Math.min(2000, Number(limit) || 1000))
    });
  } catch (error) {
    if (isMissingRpc(error) && typeof fallback === "function") return fallback();
    throw error;
  }
}

export async function publishContent(supabase, item) {
  return rpc(supabase, "mh_admin_publish_content", {
    p_content_type: String(item?.content_type || "").trim().toLowerCase(),
    p_content_id: String(item?.content_id || "").trim(),
    p_expected_review_version: Math.max(1, Number(item?.review_version) || 1)
  });
}

export async function unpublishContent(supabase, item, reason = "Withdrawn by admin") {
  return rpc(supabase, "mh_admin_unpublish_content", {
    p_content_type: String(item?.content_type || "").trim().toLowerCase(),
    p_content_id: String(item?.content_id || "").trim(),
    p_reason: String(reason || "Withdrawn by admin").trim().slice(0, 2000)
  });
}

export async function bulkSetPublication(supabase, items, publish, reason = "") {
  const payload = publicationBatchItems(items);
  if (!payload.length) throw new TypeError("Select at least one content item.");
  return rpc(supabase, "mh_admin_bulk_set_publication", {
    p_items: payload,
    p_publish: Boolean(publish),
    p_reason: String(reason || "").trim().slice(0, 2000) || null
  });
}

export async function bulkSubmitForReview(supabase, items) {
  const payload = publicationBatchItems(items).map(({ content_type, content_id }) => ({
    content_type,
    content_id
  }));
  if (!payload.length) throw new TypeError("Select at least one content item.");
  return rpc(supabase, "mh_admin_bulk_submit_for_review", { p_items: payload });
}

export async function loadEditorialPreview(supabase, item, locale = "ro") {
  const payload = await rpc(supabase, "mh_admin_preview_content", {
    p_content_type: String(item?.content_type || "").trim().toLowerCase(),
    p_content_id: String(item?.content_id || "").trim(),
    p_locale: String(locale || "ro").toLowerCase().startsWith("en") ? "en" : "ro"
  });
  return normalizeEditorialPreview(payload);
}

export async function duplicateContent(supabase, item, newId, titleSuffix = " (Copy)") {
  const contentType = String(item?.content_type || "").trim().toLowerCase();
  const sourceId = String(item?.content_id || "").trim();
  const targetId = String(newId || "").trim();
  if (!["lesson", "problem"].includes(contentType)) {
    throw new TypeError("Only lessons and problems can be duplicated.");
  }
  if (!sourceId || !/^[A-Za-z0-9][A-Za-z0-9_-]+$/.test(targetId) || targetId.length > 200) {
    throw new TypeError("Choose a valid new content id.");
  }
  return rpc(supabase, "mh_admin_duplicate_content", {
    p_content_type: contentType,
    p_source_id: sourceId,
    p_new_id: targetId,
    p_title_suffix: String(titleSuffix ?? " (Copy)").slice(0, 100)
  });
}

export async function loadPublicationHistory(supabase, item, limit = 30) {
  return rpc(supabase, "mh_admin_get_publication_history", {
    p_content_type: String(item?.content_type || "").trim().toLowerCase(),
    p_content_id: String(item?.content_id || "").trim(),
    p_limit: Math.max(1, Math.min(100, Number(limit) || 30))
  });
}
