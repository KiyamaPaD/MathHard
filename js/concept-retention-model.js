const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const text = (value, fallback = "") => String(value ?? fallback);
const array = (value) => Array.isArray(value) ? value : [];
const clampPercent = (value) => Math.max(0, Math.min(100, number(value)));
const REVIEW_STATES = new Set(["overdue", "due", "upcoming", "stable", "no_evidence"]);

function safeReviewState(value) {
  const candidate = text(value).toLowerCase();
  return REVIEW_STATES.has(candidate) ? candidate : "stable";
}

function normalizeConcept(row = {}) {
  return {
    id: text(row.id),
    slug: text(row.slug || row.id),
    conceptType: text(row.concept_type, "concept"),
    domain: text(row.domain),
    titleRo: text(row.title_ro),
    titleEn: text(row.title_en),
    mastery: clampPercent(row.mastery),
    confidence: clampPercent(row.confidence),
    retention: clampPercent(row.retention_score),
    activityCount: Math.max(0, number(row.activity_count)),
    lastActivity: text(row.last_activity),
    daysSinceActivity: Math.max(0, Math.round(number(row.days_since_activity))),
    stabilityDays: Math.max(1, Math.round(number(row.stability_days, 1))),
    reviewIntervalDays: Math.max(1, Math.round(number(row.review_interval_days, 1))),
    nextReviewAt: text(row.next_review_at),
    daysUntilReview: Math.round(number(row.days_until_review)),
    reviewState: safeReviewState(row.review_state),
    reviewPriority: clampPercent(row.review_priority),
    status: text(row.status, "building")
  };
}

export function emptyConceptRetention({ available = true, reason = "" } = {}) {
  return {
    available,
    reason: text(reason),
    generatedAt: "",
    schemaVersion: "concept-retention-v1",
    summary: {
      activeConcepts: 0,
      dueNow: 0,
      overdue: 0,
      dueSoon: 0,
      stable: 0,
      averageRetention: 0
    },
    queue: [],
    concepts: []
  };
}

export function normalizeConceptRetentionPayload(payload = {}) {
  const candidate = Array.isArray(payload) && payload.length === 1 ? payload[0] : payload;
  if (candidate?.available === false) {
    return emptyConceptRetention({ available: false, reason: candidate.reason });
  }

  const summary = candidate?.summary && typeof candidate.summary === "object"
    ? candidate.summary
    : {};

  return {
    available: true,
    reason: "",
    generatedAt: text(candidate?.generated_at),
    schemaVersion: text(candidate?.schema_version, "concept-retention-v1"),
    summary: {
      activeConcepts: Math.max(0, number(summary.active_concepts)),
      dueNow: Math.max(0, number(summary.due_now)),
      overdue: Math.max(0, number(summary.overdue)),
      dueSoon: Math.max(0, number(summary.due_soon)),
      stable: Math.max(0, number(summary.stable)),
      averageRetention: clampPercent(summary.average_retention)
    },
    queue: array(candidate?.queue).map(normalizeConcept).filter((row) => row.id),
    concepts: array(candidate?.concepts).map(normalizeConcept).filter((row) => row.id)
  };
}

export function retentionConceptTitle(concept, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  return english
    ? concept?.titleEn || concept?.titleRo || concept?.id || "—"
    : concept?.titleRo || concept?.titleEn || concept?.id || "—";
}

export function buildConceptReviewQueue(payload = {}, limit = 6) {
  const safeLimit = Math.max(1, Math.min(20, Math.round(number(limit, 6))));
  const queue = array(payload?.queue)
    .filter((concept) => concept.activityCount > 0)
    .sort((left, right) => {
      const stateRank = { overdue: 0, due: 1, upcoming: 2, stable: 3, no_evidence: 4 };
      return (stateRank[left.reviewState] ?? 4) - (stateRank[right.reviewState] ?? 4)
        || right.reviewPriority - left.reviewPriority
        || left.daysUntilReview - right.daysUntilReview
        || left.id.localeCompare(right.id);
    })
    .slice(0, safeLimit);

  return {
    queue,
    hasQueue: queue.length > 0,
    hasEvidence: array(payload?.concepts).some((concept) => concept.activityCount > 0)
  };
}
