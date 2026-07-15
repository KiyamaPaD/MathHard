import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";

export const CONTENT_KEYS = ["lessons", "problems", "exams"];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function emptyCatalog() {
  return { lessons: [], problems: [], exams: [] };
}

export async function loadBundledCatalog(root) {
  const source = await readFile(resolve(root, "js/data.js"), "utf8");
  const context = { console };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "js/data.js" });

  const data = context.MH_DATA;
  if (!data || typeof data !== "object") {
    throw new Error("js/data.js did not expose globalThis.MH_DATA.");
  }

  return {
    lessons: asArray(data.lessons),
    problems: asArray(data.problems),
    exams: asArray(data.exams)
  };
}

export async function loadJsonCatalog(root) {
  const parsed = JSON.parse(await readFile(resolve(root, "data/problems.json"), "utf8"));
  return {
    lessons: asArray(parsed.lessons),
    problems: asArray(parsed.problems),
    exams: asArray(parsed.exams)
  };
}

function meaningful(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function mergeItem(current, incoming) {
  const result = { ...(current || {}) };
  for (const [key, value] of Object.entries(incoming || {})) {
    if (key === "id") continue;
    if (!meaningful(value) && meaningful(result[key])) continue;
    result[key] = value;
  }
  return result;
}

export function mergeCatalogsPreservingFallback(...catalogs) {
  const result = emptyCatalog();

  for (const key of CONTENT_KEYS) {
    const byId = new Map();
    for (const catalog of catalogs) {
      for (const item of asArray(catalog?.[key])) {
        const id = String(item?.id || "").trim();
        if (!id) continue;
        byId.set(id, { ...mergeItem(byId.get(id), item), id });
      }
    }
    result[key] = [...byId.values()];
  }

  return result;
}

export function canonicalLesson(item) {
  return {
    id: String(item?.id || "").trim(),
    grade: String(item?.grade || ""),
    chapter: String(item?.chapter || item?.chapter_ro || item?.chapter_en || ""),
    tags: asArray(item?.tags).map(String),
    title_ro: String(item?.title_ro || ""),
    title_en: String(item?.title_en || ""),
    learn_ro: String(item?.learn_ro || ""),
    learn_en: String(item?.learn_en || ""),
    why_ro: String(item?.why_ro || ""),
    why_en: String(item?.why_en || ""),
    body_ro: String(item?.body_ro || ""),
    body_en: String(item?.body_en || ""),
    examples_ro: String(item?.examples_ro || ""),
    examples_en: String(item?.examples_en || ""),
    sources: asArray(item?.sources).map(String)
  };
}

export function canonicalProblem(item) {
  return {
    id: String(item?.id || "").trim(),
    lesson_id: String(item?.lesson_id || item?.lessonId || "").trim(),
    difficulty: Number.isFinite(Number(item?.difficulty)) ? Number(item.difficulty) : 1,
    olymp_level: String(item?.olymp_level || item?.olympLevel || ""),
    title_ro: String(item?.title_ro || ""),
    title_en: String(item?.title_en || ""),
    statement_ro: String(item?.statement_ro || ""),
    statement_en: String(item?.statement_en || ""),
    answer: String(item?.answer ?? ""),
    hint1_ro: String(item?.hint1_ro || ""),
    hint1_en: String(item?.hint1_en || ""),
    hint2_ro: String(item?.hint2_ro || ""),
    hint2_en: String(item?.hint2_en || ""),
    source: String(item?.source || "")
  };
}

export function canonicalExam(item) {
  const problems = Array.isArray(item?.problems)
    ? item.problems
    : Array.isArray(item?.exam_problems)
      ? item.exam_problems
      : typeof item?.exam_problems === "string"
        ? item.exam_problems.split(",").map((value) => value.trim()).filter(Boolean)
        : [];

  return {
    id: String(item?.id || "").trim(),
    type: String(item?.type || item?.exam_type || ""),
    year: Number.isFinite(Number(item?.year ?? item?.exam_year)) ? Number(item.year ?? item.exam_year) : 0,
    title_ro: String(item?.title_ro || item?.exam_title_ro || ""),
    title_en: String(item?.title_en || item?.exam_title_en || ""),
    default_hours: Number.isFinite(Number(item?.default_hours ?? item?.defaultHours ?? item?.exam_hours))
      ? Number(item.default_hours ?? item.defaultHours ?? item.exam_hours)
      : 2,
    problems: problems.map(String),
    items: asArray(item?.items),
    scoring_profile: String(item?.scoring_profile || "default_exact_v1"),
    scoring_config: item?.scoring_config ?? null,
    credit_html: String(item?.credit_html || item?.exam_credit || "")
  };
}

export function canonicalCatalog(catalog) {
  return {
    lessons: asArray(catalog?.lessons).map(canonicalLesson),
    problems: asArray(catalog?.problems).map(canonicalProblem),
    exams: asArray(catalog?.exams).map(canonicalExam)
  };
}

export function countDuplicateIds(items) {
  const counts = new Map();
  for (const item of asArray(items)) {
    const id = String(item?.id || "").trim();
    if (!id) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1);
}

export function sqlString(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function sqlTextArray(values) {
  const safe = asArray(values);
  if (!safe.length) return "'{}'::text[]";
  return `array[${safe.map(sqlString).join(", ")}]::text[]`;
}

export function sqlJson(value) {
  return `${sqlString(JSON.stringify(value ?? null))}::jsonb`;
}
