const MAX_ID_LENGTH = 200;
const MAX_OPEN_ANSWER_LENGTH = 5_000;
const MAX_SELECTED_OPTIONS = 8;
const MAX_OPTION_LABEL_LENGTH = 32;
const MAX_ANSWER_BYTES = 12 * 1024;

const inFlightRpc = new Map();
const attemptMutationTails = new Map();

function cleanId(value, label) {
  const id = String(value || "").trim();
  if (!id || id.length > MAX_ID_LENGTH) throw new TypeError(`Invalid ${label}.`);
  return id;
}

function cleanLocale(value) {
  return String(value || "ro").toLowerCase().startsWith("en") ? "en" : "ro";
}

function unwrapRpcData(data) {
  if (Array.isArray(data) && data.length === 1) return data[0];
  return data ?? null;
}

function byteLength(value) {
  const text = String(value ?? "");
  if (typeof TextEncoder === "function") return new TextEncoder().encode(text).byteLength;
  return text.length * 2;
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function fingerprint(value) {
  const text = String(value ?? "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function assertOnlyKeys(payload, allowedKeys) {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(payload)) {
    if (!allowed.has(key)) throw new TypeError("Invalid secure exam answer payload.");
  }
}

export function sanitizeSecureExamAnswer(answer) {
  if (!isPlainObject(answer)) throw new TypeError("Invalid secure exam answer payload.");
  const type = String(answer.type || "").trim().toLowerCase();

  let sanitized;
  if (type === "open") {
    assertOnlyKeys(answer, ["type", "answer_text"]);
    const answerText = String(answer.answer_text ?? "").trim().slice(0, MAX_OPEN_ANSWER_LENGTH);
    if (String(answer.answer_text ?? "").trim().length > MAX_OPEN_ANSWER_LENGTH) {
      throw new TypeError("Secure exam open answer is too long.");
    }
    sanitized = { type: "open", answer_text: answerText };
  } else if (type === "mcq") {
    assertOnlyKeys(answer, ["type", "selected"]);
    if (!Array.isArray(answer.selected)) throw new TypeError("Invalid secure exam selection.");

    const selected = [...new Set(answer.selected.map((entry) => {
      const label = String(entry || "").trim();
      if (!label || label.length > MAX_OPTION_LABEL_LENGTH) {
        throw new TypeError("Invalid secure exam option label.");
      }
      return label;
    }))];

    if (selected.length > MAX_SELECTED_OPTIONS) {
      throw new TypeError("Too many secure exam options selected.");
    }
    sanitized = { type: "mcq", selected };
  } else {
    throw new TypeError("Unknown secure exam answer type.");
  }

  if (byteLength(JSON.stringify(sanitized)) > MAX_ANSWER_BYTES) {
    throw new TypeError("Secure exam answer payload is too large.");
  }
  return sanitized;
}

async function executeRpc(supabase, name, args) {
  if (!supabase?.rpc) throw new Error("Supabase client is required.");
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return unwrapRpcData(data);
}

function runSingleFlight(key, operation) {
  const existing = inFlightRpc.get(key);
  if (existing) return existing;

  const promise = Promise.resolve()
    .then(operation)
    .finally(() => {
      if (inFlightRpc.get(key) === promise) inFlightRpc.delete(key);
    });

  inFlightRpc.set(key, promise);
  return promise;
}

function enqueueAttemptMutation(attemptId, operationKey, operation) {
  const exactKey = `attempt:${attemptId}:${operationKey}`;
  const duplicate = inFlightRpc.get(exactKey);
  if (duplicate) return duplicate;

  const previousTail = attemptMutationTails.get(attemptId) || Promise.resolve();
  const promise = previousTail
    .catch(() => undefined)
    .then(operation)
    .finally(() => {
      if (inFlightRpc.get(exactKey) === promise) inFlightRpc.delete(exactKey);
    });

  inFlightRpc.set(exactKey, promise);
  const safeTail = promise.catch(() => undefined).finally(() => {
    if (attemptMutationTails.get(attemptId) === safeTail) attemptMutationTails.delete(attemptId);
  });
  attemptMutationTails.set(attemptId, safeTail);
  return promise;
}

export async function startSecureExamAttempt(
  supabase,
  examId,
  hours = 2,
  locale = "ro"
) {
  const id = cleanId(examId, "exam id");
  const safeHours = Math.max(1, Math.min(5, Number(hours) || 2));
  const safeLocale = cleanLocale(locale);

  return runSingleFlight(`start:${id}:${safeHours}:${safeLocale}`, () => executeRpc(
    supabase,
    "mh_start_secure_exam_attempt",
    { p_exam_id: id, p_hours: safeHours, p_locale: safeLocale }
  ));
}

export async function getActiveSecureExamAttempt(
  supabase,
  examId = null,
  locale = "ro"
) {
  const id = examId ? cleanId(examId, "exam id") : null;
  const safeLocale = cleanLocale(locale);

  return runSingleFlight(`active:${id || "any"}:${safeLocale}`, () => executeRpc(
    supabase,
    "mh_get_active_exam_attempt",
    { p_exam_id: id, p_locale: safeLocale }
  ));
}

export async function saveSecureExamAnswer(
  supabase,
  attemptId,
  itemId,
  answer
) {
  const safeAttemptId = cleanId(attemptId, "attempt id");
  const safeItemId = cleanId(itemId, "item id");
  const payload = sanitizeSecureExamAnswer(answer);
  const payloadFingerprint = fingerprint(JSON.stringify(payload));

  return enqueueAttemptMutation(
    safeAttemptId,
    `save:${safeItemId}:${payloadFingerprint}`,
    () => executeRpc(supabase, "mh_save_secure_exam_answer", {
      p_attempt_id: safeAttemptId,
      p_item_id: safeItemId,
      p_answer: payload
    })
  );
}

export async function submitSecureExamAttempt(supabase, attemptId) {
  const safeAttemptId = cleanId(attemptId, "attempt id");
  return enqueueAttemptMutation(
    safeAttemptId,
    "submit",
    () => executeRpc(supabase, "mh_submit_secure_exam_attempt", {
      p_attempt_id: safeAttemptId
    })
  );
}

export async function cancelSecureExamAttempt(supabase, attemptId) {
  const safeAttemptId = cleanId(attemptId, "attempt id");
  return enqueueAttemptMutation(
    safeAttemptId,
    "cancel",
    () => executeRpc(supabase, "mh_cancel_secure_exam_attempt", {
      p_attempt_id: safeAttemptId
    })
  );
}
