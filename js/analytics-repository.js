import { clampAnalyticsRange, normalizeAnalyticsPayload } from "./analytics-model.js";
import { loadConceptMastery } from "./concept-mastery-repository.js";
import { loadConceptRetention } from "./concept-retention-repository.js";

export async function loadUserAnalytics(supabase, {
  days = 90,
  locale = "ro"
} = {}) {
  if (!supabase?.rpc) throw new Error("Statisticile nu sunt disponibile momentan.");

  const safeDays = clampAnalyticsRange(days);
  const safeLocale = String(locale || "ro").toLowerCase().startsWith("en") ? "en" : "ro";

  const [analyticsResult, conceptMastery, conceptRetention] = await Promise.all([
    supabase.rpc("mh_get_user_analytics", {
      p_days: safeDays,
      p_locale: safeLocale
    }),
    loadConceptMastery(supabase, {
      days: safeDays,
      locale: safeLocale
    }),
    loadConceptRetention(supabase, {
      limit: 8,
      locale: safeLocale
    })
  ]);

  if (analyticsResult.error) {
    const error = analyticsResult.error;
    const missingRpc = error.code === "PGRST202" || error.status === 404;
    if (missingRpc) {
      throw new Error("Statisticile nu sunt disponibile momentan.");
    }
    throw error;
  }

  return {
    ...normalizeAnalyticsPayload(analyticsResult.data || {}),
    conceptMastery,
    conceptRetention
  };
}
