const TEXT = {
  ro: {
    toggle: "Navigare rapidă",
    title: "Navigator MathHard",
    subtitle: "Navigare între secțiuni.",
    close: "Închide navigatorul",
    compactOn: "⚡ Mod compact activ",
    compactOff: "⚡ Ascunde intro-ul lung",
    top: "⬆️ Sus",
    expandAll: "＋ Arată toate",
    collapseAll: "− Închide toate",
    resetLayout: "↺ Resetează aspectul",
    items: {
      hub: "Antrenamentul de azi",
      roadmap: "Roadmap",
      boss: "Antrenament rapid",
      radar: "Radarul tău",
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
    subtitle: "Navigate between sections.",
    close: "Close navigator",
    compactOn: "⚡ Compact mode active",
    compactOff: "⚡ Hide the long intro",
    top: "⬆️ Top",
    expandAll: "＋ Show all",
    collapseAll: "− Close all",
    resetLayout: "↺ Reset layout",
    items: {
      hub: "Today's training",
      roadmap: "Roadmap",
      boss: "Antrenament rapid",
      radar: "Your math radar",
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
  { key: "radar", icon: "📊", kind: "anchor", target: "mhRadar" },
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

function isAdminButtonVisible() {
  const button = document.getElementById("adminBtn");
  if (!button) return false;
  return button.hidden === false
    && button.disabled === false
    && button.getAttribute("aria-hidden") === "false"
    && button.style.display !== "none";
}

function scrollToElement(element) {
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
}

function requestSectionOpen(sectionId) {
  window.dispatchEvent(new CustomEvent("mh:open-section-request", {
    detail: { sectionId },
  }));
}

function requestLayoutAction(action) {
  window.dispatchEvent(new CustomEvent("mh:section-layout-request", {
    detail: { action },
  }));
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
    <div class="mh-quick-nav-layout-actions" aria-label="Layout controls">
      <button class="mh-quick-nav-layout-action" data-layout-action="expand-all" type="button"></button>
      <button class="mh-quick-nav-layout-action" data-layout-action="collapse-all" type="button"></button>
      <button class="mh-quick-nav-layout-action" data-layout-action="reset" type="button"></button>
    </div>
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
    if (item.kind === "admin") {
      button.hidden = true;
      button.setAttribute("aria-hidden", "true");
      button.tabIndex = -1;
    }
    grid.append(button);
  }

  const closeButton = panel.querySelector("#mhQuickNavClose");
  const compactButton = panel.querySelector("#mhQuickNavCompact");
  const topButton = panel.querySelector("#mhQuickNavTop");
  const expandAllButton = panel.querySelector('[data-layout-action="expand-all"]');
  const collapseAllButton = panel.querySelector('[data-layout-action="collapse-all"]');
  const resetButton = panel.querySelector('[data-layout-action="reset"]');
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
    if (!adminItem) return;
    const authorized = isAdminButtonVisible();
    adminItem.hidden = !authorized;
    adminItem.setAttribute("aria-hidden", authorized ? "false" : "true");
    adminItem.tabIndex = authorized ? 0 : -1;
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
    expandAllButton.textContent = strings.expandAll;
    collapseAllButton.textContent = strings.collapseAll;
    resetButton.textContent = strings.resetLayout;

    for (const item of grid.querySelectorAll("[data-quick-nav-key]")) {
      const label = item.querySelector(".mh-quick-nav-item-label");
      label.textContent = strings.items[item.dataset.quickNavKey] || item.dataset.quickNavKey;
    }

    updateCompactButton();
  };

  const activateItem = (button) => {
    const { quickNavKind: kind, quickNavTarget: target } = button.dataset;

    if (kind === "anchor") {
      requestSectionOpen(target);
      setOpen(false);
      window.setTimeout(() => scrollToElement(document.getElementById(target)), 30);
      return;
    }

    if (kind === "tab") {
      requestSectionOpen("mhCatalogWorkspace");
      const tab = document.querySelector(`#tabs .tab[data-tab="${CSS.escape(target)}"]`);
      if (tab) tab.click();
      setOpen(false);
      window.setTimeout(() => {
        scrollToElement(document.querySelector("#mhCatalogWorkspace .toolbar") || document.querySelector("main .toolbar") || document.querySelector("main"));
      }, 40);
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

  panel.querySelector(".mh-quick-nav-layout-actions").addEventListener("click", (event) => {
    const button = event.target.closest("[data-layout-action]");
    if (!button) return;
    requestLayoutAction(button.dataset.layoutAction);
  });

  compactButton.addEventListener("click", () => {
    const enabled = !document.body.classList.contains("mh-compact-home");
    window.dispatchEvent(new CustomEvent("mh:compact-home-request", {
      detail: { enabled },
    }));

    if (enabled) {
      setOpen(false);
      window.setTimeout(() => {
        requestSectionOpen("mhRoadmap");
        scrollToElement(document.getElementById("mhRoadmap"));
      }, 30);
    }
  });

  topButton.addEventListener("click", () => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("mh:layout-preferences-changed", updateCompactButton);

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
      attributeFilter: ["hidden", "style", "aria-hidden", "disabled"],
    });
  }

  updateLanguage();
  updateAdminItem();
  updateActiveTab();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createQuickNav, { once: true });
} else {
  createQuickNav();
}
