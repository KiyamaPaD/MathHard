import { supabase } from "./supabase-client.js";
import {
  loadUiPreferences,
  mergeUiPreferences,
  saveUiPreferences
} from "./ui-preferences-repository.js";
import { loadRoadmapCatalog, selectRoadmap } from "./roadmap-repository.js";
import { normalizeUiError, showToast } from "./ui-feedback.js";

const ONBOARDING_VERSION = 1;
const LOCAL_PREFIX = "mh_onboarding_v1";

const COPY = Object.freeze({
  ro: {
    title: "Configurează MathHard",
    text: "Alege traseul principal. Îl poți schimba oricând din Roadmap.",
    roadmap: "Roadmap",
    start: "Începe",
    skip: "Mai târziu",
    loading: "Se încarcă roadmap-urile…",
    empty: "Nu există încă roadmap-uri publicate.",
    saved: "MathHard este configurat.",
    error: "Setarea nu a putut fi salvată."
  },
  en: {
    title: "Set up MathHard",
    text: "Choose your main path. You can change it from Roadmap at any time.",
    roadmap: "Roadmap",
    start: "Start",
    skip: "Later",
    loading: "Loading roadmaps…",
    empty: "No published roadmaps are available yet.",
    saved: "MathHard is ready.",
    error: "The setting could not be saved."
  }
});

function language() {
  return document.documentElement.lang?.toLowerCase().startsWith("en") ? "en" : "ro";
}

function localKey(userId) {
  return `${LOCAL_PREFIX}:${userId}`;
}

function readLocal(userId) {
  try { return JSON.parse(localStorage.getItem(localKey(userId)) || "null"); } catch { return null; }
}

function writeLocal(userId, value) {
  try { localStorage.setItem(localKey(userId), JSON.stringify(value)); } catch { /* optional */ }
}

function translated(roadmap, lang) {
  return {
    title: String(lang === "en" ? roadmap.title_en || roadmap.title_ro : roadmap.title_ro || roadmap.title_en || roadmap.id),
    description: String(lang === "en" ? roadmap.description_en || roadmap.description_ro : roadmap.description_ro || roadmap.description_en || "")
  };
}

function waitForShell() {
  if (document.body.classList.contains("mh-shell-ready")) return Promise.resolve();
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.body.classList.contains("mh-shell-ready")) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    window.setTimeout(() => { observer.disconnect(); resolve(); }, 2500);
  });
}

function createModal() {
  document.getElementById("mhOnboarding")?.remove();
  const modal = document.createElement("div");
  modal.id = "mhOnboarding";
  modal.className = "mh-onboarding";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="mh-onboarding-backdrop" data-onboarding-dismiss></div>
    <section class="mh-onboarding-dialog" role="dialog" aria-modal="true" aria-labelledby="mhOnboardingTitle">
      <header>
        <span class="mh-onboarding-kicker">MathHard</span>
        <h2 id="mhOnboardingTitle"></h2>
        <p data-onboarding-text></p>
      </header>
      <div class="mh-onboarding-content">
        <strong data-onboarding-roadmap-label></strong>
        <div class="mh-onboarding-roadmaps" data-onboarding-roadmaps></div>
      </div>
      <footer>
        <button class="btn small" type="button" data-onboarding-skip-button></button>
        <button class="btn primary" type="button" data-onboarding-start></button>
      </footer>
    </section>
  `;
  document.body.append(modal);
  return modal;
}

async function completeOnboarding({ user, preferences, roadmapId = "", route = "dashboard" }) {
  const next = mergeUiPreferences(preferences, {
    onboarding: { completed: true, version: ONBOARDING_VERSION }
  });
  if (roadmapId) await selectRoadmap(supabase, roadmapId);
  try {
    const saved = await saveUiPreferences(supabase, next);
    writeLocal(user.id, saved.onboarding);
    window.dispatchEvent(new CustomEvent("mh:ui-preferences-updated", {
      detail: { preferences: saved }
    }));
    location.hash = `#${route}`;
    return saved;
  } catch (error) {
    writeLocal(user.id, next.onboarding);
    throw error;
  }
}

async function openForUser(user, { force = false } = {}) {
  if (!user?.id) return;
  let preferences;
  try {
    preferences = await loadUiPreferences(supabase);
  } catch {
    preferences = mergeUiPreferences({}, { onboarding: readLocal(user.id) || {} });
  }

  const completed = preferences.onboarding.completed && preferences.onboarding.version >= ONBOARDING_VERSION;
  if (completed && !force) return;

  await waitForShell();
  const copy = COPY[language()];
  const modal = createModal();
  modal.querySelector("#mhOnboardingTitle").textContent = copy.title;
  modal.querySelector("[data-onboarding-text]").textContent = copy.text;
  modal.querySelector("[data-onboarding-roadmap-label]").textContent = copy.roadmap;
  modal.querySelector("[data-onboarding-skip-button]").textContent = copy.skip;
  modal.querySelector("[data-onboarding-start]").textContent = copy.start;
  const list = modal.querySelector("[data-onboarding-roadmaps]");
  list.innerHTML = `<div class="mh-onboarding-loading">${copy.loading}</div>`;
  modal.hidden = false;
  document.body.classList.add("mh-onboarding-open");

  let selectedId = "";
  let catalog = { roadmaps: [], selectedRoadmapId: "" };
  try {
    catalog = await loadRoadmapCatalog({ supabase });
    selectedId = catalog.selectedRoadmapId || catalog.roadmaps[0]?.id || "";
    list.innerHTML = catalog.roadmaps.length ? catalog.roadmaps.map((roadmap) => {
      const text = translated(roadmap, language());
      return `
        <button class="mh-onboarding-roadmap ${roadmap.id === selectedId ? "is-selected" : ""}" type="button" data-roadmap-id="${roadmap.id}" aria-pressed="${roadmap.id === selectedId}">
          <span aria-hidden="true">${roadmap.icon || "◇"}</span>
          <div><strong>${escapeHtml(text.title)}</strong>${text.description ? `<small>${escapeHtml(text.description)}</small>` : ""}</div>
        </button>
      `;
    }).join("") : `<div class="mh-onboarding-empty">${copy.empty}</div>`;
  } catch (error) {
    const friendly = normalizeUiError(error);
    list.innerHTML = `<div class="mh-onboarding-empty"><strong>${escapeHtml(friendly.title)}</strong><span>${escapeHtml(friendly.message)}</span></div>`;
  }

  const close = () => {
    modal.hidden = true;
    modal.remove();
    document.body.classList.remove("mh-onboarding-open");
  };

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-roadmap-id]");
    if (!button) return;
    selectedId = button.dataset.roadmapId;
    list.querySelectorAll("[data-roadmap-id]").forEach((candidate) => {
      const selected = candidate === button;
      candidate.classList.toggle("is-selected", selected);
      candidate.setAttribute("aria-pressed", String(selected));
    });
  });

  modal.querySelectorAll("[data-onboarding-skip-button], [data-onboarding-dismiss]").forEach((button) => {
    button.addEventListener("click", async () => {
      try { await completeOnboarding({ user, preferences, route: "dashboard" }); }
      catch { writeLocal(user.id, { completed: true, version: ONBOARDING_VERSION }); }
      close();
    });
  });

  modal.querySelector("[data-onboarding-start]").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await completeOnboarding({ user, preferences, roadmapId: selectedId, route: selectedId ? "roadmap" : "lessons" });
      showToast(copy.saved, { tone: "success" });
      close();
    } catch (error) {
      const friendly = normalizeUiError(error);
      showToast(friendly.message || copy.error, { tone: "error", duration: 4200 });
      button.disabled = false;
    }
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function init() {
  const { data } = await supabase.auth.getSession();
  if (data?.session?.user) window.setTimeout(() => void openForUser(data.session.user), 450);

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) window.setTimeout(() => void openForUser(session.user), 450);
    else document.getElementById("mhOnboarding")?.remove();
  });

  window.addEventListener("mh:onboarding-open", async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) void openForUser(session.user, { force: true });
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else void init();
}
