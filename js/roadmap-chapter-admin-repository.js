function clean(value) { return String(value ?? "").trim(); }

function unwrap(data) {
  return Array.isArray(data) && data.length === 1 ? data[0] : data;
}

export async function loadRoadmapChapterGroups(supabase) {
  const { data, error } = await supabase.rpc("mh_admin_get_chapter_groups");
  if (error) throw error;
  const payload = unwrap(data) || {};
  return {
    chapters: Array.isArray(payload.chapters) ? payload.chapters : [],
    members: Array.isArray(payload.members) ? payload.members : []
  };
}

export async function saveRoadmapChapterGroup(supabase, payload) {
  const chapterId = clean(payload?.id);
  const roadmapId = clean(payload?.roadmap_id);
  const sectionId = clean(payload?.section_id);
  const titleRo = clean(payload?.title_ro);
  if (!chapterId || !roadmapId || !sectionId || !titleRo) throw new Error("ID, roadmap, etapă și titlu sunt obligatorii.");
  const { data, error } = await supabase.rpc("mh_admin_save_chapter_group", {
    p_chapter_id: chapterId,
    p_roadmap_id: roadmapId,
    p_section_id: sectionId,
    p_title_ro: titleRo,
    p_title_en: clean(payload?.title_en) || titleRo,
    p_description_ro: clean(payload?.description_ro),
    p_description_en: clean(payload?.description_en),
    p_position: Number(payload?.position || 0),
    p_active: payload?.active !== false
  });
  if (error) throw error;
  return unwrap(data);
}

export async function deleteRoadmapChapterGroup(supabase, chapterId) {
  const id = clean(chapterId);
  if (!id) throw new Error("Chapter id is required.");
  const { data, error } = await supabase.rpc("mh_admin_delete_chapter_group", {
    p_chapter_id: id
  });
  if (error) throw error;
  return unwrap(data);
}

export async function setRoadmapChapterMembership(supabase, {
  roadmapId,
  chapterId = "",
  contentType,
  contentId,
  role = "core_lesson",
  position = 0
} = {}) {
  const roadmap = clean(roadmapId);
  const type = clean(contentType).toLowerCase();
  const content = clean(contentId);
  if (!roadmap || !type || !content) throw new Error("Roadmap, tip și content ID sunt obligatorii.");
  const { data, error } = await supabase.rpc("mh_admin_set_chapter_membership", {
    p_roadmap_id: roadmap,
    p_chapter_id: clean(chapterId) || null,
    p_content_type: type,
    p_content_id: content,
    p_role: clean(role) || "core_lesson",
    p_position: Number(position || 0)
  });
  if (error) throw error;
  return unwrap(data);
}
