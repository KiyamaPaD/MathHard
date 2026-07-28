function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function clampPercent(value) {
  return Math.max(0, Math.min(100, finiteNumber(value)));
}

export function completionPercent(value, total) {
  const safeValue = Math.max(0, finiteNumber(value));
  const safeTotal = Math.max(0, finiteNumber(total));
  if (safeTotal === 0) return 0;
  return clampPercent((safeValue / safeTotal) * 100);
}

export function calculateOverallCompletion(counts = {}, totals = {}) {
  const components = [
    [counts.learned, totals.lessons],
    [counts.solved, totals.problems],
    [counts.passed, totals.exams]
  ]
    .filter(([, total]) => finiteNumber(total) > 0)
    .map(([value, total]) => completionPercent(value, total));

  if (!components.length) return 0;
  return Math.round(
    components.reduce((sum, value) => sum + value, 0) / components.length
  );
}

export function calculateLevelState(xpValue) {
  const xp = Math.max(0, Math.floor(finiteNumber(xpValue)));
  const level = Math.floor(Math.sqrt(xp / 25)) + 1;
  const startXp = 25 * (level - 1) ** 2;
  const nextXp = 25 * level ** 2;
  const span = Math.max(1, nextXp - startXp);
  const progress = clampPercent(((xp - startXp) / span) * 100);

  return {
    xp,
    level,
    startXp,
    nextXp,
    remainingXp: Math.max(0, nextXp - xp),
    progress: Math.round(progress)
  };
}

export function buildProfileExperienceSummary({ counts = {}, totals = {} } = {}) {
  return {
    overallCompletion: calculateOverallCompletion(counts, totals),
    level: calculateLevelState(counts.xpTotal),
    lessonsPercent: completionPercent(counts.learned, totals.lessons),
    problemsPercent: completionPercent(counts.solved, totals.problems),
    examsPercent: completionPercent(counts.passed, totals.exams)
  };
}
