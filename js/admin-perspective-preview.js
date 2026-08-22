const PREVIEW_PARAM = "mh_preview";
const PREVIEW_MODES = new Set(["guest", "user"]);
const SUPABASE_PROJECT_REF = "wvbwbmnibibkzctiymmj";
const SUPABASE_AUTH_STORAGE_KEY = `sb-${SUPABASE_PROJECT_REF}-auth-token`;
const STYLE_ID = "mhAdminPerspectivePreviewStyles";
const CONTROLS_ID = "mhAdminPerspectiveControls";
const RIBBON_ID = "mhPerspectivePreviewRibbon";

function safeMode(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PREVIEW_MODES.has(normalized) ? normalized : "";
}

export function getAdminPerspectiveMode(href = globalThis.location?.href || "") {
  try {
    const url = new URL(href, globalThis.location?.origin || "https://mathhard.app");
    return safeMode(url.searchParams.get(PREVIEW_PARAM));
  } catch {
    return "";
  }
}

function safeLocalStorageGet(key) {
  try {
    return globalThis.localStorage?.getItem(key) || null;
  } catch {
    return null;
  }
}

function createMemoryStorage(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    }
  };
}

export function getAdminPerspectiveAuthOptions(mode = getAdminPerspectiveMode()) {
  if (!mode) {
    return {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    };
  }

  const seed = {};
  if (mode === "user") {
    const currentSession = safeLocalStorageGet(SUPABASE_AUTH_STORAGE_KEY);
    if (currentSession) seed[SUPABASE_AUTH_STORAGE_KEY] = currentSession;
  }

  return {
    persistSession: true,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: SUPABASE_AUTH_STORAGE_KEY,
    storage: createMemoryStorage(seed)
  };
}

function emptyRoleQuery() {
  const result = {
    data: null,
    error: null,
    count: 0,
    status: 200,
    statusText: "OK"
  };

  let query;
  const terminal = () => Promise.resolve(result);
  const handler = {
    get(_target, property) {
      if (property === "then") {
        return (resolve, reject) => Promise.resolve(result).then(resolve, reject);
      }
      if (property === "catch") {
        return (reject) => Promise.resolve(result).catch(reject);
      }
      if (property === "finally") {
        return (callback) => Promise.resolve(result).finally(callback);
      }
      if (property === "single" || property === "maybeSingle") return terminal;
      return () => query;
    }
  };
  query = new Proxy({}, handler);
  return query;
}

function previewAuthProxy(auth) {
  if (!auth) return auth;
  return new Proxy(auth, {
    get(target, property) {
      if (property === "signOut") {
        return (options = {}) => target.signOut({ ...options, scope: "local" });
      }
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    }
  });
}

export function wrapSupabaseForAdminPerspective(client, mode = getAdminPerspectiveMode()) {
  if (!client || !mode) return client;

  const auth = previewAuthProxy(client.auth);

  return new Proxy(client, {
    get(target, property) {
      if (property === "auth") return auth;

      if (property === "rpc") {
        return (name, args, options) => {
          if (mode === "user" && String(name) === "is_admin") {
            return Promise.resolve({ data: false, error: null });
          }
          return target.rpc(name, args, options);
        };
      }

      if (property === "from") {
        return (relation) => {
          if (mode === "user" && String(relation) === "user_roles") {
            return emptyRoleQuery();
          }
          return target.from(relation);
        };
      }

      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    }
  });
}

function currentLanguage() {
  try {
    if (globalThis.localStorage?.getItem("mh_lang") === "en") return "en";
  } catch {}
  return String(globalThis.document?.documentElement?.lang || "ro").toLowerCase().startsWith("en")
    ? "en"
    : "ro";
}

function copyFor(mode, language = currentLanguage()) {
  const ro = {
    guest: "👁 Vizitator",
    user: "👤 Utilizator",
    previewGuest: "Preview: Vizitator",
    previewUser: "Preview: Utilizator",
    close: "Închide",
    actionsLabel: "Previzualizare site"
  };
  const en = {
    guest: "👁 Guest",
    user: "👤 User",
    previewGuest: "Preview: Guest",
    previewUser: "Preview: User",
    close: "Close",
    actionsLabel: "Site preview"
  };
  const dict = language === "en" ? en : ro;
  return {
    button: mode === "guest" ? dict.guest : dict.user,
    ribbon: mode === "guest" ? dict.previewGuest : dict.previewUser,
    close: dict.close,
    actionsLabel: dict.actionsLabel
  };
}

function ensureStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mh-admin-perspective-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
    }

    .mh-admin-perspective-actions .btn {
      white-space: nowrap;
    }

    html[data-mh-perspective-preview] #adminBtn,
    html[data-mh-perspective-preview] #adminDrawer {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    .mh-perspective-preview-ribbon {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 2147483000;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 9px 8px 11px;
      border: 1px solid var(--border, rgba(255,255,255,.14));
      border-radius: 999px;
      background: color-mix(in srgb, var(--card, #111827) 94%, transparent);
      color: var(--text, #f8fafc);
      box-shadow: 0 14px 36px rgba(0,0,0,.22);
      backdrop-filter: blur(16px);
      font: 700 .78rem/1.1 system-ui, sans-serif;
    }

    .mh-perspective-preview-ribbon button {
      min-height: 30px;
      padding: 5px 9px;
      border: 1px solid var(--border, rgba(255,255,255,.14));
      border-radius: 999px;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }

    .mh-perspective-preview-ribbon button:hover {
      background: color-mix(in srgb, var(--card, #111827) 72%, var(--text, #fff) 8%);
    }

    @media (max-width: 820px) {
      #adminDrawer .mh-admin-topbar {
        flex-wrap: wrap;
      }

      .mh-admin-perspective-actions {
        order: 3;
        width: 100%;
        margin-left: 0;
      }

      .mh-admin-perspective-actions .btn {
        flex: 1 1 0;
        justify-content: center;
      }

      .mh-perspective-preview-ribbon {
        right: 10px;
        bottom: 10px;
      }
    }
  `;
  document.head.appendChild(style);
}

function buildPreviewUrl(mode) {
  const url = new URL(globalThis.location?.href || "/", globalThis.location?.origin || "https://mathhard.app");
  url.searchParams.set(PREVIEW_PARAM, mode);
  url.hash = "";
  return url.href;
}

function openPerspective(mode) {
  const safe = safeMode(mode);
  if (!safe || typeof window === "undefined") return;

  const previewUrl = buildPreviewUrl(safe);
  const previewWindow = window.open(previewUrl, "_blank");

  // Mobile browsers may block a new tab. Falling back to the current tab keeps
  // Preview usable, and the ribbon can still restore the normal session.
  if (!previewWindow) window.location.assign(previewUrl);
}

function injectAdminControls() {
  if (typeof document === "undefined" || document.getElementById(CONTROLS_ID)) return;

  const topbar = document.querySelector("#adminDrawer .mh-admin-topbar");
  if (!topbar) return;

  const controls = document.createElement("div");
  controls.id = CONTROLS_ID;
  controls.className = "mh-admin-perspective-actions";

  const guest = document.createElement("button");
  guest.type = "button";
  guest.className = "btn small";
  guest.dataset.mhPerspectiveOpen = "guest";

  const user = document.createElement("button");
  user.type = "button";
  user.className = "btn small";
  user.dataset.mhPerspectiveOpen = "user";

  controls.append(guest, user);

  const status = topbar.querySelector(".mh-admin-status");
  if (status) topbar.insertBefore(controls, status);
  else topbar.appendChild(controls);

  const refreshLabels = () => {
    const lang = currentLanguage();
    const guestCopy = copyFor("guest", lang);
    const userCopy = copyFor("user", lang);
    controls.setAttribute("aria-label", guestCopy.actionsLabel);
    guest.textContent = guestCopy.button;
    user.textContent = userCopy.button;
    guest.title = guestCopy.ribbon;
    user.title = userCopy.ribbon;
  };

  refreshLabels();

  const observer = new MutationObserver(refreshLabels);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
}

function installRibbon(mode) {
  if (typeof document === "undefined" || document.getElementById(RIBBON_ID)) return;

  document.documentElement.dataset.mhPerspectivePreview = mode;

  const ribbon = document.createElement("div");
  ribbon.id = RIBBON_ID;
  ribbon.className = "mh-perspective-preview-ribbon";
  ribbon.setAttribute("role", "status");

  const label = document.createElement("span");
  const close = document.createElement("button");
  close.type = "button";

  const refreshLabels = () => {
    const text = copyFor(mode);
    label.textContent = text.ribbon;
    close.textContent = text.close;
  };

  refreshLabels();
  ribbon.append(label, close);
  document.body.appendChild(ribbon);

  close.addEventListener("click", () => {
    const clean = new URL(window.location.href);
    clean.searchParams.delete(PREVIEW_PARAM);

    const opener = window.opener;
    if (opener && !opener.closed) {
      try { opener.focus(); } catch {}
      window.close();
    }

    // Some mobile browsers keep script-opened tabs alive even after close().
    // Always provide a deterministic way out of Preview in the current tab.
    setTimeout(() => {
      if (!window.closed) window.location.replace(clean.href);
    }, 120);
  });

  const observer = new MutationObserver(refreshLabels);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
}

function preservePreviewOnInternalLinks(mode) {
  if (typeof document === "undefined" || !mode) return;

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest?.("a[href]");
    if (!anchor || anchor.hasAttribute("download")) return;

    try {
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      url.searchParams.set(PREVIEW_PARAM, mode);
      anchor.href = url.href;
    } catch {}
  }, true);
}

let uiInstalled = false;

export function installAdminPerspectivePreviewUi(mode = getAdminPerspectiveMode()) {
  if (uiInstalled || typeof document === "undefined") return;
  uiInstalled = true;

  const run = () => {
    ensureStyles();

    if (mode) {
      installRibbon(mode);
      preservePreviewOnInternalLinks(mode);
      return;
    }

    injectAdminControls();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-mh-perspective-open]");
    if (!button) return;
    openPerspective(button.dataset.mhPerspectiveOpen);
  });
}
