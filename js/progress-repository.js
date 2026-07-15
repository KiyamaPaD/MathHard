const MISSING_RPC_CODES = new Set(["PGRST202", "42883"]);
let warnedAboutLegacyFallback = false;

function firstRow(data) {
  if (Array.isArray(data)) return data[0] || null;
  return data || null;
}

function cleanId(value, label) {
  const id = String(value || "").trim();
  if (!id || id.length > 200) {
    throw new TypeError(`Invalid ${label}.`);
  }
  return id;
}

function isMissingRpcError(error) {
  if (!error) return false;
  if (MISSING_RPC_CODES.has(String(error.code || ""))) return true;

  const message = String(error.message || error.details || "").toLowerCase();
  return message.includes("could not find the function") ||
    message.includes("function public.mh_") && message.includes("does not exist");
}

function warnLegacyFallback() {
  if (warnedAboutLegacyFallback) return;
  warnedAboutLegacyFallback = true;
  console.warn(
    "MathHard secure progress RPCs are not installed yet. " +
    "Using the temporary legacy progress fallback until the consolidated SQL is applied."
  );
}

async function getAuthenticatedUser(supabase) {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error("Authentication required.");
  return data.user;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callRpcOrFallback(supabase, name, args, fallback) {
  let result = await supabase.rpc(name, args);
  if (!result.error) return firstRow(result.data);
  if (!isMissingRpcError(result.error)) throw result.error;

  // PostgREST can briefly keep an older schema cache immediately after SQL
  // migrations. Retry once before using the legacy compatibility path.
  await wait(700);
  result = await supabase.rpc(name, args);
  if (!result.error) return firstRow(result.data);
  if (!isMissingRpcError(result.error)) throw result.error;

  warnLegacyFallback();
  return fallback();
}

async function legacyMarkLessonLearned(supabase, lessonId) {
  const user = await getAuthenticatedUser(supabase);
  const now = new Date().toISOString();
  const payload = {
    user_id: user.id,
    lesson_id: lessonId,
    learned: true,
    learned_at: now,
    updated_at: now
  };

  const { data, error } = await supabase
    .from("user_lesson_progress")
    .upsert(payload, { onConflict: "user_id,lesson_id" })
    .select("lesson_id, learned, learned_at")
    .single();

  if (error) throw error;
  return data;
}

function emptyProblemRow(problemId) {
  return {
    problem_id: problemId,
    solved: false,
    wrong_attempts: 0,
    hints_used: 0,
    used_hint1: false,
    used_hint2: false,
    revealed_answer: false,
    xp_earned: 0,
    solved_at: null
  };
}

async function legacyRecordProblemEvent(supabase, problemId, eventName) {
  const user = await getAuthenticatedUser(supabase);
  const { data: existing, error: readError } = await supabase
    .from("user_problem_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("problem_id", problemId)
    .maybeSingle();

  if (readError) throw readError;

  const row = { ...emptyProblemRow(problemId), ...(existing || {}) };
  const solved = !!row.solved;

  if (eventName === "wrong" && !solved) {
    row.wrong_attempts = Math.min(1000, Number(row.wrong_attempts || 0) + 1);
  } else if (eventName === "hint1" && !solved && !row.used_hint1) {
    row.used_hint1 = true;
    row.hints_used = Math.min(2, Number(row.hints_used || 0) + 1);
  } else if (eventName === "hint2" && !solved && !row.used_hint2) {
    row.used_hint2 = true;
    row.hints_used = Math.min(2, Number(row.hints_used || 0) + 1);
  } else if (eventName === "reveal") {
    row.revealed_answer = true;
  } else if ((eventName === "solved" || eventName === "solved_no_xp") && !solved) {
    row.solved = true;
    row.xp_earned = eventName === "solved_no_xp"
      ? 0
      : Math.max(0, Math.min(10,
          10 - Number(row.wrong_attempts || 0) - Number(row.hints_used || 0)
        ));
    row.solved_at = new Date().toISOString();
  }

  const now = new Date().toISOString();
  const payload = {
    user_id: user.id,
    ...row,
    updated_at: now
  };

  const { data, error } = await supabase
    .from("user_problem_progress")
    .upsert(payload, { onConflict: "user_id,problem_id" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

async function legacyStartExamAttempt(supabase, examId) {
  const user = await getAuthenticatedUser(supabase);
  const { data: existing, error: readError } = await supabase
    .from("user_exam_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("exam_id", examId)
    .maybeSingle();

  if (readError) throw readError;

  const now = new Date().toISOString();
  const payload = {
    user_id: user.id,
    exam_id: examId,
    attempts_count: Math.min(100000, Number(existing?.attempts_count || 0) + 1),
    best_score: Number(existing?.best_score || 0),
    last_score: Number(existing?.last_score || 0),
    passed: !!existing?.passed,
    passed_at: existing?.passed_at || null,
    started_at: now,
    updated_at: now
  };

  const { data, error } = await supabase
    .from("user_exam_progress")
    .upsert(payload, { onConflict: "user_id,exam_id" })
    .select("exam_id, attempts_count, best_score, last_score, passed, started_at, passed_at")
    .single();

  if (error) throw error;
  return data;
}

async function legacyFinishExamAttempt(supabase, examId, score) {
  const user = await getAuthenticatedUser(supabase);
  const safeScore = Math.max(0, Math.min(100000, Number(score) || 0));
  const { data: existing, error: readError } = await supabase
    .from("user_exam_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("exam_id", examId)
    .maybeSingle();

  if (readError) throw readError;

  const now = new Date().toISOString();
  const passed = !!existing?.passed || safeScore >= 60;
  const payload = {
    user_id: user.id,
    exam_id: examId,
    attempts_count: Number(existing?.attempts_count || 0),
    best_score: Math.max(Number(existing?.best_score || 0), safeScore),
    last_score: safeScore,
    passed,
    started_at: existing?.started_at || now,
    passed_at: existing?.passed_at || (passed ? now : null),
    updated_at: now
  };

  const { data, error } = await supabase
    .from("user_exam_progress")
    .upsert(payload, { onConflict: "user_id,exam_id" })
    .select("exam_id, attempts_count, best_score, last_score, passed, started_at, passed_at")
    .single();

  if (error) throw error;
  return data;
}

export async function markLessonLearned(supabase, lessonId) {
  const id = cleanId(lessonId, "lesson id");
  return callRpcOrFallback(
    supabase,
    "mh_mark_lesson_learned",
    { p_lesson_id: id },
    () => legacyMarkLessonLearned(supabase, id)
  );
}

export async function recordProblemEvent(supabase, problemId, eventName) {
  const id = cleanId(problemId, "problem id");
  const event = String(eventName || "").trim().toLowerCase();
  const allowed = new Set(["wrong", "hint1", "hint2", "reveal", "solved", "solved_no_xp"]);
  if (!allowed.has(event)) throw new TypeError("Invalid problem event.");

  return callRpcOrFallback(
    supabase,
    "mh_record_problem_event",
    { p_problem_id: id, p_event: event },
    () => legacyRecordProblemEvent(supabase, id, event)
  );
}

export async function startExamAttempt(supabase, examId) {
  const id = cleanId(examId, "exam id");
  return callRpcOrFallback(
    supabase,
    "mh_start_exam_attempt",
    { p_exam_id: id },
    () => legacyStartExamAttempt(supabase, id)
  );
}

export async function finishExamAttempt(supabase, examId, score) {
  const id = cleanId(examId, "exam id");
  const safeScore = Number.isFinite(Number(score)) ? Number(score) : 0;

  let canonical = await supabase.rpc("mh_finish_exam_attempt", {
    p_exam_id: id,
    p_score: safeScore
  });

  if (!canonical.error) return firstRow(canonical.data);
  if (!isMissingRpcError(canonical.error)) throw canonical.error;

  await wait(700);
  canonical = await supabase.rpc("mh_finish_exam_attempt", {
    p_exam_id: id,
    p_score: safeScore
  });

  if (!canonical.error) return firstRow(canonical.data);
  if (!isMissingRpcError(canonical.error)) throw canonical.error;

  // Compatibility with the first Phase 03 draft, which used a third boolean
  // parameter. The consolidated SQL replaces it with the canonical signature.
  const legacyRpc = await supabase.rpc("mh_finish_exam_attempt", {
    p_exam_id: id,
    p_score: safeScore,
    p_passed: safeScore >= 60
  });

  if (!legacyRpc.error) return firstRow(legacyRpc.data);
  if (!isMissingRpcError(legacyRpc.error)) throw legacyRpc.error;

  warnLegacyFallback();
  return legacyFinishExamAttempt(supabase, id, safeScore);
}
