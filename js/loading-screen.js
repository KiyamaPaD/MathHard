(() => {
  "use strict";

  const loader = document.getElementById("math-loader");
  if (!loader) return;

  const statusNode = loader.querySelector("[data-loading-status]");
  const actionsNode = loader.querySelector("[data-loading-actions]");
  const retryButton = loader.querySelector("[data-loading-retry]");
  const continueButton = loader.querySelector("[data-loading-continue]");
  const startedAt = performance.now();
  const minimumVisibleMs = 180;
  const slowThresholdMs = 10000;
  let finished = false;
  let slowTimer = 0;

  function language() {
    try {
      return localStorage.getItem("mh_lang") === "en" ? "en" : "ro";
    } catch {
      return "ro";
    }
  }

  const copy = {
    ro: {
      loading: "Se încarcă…",
      slow: "Încărcarea durează mai mult.",
      retry: "Reîncearcă",
      continue: "Continuă"
    },
    en: {
      loading: "Loading…",
      slow: "Loading is taking longer.",
      retry: "Retry",
      continue: "Continue"
    }
  };

  function text(key) {
    return copy[language()]?.[key] || copy.ro[key] || "";
  }

  function setStatus(message) {
    if (statusNode && typeof message === "string") {
      statusNode.textContent = message;
    }
  }

  function showActions() {
    if (!actionsNode) return;
    actionsNode.hidden = false;
    if (retryButton) retryButton.textContent = text("retry");
    if (continueButton) continueButton.textContent = text("continue");
  }

  function hideImmediately() {
    if (finished) return;
    finished = true;
    window.clearTimeout(slowTimer);
    loader.classList.add("is-hidden");
    loader.hidden = true;
    loader.setAttribute("aria-busy", "false");
  }

  function ready() {
    if (finished) return;
    finished = true;
    window.clearTimeout(slowTimer);
    const elapsed = performance.now() - startedAt;
    const delay = Math.max(0, minimumVisibleMs - elapsed);

    window.setTimeout(() => {
      loader.classList.add("is-leaving");
      loader.setAttribute("aria-busy", "false");
      window.setTimeout(() => {
        loader.hidden = true;
        loader.classList.add("is-hidden");
      }, 190);
    }, delay);
  }

  function fail(message = "") {
    if (finished) return;
    setStatus(message || text("slow"));
    showActions();
  }

  retryButton?.addEventListener("click", () => window.location.reload());
  continueButton?.addEventListener("click", hideImmediately);

  setStatus(text("loading"));
  slowTimer = window.setTimeout(() => {
    if (finished) return;
    setStatus(text("slow"));
    showActions();
  }, slowThresholdMs);

  window.MathHardLoading = Object.freeze({ ready, fail, setStatus });
})();
