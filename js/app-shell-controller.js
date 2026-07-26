const ROUTES = Object.freeze([
  "dashboard",
  "roadmap",
  "lessons",
  "problems",
  "exams",
  "research",
  "history",
  "xp",
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
      roadmap: ["Roadmap", "Traseul selectat, prerechizite și progres."],
      lessons: ["Lecții", "Teorie structurată și exemple."],
      problems: ["Probleme", "Antrenament, hinturi și soluții."],
      exams: ["Examene", "Simulări și rezultate."],
      research: ["Cercetare", "Concepte avansate și idei de explorat."],
      history: ["Istorie", "Oameni și idei din matematică."],
      xp: ["Progres", "XP și activitatea ta."],
    },
    nav: {
      dashboard: "Acasă",
      roadmap: "Roadmap",
      lessons: "Lecții",
      problems: "Probleme",
      exams: "Examene",
      research: "Cercetare",
      history: "Istorie",
      xp: "Progres",
      profile: "Profil",
      admin: "Admin",
      about: "Despre",
      info: "Ajutor",
      theme: "Temă",
      language: "Limbă",
      collapse: "Compactează meniul",
      expand: "Extinde meniul",
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
      profile: "Profile",
      admin: "Admin",
      about: "About",
      info: "Help",
      theme: "Theme",
      language: "Language",
      collapse: "Collapse menu",
      expand: "Expand menu",
    },
    continue: "Continue",
    menu: "Menu",
    kicker: "MathHard",
  },
};

const NAV_ITEMS = Object.freeze([
  { route: "dashboard", icon: "⌂", group: "main" },
  { route: "roadmap", icon: "◇", group: "main" },
  { route: "lessons", icon: "▤", group: "learn" },
  { route: "problems", icon: "◆", group: "learn" },
  { route: "exams", icon: "▣", group: "learn" },
  { route: "xp", icon: "↗", group: "learn" },
  { route: "research", icon: "⌁", group: "explore" },
  { route: "history", icon: "◷", group: "explore" },
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
  return `
    <button class="mh-shell-nav-button" type="button" data-shell-route="${item.route}">
      <span class="mh-shell-nav-icon" aria-hidden="true">${item.icon}</span>
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
    <button class="mh-shell-mobile-toggle" id="mhShellMobileToggle" type="button" aria-controls="mhShellSidebar" aria-expanded="false">☰</button>
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
        <button class="mh-shell-utility-button" type="button" data-shell-proxy="themeBtn" title="Theme">◐</button>
        <button class="mh-shell-utility-button" type="button" data-shell-proxy="langBtn" title="Language">文</button>
        <button class="mh-shell-utility-button" type="button" data-shell-proxy="infoBtn" title="Help">?</button>
        <button class="mh-shell-utility-button" type="button" data-shell-proxy="aboutBtn" title="About">i</button>
        <button class="mh-shell-utility-button mh-shell-sidebar-toggle" id="mhShellSidebarToggle" type="button">
          <span class="mh-shell-nav-icon" aria-hidden="true">⇤</span>
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
    </main>
    <nav class="mh-shell-bottom-nav" id="mhShellBottomNav" aria-label="Mobile navigation">
      <button type="button" data-shell-route="dashboard"><span>⌂</span><span data-shell-label="dashboard"></span></button>
      <button type="button" data-shell-route="roadmap"><span>◇</span><span data-shell-label="roadmap"></span></button>
      <button type="button" data-shell-route="lessons"><span>▤</span><span data-shell-label="lessons"></span></button>
      <button type="button" data-shell-route="exams"><span>▣</span><span data-shell-label="exams"></span></button>
      <a href="/profile.html"><span>◉</span><span data-shell-label="profile"></span></a>
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
  if (!button || button.hidden || button.getAttribute("aria-hidden") === "true") return false;
  return getComputedStyle(button).display !== "none";
}

function createAdminNavButton() {
  const nav = document.getElementById("mhShellNav");
  if (!nav || nav.querySelector('[data-shell-action="admin"]')) return;

  const button = document.createElement("button");
  button.className = "mh-shell-nav-button";
  button.type = "button";
  button.dataset.shellAction = "admin";
  button.innerHTML = `
    <span class="mh-shell-nav-icon" aria-hidden="true">⚙</span>
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

  const compact = document.body.classList.contains("mh-sidebar-compact");
  document.getElementById("mhShellSidebarToggleLabel").textContent = compact
    ? text.nav.expand
    : text.nav.collapse;

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
  if (boss) dashboardSecondary.append(boss);
  if (radar) dashboardSecondary.append(radar);
  if (roadmap) roadmapPanel.append(roadmap);
  if (catalog) catalogPanel.append(catalog);
}

function panelForRoute(route) {
  if (route === "dashboard") return "dashboard";
  if (route === "roadmap") return "roadmap";
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

function watchAdmin() {
  createAdminNavButton();
  const adminButton = document.getElementById("adminBtn");
  const shellAdmin = document.querySelector('[data-shell-action="admin"]');
  if (!adminButton || !shellAdmin) return;

  const sync = () => {
    shellAdmin.hidden = !adminVisible();
    applyLanguage();
  };
  sync();
  new MutationObserver(sync).observe(adminButton, {
    attributes: true,
    attributeFilter: ["hidden", "style", "aria-hidden"],
  });
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
