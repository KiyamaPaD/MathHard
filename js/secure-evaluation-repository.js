function cleanId(value, label) {
  const id = String(value || "").trim();
  if (!id || id.length > 200) {
    throw new TypeError(`Invalid ${label}.`);
  }
  return id;
}

function cleanLocale(value) {
  return String(value || "ro").toLowerCase().startsWith("en") ? "en" : "ro";
}

function firstPayload(data) {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

async function callSecureRpc(supabase, name, args) {
  if (!supabase?.rpc) {
    throw new TypeError("A Supabase client is required for secure evaluation.");
  }

  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return firstPayload(data);
}

export async function submitProblemAnswer(
  supabase,
  problemId,
  answer,
  locale = "ro"
) {
  const id = cleanId(problemId, "problem id");
  const submittedAnswer = String(answer ?? "").trim();

  if (!submittedAnswer || submittedAnswer.length > 500) {
    throw new TypeError("Invalid submitted answer.");
  }

  return callSecureRpc(supabase, "mh_submit_problem_answer", {
    p_problem_id: id,
    p_answer: submittedAnswer,
    p_locale: cleanLocale(locale)
  });
}

export async function requestProblemHint(
  supabase,
  problemId,
  hintNumber,
  locale = "ro"
) {
  const id = cleanId(problemId, "problem id");
  const number = Number(hintNumber);

  if (number !== 1 && number !== 2) {
    throw new TypeError("Invalid hint number.");
  }

  return callSecureRpc(supabase, "mh_get_problem_hint", {
    p_problem_id: id,
    p_hint_number: number,
    p_locale: cleanLocale(locale)
  });
}

export async function revealProblemAnswer(
  supabase,
  problemId,
  locale = "ro"
) {
  const id = cleanId(problemId, "problem id");

  return callSecureRpc(supabase, "mh_reveal_problem_answer", {
    p_problem_id: id,
    p_locale: cleanLocale(locale)
  });
}

export async function logLearningEvent(
  supabase,
  eventType,
  contentType,
  contentId,
  metadata = {}
) {
  const event = String(eventType || "").trim();
  const type = String(contentType || "").trim();
  const id = cleanId(contentId, "content id");

  if (!new Set(["lesson_opened", "problem_opened", "exam_opened"]).has(event)) {
    throw new TypeError("Invalid learning event type.");
  }

  if (!new Set(["lesson", "problem", "exam"]).has(type)) {
    throw new TypeError("Invalid learning content type.");
  }

  return callSecureRpc(supabase, "mh_log_learning_event", {
    p_event_type: event,
    p_content_type: type,
    p_content_id: id,
    p_metadata: metadata && typeof metadata === "object" ? metadata : {}
  });
}
