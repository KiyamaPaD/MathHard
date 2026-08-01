import { recordDiagnostic } from "./runtime-diagnostics.js";

const BUILD = "4g4";
const RECOVERY_ID = "mhBetaRecovery";
const MAX_VISIBLE_ERRORS = 1;
let visibleErrors = 0;
let lastErrorAt = 0;

function isEnglish() {
  return document.documentElement.lang?.toLowerCase().startsWith("en");
}

function text(ro, en) {
  return isEnglish() ? en : ro;
}

function currentRoute() {
  const hash = String(location.hash || "").replace(/^#/, "").trim().toLowerCase();
  if (hash) return hash;
  if (document.body.classList.contains("profile-v2-body")) return "profile";
  if (document.body.classList.contains("community-public-body")) return "public-profile";
  return location.pathname.replace(/^\/+|\.html$/g, "") || "home";
}

function context() {
  const route = currentRoute();
  const params = new URLSearchParams(location.search);
  const username = params.get("u") || "";
  return {
    build: BUILD,
    route,
    contentType: route === "public-profile" ? "profile" : route,
    contentId: route === "public-profile" ? username : ""
  };
}

function feedbackSubject(ctx = context()) {
  const labels = {
    dashboard: ["Acasă", "Home"],
    roadmap: ["Roadmap", "Roadmap"],
    lessons: ["Lecții", "Lessons"],
    problems: ["Probleme", "Problems"],
    exams: ["Examene", "Exams"],
    analytics: ["Analytics", "Analytics"],
    gamification: ["Recompense", "Rewards"],
    leaderboards: ["Clasamente", "Leaderboards"],
    profile: ["Profil", "Profile"],
    "public-profile": ["Profil public", "Public profile"]
  };
  const label = labels[ctx.route] || ["MathHard", "MathHard"];
  return isEnglish() ? `Issue in ${label[1]}` : `Problemă în ${label[0]}`;
}

function decorateTrigger(trigger, { bug = false } = {}) {
  if (!(trigger instanceof HTMLElement)) return;
  const ctx = context();
  trigger.dataset.communityFeedbackContentType = ctx.contentType;
  trigger.dataset.communityFeedbackContentId = ctx.contentId;
  trigger.dataset.communityFeedbackBuild = ctx.build;
  if (bug) {
    trigger.dataset.communityFeedbackCategory = "bug";
    trigger.dataset.communityFeedbackSubject = feedbackSubject(ctx);
  }
}

function decorateFeedbackTriggers() {
  document.querySelectorAll('[data-community-feedback-open="feedback"]').forEach((trigger) => decorateTrigger(trigger));
}

function ensureRecovery() {
  let root = document.getElementById(RECOVERY_ID);
  if (root) return root;
  root = document.createElement("aside");
  root.id = RECOVERY_ID;
  root.className = "mh-beta-recovery";
  root.hidden = true;
  root.setAttribute("role", "alert");
  root.innerHTML = `
    <div>
      <strong data-beta-recovery-title></strong>
      <p data-beta-recovery-copy></p>
    </div>
    <div class="mh-beta-recovery-actions">
      <button class="btn small" type="button" data-beta-reload></button>
      <button class="btn small" type="button" data-community-feedback-open="feedback" data-beta-report></button>
      <button class="mh-beta-recovery-close" type="button" data-beta-close aria-label="Închide">×</button>
    </div>`;
  document.body.append(root);
  root.querySelector("[data-beta-reload]")?.addEventListener("click", () => location.reload());
  root.querySelector("[data-beta-close]")?.addEventListener("click", () => { root.hidden = true; });
  decorateTrigger(root.querySelector("[data-beta-report]"), { bug: true });
  return root;
}

function showRecovery(error, scope = "runtime") {
  const now = Date.now();
  if (visibleErrors >= MAX_VISIBLE_ERRORS || now - lastErrorAt < 2500) return;
  const message = String(error?.message || error || "");
  if (/ResizeObserver loop|Script error\.?$/i.test(message)) return;
  lastErrorAt = now;
  visibleErrors += 1;
  recordDiagnostic(`beta-${scope}`, error, context());

  const root = ensureRecovery();
  root.querySelector("[data-beta-recovery-title]").textContent = text("A apărut o problemă", "Something went wrong");
  root.querySelector("[data-beta-recovery-copy]").textContent = text(
    "Reîncarcă pagina. Dacă problema revine, trimite feedback din același ecran.",
    "Reload the page. If it happens again, send feedback from this screen."
  );
  root.querySelector("[data-beta-reload]").textContent = text("Reîncarcă", "Reload");
  root.querySelector("[data-beta-report]").textContent = text("Trimite feedback", "Send feedback");
  decorateTrigger(root.querySelector("[data-beta-report]"), { bug: true });
  root.hidden = false;
}

function installRuntimeRecovery() {
  window.addEventListener("error", (event) => {
    if (event.target && event.target !== window) return;
    showRecovery(event.error || event.message, "window-error");
  });
  window.addEventListener("unhandledrejection", (event) => showRecovery(event.reason, "unhandled-rejection"));
}

function installRouteContext() {
  window.addEventListener("hashchange", decorateFeedbackTriggers);
  document.addEventListener("click", (event) => {
    const routeButton = event.target.closest?.("[data-shell-route]");
    if (routeButton) queueMicrotask(decorateFeedbackTriggers);
  });
}

function init() {
  document.documentElement.dataset.mathhardBuild = BUILD;
  decorateFeedbackTriggers();
  installRouteContext();
  installRuntimeRecovery();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
else init();

window.MathHardBeta = Object.freeze({ build: BUILD, context, showRecovery });
