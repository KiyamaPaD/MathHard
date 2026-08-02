import {
  analyzeContentBatch,
  batchErrorLabel,
  batchExample,
  CONTENT_BATCH_MAX_BYTES
} from "./content-batch-import-model.js";
import { importContentBatchItems } from "./content-batch-import-repository.js";
import {
  applyBatchItemResult,
  applyRollbackResults,
  batchHistoryStatusLabel,
  createBatchHistoryRecord,
  finalizeBatchHistoryRecord,
  fingerprintBatchSource,
  mergeBatchRetryResults,
  recoverableBatchItems,
  rollbackCandidateItems
} from "./content-batch-history-model.js";
import { createContentBatchHistoryRepository } from "./content-batch-history-repository.js";
import { retryBatchFailures, rollbackBatchDrafts } from "./content-batch-recovery-service.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatType(type, language) {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  const labels = {
    lesson: ["Lecție", "Lesson"],
    research: ["Cercetare", "Research"],
    history: ["Istorie", "History"],
    problem: ["Problemă", "Problem"],
    exam: ["Examen", "Exam"]
  };
  return (labels[type] || [type, type])[english ? 1 : 0];
}

export function createContentBatchImportController({
  host,
  supabase,
  getLanguage = () => "ro",
  getCatalog = () => ({}),
  getUserId = () => "",
  onImported = async () => {},
  historyRepository = createContentBatchHistoryRepository(),
  confirmAction = (message) => globalThis.confirm?.(message) ?? false
} = {}) {
  if (!host) throw new Error("createContentBatchImportController requires a host element.");
  if (!supabase?.from) throw new Error("createContentBatchImportController requires Supabase.");

  const state = {
    source: "",
    analysis: null,
    busy: false,
    busyAction: "",
    results: [],
    status: "",
    history: [],
    historyLoading: false,
    historyError: ""
  };

  function language() {
    return String(getLanguage?.() || "ro").toLowerCase().startsWith("en") ? "en" : "ro";
  }

  function text(ro, en) {
    return language() === "en" ? en : ro;
  }

  function userId() {
    return String(getUserId?.() || "").trim();
  }

  function existingIds() {
    const catalog = getCatalog?.() || {};
    return {
      lesson: (catalog.lessons || []).map((item) => item?.id).filter(Boolean),
      problem: (catalog.problems || []).map((item) => item?.id).filter(Boolean),
      exam: (catalog.exams || []).map((item) => item?.id).filter(Boolean)
    };
  }

  function messageLabel(code) {
    const english = language() === "en";
    const labels = english
      ? {
          pending: "Pending",
          draft_created: "Draft created.",
          draft_recovered: "Editorial draft recovered.",
          draft_deleted: "Draft deleted.",
          rollback_available: "Rollback available.",
          editorial_state_missing: "Editorial state could not be verified.",
          content_is_published: "The item is published and cannot be rolled back."
        }
      : {
          pending: "În așteptare",
          draft_created: "Draft creat.",
          draft_recovered: "Starea editorială a fost reparată.",
          draft_deleted: "Draft șters.",
          rollback_available: "Anulare disponibilă.",
          editorial_state_missing: "Starea editorială nu a putut fi verificată.",
          content_is_published: "Materialul este publicat și nu poate fi anulat."
        };
    if (labels[code]) return labels[code];
    if (String(code).startsWith("status_")) {
      const status = String(code).slice(7);
      return english ? `Editorial status is ${status}.` : `Statusul editorial este ${status}.`;
    }
    return String(code || "");
  }

  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat(language() === "en" ? "en-GB" : "ro-RO", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value));
    } catch {
      return String(value || "");
    }
  }

  function summaryHtml() {
    const summary = state.analysis?.summary;
    if (!summary) return "";
    return `
      <div class="mh-batch-summary">
        <span><strong>${summary.total}</strong>${text("materiale", "items")}</span>
        <span><strong>${summary.valid}</strong>${text("valide", "valid")}</span>
        <span><strong>${summary.invalid}</strong>${text("cu erori", "invalid")}</span>
        <span><strong>${summary.readyForReview}</strong>${text("gata de review", "review-ready")}</span>
        <span><strong>${summary.incompleteDrafts}</strong>${text("drafturi incomplete", "incomplete drafts")}</span>
      </div>`;
  }

  function rowsHtml() {
    const items = state.analysis?.items || [];
    if (!items.length) return "";
    return `<div class="mh-batch-table-wrap"><table class="mh-batch-table">
      <thead><tr><th>#</th><th>${text("Tip", "Type")}</th><th>ID</th><th>${text("Stare", "Status")}</th><th>${text("Detalii", "Details")}</th></tr></thead>
      <tbody>${items.map((item) => {
        const errors = (item.errors || []).map((code) => batchErrorLabel(code, language()));
        const ready = item.valid && item.readiness?.readyForReview;
        const status = item.valid
          ? ready ? text("Gata de review", "Ready for review") : text("Draft incomplet", "Incomplete draft")
          : text("Blocat", "Blocked");
        const details = errors.length
          ? errors
          : (item.readiness?.blockers || []).map((check) => {
              const key = language() === "en" ? "en" : "ro";
              return check?.label?.[key] || check?.label?.ro || check?.id || "";
            }).filter(Boolean);
        return `<tr class="${item.valid ? ready ? "is-ready" : "is-warning" : "is-error"}">
          <td>${item.index + 1}</td><td>${escapeHtml(formatType(item.type || "—", language()))}</td>
          <td><code>${escapeHtml(item.payload?.id || "—")}</code></td><td>${escapeHtml(status)}</td>
          <td>${details.length ? `<ul>${details.slice(0, 6).map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>` : "—"}</td>
        </tr>`;
      }).join("")}</tbody>
    </table></div>`;
  }

  function resultsHtml() {
    if (!state.results.length) return "";
    return `<section class="mh-batch-results"><h4>${text("Rezultatul importului", "Import result")}</h4><ul>${state.results.map((result) => `
      <li class="${result.ok ? "is-ok" : "is-fail"}"><span>${result.ok ? "✓" : "×"}</span><code>${escapeHtml(result.id)}</code><span>${escapeHtml(messageLabel(result.message))}</span></li>
    `).join("")}</ul></section>`;
  }

  function historyItemHtml(item) {
    const success = item.rollbackState === "rolled_back" || item.ok;
    const icon = item.rollbackState === "rolled_back" ? "↶" : success ? "✓" : item.state === "pending" ? "…" : "×";
    const message = item.rollbackMessage || item.message;
    return `<li class="${success ? "is-ok" : item.state === "pending" ? "is-pending" : "is-fail"}">
      <span>${icon}</span><code>${escapeHtml(item.id)}</code>
      <span>${escapeHtml(formatType(item.type, language()))} · ${escapeHtml(messageLabel(message))}</span>
    </li>`;
  }

  function historyHtml() {
    const disabled = state.busy || Boolean(state.busyAction);
    const body = state.historyLoading
      ? `<p class="mh-batch-history-empty">${text("Se încarcă istoricul…", "Loading history…")}</p>`
      : state.historyError
        ? `<p class="mh-batch-global-error">${escapeHtml(state.historyError)}</p>`
        : !state.history.length
          ? `<p class="mh-batch-history-empty">${text("Nu există încă importuri salvate pentru acest cont și browser.", "No saved imports exist for this account and browser yet.")}</p>`
          : state.history.map((record) => {
              const retryCount = recoverableBatchItems(record).length;
              const rollbackCount = rollbackCandidateItems(record).length;
              return `<details class="mh-batch-history-card" data-history-id="${escapeHtml(record.id)}">
                <summary>
                  <span><strong>${escapeHtml(batchHistoryStatusLabel(record.status, language()))}</strong><small>${escapeHtml(formatDate(record.createdAt))}</small></span>
                  <span class="mh-batch-history-counts">${record.summary?.imported || 0} ✓ · ${record.summary?.failed || 0} × · ${record.summary?.rolledBack || 0} ↶</span>
                </summary>
                <div class="mh-batch-history-body">
                  <div class="mh-batch-history-meta"><code>${escapeHtml(record.id)}</code><span>${text("Lot", "Batch")}: ${record.summary?.attempted || 0}</span></div>
                  <ul class="mh-batch-history-items">${(record.items || []).map(historyItemHtml).join("")}</ul>
                  <div class="mh-batch-history-actions">
                    <button class="btn small" type="button" data-history-retry="${escapeHtml(record.id)}"${!retryCount || disabled ? " disabled" : ""}>${text("Reîncearcă eșuate", "Retry failed")} (${retryCount})</button>
                    <button class="btn small danger" type="button" data-history-rollback="${escapeHtml(record.id)}"${!rollbackCount || disabled ? " disabled" : ""}>${text("Anulează drafturile", "Roll back drafts")} (${rollbackCount})</button>
                    <button class="btn small" type="button" data-history-remove="${escapeHtml(record.id)}"${disabled ? " disabled" : ""}>${text("Șterge istoricul", "Remove history")}</button>
                  </div>
                </div>
              </details>`;
            }).join("");
    return `<section class="mh-batch-history">
      <div class="mh-batch-history-head"><div><h4>${text("Istoric și recuperare", "History and recovery")}</h4><p>${text("Păstrat local, separat pentru contul curent. Rollback-ul este permis doar pentru Draft + Nepublicat.", "Stored locally for the current account. Rollback is allowed only for Draft + Unpublished items.")}</p></div>
      <button class="btn small" type="button" data-history-refresh${disabled ? " disabled" : ""}>${text("Actualizează", "Refresh")}</button></div>${body}</section>`;
  }

  function render() {
    const globalErrors = state.analysis?.globalErrors || [];
    const importCount = state.analysis?.validItems?.length || 0;
    host.innerHTML = `
      <details class="mh-content-batch"${state.analysis || state.history.length ? " open" : ""}>
        <summary><span><strong>${text("Import lot JSON", "JSON batch import")}</strong><small>${text("Validează, importă și recuperează loturi de drafturi nepublicate.", "Validate, import and recover batches of unpublished drafts.")}</small></span></summary>
        <div class="mh-content-batch-body">
          <div class="mh-batch-toolbar">
            <label class="btn small mh-batch-file">${text("Alege fișier", "Choose file")}<input type="file" accept="application/json,.json" data-batch-file></label>
            <button class="btn small" type="button" data-batch-example>${text("Încarcă exemplu", "Load example")}</button>
            <button class="btn small" type="button" data-batch-clear>${text("Golește", "Clear")}</button>
          </div>
          <label class="mh-batch-source"><span>JSON</span><textarea rows="13" spellcheck="false" data-batch-source placeholder='{"items":[...]}'${state.busy ? " disabled" : ""}>${escapeHtml(state.source)}</textarea></label>
          <div class="mh-batch-actions">
            <button class="btn small" type="button" data-batch-analyze${state.busy ? " disabled" : ""}>${text("Validează lotul", "Validate batch")}</button>
            <button class="btn" type="button" data-batch-import${!state.analysis?.canImport || state.busy || state.busyAction ? " disabled" : ""}>${state.busy ? text("Se importă…", "Importing…") : `${text("Importă", "Import")} ${importCount} ${text("drafturi", "drafts")}`}</button>
            <span>${escapeHtml(state.status)}</span>
          </div>
          ${globalErrors.length ? `<div class="mh-batch-global-error">${globalErrors.map((code) => escapeHtml(batchErrorLabel(code, language()))).join(" ")}</div>` : ""}
          ${summaryHtml()}${rowsHtml()}${resultsHtml()}${historyHtml()}
        </div>
      </details>`;
    bind();
  }

  async function loadHistory({ renderAfter = true } = {}) {
    const currentUser = userId();
    if (!currentUser) {
      state.history = [];
      state.historyError = "";
      if (renderAfter) render();
      return [];
    }
    state.historyLoading = true;
    state.historyError = "";
    if (renderAfter) render();
    try {
      const loaded = await historyRepository.list(currentUser, 25);
      const staleBefore = Date.now() - (30 * 60 * 1000);
      state.history = loaded.map((record) => {
        const stale = ["importing", "rolling_back"].includes(record.status)
          && new Date(record.updatedAt || record.createdAt || 0).getTime() < staleBefore;
        return stale ? { ...record, status: record.status === "importing" ? "interrupted" : "rollback_partial" } : record;
      });
      for (const record of state.history) {
        if (loaded.find((entry) => entry.id === record.id)?.status !== record.status) {
          try { await historyRepository.save(currentUser, record); } catch {}
        }
      }
    } catch (error) {
      state.historyError = String(error?.message || error);
    } finally {
      state.historyLoading = false;
      if (renderAfter) render();
    }
    return state.history;
  }

  function analyze() {
    state.analysis = analyzeContentBatch(state.source, { existingIds: existingIds() });
    state.results = [];
    state.status = state.analysis.canImport
      ? text(
          `${state.analysis.validItems.length} materiale pot fi importate${state.analysis.summary.invalid ? `; ${state.analysis.summary.invalid} vor fi omise` : ""}.`,
          `${state.analysis.validItems.length} items can be imported${state.analysis.summary.invalid ? `; ${state.analysis.summary.invalid} will be skipped` : ""}.`
        )
      : text("Lotul nu conține materiale importabile.", "The batch contains no importable items.");
    render();
    return state.analysis;
  }

  async function importBatch() {
    const analysis = analyzeContentBatch(state.source, { existingIds: existingIds() });
    state.analysis = analysis;
    if (!analysis.canImport || state.busy || state.busyAction) {
      state.status = text("Corectează erorile înainte de import.", "Fix the errors before importing.");
      render();
      return;
    }
    const currentUser = userId();
    if (!currentUser) {
      state.status = text("Sesiunea Admin nu este disponibilă.", "The Admin session is unavailable.");
      render();
      return;
    }
    const fingerprint = fingerprintBatchSource(state.source);
    try { state.history = await historyRepository.list(currentUser, 25); } catch {}
    const duplicate = state.history.find((record) => record.fingerprint === fingerprint && !["failed", "rolled_back"].includes(record.status));
    if (duplicate) {
      state.status = text("Acest lot există deja în istoric. Folosește Retry sau Rollback din istoricul lui.", "This batch already exists in history. Use Retry or Rollback from its history entry.");
      render();
      return;
    }

    state.busy = true;
    state.results = [];
    state.status = text("Import în desfășurare…", "Import in progress…");
    let historyRecord = createBatchHistoryRecord({ userId: currentUser, source: state.source, analysis });
    try {
      await historyRepository.save(currentUser, historyRecord);
    } catch (error) {
      state.historyError = String(error?.message || error);
    }
    render();

    const importedResults = await importContentBatchItems(supabase, analysis.validItems, {
      onResult: async (result, position) => {
        historyRecord = applyBatchItemResult(historyRecord, result, position);
        try { await historyRepository.save(currentUser, historyRecord); } catch {}
      }
    });
    historyRecord = finalizeBatchHistoryRecord(historyRecord);
    try { await historyRepository.save(currentUser, historyRecord); } catch {}

    state.results = importedResults.map((result) => ({
      ok: result.ok,
      id: result.id,
      message: result.ok ? result.message : result.contentInserted ? `editorial:${result.message}` : result.message
    }));
    const imported = importedResults.filter((result) => result.ok).length;
    const failed = importedResults.length - imported;
    state.busy = false;
    state.status = failed
      ? text(`${imported} importate, ${failed} eșuate.`, `${imported} imported, ${failed} failed.`)
      : text(`${imported} drafturi au fost create.`, `${imported} drafts were created.`);
    await onImported?.({ imported, failed, results: [...importedResults] });
    state.analysis = analyzeContentBatch(state.source, { existingIds: existingIds() });
    await loadHistory({ renderAfter: false });
    render();
  }

  async function retryHistoryBatch(batchId) {
    if (state.busy || state.busyAction) return;
    const currentUser = userId();
    const record = await historyRepository.get(currentUser, batchId);
    if (!record) return;
    state.busyAction = batchId;
    state.status = text("Se reîncearcă elementele eșuate…", "Retrying failed items…");
    render();
    try {
      const results = await retryBatchFailures(supabase, record, { existingIds: existingIds() });
      const updated = mergeBatchRetryResults(record, results);
      await historyRepository.save(currentUser, updated);
      const imported = results.filter((result) => result.ok).length;
      const failed = results.length - imported;
      state.results = results;
      state.status = failed
        ? text(`${imported} recuperate, ${failed} încă eșuate.`, `${imported} recovered, ${failed} still failed.`)
        : text(`${imported} materiale au fost recuperate.`, `${imported} items were recovered.`);
      await onImported?.({ imported, failed, results });
    } catch (error) {
      state.status = String(error?.message || error);
    } finally {
      state.busyAction = "";
      await loadHistory({ renderAfter: false });
      render();
    }
  }

  async function rollbackHistoryBatch(batchId) {
    if (state.busy || state.busyAction) return;
    const currentUser = userId();
    const record = await historyRepository.get(currentUser, batchId);
    if (!record) return;
    const confirmed = await confirmAction(text(
      "Se vor șterge numai materialele care sunt încă Draft și Nepublicat. Continui?",
      "Only items that are still Draft and Unpublished will be deleted. Continue?"
    ));
    if (!confirmed) return;
    state.busyAction = batchId;
    state.status = text("Se verifică și se anulează importul…", "Checking and rolling back the import…");
    await historyRepository.save(currentUser, { ...record, status: "rolling_back", updatedAt: new Date().toISOString() });
    render();
    try {
      const results = await rollbackBatchDrafts(supabase, record);
      const updated = applyRollbackResults(record, results);
      await historyRepository.save(currentUser, updated);
      const removed = results.filter((result) => result.ok).length;
      const blocked = results.length - removed;
      state.results = results;
      state.status = blocked
        ? text(`${removed} șterse, ${blocked} păstrate pentru siguranță.`, `${removed} deleted, ${blocked} preserved for safety.`)
        : text(`${removed} drafturi au fost șterse.`, `${removed} drafts were deleted.`);
      await onImported?.({ imported: 0, failed: blocked, rolledBack: removed, results });
    } catch (error) {
      state.status = String(error?.message || error);
    } finally {
      state.busyAction = "";
      await loadHistory({ renderAfter: false });
      render();
    }
  }

  async function removeHistoryBatch(batchId) {
    if (state.busy || state.busyAction) return;
    await historyRepository.remove(userId(), batchId);
    await loadHistory({ renderAfter: false });
    render();
  }

  function bind() {
    const source = host.querySelector("[data-batch-source]");
    source?.addEventListener("input", () => {
      state.source = source.value;
      state.analysis = null;
      state.results = [];
      state.status = "";
    });
    host.querySelector("[data-batch-analyze]")?.addEventListener("click", analyze);
    host.querySelector("[data-batch-import]")?.addEventListener("click", importBatch);
    host.querySelector("[data-batch-example]")?.addEventListener("click", () => {
      state.source = batchExample();
      state.analysis = null;
      state.results = [];
      state.status = "";
      render();
    });
    host.querySelector("[data-batch-clear]")?.addEventListener("click", () => {
      state.source = "";
      state.analysis = null;
      state.results = [];
      state.status = "";
      render();
    });
    host.querySelector("[data-batch-file]")?.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > CONTENT_BATCH_MAX_BYTES) {
        state.analysis = { globalErrors: ["batch_too_large"], items: [], validItems: [], summary: null, canImport: false };
        state.status = "";
        render();
        return;
      }
      state.source = await file.text();
      state.analysis = null;
      state.results = [];
      state.status = "";
      render();
    });
    host.querySelector("[data-history-refresh]")?.addEventListener("click", () => loadHistory());
    host.querySelectorAll("[data-history-retry]").forEach((button) => button.addEventListener("click", () => retryHistoryBatch(button.dataset.historyRetry)));
    host.querySelectorAll("[data-history-rollback]").forEach((button) => button.addEventListener("click", () => rollbackHistoryBatch(button.dataset.historyRollback)));
    host.querySelectorAll("[data-history-remove]").forEach((button) => button.addEventListener("click", () => removeHistoryBatch(button.dataset.historyRemove)));
  }

  function refreshLanguage() {
    render();
  }

  async function reset() {
    state.source = "";
    state.analysis = null;
    state.results = [];
    state.status = "";
    state.history = [];
    state.historyError = "";
    render();
    await loadHistory();
  }

  render();
  void loadHistory();
  return {
    analyze,
    importBatch,
    loadHistory,
    retryHistoryBatch,
    rollbackHistoryBatch,
    refreshLanguage,
    reset,
    getState: () => ({ ...state, history: [...state.history] })
  };
}
