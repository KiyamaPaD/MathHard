import { normalizeDraftExamItem, validateExamPayload } from "./admin-content-model.js";
import { evaluateContentDraft, ID_PATTERN } from "./content-authoring-model.js";

export const CONTENT_BATCH_LIMIT = 100;
export const CONTENT_BATCH_MAX_BYTES = 2 * 1024 * 1024;

const CONTENT_TYPES = new Set(["lesson", "research", "history", "problem", "exam"]);

function text(value) {
  return String(value ?? "").trim();
}

function uniqueStrings(value, { splitLines = false } = {}) {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(splitLines ? /[,\n\r]+/ : /,/)
      : [];
  return [...new Set(values.map((entry) => text(entry)).filter(Boolean))];
}

function normalizeType(value) {
  const type = text(value).toLowerCase();
  return CONTENT_TYPES.has(type) ? type : "";
}

function normalizeLesson(type, raw) {
  const chapter = type === "research"
    ? "CERCETARE"
    : type === "history"
      ? "Istoria matematicii"
      : text(raw.chapter);
  return {
    id: text(raw.id),
    grade: text(raw.grade),
    chapter,
    tags: uniqueStrings(raw.tags),
    title_ro: text(raw.title_ro),
    title_en: text(raw.title_en),
    learn_ro: text(raw.learn_ro),
    learn_en: text(raw.learn_en),
    why_ro: text(raw.why_ro),
    why_en: text(raw.why_en),
    body_ro: text(raw.body_ro),
    body_en: text(raw.body_en),
    examples_ro: text(raw.examples_ro),
    examples_en: text(raw.examples_en),
    sources: uniqueStrings(raw.sources, { splitLines: true })
  };
}

function normalizeProblem(raw) {
  return {
    id: text(raw.id),
    lesson_id: text(raw.lesson_id),
    difficulty: Number.isFinite(Number(raw.difficulty)) ? Number(raw.difficulty) : 1,
    olymp_level: text(raw.olymp_level ?? raw.olympLevel),
    title_ro: text(raw.title_ro),
    title_en: text(raw.title_en),
    statement_ro: text(raw.statement_ro),
    statement_en: text(raw.statement_en),
    answer: text(raw.answer),
    hint1_ro: text(raw.hint1_ro),
    hint1_en: text(raw.hint1_en),
    hint2_ro: text(raw.hint2_ro),
    hint2_en: text(raw.hint2_en),
    source: text(raw.source),
    solution_ro: text(raw.solution_ro),
    solution_en: text(raw.solution_en),
    explanation_simple_ro: text(raw.explanation_simple_ro),
    explanation_simple_en: text(raw.explanation_simple_en),
    explanation_boss_ro: text(raw.explanation_boss_ro),
    explanation_boss_en: text(raw.explanation_boss_en)
  };
}

function normalizeExam(raw) {
  const items = Array.isArray(raw.items)
    ? raw.items.slice(0, 250).map((item, index) => normalizeDraftExamItem(item, index))
    : [];
  return {
    id: text(raw.id),
    type: text(raw.type || raw.exam_type),
    year: Number(raw.year || 0),
    title_ro: text(raw.title_ro),
    title_en: text(raw.title_en),
    default_hours: Number(raw.default_hours || 2),
    problems: uniqueStrings(raw.problems),
    items,
    scoring_profile: text(raw.scoring_profile || "default_exact_v1"),
    scoring_config: raw.scoring_config && typeof raw.scoring_config === "object" ? raw.scoring_config : null,
    credit_html: text(raw.credit_html)
  };
}

function hardValidation(type, payload) {
  const errors = [];
  if (!ID_PATTERN.test(payload.id)) {
    errors.push("invalid_id");
  }
  if (["lesson", "research", "history"].includes(type)) {
    if (!payload.title_ro && !payload.title_en) errors.push("missing_title");
  } else if (type === "problem") {
    if (!payload.lesson_id) errors.push("missing_lesson_id");
    if (!payload.answer) errors.push("missing_answer");
  } else if (type === "exam") {
    errors.push(...validateExamPayload(payload).map((message) => `exam:${message}`));
  }
  return errors;
}

export function contentStorageType(type) {
  return ["problem", "exam"].includes(type) ? type : "lesson";
}

export function contentTableForType(type) {
  const storageType = contentStorageType(type);
  return storageType === "problem" ? "mh_problems" : storageType === "exam" ? "mh_exams" : "mh_lessons";
}

export function normalizeContentBatchItem(raw, index = 0) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { index, type: "", payload: {}, conceptIds: [], errors: ["invalid_item"] };
  }
  const type = normalizeType(raw.type || raw.content_type);
  if (!type) {
    return { index, type: "", payload: {}, conceptIds: [], errors: ["invalid_type"] };
  }
  const hasNestedPayload = raw.payload && typeof raw.payload === "object" && !Array.isArray(raw.payload);
  const source = hasNestedPayload ? { ...raw.payload } : { ...raw };
  delete source.payload;
  delete source.content_type;
  const conceptIds = uniqueStrings(raw.concept_ids ?? source.concept_ids);
  delete source.concept_ids;
  if (!hasNestedPayload) delete source.type;

  const payload = type === "problem"
    ? normalizeProblem(source)
    : type === "exam"
      ? normalizeExam(source)
      : normalizeLesson(type, source);
  const examErrors = type === "exam" ? validateExamPayload(payload) : [];
  const readiness = evaluateContentDraft({ type, payload: { ...payload, concept_ids: conceptIds }, examErrors });
  return {
    index,
    type,
    storageType: contentStorageType(type),
    table: contentTableForType(type),
    payload,
    conceptIds,
    readiness,
    errors: hardValidation(type, payload),
    warnings: readiness.blockers.map((check) => check.id)
  };
}

function normalizeExisting(existing = {}) {
  const output = { lesson: new Set(), problem: new Set(), exam: new Set() };
  for (const type of Object.keys(output)) {
    const value = existing[type];
    const entries = value instanceof Set ? [...value] : Array.isArray(value) ? value : [];
    entries.map((entry) => text(entry)).filter(Boolean).forEach((entry) => output[type].add(entry));
  }
  return output;
}

export function parseContentBatchJson(source) {
  const rawText = String(source ?? "");
  if (!rawText.trim()) throw new SyntaxError("empty_batch");
  if (typeof TextEncoder === "function" && new TextEncoder().encode(rawText).byteLength > CONTENT_BATCH_MAX_BYTES) {
    throw new RangeError("batch_too_large");
  }
  const parsed = JSON.parse(rawText);
  const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.items) ? parsed.items : null;
  if (!items) throw new TypeError("batch_must_be_array");
  if (!items.length) throw new RangeError("empty_batch");
  if (items.length > CONTENT_BATCH_LIMIT) throw new RangeError("batch_item_limit");
  return items;
}

export function analyzeContentBatch(source, { existingIds = {} } = {}) {
  const globalErrors = [];
  let rawItems = [];
  try {
    rawItems = parseContentBatchJson(source);
  } catch (error) {
    globalErrors.push(String(error?.message || error));
  }
  const existing = normalizeExisting(existingIds);
  const seen = { lesson: new Set(), problem: new Set(), exam: new Set() };
  const items = rawItems.map((raw, index) => {
    const item = normalizeContentBatchItem(raw, index);
    if (!item.type) return item;
    const id = item.payload.id;
    if (id && existing[item.storageType].has(id)) item.errors.push("existing_id");
    if (id && seen[item.storageType].has(id)) item.errors.push("duplicate_batch_id");
    if (id) seen[item.storageType].add(id);
    item.errors = [...new Set(item.errors)];
    item.valid = item.errors.length === 0;
    return item;
  });
  const validItems = items.filter((item) => item.valid);
  const summary = {
    total: items.length,
    valid: validItems.length,
    invalid: items.length - validItems.length,
    readyForReview: validItems.filter((item) => item.readiness?.readyForReview).length,
    incompleteDrafts: validItems.filter((item) => !item.readiness?.readyForReview).length,
    lessons: validItems.filter((item) => item.storageType === "lesson").length,
    problems: validItems.filter((item) => item.storageType === "problem").length,
    exams: validItems.filter((item) => item.storageType === "exam").length
  };
  return {
    globalErrors,
    items,
    validItems,
    summary,
    canImport: globalErrors.length === 0 && validItems.length > 0
  };
}

export function batchExample() {
  return JSON.stringify({
    items: [
      {
        type: "lesson",
        concept_ids: ["numere-naturale"],
        payload: {
          id: "v-exemplu-lectie",
          grade: "V",
          chapter: "Numere Naturale",
          tags: ["numere", "exemplu"],
          title_ro: "Lecție exemplu",
          title_en: "Example lesson",
          learn_ro: "Ce vei învăța.",
          learn_en: "What you will learn.",
          why_ro: "De ce este util.",
          why_en: "Why it matters.",
          body_ro: "<p>Conținut în română.</p>",
          body_en: "<p>English content.</p>",
          examples_ro: "<p>Exemplu.</p>",
          examples_en: "<p>Example.</p>",
          sources: ["Autor MathHard"]
        }
      },
      {
        type: "problem",
        concept_ids: ["numere-naturale"],
        payload: {
          id: "v-exemplu-problema",
          lesson_id: "v-exemplu-lectie",
          difficulty: 1,
          title_ro: "Problemă exemplu",
          title_en: "Example problem",
          statement_ro: "Calculează 2+2.",
          statement_en: "Compute 2+2.",
          answer: "4",
          source: "Autor MathHard",
          solution_ro: "2+2=4.",
          solution_en: "2+2=4."
        }
      }
    ]
  }, null, 2);
}

export function batchErrorLabel(code, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  const labels = {
    empty_batch: ["Lotul este gol.", "The batch is empty."],
    batch_too_large: ["Fișierul depășește 2 MB.", "The file exceeds 2 MB."],
    batch_must_be_array: ["JSON-ul trebuie să fie o listă sau un obiect cu cheia items.", "JSON must be an array or an object with an items key."],
    batch_item_limit: ["Un lot poate conține maximum 100 de materiale.", "A batch may contain at most 100 items."],
    invalid_item: ["Elementul nu este un obiect JSON valid.", "The item is not a valid JSON object."],
    invalid_type: ["Tip necunoscut. Folosește lesson, research, history, problem sau exam.", "Unknown type. Use lesson, research, history, problem, or exam."],
    invalid_id: ["ID invalid.", "Invalid ID."],
    missing_title: ["Lipsește titlul RO sau EN.", "Romanian or English title is missing."],
    missing_lesson_id: ["Lipsește lecția asociată.", "The linked lesson is missing."],
    missing_answer: ["Lipsește răspunsul canonic.", "The canonical answer is missing."],
    existing_id: ["ID-ul există deja în catalog.", "The ID already exists in the catalogue."],
    duplicate_batch_id: ["ID duplicat în același lot.", "Duplicate ID in the same batch."]
  };
  if (String(code).startsWith("exam:")) return String(code).slice(5);
  const pair = labels[code] || [String(code), String(code)];
  return pair[english ? 1 : 0];
}
