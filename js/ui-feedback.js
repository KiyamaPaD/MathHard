const STATE_ICONS = Object.freeze({
  empty: "○",
  error: "!",
  auth: "↗",
  offline: "↯",
  success: "✓"
});

function currentLanguage() {
  if (typeof document !== "undefined" && document.documentElement.lang?.toLowerCase().startsWith("en")) {
    return "en";
  }
  try {
    return localStorage.getItem("mh_lang") === "en" ? "en" : "ro";
  } catch {
    return "ro";
  }
}

const ERROR_COPY = Object.freeze({
  ro: {
    offline: ["Fără conexiune", "Verifică internetul și încearcă din nou."],
    auth: ["Sesiune expirată", "Autentifică-te din nou pentru a continua."],
    access: ["Acces indisponibil", "Contul nu are permisiunea necesară."],
    missing: ["Serviciu indisponibil", "Funcția nu este disponibilă momentan."],
    rate: ["Prea multe cereri", "Așteaptă puțin și încearcă din nou."],
    conflict: ["Acțiune blocată", "Elementul este folosit în altă zonă."],
    generic: ["Nu s-a putut încărca", "Încearcă din nou. Dacă problema continuă, exportă raportul debug."]
  },
  en: {
    offline: ["Offline", "Check your connection and try again."],
    auth: ["Session expired", "Sign in again to continue."],
    access: ["Access unavailable", "This account does not have the required permission."],
    missing: ["Service unavailable", "This feature is temporarily unavailable."],
    rate: ["Too many requests", "Wait a moment and try again."],
    conflict: ["Action blocked", "This item is referenced elsewhere."],
    generic: ["Unable to load", "Try again. If the issue continues, export the debug report."]
  }
});

export function normalizeUiError(error, { language = currentLanguage() } = {}) {
  const copy = ERROR_COPY[language] || ERROR_COPY.ro;
  const code = String(error?.code || error?.status || "").toUpperCase();
  const message = String(error?.message || error || "").toLowerCase();
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;

  let key = "generic";
  if (offline || message.includes("failed to fetch") || message.includes("networkerror") || message.includes("network request")) {
    key = "offline";
  } else if (["28000", "401", "PGRST301"].includes(code) || message.includes("jwt") || message.includes("authentication required")) {
    key = "auth";
  } else if (["42501", "403"].includes(code) || message.includes("not allowed") || message.includes("permission denied")) {
    key = "access";
  } else if (["PGRST202", "404", "P0002"].includes(code) || message.includes("could not find the function")) {
    key = "missing";
  } else if (code === "429" || message.includes("rate limit")) {
    key = "rate";
  } else if (code === "23503" || message.includes("foreign key constraint") || message.includes("still referenced")) {
    key = "conflict";
  }

  const [title, description] = copy[key];
  return { key, title, message: description, code };
}

export function createSkeletonMarkup({ cards = 4, lines = 3 } = {}) {
  const safeCards = Math.max(1, Math.min(12, Number(cards) || 4));
  const safeLines = Math.max(1, Math.min(6, Number(lines) || 3));
  return `
    <div class="mh-ui-skeleton-grid" aria-hidden="true">
      ${Array.from({ length: safeCards }, (_, index) => `
        <article class="mh-ui-skeleton-card ${index === 0 ? "is-wide" : ""}">
          <i class="mh-ui-skeleton-line is-title"></i>
          ${Array.from({ length: safeLines }, () => '<i class="mh-ui-skeleton-line"></i>').join("")}
        </article>
      `).join("")}
    </div>
  `;
}

export function renderUiState(container, {
  kind = "empty",
  title = "",
  message = "",
  actionLabel = "",
  onAction = null,
  skeleton = null
} = {}) {
  if (!container) return null;

  if (kind === "loading") {
    container.innerHTML = `<div class="mh-ui-state is-loading" role="status" aria-live="polite"><span class="sr-only">${title}</span>${createSkeletonMarkup(skeleton || {})}</div>`;
    container.setAttribute("aria-busy", "true");
    return container.firstElementChild;
  }

  container.setAttribute("aria-busy", "false");
  const icon = STATE_ICONS[kind] || STATE_ICONS.empty;
  container.innerHTML = `
    <div class="mh-ui-state is-${kind}" role="${kind === "error" ? "alert" : "status"}">
      <span class="mh-ui-state-icon" aria-hidden="true">${icon}</span>
      <div class="mh-ui-state-copy">
        ${title ? `<strong>${escapeHtml(title)}</strong>` : ""}
        ${message ? `<p>${escapeHtml(message)}</p>` : ""}
      </div>
      ${actionLabel ? `<button class="btn small" type="button" data-ui-state-action>${escapeHtml(actionLabel)}</button>` : ""}
    </div>
  `;
  const action = container.querySelector("[data-ui-state-action]");
  if (action && typeof onAction === "function") action.addEventListener("click", onAction);
  return container.firstElementChild;
}

export function showToast(message, { tone = "info", duration = 2600 } = {}) {
  if (typeof document === "undefined" || !message) return;
  let stack = document.getElementById("mhUiToastStack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "mhUiToastStack";
    stack.className = "mh-ui-toast-stack";
    stack.setAttribute("aria-live", "polite");
    document.body.append(stack);
  }

  const toast = document.createElement("div");
  toast.className = "mh-ui-toast";
  toast.dataset.tone = tone;
  toast.textContent = String(message);
  stack.append(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 180);
  }, Math.max(900, duration));
}

export function initConnectionFeedback() {
  if (typeof document === "undefined" || document.getElementById("mhConnectionBanner")) return;
  const banner = document.createElement("div");
  banner.id = "mhConnectionBanner";
  banner.className = "mh-connection-banner";
  banner.hidden = true;
  banner.setAttribute("role", "status");
  document.body.append(banner);

  const update = () => {
    const lang = currentLanguage();
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    banner.hidden = !offline;
    banner.textContent = lang === "en" ? "Offline. Saved data remains available." : "Fără conexiune. Datele salvate rămân disponibile.";
  };

  window.addEventListener("offline", update);
  window.addEventListener("online", () => {
    update();
    showToast(currentLanguage() === "en" ? "Connection restored" : "Conexiune restabilită", { tone: "success" });
  });
  update();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

if (typeof window !== "undefined") {
  window.MathHardUI = Object.freeze({ renderUiState, showToast, normalizeUiError });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initConnectionFeedback, { once: true });
  else initConnectionFeedback();
}
