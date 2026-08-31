const MAX_ID_LENGTH = 200;
const MAX_ANSWER_LENGTH = 1200;
const MAX_METADATA_KEYS = 20;
const MAX_METADATA_VALUE_LENGTH = 500;
const MAX_METADATA_BYTES = 4 * 1024;
const EVENT_DEDUPE_WINDOW_MS = 1_500;
const BLOCKED_METADATA_KEY = /(password|passwd|secret|token|authorization|cookie|session|answer|solution|hint|credential|api[_-]?key)/i;

const inFlightRpc = new Map();
const recentLearningEvents = new Map();

function cleanId(value, label) {
  const id = String(value || "").trim();
  if (!id || id.length > MAX_ID_LENGTH) {
    throw new TypeError(`Invalid ${label}.`);
  }
  return id;
}

function cleanLocale(value) {
  return String(value || "ro").toLowerCase().startsWith("en") ? "en" : "ro";
}

function firstPayload(data) {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

function byteLength(value) {
  const text = String(value ?? "");
  if (typeof TextEncoder === "function") return new TextEncoder().encode(text).byteLength;
  return text.length * 2;
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

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
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

function sanitizeMetadataValue(value) {
  if (value == null) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") return value.slice(0, MAX_METADATA_VALUE_LENGTH);
  if (Array.isArray(value)) {
    return value
      .slice(0, 20)
      .map(sanitizeMetadataValue)
      .filter((entry) => entry !== undefined);
  }
  return undefined;
}

export function sanitizeLearningEventMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  const output = {};

  for (const [rawKey, value] of Object.entries(metadata).slice(0, MAX_METADATA_KEYS)) {
    const key = String(rawKey || "").trim().slice(0, 80);
    if (!key || BLOCKED_METADATA_KEY.test(key)) continue;
    const cleanValue = sanitizeMetadataValue(value);
    if (cleanValue !== undefined) output[key] = cleanValue;
  }

  const serialized = JSON.stringify(output);
  return byteLength(serialized) <= MAX_METADATA_BYTES ? output : {};
}

async function callSecureRpc(supabase, name, args, dedupeKey = "") {
  if (!supabase?.rpc) {
    throw new TypeError("A Supabase client is required for secure evaluation.");
  }

  const execute = async () => {
    const { data, error } = await supabase.rpc(name, args);
    if (error) throw error;
    return firstPayload(data);
  };

  return dedupeKey ? runSingleFlight(`${name}:${dedupeKey}`, execute) : execute();
}

export async function submitProblemAnswer(
  supabase,
  problemId,
  answer,
  locale = "ro"
) {
  const id = cleanId(problemId, "problem id");
  const submittedAnswer = String(answer ?? "").trim();

  if (!submittedAnswer || submittedAnswer.length > MAX_ANSWER_LENGTH) {
    throw new TypeError("Invalid submitted answer.");
  }

  const safeLocale = cleanLocale(locale);
  return callSecureRpc(supabase, "mh_submit_problem_answer", {
    p_problem_id: id,
    p_answer: submittedAnswer,
    p_locale: safeLocale
  }, `${id}:${safeLocale}:${fingerprint(submittedAnswer)}`);
}

export async function requestProblemHint(
  supabase,
  problemId,
  hintNumber,
  locale = "ro"
) {
  const id = cleanId(problemId, "problem id");
  const number = Number(hintNumber);

  if (number !== 1 && number !== 2) {
    throw new TypeError("Invalid hint number.");
  }

  const safeLocale = cleanLocale(locale);
  return callSecureRpc(supabase, "mh_get_problem_hint", {
    p_problem_id: id,
    p_hint_number: number,
    p_locale: safeLocale
  }, `${id}:${number}:${safeLocale}`);
}

export async function revealProblemAnswer(
  supabase,
  problemId,
  locale = "ro"
) {
  const id = cleanId(problemId, "problem id");
  const safeLocale = cleanLocale(locale);

  return callSecureRpc(supabase, "mh_reveal_problem_answer", {
    p_problem_id: id,
    p_locale: safeLocale
  }, `${id}:${safeLocale}`);
}

function pruneRecentEvents(now = Date.now()) {
  for (const [key, timestamp] of recentLearningEvents) {
    if (now - timestamp > EVENT_DEDUPE_WINDOW_MS * 4) recentLearningEvents.delete(key);
  }
}

export async function logLearningEvent(
  supabase,
  eventType,
  contentType,
  contentId,
  metadata = {}
) {
  const event = String(eventType || "").trim();
  const type = String(contentType || "").trim();
  const id = cleanId(contentId, "content id");

  if (!new Set(["lesson_opened", "problem_opened", "exam_opened"]).has(event)) {
    throw new TypeError("Invalid learning event type.");
  }

  if (!new Set(["lesson", "problem", "exam"]).has(type)) {
    throw new TypeError("Invalid learning content type.");
  }

  const safeMetadata = sanitizeLearningEventMetadata(metadata);
  const eventKey = `${event}:${type}:${id}:${fingerprint(stableJson(safeMetadata))}`;
  const now = Date.now();
  const previous = recentLearningEvents.get(eventKey) || 0;
  if (now - previous < EVENT_DEDUPE_WINDOW_MS) return null;

  recentLearningEvents.set(eventKey, now);
  pruneRecentEvents(now);

  try {
    return await callSecureRpc(supabase, "mh_log_learning_event", {
      p_event_type: event,
      p_content_type: type,
      p_content_id: id,
      p_metadata: safeMetadata
    }, eventKey);
  } catch (error) {
    recentLearningEvents.delete(eventKey);
    throw error;
  }
}
