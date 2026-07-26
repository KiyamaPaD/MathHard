function cleanId(value, label = "id") {
  const id = String(value ?? "").trim();
  if (!id || id.length > 200) throw new TypeError(`Invalid ${label}.`);
  return id;
}

function cleanLocale(value) {
  return String(value || "ro").toLowerCase().startsWith("en") ? "en" : "ro";
}

function cleanMode(value) {
  const mode = String(value || "simple").toLowerCase();
  return new Set(["academic", "simple", "boss"]).has(mode) ? mode : "simple";
}

function firstPayload(data) {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

async function callRpc(supabase, name, args) {
  if (!supabase?.rpc) throw new TypeError("A Supabase client is required.");
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return firstPayload(data);
}

export async function loadProblemWorkspace(supabase, problemId, locale = "ro") {
  return callRpc(supabase, "mh_get_problem_workspace", {
    p_problem_id: cleanId(problemId, "problem id"),
    p_locale: cleanLocale(locale)
  });
}

export async function saveContentWorkspace(supabase, {
  contentType,
  contentId,
  bookmarked,
  note,
  explanationMode
}) {
  const type = String(contentType || "").toLowerCase();
  if (!new Set(["lesson", "problem"]).has(type)) {
    throw new TypeError("Invalid content type.");
  }

  const safeNote = note == null ? null : String(note).slice(0, 10000);
  return callRpc(supabase, "mh_save_content_workspace", {
    p_content_type: type,
    p_content_id: cleanId(contentId, "content id"),
    p_bookmarked: bookmarked == null ? null : Boolean(bookmarked),
    p_note: safeNote,
    p_explanation_mode: explanationMode == null ? null : cleanMode(explanationMode)
  });
}

export function normalizeProblemWorkspace(payload = {}) {
  const attempts = Array.isArray(payload?.attempts) ? payload.attempts : [];
  return {
    bookmarked: Boolean(payload?.bookmarked),
    note: String(payload?.note || ""),
    explanationMode: cleanMode(payload?.explanation_mode),
    canViewSolution: Boolean(payload?.can_view_solution),
    solution: payload?.solution && typeof payload.solution === "object" ? payload.solution : null,
    attempts: attempts.map((row) => ({
      id: row?.id ?? null,
      answer: String(row?.answer || ""),
      correct: Boolean(row?.correct),
      verificationMode: String(row?.verification_mode || "unknown"),
      createdAt: String(row?.created_at || "")
    }))
  };
}
