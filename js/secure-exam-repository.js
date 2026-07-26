function cleanId(value, label) {
  const id = String(value || "").trim();
  if (!id || id.length > 200) throw new TypeError(`Invalid ${label}.`);
  return id;
}

function unwrapRpcData(data) {
  if (Array.isArray(data) && data.length === 1) return data[0];
  return data ?? null;
}

async function callRpc(supabase, name, args) {
  if (!supabase?.rpc) throw new Error("Supabase client is required.");
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return unwrapRpcData(data);
}

export async function startSecureExamAttempt(
  supabase,
  examId,
  hours = 2,
  locale = "ro"
) {
  const safeHours = Math.max(1, Math.min(5, Number(hours) || 2));
  return callRpc(supabase, "mh_start_secure_exam_attempt", {
    p_exam_id: cleanId(examId, "exam id"),
    p_hours: safeHours,
    p_locale: String(locale || "ro")
  });
}

export async function getActiveSecureExamAttempt(
  supabase,
  examId = null,
  locale = "ro"
) {
  return callRpc(supabase, "mh_get_active_exam_attempt", {
    p_exam_id: examId ? cleanId(examId, "exam id") : null,
    p_locale: String(locale || "ro")
  });
}

export async function saveSecureExamAnswer(
  supabase,
  attemptId,
  itemId,
  answer
) {
  const payload = answer && typeof answer === "object" ? answer : {};
  return callRpc(supabase, "mh_save_secure_exam_answer", {
    p_attempt_id: cleanId(attemptId, "attempt id"),
    p_item_id: cleanId(itemId, "item id"),
    p_answer: payload
  });
}

export async function submitSecureExamAttempt(supabase, attemptId) {
  return callRpc(supabase, "mh_submit_secure_exam_attempt", {
    p_attempt_id: cleanId(attemptId, "attempt id")
  });
}

export async function cancelSecureExamAttempt(supabase, attemptId) {
  return callRpc(supabase, "mh_cancel_secure_exam_attempt", {
    p_attempt_id: cleanId(attemptId, "attempt id")
  });
}
