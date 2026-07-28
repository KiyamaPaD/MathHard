const classicScriptLoads = new Map();

function normalizeScriptUrl(src) {
  try {
    return new URL(String(src || ""), document.baseURI).href;
  } catch {
    return String(src || "");
  }
}

export function loadClassicScriptOnce(src, {
  isReady = () => false,
  timeoutMs = 15000
} = {}) {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("A browser document is required to load scripts."));
  }
  if (isReady()) return Promise.resolve();

  const absoluteSrc = normalizeScriptUrl(src);
  if (!absoluteSrc) return Promise.reject(new TypeError("A script URL is required."));
  if (classicScriptLoads.has(absoluteSrc)) return classicScriptLoads.get(absoluteSrc);

  const promise = new Promise((resolve, reject) => {
    let settled = false;
    const existing = [...document.scripts].find((script) => script.src === absoluteSrc);
    const script = existing || document.createElement("script");
    const finish = (error = null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
      if (error) reject(error);
      else resolve();
    };
    const onLoad = () => {
      if (isReady()) finish();
      else finish(new Error(`Script loaded without exposing its runtime: ${absoluteSrc}`));
    };
    const onError = () => finish(new Error(`Could not load script: ${absoluteSrc}`));
    const timeoutId = window.setTimeout(
      () => finish(new Error(`Timed out while loading script: ${absoluteSrc}`)),
      Math.max(1000, Number(timeoutMs) || 15000)
    );

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });

    if (!existing) {
      script.src = absoluteSrc;
      script.defer = true;
      script.dataset.mhLazyRuntime = "1";
      document.head.appendChild(script);
    } else if (isReady()) {
      finish();
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
