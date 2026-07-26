export const ACTIVE_EXAM_LOCK_KEY = "mh_active_exam_lock_v2";
export const LEGACY_ACTIVE_EXAM_LOCK_KEY = "mh_active_exam_lock_v1";
export const EXAM_STATE_PREFIX = "mh_exam_";

function cleanExamId(value) {
  const examId = String(value || "").trim();
  if (!examId || examId.length > 200) {
    throw new TypeError("Invalid exam id.");
  }
  return examId;
}

function parseJson(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeEndsAt(value) {
  const endsAt = Number(value);
  return Number.isFinite(endsAt) && endsAt > 0 ? endsAt : null;
}

export function formatExamCountdown(msLeft) {
  let seconds = Math.max(0, Math.floor(Number(msLeft || 0) / 1000));
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  const hoursPart = hours > 0 ? `${String(hours).padStart(2, "0")}:` : "";
  return `${hoursPart}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function createExamSessionStore({
  storage = globalThis.localStorage,
  now = () => Date.now()
} = {}) {
  if (!storage) {
    throw new Error("createExamSessionStore requires a storage implementation.");
  }

  function stateKey(examId) {
    return `${EXAM_STATE_PREFIX}${cleanExamId(examId)}`;
  }

  function getExamState(examId) {
    const id = cleanExamId(examId);
    const raw = parseJson(storage.getItem(stateKey(id)), null);
    if (!raw || typeof raw !== "object") return null;

    const endsAt = normalizeEndsAt(raw.endsAt);
    if (!endsAt) {
      storage.removeItem(stateKey(id));
      return null;
    }

    return {
      examId: id,
      endsAt,
      attemptRecorded: raw.attemptRecorded !== false,
      startedByAdmin: raw.startedByAdmin === true,
      startedAt: Number(raw.startedAt) || null
    };
  }

  function setExamState(examId, state) {
    const id = cleanExamId(examId);
    const endsAt = normalizeEndsAt(state?.endsAt);
    if (!endsAt) throw new TypeError("Invalid exam end time.");

    const normalized = {
      examId: id,
      endsAt,
      attemptRecorded: state?.attemptRecorded !== false,
      startedByAdmin: state?.startedByAdmin === true,
      startedAt: Number(state?.startedAt) || now()
    };

    storage.setItem(stateKey(id), JSON.stringify(normalized));
    return normalized;
  }

  function clearExamState(examId) {
    storage.removeItem(stateKey(examId));
  }

  function readLockFromKey(key) {
    const raw = parseJson(storage.getItem(key), null);
    if (!raw || typeof raw !== "object") return null;

    const examId = String(raw.examId || "").trim();
    const endsAt = normalizeEndsAt(raw.endsAt);
    if (!examId || !endsAt) {
      storage.removeItem(key);
      return null;
    }

    if (now() >= endsAt) {
      storage.removeItem(key);
      return null;
    }

    return { examId, endsAt };
  }

  function getActiveExamLock() {
    let lock = readLockFromKey(ACTIVE_EXAM_LOCK_KEY);
    if (lock) return lock;

    // One-time compatibility with the lock key used before Phase 09.
    lock = readLockFromKey(LEGACY_ACTIVE_EXAM_LOCK_KEY);
    if (!lock) return null;

    storage.setItem(ACTIVE_EXAM_LOCK_KEY, JSON.stringify(lock));
    storage.removeItem(LEGACY_ACTIVE_EXAM_LOCK_KEY);
    return lock;
  }

  function setActiveExamLock({ examId, endsAt }) {
    const id = cleanExamId(examId);
    const normalizedEndsAt = normalizeEndsAt(endsAt);
    if (!normalizedEndsAt) throw new TypeError("Invalid exam end time.");

    const lock = { examId: id, endsAt: normalizedEndsAt };
    storage.setItem(ACTIVE_EXAM_LOCK_KEY, JSON.stringify(lock));
    storage.removeItem(LEGACY_ACTIVE_EXAM_LOCK_KEY);
    return lock;
  }

  function clearActiveExamLock() {
    storage.removeItem(ACTIVE_EXAM_LOCK_KEY);
    storage.removeItem(LEGACY_ACTIVE_EXAM_LOCK_KEY);
  }

  function hasActiveExamLock() {
    return Boolean(getActiveExamLock());
  }

  function isOtherExamLocked(examId) {
    const lock = getActiveExamLock();
    if (!lock) return false;
    return String(lock.examId) !== cleanExamId(examId);
  }

  function clearSession(examId) {
    clearExamState(examId);
    const lock = getActiveExamLock();
    if (!lock || String(lock.examId) === cleanExamId(examId)) {
      clearActiveExamLock();
    }
  }

  return {
    clearActiveExamLock,
    clearExamState,
    clearSession,
    getActiveExamLock,
    getExamState,
    hasActiveExamLock,
    isOtherExamLocked,
    setActiveExamLock,
    setExamState
  };
}
