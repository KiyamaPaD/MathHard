import { supabase } from "./supabase-client.js";
import {
  DEFAULT_UI_PREFERENCES,
  loadUiPreferences,
  mergeUiPreferences,
  normalizeUiPreferences,
  saveUiPreferences,
} from "./ui-preferences-repository.js";

const CACHE_PREFIX = "mh_ui_preferences_v1";
const LEGACY_COMPACT_KEY = "mh_quick_nav_compact_v1";
const SAVE_DELAY_MS = 450;

const SECTION_CONFIG = Object.freeze([
  {
    key: "hub",
    id: "mhHub",
    titles: { ro: "🔥 Antrenamentul de azi", en: "🔥 Today's training" },
  },
  {
    key: "roadmap",
    id: "mhRoadmap",
    titles: { ro: "🗺️ Plan de studiu", en: "🗺️ Roadmap" },
  },
  {
    key: "boss",
    id: "mhBoss",
    titles: { ro: "Antrenament rapid", en: "Quick practice" },
  },
  {
    key: "radar",
    id: "mhRadar",
    titles: { ro: "📊 Radarul tău", en: "📊 Your math radar" },
  },
  {
    key: "catalog",
    id: "mhCatalogWorkspace",
    titles: {
      ro: "📚 Lecții, probleme și examene",
      en: "📚 Lessons, problems and exams",
    },
  },
]);

const TEXT = Object.freeze({
  ro: {
    open: "Deschide",
    close: "Închide",
    saved: "Aspectul paginii a fost salvat în cont.",
    localOnly: "Aspectul a fost păstrat pe acest dispozitiv.",
  },
  en: {
    open: "Open",
    close: "Close",
    saved: "Page layout saved to your account.",
    localOnly: "Layout saved on this device.",
  },
});

function getLanguage() {
  return document.documentElement.lang?.toLowerCase().startsWith("en") ? "en" : "ro";
}

function cacheKey(userId) {
  return `${CACHE_PREFIX}:${userId}`;
}

function readLocalPreferences(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    return raw ? normalizeUiPreferences(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function readLegacyCompactPreference() {
  try {
    return localStorage.getItem(LEGACY_COMPACT_KEY) === "1";
  } catch {
    return false;
  }
}

function clearLegacyCompactPreference() {
  try {
    localStorage.removeItem(LEGACY_COMPACT_KEY);
  } catch {
    // Optional migration only.
  }
}

function writeLocalPreferences(userId, preferences) {
  if (!userId) return;
  try {
    localStorage.setItem(
      cacheKey(userId),
      JSON.stringify(normalizeUiPreferences(preferences))
    );
  } catch {
    // The current page remains usable without local storage.
  }
}

function createToast() {
  const existing = document.getElementById("mhLayoutSaveToast");
  if (existing) return existing;

  const toast = document.createElement("div");
  toast.id = "mhLayoutSaveToast";
  toast.className = "mh-layout-save-toast";
  toast.hidden = true;
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.append(toast);
  return toast;
}

function buildSectionShell(config) {
  const section = document.getElementById(config.id);
  if (!section) return null;

  if (section.dataset.mhCollapsibleReady === "true") {
    return {
      ...config,
      section,
      body: section.querySelector(".mh-collapsible-section-body"),
      label: section.querySelector(".mh-section-collapse-label"),
      button: section.querySelector(".mh-section-collapse-toggle"),
      buttonText: section.querySelector(".mh-section-collapse-toggle-text"),
      chevron: section.querySelector(".mh-section-collapse-chevron"),
    };
  }

  const body = document.createElement("div");
  body.className = "mh-collapsible-section-body";
  body.id = `mhSectionBody-${config.key}`;

  while (section.firstChild) {
    body.append(section.firstChild);
  }

  const control = document.createElement("div");
  control.className = "mh-section-collapse-control";
  control.innerHTML = `
    <strong class="mh-section-collapse-label"></strong>
    <button
      class="mh-section-collapse-toggle"
      type="button"
      aria-controls="${body.id}"
      aria-expanded="true"
      data-mh-section-toggle="${config.key}"
    >
      <span class="mh-section-collapse-toggle-text"></span>
      <span class="mh-section-collapse-chevron" aria-hidden="true">⌃</span>
    </button>
  `;

  section.dataset.mhCollapsibleReady = "true";
  section.dataset.mhSectionKey = config.key;
  section.classList.add("mh-collapsible-section");
  section.append(control, body);

  return {
    ...config,
    section,
    body,
    label: control.querySelector(".mh-section-collapse-label"),
    button: control.querySelector(".mh-section-collapse-toggle"),
    buttonText: control.querySelector(".mh-section-collapse-toggle-text"),
    chevron: control.querySelector(".mh-section-collapse-chevron"),
  };
}

function createController() {
  const shells = SECTION_CONFIG.map(buildSectionShell).filter(Boolean);
  if (!shells.length) return;

  const toast = createToast();
  let toastTimer = null;
  let saveTimer = null;
  let hydrationToken = 0;
  let saveRevision = 0;
  let activeUserId = null;
  let state = normalizeUiPreferences(DEFAULT_UI_PREFERENCES);

  const showToast = (message, tone = "ok") => {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.dataset.tone = tone;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 2200);
  };

  const updateLanguage = () => {
    const language = getLanguage();
    const strings = TEXT[language];

    for (const shell of shells) {
      const title = shell.titles[language] || shell.titles.ro;
      const expanded = state.sections[shell.key] !== false;
      shell.label.textContent = title;
      shell.buttonText.textContent = expanded ? strings.close : strings.open;
      shell.button.setAttribute(
        "aria-label",
        `${expanded ? strings.close : strings.open}: ${title}`
      );
      shell.button.title = `${expanded ? strings.close : strings.open}: ${title}`;
    }
  };

  const dispatchState = () => {
    window.dispatchEvent(new CustomEvent("mh:layout-preferences-changed", {
      detail: { preferences: normalizeUiPreferences(state) },
    }));
  };

  const applyState = (nextState, { announce = true } = {}) => {
    state = normalizeUiPreferences(nextState);
    document.body.classList.toggle("mh-compact-home", state.compactHome);

    for (const shell of shells) {
      const expanded = state.sections[shell.key] !== false;
      shell.body.hidden = !expanded;
      shell.section.classList.toggle("is-collapsed", !expanded);
      shell.button.setAttribute("aria-expanded", String(expanded));
      shell.chevron.textContent = expanded ? "⌃" : "⌄";
    }

    updateLanguage();
    if (announce) dispatchState();
  };

  const persistNow = async () => {
    const userIdAtStart = activeUserId;
    if (!userIdAtStart) return;

    const revisionAtStart = ++saveRevision;
    const stateAtStart = normalizeUiPreferences(state);
    writeLocalPreferences(userIdAtStart, stateAtStart);

    try {
      const saved = await saveUiPreferences(supabase, stateAtStart, { userId: activeUserId });
      if (
        activeUserId !== userIdAtStart ||
        revisionAtStart !== saveRevision
      ) return;

      state = saved;
      writeLocalPreferences(userIdAtStart, state);
      applyState(state);
      showToast(TEXT[getLanguage()].saved, "ok");
    } catch (error) {
      console.warn("MathHard UI preferences could not be synced:", error);
      if (activeUserId === userIdAtStart) {
        showToast(TEXT[getLanguage()].localOnly, "warning");
      }
    }
  };

  const schedulePersist = () => {
    window.clearTimeout(saveTimer);
    saveRevision += 1;
    if (activeUserId) writeLocalPreferences(activeUserId, state);
    saveTimer = window.setTimeout(persistNow, SAVE_DELAY_MS);
  };

  const setSectionExpanded = (
    key,
    expanded,
    { persist = true, scroll = false } = {}
  ) => {
    if (!(key in state.sections)) return;

    state = mergeUiPreferences(state, {
      sections: { [key]: Boolean(expanded) },
    });
    applyState(state);
    if (persist) schedulePersist();

    if (scroll && expanded) {
      const shell = shells.find((candidate) => candidate.key === key);
      window.setTimeout(() => {
        shell?.section.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 20);
    }
  };

  const setAllSections = (expanded) => {
    const sections = Object.fromEntries(
      shells.map((shell) => [shell.key, Boolean(expanded)])
    );
    state = mergeUiPreferences(state, { sections });
    applyState(state);
    schedulePersist();
  };

  for (const shell of shells) {
    shell.button.addEventListener("click", () => {
      setSectionExpanded(shell.key, shell.body.hidden);
    });
  }

  window.addEventListener("mh:compact-home-request", (event) => {
    state = mergeUiPreferences(state, {
      compactHome: Boolean(event.detail?.enabled),
    });
    applyState(state);
    schedulePersist();
  });

  window.addEventListener("mh:section-layout-request", (event) => {
    const action = event.detail?.action;
    if (action === "expand-all") setAllSections(true);
    if (action === "collapse-all") setAllSections(false);
    if (action === "reset") {
      state = normalizeUiPreferences(DEFAULT_UI_PREFERENCES);
      applyState(state);
      schedulePersist();
    }
  });

  window.addEventListener("mh:ui-preferences-updated", (event) => {
    const incoming = normalizeUiPreferences(event.detail?.preferences || {});
    state = mergeUiPreferences(state, { onboarding: incoming.onboarding });
    if (activeUserId) writeLocalPreferences(activeUserId, state);
  });

  window.addEventListener("mh:open-section-request", (event) => {
    const sectionId = String(event.detail?.sectionId || "");
    const shell = shells.find((candidate) => candidate.id === sectionId);
    if (!shell) return;

    const hiddenByCompactMode = ["hub", "boss", "radar"].includes(shell.key);
    if (hiddenByCompactMode && state.compactHome) {
      state = mergeUiPreferences(state, { compactHome: false });
    }

    state = mergeUiPreferences(state, {
      sections: { [shell.key]: true },
    });
    applyState(state);
    schedulePersist();
  });

  const languageObserver = new MutationObserver(updateLanguage);
  languageObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });

  const hydrateForUser = async (user) => {
    const token = ++hydrationToken;
    window.clearTimeout(saveTimer);
    saveRevision += 1;
    activeUserId = user?.id || null;
    state = normalizeUiPreferences(DEFAULT_UI_PREFERENCES);

    if (!activeUserId) {
      applyState(state);
      return;
    }

    const local = readLocalPreferences(activeUserId);
    const legacyCompact = readLegacyCompactPreference();
    if (local) {
      state = local;
    } else if (legacyCompact) {
      state = mergeUiPreferences(state, { compactHome: true });
    }
    applyState(state);

    try {
      let remote = await loadUiPreferences(supabase, { userId: user.id });
      if (token !== hydrationToken || activeUserId !== user.id) return;

      if (!local && legacyCompact && !remote.compactHome) {
        remote = mergeUiPreferences(remote, { compactHome: true });
        remote = await saveUiPreferences(supabase, remote, { userId: user.id });
        if (token !== hydrationToken || activeUserId !== user.id) return;
      }

      state = remote;
      writeLocalPreferences(activeUserId, state);
      clearLegacyCompactPreference();
      applyState(state);
    } catch (error) {
      console.warn("MathHard UI preferences could not be loaded:", error);
    }
  };

  applyState(state, { announce: false });

  supabase.auth.getSession()
    .then(({ data, error }) => {
      if (error) throw error;
      return hydrateForUser(data?.session?.user || null);
    })
    .catch((error) => {
      console.warn("MathHard UI preference session could not be restored:", error);
    });

  supabase.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => hydrateForUser(session?.user || null), 0);
  });

  window.MathHardSectionLayout = Object.freeze({
    getPreferences: () => normalizeUiPreferences(state),
    setSectionExpanded,
    expandAll: () => setAllSections(true),
    collapseAll: () => setAllSections(false),
    reset: () => {
      state = normalizeUiPreferences(DEFAULT_UI_PREFERENCES);
      applyState(state);
      schedulePersist();
    },
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createController, { once: true });
} else {
  createController();
}
