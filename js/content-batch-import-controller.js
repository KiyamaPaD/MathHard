import {
  analyzeContentBatch,
  batchErrorLabel,
  batchExample,
  contentTableForType,
  CONTENT_BATCH_MAX_BYTES
} from "./content-batch-import-model.js";
import { importContentBatchItems } from "./content-batch-import-repository.js";

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
  onImported = async () => {}
} = {}) {
  if (!host) throw new Error("createContentBatchImportController requires a host element.");
  if (!supabase?.from) throw new Error("createContentBatchImportController requires Supabase.");

  const state = {
    source: "",
    analysis: null,
    busy: false,
    results: [],
    status: ""
  };

  function language() {
    return String(getLanguage?.() || "ro").toLowerCase().startsWith("en") ? "en" : "ro";
  }

  function text(ro, en) {
    return language() === "en" ? en : ro;
  }

  function existingIds() {
    const catalog = getCatalog?.() || {};
    return {
      lesson: (catalog.lessons || []).map((item) => item?.id),
      problem: (catalog.problems || []).map((item) => item?.id),
      exam: (catalog.exams || []).map((item) => item?.id)
    };
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
      <li class="${result.ok ? "is-ok" : "is-fail"}"><span>${result.ok ? "✓" : "×"}</span><code>${escapeHtml(result.id)}</code><span>${escapeHtml(result.message)}</span></li>
    `).join("")}</ul></section>`;
  }

  function render() {
    const globalErrors = state.analysis?.globalErrors || [];
    const importCount = state.analysis?.validItems?.length || 0;
    host.innerHTML = `
      <details class="mh-content-batch"${state.analysis ? " open" : ""}>
        <summary><span><strong>${text("Import lot JSON", "JSON batch import")}</strong><small>${text("Validează și salvează mai multe materiale ca drafturi nepublicate.", "Validate and save multiple items as unpublished drafts.")}</small></span></summary>
        <div class="mh-content-batch-body">
          <div class="mh-batch-toolbar">
            <label class="btn small mh-batch-file">${text("Alege fișier", "Choose file")}<input type="file" accept="application/json,.json" data-batch-file></label>
            <button class="btn small" type="button" data-batch-example>${text("Încarcă exemplu", "Load example")}</button>
            <button class="btn small" type="button" data-batch-clear>${text("Golește", "Clear")}</button>
          </div>
          <label class="mh-batch-source"><span>${text("JSON", "JSON")}</span><textarea rows="13" spellcheck="false" data-batch-source placeholder='{"items":[...]}'${state.busy ? " disabled" : ""}>${escapeHtml(state.source)}</textarea></label>
          <div class="mh-batch-actions">
            <button class="btn small" type="button" data-batch-analyze${state.busy ? " disabled" : ""}>${text("Validează lotul", "Validate batch")}</button>
            <button class="btn" type="button" data-batch-import${!state.analysis?.canImport || state.busy ? " disabled" : ""}>${state.busy ? text("Se importă…", "Importing…") : `${text("Importă", "Import")} ${importCount} ${text("drafturi", "drafts")}`}</button>
            <span>${escapeHtml(state.status)}</span>
          </div>
          ${globalErrors.length ? `<div class="mh-batch-global-error">${globalErrors.map((code) => escapeHtml(batchErrorLabel(code, language()))).join(" ")}</div>` : ""}
          ${summaryHtml()}${rowsHtml()}${resultsHtml()}
        </div>
      </details>`;
    bind();
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
    if (!analysis.canImport || state.busy) {
      state.status = text("Corectează erorile înainte de import.", "Fix the errors before importing.");
      render();
      return;
    }
    state.busy = true;
    state.results = [];
    state.status = text("Import în desfășurare…", "Import in progress…");
    render();

    const importedResults = await importContentBatchItems(supabase, analysis.validItems);
    state.results = importedResults.map((result) => ({
      ok: result.ok,
      id: result.id,
      message: result.ok
        ? text("Draft creat.", "Draft created.")
        : result.contentInserted
          ? `${text("Conținut salvat, dar inițializarea editorială a eșuat: ", "Content saved, but editorial initialization failed: ")}${result.message}`
          : result.message
    }));

    const imported = state.results.filter((result) => result.ok).length;
    const failed = state.results.length - imported;
    state.busy = false;
    state.status = failed
      ? text(`${imported} importate, ${failed} eșuate.`, `${imported} imported, ${failed} failed.`)
      : text(`${imported} drafturi au fost create.`, `${imported} drafts were created.`);
    await onImported?.({ imported, failed, results: [...state.results] });
    state.analysis = analyzeContentBatch(state.source, { existingIds: existingIds() });
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
  }

  function refreshLanguage() {
    render();
  }

  function reset() {
    state.source = "";
    state.analysis = null;
    state.results = [];
    state.status = "";
    render();
  }

  render();
  return { analyze, importBatch, refreshLanguage, reset, getState: () => ({ ...state }) };
}
