const VALID_STATUSES = new Set([
  "draft",
  "in_review",
  "changes_requested",
  "verified",
  "archived"
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : fallback;
}

function asBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function safeStatus(value) {
  const status = String(value || "draft").trim().toLowerCase();
  return VALID_STATUSES.has(status) ? status : "draft";
}

export function emptyContentQualityDashboard() {
  return {
    summary: {
      total: 0,
      verified: 0,
      in_review: 0,
      changes_requested: 0,
      draft: 0,
      archived: 0,
      automated_ready: 0,
      eligible_for_publish: 0,
      blocked: 0
    },
    items: [],
    generated_at: null,
    schema_version: "content-quality-v1"
  };
}

export function normalizeQualityItem(value) {
  const automatedChecks = value?.automated_checks && typeof value.automated_checks === "object"
    ? value.automated_checks
    : {};
  const sourceUrls = asArray(value?.source_urls)
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
  const blockingIssues = asArray(value?.blocking_issues)
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);

  return {
    content_type: String(value?.content_type || "lesson").trim().toLowerCase(),
    content_id: String(value?.content_id || value?.id || "").trim(),
    title_ro: String(value?.title_ro || "").trim(),
    title_en: String(value?.title_en || "").trim(),
    status: safeStatus(value?.status),
    bilingual_checked: asBoolean(value?.bilingual_checked),
    math_checked: asBoolean(value?.math_checked),
    source_checked: asBoolean(value?.source_checked),
    reviewer_notes: String(value?.reviewer_notes || ""),
    source_urls: sourceUrls,
    review_version: Math.max(1, asInteger(value?.review_version, 1)),
    reviewed_by: value?.reviewed_by || null,
    reviewed_at: value?.reviewed_at || null,
    updated_at: value?.updated_at || null,
    automated_checks: automatedChecks,
    automated_ready: asBoolean(value?.automated_ready),
    eligible_for_publish: asBoolean(value?.eligible_for_publish),
    blocking_issues: blockingIssues,
    completeness_score: Math.max(0, Math.min(100, Number(value?.completeness_score || 0)))
  };
}

export function normalizeContentQualityDashboard(value) {
  const fallback = emptyContentQualityDashboard();
  const summary = value?.summary && typeof value.summary === "object" ? value.summary : {};
  const items = asArray(value?.items).map(normalizeQualityItem).filter((item) => item.content_id);

  return {
    summary: {
      total: asInteger(summary.total, items.length),
      verified: asInteger(summary.verified),
      in_review: asInteger(summary.in_review),
      changes_requested: asInteger(summary.changes_requested),
      draft: asInteger(summary.draft),
      archived: asInteger(summary.archived),
      automated_ready: asInteger(summary.automated_ready),
      eligible_for_publish: asInteger(summary.eligible_for_publish),
      blocked: asInteger(summary.blocked)
    },
    items,
    generated_at: value?.generated_at || fallback.generated_at,
    schema_version: String(value?.schema_version || fallback.schema_version)
  };
}

export function qualityStatusLabel(status, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  const labels = english
    ? {
        draft: "Draft",
        in_review: "In review",
        changes_requested: "Changes requested",
        verified: "Verified",
        archived: "Archived"
      }
    : {
        draft: "Draft",
        in_review: "În review",
        changes_requested: "Necesită modificări",
        verified: "Verificat",
        archived: "Arhivat"
      };
  return labels[safeStatus(status)] || labels.draft;
}

export function qualityContentTypeLabel(type, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  const labels = english
    ? { lesson: "Lesson", problem: "Problem", exam: "Exam" }
    : { lesson: "Lecție", problem: "Problemă", exam: "Examen" };
  return labels[String(type || "").toLowerCase()] || String(type || "");
}

export function qualityItemTitle(item, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  return english
    ? (item?.title_en || item?.title_ro || item?.content_id || "")
    : (item?.title_ro || item?.title_en || item?.content_id || "");
}

export function filterQualityItems(items, {
  query = "",
  status = "all",
  contentType = "all"
} = {}) {
  const normalizedQuery = String(query || "").trim().toLocaleLowerCase("ro");
  const normalizedStatus = String(status || "all").trim().toLowerCase();
  const normalizedType = String(contentType || "all").trim().toLowerCase();

  return asArray(items).filter((item) => {
    if (normalizedStatus !== "all" && item.status !== normalizedStatus) return false;
    if (normalizedType !== "all" && item.content_type !== normalizedType) return false;
    if (!normalizedQuery) return true;
    const haystack = [
      item.content_id,
      item.title_ro,
      item.title_en,
      item.status,
      item.content_type,
      ...item.blocking_issues
    ].join(" ").toLocaleLowerCase("ro");
    return haystack.includes(normalizedQuery);
  });
}

export function qualityChecklist(item, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  const checks = item?.automated_checks || {};
  const rows = [
    ["title_ro", english ? "Romanian title" : "Titlu în română"],
    ["title_en", english ? "English title" : "Titlu în engleză"],
    ["core_ro", english ? "Romanian core content" : "Conținut principal în română"],
    ["core_en", english ? "English core content" : "Conținut principal în engleză"],
    ["source_present", english ? "Source or credit" : "Sursă sau credit"]
  ];
  if (item?.content_type === "problem") {
    rows.push(["answer_present", english ? "Canonical answer" : "Răspuns canonic"]);
    rows.push(["solution_ro", english ? "Romanian solution" : "Soluție în română"]);
    rows.push(["solution_en", english ? "English solution" : "Soluție în engleză"]);
  }
  if (item?.content_type === "exam") {
    rows.push(["items_present", english ? "Exam items" : "Itemi de examen"]);
  }
  return rows.map(([key, label]) => ({ key, label, passed: asBoolean(checks[key]) }));
}

export function qualityIssueLabel(code, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  const labels = english
    ? {
        missing_title_ro: "Romanian title is missing.",
        missing_title_en: "English title is missing.",
        missing_core_ro: "Romanian core content is missing.",
        missing_core_en: "English core content is missing.",
        missing_source: "A source or credit is required.",
        missing_answer: "The canonical answer is missing.",
        missing_solution_ro: "The Romanian solution is missing.",
        missing_solution_en: "The English solution is missing.",
        missing_items: "The exam has no items."
      }
    : {
        missing_title_ro: "Lipsește titlul în română.",
        missing_title_en: "Lipsește titlul în engleză.",
        missing_core_ro: "Lipsește conținutul principal în română.",
        missing_core_en: "Lipsește conținutul principal în engleză.",
        missing_source: "Este necesară o sursă sau un credit.",
        missing_answer: "Lipsește răspunsul canonic.",
        missing_solution_ro: "Lipsește soluția în română.",
        missing_solution_en: "Lipsește soluția în engleză.",
        missing_items: "Examenul nu are itemi."
      };
  return labels[String(code || "")] || String(code || "");
}

export function contentQualityPayload(item, formValues = {}) {
  return {
    status: safeStatus(formValues.status ?? item?.status),
    bilingual_checked: asBoolean(formValues.bilingual_checked),
    math_checked: asBoolean(formValues.math_checked),
    source_checked: asBoolean(formValues.source_checked),
    reviewer_notes: String(formValues.reviewer_notes || "").trim(),
    source_urls: asArray(formValues.source_urls)
      .map((entry) => String(entry || "").trim())
      .filter(Boolean)
  };
}
