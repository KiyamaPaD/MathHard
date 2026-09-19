const LEGACY_GROUPS = Object.freeze({
  "practice-scaffold": { order: 1, ro: "Practică / Scaffolding", en: "Practice / Scaffolding", roHint: "consolidare ghidată", enHint: "guided consolidation" },
  "mixed-transfer": { order: 2, ro: "BAC / Mixed transfer", en: "Exam / Mixed transfer", roHint: "alegerea metodei în contexte mixte", enHint: "method selection in mixed contexts" },
  capstone: { order: 3, ro: "Capstone", en: "Capstone", roHint: "integrare finală", enHint: "final integration" }
});

function safeText(value, fallback = "") { return String(value ?? fallback).trim(); }
function unique(values) { return [...new Set(values.map((value) => safeText(value)).filter(Boolean))]; }

export function normalizePracticeGroups(raw) {
  if (!Array.isArray(raw)) return [];
  const usedIds = new Set();
  const usedProblems = new Set();
  const groups = [];
  raw.slice(0, 20).forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    let key = safeText(entry.id || entry.key || `group-${index + 1}`).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!key) key = `group-${index + 1}`;
    if (usedIds.has(key)) return;
    usedIds.add(key);
    const problemIds = unique(Array.isArray(entry.problem_ids) ? entry.problem_ids : entry.problemIds || []).filter((id) => {
      if (usedProblems.has(id)) return false;
      usedProblems.add(id);
      return true;
    });
    groups.push({
      key,
      order: groups.length + 1,
      ro: safeText(entry.title_ro || entry.ro, `Grup ${groups.length + 1}`),
      en: safeText(entry.title_en || entry.en, safeText(entry.title_ro || entry.ro, `Group ${groups.length + 1}`)),
      roHint: safeText(entry.hint_ro || entry.roHint),
      enHint: safeText(entry.hint_en || entry.enHint, safeText(entry.hint_ro || entry.roHint)),
      problemIds
    });
  });
  return groups;
}

function legacyGroupForProblem(problem) {
  const tags = [...(problem?.tags || [])].map((tag) => safeText(tag).toLowerCase());
  const configKey = safeText(problem?.grading_config?.practice_group).toLowerCase();
  const aliases = { scaffold: "practice-scaffold", transfer: "mixed-transfer" };
  const key = tags.find((tag) => LEGACY_GROUPS[tag]) || aliases[configKey] || (LEGACY_GROUPS[configKey] ? configKey : "");
  return key ? { key, ...LEGACY_GROUPS[key], problemIds: [] } : null;
}

export function buildPracticeGroupPlan(lesson, problems = []) {
  const configured = normalizePracticeGroups(lesson?.practice_groups);
  const problemIds = new Set((problems || []).map((problem) => safeText(problem?.id)).filter(Boolean));
  const groupByProblemId = new Map();
  const groups = [];

  if (configured.length) {
    configured.forEach((group) => {
      const ids = group.problemIds.filter((id) => problemIds.has(id));
      const normalized = { ...group, problemIds: ids };
      groups.push(normalized);
      ids.forEach((id, itemOrder) => groupByProblemId.set(id, { ...normalized, itemOrder }));
    });
    const ungroupedIds = (problems || []).map((problem) => safeText(problem?.id)).filter((id) => id && !groupByProblemId.has(id));
    if (ungroupedIds.length) {
      const ungrouped = { key: "__ungrouped", order: 999, ro: "Alte probleme", en: "Other problems", roHint: "negrupate", enHint: "ungrouped", problemIds: ungroupedIds };
      groups.push(ungrouped);
      ungroupedIds.forEach((id, itemOrder) => groupByProblemId.set(id, { ...ungrouped, itemOrder }));
    }
    return { configured: true, hasGroups: groups.length > 0, groups, groupByProblemId };
  }

  (problems || []).forEach((problem) => {
    const group = legacyGroupForProblem(problem);
    if (!group) return;
    let target = groups.find((entry) => entry.key === group.key);
    if (!target) { target = { ...group, problemIds: [] }; groups.push(target); }
    target.problemIds.push(problem.id);
  });
  groups.sort((a, b) => a.order - b.order);
  groups.forEach((group) => group.problemIds.forEach((id, itemOrder) => groupByProblemId.set(id, { ...group, itemOrder })));
  return { configured: false, hasGroups: groups.length > 0, groups, groupByProblemId };
}

export function getPracticeGroupMeta(problem, lesson, problems = []) {
  return buildPracticeGroupPlan(lesson, problems).groupByProblemId.get(problem?.id) || null;
}

export function countPracticeGroups(plan) {
  const counts = {};
  (plan?.groups || []).forEach((group) => { counts[group.key] = group.problemIds.length; });
  return counts;
}

function problemOrder(problem) { return Number(String(problem?.id || "").match(/p(\d+)$/i)?.[1] || 0); }
function sortDefault(left, right, mode, problemIndex) {
  if (mode === "easy-desc") return (right.difficulty - left.difficulty) || (left.title_ro || "").localeCompare(right.title_ro || "", "ro");
  if (mode === "newest") {
    const leftIndex = problemIndex.get(left.id) ?? 0, rightIndex = problemIndex.get(right.id) ?? 0;
    const leftAdded = left.addedAt ? Date.parse(left.addedAt) : -leftIndex, rightAdded = right.addedAt ? Date.parse(right.addedAt) : -rightIndex;
    return rightAdded - leftAdded;
  }
  return (left.difficulty - right.difficulty) || (problemOrder(left) - problemOrder(right)) || (left.title_ro || "").localeCompare(right.title_ro || "", "ro");
}

export function sortProblemCatalog(list, { mode = "easy-asc", lessonScoped = false, lesson = null, problemIndex = new Map() } = {}) {
  const plan = lessonScoped ? buildPracticeGroupPlan(lesson, list) : null;
  if (plan?.hasGroups) {
    return list.sort((left, right) => {
      const lg = plan.groupByProblemId.get(left.id), rg = plan.groupByProblemId.get(right.id);
      const groupDifference = (lg?.order ?? 999) - (rg?.order ?? 999);
      if (groupDifference) return groupDifference;
      if (plan.configured && lg?.key === rg?.key) return (lg?.itemOrder ?? 999) - (rg?.itemOrder ?? 999);
      return sortDefault(left, right, mode, problemIndex);
    });
  }
  return list.sort((left, right) => sortDefault(left, right, mode, problemIndex));
}
