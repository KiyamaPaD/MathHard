export let solvedSet = new Set();
export let learnedSet = new Set();
export let examsPassedSet = new Set();
export let XP_TOTAL = 0;
export let XP_DETAILS = {};

function resetProgressState() {
  solvedSet = new Set();
  learnedSet = new Set();
  examsPassedSet = new Set();
  XP_TOTAL = 0;
  XP_DETAILS = {};
}

export function createAppProgressController({
  supabase,
  markLessonLearned,
  recordProblemEvent,
  startExamAttempt,
  finishExamAttempt,
  createKeyedMutationQueue,
  mergeCanonicalProblemProgress,
  isExamProblem,
  onXpChanged = () => {},
  onCountersChanged = () => {},
  onLessonChanged = () => {},
  onTerminalProblemChanged = () => {},
  onFullRefresh = () => {}
}) {
  if (!supabase) throw new Error("createAppProgressController requires supabase");

  const progressMutationQueue = createKeyedMutationQueue();
  const enqueueProgressMutation = progressMutationQueue.enqueue;

  let progressUser = null;
  let authUser = null;
  let loadEpoch = 0;

  function getXPRecord(problemId) {
    if (!XP_DETAILS[problemId]) {
      XP_DETAILS[problemId] = {
        xp: 0,
        wrong: 0,
        hints: 0,
        solved: false,
        usedHint1: false,
        usedHint2: false
      };
    }
    return XP_DETAILS[problemId];
  }

  function recomputeXPTotal() {
    XP_TOTAL = Object.values(XP_DETAILS || {}).reduce((sum, record) => {
      return sum + Number(record?.xp || 0);
    }, 0);

    onXpChanged(XP_TOTAL);
    return XP_TOTAL;
  }

  function awardXPForProblem(problem) {
    if (isExamProblem(problem)) return 0;

    const record = getXPRecord(problem.id);
    if (record.solved) return Number(record.xp || 0);

    const penalty = Number(record.wrong || 0) + Number(record.hints || 0);
    const earned = Math.max(0, Math.min(10, 10 - penalty));

    record.solved = true;
    record.xp = earned;
    recomputeXPTotal();
    return earned;
  }

  function reconcileMutationError(label, error) {
    // Keep optimistic UI intact. A failed backend write must not make a correct
    // answer or learned lesson visually disappear while the user is working.
    console.error(`${label} error:`, error);
  }

  function applyCanonicalProblemProgress(problemId, row, eventName) {
    if (!row) return;

    const merged = mergeCanonicalProblemProgress(
      XP_DETAILS[problemId] || {},
      row,
      eventName
    );

    XP_DETAILS[problemId] = merged.record;

    if (merged.solved) solvedSet.add(problemId);
    else if (merged.terminalEvent) solvedSet.delete(problemId);

    recomputeXPTotal();
    onCountersChanged();

    if (merged.terminalEvent) {
      onTerminalProblemChanged(problemId, merged);
    }
  }

  async function markLessonLearnedSafe(lessonId) {
    if (!progressUser) return null;

    return enqueueProgressMutation(`lesson:${lessonId}`, async () => {
      try {
        const row = await markLessonLearned(supabase, lessonId);
        if (row?.learned) {
          learnedSet.add(lessonId);
          onCountersChanged();
          onLessonChanged(lessonId, row);
        }
        return row;
      } catch (error) {
        reconcileMutationError("markLessonLearned", error);
        return null;
      }
    });
  }

  async function recordProblemEventSafe(problemId, eventName) {
    if (!progressUser) return null;

    return enqueueProgressMutation(`problem:${problemId}`, async () => {
      try {
        const row = await recordProblemEvent(supabase, problemId, eventName);
        applyCanonicalProblemProgress(problemId, row, eventName);
        return row;
      } catch (error) {
        reconcileMutationError("recordProblemEvent", error);
        return null;
      }
    });
  }

  async function recordExamAttemptStart(examId) {
    if (!progressUser) return null;

    return enqueueProgressMutation(`exam:${examId}`, async () => {
      try {
        return await startExamAttempt(supabase, examId);
      } catch (error) {
        reconcileMutationError("startExamAttempt", error);
        return null;
      }
    });
  }

  async function updateExamAttemptScore(examId, score) {
    if (!progressUser) return null;

    return enqueueProgressMutation(`exam:${examId}`, async () => {
      try {
        const row = await finishExamAttempt(supabase, examId, score);
        if (row?.passed) examsPassedSet.add(examId);
        onCountersChanged();
        return row;
      } catch (error) {
        reconcileMutationError("finishExamAttempt", error);
        return null;
      }
    });
  }

  async function saveExamAttemptResultSafe(examId, score) {
    return updateExamAttemptScore(examId, score);
  }

  async function getProgressUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user ?? null;
  }

  async function loadAppProgressFromDb(userOverride = undefined) {
    const currentEpoch = ++loadEpoch;
    let resolvedUser = null;

    try {
      resolvedUser = userOverride === undefined
        ? await getProgressUser()
        : userOverride;

      if (currentEpoch !== loadEpoch) return;

      authUser = resolvedUser;
      progressUser = resolvedUser;
      resetProgressState();

      if (!resolvedUser) {
        onFullRefresh();
        return;
      }

      // Reveal authenticated UI immediately; counters can hydrate afterwards.
      onFullRefresh();

      const userId = resolvedUser.id;
      const [lessonResult, problemResult, examResult] = await Promise.all([
        supabase
          .from("user_lesson_progress")
          .select("*")
          .eq("user_id", userId),
        supabase
          .from("user_problem_progress")
          .select("*")
          .eq("user_id", userId),
        supabase
          .from("user_exam_progress")
          .select("*")
          .eq("user_id", userId)
      ]);

      if (currentEpoch !== loadEpoch) return;

      const progressErrors = [
        ["lessons", lessonResult.error],
        ["problems", problemResult.error],
        ["exams", examResult.error]
      ].filter(([, error]) => Boolean(error));

      for (const [section, error] of progressErrors) {
        console.warn(`Could not load ${section} progress; continuing with empty data:`, error);
      }

      const lessonRows = lessonResult.error ? [] : (lessonResult.data || []);
      const problemRows = problemResult.error ? [] : (problemResult.data || []);
      const examRows = examResult.error ? [] : (examResult.data || []);

      lessonRows.forEach((row) => {
        if (row.learned) learnedSet.add(row.lesson_id);
      });

      problemRows.forEach((row) => {
        const hintsUsed = Number(row.hints_used ?? row.hints ?? 0);
        const wrongAttempts = Number(row.wrong_attempts ?? row.attempts ?? 0);

        XP_DETAILS[row.problem_id] = {
          xp: Number(row.xp_earned || 0),
          wrong: wrongAttempts,
          hints: hintsUsed,
          solved: Boolean(row.solved),
          usedHint1: Boolean(row.used_hint1 ?? (hintsUsed >= 1)),
          usedHint2: Boolean(row.used_hint2 ?? (hintsUsed >= 2))
        };

        if (row.solved) solvedSet.add(row.problem_id);
      });

      recomputeXPTotal();

      examRows.forEach((row) => {
        if (row.passed) examsPassedSet.add(row.exam_id);
      });

      onFullRefresh();
    } catch (error) {
      if (currentEpoch !== loadEpoch) return;

      console.error("Eroare la load progress din DB; catalogul rămâne disponibil:", error);

      authUser = resolvedUser || null;
      progressUser = resolvedUser || null;
      resetProgressState();
      onFullRefresh();
    }
  }

  return {
    awardXPForProblem,
    getXPRecord,
    loadAppProgressFromDb,
    markLessonLearnedSafe,
    recomputeXPTotal,
    recordExamAttemptStart,
    recordProblemEventSafe,
    saveExamAttemptResultSafe,
    updateExamAttemptScore,
    get authUser() {
      return authUser;
    },
    get progressUser() {
      return progressUser;
    },
    get pendingMutations() {
      return progressMutationQueue.pendingCount;
    }
  };
}
