function assertClient(supabase) {
  if (!supabase?.rpc) throw new Error("Community feedback unavailable");
}

async function call(supabase, name, args = {}) {
  assertClient(supabase);
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data;
}

export function submitCommunityFeedback(supabase, draft) {
  return call(supabase, "mh_submit_community_feedback", {
    p_payload: {
      category: draft.category,
      subject: draft.subject,
      message: draft.message,
      page_url: draft.pageUrl || null,
      content_type: draft.contentType || null,
      content_id: draft.contentId || null,
      contact_email: draft.contactEmail || null,
      language: draft.language,
      client_token: draft.clientToken || null,
      website: draft.honeypot || ""
    }
  });
}

export function submitCommunityProfileReport(supabase, draft) {
  return call(supabase, "mh_submit_community_profile_report", {
    p_username: draft.username,
    p_reason: draft.reason,
    p_details: draft.details
  });
}

export function loadCommunityModerationDashboard(supabase, filters = {}) {
  return call(supabase, "mh_admin_get_community_moderation", {
    p_status: filters.status || "open",
    p_query: filters.query || "",
    p_limit: Math.min(100, Math.max(20, Number(filters.limit) || 60))
  });
}

export function updateCommunityModerationCase(supabase, value) {
  return call(supabase, "mh_admin_update_community_case", {
    p_kind: value.kind,
    p_id: value.id,
    p_status: value.status,
    p_priority: value.priority,
    p_note: value.adminNote || null
  });
}

export function setCommunityUserAccess(supabase, value) {
  return call(supabase, "mh_admin_set_community_access", {
    p_user_id: value.userId,
    p_profile_allowed: Boolean(value.profileAllowed),
    p_leaderboard_allowed: Boolean(value.leaderboardAllowed),
    p_note: value.note || null
  });
}
