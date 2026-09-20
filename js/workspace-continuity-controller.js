const VERSION = 1;
const TTL = 7 * 24 * 60 * 60 * 1000;
const CONTENT_PREFIX = "mh_content_workspace_v1";
const ADMIN_PREFIX = "mh_admin_workspace_v1";
const SCROLL_PREFIX = "mh_workspace_scroll_v1";

function storage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}
function scope(value) {
  const raw = String(value || "guest").trim() || "guest";
  return encodeURIComponent(raw.slice(0, 180));
}
function key(prefix, userId) { return `${prefix}:${scope(userId)}`; }
function readJson(storageKey, fallback = null) {
  try {
    const raw = storage()?.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed?.ts && Date.now() - Number(parsed.ts) > TTL) {
      storage()?.removeItem(storageKey);
      return fallback;
    }
    return parsed;
  } catch { return fallback; }
}
function writeJson(storageKey, value) {
  try { storage()?.setItem(storageKey, JSON.stringify(value)); } catch {}
}
function clampScroll(element, top) {
  const max = Math.max(0, Number(element?.scrollHeight || 0) - Number(element?.clientHeight || 0));
  return Math.max(0, Math.min(Number(top || 0), max));
}
function restoreElementScroll(element, top, attempts = 10) {
  if (!element || !Number.isFinite(Number(top))) return;
  const desired = Math.max(0, Number(top));
  const apply = (left) => {
    element.scrollTop = clampScroll(element, desired);
    const max = Math.max(0, element.scrollHeight - element.clientHeight);
    if (left > 0 && max + 2 < desired) setTimeout(() => apply(left - 1), 80);
  };
  requestAnimationFrame(() => requestAnimationFrame(() => apply(attempts)));
}
function routeKey() {
  return `${location.pathname}${location.hash || "#dashboard"}`;
}

export function createWorkspaceContinuityController({
  getUserId = () => "guest",
  resolveContent = () => null,
  openContent = () => {}
} = {}) {
  let mounted = false;
  let restoringContent = false;
  let restoredAdminScope = "";
  let pendingAdminScope = "";
  let scrollFrame = 0;
  let adminRestoreTimer = 0;

  const userId = () => getUserId?.() || "guest";
  const contentKey = () => key(CONTENT_PREFIX, userId());
  const adminKey = () => key(ADMIN_PREFIX, userId());
  const scrollKey = () => key(SCROLL_PREFIX, userId());

  function readContent() {
    const value = readJson(contentKey(), null);
    if (!value || value.version !== VERSION || !value.id || !["lesson", "problem", "exam"].includes(value.type)) return null;
    return value;
  }

  function persistContentFromDom({ forceClosed = false } = {}) {
    const drawer = document.getElementById("drawer");
    const viewer = document.getElementById("viewContent");
    if (!drawer) return;
    const type = String(drawer.dataset.workspaceType || "");
    const id = String(drawer.dataset.workspaceItemId || "");
    const previous = readContent();
    if (!id || !["lesson", "problem", "exam"].includes(type)) {
      if (previous && (forceClosed || drawer.classList.contains("open"))) writeJson(contentKey(), { ...previous, open: false, ts: Date.now() });
      return;
    }
    writeJson(contentKey(), {
      version: VERSION,
      open: forceClosed ? false : drawer.classList.contains("open"),
      type,
      id,
      scrollTop: Number(viewer?.scrollTop || previous?.scrollTop || 0),
      ts: Date.now()
    });
  }

  function persistRouteScroll() {
    const current = readJson(scrollKey(), { version: VERSION, entries: {} }) || { version: VERSION, entries: {} };
    const entries = current.entries && typeof current.entries === "object" ? current.entries : {};
    entries[routeKey()] = { top: Math.max(0, Math.round(window.scrollY || 0)), ts: Date.now() };
    const trimmed = Object.fromEntries(Object.entries(entries).sort((a, b) => Number(b[1]?.ts || 0) - Number(a[1]?.ts || 0)).slice(0, 24));
    writeJson(scrollKey(), { version: VERSION, entries: trimmed, ts: Date.now() });
  }

  function restoreRouteScroll() {
    const saved = readJson(scrollKey(), null);
    const top = Number(saved?.entries?.[routeKey()]?.top);
    if (!Number.isFinite(top)) return;
    let attempts = 10;
    const apply = () => {
      const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      window.scrollTo({ top: Math.max(0, Math.min(top, max)), behavior: "auto" });
      if (attempts-- > 0 && max + 2 < top) setTimeout(apply, 80);
    };
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }

  function readAdmin() {
    const saved = readJson(adminKey(), null);
    return saved && saved.version === VERSION
      ? saved
      : { version: VERSION, open: false, scrolls: {}, subtabs: {}, ts: Date.now() };
  }
  function writeAdmin(patch = {}) {
    const current = readAdmin();
    writeJson(adminKey(), {
      ...current,
      ...patch,
      scrolls: { ...(current.scrolls || {}), ...(patch.scrolls || {}) },
      subtabs: { ...(current.subtabs || {}), ...(patch.subtabs || {}) },
      version: VERSION,
      ts: Date.now()
    });
  }
  function activeAdminPanel() {
    return document.querySelector('#adminDrawer [data-admin-panel].is-active:not([hidden])');
  }
  function persistAdminScroll(panel = activeAdminPanel()) {
    if (!panel?.dataset.adminPanel) return;
    writeAdmin({ scrolls: { [panel.dataset.adminPanel]: Math.max(0, Math.round(panel.scrollTop || 0)) } });
  }
  function restoreAdminScroll() {
    const panel = activeAdminPanel();
    if (!panel?.dataset.adminPanel) return;
    const top = Number(readAdmin().scrolls?.[panel.dataset.adminPanel]);
    if (Number.isFinite(top)) restoreElementScroll(panel, top, 8);
  }

  const subtabSelectors = {
    gamification: "[data-gamification-tab]",
    community: "[data-community-tab]",
    concept: "[data-concept-view]"
  };
  function persistSubtab(target) {
    for (const [name, selector] of Object.entries(subtabSelectors)) {
      const button = target.closest?.(selector);
      if (!button) continue;
      const value = button.dataset.gamificationTab || button.dataset.communityTab || button.dataset.conceptView;
      if (value) writeAdmin({ subtabs: { [name]: value } });
      return;
    }
  }
  function restoreAdminSubtabs() {
    const saved = readAdmin().subtabs || {};
    for (const [name, selector] of Object.entries(subtabSelectors)) {
      const value = saved[name];
      if (!value) continue;
      const button = [...document.querySelectorAll(`#adminDrawer ${selector}`)].find((candidate) =>
        (candidate.dataset.gamificationTab || candidate.dataset.communityTab || candidate.dataset.conceptView) === value
      );
      if (button && !button.classList.contains("is-active")) button.click();
    }
  }
  function scheduleAdminInnerRestore() {
    clearTimeout(adminRestoreTimer);
    adminRestoreTimer = setTimeout(() => {
      restoreAdminSubtabs();
      restoreAdminScroll();
    }, 60);
  }

  function maybeRestoreAdmin() {
    const button = document.getElementById("adminBtn");
    const drawer = document.getElementById("adminDrawer");
    const currentScope = scope(userId());
    if (!button || !drawer || restoredAdminScope === currentScope || pendingAdminScope === currentScope) return;
    if (!readAdmin().open) return;
    if (button.dataset.accessState !== "granted" || button.hidden || button.disabled) return;
    pendingAdminScope = currentScope;
    button.click();
    setTimeout(() => {
      if (drawer.classList.contains("open")) return;
      if (pendingAdminScope === currentScope) pendingAdminScope = "";
      maybeRestoreAdmin();
    }, 1800);
    setTimeout(scheduleAdminInnerRestore, 120);
  }

  async function restoreContent() {
    if (restoringContent) return false;
    const drawer=document.getElementById("drawer");
    if(drawer?.classList.contains("open")&&drawer.dataset.workspaceItemId)return false;
    const saved = readContent();
    if (!saved?.open) return false;
    const item = resolveContent?.(saved.type, saved.id);
    if (!item) return false;
    restoringContent = true;
    try {
      await openContent?.(item, saved.type);
      const viewer = document.getElementById("viewContent");
      restoreElementScroll(viewer, saved.scrollTop, 14);
      if (viewer) viewer.dataset.mhRestoredScrollTop = String(Math.max(0, Number(saved.scrollTop || 0)));
      window.dispatchEvent(new CustomEvent("mathhard:workspace-restored", { detail: { type: saved.type, id: saved.id, scrollTop: Number(saved.scrollTop || 0) } }));
      return true;
    } finally {
      setTimeout(() => { restoringContent = false; }, 0);
    }
  }

  function mount() {
    if (mounted) return;
    mounted = true;
    const drawer = document.getElementById("drawer");
    const viewer = document.getElementById("viewContent");
    const adminDrawer = document.getElementById("adminDrawer");
    const adminButton = document.getElementById("adminBtn");

    window.addEventListener("scroll", () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; persistRouteScroll(); });
    }, { passive: true });
    window.addEventListener("hashchange", () => setTimeout(restoreRouteScroll, 0));
    window.addEventListener("pagehide", () => { persistRouteScroll(); persistContentFromDom(); persistAdminScroll(); });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") { persistRouteScroll(); persistContentFromDom(); persistAdminScroll(); }
    });

    viewer?.addEventListener("scroll", () => persistContentFromDom(), { passive: true });
    if (drawer) {
      new MutationObserver(() => persistContentFromDom({ forceClosed: !drawer.classList.contains("open") }))
        .observe(drawer, { attributes: true, attributeFilter: ["class", "data-workspace-type", "data-workspace-item-id"] });
    }

    adminDrawer?.addEventListener("scroll", (event) => {
      const panel = event.target.closest?.("[data-admin-panel]");
      if (panel) persistAdminScroll(panel);
    }, true);
    adminDrawer?.addEventListener("click", (event) => {
      persistSubtab(event.target);
      if (event.target.closest?.("[data-admin-panel-target]")) setTimeout(scheduleAdminInnerRestore, 0);
    });
    if (adminDrawer) {
      new MutationObserver((records) => {
        if (records.some((record) => record.type === "attributes" && record.target === adminDrawer)) {
          const open=adminDrawer.classList.contains("open");
          writeAdmin({ open });
          if(open){restoredAdminScope=scope(userId());pendingAdminScope="";scheduleAdminInnerRestore();}
        } else if (adminDrawer.classList.contains("open")) {
          scheduleAdminInnerRestore();
        }
      }).observe(adminDrawer, { attributes: true, attributeFilter: ["class", "hidden"], childList: true, subtree: true });
    }
    if (adminButton) {
      new MutationObserver(maybeRestoreAdmin).observe(adminButton, { attributes: true, attributeFilter: ["data-access-state", "hidden", "disabled", "style"] });
    }

    if(drawer?.classList.contains("open"))persistContentFromDom();
    restoreRouteScroll();
    setTimeout(maybeRestoreAdmin, 0);
  }

  return { mount, restoreContent, restoreRouteScroll, persistRouteScroll };
}
