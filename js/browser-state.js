function cloneFallback(fallback) {
  if (Array.isArray(fallback)) return [...fallback];
  if (fallback && typeof fallback === "object") return { ...fallback };
  return fallback;
}

export function safeReadJson(storage, key, fallback = null) {
  if (!storage || !key) return cloneFallback(fallback);

  try {
    const raw = storage.getItem(key);
    if (!raw) return cloneFallback(fallback);
    return JSON.parse(raw);
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // Storage recovery must stay best-effort.
    }
    return cloneFallback(fallback);
  }
}

export function safeWriteJson(storage, key, value) {
  if (!storage || !key) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveStorageKey(storage, key) {
  if (!storage || !key) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function scopedStorageKey(baseKey, userId) {
  const base = String(baseKey || "").trim();
  const id = String(userId || "").trim();
  return base && id ? `${base}:${id}` : "";
}

export function replaceRecord(target, source) {
  if (!target || typeof target !== "object") {
    throw new TypeError("replaceRecord requires an object target.");
  }

  for (const key of Object.keys(target)) delete target[key];
  if (source && typeof source === "object" && !Array.isArray(source)) {
    Object.assign(target, source);
  }
  return target;
}

function normalizeAttemptRow(row) {
  if (!row || typeof row !== "object") return null;
  const value = String(row.value ?? row.v ?? row.answer ?? "");
  if (!value.trim()) return null;

  const timestamp = Number(row.ts ?? row.createdAt ?? row.created_at ?? 0);
  return {
    value,
    ok: Boolean(row.ok ?? row.correct),
    ...(Number.isFinite(timestamp) && timestamp > 0 ? { ts: timestamp } : {})
  };
}

export function normalizeProblemAttemptCache(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const normalized = {};

  for (const [problemId, value] of Object.entries(source)) {
    const cleanId = String(problemId || "").trim();
    if (!cleanId) continue;

    const rows = Array.isArray(value)
      ? value
      : Array.isArray(value?.tries)
        ? value.tries
        : [];

    normalized[cleanId] = rows
      .map(normalizeAttemptRow)
      .filter(Boolean)
      .slice(-200);
  }

  return normalized;
}

export function normalizeQuizAttemptCache(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const normalized = {};

  for (const [key, value] of Object.entries(source)) {
    const cleanKey = String(key || "").trim();
    if (!cleanKey) continue;

    const tries = Array.isArray(value?.tries)
      ? value.tries
          .filter((row) => row && typeof row === "object")
          .slice(-200)
      : [];

    normalized[cleanKey] = { tries };
  }

  return normalized;
}
