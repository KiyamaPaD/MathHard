import {
  attachChapterConceptProgress,
  clampAnalyticsRange,
  normalizeAnalyticsPayload,
  normalizeChapterProgressPayload
} from "./analytics-model.js";
import { loadConceptMastery } from "./concept-mastery-repository.js";
import { loadConceptRetention } from "./concept-retention-repository.js";
import { loadProgressTaxonomy } from "./progress-taxonomy-repository.js";

export async function loadUserAnalytics(supabase, {
  days = 90,
  locale = "ro"
} = {}) {
  if (!supabase?.rpc) throw new Error("Statisticile nu sunt disponibile momentan.");

  const safeDays = clampAnalyticsRange(days);
  const safeLocale = String(locale || "ro").toLowerCase().startsWith("en") ? "en" : "ro";

  const replayAnalyticsPromise = import("./practice-replay-repository.js")
    .then((module) => module.loadPracticeReplayAnalytics(supabase, 24))
    .catch(() => ({ problem_replays: 0, exam_replays: 0, total_replays: 0, last_replay_at: "", recent: [] }));

  const chapterProgressPromise = supabase.rpc("mh_get_user_chapter_progress", { p_locale: safeLocale })
    .then(({ data, error }) => {
      if (error?.code === "PGRST202" || error?.status === 404) return normalizeChapterProgressPayload({ available: false });
      if (error) throw error;
      return normalizeChapterProgressPayload(data || {});
    })
    .catch(() => normalizeChapterProgressPayload({ available: false }));

  const [analyticsResult, conceptMastery, conceptRetention, progressTaxonomy, practiceReplays, chapterProgress] = await Promise.all([
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
    }),
    loadProgressTaxonomy(supabase),
    replayAnalyticsPromise,
    chapterProgressPromise
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
    conceptRetention,
    progressTaxonomy,
    practiceReplays,
    chapterProgress: attachChapterConceptProgress(chapterProgress, conceptMastery)
  };
}
