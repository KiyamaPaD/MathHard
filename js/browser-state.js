const DEFAULT_MAX_STORAGE_BYTES = 1024 * 1024;
const MAX_STORAGE_KEY_LENGTH = 512;
const MAX_SCOPED_ID_LENGTH = 160;
const MAX_ATTEMPT_VALUE_LENGTH = 500;
const MAX_CACHE_GROUPS = 2_000;
const MAX_ROWS_PER_GROUP = 200;

function cloneFallback(fallback) {
  if (Array.isArray(fallback)) return [...fallback];
  if (fallback && typeof fallback === "object") return { ...fallback };
  return fallback;
}

function byteLength(value) {
  const text = String(value ?? "");
  if (typeof TextEncoder === "function") return new TextEncoder().encode(text).byteLength;
  return text.length * 2;
}

function normalizeMaxBytes(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MAX_STORAGE_BYTES;
  return Math.min(Math.max(parsed, 1_024), 16 * 1024 * 1024);
}

function validStorageKey(key) {
  const value = String(key || "");
  return value.length > 0 && value.length <= MAX_STORAGE_KEY_LENGTH;
}

export function safeReadJson(storage, key, fallback = null, options = {}) {
  if (!storage || !validStorageKey(key)) return cloneFallback(fallback);
  const maxBytes = normalizeMaxBytes(options?.maxBytes);

  try {
    const raw = storage.getItem(key);
    if (!raw) return cloneFallback(fallback);
    if (byteLength(raw) > maxBytes) {
      storage.removeItem(key);
      return cloneFallback(fallback);
    }
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

export function safeWriteJson(storage, key, value, options = {}) {
  if (!storage || !validStorageKey(key)) return false;
  const maxBytes = normalizeMaxBytes(options?.maxBytes);

  try {
    const serialized = JSON.stringify(value);
    if (byteLength(serialized) > maxBytes) return false;
    storage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveStorageKey(storage, key) {
  if (!storage || !validStorageKey(key)) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function safeScope(userId) {
  const raw = String(userId || "").trim();
  if (!raw || raw.length > MAX_SCOPED_ID_LENGTH) return "";
  return encodeURIComponent(raw);
}

export function scopedStorageKey(baseKey, userId) {
  const base = String(baseKey || "").trim();
  const scope = safeScope(userId);
  if (!base || base.length > 320 || !scope) return "";
  return `${base}:${scope}`;
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
  const value = String(row.value ?? row.v ?? row.answer ?? "")
    .slice(0, MAX_ATTEMPT_VALUE_LENGTH);
  if (!value.trim()) return null;

  const timestamp = Number(row.ts ?? row.createdAt ?? row.created_at ?? 0);
  return {
    value,
    ok: Boolean(row.ok ?? row.correct),
    ...(Number.isFinite(timestamp) && timestamp > 0 ? { ts: timestamp } : {})
  };
}

function safeCacheKey(value) {
  const clean = String(value || "").trim();
  return clean && clean.length <= 240 ? clean : "";
}

export function normalizeProblemAttemptCache(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const normalized = {};

  for (const [problemId, value] of Object.entries(source).slice(0, MAX_CACHE_GROUPS)) {
    const cleanId = safeCacheKey(problemId);
    if (!cleanId) continue;

    const rows = Array.isArray(value)
      ? value
      : Array.isArray(value?.tries)
        ? value.tries
        : [];

    normalized[cleanId] = rows
      .map(normalizeAttemptRow)
      .filter(Boolean)
      .slice(-MAX_ROWS_PER_GROUP);
  }

  return normalized;
}

function sanitizeQuizAttemptRow(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const sanitized = {};

  if (Array.isArray(row.selected)) {
    sanitized.selected = [...new Set(
      row.selected
        .map((value) => String(value || "").trim().slice(0, 64))
        .filter(Boolean)
    )].slice(0, 16);
  }

  if (Object.prototype.hasOwnProperty.call(row, "answer")) {
    sanitized.answer = String(row.answer ?? "").slice(0, MAX_ATTEMPT_VALUE_LENGTH);
  }
  if (Object.prototype.hasOwnProperty.call(row, "ok")) sanitized.ok = Boolean(row.ok);
  if (Object.prototype.hasOwnProperty.call(row, "correct")) sanitized.correct = Boolean(row.correct);

  const timestamp = Number(row.ts ?? row.createdAt ?? row.created_at ?? 0);
  if (Number.isFinite(timestamp) && timestamp > 0) sanitized.ts = timestamp;

  return Object.keys(sanitized).length ? sanitized : null;
}

export function normalizeQuizAttemptCache(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const normalized = {};

  for (const [key, value] of Object.entries(source).slice(0, MAX_CACHE_GROUPS)) {
    const cleanKey = safeCacheKey(key);
    if (!cleanKey) continue;

    const tries = Array.isArray(value?.tries)
      ? value.tries
          .map(sanitizeQuizAttemptRow)
          .filter(Boolean)
          .slice(-MAX_ROWS_PER_GROUP)
      : [];

    normalized[cleanKey] = { tries };
  }

  return normalized;
}
