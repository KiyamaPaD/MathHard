import { createMicrointeractionEngine } from "./microinteraction-engine.js?v=4j2";

const pendingCelebrations = [];
const queueEarlyCelebration = (event) => pendingCelebrations.push(event.detail || {});
window.addEventListener("mathhard:celebrate", queueEarlyCelebration);

function ensureRoot() {
  let root = document.getElementById("mhMicrointeractionRoot");
  if (!root) {
    root = document.createElement("div");
    root.id = "mhMicrointeractionRoot";
    root.setAttribute("aria-live", "polite");
    document.body.append(root);
  }
  return root;
}

function installFallback(root) {
  const render = (detail = {}) => {
    const item = document.createElement("div");
    item.className = "mh-react-fallback";
    item.setAttribute("role", "status");
    item.textContent = [detail.title, detail.subtitle].filter(Boolean).join(" · ") || "Progres salvat";
    root.append(item);
    window.setTimeout(() => item.remove(), 2600);
  };
  const onCelebrate = (event) => render(event.detail || {});
  window.addEventListener("mathhard:celebrate", onCelebrate);
  return render;
}

async function start() {
  const root = ensureRoot();
  const engine = await createMicrointeractionEngine();
  window.MathHardMotion = engine;

  const loadReactIsland = async () => {
    try {
      const { mountCelebrationIsland } = await import("./microinteractions-react-island.js?v=4i");
      window.removeEventListener("mathhard:celebrate", queueEarlyCelebration);
      mountCelebrationIsland(root, { initialEvents: pendingCelebrations.splice(0) });
      document.documentElement.classList.add("mh-react-motion-ready");
    } catch (error) {
      console.warn("React microinteraction island unavailable; using local fallback.", error);
      window.removeEventListener("mathhard:celebrate", queueEarlyCelebration);
      const renderFallback = installFallback(root);
      pendingCelebrations.splice(0).forEach(renderFallback);
    }
  };

  const needsCelebrationIsland = Boolean(document.querySelector("#xpTotalHeader, [data-game-root], #gamification"));
  if (!needsCelebrationIsland) {
    window.removeEventListener("mathhard:celebrate", queueEarlyCelebration);
    installFallback(root);
    return;
  }

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => void loadReactIsland(), { timeout: 1200 });
  } else {
    window.setTimeout(() => void loadReactIsland(), 120);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void start(), { once: true });
} else {
  void start();
}
