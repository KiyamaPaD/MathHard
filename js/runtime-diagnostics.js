const STORAGE_KEY = "mh_runtime_diagnostics_v1";
const MAX_EVENTS = 120;
const BUILD_LABEL = "phase-18c-mobile-hardening";

function getStorage() {
  try {
    return globalThis.sessionStorage || null;
  } catch {
    return null;
  }
}

function redactString(value) {
  return String(value ?? "")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted-jwt]")
    .replace(/sb_(?:publishable|secret)_[A-Za-z0-9_-]+/gi, "[redacted-supabase-key]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "[redacted-uuid]")
    .slice(0, 4000);
}

function serializeValue(value, depth = 0) {
  if (depth > 3) return "[max-depth]";
  if (value == null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return redactString(value);
  if (value instanceof Error) {
    return {
      name: redactString(value.name),
      message: redactString(value.message),
      stack: redactString(value.stack || "")
    };
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => serializeValue(item, depth + 1));
  if (typeof value === "object") {
    const output = {};
    for (const [key, item] of Object.entries(value).slice(0, 30)) {
      if (/token|password|authorization|apikey|session/i.test(key)) {
        output[key] = "[redacted]";
      } else {
        output[key] = serializeValue(item, depth + 1);
      }
    }
    return output;
  }
  return redactString(value);
}

function readEvents() {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.slice(-MAX_EVENTS) : [];
  } catch {
    try { storage.removeItem(STORAGE_KEY); } catch {}
    return [];
  }
}

function writeEvents(events) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    // Diagnostics must never break the application.
  }
}

export function recordDiagnostic(scope, error = null, context = {}) {
  const events = readEvents();
  events.push({
    at: new Date().toISOString(),
    scope: redactString(scope || "unknown"),
    error: serializeValue(error),
    context: serializeValue(context),
    path: redactString(globalThis.location?.pathname || ""),
    online: globalThis.navigator?.onLine ?? null
  });
  writeEvents(events);
}

export function clearDiagnostics() {
  try { getStorage()?.removeItem(STORAGE_KEY); } catch {}
}

function elementDescriptor(element) {
  if (!element || element.nodeType !== 1) return "unknown";
  const tag = String(element.tagName || "node").toLowerCase();
  const id = element.id ? `#${redactString(element.id).replace(/[^a-z0-9_-]/gi, "")}` : "";
  const classes = [...(element.classList || [])]
    .slice(0, 3)
    .map((name) => redactString(name).replace(/[^a-z0-9_-]/gi, ""))
    .filter(Boolean)
    .map((name) => `.${name}`)
    .join("");
  return `${tag}${id}${classes}`.slice(0, 180);
}

function rounded(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : 0;
}

function isInsideHorizontalScroller(element, viewportWidth) {
  let current = element?.parentElement || null;
  while (current && current !== globalThis.document?.body) {
    const style = globalThis.getComputedStyle?.(current);
    const rect = current.getBoundingClientRect?.();
    const scrollable = ["auto", "scroll"].includes(style?.overflowX)
      && current.scrollWidth > current.clientWidth + 1;
    const contained = rect && rect.left >= -1 && rect.right <= viewportWidth + 1;
    if (scrollable && contained) return true;
    current = current.parentElement;
  }
  return false;
}

export function collectLayoutDiagnostics({ limit = 24 } = {}) {
  const documentRef = globalThis.document;
  if (!documentRef?.documentElement || !documentRef.body) {
    return {
      viewportWidth: globalThis.innerWidth || 0,
      pageWidth: 0,
      overflowCount: 0,
      overflowingElements: []
    };
  }

  const viewportWidth = documentRef.documentElement.clientWidth || globalThis.innerWidth || 0;
  const pageWidth = Math.max(
    documentRef.documentElement.scrollWidth || 0,
    documentRef.body.scrollWidth || 0
  );
  const overflowingElements = [];
  const maxItems = Math.max(1, Math.min(60, Number(limit) || 24));

  for (const element of documentRef.body.querySelectorAll("*")) {
    if (overflowingElements.length >= maxItems) break;
    if (element.closest?.("[data-layout-audit-ignore]")) continue;

    const rect = element.getBoundingClientRect?.();
    if (!rect || rect.width <= 0 || rect.height <= 0) continue;
    const style = globalThis.getComputedStyle?.(element);
    if (style?.display === "none" || style?.visibility === "hidden") continue;

    const escapesLeft = rect.left < -1;
    const escapesRight = rect.right > viewportWidth + 1;
    if (!escapesLeft && !escapesRight) continue;
    if (isInsideHorizontalScroller(element, viewportWidth)) continue;

    const overflowX = style?.overflowX || "visible";
    const intentionallyScrollable = ["auto", "scroll"].includes(overflowX)
      && element.scrollWidth > element.clientWidth + 1;
    if (intentionallyScrollable && rect.left >= -1 && rect.right <= viewportWidth + 1) continue;

    overflowingElements.push({
      element: elementDescriptor(element),
      left: rounded(rect.left),
      right: rounded(rect.right),
      width: rounded(rect.width),
      clientWidth: element.clientWidth || 0,
      scrollWidth: element.scrollWidth || 0,
      position: style?.position || "",
      overflowX
    });
  }

  return {
    viewportWidth,
    pageWidth,
    overflowCount: overflowingElements.length,
    overflowingElements
  };
}

function getPerformanceSnapshot() {
  const documentRef = globalThis.document;
  const navigation = globalThis.performance?.getEntriesByType?.("navigation")?.[0];
  return {
    domNodes: documentRef?.getElementsByTagName?.("*")?.length || 0,
    stylesheets: documentRef?.styleSheets?.length || 0,
    scripts: documentRef?.scripts?.length || 0,
    navigation: navigation ? {
      domInteractive: rounded(navigation.domInteractive),
      domContentLoaded: rounded(navigation.domContentLoadedEventEnd),
      loadComplete: rounded(navigation.loadEventEnd),
      transferSize: navigation.transferSize || 0,
      decodedBodySize: navigation.decodedBodySize || 0
    } : null
  };
}

export function getDiagnosticReport() {
  return {
    build: BUILD_LABEL,
    generatedAt: new Date().toISOString(),
    page: {
      path: globalThis.location?.pathname || "",
      language: globalThis.document?.documentElement?.lang || "",
      readyState: globalThis.document?.readyState || "",
      online: globalThis.navigator?.onLine ?? null,
      viewport: {
        width: globalThis.innerWidth || 0,
        height: globalThis.innerHeight || 0
      }
    },
    browser: {
      userAgent: redactString(globalThis.navigator?.userAgent || ""),
      language: globalThis.navigator?.language || ""
    },
    layout: collectLayoutDiagnostics(),
    performance: getPerformanceSnapshot(),
    events: readEvents()
  };
}

export function downloadDiagnosticReport() {
  const report = JSON.stringify(getDiagnosticReport(), null, 2);
  const blob = new Blob([report], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `mathhard-debug-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function installDebugButton() {
  const params = new URLSearchParams(globalThis.location?.search || "");
  if (params.get("debug") !== "1" || !document.body || document.getElementById("mhDebugExportBtn")) return;

  const button = document.createElement("button");
  button.id = "mhDebugExportBtn";
  button.type = "button";
  button.textContent = "🐞 Export debug";
  button.setAttribute("aria-label", "Export MathHard diagnostic report");
  button.style.cssText = [
    "position:fixed",
    "left:16px",
    "bottom:16px",
    "z-index:12000",
    "padding:10px 14px",
    "border-radius:999px",
    "border:1px solid rgba(248,113,113,.65)",
    "background:rgba(69,10,10,.94)",
    "color:#fff",
    "font-weight:800",
    "cursor:pointer"
  ].join(";");
  button.addEventListener("click", downloadDiagnosticReport);
  document.body.appendChild(button);
}

function install() {
  globalThis.addEventListener?.("error", (event) => {
    if (event?.target && event.target !== globalThis) {
      recordDiagnostic("resource-error", null, {
        tag: event.target.tagName || "",
        source: event.target.src || event.target.href || ""
      });
      return;
    }
    recordDiagnostic("window-error", event?.error || event?.message || "Unknown error", {
      filename: event?.filename || "",
      line: event?.lineno || 0,
      column: event?.colno || 0
    });
  }, true);

  globalThis.addEventListener?.("unhandledrejection", (event) => {
    recordDiagnostic("unhandled-rejection", event?.reason || "Unknown rejection");
  });

  globalThis.addEventListener?.("offline", () => recordDiagnostic("network-offline"));
  globalThis.addEventListener?.("online", () => recordDiagnostic("network-online"));
  globalThis.addEventListener?.("keydown", (event) => {
    if (event.altKey && event.shiftKey && event.key.toLowerCase() === "d") {
      event.preventDefault();
      downloadDiagnosticReport();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installDebugButton, { once: true });
  } else {
    installDebugButton();
  }
}

install();

globalThis.MathHardDiagnostics = Object.freeze({
  clear: clearDiagnostics,
  collectLayout: collectLayoutDiagnostics,
  download: downloadDiagnosticReport,
  getReport: getDiagnosticReport,
  record: recordDiagnostic
});
