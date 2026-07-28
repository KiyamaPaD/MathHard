const MISSING_RPC_CODES = new Set(["PGRST202", "42883"]);

function firstRow(data) {
  if (Array.isArray(data)) return data[0] || null;
  return data || null;
}

function cleanLessonId(value) {
  const id = String(value || "").trim();
  if (!id || id.length > 200) throw new TypeError("Invalid lesson id.");
  return id;
}

function isMissingRpcError(error) {
  if (!error) return false;
  if (MISSING_RPC_CODES.has(String(error.code || ""))) return true;
  const message = String(error.message || error.details || "").toLowerCase();
  return message.includes("could not find the function") ||
    (message.includes("function public.mh_") && message.includes("does not exist"));
}

async function callLessonRpc(supabase, name, args) {
  let result = await supabase.rpc(name, args);

  if (result.error && isMissingRpcError(result.error)) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    result = await supabase.rpc(name, args);
  }

  if (result.error) throw result.error;
  return firstRow(result.data);
}

export async function startLessonReading(supabase, lessonId) {
  return callLessonRpc(supabase, "mh_start_lesson_reading", {
    p_lesson_id: cleanLessonId(lessonId)
  });
}

export async function markLessonRead(supabase, lessonId, sessionId) {
  const safeSessionId = String(sessionId || "").trim();
  if (!safeSessionId) throw new TypeError("Missing lesson reading session.");

  return callLessonRpc(supabase, "mh_mark_lesson_read", {
    p_lesson_id: cleanLessonId(lessonId),
    p_session_id: safeSessionId
  });
}

export async function completeLessonQuiz(supabase, lessonId) {
  return callLessonRpc(supabase, "mh_complete_lesson_quiz", {
    p_lesson_id: cleanLessonId(lessonId)
  });
}
