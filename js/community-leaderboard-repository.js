import {
  normalizeCommunityLeaderboard,
  normalizeLeaderboardQuery
} from "./community-leaderboard-model.js";

function assertClient(supabase) {
  if (!supabase?.rpc) throw new Error("Community leaderboard unavailable");
}

export async function loadCommunityLeaderboard(supabase, query = {}) {
  assertClient(supabase);
  const normalized = normalizeLeaderboardQuery(query);
  const { data, error } = await supabase.rpc("mh_get_community_leaderboard", {
    p_scope: normalized.scope,
    p_period: normalized.period,
    p_metric: normalized.metric,
    p_page: normalized.page,
    p_page_size: normalized.pageSize
  });
  if (error) throw error;
  return normalizeCommunityLeaderboard(data || {}, normalized);
}
