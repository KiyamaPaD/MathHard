const QUICK_NAV_COMPACT_KEY = "mh_quick_nav_compact_v1";

const TEXT = {
  ro: {
    toggle: "Navigare rapidă",
    title: "Navigator MathHard",
    subtitle: "Sari direct unde ai nevoie — fără doom scroll.",
    close: "Închide navigatorul",
    compactOn: "⚡ Mod compact activ",
    compactOff: "⚡ Ascunde intro-ul lung",
    top: "⬆️ Sus",
    items: {
      hub: "Antrenamentul de azi",
      roadmap: "Roadmap",
      lessons: "Lecții",
      problems: "Probleme",
      exams: "Examene",
      xp: "XP total",
      research: "Cercetare",
      history: "Istoria matematicii",
      profile: "Profilul tău",
      admin: "Admin Studio",
    },
  },
  en: {
    toggle: "Quick navigation",
    title: "MathHard Navigator",
    subtitle: "Jump straight where you need — no doom scrolling.",
    close: "Close navigator",
    compactOn: "⚡ Compact mode active",
    compactOff: "⚡ Hide the long intro",
    top: "⬆️ Top",
    items: {
      hub: "Today's training",
      roadmap: "Roadmap",
      lessons: "Lessons",
      problems: "Problems",
      exams: "Exams",
      xp: "Total XP",
      research: "Research",
      history: "Math history",
      profile: "Your profile",
      admin: "Admin Studio",
    },
  },
};

const ITEMS = [
  { key: "hub", icon: "🔥", kind: "anchor", target: "mhHub" },
  { key: "roadmap", icon: "🗺️", kind: "anchor", target: "mhRoadmap" },
  { key: "lessons", icon: "📘", kind: "tab", target: "lessons" },
  { key: "problems", icon: "🧩", kind: "tab", target: "problems" },
  { key: "exams", icon: "📑", kind: "tab", target: "exams" },
  { key: "xp", icon: "⚡", kind: "tab", target: "xp" },
  { key: "research", icon: "🔬", kind: "tab", target: "research" },
  { key: "history", icon: "🕰️", kind: "tab", target: "history" },
  { key: "profile", icon: "📊", kind: "link", target: "/profile.html" },
  { key: "admin", icon: "🛠️", kind: "admin", target: "adminBtn" },
];

function getLanguage() {
  return document.documentElement.lang?.toLowerCase().startsWith("en") ? "en" : "ro";
}

function safeReadCompactPreference() {
  try {
    return localStorage.getItem(QUICK_NAV_COMPACT_KEY) === "1";
  } catch {
    return false;
  }
}

function safeWriteCompactPreference(enabled) {
  try {
    localStorage.setItem(QUICK_NAV_COMPACT_KEY, enabled ? "1" : "0");
  } catch {
    // Compact mode remains usable for the current page even when storage is unavailable.
  }
}

function isAdminButtonVisible() {
  const button = document.getElementById("adminBtn");
  if (!button || button.hidden || button.getAttribute("aria-hidden") === "true") return false;
  return window.getComputedStyle(button).display !== "none";
}

function scrollToElement(element) {
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
}

function createQuickNav() {
  if (document.getElementById("mhQuickNavToggle")) return;

  const toggle = document.createElement("button");
  toggle.id = "mhQuickNavToggle";
  toggle.className = "mh-quick-nav-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-haspopup", "dialog");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "mhQuickNavPanel");
  toggle.innerHTML = `
    <span class="mh-quick-nav-toggle-icon" aria-hidden="true">🧭</span>
    <span class="mh-quick-nav-toggle-label"></span>
  `;

  const backdrop = document.createElement("div");
  backdrop.id = "mhQuickNavBackdrop";
  backdrop.className = "mh-quick-nav-backdrop";
  backdrop.hidden = true;

  const panel = document.createElement("section");
  panel.id = "mhQuickNavPanel";
  panel.className = "mh-quick-nav-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "mhQuickNavTitle");
  panel.hidden = true;
  panel.innerHTML = `
    <div class="mh-quick-nav-head">
      <div>
        <h2 class="mh-quick-nav-title" id="mhQuickNavTitle"></h2>
        <p class="mh-quick-nav-subtitle" id="mhQuickNavSubtitle"></p>
      </div>
      <button class="mh-quick-nav-close" id="mhQuickNavClose" type="button">✖</button>
    </div>
    <div class="mh-quick-nav-grid" id="mhQuickNavGrid"></div>
    <div class="mh-quick-nav-footer">
      <button class="mh-quick-nav-compact" id="mhQuickNavCompact" type="button"></button>
      <button class="mh-quick-nav-top" id="mhQuickNavTop" type="button"></button>
    </div>
  `;

  document.body.append(backdrop, panel, toggle);

  const grid = panel.querySelector("#mhQuickNavGrid");
  for (const item of ITEMS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mh-quick-nav-item";
    button.dataset.quickNavKey = item.key;
    button.dataset.quickNavKind = item.kind;
    button.dataset.quickNavTarget = item.target;
    button.innerHTML = `
      <span class="mh-quick-nav-item-icon" aria-hidden="true">${item.icon}</span>
      <span class="mh-quick-nav-item-label"></span>
    `;
    grid.append(button);
  }

  const closeButton = panel.querySelector("#mhQuickNavClose");
  const compactButton = panel.querySelector("#mhQuickNavCompact");
  const topButton = panel.querySelector("#mhQuickNavTop");
  let previouslyFocused = null;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
    backdrop.hidden = !open;

    if (open) {
      previouslyFocused = document.activeElement;
      updateAdminItem();
      updateActiveTab();
      requestAnimationFrame(() => closeButton.focus());
    } else if (previouslyFocused instanceof HTMLElement) {
      previouslyFocused.focus({ preventScroll: true });
    }
  };

  const updateCompactButton = () => {
    const enabled = document.body.classList.contains("mh-compact-home");
    const strings = TEXT[getLanguage()];
    compactButton.textContent = enabled ? strings.compactOn : strings.compactOff;
    compactButton.setAttribute("aria-pressed", String(enabled));
  };

  const updateAdminItem = () => {
    const adminItem = grid.querySelector('[data-quick-nav-key="admin"]');
    if (adminItem) adminItem.hidden = !isAdminButtonVisible();
  };

  const updateActiveTab = () => {
    const activeTab = document.querySelector("#tabs .tab.active")?.dataset.tab || "";
    for (const item of grid.querySelectorAll('[data-quick-nav-kind="tab"]')) {
      if (item.dataset.quickNavTarget === activeTab) {
        item.setAttribute("aria-current", "page");
      } else {
        item.removeAttribute("aria-current");
      }
    }
  };

  const updateLanguage = () => {
    const strings = TEXT[getLanguage()];
    toggle.querySelector(".mh-quick-nav-toggle-label").textContent = strings.toggle;
    toggle.setAttribute("aria-label", strings.toggle);
    panel.querySelector("#mhQuickNavTitle").textContent = strings.title;
    panel.querySelector("#mhQuickNavSubtitle").textContent = strings.subtitle;
    closeButton.setAttribute("aria-label", strings.close);
    topButton.textContent = strings.top;

    for (const item of grid.querySelectorAll("[data-quick-nav-key]")) {
      const label = item.querySelector(".mh-quick-nav-item-label");
      label.textContent = strings.items[item.dataset.quickNavKey] || item.dataset.quickNavKey;
    }

    updateCompactButton();
  };

  const activateItem = (button) => {
    const { quickNavKind: kind, quickNavTarget: target } = button.dataset;

    if (kind === "anchor") {
      setOpen(false);
      scrollToElement(document.getElementById(target));
      return;
    }

    if (kind === "tab") {
      const tab = document.querySelector(`#tabs .tab[data-tab="${CSS.escape(target)}"]`);
      if (tab) tab.click();
      setOpen(false);
      window.setTimeout(() => {
        scrollToElement(document.querySelector("main .toolbar") || document.querySelector("main"));
      }, 30);
      return;
    }

    if (kind === "link") {
      window.location.href = target;
      return;
    }

    if (kind === "admin") {
      const adminButton = document.getElementById(target);
      setOpen(false);
      adminButton?.click();
    }
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });
  backdrop.addEventListener("click", () => setOpen(false));
  closeButton.addEventListener("click", () => setOpen(false));

  grid.addEventListener("click", (event) => {
    const button = event.target.closest(".mh-quick-nav-item");
    if (button) activateItem(button);
  });

  compactButton.addEventListener("click", () => {
    const enabled = !document.body.classList.contains("mh-compact-home");
    document.body.classList.toggle("mh-compact-home", enabled);
    safeWriteCompactPreference(enabled);
    updateCompactButton();

    if (enabled) {
      setOpen(false);
      window.setTimeout(() => scrollToElement(document.getElementById("mhRoadmap")), 20);
    }
  });

  topButton.addEventListener("click", () => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.altKey && event.key.toLowerCase() === "m") {
      event.preventDefault();
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    }
  });

  document.getElementById("tabs")?.addEventListener("click", () => {
    window.setTimeout(updateActiveTab, 0);
  });

  const languageObserver = new MutationObserver(updateLanguage);
  languageObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });

  const adminButton = document.getElementById("adminBtn");
  if (adminButton) {
    const adminObserver = new MutationObserver(updateAdminItem);
    adminObserver.observe(adminButton, {
      attributes: true,
      attributeFilter: ["hidden", "style", "aria-hidden"],
    });
  }

  document.body.classList.toggle("mh-compact-home", safeReadCompactPreference());
  updateLanguage();
  updateAdminItem();
  updateActiveTab();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createQuickNav, { once: true });
} else {
  createQuickNav();
}
