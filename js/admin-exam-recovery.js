import {
  ACTIVE_EXAM_LOCK_KEY,
  EXAM_STATE_PREFIX,
  LEGACY_ACTIVE_EXAM_LOCK_KEY
} from "./exam-session-state.js";

function parseJson(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function asId(value) {
  const id = String(value || "").trim();
  return id && id.length <= 200 ? id : "";
}

function inspectExamStorage(storage = globalThis.localStorage) {
  const keysToRemove = new Set();
  const examIds = new Set();
  const attemptIds = new Set();
  let hasRecoverableState = false;

  for (const lockKey of [ACTIVE_EXAM_LOCK_KEY, LEGACY_ACTIVE_EXAM_LOCK_KEY]) {
    const raw = storage?.getItem?.(lockKey);
    if (!raw) continue;

    keysToRemove.add(lockKey);
    hasRecoverableState = true;
    const parsed = parseJson(raw);
    const examId = asId(parsed?.examId);
    if (examId) examIds.add(examId);
  }

  for (let index = 0; index < (storage?.length || 0); index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith(EXAM_STATE_PREFIX)) continue;

    const parsed = parseJson(storage.getItem(key));
    const endsAt = Number(parsed?.endsAt || 0);
    const looksLikeSession = Number.isFinite(endsAt) && endsAt > 0;
    if (!looksLikeSession) continue;

    keysToRemove.add(key);
    hasRecoverableState = true;
    const examId = asId(parsed?.examId) || asId(key.slice(EXAM_STATE_PREFIX.length));
    const attemptId = asId(parsed?.attemptId);
    if (examId) examIds.add(examId);
    if (attemptId) attemptIds.add(attemptId);
  }

  return {
    attemptIds: [...attemptIds],
    examIds: [...examIds],
    hasRecoverableState,
    keysToRemove: [...keysToRemove]
  };
}

function clearAllExamStorage(storage = globalThis.localStorage) {
  if (!storage) return [];
  const removed = [];

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (
      key === ACTIVE_EXAM_LOCK_KEY ||
      key === LEGACY_ACTIVE_EXAM_LOCK_KEY ||
      key?.startsWith(EXAM_STATE_PREFIX)
    ) {
      removed.push(key);
      storage.removeItem(key);
    }
  }

  return removed;
}

export function createAdminExamRecoveryController({
  cancelAttempt,
  cancelSecureAttempt,
  getLanguage = () => "ro",
  onRecovered = () => {},
  storage = globalThis.localStorage
} = {}) {
  let isAdmin = false;
  let button = null;
  let recoveryRunning = false;

  function text(ro, en) {
    return getLanguage() === "en" ? en : ro;
  }

  function ensureButton() {
    if (button || !globalThis.document?.body) return button;

    button = document.createElement("button");
    button.id = "mhAdminExamRecoveryBtn";
    button.type = "button";
    button.className = "btn";
    button.hidden = true;
    button.style.cssText = [
      "position:fixed",
      "right:18px",
      "bottom:18px",
      "z-index:10050",
      "border-color:rgba(239,68,68,.72)",
      "background:rgba(127,29,29,.94)",
      "color:#fff",
      "box-shadow:0 12px 34px rgba(0,0,0,.35)",
      "font-weight:800"
    ].join(";");

    button.addEventListener("click", recover);
    document.body.appendChild(button);
    return button;
  }

  function refresh() {
    const control = ensureButton();
    if (!control) return;

    const state = inspectExamStorage(storage);
    const visible = Boolean(isAdmin && state.hasRecoverableState);
    control.hidden = !visible;
    control.style.display = visible ? "inline-flex" : "none";
    control.disabled = recoveryRunning;
    control.textContent = recoveryRunning
      ? text("Se deblochează…", "Unlocking…")
      : text("🧯 Deblochează examenul activ", "🧯 Unlock active exam");
  }

  async function recover() {
    if (!isAdmin || recoveryRunning) return;

    const state = inspectExamStorage(storage);
    if (!state.hasRecoverableState) {
      refresh();
      return;
    }

    const confirmed = globalThis.confirm?.(
      text(
        "Deblochezi forțat examenul activ? Se șterg timerul și răspunsurile locale. MathHard va încerca și anularea tentativei din Supabase.",
        "Force-unlock the active exam? The local timer and answers will be cleared. MathHard will also try to cancel the Supabase attempt."
      )
    );
    if (!confirmed) return;

    recoveryRunning = true;
    refresh();

    const backendErrors = [];
    const cancelledExamIds = new Set();

    for (const attemptId of state.attemptIds) {
      try {
        const result = await cancelSecureAttempt?.(attemptId);
        if (!result) backendErrors.push(`attempt:${attemptId}`);
        if (result?.exam_id) cancelledExamIds.add(String(result.exam_id));
      } catch (error) {
        console.warn(`Could not cancel secure exam attempt ${attemptId}:`, error);
        backendErrors.push(`attempt:${attemptId}`);
      }
    }

    for (const examId of state.examIds) {
      if (cancelledExamIds.has(examId)) continue;
      try {
        const result = await cancelAttempt?.(examId);
        if (!result) backendErrors.push(`exam:${examId}`);
      } catch (error) {
        console.warn(`Could not cancel stale exam attempt ${examId}:`, error);
        backendErrors.push(`exam:${examId}`);
      }
    }

    const removed = clearAllExamStorage(storage);
    document.body?.classList.remove("exam-locked", "exam-site-locked", "mh-exam-locked");

    try {
      await onRecovered({
        attemptIds: state.attemptIds,
        backendErrors,
        examIds: state.examIds,
        removed
      });
    } finally {
      recoveryRunning = false;
      refresh();
    }

    if (backendErrors.length > 0) {
      globalThis.alert?.(
        text(
          "Blocarea locală a fost eliminată. Unele tentative vechi nu au putut fi ajustate în Supabase; verifică statisticile examenelor.",
          "The local lock was removed. Some old attempts could not be adjusted in Supabase; check the exam statistics."
        )
      );
    }
  }

  function setAdmin(value) {
    isAdmin = Boolean(value);
    refresh();
  }

  function destroy() {
    button?.remove();
    button = null;
  }

  return {
    destroy,
    inspect: () => inspectExamStorage(storage),
    recover,
    refresh,
    setAdmin
  };
}
