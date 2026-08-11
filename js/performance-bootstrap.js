const moduleLoads = new Map();
let initialized = false;

const ROUTE_MODULES = Object.freeze({
  analytics: "./analytics-controller.js",
  gamification: "./gamification-controller.js",
  leaderboards: "./community-leaderboard-controller.js"
});

function loadModuleOnce(path) {
  if (moduleLoads.has(path)) return moduleLoads.get(path);
  const promise = import(path).catch((error) => {
    moduleLoads.delete(path);
    console.warn(`MathHard lazy module could not be loaded: ${path}`, error);
    throw error;
  });
  moduleLoads.set(path, promise);
  return promise;
}

function scheduleIdle(callback, timeout = 1200) {
  if (typeof requestIdleCallback === "function") {
    return requestIdleCallback(callback, { timeout });
  }
  return window.setTimeout(callback, Math.min(timeout, 500));
}

function routeFromLocation() {
  return String(location.hash || "")
    .replace(/^#/, "")
    .trim()
    .toLowerCase();
}

function routeHost(route) {
  if (route === "analytics") return document.getElementById("mhShellPanelAnalytics");
  if (route === "gamification") return document.getElementById("mhShellPanelGamification");
  if (route === "leaderboards") return document.getElementById("mhShellPanelLeaderboards");
  return null;
}

function routeCopy(route, kind) {
  const english = document.documentElement.lang?.toLowerCase().startsWith("en");
  if (kind === "loading") {
    if (route === "analytics") return english ? "Loading analytics…" : "Se încarcă analytics…";
    if (route === "leaderboards") return english ? "Loading leaderboard…" : "Se încarcă clasamentul…";
    return english ? "Loading progress…" : "Se încarcă progresul…";
  }
  return english
    ? "This workspace could not be loaded."
    : "Acest workspace nu a putut fi încărcat.";
}

function renderRouteLoading(route) {
  const host = routeHost(route);
  if (!host || host.childElementCount > 0) return;
  host.innerHTML = `
    <div class="mh-ui-state is-loading" data-lazy-route-state="${route}">
      <div class="mh-ui-spinner" aria-hidden="true"></div>
      <p>${routeCopy(route, "loading")}</p>
    </div>
  `;
}

function renderRouteError(route) {
  const host = routeHost(route);
  if (!host || routeFromLocation() !== route) return;
  host.innerHTML = `
    <div class="mh-ui-state is-error" data-lazy-route-state="${route}">
      <p>${routeCopy(route, "error")}</p>
      <button class="btn small primary" type="button" data-lazy-route-retry="${route}">
        ${document.documentElement.lang?.toLowerCase().startsWith("en") ? "Retry" : "Reîncearcă"}
      </button>
    </div>
  `;
  host.querySelector(`[data-lazy-route-retry="${route}"]`)?.addEventListener("click", () => {
    host.innerHTML = "";
    void requestRouteModule(route, { showState: true });
  }, { once: true });
}

function safelyLoadModule(path) {
  return loadModuleOnce(path).catch(() => null);
}

function requestRouteModule(route, { showState = false } = {}) {
  const path = ROUTE_MODULES[route];
  if (!path) return Promise.resolve(null);
  if (showState) renderRouteLoading(route);
  return loadModuleOnce(path).catch((error) => {
    if (showState) renderRouteError(route);
    return null;
  });
}

function prefetchForTarget(target) {
  const routeNode = target?.closest?.("[data-shell-route]");
  const route = String(routeNode?.dataset?.shellRoute || "");
  if (ROUTE_MODULES[route]) {
    void requestRouteModule(route);
  }
}

function init() {
  if (initialized) return;
  initialized = true;

  window.addEventListener("mh:analytics-route", (event) => {
    if (event.detail?.active) void requestRouteModule("analytics", { showState: true });
  });
  window.addEventListener("mh:gamification-route", (event) => {
    if (event.detail?.active) void requestRouteModule("gamification", { showState: true });
  });
  window.addEventListener("mh:leaderboards-route", (event) => {
    if (event.detail?.active) void requestRouteModule("leaderboards", { showState: true });
  });

  document.addEventListener("pointerover", (event) => prefetchForTarget(event.target), { passive: true });
  document.addEventListener("focusin", (event) => prefetchForTarget(event.target));

  const initialRoute = routeFromLocation();
  if (ROUTE_MODULES[initialRoute]) {
    void requestRouteModule(initialRoute, { showState: true });
  }

  scheduleIdle(() => void safelyLoadModule("./microinteractions-bootstrap.js?v=4j2"), 380);
  scheduleIdle(() => void safelyLoadModule("./ui-language-guard.js?v=4i"), 620);
  scheduleIdle(() => void safelyLoadModule("./section-layout-controller.js"), 500);
  scheduleIdle(() => void safelyLoadModule("./curriculum-ui-runtime.js?v=5b4"), 700);
  scheduleIdle(() => void safelyLoadModule("./quick-nav-controller.js"), 900);
  scheduleIdle(() => void safelyLoadModule("./onboarding-controller.js"), 1300);
  scheduleIdle(() => void safelyLoadModule("./runtime-diagnostics.js"), 2200);
  scheduleIdle(() => void safelyLoadModule("./beta-readiness-controller.js"), 2500);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}
