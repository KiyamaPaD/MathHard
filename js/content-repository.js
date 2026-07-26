const CACHE_VERSION = 12;
const CACHE_PREFIX = `mh_content_catalog_v${CACHE_VERSION}`;
const CACHE_TTL_MS = 10 * 60 * 1000;
const STALE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

function getStorage() {
  try {
    return globalThis.sessionStorage || null;
  } catch {
    return null;
  }
}

function cacheKeyForUser(userId) {
  return `${CACHE_PREFIX}:${String(userId || "").trim()}`;
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
    errors: [...errors]
  };
}

function readStoredSnapshot(userId, { allowStale = false } = {}) {
  const storage = getStorage();
  if (!storage || !userId) return null;

  try {
    const raw = storage.getItem(cacheKeyForUser(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const storedUserId = String(parsed?.userId || "");
    const createdAt = Number(parsed?.createdAt || 0);
    const age = Date.now() - createdAt;
    const maxAge = allowStale ? STALE_CACHE_TTL_MS : CACHE_TTL_MS;

    if (storedUserId !== String(userId) || !createdAt || age > maxAge) {
      storage.removeItem(cacheKeyForUser(userId));
      return null;
    }

    return makeSnapshot(parsed.catalog, {
      userId,
      createdAt,
      status: age <= CACHE_TTL_MS ? "cache-fresh" : "cache-stale",
      errors: asArray(parsed.errors)
    });
  } catch (error) {
    console.warn("Content cache could not be read:", error);
    return null;
  }
}

function writeStoredSnapshot(snapshot) {
  const storage = getStorage();
  if (!storage || !snapshot?.userId) return;

  try {
    storage.setItem(
      cacheKeyForUser(snapshot.userId),
      JSON.stringify({
        userId: snapshot.userId,
        createdAt: snapshot.createdAt,
        catalog: snapshot.catalog,
        errors: snapshot.errors
      })
    );
  } catch (error) {
    console.warn("Content cache could not be written:", error);
  }
}

async function resolveAuthenticatedUser(supabase, userOverride = undefined) {
  if (userOverride !== undefined) {
    if (!userOverride?.id) throw new MathHardAuthRequiredError();
    return userOverride;
  }

  if (!supabase?.auth) {
    throw new Error("Supabase client is required to load the MathHard catalog.");
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const user = data?.session?.user || null;
  if (!user?.id) throw new MathHardAuthRequiredError();
  return user;
}

function unwrapCatalogRpcPayload(data) {
  const candidate = Array.isArray(data) && data.length === 1 ? data[0] : data;
  if (candidate?.catalog && typeof candidate.catalog === "object") {
    return candidate.catalog;
  }
  return candidate;
}

async function fetchCatalogRpc(supabase, userId) {
  const { data, error } = await supabase.rpc("mh_get_content_catalog");
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
      storage.removeItem(cacheKeyForUser(userId));
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
    userId: snapshot.userId || "",
    createdAt: Number(snapshot.createdAt || 0),
    status: snapshot.status,
    staleGroups: snapshot.status === "degraded"
      ? [...new Set(asArray(snapshot.errors).map((entry) => entry?.group || "catalog"))]
      : [],
    errors: [...asArray(snapshot.errors)]
  };
}

export async function loadContentCatalog({
  supabase,
  forceRefresh = false,
  user = undefined
} = {}) {
  const authenticatedUser = await resolveAuthenticatedUser(supabase, user);
  const userId = authenticatedUser.id;

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
          errors: [{
            group: "catalog",
            table: "mh_get_content_catalog",
            message: error?.message || String(error)
          }]
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
