const CACHE_VERSION = 6;
const CACHE_KEY = `mh_content_catalog_v${CACHE_VERSION}`;
const CACHE_TTL_MS = 10 * 60 * 1000;
const STALE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CATALOG_GROUPS = [
  { key: "lessons", table: "mh_lessons" },
  { key: "problems", table: "mh_problems" },
  { key: "exams", table: "mh_exams" }
];

let memorySnapshot = null;
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

function uniqueCount(items) {
  return new Set(asArray(items).map((item) => String(item?.id || "").trim()).filter(Boolean)).size;
}

function buildProvenance(catalog) {
  const result = { lessons: {}, problems: {}, exams: {} };

  for (const { key } of CATALOG_GROUPS) {
    for (const item of asArray(catalog?.[key])) {
      const id = String(item?.id || "").trim();
      if (id) result[key][id] = ["supabase"];
    }
  }

  return result;
}

function getStorage() {
  try {
    return globalThis.sessionStorage || null;
  } catch {
    return null;
  }
}

function readStoredSnapshot({ allowStale = false } = {}) {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const createdAt = Number(parsed?.createdAt || 0);
    const age = Date.now() - createdAt;
    const maxAge = allowStale ? STALE_CACHE_TTL_MS : CACHE_TTL_MS;

    if (!createdAt || age > maxAge) {
      storage.removeItem(CACHE_KEY);
      return null;
    }

    const catalog = sanitizeCatalog(parsed.catalog);
    return {
      createdAt,
      catalog,
      provenance: buildProvenance(catalog),
      sourceCounts: {
        supabase: {
          lessons: uniqueCount(catalog.lessons),
          problems: uniqueCount(catalog.problems),
          exams: uniqueCount(catalog.exams)
        }
      },
      status: age <= CACHE_TTL_MS ? "cache-fresh" : "cache-stale",
      staleGroups: asArray(parsed.staleGroups),
      errors: asArray(parsed.errors)
    };
  } catch (error) {
    console.warn("Content cache could not be read:", error);
    return null;
  }
}

function writeStoredSnapshot(snapshot) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(
      CACHE_KEY,
      JSON.stringify({
        createdAt: snapshot.createdAt,
        catalog: sanitizeCatalog(snapshot.catalog),
        staleGroups: asArray(snapshot.staleGroups),
        errors: asArray(snapshot.errors)
      })
    );
  } catch (error) {
    console.warn("Content cache could not be written:", error);
  }
}

function makeSnapshot(catalog, {
  status = "supabase",
  staleGroups = [],
  errors = [],
  createdAt = Date.now()
} = {}) {
  const safeCatalog = sanitizeCatalog(catalog);

  return {
    createdAt,
    catalog: safeCatalog,
    provenance: buildProvenance(safeCatalog),
    sourceCounts: {
      supabase: {
        lessons: uniqueCount(safeCatalog.lessons),
        problems: uniqueCount(safeCatalog.problems),
        exams: uniqueCount(safeCatalog.exams)
      }
    },
    status,
    staleGroups: [...staleGroups],
    errors: [...errors]
  };
}

async function fetchSupabaseGroup(supabase, table) {
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw error;
  return asArray(data);
}

async function fetchSupabaseCatalog(supabase, fallbackSnapshot = null) {
  if (!supabase) {
    throw new Error("Supabase client is required to load the MathHard catalog.");
  }

  const settled = await Promise.allSettled(
    CATALOG_GROUPS.map(({ table }) => fetchSupabaseGroup(supabase, table))
  );

  const catalog = emptyCatalog();
  const staleGroups = [];
  const errors = [];

  CATALOG_GROUPS.forEach(({ key, table }, index) => {
    const result = settled[index];

    if (result.status === "fulfilled") {
      catalog[key] = result.value;
      return;
    }

    const fallback = asArray(fallbackSnapshot?.catalog?.[key]);
    if (fallback.length > 0) {
      catalog[key] = fallback;
      staleGroups.push(key);
    }

    errors.push({
      group: key,
      table,
      message: result.reason?.message || String(result.reason || "Unknown Supabase error")
    });
  });

  const missingWithoutFallback = CATALOG_GROUPS
    .map(({ key }) => key)
    .filter((key) => errors.some((entry) => entry.group === key) && catalog[key].length === 0);

  if (missingWithoutFallback.length > 0) {
    const error = new Error(
      `MathHard catalog could not be loaded from Supabase: ${missingWithoutFallback.join(", ")}.`
    );
    error.name = "MathHardCatalogLoadError";
    error.details = errors;
    throw error;
  }

  return makeSnapshot(catalog, {
    status: staleGroups.length ? "degraded" : "supabase",
    staleGroups,
    errors
  });
}

export function catalogTotals(catalog) {
  const safe = sanitizeCatalog(catalog);
  return {
    lessonsTotal: uniqueCount(safe.lessons),
    problemsTotal: uniqueCount(safe.problems),
    examsTotal: uniqueCount(safe.exams)
  };
}

export function invalidateContentCatalogCache() {
  memorySnapshot = null;
  inFlightLoad = null;

  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(CACHE_KEY);
  } catch {
    // Cache invalidation must never block Admin operations.
  }
}

export function getContentItemSources(kind, id) {
  const safeKind = CATALOG_GROUPS.some((entry) => entry.key === kind) ? kind : "";
  const safeId = String(id || "").trim();
  if (!safeKind || !safeId) return [];
  return [...asArray(memorySnapshot?.provenance?.[safeKind]?.[safeId])];
}

export function getContentCatalogDiagnostics() {
  const snapshot = memorySnapshot || makeSnapshot(emptyCatalog(), { status: "empty" });
  return {
    totals: catalogTotals(snapshot.catalog),
    sourceCounts: snapshot.sourceCounts,
    conflicts: [],
    createdAt: Number(snapshot.createdAt || 0),
    status: snapshot.status,
    staleGroups: [...asArray(snapshot.staleGroups)],
    errors: [...asArray(snapshot.errors)]
  };
}

export async function loadContentCatalog({
  supabase,
  forceRefresh = false
} = {}) {
  if (forceRefresh) {
    // Bypass the current in-memory snapshot, but keep the last stored snapshot
    // available as a safety net if one Supabase table fails during refresh.
    memorySnapshot = null;
    inFlightLoad = null;
  }

  if (!forceRefresh && memorySnapshot) {
    return memorySnapshot.catalog;
  }

  if (!forceRefresh) {
    const freshStored = readStoredSnapshot();
    if (freshStored) {
      memorySnapshot = freshStored;
      return freshStored.catalog;
    }
  }

  if (inFlightLoad) return inFlightLoad;

  inFlightLoad = (async () => {
    const staleStored = readStoredSnapshot({ allowStale: true });

    try {
      const snapshot = await fetchSupabaseCatalog(supabase, staleStored);
      memorySnapshot = snapshot;
      writeStoredSnapshot(snapshot);
      return snapshot.catalog;
    } catch (error) {
      if (staleStored) {
        memorySnapshot = {
          ...staleStored,
          status: "degraded",
          staleGroups: CATALOG_GROUPS.map(({ key }) => key),
          errors: [{
            group: "catalog",
            table: "Supabase",
            message: error?.message || String(error)
          }]
        };
        return memorySnapshot.catalog;
      }

      throw error;
    }
  })().finally(() => {
    inFlightLoad = null;
  });

  return inFlightLoad;
}

// Compatibility alias retained for older call sites outside the main bundle.
export async function loadRemoteContentCatalog(options = {}) {
  return loadContentCatalog(options);
}
