const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const text = (value, fallback = "") => String(value ?? fallback);

export function clampAnalyticsRange(value) {
  const parsed = Math.round(number(value, 90));
  return Math.max(7, Math.min(365, parsed));
}

export function normalizeAnalyticsPayload(payload = {}) {
  const summary = payload?.summary && typeof payload.summary === "object"
    ? payload.summary
    : {};

  return {
    generatedAt: text(payload.generated_at),
    rangeDays: clampAnalyticsRange(payload.range_days),
    summary: {
      learnedLessons: number(summary.learned_lessons),
      totalLessons: number(summary.total_lessons),
      solvedProblems: number(summary.solved_problems),
      totalProblems: number(summary.total_problems),
      passedExams: number(summary.passed_exams),
      totalExams: number(summary.total_exams),
      xpTotal: number(summary.xp_total),
      answerAttempts: number(summary.answer_attempts),
      correctAnswers: number(summary.correct_answers),
      wrongAnswers: number(summary.wrong_answers),
      accuracy: number(summary.accuracy),
      wrongAttempts: number(summary.wrong_attempts),
      hintsUsed: number(summary.hints_used),
      solutionsRevealed: number(summary.solutions_revealed),
      examAttempts: number(summary.exam_attempts),
      averageExamScore: number(summary.average_exam_score),
      bestExamScore: number(summary.best_exam_score),
      currentStreak: number(summary.current_streak),
      longestStreak: number(summary.longest_streak),
      activeDays: number(summary.active_days),
      masteryAverage: number(summary.mastery_average)
    },
    dailyActivity: Array.isArray(payload.daily_activity)
      ? payload.daily_activity.map((row) => ({
        date: text(row.date),
        events: number(row.events),
        correct: number(row.correct),
        wrong: number(row.wrong),
        hints: number(row.hints),
        lessons: number(row.lessons),
        exams: number(row.exams),
        xp: number(row.xp)
      }))
      : [],
    heatmap: Array.isArray(payload.heatmap)
      ? payload.heatmap.map((row) => ({ date: text(row.date), count: number(row.count) }))
      : [],
    chapters: Array.isArray(payload.chapters)
      ? payload.chapters.map((row) => ({
        chapter: text(row.chapter, "—"),
        lessonTotal: number(row.lesson_total),
        lessonsCompleted: number(row.lessons_completed),
        problemTotal: number(row.problem_total),
        problemsSolved: number(row.problems_solved),
        attempts: number(row.attempts),
        correctAttempts: number(row.correct_attempts),
        wrongAttempts: number(row.wrong_attempts),
        accuracy: number(row.accuracy),
        mastery: number(row.mastery),
        activity: number(row.activity)
      }))
      : [],
    examTypes: Array.isArray(payload.exam_types)
      ? payload.exam_types.map((row) => ({
        type: text(row.type, "ALT"),
        attempts: number(row.attempts),
        passed: number(row.passed),
        averageScore: number(row.average_score),
        bestScore: number(row.best_score)
      }))
      : [],
    recentActivity: Array.isArray(payload.recent_activity)
      ? payload.recent_activity.map((row) => ({
        eventType: text(row.event_type),
        contentType: text(row.content_type),
        contentId: text(row.content_id),
        title: text(row.title, row.content_id || "—"),
        createdAt: text(row.created_at)
      }))
      : []
  };
}

export function progressPercent(value, total) {
  const safeTotal = number(total);
  if (safeTotal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((number(value) / safeTotal) * 100)));
}

export function buildAnalyticsInsights(analytics = {}) {
  const chapters = Array.isArray(analytics.chapters) ? analytics.chapters : [];
  const active = chapters.filter((chapter) => chapter.activity > 0);
  const strengths = [...active]
    .filter((chapter) => chapter.mastery >= 35)
    .sort((a, b) => b.mastery - a.mastery || b.activity - a.activity)
    .slice(0, 3);
  const weaknesses = [...active]
    .filter((chapter) => chapter.mastery < 75)
    .sort((a, b) => a.mastery - b.mastery || b.activity - a.activity)
    .slice(0, 3);

  return {
    strengths,
    weaknesses,
    hasActivity: Boolean(
      analytics.summary?.answerAttempts
      || analytics.summary?.learnedLessons
      || analytics.summary?.examAttempts
      || analytics.summary?.xpTotal
    )
  };
}

export function aggregateDailyActivity(rows = [], maxPoints = 30) {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (safeRows.length <= maxPoints) return safeRows;

  const size = Math.ceil(safeRows.length / maxPoints);
  const grouped = [];
  for (let index = 0; index < safeRows.length; index += size) {
    const chunk = safeRows.slice(index, index + size);
    grouped.push({
      date: chunk.at(-1)?.date || "",
      events: chunk.reduce((sum, row) => sum + number(row.events), 0),
      correct: chunk.reduce((sum, row) => sum + number(row.correct), 0),
      wrong: chunk.reduce((sum, row) => sum + number(row.wrong), 0),
      hints: chunk.reduce((sum, row) => sum + number(row.hints), 0),
      lessons: chunk.reduce((sum, row) => sum + number(row.lessons), 0),
      exams: chunk.reduce((sum, row) => sum + number(row.exams), 0),
      xp: chunk.reduce((sum, row) => sum + number(row.xp), 0)
    });
  }
  return grouped;
}

export function heatLevel(count, maximum) {
  const value = number(count);
  const max = Math.max(1, number(maximum, 1));
  if (value <= 0) return 0;
  const ratio = value / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export function normalizeChapterProgressPayload(payload = {}) {
  const source = payload && typeof payload === "object" ? payload : {};
  const summary = source.summary && typeof source.summary === "object" ? source.summary : {};
  return {
    available: source.available !== false,
    summary: {
      total: number(summary.total),
      completed: number(summary.completed),
      inProgress: number(summary.in_progress),
      notStarted: number(summary.not_started)
    },
    chapters: Array.isArray(source.chapters) ? source.chapters.map((row) => ({
      id: text(row.id),
      title: text(row.title, row.id || "—"),
      description: text(row.description),
      status: ["completed", "in_progress", "not_started"].includes(row.status) ? row.status : "not_started",
      coreLessonTotal: number(row.core_lesson_total),
      coreLessonsCompleted: number(row.core_lessons_completed),
      verificationTotal: number(row.verification_total),
      verificationsPassed: number(row.verifications_passed),
      synthesisTotal: number(row.synthesis_total),
      synthesesCompleted: number(row.syntheses_completed),
      practiceTotal: number(row.practice_total),
      problemsSolved: number(row.problems_solved),
      extensionTotal: number(row.extension_total),
      extensionsCompleted: number(row.extensions_completed),
      conceptIds: Array.isArray(row.concept_ids) ? row.concept_ids.map((value) => text(value)).filter(Boolean) : [],
      conceptTotal: 0,
      conceptsMastered: 0,
      activity: number(row.activity)
    })) : []
  };
}

export function attachChapterConceptProgress(chapterProgress = {}, conceptMastery = {}) {
  const masteryById = new Map((Array.isArray(conceptMastery?.concepts) ? conceptMastery.concepts : [])
    .map((concept) => [concept.id, concept]));
  return {
    ...chapterProgress,
    chapters: (Array.isArray(chapterProgress?.chapters) ? chapterProgress.chapters : []).map((chapter) => {
      const concepts = chapter.conceptIds.map((id) => masteryById.get(id)).filter(Boolean);
      return {
        ...chapter,
        conceptTotal: concepts.length,
        conceptsMastered: concepts.filter((concept) => concept.status === "mastered").length
      };
    })
  };
}
