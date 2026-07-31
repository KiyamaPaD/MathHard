function requireClient(supabase) {
  if (!supabase?.auth || typeof supabase.rpc !== "function") {
    throw new Error("Supabase client is required for content quality operations.");
  }
}

async function requireUser(supabase) {
  requireClient(supabase);
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error("Authentication is required.");
  return data.user;
}

function unwrapRpc(data) {
  return Array.isArray(data) && data.length === 1 ? data[0] : data;
}

export async function loadContentQualityDashboard(supabase, {
  query = null,
  status = null,
  limit = 500
} = {}) {
  await requireUser(supabase);
  const { data, error } = await supabase.rpc("mh_admin_get_content_quality_dashboard", {
    p_query: String(query || "").trim() || null,
    p_status: String(status || "").trim() || null,
    p_limit: Math.max(1, Math.min(1000, Number(limit) || 500))
  });
  if (error) throw error;
  return unwrapRpc(data);
}

export async function saveContentQualityReview(supabase, {
  contentType,
  contentId,
  payload
}) {
  await requireUser(supabase);
  const { data, error } = await supabase.rpc("mh_admin_save_content_quality", {
    p_content_type: String(contentType || "").trim().toLowerCase(),
    p_content_id: String(contentId || "").trim(),
    p_payload: payload || {}
  });
  if (error) throw error;
  return unwrapRpc(data);
}

export async function resetContentQualityReview(supabase, {
  contentType,
  contentId
}) {
  await requireUser(supabase);
  const { data, error } = await supabase.rpc("mh_admin_reset_content_quality", {
    p_content_type: String(contentType || "").trim().toLowerCase(),
    p_content_id: String(contentId || "").trim()
  });
  if (error) throw error;
  return unwrapRpc(data);
}
