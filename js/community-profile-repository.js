function assertClient(supabase) {
  if (!supabase?.rpc) throw new Error("Supabase client unavailable");
}

async function call(supabase, name, args = {}) {
  assertClient(supabase);
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data;
}

export function loadOwnCommunityProfile(supabase) {
  return call(supabase, "mh_get_my_community_profile");
}

export function saveOwnCommunityProfile(supabase, profile) {
  return call(supabase, "mh_update_my_community_profile", { p_profile: profile });
}

export function checkCommunityUsername(supabase, username) {
  return call(supabase, "mh_check_community_username", { p_username: username });
}

export function loadPublicCommunityProfile(supabase, username) {
  return call(supabase, "mh_get_public_community_profile", { p_username: username });
}

export function loadCommunityCountries(supabase) {
  return call(supabase, "mh_get_community_countries");
}

export function loadCommunityRegions(supabase, countryCode) {
  return call(supabase, "mh_get_community_regions", { p_country_code: countryCode });
}

export function loadCommunityBadgeStudio(supabase, query = "") {
  return call(supabase, "mh_admin_get_community_badge_studio", { p_query: query });
}

export function saveCommunityBadgeDefinition(supabase, badge) {
  return call(supabase, "mh_admin_upsert_community_badge", { p_badge: badge });
}

export function assignCommunityBadge(supabase, assignment) {
  return call(supabase, "mh_admin_assign_community_badge", {
    p_user_id: assignment.user_id,
    p_badge_id: assignment.badge_id,
    p_featured: Boolean(assignment.featured),
    p_note: assignment.note || null,
    p_expires_at: assignment.expires_at || null
  });
}

export function revokeCommunityBadge(supabase, userId, badgeId) {
  return call(supabase, "mh_admin_revoke_community_badge", {
    p_user_id: userId,
    p_badge_id: badgeId
  });
}

export function loadCommunityModerationDashboard(supabase, filters = {}) {
  return call(supabase, "mh_admin_get_community_moderation", {
    p_status: filters.status || "open",
    p_query: filters.query || "",
    p_limit: Math.min(100, Math.max(20, Number(filters.limit) || 60))
  });
}

function isMissingRpcError(error) {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();
  return ["PGRST202", "PGRST203", "42883"].includes(code)
    || message.includes("could not find the function")
    || message.includes("does not exist");
}

function moderationCaseFallback(value) {
  return {
    id: value.id,
    kind: value.kind,
    status: value.status,
    priority: value.priority,
    admin_note: value.adminNote || null
  };
}

export async function updateCommunityModerationCase(supabase, value) {
  const args = {
    p_kind: value.kind,
    p_id: value.id,
    p_status: value.status,
    p_priority: value.priority,
    p_note: value.adminNote || null
  };

  try {
    const saved = await call(supabase, "mh_admin_save_community_case", args);
    if (!saved || typeof saved !== "object" || String(saved.id || "") !== String(value.id || "")) {
      throw new Error("Invalid moderation save response");
    }
    return saved;
  } catch (error) {
    if (!isMissingRpcError(error)) throw error;

    // Compatibility path for databases that still expose the Phase 4C/4D RPC.
    const saved = await call(supabase, "mh_admin_update_community_case", args);
    if (saved === true) return moderationCaseFallback(value);
    if (!saved || typeof saved !== "object") throw new Error("Invalid moderation save response");
    return saved;
  }
}

export function setCommunityUserAccess(supabase, value) {
  return call(supabase, "mh_admin_set_community_access", {
    p_user_id: value.userId,
    p_profile_allowed: Boolean(value.profileAllowed),
    p_leaderboard_allowed: Boolean(value.leaderboardAllowed),
    p_note: value.note || null
  });
}
