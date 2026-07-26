import { normalizeRoadmapCatalog } from "./roadmap-model.js";

let memoryCatalog = null;
let memoryUserId = "";
let inFlight = null;
let loadEpoch = 0;

function unwrapRpc(data) {
  return Array.isArray(data) && data.length === 1 ? data[0] : data;
}

function requireClient(supabase) {
  if (!supabase?.auth || typeof supabase.rpc !== "function") {
    throw new Error("Supabase client is required for roadmap operations.");
  }
}

async function resolveUser(supabase) {
  requireClient(supabase);
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error("Authentication is required to load roadmaps.");
  return data.user;
}

export function invalidateRoadmapCache() {
  loadEpoch += 1;
  memoryCatalog = null;
  memoryUserId = "";
  inFlight = null;
}

export async function loadRoadmapCatalog({ supabase, forceRefresh = false } = {}) {
  const user = await resolveUser(supabase);

  if (memoryUserId && memoryUserId !== user.id) {
    invalidateRoadmapCache();
  }

  if (forceRefresh) {
    loadEpoch += 1;
    memoryCatalog = null;
    inFlight = null;
  }

  if (!forceRefresh && memoryCatalog && memoryUserId === user.id) {
    return memoryCatalog;
  }

  if (!forceRefresh && inFlight?.userId === user.id) return inFlight.promise;

  const requestEpoch = loadEpoch;
  const promise = (async () => {
    const { data, error } = await supabase.rpc("mh_get_roadmap_catalog");
    if (error) throw error;

    const catalog = normalizeRoadmapCatalog(unwrapRpc(data));
    if (requestEpoch !== loadEpoch) {
      const newerLoad = inFlight?.userId === user.id && inFlight.epoch > requestEpoch
        ? inFlight.promise
        : null;
      if (newerLoad) return newerLoad;
      if (memoryCatalog && memoryUserId === user.id) return memoryCatalog;
      return catalog;
    }

    memoryCatalog = catalog;
    memoryUserId = user.id;
    return catalog;
  })().finally(() => {
    if (inFlight?.promise === promise) inFlight = null;
  });

  inFlight = { userId: user.id, epoch: requestEpoch, promise };
  return promise;
}

export async function selectRoadmap(supabase, roadmapId) {
  const id = String(roadmapId || "").trim();
  if (!id) throw new Error("Roadmap id is required.");

  await resolveUser(supabase);
  const { data, error } = await supabase.rpc("mh_select_roadmap", {
    p_roadmap_id: id
  });
  if (error) throw error;

  if (memoryCatalog) memoryCatalog.selectedRoadmapId = id;
  return unwrapRpc(data);
}

function ensureAdminPayload(payload, requiredKeys) {
  for (const key of requiredKeys) {
    if (!String(payload?.[key] ?? "").trim()) {
      throw new Error(`Missing required field: ${key}`);
    }
  }
}

export async function loadRoadmapAdminData(supabase) {
  await resolveUser(supabase);
  const [roadmaps, sections, nodes, edges] = await Promise.all([
    supabase.from("mh_roadmaps").select("*").order("position").order("id"),
    supabase.from("mh_roadmap_sections").select("*").order("roadmap_id").order("position").order("id"),
    supabase.from("mh_roadmap_nodes").select("*").order("roadmap_id").order("section_id").order("position").order("id"),
    supabase.from("mh_roadmap_edges").select("*").order("roadmap_id").order("dependent_node_id")
  ]);

  const firstError = [roadmaps.error, sections.error, nodes.error, edges.error].find(Boolean);
  if (firstError) throw firstError;

  return {
    roadmaps: roadmaps.data || [],
    sections: sections.data || [],
    nodes: nodes.data || [],
    edges: edges.data || []
  };
}

export async function saveRoadmap(supabase, payload) {
  ensureAdminPayload(payload, ["id", "title_ro"]);
  const row = {
    id: String(payload.id).trim(),
    slug: String(payload.slug || payload.id).trim(),
    icon: String(payload.icon || "🗺️").trim(),
    title_ro: String(payload.title_ro || "").trim(),
    title_en: String(payload.title_en || payload.title_ro || "").trim(),
    description_ro: String(payload.description_ro || "").trim(),
    description_en: String(payload.description_en || payload.description_ro || "").trim(),
    target_type: String(payload.target_type || "custom").trim(),
    published: Boolean(payload.published),
    position: Number(payload.position || 0)
  };

  const { data, error } = await supabase
    .from("mh_roadmaps")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  invalidateRoadmapCache();
  return data;
}

export async function saveRoadmapSection(supabase, payload) {
  ensureAdminPayload(payload, ["id", "roadmap_id", "title_ro"]);
  const row = {
    id: String(payload.id).trim(),
    roadmap_id: String(payload.roadmap_id).trim(),
    section_key: String(payload.section_key || payload.id).trim(),
    title_ro: String(payload.title_ro || "").trim(),
    title_en: String(payload.title_en || payload.title_ro || "").trim(),
    description_ro: String(payload.description_ro || "").trim(),
    description_en: String(payload.description_en || payload.description_ro || "").trim(),
    position: Number(payload.position || 0)
  };

  const { data, error } = await supabase
    .from("mh_roadmap_sections")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  invalidateRoadmapCache();
  return data;
}

export async function saveRoadmapNode(supabase, payload) {
  ensureAdminPayload(payload, ["id", "roadmap_id", "section_id", "node_type"]);
  const nodeType = String(payload.node_type).trim().toLowerCase();
  const row = {
    id: String(payload.id).trim(),
    roadmap_id: String(payload.roadmap_id).trim(),
    section_id: String(payload.section_id).trim(),
    node_type: nodeType,
    content_id: nodeType === "milestone" ? null : String(payload.content_id || "").trim() || null,
    title_ro: String(payload.title_ro || "").trim(),
    title_en: String(payload.title_en || payload.title_ro || "").trim(),
    description_ro: String(payload.description_ro || "").trim(),
    description_en: String(payload.description_en || payload.description_ro || "").trim(),
    estimated_minutes: Math.max(0, Number(payload.estimated_minutes || 0)),
    required: Boolean(payload.required),
    published: Boolean(payload.published),
    position: Number(payload.position || 0)
  };

  const { data, error } = await supabase
    .from("mh_roadmap_nodes")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  invalidateRoadmapCache();
  return data;
}

export async function replaceNodePrerequisites(supabase, {
  roadmapId,
  nodeId,
  prerequisiteNodeIds = []
}) {
  const roadmap = String(roadmapId || "").trim();
  const dependent = String(nodeId || "").trim();
  if (!roadmap || !dependent) throw new Error("Roadmap and node ids are required.");

  const ids = [...new Set(
    prerequisiteNodeIds
      .map((value) => String(value || "").trim())
      .filter((id) => id && id !== dependent)
  )];

  const { data, error } = await supabase.rpc(
    "mh_admin_replace_roadmap_prerequisites",
    {
      p_roadmap_id: roadmap,
      p_node_id: dependent,
      p_prerequisite_node_ids: ids
    }
  );
  if (error) throw error;

  invalidateRoadmapCache();
  return data;
}

export async function deleteRoadmapEntity(supabase, table, id) {
  const allowedTables = new Set(["mh_roadmaps", "mh_roadmap_sections", "mh_roadmap_nodes"]);
  if (!allowedTables.has(table)) throw new Error("Invalid roadmap table.");
  const cleanId = String(id || "").trim();
  if (!cleanId) throw new Error("Entity id is required.");

  const { error } = await supabase.from(table).delete().eq("id", cleanId);
  if (error) throw error;
  invalidateRoadmapCache();
}

export async function patchRoadmapEntity(supabase, table, id, changes = {}) {
  const allowedTables = new Set(["mh_roadmaps", "mh_roadmap_sections", "mh_roadmap_nodes"]);
  if (!allowedTables.has(table)) throw new Error("Invalid roadmap table.");
  const cleanId = String(id || "").trim();
  if (!cleanId) throw new Error("Entity id is required.");

  const { data, error } = await supabase
    .from(table)
    .update(changes)
    .eq("id", cleanId)
    .select("*")
    .single();
  if (error) throw error;
  invalidateRoadmapCache();
  return data;
}

export async function saveRoadmapPositions(supabase, table, items = []) {
  const allowedTables = new Set(["mh_roadmap_sections", "mh_roadmap_nodes"]);
  if (!allowedTables.has(table)) throw new Error("Invalid roadmap ordering table.");

  const rows = (Array.isArray(items) ? items : [])
    .map((item) => ({ id: String(item?.id || "").trim(), position: Number(item?.position || 0) }))
    .filter((item) => item.id);

  for (const row of rows) {
    const { error } = await supabase
      .from(table)
      .update({ position: row.position })
      .eq("id", row.id);
    if (error) throw error;
  }

  invalidateRoadmapCache();
  return rows;
}
