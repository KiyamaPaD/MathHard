import {
  loadAdminAuditLog,
  loadAdminEntityVersions,
  restoreAdminVersion
} from "./admin-history-repository.js";
import {
  adminEntityLabel,
  changedFields,
  filterAuditEntries,
  formatAdminTimestamp,
  normalizeAuditEntry,
  normalizeVersionEntry,
  operationLabel
} from "./admin-history-model.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeLanguage(value) {
  return String(value || "ro").toLowerCase().startsWith("en") ? "en" : "ro";
}

function previewValue(value) {
  if (value == null || value === "") return "—";
  if (typeof value === "string") return value.length > 180 ? `${value.slice(0, 177)}…` : value;
  const text = JSON.stringify(value);
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}

export function createAdminHistoryController({
  root,
  supabase,
  getLanguage = () => "ro",
  onRestored = async () => {}
} = {}) {
  if (!root) return null;

  const state = {
    enabled: false,
    loading: false,
    entries: [],
    selectedId: 0,
    versions: [],
    versionsLoading: false,
    filters: { query: "", tableName: "all", operation: "all" },
    error: "",
    status: ""
  };

  function language() {
    return safeLanguage(getLanguage());
  }

  function selectedEntry() {
    return state.entries.find((entry) => entry.id === state.selectedId) || null;
  }

  function tableOptions() {
    const values = [...new Set(state.entries.map((entry) => entry.tableName).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "ro"));
    return [`<option value="all">${language() === "en" ? "All entities" : "Toate entitățile"}</option>`]
      .concat(values.map((value) => `<option value="${escapeHtml(value)}"${state.filters.tableName === value ? " selected" : ""}>${escapeHtml(adminEntityLabel(value, language()))}</option>`))
      .join("");
  }

  function renderList(entries) {
    if (!entries.length) {
      return `<div class="mh-admin-history-empty">${language() === "en" ? "No matching changes." : "Nu există modificări pentru filtrele selectate."}</div>`;
    }
    return entries.map((entry) => {
      const active = entry.id === state.selectedId;
      const fields = changedFields(entry);
      return `
        <div class="mh-admin-history-item${active ? " is-active" : ""}">
          <button class="mh-admin-history-row${active ? " is-active" : ""}" type="button" data-admin-audit-id="${entry.id}" aria-expanded="${active}">
            <span class="mh-admin-history-operation is-${escapeHtml(entry.operation)}">${escapeHtml(operationLabel(entry.operation, language()))}</span>
            <strong>${escapeHtml(adminEntityLabel(entry.tableName, language()))} · ${escapeHtml(entry.entityId)}</strong>
            <small>${escapeHtml(fields.slice(0, 4).join(", ") || "—")}</small>
            <time>${escapeHtml(formatAdminTimestamp(entry.createdAt, language()))}</time>
          </button>
          ${active ? `<div class="mh-admin-history-inline-detail">${renderDetails(entry)}</div>` : ""}
        </div>`;
    }).join("");
  }

  function renderVersions(entry) {
    if (!entry) return "";
    if (state.versionsLoading) {
      return `<div class="mh-admin-history-empty">${language() === "en" ? "Loading versions…" : "Se încarcă versiunile…"}</div>`;
    }
    if (!state.versions.length) {
      return `<div class="mh-admin-history-empty">${language() === "en" ? "No saved versions." : "Nu există versiuni salvate."}</div>`;
    }
    return state.versions.map((version) => `
      <article class="mh-admin-version-row">
        <div>
          <strong>${escapeHtml(operationLabel(version.operation, language()))}</strong>
          <span>${escapeHtml(formatAdminTimestamp(version.createdAt, language()))} · ${escapeHtml(version.actorLabel)}</span>
        </div>
        <button class="btn small" type="button" data-admin-restore-version="${version.id}" ${version.restorable ? "" : "disabled"}>
          ${language() === "en" ? "Restore" : "Restaurează"}
        </button>
      </article>`).join("");
  }

  function renderDetails(entry) {
    if (!entry) {
      return `<div class="mh-admin-history-empty">${language() === "en" ? "Select a change." : "Selectează o modificare."}</div>`;
    }
    const fields = changedFields(entry);
    const rows = fields.map((field) => `
      <div class="mh-admin-diff-row">
        <strong>${escapeHtml(field)}</strong>
        <div><span>${language() === "en" ? "Before" : "Înainte"}</span><code>${escapeHtml(previewValue(entry.before[field]))}</code></div>
        <div><span>${language() === "en" ? "After" : "După"}</span><code>${escapeHtml(previewValue(entry.after[field]))}</code></div>
      </div>`).join("");

    return `
      <div class="mh-admin-history-detail-head">
        <div>
          <span class="mh-admin-eyebrow">${escapeHtml(adminEntityLabel(entry.tableName, language()))}</span>
          <h3>${escapeHtml(entry.entityId)}</h3>
          <p>${escapeHtml(operationLabel(entry.operation, language()))} · ${escapeHtml(formatAdminTimestamp(entry.createdAt, language()))} · ${escapeHtml(entry.actorLabel)}</p>
        </div>
      </div>
      <section class="mh-admin-diff-list">
        ${rows || `<div class="mh-admin-history-empty">${language() === "en" ? "No field-level difference." : "Nu există diferențe la nivel de câmp."}</div>`}
      </section>
      <section class="mh-admin-version-list">
        <div class="mh-admin-history-subhead"><strong>${language() === "en" ? "Versions" : "Versiuni"}</strong><span>${state.versions.length}</span></div>
        ${renderVersions(entry)}
      </section>`;
  }

  function render() {
    root.hidden = !state.enabled;
    if (!state.enabled) return;
    const entries = filterAuditEntries(state.entries, state.filters);
    const entry = entries.find((candidate) => candidate.id === state.selectedId) || null;
    root.innerHTML = `
      <div class="mh-admin-history-toolbar">
        <label><span>${language() === "en" ? "Search" : "Caută"}</span><input type="search" data-admin-history-query value="${escapeHtml(state.filters.query)}" placeholder="${language() === "en" ? "ID, entity, field..." : "ID, entitate, câmp..."}"></label>
        <label><span>${language() === "en" ? "Entity" : "Entitate"}</span><select data-admin-history-table>${tableOptions()}</select></label>
        <label><span>${language() === "en" ? "Operation" : "Operație"}</span><select data-admin-history-operation>
          <option value="all">${language() === "en" ? "All" : "Toate"}</option>
          <option value="insert"${state.filters.operation === "insert" ? " selected" : ""}>${language() === "en" ? "Created" : "Create"}</option>
          <option value="update"${state.filters.operation === "update" ? " selected" : ""}>${language() === "en" ? "Updated" : "Modificări"}</option>
          <option value="delete"${state.filters.operation === "delete" ? " selected" : ""}>${language() === "en" ? "Deleted" : "Ștergeri"}</option>
        </select></label>
        <button class="btn small" type="button" data-admin-history-refresh ${state.loading ? "disabled" : ""}>${state.loading ? "…" : "Refresh"}</button>
      </div>
      ${state.error ? `<div class="mh-admin-history-message is-error">${escapeHtml(state.error)}</div>` : ""}
      ${state.status ? `<div class="mh-admin-history-message">${escapeHtml(state.status)}</div>` : ""}
      <div class="mh-admin-history-layout">
        <div class="mh-admin-history-list">${renderList(entries)}</div>
        <aside class="mh-admin-history-detail">${renderDetails(entry)}</aside>
      </div>`;
    bind();
  }

  let versionsRequestEpoch = 0;

  async function loadVersions(entry) {
    const requestEpoch = ++versionsRequestEpoch;
    if (!entry) {
      state.versions = [];
      state.versionsLoading = false;
      return;
    }
    const selectedId = entry.id;
    state.versionsLoading = true;
    try {
      const payload = await loadAdminEntityVersions(supabase, entry.tableName, entry.entityId);
      if (requestEpoch !== versionsRequestEpoch || state.selectedId !== selectedId) return;
      state.versions = (payload?.versions || []).map(normalizeVersionEntry);
    } catch (error) {
      if (requestEpoch !== versionsRequestEpoch || state.selectedId !== selectedId) return;
      state.versions = [];
      state.error = error?.message || String(error);
    } finally {
      if (requestEpoch === versionsRequestEpoch && state.selectedId === selectedId) {
        state.versionsLoading = false;
      }
    }
  }

  async function selectEntry(entryId) {
    const nextId = Number(entryId || 0);
    if (!nextId) return;
    state.selectedId = nextId;
    state.error = "";
    state.versions = [];
    state.versionsLoading = true;
    render();
    await loadVersions(selectedEntry());
    if (state.selectedId === nextId) render();
  }

  async function load({ preserveSelection = true } = {}) {
    if (!state.enabled || state.loading) return;
    state.loading = true;
    state.error = "";
    render();
    try {
      const payload = await loadAdminAuditLog(supabase, { limit: 300 });
      state.entries = (payload?.entries || []).map(normalizeAuditEntry);
      if (!preserveSelection || !state.entries.some((entry) => entry.id === state.selectedId)) {
        state.selectedId = state.entries[0]?.id || 0;
      }
      state.versions = [];
      state.versionsLoading = Boolean(state.selectedId);
      await loadVersions(selectedEntry());
    } catch (error) {
      state.error = error?.message || String(error);
    } finally {
      state.loading = false;
      render();
    }
  }

  async function restore(versionId) {
    const version = state.versions.find((item) => item.id === Number(versionId));
    if (!version) return;
    const confirmed = confirm(language() === "en"
      ? `Restore ${version.entityId} to this version?`
      : `Restaurezi ${version.entityId} la această versiune?`);
    if (!confirmed) return;
    state.status = language() === "en" ? "Restoring…" : "Se restaurează…";
    state.error = "";
    render();
    try {
      await restoreAdminVersion(supabase, version.id);
      await onRestored(version);
      state.status = language() === "en" ? "Version restored." : "Versiunea a fost restaurată.";
      await load({ preserveSelection: false });
    } catch (error) {
      state.error = error?.message || String(error);
      state.status = "";
      render();
    }
  }

  function bind() {
    root.querySelector("[data-admin-history-query]")?.addEventListener("input", (event) => {
      state.filters.query = event.target.value;
      render();
      const replacement = root.querySelector("[data-admin-history-query]");
      replacement?.focus();
      replacement?.setSelectionRange(replacement.value.length, replacement.value.length);
    });
    root.querySelector("[data-admin-history-table]")?.addEventListener("change", (event) => {
      state.filters.tableName = event.target.value;
      render();
    });
    root.querySelector("[data-admin-history-operation]")?.addEventListener("change", (event) => {
      state.filters.operation = event.target.value;
      render();
    });
    root.querySelector("[data-admin-history-refresh]")?.addEventListener("click", () => void load());
    for (const button of root.querySelectorAll("[data-admin-audit-id]")) {
      button.addEventListener("click", () => void selectEntry(button.dataset.adminAuditId));
    }
    for (const button of root.querySelectorAll("[data-admin-restore-version]")) {
      button.addEventListener("click", () => void restore(button.dataset.adminRestoreVersion));
    }
  }

  return {
    setAdmin(value) {
      state.enabled = Boolean(value);
      if (!state.enabled) {
        state.entries = [];
        state.versions = [];
        state.versionsLoading = false;
        state.selectedId = 0;
        state.error = "";
        state.status = "";
      }
      render();
    },
    load,
    invalidate() {
      state.entries = [];
      state.versions = [];
      state.versionsLoading = false;
      state.selectedId = 0;
    },
    render
  };
}
