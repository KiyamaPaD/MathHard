const CACHE_VERSION = 1;
const CACHE_PREFIX = `mh_concept_catalog_v${CACHE_VERSION}`;
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_BYTES = 1024 * 1024;

let memoryCatalog = null;
let memoryUserId = "";
let inFlight = null;
let loadEpoch = 0;

function emptyCatalog() {
  return { concepts: [], edges: [], mappings: [], schema_version: "concept-layer-v1" };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function sanitizeCatalog(value) {
  return {
    concepts: asArray(value?.concepts),
    edges: asArray(value?.edges),
    mappings: asArray(value?.mappings),
    schema_version: String(value?.schema_version || "concept-layer-v1")
  };
}

function unwrapRpc(data) {
  const candidate = Array.isArray(data) && data.length === 1 ? data[0] : data;
  return candidate?.catalog && typeof candidate.catalog === "object"
    ? candidate.catalog
    : candidate;
}

function storage() {
  try { return globalThis.sessionStorage || null; } catch { return null; }
}

function byteLength(value) {
  const text = String(value ?? "");
  return typeof TextEncoder === "function"
    ? new TextEncoder().encode(text).byteLength
    : text.length * 2;
}

function cacheKey(userId) {
  const id = String(userId || "").trim();
  return id ? `${CACHE_PREFIX}:${encodeURIComponent(id)}` : "";
}

function readCache(userId) {
  const target = storage();
  const key = cacheKey(userId);
  if (!target || !key) return null;
  try {
    const raw = target.getItem(key);
    if (!raw || byteLength(raw) > MAX_CACHE_BYTES) return null;
    const parsed = JSON.parse(raw);
    const age = Date.now() - Number(parsed?.createdAt || 0);
    if (parsed?.userId !== userId || !Number.isFinite(age) || age < 0 || age > CACHE_TTL_MS) {
      target.removeItem(key);
      return null;
    }
    return sanitizeCatalog(parsed.catalog);
  } catch {
    try { target.removeItem(key); } catch {}
    return null;
  }
}

function writeCache(userId, catalog) {
  const target = storage();
  const key = cacheKey(userId);
  if (!target || !key) return;
  try {
    const raw = JSON.stringify({ userId, createdAt: Date.now(), catalog: sanitizeCatalog(catalog) });
    if (byteLength(raw) <= MAX_CACHE_BYTES) target.setItem(key, raw);
  } catch {
    // Concept cache is optional.
  }
}

function requireClient(supabase) {
  if (!supabase?.auth || typeof supabase.rpc !== "function") {
    throw new Error("Supabase client is required for concept operations.");
  }
}

async function resolveUser(supabase, userOverride = undefined) {
  requireClient(supabase);
  if (userOverride !== undefined) {
    if (!userOverride?.id) throw new Error("Authentication is required to load concepts.");
    return userOverride;
  }
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error("Authentication is required to load concepts.");
  return data.user;
}

export function invalidateConceptCatalogCache() {
  loadEpoch += 1;
  memoryCatalog = null;
  memoryUserId = "";
  inFlight = null;
  const target = storage();
  if (!target) return;
  try {
    for (let index = target.length - 1; index >= 0; index -= 1) {
      const key = target.key(index) || "";
      if (key.startsWith("mh_concept_catalog_v")) target.removeItem(key);
    }
  } catch {}
}

export async function loadConceptCatalog({
  supabase,
  forceRefresh = false,
  user = undefined
} = {}) {
  const activeUser = await resolveUser(supabase, user);
  const userId = activeUser.id;

  if (memoryUserId && memoryUserId !== userId) invalidateConceptCatalogCache();
  if (forceRefresh) {
    loadEpoch += 1;
    memoryCatalog = null;
    inFlight = null;
  }

  if (!forceRefresh && memoryCatalog && memoryUserId === userId) return memoryCatalog;
  if (!forceRefresh) {
    const cached = readCache(userId);
    if (cached) {
      memoryCatalog = cached;
      memoryUserId = userId;
      return cached;
    }
  }
  if (!forceRefresh && inFlight?.userId === userId) return inFlight.promise;

  const requestEpoch = loadEpoch;
  const promise = (async () => {
    const { data, error } = await supabase.rpc("mh_get_concept_catalog");
    if (error) throw error;
    const catalog = sanitizeCatalog(unwrapRpc(data) || emptyCatalog());

    if (requestEpoch !== loadEpoch) {
      if (memoryCatalog && memoryUserId === userId) return memoryCatalog;
      return catalog;
    }

    memoryCatalog = catalog;
    memoryUserId = userId;
    writeCache(userId, catalog);
    return catalog;
  })().finally(() => {
    if (inFlight?.promise === promise) inFlight = null;
  });

  inFlight = { userId, promise, epoch: requestEpoch };
  return promise;
}


export async function loadConceptCoverage(supabase) {
  await resolveUser(supabase);
  const { data, error } = await supabase.rpc("mh_admin_get_concept_coverage");
  if (error) throw error;
  return unwrapRpc(data);
}

export async function saveConcept(supabase, payload) {
  await resolveUser(supabase);
  const { data, error } = await supabase.rpc("mh_admin_save_concept", {
    p_payload: payload
  });
  if (error) throw error;
  invalidateConceptCatalogCache();
  return unwrapRpc(data);
}

export async function replaceConceptPrerequisites(supabase, conceptId, prerequisiteIds = []) {
  await resolveUser(supabase);
  const concept = String(conceptId || "").trim();
  const ids = [...new Set(asArray(prerequisiteIds).map((value) => String(value || "").trim()).filter(Boolean))];
  const { data, error } = await supabase.rpc("mh_admin_replace_concept_prerequisites", {
    p_concept_id: concept,
    p_prerequisite_concept_ids: ids
  });
  if (error) throw error;
  invalidateConceptCatalogCache();
  return unwrapRpc(data);
}

export async function replaceContentConcepts(supabase, {
  contentType,
  contentId,
  conceptIds = []
}) {
  await resolveUser(supabase);
  const ids = [...new Set(asArray(conceptIds).map((value) => String(value || "").trim()).filter(Boolean))];
  const { data, error } = await supabase.rpc("mh_admin_replace_content_concepts", {
    p_content_type: String(contentType || "").trim().toLowerCase(),
    p_content_id: String(contentId || "").trim(),
    p_concept_ids: ids
  });
  if (error) throw error;
  invalidateConceptCatalogCache();
  return unwrapRpc(data);
}

export async function deleteConceptSafely(supabase, conceptId) {
  await resolveUser(supabase);
  const { data, error } = await supabase.rpc("mh_admin_delete_concept_safe", {
    p_concept_id: String(conceptId || "").trim()
  });
  if (error) throw error;
  invalidateConceptCatalogCache();
  return unwrapRpc(data);
}
