const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const text = (value, fallback = "") => String(value ?? fallback);
const array = (value) => Array.isArray(value) ? value : [];
const clampPercent = (value) => Math.max(0, Math.min(100, number(value)));

const STATUSES = new Set(["no_evidence", "building", "proficient", "mastered"]);
const READINESS = new Set(["ready", "blocked", "in_progress", "mastered"]);

function safeStatus(value) {
  const candidate = text(value).toLowerCase();
  return STATUSES.has(candidate) ? candidate : "no_evidence";
}

function safeReadiness(value) {
  const candidate = text(value).toLowerCase();
  return READINESS.has(candidate) ? candidate : "ready";
}

export function emptyConceptMastery({ available = true, reason = "" } = {}) {
  return {
    available,
    reason: text(reason),
    generatedAt: "",
    rangeDays: 90,
    schemaVersion: "concept-mastery-v1",
    summary: {
      conceptsTotal: 0,
      activeConcepts: 0,
      masteredConcepts: 0,
      proficientConcepts: 0,
      buildingConcepts: 0,
      readyConcepts: 0,
      blockedConcepts: 0,
      recentActiveConcepts: 0,
      averageMastery: 0,
      averageConfidence: 0
    },
    concepts: [],
    domains: []
  };
}

export function normalizeConceptMasteryPayload(payload = {}) {
  const candidate = Array.isArray(payload) && payload.length === 1 ? payload[0] : payload;
  if (candidate?.available === false) {
    return emptyConceptMastery({ available: false, reason: candidate.reason });
  }

  const summary = candidate?.summary && typeof candidate.summary === "object"
    ? candidate.summary
    : {};

  return {
    available: true,
    reason: "",
    generatedAt: text(candidate?.generated_at),
    rangeDays: Math.max(7, Math.min(365, Math.round(number(candidate?.range_days, 90)))),
    schemaVersion: text(candidate?.schema_version, "concept-mastery-v1"),
    summary: {
      conceptsTotal: number(summary.concepts_total),
      activeConcepts: number(summary.active_concepts),
      masteredConcepts: number(summary.mastered_concepts),
      proficientConcepts: number(summary.proficient_concepts),
      buildingConcepts: number(summary.building_concepts),
      readyConcepts: number(summary.ready_concepts),
      blockedConcepts: number(summary.blocked_concepts),
      recentActiveConcepts: number(summary.recent_active_concepts),
      averageMastery: clampPercent(summary.average_mastery),
      averageConfidence: clampPercent(summary.average_confidence)
    },
    concepts: array(candidate?.concepts).map((concept) => ({
      id: text(concept?.id),
      slug: text(concept?.slug || concept?.id),
      conceptType: text(concept?.concept_type, "concept"),
      domain: text(concept?.domain),
      titleRo: text(concept?.title_ro),
      titleEn: text(concept?.title_en),
      summaryRo: text(concept?.summary_ro),
      summaryEn: text(concept?.summary_en),
      position: number(concept?.position),
      mastery: clampPercent(concept?.mastery),
      confidence: clampPercent(concept?.confidence),
      status: safeStatus(concept?.status),
      readiness: safeReadiness(concept?.readiness),
      activityCount: number(concept?.activity_count),
      recentEvidence: number(concept?.recent_evidence),
      lastActivity: text(concept?.last_activity),
      lessonTotal: number(concept?.lesson_total),
      lessonsCompleted: number(concept?.lessons_completed),
      problemTotal: number(concept?.problem_total),
      problemsSolved: number(concept?.problems_solved),
      problemAttempts: number(concept?.problem_attempts),
      correctAttempts: number(concept?.correct_attempts),
      incorrectAttempts: number(concept?.incorrect_attempts),
      wrongAttempts: number(concept?.wrong_attempts),
      hintsUsed: number(concept?.hints_used),
      solutionsRevealed: number(concept?.solutions_revealed),
      examTotal: number(concept?.exam_total),
      examsAttempted: number(concept?.exams_attempted),
      examsPassed: number(concept?.exams_passed),
      examAttempts: number(concept?.exam_attempts),
      lessonScore: clampPercent(concept?.lesson_score),
      problemCompletionScore: clampPercent(concept?.problem_completion_score),
      problemAccuracyScore: clampPercent(concept?.problem_accuracy_score),
      examScore: clampPercent(concept?.exam_score),
      requiredPrerequisites: number(concept?.required_prerequisites),
      masteredPrerequisites: number(concept?.mastered_prerequisites),
      prerequisites: array(concept?.prerequisites).map((prerequisite) => ({
        id: text(prerequisite?.id),
        titleRo: text(prerequisite?.title_ro),
        titleEn: text(prerequisite?.title_en),
        mastery: clampPercent(prerequisite?.mastery),
        confidence: clampPercent(prerequisite?.confidence),
        status: safeStatus(prerequisite?.status)
      })).filter((prerequisite) => prerequisite.id)
    })).filter((concept) => concept.id),
    domains: array(candidate?.domains).map((domain) => ({
      domain: text(domain?.domain, "—"),
      conceptsTotal: number(domain?.concepts_total),
      activeConcepts: number(domain?.active_concepts),
      masteredConcepts: number(domain?.mastered_concepts),
      averageMastery: clampPercent(domain?.average_mastery)
    }))
  };
}

export function conceptTitle(concept, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  return english
    ? concept?.titleEn || concept?.titleRo || concept?.id || "—"
    : concept?.titleRo || concept?.titleEn || concept?.id || "—";
}

export function buildConceptMasteryHighlights(payload = {}) {
  const concepts = array(payload?.concepts);
  const active = concepts.filter((concept) => concept.activityCount > 0);

  const strengths = [...active]
    .filter((concept) => concept.status === "mastered" || concept.status === "proficient")
    .sort((left, right) => right.mastery - left.mastery || right.confidence - left.confidence)
    .slice(0, 4);

  const priorities = [...active]
    .filter((concept) => concept.status !== "mastered")
    .sort((left, right) => left.mastery - right.mastery || right.confidence - left.confidence)
    .slice(0, 4);

  const ready = concepts
    .filter((concept) => concept.readiness === "ready" && concept.activityCount === 0)
    .sort((left, right) => left.position - right.position || left.id.localeCompare(right.id))
    .slice(0, 4);

  const blocked = concepts
    .filter((concept) => concept.readiness === "blocked")
    .sort((left, right) => right.requiredPrerequisites - right.masteredPrerequisites - (left.requiredPrerequisites - left.masteredPrerequisites))
    .slice(0, 4);

  return {
    strengths,
    priorities,
    ready,
    blocked,
    hasConcepts: concepts.length > 0,
    hasEvidence: active.length > 0
  };
}
