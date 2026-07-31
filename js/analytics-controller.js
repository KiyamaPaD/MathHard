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
import { normalizeUiError, renderUiState } from "./ui-feedback.js";

const RANGE_KEY = "mh_analytics_range_v1";
const RANGES = [30, 90, 365];

const COPY = {
  ro: {
    title: "Analytics",
    loading: "Se încarcă datele…",
    auth: "Autentifică-te pentru analytics.",
    retry: "Reîncearcă",
    refresh: "Actualizează",
    ranges: { 30: "30 zile", 90: "90 zile", 365: "1 an" },
    cards: {
      mastery: "Mastery mediu",
      accuracy: "Acuratețe",
      xp: "XP total",
      streak: "Streak curent"
    },
    days: "zile",
    overview: "Progres general",
    lessons: "Lecții",
    problems: "Probleme",
    exams: "Examene",
    activity: "Evoluție",
    activityHint: "Activitate și XP în perioada selectată",
    heatmap: "Consistență",
    heatmapHint: "Ultimele 365 de zile",
    mastery: "Mastery pe capitole",
    conceptMastery: "Mastery pe concepte",
    conceptMasteryHint: "Scor derivat din progres validat server-side",
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
    attempts: "încercări",
    accuracy: "acuratețe",
    strengths: "Puncte forte",
    weaknesses: "De consolidat",
    noStrengths: "Rezolvă mai mult pentru a identifica punctele forte.",
    noWeaknesses: "Nu există încă suficiente date.",
    examsTitle: "Rezultate la examene",
    recent: "Activitate recentă",
    empty: "Nu există încă suficient progres pentru analytics.",
    emptyHint: "Finalizează o lecție sau rezolvă o problemă.",
    activeDays: "zile active",
    average: "medie",
    maximum: "maxim",
    events: "evenimente",
    bestExam: "cel mai bun scor",
    hints: "hinturi",
    reveals: "soluții afișate",
    event: {
      lesson_opened: "Lecție deschisă",
      lesson_completed: "Lecție finalizată",
      problem_opened: "Problemă deschisă",
      answer_wrong: "Răspuns greșit",
      answer_correct: "Răspuns corect",
      hint_used: "Hint folosit",
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
    problems: "Problems",
    exams: "Exams",
    activity: "Progress trend",
    activityHint: "Activity and XP in the selected range",
    heatmap: "Consistency",
    heatmapHint: "Last 365 days",
    mastery: "Mastery by chapter",
    conceptMastery: "Concept mastery",
    conceptMasteryHint: "Derived from server-validated progress",
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
    attempts: "attempts",
    accuracy: "accuracy",
    strengths: "Strengths",
    weaknesses: "Needs work",
    noStrengths: "Complete more work to identify strengths.",
    noWeaknesses: "There is not enough data yet.",
    examsTitle: "Exam results",
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
      lesson_completed: "Lesson completed",
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
          ${renderProgressRow(t.lessons, summary.learnedLessons, summary.totalLessons)}
          ${renderProgressRow(t.problems, summary.solvedProblems, summary.totalProblems)}
          ${renderProgressRow(t.exams, summary.passedExams, summary.totalExams)}
        </div>
      </section>
      <section class="mh-analytics-card mh-analytics-accuracy-card">
        <div class="mh-analytics-card-head"><div><h3>${t.cards.accuracy}</h3></div></div>
        <div class="mh-analytics-donut" style="--value:${Math.max(0, Math.min(100, summary.accuracy))}"><strong>${formatNumber(summary.accuracy, 1)}%</strong></div>
        <p>${summary.correctAnswers} ✓ · ${summary.wrongAnswers} ✕</p>
      </section>
      ${renderTrend(data.dailyActivity)}
      ${renderHeatmap(data.heatmap)}
      ${renderChapterList(data.chapters)}
      ${renderConceptMastery(data.conceptMastery)}
      ${renderInsightList(t.strengths, insights.strengths, t.noStrengths, "strength")}
      ${renderInsightList(t.weaknesses, insights.weaknesses, t.noWeaknesses, "weakness")}
      ${renderExamTypes(data.examTypes)}
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
