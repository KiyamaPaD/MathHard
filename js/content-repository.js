const CACHE_VERSION = 15;
const CACHE_PREFIX = `mh_content_catalog_v${CACHE_VERSION}`;
const CACHE_TTL_MS = 10 * 60 * 1000;
const STALE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CACHE_BYTES = 4 * 1024 * 1024;
const MAX_USER_ID_LENGTH = 160;
const GUEST_SCOPE = "__guest__";
const SENSITIVE_CATALOG_KEY = /^(?:answer|answers|answer_key|correct_answer|expected_answer|is_correct|hint(?:1|2)?(?:_ro|_en)?|solution(?:_ro|_en)?|explanation_(?:simple|boss|academic)(?:_ro|_en)?|access_token|refresh_token|password|secret)$/i;

let memorySnapshot = null;
let inFlightLoad = null;
let loadEpoch = 0;

function emptyCatalog() {
  return { lessons: [], problems: [], exams: [] };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function sanitizeCatalog(value) {
  return {
    lessons: asArray(value?.lessons),
    problems: asArray(value?.problems),
    exams: asArray(value?.exams)
  };
}

function uniqueCount(items) {
  return new Set(
    asArray(items)
      .map((item) => String(item?.id || "").trim())
      .filter(Boolean)
  ).size;
}

function byteLength(value) {
  const text = String(value ?? "");
  if (typeof TextEncoder === "function") return new TextEncoder().encode(text).byteLength;
  return text.length * 2;
}

function getStorage() {
  try {
    return globalThis.sessionStorage || null;
  } catch {
    return null;
  }
}

function safeUserScope(userId) {
  const raw = String(userId || "").trim();
  if (!raw || raw.length > MAX_USER_ID_LENGTH) return "";
  return encodeURIComponent(raw);
}

function cacheKeyForUser(userId) {
  const scope = safeUserScope(userId);
  return scope ? `${CACHE_PREFIX}:${scope}` : "";
}

function purgeLegacyContentCaches() {
  const storage = getStorage();
  if (!storage) return;
  try {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index) || "";
      if (key.startsWith("mh_content_catalog_v") && !key.startsWith(`${CACHE_PREFIX}:`)) {
        storage.removeItem(key);
      }
    }
  } catch {
    // Legacy cache cleanup is best-effort.
  }
}

purgeLegacyContentCaches();

function containsSensitiveCatalogData(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.some((entry) => containsSensitiveCatalogData(entry, seen));
  }

  for (const [key, entry] of Object.entries(value)) {
    if (SENSITIVE_CATALOG_KEY.test(key)) return true;
    if (containsSensitiveCatalogData(entry, seen)) return true;
  }
  return false;
}

function safeDiagnosticErrors(errors) {
  return asArray(errors).slice(0, 10).map((entry) => ({
    group: String(entry?.group || "catalog").slice(0, 80),
    table: String(entry?.table || "mh_get_content_catalog").slice(0, 120),
    message: "Catalog temporarily unavailable."
  }));
}

export class MathHardAuthRequiredError extends Error {
  constructor(message = "Authentication is required to load MathHard content.") {
    super(message);
    this.name = "MathHardAuthRequiredError";
    this.code = "MH_AUTH_REQUIRED";
  }
}

export function isContentAuthRequiredError(error) {
  return error?.code === "MH_AUTH_REQUIRED" || error?.name === "MathHardAuthRequiredError";
}

function makeSnapshot(catalog, {
  userId = "",
  status = "supabase-rpc",
  errors = [],
  createdAt = Date.now()
} = {}) {
  return {
    userId: String(userId || ""),
    createdAt,
    catalog: sanitizeCatalog(catalog),
    status,
    errors: safeDiagnosticErrors(errors)
  };
}

function removeStoredSnapshot(storage, userId) {
  const key = cacheKeyForUser(userId);
  if (!storage || !key) return;
  try {
    storage.removeItem(key);
  } catch {
    // Cache cleanup is best-effort.
  }
}

function readStoredSnapshot(userId, { allowStale = false } = {}) {
  const storage = getStorage();
  const storageKey = cacheKeyForUser(userId);
  if (!storage || !storageKey) return null;

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return null;
    if (byteLength(raw) > MAX_CACHE_BYTES) {
      storage.removeItem(storageKey);
      return null;
    }

    const parsed = JSON.parse(raw);
    const storedUserId = String(parsed?.userId || "");
    const createdAt = Number(parsed?.createdAt || 0);
    const age = Date.now() - createdAt;
    const maxAge = allowStale ? STALE_CACHE_TTL_MS : CACHE_TTL_MS;
    const catalog = sanitizeCatalog(parsed?.catalog);

    if (
      storedUserId !== String(userId) ||
      !createdAt ||
      !Number.isFinite(age) ||
      age < 0 ||
      age > maxAge ||
      containsSensitiveCatalogData(catalog)
    ) {
      storage.removeItem(storageKey);
      return null;
    }

    return makeSnapshot(catalog, {
      userId,
      createdAt,
      status: age <= CACHE_TTL_MS ? "cache-fresh" : "cache-stale",
      errors: asArray(parsed.errors)
    });
  } catch {
    removeStoredSnapshot(storage, userId);
    console.warn("Content cache was discarded because it could not be validated.");
    return null;
  }
}

function writeStoredSnapshot(snapshot) {
  const storage = getStorage();
  const storageKey = cacheKeyForUser(snapshot?.userId);
  if (!storage || !storageKey || !snapshot?.userId) return false;

  // Admin catalog responses may legitimately contain answer keys and solutions.
  // They may be used in memory for the current session, but must never be
  // persisted in browser storage where another script or later session can read them.
  if (containsSensitiveCatalogData(snapshot.catalog)) {
    removeStoredSnapshot(storage, snapshot.userId);
    return false;
  }

  try {
    const serialized = JSON.stringify({
      userId: snapshot.userId,
      createdAt: snapshot.createdAt,
      catalog: snapshot.catalog,
      errors: safeDiagnosticErrors(snapshot.errors)
    });
    if (byteLength(serialized) > MAX_CACHE_BYTES) {
      removeStoredSnapshot(storage, snapshot.userId);
      return false;
    }
    storage.setItem(storageKey, serialized);
    return true;
  } catch {
    console.warn("Content cache could not be written.");
    return false;
  }
}

async function resolveCatalogScope(supabase, userOverride = undefined) {
  if (!supabase?.auth) {
    throw new Error("Supabase client is required to load the MathHard catalog.");
  }
  if (userOverride !== undefined) {
    return userOverride?.id ? String(userOverride.id) : GUEST_SCOPE;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data?.session?.user?.id ? String(data.session.user.id) : GUEST_SCOPE;
}

function unwrapCatalogRpcPayload(data) {
  const candidate = Array.isArray(data) && data.length === 1 ? data[0] : data;
  if (candidate?.catalog && typeof candidate.catalog === "object") {
    return candidate.catalog;
  }
  return candidate;
}

async function fetchCatalogRpc(supabase, userId) {
  const rpcName = userId === GUEST_SCOPE ? "mh_get_public_content_catalog" : "mh_get_content_catalog";
  const { data, error } = await supabase.rpc(rpcName);
  if (error) throw error;

  const catalog = sanitizeCatalog(unwrapCatalogRpcPayload(data));
  return makeSnapshot(catalog, { userId, status: "supabase-rpc" });
}

export function catalogTotals(catalog) {
  const safe = sanitizeCatalog(catalog);
  return {
    lessonsTotal: uniqueCount(safe.lessons),
    problemsTotal: uniqueCount(safe.problems),
    examsTotal: uniqueCount(safe.exams)
  };
}

export function invalidateContentCatalogCache({ allUsers = true, userId = "" } = {}) {
  loadEpoch += 1;
  memorySnapshot = null;
  inFlightLoad = null;

  const storage = getStorage();
  if (!storage) return;

  try {
    if (!allUsers && userId) {
      removeStoredSnapshot(storage, userId);
      return;
    }

    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key?.startsWith(`${CACHE_PREFIX}:`) || key?.startsWith("mh_content_catalog_v")) {
        storage.removeItem(key);
      }
    }
  } catch {
    // Cache invalidation must never block logout or Admin operations.
  }
}

export function getContentCatalogDiagnostics() {
  const snapshot = memorySnapshot || makeSnapshot(emptyCatalog(), { status: "empty" });
  return {
    totals: catalogTotals(snapshot.catalog),
    userId: snapshot.userId && snapshot.userId !== GUEST_SCOPE ? "[authenticated]" : "",
    createdAt: Number(snapshot.createdAt || 0),
    status: snapshot.status,
    staleGroups: snapshot.status === "degraded"
      ? [...new Set(asArray(snapshot.errors).map((entry) => entry?.group || "catalog"))]
      : [],
    errors: safeDiagnosticErrors(snapshot.errors)
  };
}

export async function loadContentCatalog({
  supabase,
  forceRefresh = false,
  user = undefined
} = {}) {
  const userId = await resolveCatalogScope(supabase, user);

  if (memorySnapshot?.userId && memorySnapshot.userId !== userId) {
    loadEpoch += 1;
    memorySnapshot = null;
    inFlightLoad = null;
  }

  if (forceRefresh) {
    loadEpoch += 1;
    memorySnapshot = null;
    inFlightLoad = null;
  }

  if (!forceRefresh && memorySnapshot?.userId === userId) {
    const age = Date.now() - Number(memorySnapshot.createdAt || 0);
    if (Number.isFinite(age) && age >= 0 && age <= CACHE_TTL_MS) {
      return memorySnapshot.catalog;
    }
    memorySnapshot = null;
  }

  if (!forceRefresh) {
    const freshStored = readStoredSnapshot(userId);
    if (freshStored) {
      memorySnapshot = freshStored;
      return freshStored.catalog;
    }
  }

  if (inFlightLoad?.userId === userId) return inFlightLoad.promise;

  const staleStored = readStoredSnapshot(userId, { allowStale: true });
  const requestEpoch = loadEpoch;
  const promise = (async () => {
    try {
      const snapshot = await fetchCatalogRpc(supabase, userId);
      if (requestEpoch !== loadEpoch) {
        const newerLoad = inFlightLoad?.userId === userId && inFlightLoad.epoch > requestEpoch
          ? inFlightLoad.promise
          : null;
        if (newerLoad) return newerLoad;
        if (memorySnapshot?.userId === userId) return memorySnapshot.catalog;
        return snapshot.catalog;
      }

      memorySnapshot = snapshot;
      writeStoredSnapshot(snapshot);
      return snapshot.catalog;
    } catch (error) {
      if (requestEpoch !== loadEpoch) {
        const newerLoad = inFlightLoad?.userId === userId && inFlightLoad.epoch > requestEpoch
          ? inFlightLoad.promise
          : null;
        if (newerLoad) return newerLoad;
        if (memorySnapshot?.userId === userId) return memorySnapshot.catalog;
      }

      if (staleStored) {
        const degradedSnapshot = makeSnapshot(staleStored.catalog, {
          userId,
          createdAt: staleStored.createdAt,
          status: "degraded",
          errors: [{ group: "catalog", table: "mh_get_content_catalog" }]
        });
        if (requestEpoch === loadEpoch) memorySnapshot = degradedSnapshot;
        return degradedSnapshot.catalog;
      }
      throw error;
    }
  })().finally(() => {
    if (inFlightLoad?.promise === promise) inFlightLoad = null;
  });

  inFlightLoad = { userId, epoch: requestEpoch, promise };
  return promise;
}
