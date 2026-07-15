const CACHE_VERSION = 5;
const CACHE_KEY = `mh_content_catalog_v${CACHE_VERSION}`;
const CACHE_TTL_MS = 10 * 60 * 1000;

const SOURCE_ORDER = ["bundle", "json", "supabase"];
const CATALOG_KEYS = ["lessons", "problems", "exams"];
const MAX_RECORDED_CONFLICTS = 500;

let memoryCache = null;
let inFlightLoad = null;

function emptyCatalog() {
  return {
    lessons: [],
    problems: [],
    exams: []
  };
}

function emptyProvenance() {
  return {
    lessons: {},
    problems: {},
    exams: {}
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

function sanitizeProvenance(value) {
  const result = emptyProvenance();

  for (const key of CATALOG_KEYS) {
    const group = value?.[key];
    if (!group || typeof group !== "object") continue;

    for (const [id, sources] of Object.entries(group)) {
      result[key][id] = asArray(sources).filter((source) => SOURCE_ORDER.includes(source));
    }
  }

  return result;
}

function isMeaningfulValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function valuesDiffer(a, b) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

function mergeItemPreservingFallback(current, incoming) {
  const merged = { ...(current || {}) };

  for (const [key, value] of Object.entries(incoming || {})) {
    if (key === "id") continue;

    const previous = merged[key];
    if (!isMeaningfulValue(value) && isMeaningfulValue(previous)) {
      continue;
    }

    merged[key] = value;
  }

  return merged;
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

export function mergeCatalogSources(sourceCatalogs = []) {
  const catalog = emptyCatalog();
  const provenance = emptyProvenance();
  const conflicts = [];
  const sourceCounts = Object.fromEntries(
    SOURCE_ORDER.map((source) => [source, { lessons: 0, problems: 0, exams: 0 }])
  );

  for (const key of CATALOG_KEYS) {
    const byId = new Map();
    const valuesByField = new Map();

    for (const source of SOURCE_ORDER) {
      const sourceCatalog = sourceCatalogs.find((entry) => entry?.source === source)?.catalog;
      const items = asArray(sourceCatalog?.[key]);
      sourceCounts[source][key] = new Set(items.map((item) => String(item?.id || "").trim()).filter(Boolean)).size;

      for (const item of items) {
        const id = String(item?.id || "").trim();
        if (!id) continue;

        const current = byId.get(id) || { id };
        byId.set(id, {
          ...mergeItemPreservingFallback(current, item),
          id
        });

        const existingSources = provenance[key][id] || [];
        if (!existingSources.includes(source)) {
          provenance[key][id] = [...existingSources, source];
        }

        for (const [field, value] of Object.entries(item)) {
          if (field === "id" || !isMeaningfulValue(value)) continue;

          const fieldKey = `${id}\u0000${field}`;
          const previous = valuesByField.get(fieldKey);

          if (previous && previous.source !== source && valuesDiffer(previous.value, value)) {
            if (conflicts.length < MAX_RECORDED_CONFLICTS) {
              conflicts.push({
                kind: key,
                id,
                field,
                lowerPrioritySource: previous.source,
                higherPrioritySource: source
              });
            }
          }

          valuesByField.set(fieldKey, { source, value });
        }
      }
    }

    catalog[key] = [...byId.values()];
  }

  return {
    catalog,
    provenance,
    conflicts,
    sourceCounts
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
      catalog: sanitizeCatalog(parsed.catalog),
      provenance: sanitizeProvenance(parsed.provenance),
      conflicts: asArray(parsed.conflicts),
      sourceCounts: parsed?.sourceCounts || {}
    };
  } catch (error) {
    console.warn("Content cache could not be read:", error);
    return null;
  }
}

function writeStoredCache(snapshot) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(
      CACHE_KEY,
      JSON.stringify({
        createdAt: Date.now(),
        catalog: sanitizeCatalog(snapshot.catalog),
        provenance: sanitizeProvenance(snapshot.provenance),
        conflicts: asArray(snapshot.conflicts),
        sourceCounts: snapshot.sourceCounts || {}
      })
    );
  } catch (error) {
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

  const [lessonsResult, problemsResult, examsResult] = await Promise.all([
    supabase.from("mh_lessons").select("*"),
    supabase.from("mh_problems").select("*"),
    supabase.from("mh_exams").select("*")
  ]);

  const result = emptyCatalog();

  if (lessonsResult.error) {
    console.warn("Supabase lessons could not be loaded; bundled lessons remain available:", lessonsResult.error);
  } else {
    result.lessons = asArray(lessonsResult.data);
  }

  if (problemsResult.error) {
    console.warn("Supabase problems could not be loaded; bundled problems remain available:", problemsResult.error);
  } else {
    result.problems = asArray(problemsResult.data);
  }

  if (examsResult.error) {
    console.warn("Supabase exams could not be loaded; bundled exams remain available:", examsResult.error);
  } else {
    result.exams = asArray(examsResult.data);
  }

  return result;
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

export function getContentItemSources(kind, id) {
  const safeKind = CATALOG_KEYS.includes(kind) ? kind : "";
  const safeId = String(id || "").trim();
  if (!safeKind || !safeId) return [];

  return [...asArray(memoryCache?.provenance?.[safeKind]?.[safeId])];
}

export function getContentCatalogDiagnostics() {
  return {
    totals: catalogTotals(memoryCache?.catalog || emptyCatalog()),
    sourceCounts: memoryCache?.sourceCounts || {},
    conflicts: [...asArray(memoryCache?.conflicts)],
    createdAt: Number(memoryCache?.createdAt || 0)
  };
}

export async function loadContentCatalog({
  supabase,
  bundledCatalog = emptyCatalog(),
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

    const merged = mergeCatalogSources([
      { source: "bundle", catalog: sanitizeCatalog(bundledCatalog) },
      { source: "json", catalog: jsonCatalog },
      { source: "supabase", catalog: supabaseCatalog }
    ]);

    memoryCache = {
      createdAt: Date.now(),
      ...merged
    };

    writeStoredCache(memoryCache);
    return memoryCache.catalog;
  })().finally(() => {
    inFlightLoad = null;
  });

  return inFlightLoad;
}

// Temporary compatibility alias for older code paths. New code should call
// loadContentCatalog and pass the bundled DATA catalog explicitly.
export async function loadRemoteContentCatalog(options = {}) {
  return loadContentCatalog(options);
}
