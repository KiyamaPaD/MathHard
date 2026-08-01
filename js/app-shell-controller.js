const ROUTES = Object.freeze([
  "dashboard",
  "roadmap",
  "lessons",
  "problems",
  "exams",
  "research",
  "history",
  "xp",
  "analytics",
  "gamification",
  "leaderboards",
]);

const CATALOG_ROUTES = new Set(["lessons", "problems", "exams", "research", "history", "xp"]);
const SIDEBAR_KEY = "mh_app_shell_sidebar_v1";

function readStorage(key, fallback = "") {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Navigation remains functional without persistence.
  }
}

const TEXT = {
  ro: {
    brand: "Platformă de matematică",
    groups: { main: "Principal", learn: "Învățare", explore: "Explorează" },
    routes: {
      dashboard: ["Acasă", "Următorul pas, progresul de azi și acces rapid."],
      roadmap: ["Plan de studiu", "Traseul selectat, prerechizitele și progresul tău."],
      lessons: ["Lecții", "Teorie structurată și exemple."],
      problems: ["Probleme", "Antrenament, indicii și soluții."],
      exams: ["Examene", "Simulări și rezultate."],
      research: ["Cercetare", "Concepte avansate și idei de explorat."],
      history: ["Istorie", "Oameni și idei din matematică."],
      xp: ["Progres", "XP și activitatea ta."],
      analytics: ["Analiză", "Stăpânire, acuratețe și consecvență."],
      gamification: ["Recompense", "Nivel, obiectiv zilnic și realizări."],
      leaderboards: ["Clasamente", "Poziții locale, naționale și globale."],
    },
    nav: {
      dashboard: "Acasă",
      roadmap: "Plan de studiu",
      lessons: "Lecții",
      problems: "Probleme",
      exams: "Examene",
      research: "Cercetare",
      history: "Istorie",
      xp: "Progres",
      analytics: "Analiză",
      gamification: "Recompense",
      leaderboards: "Clasamente",
      profile: "Profil",
      admin: "Administrare",
      about: "Despre",
      info: "Ajutor",
      theme: "Temă",
      language: "Limbă",
      collapse: "Compactează meniul",
      expand: "Extinde meniul",
      closeAdmin: "Închide administrarea",
    },
    continue: "Continuă",
    menu: "Meniu",
    kicker: "MathHard",
  },
  en: {
    brand: "Math learning platform",
    groups: { main: "Main", learn: "Learning", explore: "Explore" },
    routes: {
      dashboard: ["Home", "Next step, today's progress and quick access."],
      roadmap: ["Roadmap", "Selected path, prerequisites and progress."],
      lessons: ["Lessons", "Structured theory and examples."],
      problems: ["Problems", "Practice, hints and solutions."],
      exams: ["Exams", "Simulations and results."],
      research: ["Research", "Advanced concepts and ideas to explore."],
      history: ["History", "People and ideas in mathematics."],
      xp: ["Progress", "XP and activity."],
      analytics: ["Analytics", "Mastery, accuracy and consistency."],
      gamification: ["Rewards", "Level, daily goal and achievements."],
      leaderboards: ["Leaderboards", "Local, national and global rankings."],
    },
    nav: {
      dashboard: "Home",
      roadmap: "Roadmap",
      lessons: "Lessons",
      problems: "Problems",
      exams: "Exams",
      research: "Research",
      history: "History",
      xp: "Progress",
      analytics: "Analytics",
      gamification: "Rewards",
      leaderboards: "Leaderboards",
      profile: "Profile",
      admin: "Admin",
      about: "About",
      info: "Help",
      theme: "Theme",
      language: "Language",
      collapse: "Collapse menu",
      expand: "Expand menu",
      closeAdmin: "Close Admin",
    },
    continue: "Continue",
    menu: "Menu",
    kicker: "MathHard",
  },
};

const ICONS = Object.freeze({
  dashboard: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>',
  roadmap: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 6h4a3 3 0 0 1 3 3v6a3 3 0 0 0 3 3"/><path d="m16 5 3-2 2 3-3 2"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  lessons: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z"/>',
  problems: '<path d="M4 7h10"/><path d="M4 17h10"/><path d="M7 4v6"/><path d="m17 14 4 4"/><path d="m21 14-4 4"/>',
  exams: '<path d="M8 4h8"/><path d="M9 2h6v4H9z"/><path d="M6 4H5a2 2 0 0 0-2 2v15h18V6a2 2 0 0 0-2-2h-1"/><path d="m7 12 2 2 4-4"/><path d="M7 18h10"/>',
  xp: '<circle cx="12" cy="12" r="9"/><path d="m13 5-5 8h4l-1 6 5-8h-4z"/>',
  analytics: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20V7"/><path d="M2 20h22"/>',
  gamification: '<path d="M8 4h8v3a4 4 0 0 1-8 0Z"/><path d="M8 5H4v2a4 4 0 0 0 4 4"/><path d="M16 5h4v2a4 4 0 0 1-4 4"/><path d="M12 11v5"/><path d="M8 21h8"/><path d="M9 16h6v5H9z"/>',
  leaderboards: '<path d="M4 21v-6h5v6"/><path d="M10 21V9h5v12"/><path d="M16 21V4h5v17"/>',
  research: '<path d="M9 3h6"/><path d="M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7.5 16h9"/>',
  history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M3 4v5h5"/>',
  admin: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.05.05-2.78 2.78-.05-.05A1.8 1.8 0 0 0 15 19.4a1.8 1.8 0 0 0-1 .6 1.8 1.8 0 0 0-.45 1.2V21H9v-.08a1.8 1.8 0 0 0-.45-1.2 1.8 1.8 0 0 0-1-.6 1.8 1.8 0 0 0-1.98.36l-.05.05-2.78-2.78.05-.05A1.8 1.8 0 0 0 3.15 15a1.8 1.8 0 0 0-.6-1 1.8 1.8 0 0 0-1.2-.45H1.2V9h.08a1.8 1.8 0 0 0 1.2-.45 1.8 1.8 0 0 0 .6-1 1.8 1.8 0 0 0-.36-1.98l-.05-.05 2.78-2.78.05.05A1.8 1.8 0 0 0 7.5 3.15a1.8 1.8 0 0 0 1-.6 1.8 1.8 0 0 0 .45-1.2V1.2h4.55v.08a1.8 1.8 0 0 0 .45 1.2 1.8 1.8 0 0 0 1 .6 1.8 1.8 0 0 0 1.98-.36l.05-.05 2.78 2.78-.05.05A1.8 1.8 0 0 0 19.4 7.5a1.8 1.8 0 0 0 .6 1 1.8 1.8 0 0 0 1.2.45h.08v4.55h-.08a1.8 1.8 0 0 0-1.2.45 1.8 1.8 0 0 0-.6 1Z"/>',
  theme: '<path d="M20.5 14.5A8 8 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z"/>',
  language: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7h.01"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 1 1 3.1 2.4c-.8.3-1.3.8-1.3 1.6"/><path d="M12 17h.01"/>',
  collapse: '<path d="M4 5h16v14H4z"/><path d="M9 5v14"/><path d="m15 9-3 3 3 3"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  close: '<path d="m6 6 12 12"/><path d="m18 6-12 12"/>',
});

function iconMarkup(name, className = "mh-shell-nav-icon") {
  const paths = ICONS[name] || ICONS.dashboard;
  return `<span class="${className}" aria-hidden="true"><svg viewBox="0 0 24 24">${paths}</svg></span>`;
}

const NAV_ITEMS = Object.freeze([
  { route: "dashboard", icon: "dashboard", group: "main" },
  { route: "roadmap", icon: "roadmap", group: "main" },
  { route: "profile", icon: "profile", group: "main", href: "/profile.html" },
  { route: "lessons", icon: "lessons", group: "learn" },
  { route: "problems", icon: "problems", group: "learn" },
  { route: "exams", icon: "exams", group: "learn" },
  { route: "xp", icon: "xp", group: "learn" },
  { route: "analytics", icon: "analytics", group: "learn" },
  { route: "gamification", icon: "gamification", group: "learn" },
  { route: "leaderboards", icon: "leaderboards", group: "learn" },
  { route: "research", icon: "research", group: "explore" },
  { route: "history", icon: "history", group: "explore" },
]);

export function normalizeAppRoute(value) {
  const route = String(value || "").replace(/^#/, "").trim().toLowerCase();
  return ROUTES.includes(route) ? route : "dashboard";
}

export function routeToCatalogTab(route) {
  const normalized = normalizeAppRoute(route);
  return CATALOG_ROUTES.has(normalized) ? normalized : "";
}

function language() {
  return document.documentElement.lang?.toLowerCase().startsWith("en") ? "en" : "ro";
}

function buttonMarkup(item) {
  if (item.href) {
    return `
      <a class="mh-shell-nav-button" href="${item.href}" data-shell-link="${item.route}">
        ${iconMarkup(item.icon)}
        <span class="mh-shell-nav-label" data-shell-label="${item.route}"></span>
      </a>
    `;
  }

  return `
    <button class="mh-shell-nav-button" type="button" data-shell-route="${item.route}">
      ${iconMarkup(item.icon)}
      <span class="mh-shell-nav-label" data-shell-label="${item.route}"></span>
    </button>
  `;
}

function createShellMarkup() {
  const groups = ["main", "learn", "explore"];
  const nav = groups.map((group) => `
    <div class="mh-shell-nav-group-label" data-shell-group="${group}"></div>
    ${NAV_ITEMS.filter((item) => item.group === group).map(buttonMarkup).join("")}
  `).join("");

  return `
    <button class="mh-shell-mobile-toggle" id="mhShellMobileToggle" type="button" aria-controls="mhShellSidebar" aria-expanded="false">${iconMarkup("menu", "mh-shell-mobile-icon")}</button>
    <div class="mh-shell-mobile-backdrop" id="mhShellMobileBackdrop" hidden></div>
    <aside class="mh-shell-sidebar" id="mhShellSidebar" aria-label="MathHard navigation">
      <div class="mh-shell-brand">
        <img src="/img/mathhard-logo.png" alt="" />
        <div class="mh-shell-brand-copy">
          <strong>MathHard</strong>
          <span id="mhShellBrandSubtitle"></span>
        </div>
      </div>
      <nav class="mh-shell-nav" id="mhShellNav">${nav}</nav>
      <div class="mh-shell-sidebar-footer">
        <button class="mh-shell-utility-button" type="button" data-shell-proxy="themeBtn" data-shell-utility="theme">${iconMarkup("theme", "mh-shell-utility-icon")}</button>
        <button class="mh-shell-utility-button" type="button" data-shell-proxy="langBtn" data-shell-utility="language">${iconMarkup("language", "mh-shell-utility-icon")}</button>
        <button class="mh-shell-utility-button" type="button" data-shell-proxy="infoBtn" data-shell-utility="info">${iconMarkup("help", "mh-shell-utility-icon")}</button>
        <button class="mh-shell-utility-button" type="button" data-shell-proxy="aboutBtn" data-shell-utility="about">${iconMarkup("info", "mh-shell-utility-icon")}</button>
        <button class="mh-shell-utility-button mh-shell-sidebar-toggle" id="mhShellSidebarToggle" type="button">
          ${iconMarkup("collapse")}
          <span class="mh-shell-nav-label" id="mhShellSidebarToggleLabel"></span>
        </button>
      </div>
    </aside>
    <main class="mh-shell-main" id="mhShellMain">
      <header class="mh-shell-workspace-header">
        <div>
          <span class="mh-shell-workspace-kicker" id="mhShellKicker"></span>
          <h1 class="mh-shell-workspace-title" id="mhShellTitle"></h1>
          <p class="mh-shell-workspace-description" id="mhShellDescription"></p>
        </div>
        <button class="mh-shell-continue" id="mhShellContinue" type="button"></button>
      </header>
      <section class="mh-shell-workspace-panel" data-panel="dashboard" id="mhShellPanelDashboard">
        <div class="mh-shell-dashboard-grid">
          <div class="mh-shell-dashboard-primary" id="mhShellDashboardPrimary"></div>
          <div class="mh-shell-dashboard-secondary" id="mhShellDashboardSecondary"></div>
        </div>
      </section>
      <section class="mh-shell-workspace-panel" data-panel="roadmap" id="mhShellPanelRoadmap" hidden></section>
      <section class="mh-shell-workspace-panel" data-panel="catalog" id="mhShellPanelCatalog" hidden></section>
      <section class="mh-shell-workspace-panel" data-panel="analytics" id="mhShellPanelAnalytics" hidden></section>
      <section class="mh-shell-workspace-panel" data-panel="gamification" id="mhShellPanelGamification" hidden></section>
      <section class="mh-shell-workspace-panel" data-panel="leaderboards" id="mhShellPanelLeaderboards" hidden></section>
    </main>
    <button class="mh-admin-floating-close" id="mhAdminFloatingClose" type="button" hidden>
      ${iconMarkup("close", "mh-shell-close-icon")}
      <span data-admin-close-label>Închide administrarea</span>
    </button>
    <nav class="mh-shell-bottom-nav" id="mhShellBottomNav" aria-label="Mobile navigation">
      <button type="button" data-shell-route="dashboard">${iconMarkup("dashboard", "mh-shell-bottom-icon")}<span data-shell-label="dashboard"></span></button>
      <button type="button" data-shell-route="roadmap">${iconMarkup("roadmap", "mh-shell-bottom-icon")}<span data-shell-label="roadmap"></span></button>
      <button type="button" data-shell-route="lessons">${iconMarkup("lessons", "mh-shell-bottom-icon")}<span data-shell-label="lessons"></span></button>
      <button type="button" data-shell-route="exams">${iconMarkup("exams", "mh-shell-bottom-icon")}<span data-shell-label="exams"></span></button>
      <a href="/profile.html">${iconMarkup("profile", "mh-shell-bottom-icon")}<span data-shell-label="profile"></span></a>
    </nav>
  `;
}

function setMobileMenu(open) {
  document.body.classList.toggle("mh-mobile-nav-open", open);
  const toggle = document.getElementById("mhShellMobileToggle");
  const backdrop = document.getElementById("mhShellMobileBackdrop");
  toggle?.setAttribute("aria-expanded", String(open));
  if (backdrop) backdrop.hidden = !open;
}

function proxyClick(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.click();
}

function adminVisible() {
  const button = document.getElementById("adminBtn");
  if (!button) return false;

  // The original Admin button is the single source of truth. app.js keeps it
  // fail-closed until both the session and the admin role are verified.
  return button.hidden === false
    && button.disabled === false
    && button.getAttribute("aria-hidden") === "false"
    && button.style.display !== "none";
}

function createAdminNavButton() {
  const nav = document.getElementById("mhShellNav");
  if (!nav || nav.querySelector('[data-shell-action="admin"]')) return;

  const button = document.createElement("button");
  button.className = "mh-shell-nav-button";
  button.type = "button";
  button.dataset.shellAction = "admin";
  button.innerHTML = `
    ${iconMarkup("admin")}
    <span class="mh-shell-nav-label" data-shell-label="admin"></span>
  `;
  button.hidden = true;
  button.addEventListener("click", () => proxyClick("adminBtn"));
  nav.append(button);
}

function applyLanguage() {
  const text = TEXT[language()];
  document.getElementById("mhShellBrandSubtitle").textContent = text.brand;
  document.getElementById("mhShellKicker").textContent = text.kicker;
  document.getElementById("mhShellContinue").textContent = text.continue;

  for (const [group, label] of Object.entries(text.groups)) {
    const node = document.querySelector(`[data-shell-group="${group}"]`);
    if (node) node.textContent = label;
  }

  for (const node of document.querySelectorAll("[data-shell-label]")) {
    const key = node.dataset.shellLabel;
    node.textContent = text.nav[key] || key;
  }

  const utilityLabels = {
    theme: text.nav.theme,
    language: text.nav.language,
    info: text.nav.info,
    about: text.nav.about,
  };
  for (const node of document.querySelectorAll("[data-shell-utility]")) {
    const label = utilityLabels[node.dataset.shellUtility] || "MathHard";
    node.title = label;
    node.setAttribute("aria-label", label);
  }

  const mobileToggle = document.getElementById("mhShellMobileToggle");
  if (mobileToggle) {
    mobileToggle.title = text.menu;
    mobileToggle.setAttribute("aria-label", text.menu);
  }

  const compact = document.body.classList.contains("mh-sidebar-compact");
  document.getElementById("mhShellSidebarToggleLabel").textContent = compact
    ? text.nav.expand
    : text.nav.collapse;

  const adminCloseLabel = document.querySelector("[data-admin-close-label]");
  if (adminCloseLabel) adminCloseLabel.textContent = text.nav.closeAdmin;

  const route = normalizeAppRoute(location.hash);
  updateWorkspaceCopy(route);
}

function updateWorkspaceCopy(route) {
  const text = TEXT[language()];
  const [title, description] = text.routes[route] || text.routes.dashboard;
  const titleNode = document.getElementById("mhShellTitle");
  const descriptionNode = document.getElementById("mhShellDescription");
  if (titleNode) titleNode.textContent = title;
  if (descriptionNode) descriptionNode.textContent = description;
}

function moveExistingContent() {
  const dashboardPrimary = document.getElementById("mhShellDashboardPrimary");
  const dashboardSecondary = document.getElementById("mhShellDashboardSecondary");
  const roadmapPanel = document.getElementById("mhShellPanelRoadmap");
  const catalogPanel = document.getElementById("mhShellPanelCatalog");

  const hero = document.getElementById("hero");
  const hub = document.getElementById("mhHub");
  const boss = document.getElementById("mhBoss");
  const radar = document.getElementById("mhRadar");
  const roadmap = document.getElementById("mhRoadmap");
  const catalog = document.getElementById("mhCatalogWorkspace");

  if (hero) dashboardPrimary.append(hero);
  if (hub) dashboardPrimary.append(hub);
  if (boss) {
    // The quick-training card duplicated actions already available in the hub
    // and catalog. Keep the legacy node mounted for compatibility, but remove
    // it from the visible dashboard.
    dashboardSecondary.append(boss);
    boss.hidden = true;
    boss.setAttribute("aria-hidden", "true");
  }
  if (radar) dashboardSecondary.append(radar);
  if (roadmap) roadmapPanel.append(roadmap);
  if (catalog) catalogPanel.append(catalog);
}

function panelForRoute(route) {
  if (route === "dashboard") return "dashboard";
  if (route === "roadmap") return "roadmap";
  if (route === "analytics") return "analytics";
  if (route === "gamification") return "gamification";
  if (route === "leaderboards") return "leaderboards";
  return "catalog";
}

function selectCatalogTab(route) {
  const tab = routeToCatalogTab(route);
  if (!tab) return;
  const tabNode = document.querySelector(`#tabs .tab[data-tab="${tab}"]`);
  if (tabNode && !tabNode.classList.contains("active")) tabNode.click();
}

function activateRoute(rawRoute, { replace = false, scroll = true } = {}) {
  const route = normalizeAppRoute(rawRoute);
  const panel = panelForRoute(route);

  for (const node of document.querySelectorAll(".mh-shell-workspace-panel")) {
    node.hidden = node.dataset.panel !== panel;
  }

  for (const node of document.querySelectorAll("[data-shell-route]")) {
    if (node.dataset.shellRoute === route) node.setAttribute("aria-current", "page");
    else node.removeAttribute("aria-current");
  }

  if (panel === "roadmap") {
    window.dispatchEvent(new CustomEvent("mh:open-section-request", { detail: { sectionId: "mhRoadmap" } }));
  }
  if (panel === "catalog") {
    window.dispatchEvent(new CustomEvent("mh:open-section-request", { detail: { sectionId: "mhCatalogWorkspace" } }));
    selectCatalogTab(route);
  }
  window.dispatchEvent(new CustomEvent("mh:analytics-route", {
    detail: { active: panel === "analytics" }
  }));
  window.dispatchEvent(new CustomEvent("mh:gamification-route", {
    detail: { active: panel === "gamification" }
  }));
  window.dispatchEvent(new CustomEvent("mh:leaderboards-route", {
    detail: { active: panel === "leaderboards" }
  }));

  updateWorkspaceCopy(route);
  const hash = `#${route}`;
  if (location.hash !== hash) {
    history[replace ? "replaceState" : "pushState"]({}, "", hash);
  }
  writeStorage("mh_active_workspace_v1", route);
  setMobileMenu(false);
  if (scroll) window.scrollTo({ top: 0, behavior: "auto" });
}

function bindContinue() {
  document.getElementById("mhShellContinue")?.addEventListener("click", () => {
    const activeExam = readStorage("mh_active_exam_lock_v2") || readStorage("mh_active_exam_lock_v1");
    if (activeExam) {
      activateRoute("exams");
      return;
    }

    activateRoute("roadmap");
    window.setTimeout(() => {
      const next = document.querySelector('[data-roadmap-next="1"]');
      next?.click();
    }, 90);
  });
}

function bindNavigation() {
  document.querySelectorAll("[data-shell-route]").forEach((button) => {
    button.addEventListener("click", () => activateRoute(button.dataset.shellRoute));
  });

  document.querySelectorAll("[data-shell-proxy]").forEach((button) => {
    button.addEventListener("click", () => proxyClick(button.dataset.shellProxy));
  });

  document.getElementById("mhShellSidebarToggle")?.addEventListener("click", () => {
    const compact = !document.body.classList.contains("mh-sidebar-compact");
    document.body.classList.toggle("mh-sidebar-compact", compact);
    writeStorage(SIDEBAR_KEY, compact ? "1" : "0");
    applyLanguage();
  });

  document.getElementById("mhShellMobileToggle")?.addEventListener("click", () => {
    setMobileMenu(!document.body.classList.contains("mh-mobile-nav-open"));
  });
  document.getElementById("mhShellMobileBackdrop")?.addEventListener("click", () => setMobileMenu(false));

  document.querySelectorAll("#tabs .tab[data-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      const route = normalizeAppRoute(tab.dataset.tab);
      if (CATALOG_ROUTES.has(route)) activateRoute(route, { scroll: false });
    });
  });

  window.addEventListener("popstate", () => activateRoute(location.hash, { replace: true }));
  window.addEventListener("hashchange", () => activateRoute(location.hash, { replace: true }));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMobileMenu(false);
  });
}

function bindAdminClose() {
  const drawer = document.getElementById("adminDrawer");
  const floatingClose = document.getElementById("mhAdminFloatingClose");
  if (!drawer || !floatingClose) return;

  const sync = () => {
    const authorized = adminVisible();
    const open = authorized && drawer.classList.contains("open");
    floatingClose.hidden = !open;
    document.body.classList.toggle("mh-admin-drawer-open", open);

    // A stale drawer must never remain open after logout or a failed role check.
    if (!authorized && drawer.classList.contains("open")) {
      drawer.classList.remove("open");
    }
  };

  floatingClose.addEventListener("click", () => proxyClick("closeAdmin"));
  new MutationObserver(sync).observe(drawer, {
    attributes: true,
    attributeFilter: ["class"],
  });
  sync();
}

function watchAdmin() {
  createAdminNavButton();
  const adminButton = document.getElementById("adminBtn");
  const shellAdmin = document.querySelector('[data-shell-action="admin"]');
  if (!adminButton || !shellAdmin) return;

  const sync = () => {
    const authorized = adminVisible();
    shellAdmin.hidden = !authorized;
    shellAdmin.setAttribute("aria-hidden", authorized ? "false" : "true");
    shellAdmin.tabIndex = authorized ? 0 : -1;

    if (!authorized) {
      document.getElementById("adminDrawer")?.classList.remove("open");
    }
    applyLanguage();
  };

  // Run after the shell class is applied as well, avoiding the pre-auth flash
  // that could occur during initial DOM setup.
  shellAdmin.hidden = true;
  shellAdmin.setAttribute("aria-hidden", "true");
  shellAdmin.tabIndex = -1;
  queueMicrotask(sync);
  new MutationObserver(sync).observe(adminButton, {
    attributes: true,
    attributeFilter: ["hidden", "style", "aria-hidden", "disabled"],
  });
}

function bindExclusiveFullscreenSurfaces() {
  const contentDrawer = document.getElementById("drawer");
  const adminDrawer = document.getElementById("adminDrawer");
  if (!contentDrawer) return;

  const sync = () => {
    const contentOpen = contentDrawer.classList.contains("open");
    const adminOpen = Boolean(adminDrawer?.classList.contains("open"));

    // Only one full-screen surface may own the viewport at a time.
    if (contentOpen && adminOpen) {
      adminDrawer.classList.remove("open");
    }

    document.body.classList.toggle("mh-content-workspace-open", contentOpen);
    if (contentOpen) setMobileMenu(false);
  };

  new MutationObserver(sync).observe(contentDrawer, {
    attributes: true,
    attributeFilter: ["class"],
  });

  if (adminDrawer) {
    new MutationObserver(() => {
      if (adminDrawer.classList.contains("open") && contentDrawer.classList.contains("open")) {
        contentDrawer.classList.remove("open");
      }
      sync();
    }).observe(adminDrawer, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  sync();
}

function init() {
  if (document.getElementById("mhAppShell")) return;

  const shell = document.createElement("div");
  shell.id = "mhAppShell";
  shell.className = "mh-app-shell";
  shell.innerHTML = createShellMarkup();

  const anchor = document.getElementById("hero") || document.querySelector("body > header")?.nextSibling;
  if (anchor?.parentNode) anchor.parentNode.insertBefore(shell, anchor);
  else document.body.append(shell);

  if (readStorage(SIDEBAR_KEY) === "1") {
    document.body.classList.add("mh-sidebar-compact");
  }

  moveExistingContent();
  bindNavigation();
  bindContinue();
  watchAdmin();
  bindAdminClose();
  bindExclusiveFullscreenSurfaces();

  const languageObserver = new MutationObserver(applyLanguage);
  languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  document.body.classList.add("mh-shell-ready");
  const saved = normalizeAppRoute(location.hash || readStorage("mh_active_workspace_v1"));
  activateRoute(saved, { replace: true, scroll: false });
  applyLanguage();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
}
