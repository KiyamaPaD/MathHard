import { normalizeRoadmapCatalog } from "./roadmap-model.js";

const GUEST_SCOPE = "__guest__";

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

async function resolveUser(supabase, userOverride = undefined, { allowGuest = false } = {}) {
  requireClient(supabase);
  if (userOverride !== undefined) {
    if (userOverride?.id) return userOverride;
    if (allowGuest) return null;
    throw new Error("Authentication is required for this roadmap operation.");
  }
  const { data, error } = await supabase.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") throw error;
  if (data?.user?.id) return data.user;
  if (allowGuest) return null;
  throw new Error("Authentication is required for this roadmap operation.");
}

export function invalidateRoadmapCache() {
  loadEpoch += 1;
  memoryCatalog = null;
  memoryUserId = "";
  inFlight = null;
}

export async function loadRoadmapCatalog({ supabase, forceRefresh = false, user = undefined } = {}) {
  user = await resolveUser(supabase, user, { allowGuest: true });
  const userId = user?.id || GUEST_SCOPE;

  if (memoryUserId && memoryUserId !== userId) {
    invalidateRoadmapCache();
  }

  if (forceRefresh) {
    loadEpoch += 1;
    memoryCatalog = null;
    inFlight = null;
  }

  if (!forceRefresh && memoryCatalog && memoryUserId === userId) {
    return memoryCatalog;
  }

  if (!forceRefresh && inFlight?.userId === userId) return inFlight.promise;

  const requestEpoch = loadEpoch;
  const promise = (async () => {
    const rpcName = userId === GUEST_SCOPE ? "mh_get_public_roadmap_catalog" : "mh_get_roadmap_catalog";
    const [catalogResult, chapterResult] = await Promise.all([
      supabase.rpc(rpcName),
      supabase.rpc("mh_get_roadmap_chapter_groups")
    ]);
    if (catalogResult.error) throw catalogResult.error;

    const rawCatalog = unwrapRpc(catalogResult.data) || {};
    const chapterPayload = chapterResult.error ? {} : (unwrapRpc(chapterResult.data) || {});
    const chapterRows = Array.isArray(chapterPayload.chapters) ? chapterPayload.chapters : [];
    const roadmapRows = Array.isArray(rawCatalog.roadmaps) ? rawCatalog.roadmaps : [];
    const enriched = {
      ...rawCatalog,
      roadmaps: roadmapRows.map((roadmap) => ({
        ...roadmap,
        chapters: chapterRows.filter((chapter) => String(chapter?.roadmap_id || "") === String(roadmap?.id || ""))
      }))
    };
    const catalog = normalizeRoadmapCatalog(enriched);
    if (requestEpoch !== loadEpoch) {
      const newerLoad = inFlight?.userId === userId && inFlight.epoch > requestEpoch
        ? inFlight.promise
        : null;
      if (newerLoad) return newerLoad;
      if (memoryCatalog && memoryUserId === userId) return memoryCatalog;
      return catalog;
    }

    memoryCatalog = catalog;
    memoryUserId = userId;
    return catalog;
  })().finally(() => {
    if (inFlight?.promise === promise) inFlight = null;
  });

  inFlight = { userId, epoch: requestEpoch, promise };
  return promise;
}

export async function selectRoadmap(supabase, roadmapId, { user = undefined } = {}) {
  const id = String(roadmapId || "").trim();
  if (!id) throw new Error("Roadmap id is required.");

  await resolveUser(supabase, user);
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

export async function saveRoadmapPositions(supabase, table, items = [], { roadmapId = "" } = {}) {
  const entity = table === "mh_roadmap_sections"
    ? "sections"
    : table === "mh_roadmap_nodes"
      ? "nodes"
      : "";
  if (!entity) throw new Error("Invalid roadmap ordering table.");

  const rows = (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: String(item?.id || "").trim(),
      position: Number(item?.position || 0),
      ...(entity === "nodes" && item?.section_id
        ? { section_id: String(item.section_id).trim() }
        : {})
    }))
    .filter((item) => item.id);

  if (!String(roadmapId || "").trim()) {
    throw new Error("Roadmap id is required for atomic ordering.");
  }

  const { data, error } = await supabase.rpc("mh_admin_save_roadmap_positions", {
    p_entity: entity,
    p_roadmap_id: String(roadmapId).trim(),
    p_items: rows
  });
  if (error) throw error;

  invalidateRoadmapCache();
  return data || rows;
}

export async function validateRoadmapGraph(supabase, roadmapId) {
  const cleanId = String(roadmapId || "").trim();
  if (!cleanId) throw new Error("Roadmap id is required.");
  const { data, error } = await supabase.rpc("mh_admin_validate_roadmap", {
    p_roadmap_id: cleanId
  });
  if (error) throw error;
  return data || { valid: false, issues: [] };
}
