import { supabase } from "./supabase-client.js";

function firstRow(data) {
  if (Array.isArray(data)) return data[0] || null;
  return data || null;
}

async function callProgressRpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return firstRow(data);
}

export function markLessonLearned(lessonId) {
  return callProgressRpc("mh_mark_lesson_learned", {
    p_lesson_id: String(lessonId || "").trim()
  });
}

export function recordProblemEvent(problemId, eventName) {
  return callProgressRpc("mh_record_problem_event", {
    p_problem_id: String(problemId || "").trim(),
    p_event: String(eventName || "").trim()
  });
}

export function startExamAttempt(examId) {
  return callProgressRpc("mh_start_exam_attempt", {
    p_exam_id: String(examId || "").trim()
  });
}

export function finishExamAttempt(examId, score, passedNow = false) {
  const safeScore = Number(score);

  return callProgressRpc("mh_finish_exam_attempt", {
    p_exam_id: String(examId || "").trim(),
    p_score: Number.isFinite(safeScore) ? safeScore : 0,
    p_passed: !!passedNow
  });
}
