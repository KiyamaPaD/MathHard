import {
  normalizeCommunityLeaderboard,
  normalizeLeaderboardQuery,
  normalizeLeaderboardRegionResults
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
    p_page_size: normalized.pageSize,
    p_region_code: normalized.regionCode || null
  });
  if (error) throw error;
  return normalizeCommunityLeaderboard(data || {}, normalized);
}

export async function searchLeaderboardRegions(supabase, search = "", limit = 12) {
  assertClient(supabase);
  const normalizedSearch = String(search ?? "").trim().slice(0, 80);
  const normalizedLimit = Math.min(20, Math.max(5, Math.trunc(Number(limit) || 12)));
  const { data, error } = await supabase.rpc("mh_search_leaderboard_regions", {
    p_query: normalizedSearch,
    p_limit: normalizedLimit
  });
  if (error) throw error;
  return normalizeLeaderboardRegionResults(data || []);
}
