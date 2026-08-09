const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{1,199}$/;
const TEMPLATE_PLACEHOLDER_PATTERN = /\[\[[^\[\]]+\]\]/;

function textPresent(value) {
  const text = String(value ?? "").trim();
  return text.length > 0 && !TEMPLATE_PLACEHOLDER_PATTERN.test(text);
}

function listPresent(value) {
  if (Array.isArray(value)) return value.some((entry) => textPresent(entry));
  return textPresent(value);
}

function normalizeType(value) {
  const type = String(value || "lesson").trim().toLowerCase();
  return ["lesson", "research", "history", "problem", "exam"].includes(type)
    ? type
    : "lesson";
}

function makeCheck(id, passed, ro, en, { required = true, detailRo = "", detailEn = "" } = {}) {
  return {
    id,
    passed: Boolean(passed),
    required: Boolean(required),
    label: { ro, en },
    detail: { ro: detailRo, en: detailEn }
  };
}

function commonChecks(payload) {
  return [
    makeCheck(
      "valid_id",
      ID_PATTERN.test(String(payload?.id || "").trim()),
      "ID valid",
      "Valid ID",
      { detailRo: "Litere, cifre, _ sau -; unicitatea este verificată la salvare.", detailEn: "Letters, numbers, _ or -; uniqueness is checked when saving." }
    )
  ];
}

function lessonChecks(type, payload) {
  const chapterIsImplicit = type === "research" || type === "history";
  return [
    ...commonChecks(payload),
    makeCheck("title_ro", textPresent(payload?.title_ro), "Titlu în română", "Romanian title"),
    makeCheck("title_en", textPresent(payload?.title_en), "Titlu în engleză", "English title"),
    makeCheck("body_ro", textPresent(payload?.body_ro), "Conținut principal în română", "Romanian main content"),
    makeCheck("body_en", textPresent(payload?.body_en), "Conținut principal în engleză", "English main content"),
    makeCheck("source", listPresent(payload?.sources), "Cel puțin o sursă", "At least one source"),
    makeCheck("grade", textPresent(payload?.grade), "Nivel sau clasă completată", "Grade or level completed", { required: false }),
    makeCheck("chapter", chapterIsImplicit || textPresent(payload?.chapter), "Capitol completat", "Chapter completed", { required: false }),
    makeCheck("learn_ro", textPresent(payload?.learn_ro), "Obiective de învățare în română", "Romanian learning goals", { required: false }),
    makeCheck("learn_en", textPresent(payload?.learn_en), "Obiective de învățare în engleză", "English learning goals", { required: false }),
    makeCheck("why_ro", textPresent(payload?.why_ro), "Utilitatea lecției în română", "Romanian lesson purpose", { required: false }),
    makeCheck("why_en", textPresent(payload?.why_en), "Utilitatea lecției în engleză", "English lesson purpose", { required: false }),
    makeCheck("examples_ro", textPresent(payload?.examples_ro), "Exemple în română", "Romanian examples", { required: false }),
    makeCheck("examples_en", textPresent(payload?.examples_en), "Exemple în engleză", "English examples", { required: false }),
    makeCheck("concepts", listPresent(payload?.concept_ids), "Concepte asociate", "Linked concepts", { required: false })
  ];
}

function problemChecks(payload) {
  const difficulty = Number(payload?.difficulty);
  return [
    ...commonChecks(payload),
    makeCheck("lesson_id", textPresent(payload?.lesson_id), "Lecție asociată", "Linked lesson"),
    makeCheck("title_ro", textPresent(payload?.title_ro), "Titlu în română", "Romanian title"),
    makeCheck("title_en", textPresent(payload?.title_en), "Titlu în engleză", "English title"),
    makeCheck("statement_ro", textPresent(payload?.statement_ro), "Enunț în română", "Romanian statement"),
    makeCheck("statement_en", textPresent(payload?.statement_en), "Enunț în engleză", "English statement"),
    makeCheck("answer", textPresent(payload?.answer), "Răspuns canonic", "Canonical answer"),
    makeCheck("source", textPresent(payload?.source), "Sursă declarată", "Declared source"),
    makeCheck("solution_ro", textPresent(payload?.solution_ro), "Soluție academică în română", "Romanian academic solution"),
    makeCheck("solution_en", textPresent(payload?.solution_en), "Soluție academică în engleză", "English academic solution"),
    makeCheck("difficulty", Number.isFinite(difficulty) && difficulty >= 0 && difficulty <= 5, "Dificultate între 0 și 5", "Difficulty between 0 and 5", { required: false }),
    makeCheck("simple_ro", textPresent(payload?.explanation_simple_ro), "Explicație simplă în română", "Romanian simple explanation", { required: false }),
    makeCheck("simple_en", textPresent(payload?.explanation_simple_en), "Explicație simplă în engleză", "English simple explanation", { required: false }),
    makeCheck("intuitive_ro", textPresent(payload?.explanation_boss_ro), "Explicație intuitivă în română", "Romanian intuitive explanation", { required: false }),
    makeCheck("intuitive_en", textPresent(payload?.explanation_boss_en), "Explicație intuitivă în engleză", "English intuitive explanation", { required: false }),
    makeCheck("concepts", listPresent(payload?.concept_ids), "Concepte asociate", "Linked concepts", { required: false })
  ];
}

function examChecks(payload, examErrors = [], examIndependence = null) {
  const hasItems = Array.isArray(payload?.items) && payload.items.length > 0;
  const hasProblems = Array.isArray(payload?.problems) && payload.problems.some((id) => textPresent(id));
  const year = Number(payload?.year);
  const hours = Number(payload?.default_hours);
  const structuralErrors = Array.isArray(examErrors)
    ? examErrors.filter((error) => /^Item\s+\d+/i.test(String(error || "").trim()))
    : [];

  return [
    ...commonChecks(payload),
    makeCheck("exam_type", textPresent(payload?.type), "Tip de examen", "Exam type"),
    makeCheck("year", Number.isInteger(year) && year > 0, "An valid", "Valid year"),
    makeCheck("title_ro", textPresent(payload?.title_ro), "Titlu în română", "Romanian title"),
    makeCheck("title_en", textPresent(payload?.title_en), "Titlu în engleză", "English title"),
    makeCheck("duration", Number.isFinite(hours) && hours > 0, "Durată pozitivă", "Positive duration"),
    makeCheck("items", hasItems || hasProblems, "Cel puțin un item sau o problemă", "At least one item or problem"),
    makeCheck("structure", structuralErrors.length === 0, "Structură validă a itemilor", "Valid item structure", {
      detailRo: structuralErrors[0] || "",
      detailEn: structuralErrors[0] || ""
    }),
    makeCheck("independent_exam_bank", !examIndependence || examIndependence.blockingIssues?.length === 0, "Bancă de examen independentă", "Independent exam bank", {
      detailRo: examIndependence?.blockingIssues?.length ? "Există un duplicat sau o legătură legacy cu banca de Probleme." : "Itemii nu reutilizează problemele de practică.",
      detailEn: examIndependence?.blockingIssues?.length ? "A duplicate or legacy practice-bank link exists." : "Exam items do not reuse practice problems."
    }),
    makeCheck("source", textPresent(payload?.credit_html), "Credit sau sursă", "Credit or source"),
    makeCheck("scoring", textPresent(payload?.scoring_profile), "Regulă de punctare selectată", "Scoring rule selected", { required: false })
  ];
}

export function evaluateContentDraft({ type = "lesson", payload = {}, examErrors = [], examIndependence = null } = {}) {
  const normalizedType = normalizeType(type);
  const checks = normalizedType === "problem"
    ? problemChecks(payload)
    : normalizedType === "exam"
      ? examChecks(payload, examErrors, examIndependence)
      : lessonChecks(normalizedType, payload);

  const required = checks.filter((check) => check.required);
  const recommendations = checks.filter((check) => !check.required);
  const passedRequired = required.filter((check) => check.passed).length;
  const blockers = required.filter((check) => !check.passed);
  const pendingRecommendations = recommendations.filter((check) => !check.passed);
  const score = required.length ? Math.round((passedRequired / required.length) * 100) : 0;

  return {
    type: normalizedType,
    score,
    readyForReview: blockers.length === 0,
    checks,
    required,
    recommendations,
    blockers,
    pendingRecommendations,
    counts: {
      required: required.length,
      passedRequired,
      blockers: blockers.length,
      recommendations: recommendations.length,
      pendingRecommendations: pendingRecommendations.length
    }
  };
}

export function draftStatusLabel(result, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  if (result?.readyForReview) return english ? "Ready for review" : "Gata pentru verificare";
  if (Number(result?.score || 0) >= 60) return english ? "Draft in progress" : "Draft în lucru";
  return english ? "Incomplete draft" : "Draft incomplet";
}

export function contentTypeLabel(type, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  const normalized = normalizeType(type);
  const labels = {
    lesson: ["Lecție", "Lesson"],
    research: ["Cercetare", "Research"],
    history: ["Istorie", "History"],
    problem: ["Problemă", "Problem"],
    exam: ["Examen", "Exam"]
  };
  return labels[normalized][english ? 1 : 0];
}

export function localizedCheckText(check, language = "ro") {
  const key = String(language || "ro").toLowerCase().startsWith("en") ? "en" : "ro";
  return {
    label: check?.label?.[key] || check?.label?.ro || "",
    detail: check?.detail?.[key] || check?.detail?.ro || ""
  };
}

export { ID_PATTERN, TEMPLATE_PLACEHOLDER_PATTERN };
