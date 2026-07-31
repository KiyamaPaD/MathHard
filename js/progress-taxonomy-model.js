const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ids = (value) => Array.isArray(value)
  ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))]
  : [];

const boundedPercent = (value, total) => {
  const safeTotal = Math.max(0, number(total));
  if (safeTotal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((number(value) / safeTotal) * 100)));
};

export function normalizeProgressTaxonomy(payload = {}) {
  const source = payload?.taxonomy && typeof payload.taxonomy === "object"
    ? payload.taxonomy
    : payload;
  const lessonSource = source?.lessons && typeof source.lessons === "object"
    ? source.lessons
    : {};
  const problemSource = source?.problems && typeof source.problems === "object"
    ? source.problems
    : {};

  const lessonTotal = Math.max(0, number(lessonSource.total));
  const learned = Math.max(0, number(lessonSource.learned));
  const read = Math.max(learned, number(lessonSource.read));
  const readOnly = Math.max(0, number(lessonSource.read_only, read - learned));
  const unread = Math.max(0, number(lessonSource.unread, lessonTotal - read));

  const problemTotal = Math.max(0, number(problemSource.total));
  const solved = Math.max(0, number(problemSource.solved));
  const attempted = Math.max(0, number(problemSource.attempted));
  const opened = Math.max(0, number(problemSource.opened));
  const unopened = Math.max(0, number(problemSource.unopened, problemTotal - solved - attempted - opened));

  return {
    available: source?.available !== false,
    generatedAt: String(source?.generated_at || ""),
    lessons: {
      total: lessonTotal,
      read,
      learned,
      readOnly,
      unread,
      readRate: boundedPercent(read, lessonTotal),
      learnedRate: boundedPercent(learned, lessonTotal),
      readIds: ids(lessonSource.read_ids),
      learnedIds: ids(lessonSource.learned_ids)
    },
    problems: {
      total: problemTotal,
      solved,
      attempted,
      opened,
      unopened,
      solvedRate: boundedPercent(solved, problemTotal),
      engagedRate: boundedPercent(solved + attempted + opened, problemTotal),
      solvedIds: ids(problemSource.solved_ids),
      attemptedIds: ids(problemSource.attempted_ids),
      openedIds: ids(problemSource.opened_ids),
      unopenedIds: ids(problemSource.unopened_ids)
    }
  };
}

export function problemStatusForId(problemId, taxonomy = {}) {
  const id = String(problemId || "").trim();
  if (!id) return "unopened";

  const problems = taxonomy?.problems || {};
  if ((problems.solvedIds || []).includes(id)) return "solved";
  if ((problems.attemptedIds || []).includes(id)) return "attempted";
  if ((problems.openedIds || []).includes(id)) return "opened";
  return "unopened";
}

export function buildProgressInsights(taxonomy = {}) {
  const lessons = taxonomy?.lessons || {};
  const problems = taxonomy?.problems || {};

  return {
    lessons: {
      readOnlyShare: boundedPercent(lessons.readOnly, lessons.total),
      learnedFromReadShare: boundedPercent(lessons.learned, lessons.read),
      unreadShare: boundedPercent(lessons.unread, lessons.total)
    },
    problems: {
      conversionFromAttempt: boundedPercent(problems.solved, problems.solved + problems.attempted),
      openedWithoutAttemptShare: boundedPercent(problems.opened, problems.total),
      untouchedShare: boundedPercent(problems.unopened, problems.total)
    }
  };
}
