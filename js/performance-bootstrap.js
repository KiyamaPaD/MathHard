const moduleLoads = new Map();

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

function loadRouteModule(route) {
  if (route === "analytics") return loadModuleOnce("./analytics-controller.js");
  if (route === "gamification") return loadModuleOnce("./gamification-controller.js");
  return Promise.resolve();
}

function routeFromLocation() {
  return String(location.hash || "")
    .replace(/^#/, "")
    .trim()
    .toLowerCase();
}

function prefetchForTarget(target) {
  const routeNode = target?.closest?.("[data-shell-route]");
  const route = String(routeNode?.dataset?.shellRoute || "");
  if (route === "analytics" || route === "gamification") {
    void loadRouteModule(route);
  }
}

function init() {
  window.addEventListener("mh:analytics-route", (event) => {
    if (event.detail?.active) void loadRouteModule("analytics");
  });
  window.addEventListener("mh:gamification-route", (event) => {
    if (event.detail?.active) void loadRouteModule("gamification");
  });

  document.addEventListener("pointerover", (event) => prefetchForTarget(event.target), { passive: true });
  document.addEventListener("focusin", (event) => prefetchForTarget(event.target));

  const initialRoute = routeFromLocation();
  if (initialRoute === "analytics" || initialRoute === "gamification") {
    void loadRouteModule(initialRoute);
  }

  scheduleIdle(() => void loadModuleOnce("./section-layout-controller.js"), 500);
  scheduleIdle(() => void loadModuleOnce("./quick-nav-controller.js"), 900);
  scheduleIdle(() => void loadModuleOnce("./onboarding-controller.js"), 1300);
  scheduleIdle(() => void loadModuleOnce("./runtime-diagnostics.js"), 2200);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}
