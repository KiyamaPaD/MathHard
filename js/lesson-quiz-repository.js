import {
  buildAdminLessonQuizPayload,
  cleanLessonQuizId,
  normalizeAdminLessonQuiz,
  normalizeQuizAvailability
} from "./lesson-quiz-model.js";

const MISSING_RPC_CODES = new Set(["PGRST202", "42883"]);

function isMissingRpcError(error) {
  if (!error) return false;
  if (MISSING_RPC_CODES.has(String(error.code || ""))) return true;
  const message = String(error.message || error.details || "").toLowerCase();
  return message.includes("could not find the function") || message.includes("does not exist");
}

async function rpc(supabase, name, args = {}) {
  let result = await supabase.rpc(name, args);
  if (result.error && isMissingRpcError(result.error)) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    result = await supabase.rpc(name, args);
  }
  if (result.error) throw result.error;
  return result.data;
}

export async function loadLessonQuizAvailability(supabase) {
  const data = await rpc(supabase, "mh_get_lesson_quiz_availability");
  return normalizeQuizAvailability(data);
}

export async function startSecureLessonQuiz(supabase, lessonId, language = "ro") {
  return rpc(supabase, "mh_start_lesson_quiz", {
    p_lesson_id: cleanLessonQuizId(lessonId),
    p_language: String(language || "ro").toLowerCase().startsWith("en") ? "en" : "ro"
  });
}

export async function submitSecureLessonQuiz(supabase, attemptId, answers, language = "ro") {
  const id = String(attemptId || "").trim();
  if (!id) throw new TypeError("Missing lesson quiz attempt id.");
  return rpc(supabase, "mh_submit_lesson_quiz", {
    p_attempt_id: id,
    p_answers: Array.isArray(answers) ? answers : [],
    p_language: String(language || "ro").toLowerCase().startsWith("en") ? "en" : "ro"
  });
}

export async function adminGetLessonQuiz(supabase, lessonId) {
  const safeLessonId = cleanLessonQuizId(lessonId);
  const data = await rpc(supabase, "mh_admin_get_lesson_quiz", {
    p_lesson_id: safeLessonId
  });
  return normalizeAdminLessonQuiz(data, safeLessonId);
}

export async function adminSetLessonQuizPublished(supabase, lessonId, isPublished) {
  const safeLessonId = cleanLessonQuizId(lessonId);
  const data = await rpc(supabase, "mh_admin_set_lesson_quiz_published", {
    p_lesson_id: safeLessonId,
    p_is_published: Boolean(isPublished)
  });
  return normalizeAdminLessonQuiz(data, safeLessonId);
}

export async function adminSaveLessonQuiz(supabase, rawPayload) {
  const payload = buildAdminLessonQuizPayload(rawPayload, rawPayload?.lesson_id);

  await rpc(supabase, "mh_admin_save_lesson_quiz", { p_payload: payload });

  // Publication is persisted through a dedicated RPC. This avoids a stale or
  // partially reconstructed form payload silently keeping the quiz as draft.
  await adminSetLessonQuizPublished(supabase, payload.lesson_id, payload.is_published);

  const confirmed = await adminGetLessonQuiz(supabase, payload.lesson_id);
  if (confirmed.is_published !== payload.is_published) {
    const error = new Error(
      payload.is_published
        ? "Publicarea verificării nu a fost confirmată de Supabase."
        : "Retragerea verificării nu a fost confirmată de Supabase."
    );
    error.code = "LESSON_QUIZ_PUBLICATION_MISMATCH";
    throw error;
  }
  return confirmed;
}

export async function adminDeleteLessonQuiz(supabase, lessonId) {
  return rpc(supabase, "mh_admin_delete_lesson_quiz", {
    p_lesson_id: cleanLessonQuizId(lessonId)
  });
}
