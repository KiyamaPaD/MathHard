const classicScriptLoads = new Map();

function normalizeScriptUrl(src) {
  try {
    return new URL(String(src || ""), document.baseURI).href;
  } catch {
    return String(src || "");
  }
}

function runtimeIsReady(isReady) {
  try {
    return Boolean(isReady());
  } catch {
    return false;
  }
}

function removeFailedLazyScript(script) {
  if (script?.dataset?.mhLazyRuntime === "1") {
    script.dataset.mhLazyRuntimeState = "failed";
    script.remove?.();
  }
}

export function loadClassicScriptOnce(src, {
  isReady = () => false,
  timeoutMs = 15000
} = {}) {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("A browser document is required to load scripts."));
  }
  if (runtimeIsReady(isReady)) return Promise.resolve();

  const absoluteSrc = normalizeScriptUrl(src);
  if (!absoluteSrc) return Promise.reject(new TypeError("A script URL is required."));
  if (classicScriptLoads.has(absoluteSrc)) return classicScriptLoads.get(absoluteSrc);

  const promise = new Promise((resolve, reject) => {
    let settled = false;
    let existing = [...document.scripts].find((candidate) => candidate.src === absoluteSrc) || null;

    // A previous lazy attempt may have failed after its load/error event. Such
    // a node cannot emit another event, so remove it and create a fresh request.
    if (
      existing?.dataset?.mhLazyRuntime === "1" &&
      existing.dataset.mhLazyRuntimeState === "failed"
    ) {
      existing.remove?.();
      existing = null;
    }

    const script = existing || document.createElement("script");
    const createdByLoader = !existing;
    let timeoutId = null;

    const finish = (error = null) => {
      if (settled) return;
      settled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
      if (error) {
        removeFailedLazyScript(script);
        reject(error);
      } else {
        if (script.dataset?.mhLazyRuntime === "1") {
          script.dataset.mhLazyRuntimeState = "loaded";
        }
        resolve();
      }
    };
    const onLoad = () => {
      if (runtimeIsReady(isReady)) finish();
      else finish(new Error(`Script loaded without exposing its runtime: ${absoluteSrc}`));
    };
    const onError = () => finish(new Error(`Could not load script: ${absoluteSrc}`));

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });

    timeoutId = window.setTimeout(
      () => finish(new Error(`Timed out while loading script: ${absoluteSrc}`)),
      Math.max(1000, Number(timeoutMs) || 15000)
    );

    if (createdByLoader) {
      script.src = absoluteSrc;
      script.defer = true;
      script.dataset.mhLazyRuntime = "1";
      script.dataset.mhLazyRuntimeState = "loading";
      document.head.appendChild(script);
    } else if (runtimeIsReady(isReady)) {
      finish();
    } else if (
      script.dataset?.mhLazyRuntime === "1" &&
      script.dataset.mhLazyRuntimeState === "loaded"
    ) {
      // The script has already completed but the expected runtime is absent.
      // Fail immediately instead of waiting for an event that cannot fire.
      finish(new Error(`Loaded script runtime is unavailable: ${absoluteSrc}`));
    }
  }).catch((error) => {
    classicScriptLoads.delete(absoluteSrc);
    throw error;
  });

  classicScriptLoads.set(absoluteSrc, promise);
  return promise;
}

export function loadNumberLineRuntime() {
  return loadClassicScriptOnce("/js/animation-numberline.js", {
    isReady: () => typeof globalThis.MH_NumberLinePy?.mount === "function"
  }).then(() => globalThis.MH_NumberLinePy);
}
