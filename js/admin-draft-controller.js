const DRAFT_VERSION = 2;
const DRAFT_PREFIX = "mh_admin_content_draft_v2";
const LAST_CONTEXT_PREFIX = "mh_admin_last_context_v2";
const LEGACY_DRAFT_PREFIX = "mh_admin_content_draft_v1";
const LEGACY_CONTEXT_PREFIX = "mh_admin_last_context_v1";
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_DRAFT_BYTES = 750 * 1024;
const MAX_CONTROL_VALUE_LENGTH = 250_000;
const BLOCKED_FIELD_PATTERN = /(password|passwd|secret|token|authorization|api[_-]?key|session|cookie|one[_-]?time)/i;

function getStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function safeStorageGet(key) {
  const storage = getStorage();
  if (!storage || !key) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key, value) {
  const storage = getStorage();
  if (!storage || !key) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeStorageRemove(key) {
  const storage = getStorage();
  if (!storage || !key) return;
  try {
    storage.removeItem(key);
  } catch {
    // Draft persistence is best-effort.
  }
}

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function byteLength(value) {
  const text = String(value ?? "");
  if (typeof TextEncoder === "function") return new TextEncoder().encode(text).byteLength;
  return text.length * 2;
}

function safeScope(userId) {
  const raw = String(userId || "").trim();
  if (!raw || raw.length > 160) return "";
  return encodeURIComponent(raw);
}

function legacyScope(userId) {
  const raw = String(userId || "").trim();
  if (!raw) return "";
  return raw.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function safeContextPart(value, fallback) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  return encodeURIComponent(raw.slice(0, 240));
}

export function normalizeAdminDraftContext(raw = {}) {
  const mode = raw?.mode === "edit" ? "edit" : "create";
  const allowedTypes = new Set(["lesson", "problem", "exam", "research", "history"]);
  const type = allowedTypes.has(String(raw?.type || "")) ? String(raw.type) : "lesson";
  const id = mode === "edit" ? String(raw?.id || "").trim().slice(0, 240) : "";
  return { mode, type, id };
}

export function adminDraftStorageKey(context, userId = "") {
  const scope = safeScope(userId);
  if (!scope) return "";
  const normalized = normalizeAdminDraftContext(context);
  return [
    DRAFT_PREFIX,
    scope,
    normalized.mode,
    normalized.type,
    safeContextPart(normalized.id, "new")
  ].join(":");
}

function legacyAdminDraftStorageKey(context, userId = "") {
  const scope = legacyScope(userId);
  if (!scope) return "";
  const normalized = normalizeAdminDraftContext(context);
  return [
    LEGACY_DRAFT_PREFIX,
    scope,
    normalized.mode,
    normalized.type,
    normalized.id || "new"
  ].join(":");
}

export function adminLastContextStorageKey(userId = "") {
  const scope = safeScope(userId);
  return scope ? `${LAST_CONTEXT_PREFIX}:${scope}` : "";
}

function legacyAdminLastContextStorageKey(userId = "") {
  const scope = legacyScope(userId);
  return scope ? `${LEGACY_CONTEXT_PREFIX}:${scope}` : "";
}

function isCredentialField(field) {
  const type = String(field?.type || "").toLowerCase();
  if (["password", "file", "submit", "button", "reset", "hidden"].includes(type)) return true;
  if (field?.hasAttribute?.("data-sensitive")) return true;
  const autocomplete = String(field?.autocomplete || "").toLowerCase();
  if (["current-password", "new-password", "one-time-code"].includes(autocomplete)) return true;
  return BLOCKED_FIELD_PATTERN.test(`${field?.id || ""} ${field?.name || ""}`);
}

function sanitizeControlValue(stored) {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return null;
  const type = String(stored.type || "");
  if (type === "checkbox" || type === "radio") {
    return {
      type,
      checked: Boolean(stored.checked),
      value: String(stored.value ?? "").slice(0, 10_000)
    };
  }
  if (type === "select-multiple") {
    const value = Array.isArray(stored.value)
      ? stored.value.map((entry) => String(entry).slice(0, 10_000)).slice(0, 100)
      : [];
    return { type, value };
  }
  if (!["input", "textarea", "select"].includes(type)) return null;
  return {
    type,
    value: String(stored.value ?? "").slice(0, MAX_CONTROL_VALUE_LENGTH)
  };
}

function sanitizeControls(values) {
  const output = {};
  if (!values || typeof values !== "object" || Array.isArray(values)) return output;
  for (const [key, stored] of Object.entries(values).slice(0, 300)) {
    const cleanKey = String(key || "").trim().slice(0, 240);
    if (!cleanKey || BLOCKED_FIELD_PATTERN.test(cleanKey)) continue;
    const cleanValue = sanitizeControlValue(stored);
    if (cleanValue) output[cleanKey] = cleanValue;
  }
  return output;
}

function normalizeSavedAt(value) {
  const numeric = Number(value || 0);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStoredPayload(parsed, expectedScope) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  if (![1, DRAFT_VERSION].includes(Number(parsed.version))) return null;
  const savedAt = normalizeSavedAt(parsed.saved_at ?? parsed.savedAt);
  if (!savedAt || Date.now() - savedAt > DRAFT_TTL_MS) return null;
  if (parsed.owner_scope && parsed.owner_scope !== expectedScope) return null;

  return {
    version: DRAFT_VERSION,
    owner_scope: expectedScope,
    saved_at: savedAt,
    context: normalizeAdminDraftContext(parsed.context || {}),
    controls: sanitizeControls(parsed.controls || {}),
    exam_items: Array.isArray(parsed.exam_items) ? clone(parsed.exam_items.slice(0, 250)) : [],
    lesson_tab: parsed.lesson_tab === "quiz" ? "quiz" : "content"
  };
}

export function serializeAdminFormValues(form) {
  const values = {};
  if (!form?.querySelectorAll) return values;

  form.querySelectorAll("input, textarea, select").forEach((field) => {
    if (field.closest("#mhLessonQuizAdmin") || isCredentialField(field)) return;
    const key = String(field.id || field.name || "").trim();
    if (!key || BLOCKED_FIELD_PATTERN.test(key)) return;

    if (field.type === "checkbox" || field.type === "radio") {
      values[key] = { type: field.type, checked: Boolean(field.checked), value: field.value };
      return;
    }

    if (typeof HTMLSelectElement !== "undefined" && field instanceof HTMLSelectElement && field.multiple) {
      values[key] = {
        type: "select-multiple",
        value: [...field.selectedOptions].map((option) => option.value).slice(0, 100)
      };
      return;
    }

    values[key] = {
      type: field.tagName.toLowerCase(),
      value: String(field.value ?? "").slice(0, MAX_CONTROL_VALUE_LENGTH)
    };
  });

  return values;
}

export function restoreAdminFormValues(form, values = {}) {
  if (!form?.querySelectorAll || !values || typeof values !== "object") return;

  for (const [key, rawStored] of Object.entries(values)) {
    if (BLOCKED_FIELD_PATTERN.test(key)) continue;
    const stored = sanitizeControlValue(rawStored);
    if (!stored) continue;
    const escapedKey = globalThis.CSS?.escape ? CSS.escape(key) : key.replace(/["\\]/g, "\\$&");
    const field = form.querySelector(`#${escapedKey}`)
      || form.querySelector(`[name="${escapedKey}"]`);
    if (!field || field.closest("#mhLessonQuizAdmin") || isCredentialField(field)) continue;

    if (stored.type === "checkbox" || stored.type === "radio") {
      field.checked = Boolean(stored.checked);
      continue;
    }

    if (stored.type === "select-multiple" && Array.isArray(stored.value)) {
      const selected = new Set(stored.value.map(String));
      [...field.options].forEach((option) => {
        option.selected = selected.has(String(option.value));
      });
      continue;
    }

    field.value = stored.value ?? "";
  }
}

function removeLegacyAnonymousDrafts() {
  const storage = getStorage();
  if (!storage) return;
  try {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index) || "";
      if (
        key.startsWith(`${DRAFT_PREFIX}:anonymous:`) ||
        key.startsWith(`${LAST_CONTEXT_PREFIX}:anonymous`) ||
        key.startsWith(`${LEGACY_DRAFT_PREFIX}:anonymous:`) ||
        key.startsWith(`${LEGACY_CONTEXT_PREFIX}:anonymous`)
      ) {
        storage.removeItem(key);
      }
    }
  } catch {
    // Cleanup is best-effort.
  }
}

export function createAdminDraftController({
  form,
  getUserId = () => "",
  getContext = () => ({ mode: "create", type: "lesson", id: "" }),
  getExamItems = () => [],
  setExamItems = () => {},
  getLessonTab = () => "content",
  setLessonTab = () => {},
  onAfterRestore = () => {}
} = {}) {
  if (!form) throw new Error("createAdminDraftController requires the admin form.");

  let currentContext = normalizeAdminDraftContext(getContext());
  let saveTimer = null;
  let restoring = false;

  removeLegacyAnonymousDrafts();

  function rawUserId() {
    return String(getUserId?.() || "").trim();
  }

  function ownerScope() {
    return safeScope(rawUserId());
  }

  function key(context = currentContext) {
    return adminDraftStorageKey(context, rawUserId());
  }

  function rememberContext(context = currentContext) {
    const storageKey = adminLastContextStorageKey(rawUserId());
    if (!storageKey) return false;
    const normalized = normalizeAdminDraftContext(context);
    return safeStorageSet(storageKey, JSON.stringify({
      version: DRAFT_VERSION,
      owner_scope: ownerScope(),
      saved_at: Date.now(),
      context: normalized
    }));
  }

  function readLastContext() {
    const scope = ownerScope();
    if (!scope) return null;
    const currentKey = adminLastContextStorageKey(rawUserId());
    const legacyKey = legacyAdminLastContextStorageKey(rawUserId());
    for (const storageKey of [currentKey, legacyKey]) {
      if (!storageKey) continue;
      try {
        const parsed = JSON.parse(safeStorageGet(storageKey) || "null");
        const candidate = parsed?.context || parsed;
        if (!candidate) continue;
        if (parsed?.owner_scope && parsed.owner_scope !== scope) continue;
        const savedAt = normalizeSavedAt(parsed?.saved_at);
        if (savedAt && Date.now() - savedAt > DRAFT_TTL_MS) {
          safeStorageRemove(storageKey);
          continue;
        }
        const normalized = normalizeAdminDraftContext(candidate);
        if (storageKey === legacyKey) {
          rememberContext(normalized);
          safeStorageRemove(legacyKey);
        }
        return normalized;
      } catch {
        safeStorageRemove(storageKey);
      }
    }
    return null;
  }

  function readPayload(context = currentContext) {
    const scope = ownerScope();
    if (!scope) return null;
    const currentKey = key(context);
    const legacyKey = legacyAdminDraftStorageKey(context, rawUserId());

    for (const storageKey of [currentKey, legacyKey]) {
      if (!storageKey) continue;
      const raw = safeStorageGet(storageKey);
      if (!raw) continue;
      if (byteLength(raw) > MAX_DRAFT_BYTES) {
        safeStorageRemove(storageKey);
        continue;
      }
      try {
        const payload = normalizeStoredPayload(JSON.parse(raw), scope);
        if (!payload) {
          safeStorageRemove(storageKey);
          continue;
        }
        if (storageKey === legacyKey) {
          const serialized = JSON.stringify(payload);
          if (byteLength(serialized) <= MAX_DRAFT_BYTES) safeStorageSet(currentKey, serialized);
          safeStorageRemove(legacyKey);
        }
        return payload;
      } catch {
        safeStorageRemove(storageKey);
      }
    }
    return null;
  }

  function saveNow() {
    if (restoring) return false;
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }

    const scope = ownerScope();
    const storageKey = key();
    if (!scope || !storageKey) return false;

    currentContext = normalizeAdminDraftContext(currentContext || getContext());
    const payload = {
      version: DRAFT_VERSION,
      owner_scope: scope,
      saved_at: Date.now(),
      context: currentContext,
      controls: sanitizeControls(serializeAdminFormValues(form)),
      exam_items: clone((getExamItems?.() || []).slice(0, 250)),
      lesson_tab: getLessonTab?.() === "quiz" ? "quiz" : "content"
    };

    const serialized = JSON.stringify(payload);
    if (byteLength(serialized) > MAX_DRAFT_BYTES) return false;
    rememberContext(currentContext);
    return safeStorageSet(storageKey, serialized);
  }

  function scheduleSave() {
    if (restoring || !ownerScope()) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 300);
  }

  function restore(context = currentContext) {
    currentContext = normalizeAdminDraftContext(context);
    if (!ownerScope()) return false;
    const payload = readPayload(currentContext);
    rememberContext(currentContext);
    if (!payload) return false;

    restoring = true;
    try {
      restoreAdminFormValues(form, payload.controls || {});
      setExamItems(clone(payload.exam_items || []));
      setLessonTab(payload.lesson_tab === "quiz" ? "quiz" : "content");
      onAfterRestore(payload);
    } finally {
      restoring = false;
    }
    return true;
  }

  function setContext(context, { savePrevious = true, restoreDraft = true } = {}) {
    if (savePrevious) saveNow();
    currentContext = normalizeAdminDraftContext(context);
    rememberContext(currentContext);
    return restoreDraft ? restore(currentContext) : false;
  }

  function clear(context = currentContext) {
    safeStorageRemove(key(context));
    safeStorageRemove(legacyAdminDraftStorageKey(context, rawUserId()));
  }

  function clearCurrent() {
    clear(currentContext);
  }

  function clearAllForCurrentUser() {
    const storage = getStorage();
    const scope = ownerScope();
    const legacy = legacyScope(rawUserId());
    if (!storage || !scope) return 0;
    let removed = 0;
    try {
      for (let index = storage.length - 1; index >= 0; index -= 1) {
        const storageKey = storage.key(index) || "";
        if (
          storageKey.startsWith(`${DRAFT_PREFIX}:${scope}:`) ||
          storageKey === `${LAST_CONTEXT_PREFIX}:${scope}` ||
          (legacy && storageKey.startsWith(`${LEGACY_DRAFT_PREFIX}:${legacy}:`)) ||
          (legacy && storageKey === `${LEGACY_CONTEXT_PREFIX}:${legacy}`)
        ) {
          storage.removeItem(storageKey);
          removed += 1;
        }
      }
    } catch {
      return removed;
    }
    return removed;
  }

  function hasDraft(context = currentContext) {
    return Boolean(readPayload(context));
  }

  const onInput = () => scheduleSave();
  const onChange = () => scheduleSave();
  const onPageHide = () => saveNow();
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") saveNow();
  };

  form.addEventListener("input", onInput);
  form.addEventListener("change", onChange);
  window.addEventListener("pagehide", onPageHide);
  document.addEventListener("visibilitychange", onVisibilityChange);

  return {
    saveNow,
    scheduleSave,
    restore,
    setContext,
    clear,
    clearCurrent,
    clearAllForCurrentUser,
    hasDraft,
    readLastContext,
    getContext: () => ({ ...currentContext }),
    destroy() {
      if (saveTimer) clearTimeout(saveTimer);
      form.removeEventListener("input", onInput);
      form.removeEventListener("change", onChange);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  };
}
