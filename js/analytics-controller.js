import { supabase } from "./supabase-client.js";
import {
  aggregateDailyActivity,
  buildAnalyticsInsights,
  heatLevel,
  progressPercent
} from "./analytics-model.js";
import { loadUserAnalytics } from "./analytics-repository.js";
import {
  buildConceptMasteryHighlights,
  conceptTitle
} from "./concept-mastery-model.js";
import {
  buildConceptReviewQueue,
  retentionConceptTitle
} from "./concept-retention-model.js";
import { normalizeUiError, renderUiState } from "./ui-feedback.js";
import { buildProgressInsights } from "./progress-taxonomy-model.js";

const RANGE_KEY = "mh_analytics_range_v1";
const RANGES = [30, 90, 365];

const COPY = {
  ro: {
    title: "Analiză",
    loading: "Se încarcă datele…",
    auth: "Autentifică-te pentru a vedea analiza progresului.",
    retry: "Reîncearcă",
    refresh: "Actualizează",
    ranges: { 30: "30 zile", 90: "90 zile", 365: "1 an" },
    cards: {
      mastery: "Stăpânire medie",
      accuracy: "Acuratețe",
      xp: "XP total",
      streak: "Serie curentă"
    },
    days: "zile",
    overview: "Progres general",
    lessons: "Lecții",
    lessonsRead: "Lecții citite",
    lessonsLearned: "Lecții învățate",
    lessonsReadOnly: "Citite, de verificat",
    lessonsUnread: "Necitite",
    problems: "Probleme",
    problemsSolved: "Rezolvate",
    problemsAttempted: "Încercate",
    problemsOpened: "Deschise",
    problemsUnopened: "Nedeschise",
    progressBreakdown: "Starea progresului",
    lessonBreakdownHint: "Lectură și învățare sunt urmărite separat",
    problemBreakdownHint: "De la prima deschidere până la rezolvare",
    lessonConversion: "din lecțiile citite sunt și învățate",
    problemConversion: "din problemele la care ai răspuns sunt rezolvate",
    noTaxonomy: "Stările detaliate nu sunt disponibile momentan.",
    exams: "Examene",
    activity: "Evoluție",
    activityHint: "Activitate și XP în perioada selectată",
    heatmap: "Consecvență",
    heatmapHint: "Ultimele 365 de zile",
    mastery: "Stăpânire pe capitole",
    conceptMastery: "Stăpânire pe concepte",
    conceptMasteryHint: "Calculată din activitatea și rezultatele tale",
    conceptStrengths: "Concepte solide",
    conceptPriorities: "De consolidat",
    conceptReady: "Următoarele concepte",
    conceptNoEvidence: "Nu există încă activitate pe conceptele mapate.",
    concepts: "concepte",
    conceptsActive: "active",
    conceptsMastered: "stăpânite",
    conceptsReadyCount: "pregătite",
    conceptsBlocked: "blocate",
    confidence: "încredere",
    evidence: "dovezi",
    prerequisites: "prerechizite",
    conceptStatus: {
      no_evidence: "Fără activitate",
      building: "În lucru",
      proficient: "Solid",
      mastered: "Stăpânit"
    },
    conceptReadiness: {
      ready: "Pregătit",
      blocked: "Blocat",
      in_progress: "În progres",
      mastered: "Stăpânit"
    },
    retentionTitle: "Plan de recapitulare",
    retentionHint: "Retenție estimată și următoarea repetare",
    retentionAverage: "retenție medie",
    retentionDueNow: "de repetat acum",
    retentionOverdue: "întârziate",
    retentionDueSoon: "în următoarele 7 zile",
    retentionStable: "stabile",
    retentionEmpty: "Nu există încă o recapitulare programată.",
    retentionState: {
      overdue: "Întârziat",
      due: "Astăzi",
      upcoming: "Urmează",
      stable: "Stabil",
      no_evidence: "Fără activitate"
    },
    reviewTiming: {
      overdue: "întârziere",
      today: "astăzi",
      tomorrow: "mâine",
      inDays: "în {days} zile"
    },
    attempts: "încercări",
    accuracy: "acuratețe",
    strengths: "Puncte forte",
    weaknesses: "De consolidat",
    noStrengths: "Rezolvă mai mult pentru a identifica punctele forte.",
    noWeaknesses: "Nu există încă suficiente date.",
    examsTitle: "Rezultate la examene",
    replaysTitle: "Recapitulări",
    replaysHint: "Replay-urile au 0 XP și nu schimbă progresul oficial.",
    problemReplays: "probleme reluate",
    examReplays: "examene reluate",
    lastReplay: "ultima reluare",
    noReplays: "Nu ai reluat încă probleme sau examene.",
    recent: "Activitate recentă",
    empty: "Nu există încă suficient progres pentru analiză.",
    emptyHint: "Finalizează o lecție sau rezolvă o problemă.",
    activeDays: "zile active",
    average: "medie",
    maximum: "maxim",
    events: "evenimente",
    bestExam: "cel mai bun scor",
    hints: "indicii",
    reveals: "soluții afișate",
    event: {
      lesson_opened: "Lecție deschisă",
      lesson_read: "Lecție citită",
      lesson_completed: "Lecție învățată",
      problem_opened: "Problemă deschisă",
      answer_wrong: "Răspuns greșit",
      answer_correct: "Răspuns corect",
      hint_used: "Indiciu folosit",
      solution_revealed: "Soluție afișată",
      exam_opened: "Examen deschis",
      exam_started: "Examen început",
      exam_answer_saved: "Răspuns salvat",
      exam_finished: "Examen finalizat",
      exam_cancelled: "Examen anulat"
    }
  },
  en: {
    title: "Analytics",
    loading: "Loading analytics…",
    auth: "Sign in to view analytics.",
    retry: "Retry",
    refresh: "Refresh",
    ranges: { 30: "30 days", 90: "90 days", 365: "1 year" },
    cards: {
      mastery: "Average mastery",
      accuracy: "Accuracy",
      xp: "Total XP",
      streak: "Current streak"
    },
    days: "days",
    overview: "Overall progress",
    lessons: "Lessons",
    lessonsRead: "Lessons read",
    lessonsLearned: "Lessons learned",
    lessonsReadOnly: "Read, check pending",
    lessonsUnread: "Unread",
    problems: "Problems",
    problemsSolved: "Solved",
    problemsAttempted: "Attempted",
    problemsOpened: "Opened",
    problemsUnopened: "Not opened",
    progressBreakdown: "Progress status",
    lessonBreakdownHint: "Reading and learning are tracked separately",
    problemBreakdownHint: "From first open to a correct solution",
    lessonConversion: "of read lessons are also learned",
    problemConversion: "of answered problems are solved",
    noTaxonomy: "Detailed statuses are temporarily unavailable.",
    exams: "Exams",
    activity: "Progress trend",
    activityHint: "Activity and XP in the selected range",
    heatmap: "Consistency",
    heatmapHint: "Last 365 days",
    mastery: "Mastery by chapter",
    conceptMastery: "Concept mastery",
    conceptMasteryHint: "Calculated from your activity and results",
    conceptStrengths: "Strong concepts",
    conceptPriorities: "Needs work",
    conceptReady: "Next concepts",
    conceptNoEvidence: "There is no activity on mapped concepts yet.",
    concepts: "concepts",
    conceptsActive: "active",
    conceptsMastered: "mastered",
    conceptsReadyCount: "ready",
    conceptsBlocked: "blocked",
    confidence: "confidence",
    evidence: "evidence",
    prerequisites: "prerequisites",
    conceptStatus: {
      no_evidence: "No activity",
      building: "Building",
      proficient: "Proficient",
      mastered: "Mastered"
    },
    conceptReadiness: {
      ready: "Ready",
      blocked: "Blocked",
      in_progress: "In progress",
      mastered: "Mastered"
    },
    retentionTitle: "Review plan",
    retentionHint: "Estimated retention and next spaced review",
    retentionAverage: "average retention",
    retentionDueNow: "due now",
    retentionOverdue: "overdue",
    retentionDueSoon: "within 7 days",
    retentionStable: "stable",
    retentionEmpty: "There is no scheduled review yet.",
    retentionState: {
      overdue: "Overdue",
      due: "Today",
      upcoming: "Upcoming",
      stable: "Stable",
      no_evidence: "No activity"
    },
    reviewTiming: {
      overdue: "overdue",
      today: "today",
      tomorrow: "tomorrow",
      inDays: "in {days} days"
    },
    attempts: "attempts",
    accuracy: "accuracy",
    strengths: "Strengths",
    weaknesses: "Needs work",
    noStrengths: "Complete more work to identify strengths.",
    noWeaknesses: "There is not enough data yet.",
    examsTitle: "Exam results",
    replaysTitle: "Reviews",
    replaysHint: "Replays award 0 XP and do not change official progress.",
    problemReplays: "problem replays",
    examReplays: "exam replays",
    lastReplay: "last replay",
    noReplays: "You have not replayed any problems or exams yet.",
    recent: "Recent activity",
    empty: "There is not enough progress for analytics yet.",
    emptyHint: "Complete a lesson or solve a problem.",
    activeDays: "active days",
    average: "average",
    maximum: "maximum",
    events: "events",
    bestExam: "best score",
    hints: "hints",
    reveals: "revealed solutions",
    event: {
      lesson_opened: "Lesson opened",
      lesson_read: "Lesson read",
      lesson_completed: "Lesson learned",
      problem_opened: "Problem opened",
      answer_wrong: "Wrong answer",
      answer_correct: "Correct answer",
      hint_used: "Hint used",
      solution_revealed: "Solution revealed",
      exam_opened: "Exam opened",
      exam_started: "Exam started",
      exam_answer_saved: "Answer saved",
      exam_finished: "Exam completed",
      exam_cancelled: "Exam cancelled"
    }
  }
};

function locale() {
  return document.documentElement.lang?.toLowerCase().startsWith("en") ? "en" : "ro";
}

function copy() {
  return COPY[locale()];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function readRange() {
  try {
    const value = Number(localStorage.getItem(RANGE_KEY));
    return RANGES.includes(value) ? value : 90;
  } catch {
    return 90;
  }
}

function saveRange(value) {
  try { localStorage.setItem(RANGE_KEY, String(value)); } catch { /* optional */ }
}

function formatNumber(value, maximumFractionDigits = 0) {
  return new Intl.NumberFormat(locale() === "en" ? "en-GB" : "ro-RO", {
    maximumFractionDigits
  }).format(Number(value || 0));
}

function formatDate(value, { month = "short", day = "numeric" } = {}) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale() === "en" ? "en-GB" : "ro-RO", {
    day,
    month
  }).format(date);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale() === "en" ? "en-GB" : "ro-RO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function renderProgressRow(label, value, total) {
  const percent = progressPercent(value, total);
  return `
    <div class="mh-analytics-progress-row">
      <div class="mh-analytics-progress-copy">
        <strong>${escapeHtml(label)}</strong>
        <span>${formatNumber(value)} / ${formatNumber(total)}</span>
      </div>
      <div class="mh-analytics-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}">
        <i style="width:${percent}%"></i>
      </div>
    </div>
  `;
}

function renderTrend(rows) {
  const t = copy();
  const points = aggregateDailyActivity(rows, 30);
  const maximum = Math.max(1, ...points.map((row) => Math.max(row.events, row.xp)));

  return `
    <section class="mh-analytics-card mh-analytics-span-2">
      <div class="mh-analytics-card-head">
        <div><h3>${t.activity}</h3><p>${t.activityHint}</p></div>
      </div>
      <div class="mh-analytics-trend" role="img" aria-label="${escapeHtml(t.activity)}">
        ${points.map((row) => {
          const eventsHeight = Math.max(3, Math.round((row.events / maximum) * 100));
          const xpHeight = Math.max(0, Math.round((row.xp / maximum) * 100));
          const title = `${formatDate(row.date)} · ${row.events} ${t.events} · ${row.xp} XP`;
          return `
            <div class="mh-analytics-trend-column" title="${escapeHtml(title)}">
              <i class="events" style="height:${eventsHeight}%"></i>
              <i class="xp" style="height:${xpHeight}%"></i>
            </div>
          `;
        }).join("")}
      </div>
      <div class="mh-analytics-trend-axis">
        <span>${formatDate(points[0]?.date)}</span>
        <span>${formatDate(points.at(-1)?.date)}</span>
      </div>
    </section>
  `;
}

function renderHeatmap(rows) {
  const t = copy();
  const maximum = Math.max(1, ...rows.map((row) => row.count));
  const first = rows[0]?.date ? new Date(`${rows[0].date}T12:00:00`) : null;
  const mondayIndex = first ? (first.getDay() + 6) % 7 : 0;
  const blanks = Array.from({ length: mondayIndex }, () => '<i class="mh-heatmap-cell is-empty" aria-hidden="true"></i>').join("");

  return `
    <section class="mh-analytics-card mh-analytics-span-2">
      <div class="mh-analytics-card-head">
        <div><h3>${t.heatmap}</h3><p>${t.heatmapHint}</p></div>
      </div>
      <div class="mh-analytics-heatmap-scroll">
        <div class="mh-analytics-heatmap">
          ${blanks}
          ${rows.map((row) => {
            const level = heatLevel(row.count, maximum);
            return `<i class="mh-heatmap-cell level-${level}" title="${escapeHtml(`${formatDate(row.date)} · ${row.count}`)}" aria-label="${escapeHtml(`${formatDate(row.date)}: ${row.count}`)}"></i>`;
          }).join("")}
        </div>
      </div>
      <div class="mh-analytics-heatmap-legend"><span>0</span><i class="level-1"></i><i class="level-2"></i><i class="level-3"></i><i class="level-4"></i><span>${maximum}</span></div>
    </section>
  `;
}

function renderChapterList(chapters) {
  const t = copy();
  const visible = [...chapters]
    .sort((a, b) => b.activity - a.activity || b.mastery - a.mastery)
    .slice(0, 14);

  return `
    <section class="mh-analytics-card mh-analytics-span-2">
      <div class="mh-analytics-card-head"><div><h3>${t.mastery}</h3></div></div>
      <div class="mh-analytics-chapters">
        ${visible.map((chapter) => `
          <article class="mh-analytics-chapter">
            <div class="mh-analytics-chapter-head">
              <strong>${escapeHtml(chapter.chapter)}</strong>
              <span>${formatNumber(chapter.mastery, 1)}%</span>
            </div>
            <div class="mh-analytics-mastery-track"><i style="width:${Math.max(0, Math.min(100, chapter.mastery))}%"></i></div>
            <p>${chapter.problemsSolved}/${chapter.problemTotal} ${t.problems.toLowerCase()} · ${formatNumber(chapter.accuracy, 1)}% ${t.accuracy} · ${chapter.attempts} ${t.attempts}</p>
          </article>
        `).join("") || `<p class="mh-analytics-muted">${t.empty}</p>`}
      </div>
    </section>
  `;
}


function renderConceptMasteryRow(concept) {
  const t = copy();
  const language = locale();
  const title = conceptTitle(concept, language);
  const status = t.conceptStatus[concept.status] || concept.status;
  const readiness = t.conceptReadiness[concept.readiness] || concept.readiness;
  const prerequisiteCopy = concept.requiredPrerequisites > 0
    ? ` · ${concept.masteredPrerequisites}/${concept.requiredPrerequisites} ${t.prerequisites}`
    : "";

  return `
    <article class="mh-analytics-concept-row ${escapeHtml(concept.status)}">
      <div class="mh-analytics-concept-head">
        <div>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(concept.domain || concept.conceptType || "—")}</span>
        </div>
        <div class="mh-analytics-concept-score">
          <strong>${formatNumber(concept.mastery, 1)}%</strong>
          <span>${escapeHtml(status)}</span>
        </div>
      </div>
      <div class="mh-analytics-mastery-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(concept.mastery)}">
        <i style="width:${Math.max(0, Math.min(100, concept.mastery))}%"></i>
      </div>
      <p>${escapeHtml(readiness)} · ${formatNumber(concept.confidence)}% ${t.confidence} · ${formatNumber(concept.activityCount)} ${t.evidence}${escapeHtml(prerequisiteCopy)}</p>
    </article>
  `;
}

function renderConceptMasteryGroup(title, rows, emptyText) {
  return `
    <div class="mh-analytics-concept-group">
      <h4>${escapeHtml(title)}</h4>
      <div class="mh-analytics-concept-list">
        ${rows.map(renderConceptMasteryRow).join("") || `<p class="mh-analytics-muted">${escapeHtml(emptyText)}</p>`}
      </div>
    </div>
  `;
}

function renderConceptMastery(payload) {
  if (!payload?.available) return "";

  const t = copy();
  const summary = payload.summary || {};
  const highlights = buildConceptMasteryHighlights(payload);
  if (!highlights.hasConcepts) return "";

  const firstGroup = highlights.hasEvidence
    ? renderConceptMasteryGroup(t.conceptStrengths, highlights.strengths, t.conceptNoEvidence)
    : renderConceptMasteryGroup(t.conceptReady, highlights.ready, t.conceptNoEvidence);
  const secondRows = highlights.hasEvidence ? highlights.priorities : highlights.blocked;
  const secondTitle = highlights.hasEvidence ? t.conceptPriorities : t.conceptsBlocked;

  return `
    <section class="mh-analytics-card mh-analytics-span-2 mh-analytics-concept-mastery">
      <div class="mh-analytics-card-head">
        <div>
          <h3>${t.conceptMastery}</h3>
          <p>${t.conceptMasteryHint}</p>
        </div>
        <strong class="mh-analytics-concept-average">${formatNumber(summary.averageMastery, 1)}%</strong>
      </div>
      <div class="mh-analytics-concept-summary" aria-label="${escapeHtml(t.conceptMastery)}">
        <span><strong>${formatNumber(summary.conceptsTotal)}</strong> ${t.concepts}</span>
        <span><strong>${formatNumber(summary.activeConcepts)}</strong> ${t.conceptsActive}</span>
        <span><strong>${formatNumber(summary.masteredConcepts)}</strong> ${t.conceptsMastered}</span>
        <span><strong>${formatNumber(summary.readyConcepts)}</strong> ${t.conceptsReadyCount}</span>
        <span><strong>${formatNumber(summary.blockedConcepts)}</strong> ${t.conceptsBlocked}</span>
      </div>
      <div class="mh-analytics-concept-columns">
        ${firstGroup}
        ${renderConceptMasteryGroup(secondTitle, secondRows, t.conceptNoEvidence)}
      </div>
    </section>
  `;
}


function formatReviewTiming(concept) {
  const t = copy();
  const days = Number(concept?.daysUntilReview || 0);
  if (concept?.reviewState === "overdue") {
    return `${Math.max(1, Math.abs(days))} ${t.days} ${t.reviewTiming.overdue}`;
  }
  if (days <= 0) return t.reviewTiming.today;
  if (days === 1) return t.reviewTiming.tomorrow;
  return t.reviewTiming.inDays.replace("{days}", String(days));
}

function renderConceptReviewRow(concept) {
  const t = copy();
  const title = retentionConceptTitle(concept, locale());
  const state = t.retentionState[concept.reviewState] || concept.reviewState;

  return `
    <article class="mh-analytics-review-row ${escapeHtml(concept.reviewState)}">
      <div class="mh-analytics-review-head">
        <div>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(concept.domain || concept.conceptType || "—")}</span>
        </div>
        <div class="mh-analytics-review-score">
          <strong>${formatNumber(concept.retention, 1)}%</strong>
          <span>${escapeHtml(state)}</span>
        </div>
      </div>
      <div class="mh-analytics-retention-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(concept.retention)}">
        <i style="width:${Math.max(0, Math.min(100, concept.retention))}%"></i>
      </div>
      <p>${escapeHtml(formatReviewTiming(concept))} · ${formatNumber(concept.mastery, 1)}% mastery · ${formatNumber(concept.confidence)}% ${t.confidence}</p>
    </article>
  `;
}

function renderConceptRetention(payload) {
  if (!payload?.available) return "";

  const t = copy();
  const summary = payload.summary || {};
  const review = buildConceptReviewQueue(payload, 6);
  if (!review.hasEvidence) return "";

  return `
    <section class="mh-analytics-card mh-analytics-span-2 mh-analytics-concept-retention">
      <div class="mh-analytics-card-head">
        <div>
          <h3>${t.retentionTitle}</h3>
          <p>${t.retentionHint}</p>
        </div>
        <strong class="mh-analytics-retention-average">${formatNumber(summary.averageRetention, 1)}%</strong>
      </div>
      <div class="mh-analytics-retention-summary" aria-label="${escapeHtml(t.retentionTitle)}">
        <span><strong>${formatNumber(summary.dueNow)}</strong> ${t.retentionDueNow}</span>
        <span><strong>${formatNumber(summary.overdue)}</strong> ${t.retentionOverdue}</span>
        <span><strong>${formatNumber(summary.dueSoon)}</strong> ${t.retentionDueSoon}</span>
        <span><strong>${formatNumber(summary.stable)}</strong> ${t.retentionStable}</span>
      </div>
      <div class="mh-analytics-review-list">
        ${review.queue.map(renderConceptReviewRow).join("") || `<p class="mh-analytics-muted">${escapeHtml(t.retentionEmpty)}</p>`}
      </div>
    </section>
  `;
}

function renderTaxonomyMetric(label, value, total, className = "") {
  const percent = total > 0 ? Math.round((Number(value || 0) / Number(total)) * 100) : 0;
  return `
    <div class="mh-analytics-status-row ${escapeHtml(className)}">
      <div><span>${escapeHtml(label)}</span><strong>${formatNumber(value)}</strong></div>
      <div class="mh-analytics-status-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><i style="width:${Math.max(0, Math.min(100, percent))}%"></i></div>
    </div>
  `;
}

function renderProgressTaxonomy(taxonomy) {
  const t = copy();
  if (!taxonomy?.available) {
    return `
      <section class="mh-analytics-card mh-analytics-span-2">
        <div class="mh-analytics-card-head"><div><h3>${t.progressBreakdown}</h3></div></div>
        <p class="mh-analytics-muted">${t.noTaxonomy}</p>
      </section>
    `;
  }

  const lessons = taxonomy.lessons || {};
  const problems = taxonomy.problems || {};
  const insights = buildProgressInsights(taxonomy);

  return `
    <section class="mh-analytics-card mh-analytics-span-2 mh-analytics-progress-taxonomy">
      <div class="mh-analytics-card-head"><div><h3>${t.progressBreakdown}</h3></div></div>
      <div class="mh-analytics-taxonomy-grid">
        <article>
          <div class="mh-analytics-taxonomy-head">
            <div><h4>${t.lessons}</h4><p>${t.lessonBreakdownHint}</p></div>
            <strong>${formatNumber(insights.lessons.learnedFromReadShare)}%</strong>
          </div>
          <div class="mh-analytics-taxonomy-insight">${formatNumber(insights.lessons.learnedFromReadShare)}% ${t.lessonConversion}</div>
          ${renderTaxonomyMetric(t.lessonsLearned, lessons.learned, lessons.total, "is-learned")}
          ${renderTaxonomyMetric(t.lessonsReadOnly, lessons.readOnly, lessons.total, "is-read")}
          ${renderTaxonomyMetric(t.lessonsUnread, lessons.unread, lessons.total, "is-unread")}
        </article>
        <article>
          <div class="mh-analytics-taxonomy-head">
            <div><h4>${t.problems}</h4><p>${t.problemBreakdownHint}</p></div>
            <strong>${formatNumber(insights.problems.conversionFromAttempt)}%</strong>
          </div>
          <div class="mh-analytics-taxonomy-insight">${formatNumber(insights.problems.conversionFromAttempt)}% ${t.problemConversion}</div>
          ${renderTaxonomyMetric(t.problemsSolved, problems.solved, problems.total, "is-solved")}
          ${renderTaxonomyMetric(t.problemsAttempted, problems.attempted, problems.total, "is-attempted")}
          ${renderTaxonomyMetric(t.problemsOpened, problems.opened, problems.total, "is-opened")}
          ${renderTaxonomyMetric(t.problemsUnopened, problems.unopened, problems.total, "is-unopened")}
        </article>
      </div>
    </section>
  `;
}

function renderInsightList(title, rows, emptyText, kind) {
  return `
    <section class="mh-analytics-card">
      <div class="mh-analytics-card-head"><div><h3>${escapeHtml(title)}</h3></div></div>
      <div class="mh-analytics-insight-list">
        ${rows.map((row) => `
          <div class="mh-analytics-insight ${kind}">
            <span>${escapeHtml(row.chapter)}</span>
            <strong>${formatNumber(row.mastery, 1)}%</strong>
          </div>
        `).join("") || `<p class="mh-analytics-muted">${escapeHtml(emptyText)}</p>`}
      </div>
    </section>
  `;
}

function renderExamTypes(rows) {
  const t = copy();
  return `
    <section class="mh-analytics-card">
      <div class="mh-analytics-card-head"><div><h3>${t.examsTitle}</h3></div></div>
      <div class="mh-analytics-exam-types">
        ${rows.map((row) => `
          <div>
            <strong>${escapeHtml(row.type)}</strong>
            <span>${formatNumber(row.averageScore, 1)} ${t.average}</span>
            <small>${row.passed}/${row.attempts} · ${t.bestExam}: ${formatNumber(row.bestScore, 1)}</small>
          </div>
        `).join("") || `<p class="mh-analytics-muted">${t.noWeaknesses}</p>`}
      </div>
    </section>
  `;
}

function renderPracticeReplays(payload = {}) {
  const t = copy();
  const recent = Array.isArray(payload.recent) ? payload.recent : [];
  const problemCount = Number(payload.problem_replays || 0);
  const examCount = Number(payload.exam_replays || 0);
  const total = Number(payload.total_replays || problemCount + examCount);
  return `
    <section class="mh-analytics-card mh-analytics-span-2">
      <div class="mh-analytics-card-head"><div><h3>${t.replaysTitle}</h3><p>${t.replaysHint}</p></div></div>
      ${total > 0 ? `
        <div class="mh-analytics-exam-types">
          <div><strong>${problemCount}</strong><span>${t.problemReplays}</span></div>
          <div><strong>${examCount}</strong><span>${t.examReplays}</span></div>
          <div><strong>${payload.last_replay_at ? formatDateTime(payload.last_replay_at) : "—"}</strong><span>${t.lastReplay}</span></div>
        </div>
        <div class="mh-analytics-recent">
          ${recent.slice(0, 6).map((row) => `
            <div class="mh-analytics-recent-row">
              <span class="mh-analytics-event-dot"></span>
              <div><strong>${escapeHtml(row.content_type === "exam" ? t.examReplays : t.problemReplays)}</strong><span>${escapeHtml(row.content_id || "—")}</span></div>
              <time datetime="${escapeHtml(row.created_at || "")}">${formatDateTime(row.created_at)}</time>
            </div>
          `).join("")}
        </div>
      ` : `<p class="mh-analytics-muted">${t.noReplays}</p>`}
    </section>
  `;
}

function renderRecent(rows) {
  const t = copy();
  return `
    <section class="mh-analytics-card mh-analytics-span-2">
      <div class="mh-analytics-card-head"><div><h3>${t.recent}</h3></div></div>
      <div class="mh-analytics-recent">
        ${rows.slice(0, 12).map((row) => `
          <div class="mh-analytics-recent-row">
            <span class="mh-analytics-event-dot ${escapeHtml(row.eventType)}"></span>
            <div><strong>${escapeHtml(t.event[row.eventType] || row.eventType)}</strong><span>${escapeHtml(row.title)}</span></div>
            <time datetime="${escapeHtml(row.createdAt)}">${formatDateTime(row.createdAt)}</time>
          </div>
        `).join("") || `<p class="mh-analytics-muted">${t.empty}</p>`}
      </div>
    </section>
  `;
}

function renderDashboard(data) {
  const t = copy();
  const summary = data.summary;
  const insights = buildAnalyticsInsights(data);

  if (!insights.hasActivity) {
    return `
      <div class="mh-analytics-empty">
        <strong>${t.empty}</strong>
        <span>${t.emptyHint}</span>
      </div>
    `;
  }

  return `
    <div class="mh-analytics-summary-grid">
      <article><span>${t.cards.mastery}</span><strong>${formatNumber(summary.masteryAverage, 1)}%</strong></article>
      <article><span>${t.cards.accuracy}</span><strong>${formatNumber(summary.accuracy, 1)}%</strong><small>${summary.correctAnswers}/${summary.answerAttempts}</small></article>
      <article><span>${t.cards.xp}</span><strong>${formatNumber(summary.xpTotal)}</strong><small>${summary.hintsUsed} ${t.hints} · ${summary.solutionsRevealed} ${t.reveals}</small></article>
      <article><span>${t.cards.streak}</span><strong>${formatNumber(summary.currentStreak)} ${t.days}</strong><small>${t.maximum} ${summary.longestStreak} · ${summary.activeDays} ${t.activeDays}</small></article>
    </div>

    <div class="mh-analytics-grid">
      <section class="mh-analytics-card">
        <div class="mh-analytics-card-head"><div><h3>${t.overview}</h3></div></div>
        <div class="mh-analytics-progress-list">
          ${renderProgressRow(t.lessonsRead, data.progressTaxonomy?.lessons?.read ?? summary.learnedLessons, data.progressTaxonomy?.lessons?.total ?? summary.totalLessons)}
          ${renderProgressRow(t.lessonsLearned, data.progressTaxonomy?.lessons?.learned ?? summary.learnedLessons, data.progressTaxonomy?.lessons?.total ?? summary.totalLessons)}
          ${renderProgressRow(t.problemsSolved, data.progressTaxonomy?.problems?.solved ?? summary.solvedProblems, data.progressTaxonomy?.problems?.total ?? summary.totalProblems)}
          ${renderProgressRow(t.exams, summary.passedExams, summary.totalExams)}
        </div>
      </section>
      <section class="mh-analytics-card mh-analytics-accuracy-card">
        <div class="mh-analytics-card-head"><div><h3>${t.cards.accuracy}</h3></div></div>
        <div class="mh-analytics-donut" style="--value:${Math.max(0, Math.min(100, summary.accuracy))}"><strong>${formatNumber(summary.accuracy, 1)}%</strong></div>
        <p>${summary.correctAnswers} ✓ · ${summary.wrongAnswers} ✕</p>
      </section>
      ${renderProgressTaxonomy(data.progressTaxonomy)}
      ${renderTrend(data.dailyActivity)}
      ${renderHeatmap(data.heatmap)}
      ${renderChapterList(data.chapters)}
      ${renderConceptMastery(data.conceptMastery)}
      ${renderConceptRetention(data.conceptRetention)}
      ${renderInsightList(t.strengths, insights.strengths, t.noStrengths, "strength")}
      ${renderInsightList(t.weaknesses, insights.weaknesses, t.noWeaknesses, "weakness")}
      ${renderExamTypes(data.examTypes)}
      ${renderPracticeReplays(data.practiceReplays)}
      ${renderRecent(data.recentActivity)}
    </div>
  `;
}

export function createAnalyticsController({ host } = {}) {
  const root = host || document.getElementById("mhShellPanelAnalytics");
  if (!root) return { activate() {} };

  let range = readRange();
  let currentData = null;
  let loadEpoch = 0;
  let active = false;
  let loadPromise = null;
  let reloadAfterCurrent = false;

  root.innerHTML = `
    <div class="mh-analytics-shell">
      <div class="mh-analytics-toolbar">
        <div class="mh-analytics-ranges" role="group"></div>
        <button class="btn small" type="button" data-analytics-refresh></button>
      </div>
      <div class="mh-analytics-state" aria-live="polite"></div>
    </div>
  `;

  const state = root.querySelector(".mh-analytics-state");
  const ranges = root.querySelector(".mh-analytics-ranges");
  const refreshButton = root.querySelector("[data-analytics-refresh]");

  function renderControls() {
    const t = copy();
    ranges.innerHTML = RANGES.map((days) => `
      <button type="button" class="mh-analytics-range ${days === range ? "active" : ""}" data-days="${days}" aria-pressed="${days === range}">${t.ranges[days]}</button>
    `).join("");
    refreshButton.textContent = t.refresh;

    ranges.querySelectorAll("[data-days]").forEach((button) => {
      button.addEventListener("click", () => {
        range = Number(button.dataset.days);
        saveRange(range);
        renderControls();
        void load(true);
      });
    });
  }

  function renderLoading() {
    renderUiState(state, {
      kind: "loading",
      title: copy().loading,
      skeleton: { cards: 7, lines: 3 }
    });
  }

  function renderAuth() {
    renderUiState(state, {
      kind: "auth",
      title: copy().auth
    });
  }

  function renderError(error) {
    const friendly = normalizeUiError(error, { language: locale() });
    renderUiState(state, {
      kind: friendly.key === "offline" ? "offline" : "error",
      title: friendly.title,
      message: friendly.message,
      actionLabel: copy().retry,
      onAction: () => void load(true)
    });
  }

  function renderData() {
    state.innerHTML = renderDashboard(currentData);
  }

  function load(force = false) {
    if (!active && !force) return Promise.resolve();
    if (loadPromise) {
      if (force) reloadAfterCurrent = true;
      return loadPromise;
    }

    const request = ++loadEpoch;
    if (!currentData || force) renderLoading();

    const promise = (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (request !== loadEpoch) return;
        if (!session?.user) {
          currentData = null;
          renderAuth();
          return;
        }

        const next = await loadUserAnalytics(supabase, { days: range, locale: locale() });
        if (request !== loadEpoch) return;
        currentData = next;
        renderData();
      } catch (error) {
        if (request !== loadEpoch) return;
        console.error("MathHard analytics could not be loaded:", error);
        renderError(error);
      }
    })().finally(() => {
      if (loadPromise === promise) loadPromise = null;
      if (reloadAfterCurrent && active) {
        reloadAfterCurrent = false;
        queueMicrotask(() => void load(true));
      } else {
        reloadAfterCurrent = false;
      }
    });

    loadPromise = promise;
    return promise;
  }

  function activate() {
    active = true;
    renderControls();
    void load(false);
  }

  function deactivate() {
    active = false;
  }

  refreshButton.addEventListener("click", () => void load(true));
  supabase.auth.onAuthStateChange((_event, session) => {
    loadEpoch += 1;
    currentData = null;
    if (!session?.user) renderAuth();
    else if (active) void load(true);
  });

  new MutationObserver(() => {
    renderControls();
    if (currentData) renderData();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  renderControls();
  return { activate, deactivate, refresh: () => load(true) };
}


function initAnalyticsWorkspace() {
  const controller = createAnalyticsController({
    host: document.getElementById("mhShellPanelAnalytics")
  });
  window.addEventListener("mh:analytics-route", (event) => {
    if (event.detail?.active) controller.activate();
    else controller.deactivate();
  });
  if (location.hash === "#analytics") controller.activate();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAnalyticsWorkspace, { once: true });
  } else {
    initAnalyticsWorkspace();
  }
}
