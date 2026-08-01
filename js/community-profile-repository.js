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
