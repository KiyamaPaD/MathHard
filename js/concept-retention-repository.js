import {
  emptyConceptRetention,
  normalizeConceptRetentionPayload
} from "./concept-retention-model.js";

function clampLimit(value) {
  const parsed = Math.round(Number(value));
  return Math.max(1, Math.min(20, Number.isFinite(parsed) ? parsed : 8));
}

function isMissingRpc(error) {
  return error?.code === "PGRST202"
    || error?.status === 404
    || /could not find the function|schema cache/i.test(String(error?.message || ""));
}

export async function loadConceptRetention(supabase, {
  limit = 8,
  locale = "ro"
} = {}) {
  if (!supabase?.rpc) throw new Error("Supabase client is unavailable.");

  const { data, error } = await supabase.rpc("mh_get_concept_retention", {
    p_limit: clampLimit(limit),
    p_locale: String(locale || "ro").toLowerCase().startsWith("en") ? "en" : "ro"
  });

  if (error) {
    if (isMissingRpc(error)) {
      return emptyConceptRetention({ available: false, reason: "not_installed" });
    }
    throw error;
  }

  return normalizeConceptRetentionPayload(data || {});
}
