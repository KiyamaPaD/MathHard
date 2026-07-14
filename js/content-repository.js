const CACHE_VERSION = 2;
const CACHE_KEY = `mh_content_catalog_v${CACHE_VERSION}`;
const CACHE_TTL_MS = 10 * 60 * 1000;

let memoryCache = null;
let inFlightLoad = null;

function emptyCatalog() {
  return {
    lessons: [],
    problems: [],
    exams: []
  };
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

export function mergeById(...catalogs) {
  const mergeGroup = (key) => {
    const byId = new Map();

    for (const catalog of catalogs) {
      for (const item of asArray(catalog?.[key])) {
        const id = String(item?.id || "").trim();
        if (!id) continue;

        byId.set(id, {
          ...(byId.get(id) || {}),
          ...item,
          id
        });
      }
    }

    return [...byId.values()];
  };

  return {
    lessons: mergeGroup("lessons"),
    problems: mergeGroup("problems"),
    exams: mergeGroup("exams")
  };
}

export function catalogTotals(catalog) {
  const safe = sanitizeCatalog(catalog);

  return {
    lessonsTotal: new Set(safe.lessons.map((item) => item?.id).filter(Boolean)).size,
    problemsTotal: new Set(safe.problems.map((item) => item?.id).filter(Boolean)).size,
    examsTotal: new Set(safe.exams.map((item) => item?.id).filter(Boolean)).size
  };
}

function getStorage() {
  try {
    return globalThis.sessionStorage || null;
  } catch {
    return null;
  }
}

function readStoredCache() {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const createdAt = Number(parsed?.createdAt || 0);

    if (!createdAt || Date.now() - createdAt > CACHE_TTL_MS) {
      storage.removeItem(CACHE_KEY);
      return null;
    }

    return {
      createdAt,
      catalog: sanitizeCatalog(parsed.catalog)
    };
  } catch (error) {
    console.warn("Content cache could not be read:", error);
    return null;
  }
}

function writeStoredCache(catalog) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(
      CACHE_KEY,
      JSON.stringify({
        createdAt: Date.now(),
        catalog: sanitizeCatalog(catalog)
      })
    );
  } catch (error) {
    // The application must continue even if the browser blocks storage or the
    // storage quota is full.
    console.warn("Content cache could not be written:", error);
  }
}

async function fetchJsonCatalog() {
  try {
    const response = await fetch("/data/problems.json", {
      headers: { Accept: "application/json" },
      cache: "default"
    });

    if (!response.ok) {
      throw new Error(`problems.json returned HTTP ${response.status}`);
    }

    return sanitizeCatalog(await response.json());
  } catch (error) {
    console.warn("Local JSON catalog could not be loaded:", error);
    return emptyCatalog();
  }
}

async function fetchSupabaseCatalog(supabase) {
  if (!supabase) return emptyCatalog();

  try {
    const [lessonsResult, problemsResult, examsResult] = await Promise.all([
      supabase.from("mh_lessons").select("*"),
      supabase.from("mh_problems").select("*"),
      supabase.from("mh_exams").select("*")
    ]);

    if (lessonsResult.error) throw lessonsResult.error;
    if (problemsResult.error) throw problemsResult.error;
    if (examsResult.error) throw examsResult.error;

    return {
      lessons: asArray(lessonsResult.data),
      problems: asArray(problemsResult.data),
      exams: asArray(examsResult.data)
    };
  } catch (error) {
    console.error("Supabase catalog could not be loaded:", error);
    return emptyCatalog();
  }
}

export function invalidateContentCatalogCache() {
  memoryCache = null;
  inFlightLoad = null;

  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(CACHE_KEY);
  } catch {
    // Cache invalidation should never block the application.
  }
}

export async function loadRemoteContentCatalog({
  supabase,
  forceRefresh = false
} = {}) {
  if (forceRefresh) {
    invalidateContentCatalogCache();
  }

  if (!forceRefresh && memoryCache) {
    return memoryCache.catalog;
  }

  if (!forceRefresh) {
    const stored = readStoredCache();
    if (stored) {
      memoryCache = stored;
      return stored.catalog;
    }
  }

  if (inFlightLoad) return inFlightLoad;

  inFlightLoad = (async () => {
    const [jsonCatalog, supabaseCatalog] = await Promise.all([
      fetchJsonCatalog(),
      fetchSupabaseCatalog(supabase)
    ]);

    // Supabase has precedence over the bundled JSON whenever an ID exists in
    // both places. This matches the previous runtime behavior.
    const catalog = mergeById(jsonCatalog, supabaseCatalog);

    memoryCache = {
      createdAt: Date.now(),
      catalog
    };

    writeStoredCache(catalog);
    return catalog;
  })().finally(() => {
    inFlightLoad = null;
  });

  return inFlightLoad;
}
