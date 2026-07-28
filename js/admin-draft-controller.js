const DRAFT_VERSION = 1;
const DRAFT_PREFIX = "mh_admin_content_draft_v1";
const LAST_CONTEXT_PREFIX = "mh_admin_last_context_v1";

function safeStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeStorageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Draft persistence is best-effort.
  }
}

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function normalizeAdminDraftContext(raw = {}) {
  const mode = raw?.mode === "edit" ? "edit" : "create";
  const allowedTypes = new Set(["lesson", "problem", "exam", "research", "history"]);
  const type = allowedTypes.has(String(raw?.type || "")) ? String(raw.type) : "lesson";
  const id = mode === "edit" ? String(raw?.id || "").trim() : "";
  return { mode, type, id };
}

function safeScope(userId) {
  return String(userId || "anonymous").replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function adminDraftStorageKey(context, userId = "") {
  const normalized = normalizeAdminDraftContext(context);
  return [
    DRAFT_PREFIX,
    safeScope(userId),
    normalized.mode,
    normalized.type,
    normalized.id || "new"
  ].join(":");
}

export function adminLastContextStorageKey(userId = "") {
  return `${LAST_CONTEXT_PREFIX}:${safeScope(userId)}`;
}

export function serializeAdminFormValues(form) {
  const values = {};
  if (!form?.querySelectorAll) return values;

  form.querySelectorAll("input, textarea, select").forEach((field) => {
    if (field.closest("#mhLessonQuizAdmin")) return;
    if (field.type === "file" || field.type === "submit" || field.type === "button") return;
    const key = field.id || field.name;
    if (!key) return;

    if (field.type === "checkbox" || field.type === "radio") {
      values[key] = { type: field.type, checked: Boolean(field.checked), value: field.value };
      return;
    }

    if (field instanceof HTMLSelectElement && field.multiple) {
      values[key] = {
        type: "select-multiple",
        value: [...field.selectedOptions].map((option) => option.value)
      };
      return;
    }

    values[key] = { type: field.tagName.toLowerCase(), value: field.value };
  });

  return values;
}

export function restoreAdminFormValues(form, values = {}) {
  if (!form?.querySelectorAll || !values || typeof values !== "object") return;

  for (const [key, stored] of Object.entries(values)) {
    const field = form.querySelector(`#${CSS.escape(key)}`)
      || form.querySelector(`[name="${CSS.escape(key)}"]`);
    if (!field || field.closest("#mhLessonQuizAdmin")) continue;

    if (stored?.type === "checkbox" || stored?.type === "radio") {
      field.checked = Boolean(stored.checked);
      continue;
    }

    if (stored?.type === "select-multiple" && Array.isArray(stored.value)) {
      const selected = new Set(stored.value.map(String));
      [...field.options].forEach((option) => {
        option.selected = selected.has(String(option.value));
      });
      continue;
    }

    field.value = stored?.value ?? "";
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

  function userId() {
    return String(getUserId?.() || "");
  }

  function key(context = currentContext) {
    return adminDraftStorageKey(context, userId());
  }

  function rememberContext(context = currentContext) {
    const normalized = normalizeAdminDraftContext(context);
    safeStorageSet(adminLastContextStorageKey(userId()), JSON.stringify(normalized));
  }

  function readLastContext() {
    try {
      const parsed = JSON.parse(safeStorageGet(adminLastContextStorageKey(userId())) || "null");
      return parsed ? normalizeAdminDraftContext(parsed) : null;
    } catch {
      return null;
    }
  }

  function readPayload(context = currentContext) {
    try {
      const parsed = JSON.parse(safeStorageGet(key(context)) || "null");
      if (!parsed || parsed.version !== DRAFT_VERSION) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function saveNow() {
    if (restoring) return false;
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }

    currentContext = normalizeAdminDraftContext(currentContext || getContext());
    const payload = {
      version: DRAFT_VERSION,
      saved_at: new Date().toISOString(),
      context: currentContext,
      controls: serializeAdminFormValues(form),
      exam_items: clone(getExamItems?.() || []),
      lesson_tab: getLessonTab?.() === "quiz" ? "quiz" : "content"
    };

    rememberContext(currentContext);
    return safeStorageSet(key(), JSON.stringify(payload));
  }

  function scheduleSave() {
    if (restoring) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 250);
  }

  function restore(context = currentContext) {
    currentContext = normalizeAdminDraftContext(context);
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
  }

  function clearCurrent() {
    clear(currentContext);
  }

  function hasDraft(context = currentContext) {
    return Boolean(readPayload(context));
  }

  form.addEventListener("input", scheduleSave);
  form.addEventListener("change", scheduleSave);

  const onPageHide = () => saveNow();
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") saveNow();
  };
  window.addEventListener("pagehide", onPageHide);
  document.addEventListener("visibilitychange", onVisibilityChange);

  return {
    saveNow,
    scheduleSave,
    restore,
    setContext,
    clear,
    clearCurrent,
    hasDraft,
    readLastContext,
    getContext: () => ({ ...currentContext }),
    destroy() {
      if (saveTimer) clearTimeout(saveTimer);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  };
}
