export const ACHIEVEMENT_METRICS = Object.freeze([
  "learned_lessons",
  "solved_problems",
  "passed_exams",
  "total_xp",
  "perfect_solutions",
  "current_streak",
  "longest_streak",
  "accuracy",
  "chapter_checks_completed",
  "chapter_completed",
  "chapters_completed",
  "extensions_completed",
  "chapter_practice_completed"
]);

export const ACHIEVEMENT_CATEGORIES = Object.freeze([
  "lessons",
  "problems",
  "chapters",
  "exploration",
  "exams",
  "global",
  "secret"
]);

export const CHALLENGE_METRICS = Object.freeze([
  "answer_correct",
  "solved_problem",
  "lesson_completed",
  "exam_finished"
]);

export function slugifyAdminId(value, fallback = "item") {
  const slug = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return slug || fallback;
}

export function nextDuplicateId(id, existingIds = []) {
  const used = new Set(Array.from(existingIds, (value) => String(value)));
  const base = `${String(id || "item").replace(/-copy(?:-\d+)?$/i, "")}-copy`;
  if (!used.has(base)) return base;
  let index = 2;
  while (used.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function integer(value, fallback = 0, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function boolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  return fallback;
}

export function normalizeAchievementDraft(input = {}) {
  const criteria = input.criteria && typeof input.criteria === "object" ? input.criteria : {};
  const metric = ACHIEVEMENT_METRICS.includes(criteria.metric || input.metric)
    ? (criteria.metric || input.metric)
    : "solved_problems";
  const threshold = Number(criteria.threshold ?? input.threshold ?? 1);
  const minAttempts = integer(criteria.min_attempts ?? input.min_attempts, 0, 0, 1000000);

  return {
    id: slugifyAdminId(input.id || input.title_ro || input.title_en, "achievement"),
    title_ro: String(input.title_ro || "").trim(),
    title_en: String(input.title_en || input.title_ro || "").trim(),
    description_ro: String(input.description_ro || "").trim(),
    description_en: String(input.description_en || input.description_ro || "").trim(),
    icon: String(input.icon || "✦").trim().slice(0, 12) || "✦",
    category: ACHIEVEMENT_CATEGORIES.includes(input.category)
      ? input.category
      : "global",
    criteria: {
      metric,
      threshold: Number.isFinite(threshold) ? Math.max(0, threshold) : 1,
      ...(metric === "accuracy" ? { min_attempts: minAttempts } : {}),
      ...(["chapter_checks_completed", "chapter_completed", "chapter_practice_completed"].includes(metric)
        ? { chapter_id: String(criteria.chapter_id ?? input.chapter_id ?? "").trim() }
        : {})
    },
    reward_xp: integer(input.reward_xp, 0, 0, 100000),
    rarity: ["common", "uncommon", "rare", "epic", "legendary"].includes(input.rarity)
      ? input.rarity
      : "common",
    hidden_until_unlocked: boolean(input.hidden_until_unlocked, false),
    sort_order: integer(input.sort_order, 0, -100000, 100000),
    active: boolean(input.active, true)
  };
}

export function normalizeChallengeDraft(input = {}) {
  const metric = CHALLENGE_METRICS.includes(input.metric) ? input.metric : "solved_problem";
  return {
    id: slugifyAdminId(input.id || input.title_ro || input.title_en, "challenge"),
    title_ro: String(input.title_ro || "").trim(),
    title_en: String(input.title_en || input.title_ro || "").trim(),
    description_ro: String(input.description_ro || "").trim(),
    description_en: String(input.description_en || input.description_ro || "").trim(),
    metric,
    target: integer(input.target, 1, 1, 100000),
    reward_xp: integer(input.reward_xp, 0, 0, 100000),
    starts_on: String(input.starts_on || "").slice(0, 10),
    ends_on: String(input.ends_on || "").slice(0, 10),
    active: boolean(input.active, true),
    featured: boolean(input.featured, false),
    sort_order: integer(input.sort_order, 0, -100000, 100000)
  };
}

export function normalizeTemplateDraft(input = {}) {
  const metric = CHALLENGE_METRICS.includes(input.metric) ? input.metric : "solved_problem";
  const targetMin = integer(input.target_min, 1, 1, 100000);
  const targetMax = integer(input.target_max, targetMin, targetMin, 100000);
  const rewardMin = integer(input.reward_min, 0, 0, 100000);
  const rewardMax = integer(input.reward_max, rewardMin, rewardMin, 100000);
  return {
    id: slugifyAdminId(input.id || input.title_ro || input.title_en, "template"),
    title_ro: String(input.title_ro || "").trim(),
    title_en: String(input.title_en || input.title_ro || "").trim(),
    description_ro: String(input.description_ro || "").trim(),
    description_en: String(input.description_en || input.description_ro || "").trim(),
    metric,
    target_min: targetMin,
    target_max: targetMax,
    reward_min: rewardMin,
    reward_max: rewardMax,
    weight: integer(input.weight, 1, 1, 1000),
    sort_order: integer(input.sort_order, 0, -100000, 100000),
    enabled: boolean(input.enabled, true)
  };
}
