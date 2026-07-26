import { clampAnalyticsRange, normalizeAnalyticsPayload } from "./analytics-model.js";

export async function loadUserAnalytics(supabase, {
  days = 90,
  locale = "ro"
} = {}) {
  if (!supabase?.rpc) throw new Error("Supabase client is unavailable.");

  const { data, error } = await supabase.rpc("mh_get_user_analytics", {
    p_days: clampAnalyticsRange(days),
    p_locale: String(locale || "ro").toLowerCase().startsWith("en") ? "en" : "ro"
  });

  if (error) {
    const missingRpc = error.code === "PGRST202" || error.status === 404;
    if (missingRpc) {
      throw new Error("Analytics backend is not installed. Run the Phase 15A SQL migration.");
    }
    throw error;
  }

  return normalizeAnalyticsPayload(data || {});
}
