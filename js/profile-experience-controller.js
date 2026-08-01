import { buildProfileExperienceSummary } from "./profile-experience-model.js";

const TAB_STORAGE_KEY = "mh_profile_active_tab_v2";
const ALLOWED_TABS = new Set(["overview", "progress", "activity", "community", "account"]);

const TEXT = {
  ro: {
    tabs: {
      overview: "Prezentare",
      progress: "Progres",
      activity: "Activitate",
      community: "Profil public",
      account: "Cont"
    },
    completion: "Progres general",
    level: "Nivel",
    nextLevel: (xp) => `${xp} XP până la nivelul următor`,
    noNextLevel: "Nivel actualizat",
    continue: "Continuă",
    roadmap: "Plan de studiu",
    analytics: "Analiză",
    rewards: "Recompense",
    leaderboards: "Clasamente",
    focusTitle: "Următorul pas",
    examTitle: "Recomandare examen",
    noFocus: "Alege un plan de studiu și începe primul pas.",
    allLessons: "Toate lecțiile sunt finalizate.",
    allExams: "Nu ai examene restante."
  },
  en: {
    tabs: {
      overview: "Overview",
      progress: "Progress",
      activity: "Activity",
      community: "Public profile",
      account: "Account"
    },
    completion: "Overall progress",
    level: "Level",
    nextLevel: (xp) => `${xp} XP to the next level`,
    noNextLevel: "Level updated",
    continue: "Continue",
    roadmap: "Roadmap",
    analytics: "Analytics",
    rewards: "Rewards",
    leaderboards: "Leaderboards",
    focusTitle: "Next step",
    examTitle: "Exam recommendation",
    noFocus: "Choose a roadmap and start the first step.",
    allLessons: "All lessons are complete.",
    allExams: "You have no pending exams."
  }
};

let language = "ro";
let initialized = false;
let currentUserId = "guest";

function $(id) {
  return document.getElementById(id);
}

function text() {
  return TEXT[language] || TEXT.ro;
}

function safeStorageGet(key, fallback = "") {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // The active tab still works for the current page session.
  }
}

function tabStorageKey() {
  return `${TAB_STORAGE_KEY}:${currentUserId || "guest"}`;
}

function activeTabFromStorage() {
  const saved = safeStorageGet(tabStorageKey(), "overview");
  return ALLOWED_TABS.has(saved) ? saved : "overview";
}

function activateTab(tabName, { focus = false } = {}) {
  const next = ALLOWED_TABS.has(tabName) ? tabName : "overview";

  document.querySelectorAll("[data-profile-tab]").forEach((button) => {
    const active = button.dataset.profileTab === next;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
    button.tabIndex = active ? 0 : -1;
    if (active && focus) button.focus();
  });

  document.querySelectorAll("[data-profile-pane]").forEach((pane) => {
    const active = pane.dataset.profilePane === next;
    pane.hidden = !active;
  });

  safeStorageSet(tabStorageKey(), next);
}

function refreshContinueLink() {
  const allowed = new Set([
    "dashboard", "roadmap", "lessons", "problems", "exams",
    "research", "history", "xp", "analytics", "gamification", "leaderboards"
  ]);
  const saved = safeStorageGet("mh_active_workspace_v1", "dashboard")
    .replace(/^#/, "")
    .trim()
    .toLowerCase();
  const route = allowed.has(saved) ? saved : "dashboard";
  const button = $("profileContinueBtn");
  if (button) button.href = `/index.html#${route}`;
}

function applyTexts() {
  const copy = text();

  document.querySelectorAll("[data-profile-tab]").forEach((button) => {
    const key = button.dataset.profileTab;
    if (copy.tabs[key]) button.textContent = copy.tabs[key];
  });

  const mappings = [
    ["profileCompletionLabel", copy.completion],
    ["profileFocusHeading", copy.focusTitle],
    ["profileExamHeading", copy.examTitle],
    ["profileContinueBtn", copy.continue],
    ["profileRoadmapBtn", copy.roadmap],
    ["profileAnalyticsBtn", copy.analytics],
    ["profileRewardsBtn", copy.rewards],
    ["profileLeaderboardsBtn", copy.leaderboards]
  ];

  mappings.forEach(([id, value]) => {
    const element = $(id);
    if (element) element.textContent = value;
  });

  const levelPrefix = $("profileLevelPrefix");
  if (levelPrefix) levelPrefix.textContent = copy.level;
}

function bindTabs() {
  const tabs = [...document.querySelectorAll("[data-profile-tab]")];

  tabs.forEach((button, index) => {
    button.addEventListener("click", () => activateTab(button.dataset.profileTab));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();

      let nextIndex = index;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;

      activateTab(tabs[nextIndex].dataset.profileTab, { focus: true });
    });
  });
}

export function initializeProfileExperience({ lang = "ro" } = {}) {
  language = lang === "en" ? "en" : "ro";
  if (!initialized) {
    initialized = true;
    bindTabs();
    window.addEventListener("storage", (event) => {
      if (event.key === "mh_active_workspace_v1") refreshContinueLink();
    });
  }

  applyTexts();
  refreshContinueLink();
  activateTab(activeTabFromStorage());
}

export function setProfileExperienceLanguage(lang) {
  language = lang === "en" ? "en" : "ro";
  applyTexts();
}

export function renderProfileIdentity({ userId = "guest" } = {}) {
  const previousKey = tabStorageKey();
  currentUserId = userId || "guest";
  const nextKey = tabStorageKey();
  if (previousKey !== nextKey) activateTab(activeTabFromStorage());
  refreshContinueLink();
}

export function resetProfileExperience() {
  currentUserId = "guest";
  const ring = $("profileCompletionRing");
  if (ring) ring.style.setProperty("--profile-completion", "0deg");
  if ($("profileCompletionValue")) $("profileCompletionValue").textContent = "0%";
  if ($("profileLevelValue")) $("profileLevelValue").textContent = "1";
  if ($("profileLevelProgress")) $("profileLevelProgress").style.width = "0%";
  if ($("profileLevelMeta")) $("profileLevelMeta").textContent = text().nextLevel(25);
  if ($("profileFocusValue")) $("profileFocusValue").textContent = text().noFocus;
  if ($("profileExamValue")) $("profileExamValue").textContent = text().allExams;
  activateTab(activeTabFromStorage());
}

export function renderProfileExperience({
  counts = {},
  totals = {},
  nextLessonLabel = "",
  nextExamLabel = ""
} = {}) {
  const summary = buildProfileExperienceSummary({ counts, totals });
  const copy = text();

  const ring = $("profileCompletionRing");
  if (ring) {
    ring.style.setProperty(
      "--profile-completion",
      `${summary.overallCompletion * 3.6}deg`
    );
  }

  if ($("profileCompletionValue")) {
    $("profileCompletionValue").textContent = `${summary.overallCompletion}%`;
  }
  if ($("profileLevelValue")) {
    $("profileLevelValue").textContent = String(summary.level.level);
  }
  if ($("profileLevelProgress")) {
    $("profileLevelProgress").style.width = `${summary.level.progress}%`;
  }
  if ($("profileLevelMeta")) {
    $("profileLevelMeta").textContent = summary.level.remainingXp > 0
      ? copy.nextLevel(summary.level.remainingXp)
      : copy.noNextLevel;
  }

  if ($("profileFocusValue")) {
    $("profileFocusValue").textContent = nextLessonLabel || copy.allLessons;
  }
  if ($("profileExamValue")) {
    $("profileExamValue").textContent = nextExamLabel || copy.allExams;
  }
}
