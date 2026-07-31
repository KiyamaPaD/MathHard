import { normalizeProgressTaxonomy } from "./progress-taxonomy-model.js";

const MISSING_RPC_CODES = new Set(["PGRST202", "42883"]);

function isMissingRpc(error) {
  if (!error) return false;
  if (MISSING_RPC_CODES.has(String(error.code || ""))) return true;
  const message = String(error.message || error.details || "").toLowerCase();
  return message.includes("could not find the function") ||
    (message.includes("mh_get_progress_taxonomy") && message.includes("does not exist"));
}

export async function loadProgressTaxonomy(supabase) {
  if (!supabase?.rpc) return normalizeProgressTaxonomy({ available: false });

  const { data, error } = await supabase.rpc("mh_get_progress_taxonomy");
  if (error) {
    if (isMissingRpc(error)) return normalizeProgressTaxonomy({ available: false });
    throw error;
  }

  return normalizeProgressTaxonomy(data || {});
}
