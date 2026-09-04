function asXp(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

export function normalizeXpSummary(payload = {}) {
  const baseXp = asXp(payload?.base_xp ?? payload?.baseXp);
  const bonusXp = asXp(payload?.bonus_xp ?? payload?.bonusXp);
  const totalXp = asXp(payload?.total_xp ?? payload?.totalXp ?? (baseXp + bonusXp));
  return { baseXp, bonusXp, totalXp };
}

export async function loadXpSummary(supabase) {
  if (!supabase?.rpc) throw new Error("XP summary is unavailable.");
  const { data, error } = await supabase.rpc("mh_get_user_xp_summary");
  if (error) throw error;
  return normalizeXpSummary(data || {});
}
