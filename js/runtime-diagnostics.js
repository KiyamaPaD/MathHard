const STORAGE_KEY = "mh_runtime_diagnostics_v1";
const MAX_EVENTS = 120;
const BUILD_LABEL = "stability-reset-2026-07";

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
  download: downloadDiagnosticReport,
  getReport: getDiagnosticReport,
  record: recordDiagnostic
});
