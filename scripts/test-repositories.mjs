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
  getChapterLabel,
  getTagLabel,
  normalizeExam,
  normalizeLesson,
  normalizeProblem
} = await importBrowserModule("js/content-model.js");
const {
  createKeyedMutationQueue,
  mergeCanonicalProblemProgress
} = await importBrowserModule("js/mutation-queue.js");
const {
  buildProfileStats,
  formatExamLabel,
  sortLessonsForProfile
} = await importBrowserModule("js/profile-model.js");
const { SmartAnswer } = await importBrowserModule("js/answer-engine.js");
const appProgressModule = await importBrowserModule("js/app-progress.js");
const { createAuthUiController } = await importBrowserModule("js/auth-ui-controller.js");
const {
  ACTIVE_EXAM_LOCK_KEY,
  LEGACY_ACTIVE_EXAM_LOCK_KEY,
  createExamSessionStore,
  formatExamCountdown
} = await importBrowserModule("js/exam-session-state.js");

function makeContentClient({ failures = {} } = {}) {
  const rows = {
    mh_lessons: [{ id: "lesson-1", title_ro: "Lecție Supabase" }],
    mh_problems: [{ id: "problem-1", lesson_id: "lesson-1", answer: "2" }],
    mh_exams: [{ id: "exam-1", problems: ["problem-1"] }]
  };

  return {
    from(table) {
      return {
        async select() {
          if (failures[table]) {
            return { data: null, error: new Error(failures[table]) };
          }
          return { data: rows[table] || [], error: null };
        }
      };
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
assert.equal(getContentCatalogDiagnostics().status, "supabase");

const degradedCatalog = await loadContentCatalog({
  supabase: makeContentClient({ failures: { mh_problems: "temporary failure" } }),
  forceRefresh: true
});

assert.equal(degradedCatalog.problems.length, 1);
assert.equal(getContentCatalogDiagnostics().status, "degraded");
assert.deepEqual(getContentCatalogDiagnostics().staleGroups, ["problems"]);

invalidateContentCatalogCache();
await assert.rejects(
  () => loadContentCatalog({
    supabase: makeContentClient({ failures: { mh_lessons: "offline" } }),
    forceRefresh: true
  }),
  /could not be loaded from Supabase/i
);

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
  startedAt: 1_000
});
assert.equal(storedSession.startedByAdmin, true);
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
            return { data: progressRows[table] || [], error: null };
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
  markLessonLearned: async (_client, lessonId) => ({ lesson_id: lessonId, learned: true }),
  recordProblemEvent: async (_client, problemId) => ({
    problem_id: problemId,
    solved: true,
    xp_earned: 8,
    wrong_attempts: 1,
    hints_used: 1
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
assert.equal(appProgressModule.solvedSet.has("problem-progress"), true);
assert.equal(appProgressModule.examsPassedSet.has("exam-progress"), true);
assert.equal(appProgressModule.XP_TOTAL, 9);
assert.equal(progressRefreshes, 2);

await appProgress.markLessonLearnedSafe("lesson-new");
assert.equal(appProgressModule.learnedSet.has("lesson-new"), true);
await appProgress.recordProblemEventSafe("problem-new", "solved");
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

console.log("MathHard repository tests passed.");
