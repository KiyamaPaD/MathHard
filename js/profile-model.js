const PROFILE_GRADE_ORDER = [
  "V", "VI", "VII", "VIII",
  "IX", "X", "XI", "XII",
  "OL-V", "OL-VI", "OL-VII", "OL-VIII",
  "OL-IX", "OL-X", "OL-XI", "OL-XII",
  "EN", "BAC", "ADM", "FAC", "RES"
];

const PROFILE_EXAM_TYPE_ORDER = ["EN", "BAC", "ADM"];

function localeFor(lang) {
  return lang === "en" ? "en" : "ro";
}

function gradeIndex(grade) {
  const index = PROFILE_GRADE_ORDER.indexOf(String(grade || "").trim());
  return index === -1 ? 999 : index;
}

function examTypeIndex(type) {
  const index = PROFILE_EXAM_TYPE_ORDER.indexOf(
    String(type || "").trim().toUpperCase()
  );
  return index === -1 ? 999 : index;
}

export function localizedTitle(item, lang = "ro", fallback = "—") {
  if (!item) return fallback;
  return lang === "en"
    ? (item.title_en || item.title_ro || item.id || fallback)
    : (item.title_ro || item.title_en || item.id || fallback);
}

export function sortLessonsForProfile(lessons, lang = "ro") {
  return [...(lessons || [])].sort((a, b) => {
    const gradeDifference = gradeIndex(a.grade) - gradeIndex(b.grade);
    if (gradeDifference !== 0) return gradeDifference;

    const chapterDifference = String(a.chapter || "").localeCompare(
      String(b.chapter || ""),
      localeFor(lang)
    );
    if (chapterDifference !== 0) return chapterDifference;

    return localizedTitle(a, lang, "").localeCompare(
      localizedTitle(b, lang, ""),
      localeFor(lang)
    );
  });
}

export function sortExamsForProfile(exams, lang = "ro") {
  return [...(exams || [])].sort((a, b) => {
    const typeDifference = examTypeIndex(a.type) - examTypeIndex(b.type);
    if (typeDifference !== 0) return typeDifference;

    const yearDifference = Number(b.year || 0) - Number(a.year || 0);
    if (yearDifference !== 0) return yearDifference;

    return localizedTitle(a, lang, "").localeCompare(
      localizedTitle(b, lang, ""),
      localeFor(lang)
    );
  });
}

export function formatExamLabel(exam, lang = "ro") {
  if (!exam) return "—";
  const title = localizedTitle(exam, lang, lang === "en" ? "Exam" : "Examen");
  const metadata = [exam.type, exam.year].filter(Boolean);
  return metadata.length ? `${title} (${metadata.join(" • ")})` : title;
}

function newestFirst(rows, fields) {
  return [...rows].sort((a, b) => {
    const firstDate = fields.map((field) => a?.[field]).find(Boolean) || 0;
    const secondDate = fields.map((field) => b?.[field]).find(Boolean) || 0;
    return new Date(secondDate).getTime() - new Date(firstDate).getTime();
  });
}

export function buildProfileStats({
  lessonRows = [],
  problemRows = [],
  examRows = [],
  catalog = { lessons: [], problems: [], exams: [] },
  taxonomy = null,
  gamificationSummary = null,
  lang = "ro"
} = {}) {
  const lessons = sortLessonsForProfile(catalog.lessons, lang);
  const problems = (catalog.problems || []).map((problem) => ({
    ...problem,
    lessonId: problem.lessonId || problem.lesson_id || ""
  }));
  const exams = sortExamsForProfile(catalog.exams, lang);

  const learnedRows = lessonRows.filter((row) => row.learned);
  const readRows = lessonRows.filter((row) => row.read_completed || row.learned);
  const readOnlyRows = readRows.filter((row) => !row.learned);
  const solvedRows = problemRows.filter((row) => row.solved);
  const attemptedRows = problemRows.filter(
    (row) => !row.solved && Number(row.wrong_attempts ?? row.attempts ?? 0) > 0
  );
  const openedRows = problemRows.filter(
    (row) => !row.solved && Number(row.wrong_attempts ?? row.attempts ?? 0) <= 0
  );
  const passedRows = examRows.filter((row) => row.passed);
  const failedRows = examRows.filter((row) => !row.passed);

  const totals = {
    lessons: Number(taxonomy?.lessons?.total ?? lessons.length),
    problems: Number(taxonomy?.problems?.total ?? problems.length),
    exams: exams.length
  };

  const learned = Number(taxonomy?.lessons?.learned ?? learnedRows.length);
  const read = Math.max(learned, Number(taxonomy?.lessons?.read ?? readRows.length));
  const readOnly = Number(taxonomy?.lessons?.readOnly ?? Math.max(0, read - learned));
  const unread = Number(taxonomy?.lessons?.unread ?? Math.max(0, totals.lessons - read));

  const solved = Number(taxonomy?.problems?.solved ?? solvedRows.length);
  const attempted = Number(taxonomy?.problems?.attempted ?? attemptedRows.length);
  const opened = Number(taxonomy?.problems?.opened ?? openedRows.length);
  const unopened = Number(
    taxonomy?.problems?.unopened ?? Math.max(0, totals.problems - solved - attempted - opened)
  );

  const passed = passedRows.length;
  const failed = failedRows.length;

  const baseXp = solvedRows.reduce(
    (sum, row) => sum + Number(row.xp_earned || 0),
    0
  );
  const canonicalTotalXp = Number(gamificationSummary?.totalXp ?? gamificationSummary?.total_xp);
  const canonicalBonusXp = Number(gamificationSummary?.bonusXp ?? gamificationSummary?.bonus_xp);
  const bonusXp = Number.isFinite(canonicalBonusXp) ? Math.max(0, canonicalBonusXp) : 0;
  const xpTotal = Number.isFinite(canonicalTotalXp)
    ? Math.max(0, canonicalTotalXp)
    : Math.max(0, baseXp + bonusXp);

  const learnedIds = new Set(
    taxonomy?.lessons?.learnedIds?.length
      ? taxonomy.lessons.learnedIds
      : learnedRows.map((row) => row.lesson_id).filter(Boolean)
  );
  const attemptedExamIds = new Set(examRows.map((row) => row.exam_id).filter(Boolean));

  const nextLesson = lessons.find((lesson) => !learnedIds.has(lesson.id)) || null;

  const failedExamRowsSorted = [...failedRows].sort(
    (a, b) => Number(b.best_score || 0) - Number(a.best_score || 0)
  );
  const retryExam = exams.find((exam) => exam.id === failedExamRowsSorted[0]?.exam_id) || null;
  const newExam = exams.find((exam) => !attemptedExamIds.has(exam.id)) || null;
  const recommendedExam = retryExam || newExam || null;

  const lessonById = new Map(lessons.map((item) => [item.id, item]));
  const problemById = new Map(problems.map((item) => [item.id, item]));
  const examById = new Map(exams.map((item) => [item.id, item]));

  const recentLessonRow = newestFirst(learnedRows, ["learned_at", "updated_at"])[0] || null;
  const recentProblemRow = newestFirst(solvedRows, ["solved_at", "updated_at"])[0] || null;
  const sortedExamRows = newestFirst(examRows, ["passed_at", "updated_at", "started_at"]);
  const recentExamRow = sortedExamRows[0] || null;

  const bestExamRow = [...examRows].sort(
    (a, b) => Number(b.best_score || 0) - Number(a.best_score || 0)
  )[0] || null;

  return {
    catalog: { lessons, problems, exams },
    counts: {
      read,
      learned,
      readOnly,
      unread,
      solved,
      attempted,
      opened,
      unopened,
      // Compatibility aliases for older profile widgets.
      wrong: attempted,
      unresolved: opened + unopened,
      passed,
      failed,
      unlearned: Math.max(0, totals.lessons - learned),
      unattempted: Math.max(0, totals.exams - passed - failed),
      baseXp,
      bonusXp,
      xpTotal,
      avgXp: solved > 0 ? (baseXp / solved).toFixed(2) : "0",
      totalExamAttempts: examRows.reduce(
        (sum, row) => sum + Number(row.attempts_count || 0),
        0
      )
    },
    totals,
    nextLesson,
    recommendedExam,
    retryRecommended: !!retryExam,
    recent: {
      lessonRow: recentLessonRow,
      lesson: recentLessonRow ? lessonById.get(recentLessonRow.lesson_id) || null : null,
      problemRow: recentProblemRow,
      problem: recentProblemRow ? problemById.get(recentProblemRow.problem_id) || null : null,
      examRow: recentExamRow,
      exam: recentExamRow ? examById.get(recentExamRow.exam_id) || null : null
    },
    exams: {
      bestRow: bestExamRow,
      best: bestExamRow ? examById.get(bestExamRow.exam_id) || null : null,
      lastRow: recentExamRow,
      last: recentExamRow ? examById.get(recentExamRow.exam_id) || null : null
    }
  };
}
