const PRACTICE_GROUPS = Object.freeze({
  "practice-scaffold": {
    order: 1,
    ro: "Practică / Scaffolding",
    en: "Practice / Scaffolding",
    roHint: "consolidare ghidată",
    enHint: "guided consolidation"
  },
  "mixed-transfer": {
    order: 2,
    ro: "BAC / Mixed transfer",
    en: "Exam / Mixed transfer",
    roHint: "alegerea metodei în contexte mixte",
    enHint: "method selection in mixed contexts"
  },
  capstone: {
    order: 3,
    ro: "Capstone",
    en: "Capstone",
    roHint: "integrare finală",
    enHint: "final integration"
  }
});

export function getPracticeGroupMeta(problem) {
  const tags = [...(problem?.tags || [])].map((tag) => String(tag || "").trim().toLowerCase());
  for (const [key, meta] of Object.entries(PRACTICE_GROUPS)) {
    if (tags.includes(key)) return { key, ...meta };
  }
  return null;
}

function problemOrder(problem) {
  return Number(String(problem?.id || "").match(/p(\d+)$/i)?.[1] || 0);
}

function sortWithinGroup(left, right, mode, problemIndex) {
  if (mode === "easy-desc") {
    if (left.difficulty !== right.difficulty) return right.difficulty - left.difficulty;
    return (left.title_ro || "").localeCompare(right.title_ro || "", "ro");
  }
  if (mode === "newest") {
    const leftIndex = problemIndex.get(left.id) ?? 0;
    const rightIndex = problemIndex.get(right.id) ?? 0;
    const leftAdded = left.addedAt ? Date.parse(left.addedAt) : -leftIndex;
    const rightAdded = right.addedAt ? Date.parse(right.addedAt) : -rightIndex;
    return rightAdded - leftAdded;
  }
  if (left.difficulty !== right.difficulty) return left.difficulty - right.difficulty;
  const leftOrder = problemOrder(left);
  const rightOrder = problemOrder(right);
  if (leftOrder && rightOrder && leftOrder !== rightOrder) return leftOrder - rightOrder;
  return (left.title_ro || "").localeCompare(right.title_ro || "", "ro");
}

export function sortGroupedLessonPractice(list, { mode = "easy-asc", lessonScoped = false, problemIndex = new Map() } = {}) {
  if (!lessonScoped || !list.some((problem) => getPracticeGroupMeta(problem))) return null;
  return list.sort((left, right) => {
    const leftGroup = getPracticeGroupMeta(left);
    const rightGroup = getPracticeGroupMeta(right);
    const groupDifference = (leftGroup?.order ?? 99) - (rightGroup?.order ?? 99);
    return groupDifference || sortWithinGroup(left, right, mode, problemIndex);
  });
}

export function countPracticeGroups(list) {
  return list.reduce((counts, problem) => {
    const group = getPracticeGroupMeta(problem);
    if (group) counts[group.key] = (counts[group.key] || 0) + 1;
    return counts;
  }, {});
}

export function sortProblemCatalog(list, { mode = "easy-asc", lessonScoped = false, problemIndex = new Map() } = {}) {
  const grouped = sortGroupedLessonPractice(list, { mode, lessonScoped, problemIndex });
  if (grouped) return grouped;
  if (mode === "easy-asc") {
    return list.sort((left, right) => left.difficulty !== right.difficulty
      ? left.difficulty - right.difficulty
      : (left.title_ro || "").localeCompare(right.title_ro || "", "ro"));
  }
  if (mode === "easy-desc") {
    return list.sort((left, right) => left.difficulty !== right.difficulty
      ? right.difficulty - left.difficulty
      : (left.title_ro || "").localeCompare(right.title_ro || "", "ro"));
  }
  return list.sort((left, right) => {
    const leftIndex = problemIndex.get(left.id) ?? 0;
    const rightIndex = problemIndex.get(right.id) ?? 0;
    const leftAdded = left.addedAt ? Date.parse(left.addedAt) : -leftIndex;
    const rightAdded = right.addedAt ? Date.parse(right.addedAt) : -rightIndex;
    return rightAdded - leftAdded;
  });
}
