function asArray(value){ return Array.isArray(value) ? value : []; }
function cleanId(value){ return String(value || "").trim().slice(0, 200); }

export function normalizeTagCatalog(payload = {}){
  return {
    tags: asArray(payload.tags).map((tag) => ({
      id: cleanId(tag?.id),
      label_ro: String(tag?.label_ro || tag?.id || "").trim(),
      label_en: String(tag?.label_en || tag?.label_ro || tag?.id || "").trim(),
      position: Number(tag?.position || 0),
      active: tag?.active !== false,
      group_key: new Set(["topic","method","context"]).has(String(tag?.group_key||"")) ? String(tag.group_key) : "topic",
      filter_visible: tag?.filter_visible !== false
    })).filter((tag) => tag.id),
    mappings: asArray(payload.mappings).map((row) => ({
      content_type: String(row?.content_type || "").trim(),
      content_id: cleanId(row?.content_id),
      tag_id: cleanId(row?.tag_id),
      position: Number(row?.position || 0)
    })).filter((row) => row.content_type && row.content_id && row.tag_id),
    admin: Boolean(payload.admin)
  };
}

export async function loadTagCatalog(supabase){
  if (!supabase?.rpc) throw new Error("Tag catalogue unavailable.");
  const { data, error } = await supabase.rpc("mh_get_tag_catalog");
  if (error) throw error;
  return normalizeTagCatalog(data || {});
}

export function applyTagCatalog(data, catalog){
  const normalized = normalizeTagCatalog(catalog);
  const byContent = new Map();
  for (const row of normalized.mappings){
    const key = `${row.content_type}:${row.content_id}`;
    if (!byContent.has(key)) byContent.set(key, []);
    byContent.get(key).push(row);
  }
  const collections = [["lesson", data.lessons], ["problem", data.problems], ["exam", data.exams]];
  for (const [type, items] of collections){
    for (const item of asArray(items)){
      const mapped = asArray(byContent.get(`${type}:${item.id}`)).sort((a,b) => a.position-b.position).map((row) => row.tag_id);
      const legacy = type === "lesson" ? asArray(item.tags).map(cleanId).filter(Boolean) : [];
      if (type === "lesson") item.legacy_tags = [...legacy];
      item.tags = [...new Set(mapped.length ? mapped : legacy)];
      const labels = new Map(normalized.tags.map((tag) => [tag.id, tag]));
      item.tag_labels = item.tags.flatMap((id) => { const tag = labels.get(id); return tag ? [tag.label_ro, tag.label_en] : [id]; });
    }
  }
  data.tagCatalog = normalized;
  return normalized;
}

export async function hydrateTagCatalog(supabase, data){
  const catalog = await loadTagCatalog(supabase);
  applyTagCatalog(data, catalog);
  return catalog;
}

export async function saveTag(supabase, tag){
  const { data, error } = await supabase.rpc("mh_admin_save_tag", {
    p_id: cleanId(tag?.id), p_label_ro: String(tag?.label_ro || "").trim(),
    p_label_en: String(tag?.label_en || "").trim(), p_active: tag?.active !== false,
    p_group_key: new Set(["topic","method","context"]).has(String(tag?.group_key||"")) ? String(tag.group_key) : "topic",
    p_filter_visible: tag?.filter_visible !== false
  });
  if (error) throw error;
  return data;
}
export async function deleteTag(supabase, id){
  const { data, error } = await supabase.rpc("mh_admin_delete_tag", { p_id: cleanId(id) });
  if (error) throw error;
  return Boolean(data);
}
export async function reorderTags(supabase, ids){
  const { data, error } = await supabase.rpc("mh_admin_reorder_tags", { p_ids: asArray(ids).map(cleanId).filter(Boolean) });
  if (error) throw error;
  return normalizeTagCatalog(data || {});
}
export async function replaceContentTags(supabase, contentType, contentId, tagIds){
  const { data, error } = await supabase.rpc("mh_admin_replace_content_tags", {
    p_content_type: String(contentType || "").trim(), p_content_id: cleanId(contentId),
    p_tag_ids: asArray(tagIds).map(cleanId).filter(Boolean)
  });
  if (error) throw error;
  return data;
}
