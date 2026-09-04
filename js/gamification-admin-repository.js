function assertSupabase(supabase) {
  if (!supabase?.rpc) throw new Error("Supabase client is unavailable.");
}

async function call(supabase, name, args) {
  assertSupabase(supabase);
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data || { achievements: [], challenges: [], templates: [] };
}

export function loadGamificationStudio(supabase) {
  return call(supabase, "mh_admin_get_gamification_studio");
}

export function saveAchievement(supabase, item) {
  return call(supabase, "mh_admin_upsert_achievement", { p_item: item });
}

export function deleteAchievement(supabase, id) {
  return call(supabase, "mh_admin_delete_achievement", { p_id: id });
}

export function saveChallenge(supabase, item) {
  return call(supabase, "mh_admin_upsert_challenge", { p_item: item });
}

export function deleteChallenge(supabase, id) {
  return call(supabase, "mh_admin_delete_challenge", { p_id: id });
}

export function saveChallengeTemplate(supabase, item) {
  return call(supabase, "mh_admin_upsert_challenge_template", { p_item: item });
}

export function deleteChallengeTemplate(supabase, id) {
  return call(supabase, "mh_admin_delete_challenge_template", { p_id: id });
}

export function generateChallenge(supabase, templateId, startsOn, featured = true) {
  return call(supabase, "mh_admin_generate_challenge", {
    p_template_id: templateId,
    p_starts_on: startsOn || null,
    p_featured: Boolean(featured)
  });
}


export function loadProgressLab(supabase, locale = "ro") {
  return call(supabase, "mh_admin_get_progress_lab", { p_locale: locale });
}

export function runProgressLabAction(supabase, { action, contentType = null, contentId = null, chapterId = null, locale = "ro" } = {}) {
  return call(supabase, "mh_admin_progress_lab_action", {
    p_action: action,
    p_content_type: contentType,
    p_content_id: contentId,
    p_chapter_id: chapterId,
    p_locale: locale
  });
}

export function undoProgressLabAction(supabase, locale = "ro") {
  return call(supabase, "mh_admin_progress_lab_undo", { p_locale: locale });
}

export function restoreProgressLabBaseline(supabase, locale = "ro") {
  return call(supabase, "mh_admin_progress_lab_restore", { p_locale: locale });
}
