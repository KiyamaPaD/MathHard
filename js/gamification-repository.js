import { normalizeGamificationPayload, clampDailyGoal } from "./gamification-model.js";

function backendError(error, fallback) {
  const missingRpc = error?.code === "PGRST202" || error?.status === 404;
  if (missingRpc) {
    return new Error("Gamification backend is not installed. Run the Phase 16 SQL migration.");
  }
  return new Error(error?.message || fallback);
}

export async function loadGamificationDashboard(supabase, { locale = "ro" } = {}) {
  if (!supabase?.rpc) throw new Error("Supabase client is unavailable.");
  const { data, error } = await supabase.rpc("mh_get_gamification_dashboard", {
    p_locale: String(locale || "ro").toLowerCase().startsWith("en") ? "en" : "ro"
  });
  if (error) throw backendError(error, "Gamification could not be loaded.");
  return normalizeGamificationPayload(data);
}

export async function saveDailyGoal(supabase, dailyGoal) {
  const { error } = await supabase.rpc("mh_set_daily_goal", {
    p_daily_goal: clampDailyGoal(dailyGoal)
  });
  if (error) throw backendError(error, "Daily goal could not be saved.");
}

export async function saveLeaderboardPreference(supabase, enabled) {
  const { error } = await supabase.rpc("mh_set_leaderboard_opt_in", {
    p_enabled: Boolean(enabled)
  });
  if (error) throw backendError(error, "Leaderboard preference could not be saved.");
}

export async function claimWeeklyChallenge(supabase) {
  const { error } = await supabase.rpc("mh_claim_weekly_challenge");
  if (error) throw backendError(error, "Weekly reward could not be claimed.");
}
