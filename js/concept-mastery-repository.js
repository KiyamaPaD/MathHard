import {
  emptyConceptMastery,
  normalizeConceptMasteryPayload
} from "./concept-mastery-model.js";

function clampRange(value) {
  const parsed = Math.round(Number(value));
  return Math.max(7, Math.min(365, Number.isFinite(parsed) ? parsed : 90));
}

function isMissingRpc(error) {
  return error?.code === "PGRST202"
    || error?.status === 404
    || /could not find the function|schema cache/i.test(String(error?.message || ""));
}

export async function loadConceptMastery(supabase, {
  days = 90,
  locale = "ro"
} = {}) {
  if (!supabase?.rpc) throw new Error("Supabase client is unavailable.");

  const { data, error } = await supabase.rpc("mh_get_concept_mastery", {
    p_days: clampRange(days),
    p_locale: String(locale || "ro").toLowerCase().startsWith("en") ? "en" : "ro"
  });

  if (error) {
    if (isMissingRpc(error)) {
      return emptyConceptMastery({ available: false, reason: "not_installed" });
    }
    throw error;
  }

  return normalizeConceptMasteryPayload(data || {});
}
