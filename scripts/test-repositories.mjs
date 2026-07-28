import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

async function importBrowserModule(relativePath) {
  const absolutePath = resolve(root, relativePath);
  const source = await readFile(absolutePath, "utf8");
  const encoded = Buffer.from(
    `${source}\n//# sourceURL=${pathToFileURL(absolutePath).href}`,
    "utf8"
  ).toString("base64");
  return import(`data:text/javascript;base64,${encoded}`);
}

class SessionStorageMock {
  #values = new Map();

  getItem(key) {
    return this.#values.has(key) ? this.#values.get(key) : null;
  }

  setItem(key, value) {
    this.#values.set(key, String(value));
  }

  removeItem(key) {
    this.#values.delete(key);
  }

  clear() {
    this.#values.clear();
  }

  get length() {
    return this.#values.size;
  }

  key(index) {
    return [...this.#values.keys()][index] ?? null;
  }
}

globalThis.sessionStorage = new SessionStorageMock();

const {
  catalogTotals,
  getContentCatalogDiagnostics,
  invalidateContentCatalogCache,
  loadContentCatalog
} = await importBrowserModule("js/content-repository.js");
const {
  cancelExamAttempt,
  finishExamAttempt,
  markLessonLearned,
  recordProblemEvent,
  startExamAttempt
} = await importBrowserModule("js/progress-repository.js");
const {
  logLearningEvent,
  requestProblemHint,
  revealProblemAnswer,
  submitProblemAnswer
} = await importBrowserModule("js/secure-evaluation-repository.js");
const {
  cancelSecureExamAttempt,
  getActiveSecureExamAttempt,
  saveSecureExamAnswer,
  startSecureExamAttempt,
  submitSecureExamAttempt
} = await importBrowserModule("js/secure-exam-repository.js");
const {
  getChapterLabel,
  getTagLabel,
  normalizeExam,
  normalizeLesson,
  normalizeProblem
} = await importBrowserModule("js/content-model.js");
const {
  buildRoadmapView,
  normalizeRoadmapCatalog
} = await importBrowserModule("js/roadmap-model.js");
const {
  createRoadmapNodeId,
  filterRoadmapContent,
  moveOrderedItem,
  normalizeOrderedPositions,
  slugifyRoadmapValue
} = await importBrowserModule("js/roadmap-admin-model.js");
const {
  createKeyedMutationQueue,
  mergeCanonicalProblemProgress
} = await importBrowserModule("js/mutation-queue.js");
const {
  buildProfileStats,
  formatExamLabel,
  sortLessonsForProfile
} = await importBrowserModule("js/profile-model.js");
const {
  buildProfileExperienceSummary,
  calculateLevelState,
  calculateOverallCompletion
} = await importBrowserModule("js/profile-experience-model.js");
const profileLevel = calculateLevelState(260);
assert.deepEqual(profileLevel, {
  xp: 260,
  level: 4,
  startXp: 225,
  nextXp: 400,
  remainingXp: 140,
  progress: 20
});
assert.equal(calculateOverallCompletion(
  { learned: 5, solved: 25, passed: 2 },
  { lessons: 10, problems: 50, exams: 4 }
), 50);
assert.deepEqual(
  buildProfileExperienceSummary({
    counts: { learned: 2, solved: 3, passed: 1, xpTotal: 100 },
    totals: { lessons: 4, problems: 6, exams: 2 }
  }),
  {
    overallCompletion: 50,
    level: {
      xp: 100,
      level: 3,
      startXp: 100,
      nextXp: 225,
      remainingXp: 125,
      progress: 0
    },
    lessonsPercent: 50,
    problemsPercent: 50,
    examsPercent: 50
  }
);

const { SmartAnswer } = await importBrowserModule("js/answer-engine.js");
const appProgressModule = await importBrowserModule("js/app-progress.js");
assert.equal(appProgressModule.lessonTimerSecondsRemaining({
  code: "22023",
  message: "Lesson reading timer is still active",
  details: '{"seconds_remaining":5}'
}), 5);
assert.equal(appProgressModule.lessonTimerSecondsRemaining({
  code: "22023",
  message: "Lesson reading session expired",
  details: '{"seconds_remaining":5}'
}), 0);
const { createAuthUiController } = await importBrowserModule("js/auth-ui-controller.js");
const {
  adminDraftStorageKey,
  normalizeAdminDraftContext
} = await importBrowserModule("js/admin-draft-controller.js");
assert.deepEqual(
  normalizeAdminDraftContext({ mode: "edit", type: "problem", id: "p-1" }),
  { mode: "edit", type: "problem", id: "p-1" }
);
assert.deepEqual(
  normalizeAdminDraftContext({ mode: "unknown", type: "unknown", id: "ignored" }),
  { mode: "create", type: "lesson", id: "" }
);
assert.equal(
  adminDraftStorageKey({ mode: "edit", type: "lesson", id: "v-demo" }, "user-id"),
  "mh_admin_content_draft_v2:user-id:edit:lesson:v-demo"
);
const {
  DEFAULT_UI_PREFERENCES,
  invalidateUiPreferencesCache,
  loadUiPreferences,
  mergeUiPreferences,
  normalizeUiPreferences,
  saveUiPreferences,
  serializeUiPreferences
} = await importBrowserModule("js/ui-preferences-repository.js");
const {
  ACTIVE_EXAM_LOCK_KEY,
  LEGACY_ACTIVE_EXAM_LOCK_KEY,
  createExamSessionStore,
  formatExamCountdown
} = await importBrowserModule("js/exam-session-state.js");
const {
  loadProblemWorkspace,
  normalizeProblemWorkspace,
  saveContentWorkspace
} = await importBrowserModule("js/problem-workspace-repository.js");
const {
  aggregateDailyActivity,
  buildAnalyticsInsights,
  heatLevel,
  normalizeAnalyticsPayload,
  progressPercent
} = await importBrowserModule("js/analytics-model.js");
const {
  achievementProgress,
  clampDailyGoal,
  levelRemaining,
  normalizeGamificationPayload,
  progressPercent: gamificationProgressPercent
} = await importBrowserModule("js/gamification-model.js");
const {
  buildProblemRecommendations,
  feedbackForAttempt,
  formatAttemptTime
} = await importBrowserModule("js/problem-workspace-model.js");
const {
  normalizeProblemAttemptCache,
  normalizeQuizAttemptCache,
  safeReadJson,
  safeWriteJson,
  scopedStorageKey
} = await importBrowserModule("js/browser-state.js");
const { normalizeAppRoute, routeToCatalogTab } = await importBrowserModule("js/app-shell-controller.js");
const { normalizeUiError } = await importBrowserModule("js/ui-feedback.js");
const { filterAdminItems, getAdminContentType, suggestDuplicateId } = await importBrowserModule("js/admin-studio-controller.js");
const {
  normalizeAchievementDraft,
  normalizeChallengeDraft,
  normalizeTemplateDraft,
  nextDuplicateId,
  slugifyAdminId
} = await importBrowserModule("js/gamification-admin-model.js");
const {
  buildAdminLessonQuizPayload,
  makeQuizItem,
  normalizeAdminLessonQuiz,
  normalizeQuizAvailability,
  validateAdminLessonQuiz
} = await importBrowserModule("js/lesson-quiz-model.js");
const {
  adminEntityLabel,
  changedFields,
  filterAuditEntries,
  normalizeAuditEntry,
  normalizeVersionEntry
} = await importBrowserModule("js/admin-history-model.js");

const quizAvailability = normalizeQuizAvailability([
  { lesson_id: "lesson-a", question_count: 5, pass_threshold: 100 }
]);
assert.equal(quizAvailability.has("lesson-a"), true);
assert.equal(quizAvailability.get("lesson-a").question_count, 5);
const quizDraft = normalizeAdminLessonQuiz({
  lesson_id: "lesson-a",
  is_published: true,
  items: [makeQuizItem(0, "lesson-a")]
}, "lesson-a");
quizDraft.items[0].prompt_ro = "Întrebare";
quizDraft.items[0].options[0].text_ro = "Corect";
quizDraft.items[0].options[1].text_ro = "Greșit";
quizDraft.items[0].options[2].text_ro = "Greșit 2";
quizDraft.items[0].options[3].text_ro = "Greșit 3";
assert.deepEqual(validateAdminLessonQuiz(quizDraft), []);
const quizPayload = buildAdminLessonQuizPayload(quizDraft, "lesson-a");
assert.equal(quizPayload.lesson_id, "lesson-a");
assert.equal(quizPayload.is_published, true);
assert.equal(quizPayload.items[0].options[0].is_correct, true);
assert.equal("exists" in quizPayload, false);
quizDraft.items[0].options[1].is_correct = true;
assert.equal(validateAdminLessonQuiz(quizDraft).some((message) => message.includes("exact o variantă")), true);

assert.equal(normalizeAppRoute("#problems"), "problems");
assert.equal(normalizeAppRoute("unknown"), "dashboard");
assert.equal(routeToCatalogTab("exams"), "exams");
assert.equal(routeToCatalogTab("roadmap"), "");
assert.equal(normalizeAppRoute("#analytics"), "analytics");
assert.equal(routeToCatalogTab("analytics"), "");
assert.equal(normalizeAppRoute("#gamification"), "gamification");
assert.equal(routeToCatalogTab("gamification"), "");

const brokenStorage = new SessionStorageMock();
brokenStorage.setItem("broken", "{not-json");
assert.deepEqual(safeReadJson(brokenStorage, "broken", {}), {});
assert.equal(brokenStorage.getItem("broken"), null);
assert.equal(safeWriteJson(brokenStorage, "valid", { ok: true }), true);
assert.deepEqual(safeReadJson(brokenStorage, "valid", null), { ok: true });
assert.equal(scopedStorageKey("mh_state", "user-1"), "mh_state:user-1");
assert.equal(scopedStorageKey("mh_state", ""), "");
assert.deepEqual(normalizeProblemAttemptCache({
  p1: { tries: [{ value: "1/2", ok: true }] },
  p2: [{ v: "3", correct: false, created_at: 42 }]
}), {
  p1: [{ value: "1/2", ok: true }],
  p2: [{ value: "3", ok: false, ts: 42 }]
});
assert.deepEqual(normalizeQuizAttemptCache({ q1: { tries: [{ ok: true }] }, bad: [] }), {
  q1: { tries: [{ ok: true }] },
  bad: { tries: [] }
});

function makeContentClient({ rpcError = null, authenticated = true } = {}) {
  const catalog = {
    lessons: [{ id: "lesson-1", title_ro: "Lecție Supabase" }],
    problems: [{ id: "problem-1", lesson_id: "lesson-1", has_hint1: true, secure_evaluation: true }],
    exams: [{ id: "exam-1", problems: ["problem-1"] }]
  };

  return {
    auth: {
      async getSession() {
        return {
          data: { session: authenticated ? { user: { id: "user-content" } } : null },
          error: null
        };
      }
    },
    async rpc(name) {
      assert.equal(name, "mh_get_content_catalog");
      if (rpcError) return { data: null, error: new Error(rpcError) };
      return { data: catalog, error: null };
    }
  };
}

invalidateContentCatalogCache();
const contentClient = makeContentClient();
const catalog = await loadContentCatalog({ supabase: contentClient });

assert.deepEqual(catalogTotals(catalog), {
  lessonsTotal: 1,
  problemsTotal: 1,
  examsTotal: 1
});
assert.equal(getContentCatalogDiagnostics().status, "supabase-rpc");
assert.equal(getContentCatalogDiagnostics().userId, "[authenticated]");

const degradedCatalog = await loadContentCatalog({
  supabase: makeContentClient({ rpcError: "temporary failure" }),
  forceRefresh: true
});

assert.equal(degradedCatalog.problems.length, 1);
assert.equal(getContentCatalogDiagnostics().status, "degraded");

invalidateContentCatalogCache();
await assert.rejects(
  () => loadContentCatalog({
    supabase: makeContentClient({ rpcError: "offline" }),
    forceRefresh: true
  }),
  /offline/i
);

await assert.rejects(
  () => loadContentCatalog({
    supabase: makeContentClient({ authenticated: false })
  }),
  /Authentication is required/i
);

// Fresh memory cache expires after the configured TTL.
invalidateContentCatalogCache();
const originalNow = Date.now;
let fakeNow = 1_800_000_000_000;
Date.now = () => fakeNow;
let ttlRpcCalls = 0;
const ttlClient = {
  auth: { async getSession() { return { data: { session: { user: { id: "ttl-user" } } }, error: null }; } },
  async rpc() {
    ttlRpcCalls += 1;
    return { data: { lessons: [{ id: `lesson-${ttlRpcCalls}` }], problems: [], exams: [] }, error: null };
  }
};
await loadContentCatalog({ supabase: ttlClient });
fakeNow += 11 * 60 * 1000;
await loadContentCatalog({ supabase: ttlClient });
assert.equal(ttlRpcCalls, 2);
Date.now = originalNow;

// An older in-flight response must never overwrite a newer force refresh.
invalidateContentCatalogCache();
const pendingCatalogCalls = [];
const raceClient = {
  auth: { async getSession() { return { data: { session: { user: { id: "race-user" } } }, error: null }; } },
  rpc() {
    return new Promise((resolve) => pendingCatalogCalls.push(resolve));
  }
};
const olderLoad = loadContentCatalog({ supabase: raceClient, forceRefresh: true });
await new Promise((resolve) => setImmediate(resolve));
const newerLoad = loadContentCatalog({ supabase: raceClient, forceRefresh: true });
await new Promise((resolve) => setImmediate(resolve));
assert.equal(pendingCatalogCalls.length, 2);
pendingCatalogCalls[1]({ data: { lessons: [{ id: "fresh" }], problems: [], exams: [] }, error: null });
await newerLoad;
pendingCatalogCalls[0]({ data: { lessons: [{ id: "stale" }], problems: [], exams: [] }, error: null });
const olderResult = await olderLoad;
assert.equal(olderResult.lessons[0].id, "fresh");
assert.equal(getContentCatalogDiagnostics().totals.lessonsTotal, 1);
const cachedAfterRace = await loadContentCatalog({ supabase: raceClient });
assert.equal(cachedAfterRace.lessons[0].id, "fresh");

const calls = [];
const progressClient = {
  rpc: async (name, args) => {
    calls.push({ name, args });
    return { data: [{ ok: true, name }], error: null };
  }
};

await markLessonLearned(progressClient, "lesson-1");
await recordProblemEvent(progressClient, "problem-1", "wrong");
await startExamAttempt(progressClient, "exam-1");
await cancelExamAttempt(progressClient, "exam-1");
await finishExamAttempt(progressClient, "exam-1", 72.5);

assert.deepEqual(calls, [
  { name: "mh_mark_lesson_learned", args: { p_lesson_id: "lesson-1" } },
  { name: "mh_record_problem_event", args: { p_problem_id: "problem-1", p_event: "wrong" } },
  { name: "mh_start_exam_attempt", args: { p_exam_id: "exam-1" } },
  { name: "mh_cancel_exam_attempt", args: { p_exam_id: "exam-1" } },
  { name: "mh_finish_exam_attempt", args: { p_exam_id: "exam-1", p_score: 72.5 } }
]);

await assert.rejects(
  () => recordProblemEvent(progressClient, "problem-1", "invalid"),
  /Invalid problem event/
);

const evaluationCalls = [];
const evaluationClient = {
  async rpc(name, args) {
    evaluationCalls.push({ name, args });
    if (name === "mh_submit_problem_answer") {
      return {
        data: {
          ok: true,
          message_key: "correct",
          verification_mode: "numeric",
          progress: {
            problem_id: args.p_problem_id,
            solved: true,
            xp_earned: 9,
            wrong_attempts: 1,
            hints_used: 0
          }
        },
        error: null
      };
    }
    if (name === "mh_get_problem_hint") {
      return { data: { available: true, hint: "Hint securizat" }, error: null };
    }
    if (name === "mh_reveal_problem_answer") {
      return { data: { answer: "1/2" }, error: null };
    }
    return { data: { logged: true }, error: null };
  }
};

const evaluatedAnswer = await submitProblemAnswer(
  evaluationClient,
  "problem-secure",
  "2/4",
  "ro"
);
assert.equal(evaluatedAnswer.ok, true);
assert.equal(evaluatedAnswer.progress.xp_earned, 9);

const secureHint = await requestProblemHint(
  evaluationClient,
  "problem-secure",
  1,
  "ro"
);
assert.equal(secureHint.hint, "Hint securizat");

const revealed = await revealProblemAnswer(
  evaluationClient,
  "problem-secure",
  "en"
);
assert.equal(revealed.answer, "1/2");

await logLearningEvent(
  evaluationClient,
  "problem_opened",
  "problem",
  "problem-secure",
  { language: "ro" }
);

assert.deepEqual(evaluationCalls.map((call) => call.name), [
  "mh_submit_problem_answer",
  "mh_get_problem_hint",
  "mh_reveal_problem_answer",
  "mh_log_learning_event"
]);

await assert.rejects(
  () => requestProblemHint(evaluationClient, "problem-secure", 3, "ro"),
  /Invalid hint number/
);

const secureExamCalls = [];
const secureExamClient = {
  async rpc(name, args) {
    secureExamCalls.push({ name, args });
    if (name === "mh_start_secure_exam_attempt") {
      return { data: { attempt_id: "attempt-1", exam_id: args.p_exam_id, status: "active" }, error: null };
    }
    if (name === "mh_get_active_exam_attempt") {
      return { data: { attempt_id: "attempt-1", exam_id: args.p_exam_id || "exam-1", status: "active" }, error: null };
    }
    if (name === "mh_save_secure_exam_answer") {
      return { data: { saved: true, saved_at: "2026-07-26T10:00:00Z" }, error: null };
    }
    if (name === "mh_submit_secure_exam_attempt") {
      return { data: { attempt_id: args.p_attempt_id, score: 80, total_points: 100, passed: true }, error: null };
    }
    return { data: { attempt_id: args.p_attempt_id, cancelled: true }, error: null };
  }
};

await startSecureExamAttempt(secureExamClient, "exam-1", 2, "ro");
await getActiveSecureExamAttempt(secureExamClient, "exam-1", "ro");
await saveSecureExamAnswer(secureExamClient, "attempt-1", "item-1", { type: "open", answer_text: "42" });
await submitSecureExamAttempt(secureExamClient, "attempt-1");
await cancelSecureExamAttempt(secureExamClient, "attempt-1");

assert.deepEqual(secureExamCalls.map((call) => call.name), [
  "mh_start_secure_exam_attempt",
  "mh_get_active_exam_attempt",
  "mh_save_secure_exam_answer",
  "mh_submit_secure_exam_attempt",
  "mh_cancel_secure_exam_attempt"
]);

const examStorage = new SessionStorageMock();
let examNow = 1_000;
const examSessionStore = createExamSessionStore({
  storage: examStorage,
  now: () => examNow
});

const storedSession = examSessionStore.setExamState("exam-admin", {
  endsAt: 10_000,
  attemptRecorded: true,
  startedByAdmin: true,
  startedAt: 1_000,
  attemptId: "attempt-secure-1"
});
assert.equal(storedSession.startedByAdmin, true);
assert.equal(storedSession.attemptId, "attempt-secure-1");
assert.equal(examSessionStore.getExamState("exam-admin").attemptRecorded, true);

examSessionStore.setActiveExamLock({ examId: "exam-admin", endsAt: 10_000 });
assert.equal(examSessionStore.hasActiveExamLock(), true);
assert.equal(examSessionStore.isOtherExamLocked("exam-admin"), false);
assert.equal(examSessionStore.isOtherExamLocked("exam-other"), true);
assert.ok(examStorage.getItem(ACTIVE_EXAM_LOCK_KEY));

examSessionStore.clearSession("exam-admin");
assert.equal(examSessionStore.getExamState("exam-admin"), null);
assert.equal(examSessionStore.hasActiveExamLock(), false);

examStorage.setItem(LEGACY_ACTIVE_EXAM_LOCK_KEY, JSON.stringify({
  examId: "exam-legacy",
  endsAt: 20_000
}));
assert.equal(examSessionStore.getActiveExamLock().examId, "exam-legacy");
assert.equal(examStorage.getItem(LEGACY_ACTIVE_EXAM_LOCK_KEY), null);
assert.ok(examStorage.getItem(ACTIVE_EXAM_LOCK_KEY));

examNow = 25_000;
assert.equal(examSessionStore.getActiveExamLock(), null);
assert.equal(formatExamCountdown(3_661_000), "01:01:01");
assert.equal(formatExamCountdown(61_000), "01:01");

const exactFraction = SmartAnswer.check({
  user: "2/4",
  expected: "1/2",
  problem: { statement_ro: "Scrie fracția" }
});
assert.equal(exactFraction.ok, true);

const setAnswer = SmartAnswer.check({
  user: "{2,1}",
  expected: "{1,2}",
  problem: { statement_ro: "Determinați mulțimea" }
});
assert.equal(setAnswer.ok, true);

const normalizedLesson = normalizeLesson({
  id: "lesson-model",
  chapter_en: "Algebra",
  tags: ["ecuatii"]
});
assert.equal(normalizedLesson.chapter, "Algebra");
assert.deepEqual(normalizedLesson.tags, ["ecuatii"]);

const normalizedProblem = normalizeProblem({
  id: "problem-model",
  lesson_id: "lesson-model",
  olymp_level: "J"
});
assert.equal(normalizedProblem.lessonId, "lesson-model");
assert.equal(normalizedProblem.olympLevel, "J");

const normalizedExam = normalizeExam({
  id: "exam-model",
  default_hours: 3,
  items: [{ type: "mcq", options: [{ label: "A", is_correct: true }] }]
});
assert.equal(normalizedExam.defaultHours, 3);
assert.equal(normalizedExam.items[0].options_count, 1);
assert.equal(getChapterLabel("ecuatii", "en"), "Equations");
assert.equal(getTagLabel("multimi", "ro"), "mulțimi");

const mutationOrder = [];
const queue = createKeyedMutationQueue();
await Promise.all([
  queue.enqueue("problem:1", async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    mutationOrder.push("first");
  }),
  queue.enqueue("problem:1", async () => {
    mutationOrder.push("second");
  })
]);
assert.deepEqual(mutationOrder, ["first", "second"]);
assert.equal(queue.pendingCount, 0);

const mergedProblem = mergeCanonicalProblemProgress(
  { solved: true, xp: 7 },
  { solved: false, xp_earned: 0, wrong_attempts: 1 },
  "wrong"
);
assert.equal(mergedProblem.solved, true);
assert.equal(mergedProblem.record.xp, 7);

const profileStats = buildProfileStats({
  lessonRows: [{ lesson_id: "lesson-1", learned: true, learned_at: "2026-01-01" }],
  problemRows: [{ problem_id: "problem-1", solved: true, xp_earned: 8, solved_at: "2026-01-02" }],
  examRows: [{ exam_id: "exam-1", passed: false, best_score: 45, attempts_count: 2 }],
  catalog: {
    lessons: [
      { id: "lesson-2", grade: "VI", chapter: "B", title_ro: "A doua" },
      { id: "lesson-1", grade: "V", chapter: "A", title_ro: "Prima" }
    ],
    problems: [{ id: "problem-1", title_ro: "Problemă" }],
    exams: [{ id: "exam-1", type: "EN", year: 2026, title_ro: "Simulare" }]
  },
  lang: "ro"
});
assert.equal(profileStats.counts.learned, 1);
assert.equal(profileStats.counts.solved, 1);
assert.equal(profileStats.counts.xpTotal, 8);
assert.equal(profileStats.counts.totalExamAttempts, 2);
assert.equal(profileStats.nextLesson.id, "lesson-2");
assert.equal(profileStats.retryRecommended, true);
assert.equal(formatExamLabel(profileStats.recommendedExam, "ro"), "Simulare (EN • 2026)");
assert.deepEqual(sortLessonsForProfile(profileStats.catalog.lessons, "ro").map((item) => item.id), ["lesson-1", "lesson-2"]);


const progressRows = {
  user_lesson_progress: [{ lesson_id: "lesson-progress", learned: true }],
  user_problem_progress: [{
    problem_id: "problem-progress",
    solved: true,
    xp_earned: 9,
    wrong_attempts: 1,
    hints_used: 0
  }],
  user_exam_progress: [{ exam_id: "exam-progress", passed: true }]
};

const progressErrors = new Set();
const appProgressClient = {
  auth: {
    async getUser() {
      return { data: { user: { id: "user-1" } }, error: null };
    }
  },
  from(table) {
    return {
      select() {
        return {
          async eq() {
            return progressErrors.has(table)
              ? { data: null, error: new Error(`${table} unavailable`) }
              : { data: progressRows[table] || [], error: null };
          }
        };
      }
    };
  }
};

let progressRefreshes = 0;
let progressCounterRefreshes = 0;
const appProgress = appProgressModule.createAppProgressController({
  supabase: appProgressClient,
  startLessonReading: async (_client, lessonId) => ({
    lesson_id: lessonId,
    read_completed: false,
    learned: false,
    session_id: "session-1",
    eligible_at: new Date(Date.now() + 60_000).toISOString()
  }),
  markLessonRead: async (_client, lessonId) => ({
    lesson_id: lessonId,
    read_completed: true,
    learned: false
  }),
  completeLessonQuiz: async (_client, lessonId) => ({
    lesson_id: lessonId,
    read_completed: true,
    quiz_passed: true,
    learned: true
  }),
  startExamAttempt: async (_client, examId) => ({ exam_id: examId, attempts_count: 1 }),
  finishExamAttempt: async (_client, examId, score) => ({ exam_id: examId, best_score: score, passed: score >= 60 }),
  cancelExamAttempt: async (_client, examId) => ({ exam_id: examId, attempts_count: 0, started_at: null }),
  createKeyedMutationQueue,
  mergeCanonicalProblemProgress,
  isExamProblem: () => false,
  onCountersChanged: () => { progressCounterRefreshes += 1; },
  onFullRefresh: () => { progressRefreshes += 1; }
});

await appProgress.loadAppProgressFromDb({ id: "user-1" });
assert.equal(appProgressModule.learnedSet.has("lesson-progress"), true);
assert.equal(appProgressModule.readSet.has("lesson-progress"), true);
assert.equal(appProgressModule.solvedSet.has("problem-progress"), true);
assert.equal(appProgressModule.examsPassedSet.has("exam-progress"), true);
assert.equal(appProgressModule.XP_TOTAL, 9);
assert.equal(progressRefreshes, 2);

progressErrors.add("user_problem_progress");
progressRows.user_lesson_progress = [];
const originalWarn = console.warn;
const progressWarnings = [];
console.warn = (...args) => progressWarnings.push(args.map(String).join(" "));
try {
  await appProgress.loadAppProgressFromDb({ id: "user-1" });
} finally {
  console.warn = originalWarn;
}
assert.ok(progressWarnings.some((message) => message.includes("keeping the last known state")));
assert.equal(appProgressModule.learnedSet.has("lesson-progress"), false);
assert.equal(appProgressModule.solvedSet.has("problem-progress"), true);
assert.equal(appProgressModule.XP_TOTAL, 9);
progressErrors.clear();
progressRows.user_lesson_progress = [{ lesson_id: "lesson-progress", learned: true }];

const readingSession = await appProgress.startLessonReadingSafe("lesson-new");
assert.equal(readingSession.session_id, "session-1");
await appProgress.markLessonReadSafe("lesson-new", "session-1");
assert.equal(appProgressModule.readSet.has("lesson-new"), true);
await appProgress.completeLessonQuizSafe("lesson-new");
assert.equal(appProgressModule.learnedSet.has("lesson-new"), true);
appProgress.applyProblemProgressResult("problem-new", {
  problem_id: "problem-new",
  solved: true,
  xp_earned: 8,
  wrong_attempts: 1,
  hints_used: 1
}, "solved");
assert.equal(appProgressModule.solvedSet.has("problem-new"), true);
const cancelledAttempt = await appProgress.cancelExamAttemptSafe("exam-new");
assert.equal(cancelledAttempt.attempts_count, 0);
assert.ok(progressCounterRefreshes >= 2);

const authSequence = [];
const authController = createAuthUiController({
  supabase: {
    auth: {
      async getSession() {
        authSequence.push("session");
        return { data: { session: { user: { id: "user-auth" } } }, error: null };
      },
      onAuthStateChange() {
        return { data: { subscription: { unsubscribe() {} } } };
      }
    }
  },
  hideAdminButton: () => authSequence.push("hide"),
  loadProgress: async (user) => authSequence.push(`progress:${user?.id || "guest"}`),
  refreshAdminButton: async () => authSequence.push("admin")
});

await authController.sync();
assert.deepEqual(authSequence, ["hide", "session", "progress:user-auth", "admin"]);


const normalizedRoadmaps = normalizeRoadmapCatalog({
  selected_roadmap_id: "ubb",
  schema_version: "phase-12",
  roadmaps: [{
    id: "ubb",
    title_ro: "Road to UBB",
    position: 0,
    sections: [{ id: "core", title_ro: "Core", position: 0 }],
    nodes: [
      { id: "n1", section_id: "core", node_type: "lesson", content_id: "l1", required: true, content_exists: true, position: 0 },
      { id: "n2", section_id: "core", node_type: "problem", content_id: "p1", required: true, content_exists: true, position: 1 },
      { id: "n3", section_id: "core", node_type: "milestone", required: true, content_exists: true, position: 2 },
      { id: "n4", section_id: "core", node_type: "lesson", content_id: "missing", required: false, content_exists: false, position: 3 }
    ],
    edges: [
      { prerequisite_node_id: "n1", dependent_node_id: "n2", edge_type: "required" },
      { prerequisite_node_id: "n2", dependent_node_id: "n3", edge_type: "required" }
    ]
  }]
});

assert.equal(normalizedRoadmaps.selectedRoadmapId, "ubb");
assert.equal(normalizedRoadmaps.roadmaps[0].nodes.length, 4);

const firstRoadmapView = buildRoadmapView({
  roadmap: normalizedRoadmaps.roadmaps[0],
  catalog: {
    lessons: [{ id: "l1", title_ro: "Lecția 1" }],
    problems: [{ id: "p1", title_ro: "Problema 1" }],
    exams: []
  },
  learnedSet: new Set(["l1"]),
  solvedSet: new Set(),
  examsPassedSet: new Set(),
  language: "ro"
});

assert.equal(firstRoadmapView.nodeStates.get("n1").status, "done");
assert.equal(firstRoadmapView.nodeStates.get("n2").status, "available");
assert.equal(firstRoadmapView.nodeStates.get("n3").status, "locked");
assert.equal(firstRoadmapView.nodeStates.get("n4").status, "planned");
assert.equal(firstRoadmapView.progress.percent, 50);
assert.equal(firstRoadmapView.nextNode.node.id, "n2");

const readOnlyRoadmapView = buildRoadmapView({
  roadmap: normalizedRoadmaps.roadmaps[0],
  catalog: {
    lessons: [{ id: "l1", title_ro: "Lecția 1" }],
    problems: [{ id: "p1", title_ro: "Problema 1" }],
    exams: []
  },
  learnedSet: new Set(),
  readSet: new Set(["l1"]),
  solvedSet: new Set(),
  examsPassedSet: new Set(),
  language: "ro"
});

assert.equal(readOnlyRoadmapView.nodeStates.get("n1").read, true);
assert.equal(readOnlyRoadmapView.nodeStates.get("n1").status, "available");
assert.equal(readOnlyRoadmapView.progress.percent, 0);

const completedRoadmapView = buildRoadmapView({
  roadmap: normalizedRoadmaps.roadmaps[0],
  catalog: {
    lessons: [{ id: "l1", title_ro: "Lecția 1" }],
    problems: [{ id: "p1", title_ro: "Problema 1" }],
    exams: []
  },
  learnedSet: new Set(["l1"]),
  solvedSet: new Set(["p1"]),
  examsPassedSet: new Set(),
  language: "ro"
});

assert.equal(completedRoadmapView.nodeStates.get("n3").status, "done");
assert.equal(completedRoadmapView.progress.percent, 100);

const roadmapRepositoryModule = await import(
  `${pathToFileURL(resolve(root, "js/roadmap-repository.js")).href}?phase18c3=${Date.now()}`
);
roadmapRepositoryModule.invalidateRoadmapCache();
let roadmapAuthChecks = 0;
let roadmapRpcCalls = 0;
const roadmapClient = {
  auth: {
    async getUser() {
      roadmapAuthChecks += 1;
      return { data: { user: { id: "roadmap-user" } }, error: null };
    }
  },
  async rpc(name) {
    roadmapRpcCalls += 1;
    assert.equal(name, "mh_get_roadmap_catalog");
    return {
      data: { selected_roadmap_id: "", schema_version: "phase-18c3", roadmaps: [] },
      error: null
    };
  }
};
await roadmapRepositoryModule.loadRoadmapCatalog({
  supabase: roadmapClient,
  user: { id: "roadmap-user" }
});
await roadmapRepositoryModule.loadRoadmapCatalog({
  supabase: roadmapClient,
  user: { id: "roadmap-user" }
});
assert.equal(roadmapAuthChecks, 0);
assert.equal(roadmapRpcCalls, 1);


assert.equal(slugifyRoadmapValue("Funcții și grafice"), "functii-si-grafice");
assert.equal(
  createRoadmapNodeId({
    roadmapId: "ubb",
    sectionId: "algebra",
    nodeType: "lesson",
    contentId: "ecuații",
    existingIds: ["ubb-algebra-lesson-ecuatii"]
  }),
  "ubb-algebra-lesson-ecuatii-2"
);
assert.deepEqual(
  moveOrderedItem([{ id: "a" }, { id: "b" }, { id: "c" }], "b", "up").map((item) => item.id),
  ["b", "a", "c"]
);
assert.deepEqual(
  normalizeOrderedPositions([{ id: "b" }, { id: "a" }]).map(({ id, position }) => ({ id, position })),
  [{ id: "b", position: 0 }, { id: "a", position: 10 }]
);
assert.deepEqual(
  filterRoadmapContent({
    lessons: [{ id: "l1", title_ro: "Ecuații", chapter: "Algebră" }],
    problems: [{ id: "p1", title_ro: "Fracții" }],
    exams: []
  }, { type: "lesson", query: "algebr" }).map((item) => item.contentId),
  ["l1"]
);

const normalizedUiPreferences = normalizeUiPreferences({
  compact_home: true,
  sections: { roadmap: false, catalog: false, unknown: false }
});
assert.equal(normalizedUiPreferences.compactHome, true);
assert.equal(normalizedUiPreferences.sections.roadmap, false);
assert.equal(normalizedUiPreferences.sections.catalog, false);
assert.equal(normalizedUiPreferences.sections.hub, true);
assert.equal("unknown" in normalizedUiPreferences.sections, false);

const mergedUiPreferences = mergeUiPreferences(normalizedUiPreferences, {
  sections: { roadmap: true, boss: false }
});
assert.equal(mergedUiPreferences.sections.roadmap, true);
assert.equal(mergedUiPreferences.sections.boss, false);
assert.equal(mergedUiPreferences.sections.catalog, false);
assert.deepEqual(serializeUiPreferences(DEFAULT_UI_PREFERENCES), {
  version: 2,
  compact_home: false,
  sections: {
    hub: true,
    roadmap: true,
    boss: true,
    radar: true,
    catalog: true
  },
  onboarding: {
    completed: false,
    version: 0
  }
});
const onboardedPreferences = mergeUiPreferences(DEFAULT_UI_PREFERENCES, {
  onboarding: { completed: true, version: 1 }
});
assert.equal(onboardedPreferences.onboarding.completed, true);
assert.equal(onboardedPreferences.onboarding.version, 1);

invalidateUiPreferencesCache();
const uiPreferenceCalls = [];
const uiPreferenceClient = {
  async rpc(name, args = {}) {
    uiPreferenceCalls.push({ name, args });
    await new Promise((resolve) => setTimeout(resolve, 5));
    if (name === "mh_get_ui_preferences") {
      return { data: { compact_home: true, sections: { roadmap: false } }, error: null };
    }
    return { data: args.p_preferences, error: null };
  }
};
const [sharedPreferencesA, sharedPreferencesB] = await Promise.all([
  loadUiPreferences(uiPreferenceClient, { userId: "prefs-user" }),
  loadUiPreferences(uiPreferenceClient, { userId: "prefs-user" })
]);
assert.equal(uiPreferenceCalls.filter((call) => call.name === "mh_get_ui_preferences").length, 1);
assert.equal(sharedPreferencesA.compactHome, true);
assert.deepEqual(sharedPreferencesA, sharedPreferencesB);
await saveUiPreferences(uiPreferenceClient, mergeUiPreferences(sharedPreferencesA, {
  sections: { roadmap: true }
}), { userId: "prefs-user" });
const cachedPreferences = await loadUiPreferences(uiPreferenceClient, { userId: "prefs-user" });
assert.equal(cachedPreferences.sections.roadmap, true);
assert.equal(uiPreferenceCalls.filter((call) => call.name === "mh_get_ui_preferences").length, 1);


// Phase 13B: problem workspace persistence and recommendation model.
const workspaceCalls = [];
const workspaceClient = {
  async rpc(name, args) {
    workspaceCalls.push({ name, args });
    if (name === "mh_get_problem_workspace") {
      return {
        data: {
          bookmarked: true,
          note: "Remember the sign.",
          explanation_mode: "boss",
          can_view_solution: true,
          solution: { answer: "4", simple: "Add two and two.", boss: "Boss mode: 2 + 2 = 4." },
          attempts: [{ id: 1, answer: "3", correct: false, verification_mode: "numeric", created_at: "2026-07-26T12:00:00Z" }]
        },
        error: null
      };
    }
    return {
      data: { bookmarked: false, note: "Updated", explanation_mode: "simple" },
      error: null
    };
  }
};

const workspacePayload = normalizeProblemWorkspace(
  await loadProblemWorkspace(workspaceClient, "problem-1", "ro")
);
assert.equal(workspacePayload.bookmarked, true);
assert.equal(workspacePayload.explanationMode, "boss");
assert.equal(workspacePayload.attempts[0].answer, "3");
assert.equal(workspacePayload.canViewSolution, true);

await saveContentWorkspace(workspaceClient, {
  contentType: "problem",
  contentId: "problem-1",
  bookmarked: false,
  note: "Updated",
  explanationMode: "simple"
});
assert.equal(workspaceCalls[0].name, "mh_get_problem_workspace");
assert.equal(workspaceCalls[1].name, "mh_save_content_workspace");
assert.equal(workspaceCalls[1].args.p_note, "Updated");

const recommendations = buildProblemRecommendations({
  currentProblem: { id: "p1", lesson_id: "l1", difficulty: 2 },
  problems: [
    { id: "p1", lesson_id: "l1", difficulty: 2 },
    { id: "p2", lesson_id: "l1", difficulty: 3 },
    { id: "p3", lesson_id: "l2", difficulty: 2 },
    { id: "p4", lesson_id: "l1", difficulty: 1 }
  ],
  solvedIds: new Set(["p4"]),
  limit: 2
});
assert.deepEqual(recommendations.map((item) => item.id), ["p2", "p3"]);
assert.match(feedbackForAttempt({ language: "ro", wrongAttempts: 2, hasHint1: true }), /Hint 1/);
assert.ok(formatAttemptTime("2026-07-26T12:00:00Z", "ro"));


// Phase 15A: analytics normalization, insight ranking and chart helpers.
const analyticsPayload = normalizeAnalyticsPayload({
  range_days: 90,
  summary: { answer_attempts: 10, correct_answers: 7, accuracy: 70, xp_total: 42 },
  chapters: [
    { chapter: "Algebra", mastery: 82, activity: 14 },
    { chapter: "Geometry", mastery: 31, activity: 8 },
    { chapter: "Analysis", mastery: 58, activity: 9 }
  ],
  daily_activity: Array.from({ length: 60 }, (_, index) => ({
    date: `2026-06-${String((index % 30) + 1).padStart(2, "0")}`,
    events: 1,
    xp: index % 2
  }))
});
assert.equal(analyticsPayload.summary.correctAnswers, 7);
assert.equal(progressPercent(3, 4), 75);
assert.equal(heatLevel(5, 10), 2);
const analyticsInsights = buildAnalyticsInsights(analyticsPayload);
assert.equal(analyticsInsights.strengths[0].chapter, "Algebra");
assert.equal(analyticsInsights.weaknesses[0].chapter, "Geometry");
assert.ok(aggregateDailyActivity(analyticsPayload.dailyActivity, 30).length <= 30);

// Phase 16: normalized levels, goals, achievements and leaderboard rows.
const gamificationPayload = normalizeGamificationPayload({
  summary: {
    level: 4,
    total_xp: 260,
    level_start_xp: 225,
    level_next_xp: 400,
    level_progress: 20,
    daily_goal: 5,
    daily_progress: 3,
    current_streak: 4,
    leaderboard_opt_in: true,
    solved_problems: 12
  },
  weekly_challenge: {
    id: "weekly-2026-30",
    title: "Weekly",
    target: 8,
    progress: 5,
    reward_xp: 40
  },
  achievements: [{
    id: "problems-50",
    title: "50",
    criteria: { metric: "solved_problems", threshold: 50 },
    unlocked: false
  }],
  leaderboard: [{ rank: 1, display_name: "Ada", level: 4, total_xp: 260 }]
});
assert.equal(gamificationPayload.summary.level, 4);
assert.equal(clampDailyGoal(100), 50);
assert.equal(gamificationProgressPercent(3, 5), 60);
assert.equal(levelRemaining(gamificationPayload.summary), 140);
assert.equal(achievementProgress(gamificationPayload.achievements[0], gamificationPayload.summary).percent, 24);
assert.equal(gamificationPayload.leaderboard[0].displayName, "Ada");



// Phase 17A: Admin Studio filtering and duplicate IDs.
const adminItems = [
  { id: "l-algebra", content_type: "lesson", title_ro: "Ecuații", grade: "VIII", chapter: "Algebră", tags: ["ecuații"] },
  { id: "p-algebra", content_type: "problem", title_ro: "Ecuație cu parametru", grade: "VIII", chapter: "Algebră", difficulty: 4, lesson_id: "l-algebra" },
  { id: "exam-ubb", content_type: "exam", title_ro: "Admitere UBB", year: 2026, items: [] }
];
assert.equal(getAdminContentType(adminItems[0]), "lesson");
assert.deepEqual(
  filterAdminItems(adminItems, { type: "problem", query: "parametru", difficulty: "4" }).map((item) => item.id),
  ["p-algebra"]
);
assert.deepEqual(
  filterAdminItems(adminItems, { query: "algebr", sort: "title-asc" }).map((item) => item.id),
  ["p-algebra", "l-algebra"]
);
assert.equal(suggestDuplicateId("l-algebra", adminItems.map((item) => item.id)), "l-algebra-copy");
assert.equal(suggestDuplicateId("l-algebra", ["l-algebra-copy", "l-algebra-copy-2"]), "l-algebra-copy-3");



// Phase 17B: Admin gamification payload normalization and safe duplicate IDs.
assert.equal(slugifyAdminId("Precizie maximă"), "precizie-maxima");
assert.equal(nextDuplicateId("xp-100", ["xp-100-copy", "xp-100-copy-2"]), "xp-100-copy-3");
const achievementDraft = normalizeAchievementDraft({
  id: "accuracy-master",
  title_ro: "Precizie",
  metric: "accuracy",
  threshold: "85",
  min_attempts: "20",
  reward_xp: "50",
  rarity: "epic",
  active: true
});
assert.equal(achievementDraft.criteria.metric, "accuracy");
assert.equal(achievementDraft.criteria.threshold, 85);
assert.equal(achievementDraft.criteria.min_attempts, 20);
assert.equal(achievementDraft.reward_xp, 50);
assert.equal(achievementDraft.rarity, "epic");
const challengeDraft = normalizeChallengeDraft({
  id: "algebra-week",
  metric: "solved_problem",
  target: "8",
  reward_xp: "40",
  starts_on: "2026-07-27",
  ends_on: "2026-08-02",
  featured: true
});
assert.equal(challengeDraft.target, 8);
assert.equal(challengeDraft.featured, true);
const templateDraft = normalizeTemplateDraft({
  id: "weekly-problems",
  metric: "solved_problem",
  target_min: "5",
  target_max: "9",
  reward_min: "25",
  reward_max: "45"
});
assert.equal(templateDraft.target_min, 5);
assert.equal(templateDraft.target_max, 9);
assert.equal(templateDraft.reward_max, 45);


// Phase 17C: Admin audit/version models and atomic roadmap repository contract.
const auditRows = [
  {
    id: 1,
    table_name: "mh_problems",
    entity_id: "p-1",
    operation: "update",
    actor_label: "Cristi",
    before_data: { title_ro: "Vechi", difficulty: 2 },
    after_data: { title_ro: "Nou", difficulty: 2 },
    created_at: "2026-07-28T10:00:00Z"
  },
  {
    id: 2,
    table_name: "mh_lessons",
    entity_id: "l-1",
    operation: "insert",
    after_data: { title_ro: "Lecție" },
    created_at: "2026-07-28T11:00:00Z"
  }
];
assert.equal(normalizeAuditEntry(auditRows[0]).entityId, "p-1");
assert.deepEqual(changedFields(auditRows[0]), ["title_ro"]);
assert.deepEqual(
  filterAuditEntries(auditRows, { query: "title", tableName: "mh_problems" }).map((entry) => entry.id),
  [1]
);
assert.equal(adminEntityLabel("mh_exams", "ro"), "Examen");
assert.equal(normalizeVersionEntry({ id: 3, snapshot: { id: "p-1" } }).snapshot.id, "p-1");

// Phase 17C.2.4: lesson verification must be reconciled after progress changes.
const appSource17c24 = await readFile(resolve(root, "js/app.js"), "utf8");
assert.match(appSource17c24, /onLessonChanged: \(\) =>[\s\S]*mhUpdateLessonDrawerButtons\(\)/);
const showLessonActionsAt = appSource17c24.indexOf("setLessonOnlyActionsVisible(true);");
assert.ok(showLessonActionsAt >= 0 && appSource17c24.indexOf("mhUpdateLessonDrawerButtons();", showLessonActionsAt) > showLessonActionsAt);

// Phase 18A: loading screen is shared, explicit, and independent from window.load.
const loadingScreenSource = await readFile(resolve(root, "js/loading-screen.js"), "utf8");
const katexInitSource18A = await readFile(resolve(root, "js/katex-init.js"), "utf8");
const indexSource18A = await readFile(resolve(root, "index.html"), "utf8");
const profileSource18A = await readFile(resolve(root, "profile.html"), "utf8");
assert.match(loadingScreenSource, /window\.MathHardLoading = Object\.freeze/);
assert.match(loadingScreenSource, /slowThresholdMs = 10000/);
assert.match(indexSource18A, /id="math-loader"/);
assert.match(profileSource18A, /id="math-loader"/);
assert.doesNotMatch(katexInitSource18A, /loader-hidden|math-loader/);


// Phase 18B: shared safe errors and onboarding preference persistence.
assert.equal(normalizeUiError({ code: "42501", message: "Not allowed" }, { language: "ro" }).key, "access");
assert.equal(normalizeUiError({ code: "23503", message: "foreign key constraint" }, { language: "en" }).key, "conflict");
assert.equal(normalizeUiError({ code: "PGRST202", message: "Could not find the function" }, { language: "ro" }).key, "missing");
const onboardingSource18B = await readFile(resolve(root, "js/onboarding-controller.js"), "utf8");
const uiFeedbackSource18B = await readFile(resolve(root, "js/ui-feedback.js"), "utf8");
assert.match(onboardingSource18B, /mh:onboarding-open/);
assert.match(onboardingSource18B, /selectRoadmap/);
assert.match(onboardingSource18B, /localOnboarding\.completed/);
assert.match(onboardingSource18B, /writeLocal\(user\.id, completion\)/);
assert.match(uiFeedbackSource18B, /normalizeUiError/);
assert.match(uiFeedbackSource18B, /initConnectionFeedback/);

console.log("MathHard repository tests passed.");
