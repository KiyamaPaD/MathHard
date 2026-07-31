import {
  loadContentQualityDashboard,
  resetContentQualityReview,
  saveContentQualityReview
} from "./content-quality-repository.js";
import {
  bulkSetPublication,
  bulkSubmitForReview,
  duplicateContent,
  loadEditorialDashboard,
  loadEditorialPreview,
  loadPublicationHistory,
  publishContent,
  unpublishContent
} from "./content-publication-repository.js";
import {
  contentQualityPayload,
  emptyContentQualityDashboard,
  filterQualityItems,
  normalizeContentQualityDashboard,
  qualityChecklist,
  qualityContentTypeLabel,
  qualityItemTitle,
  qualityIssueLabel,
  qualityStatusLabel
} from "./content-quality-model.js";
import {
  publicationModeLabel,
  publicationStateLabel
} from "./content-publication-model.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

function splitLines(value) {
  return [...new Set(
    String(value || "")
      .split(/[\n,;]/)
      .map((entry) => entry.trim())
      .filter(Boolean)
  )];
}

function formatDate(value, language) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "ro-RO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function previewDocument(preview, language) {
  const content = preview?.content || {};
  const english = language === "en";
  const title = english
    ? (content.title_en || content.title_ro || preview.content_id)
    : (content.title_ro || content.title_en || preview.content_id);
  let body = "";

  if (preview.content_type === "lesson") {
    body = english
      ? (content.body_en || content.body_ro || "")
      : (content.body_ro || content.body_en || "");
  } else if (preview.content_type === "problem") {
    const statement = english
      ? (content.statement_en || content.statement_ro || "")
      : (content.statement_ro || content.statement_en || "");
    body = `<p>${escapeHtml(statement)}</p><p><strong>${english ? "Difficulty" : "Dificultate"}:</strong> ${escapeHtml(content.difficulty ?? "—")}</p>`;
  } else {
    const exam = content.exam || {};
    const items = Array.isArray(exam.items) ? exam.items : [];
    body = `<p><strong>${english ? "Year" : "An"}:</strong> ${escapeHtml(content.year ?? "—")}</p>
      <p><strong>${english ? "Items" : "Itemi"}:</strong> ${items.length}</p>
      <ol>${items.slice(0, 20).map((item) => `<li>${escapeHtml(item.prompt_en || item.prompt_ro || item.title_en || item.title_ro || item.id || "Item")}</li>`).join("")}</ol>`;
  }

  return `<!doctype html><html lang="${english ? "en" : "ro"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    body{font-family:system-ui,sans-serif;margin:0;padding:24px;line-height:1.6;color:#111;background:#fff}h1{line-height:1.2}img{max-width:100%}code{white-space:pre-wrap}table{max-width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:6px}
  </style></head><body><h1>${escapeHtml(title)}</h1>${body}</body></html>`;
}

export function createContentQualityAdminController({
  host,
  supabase,
  getLanguage = () => "ro",
  onChanged = async () => {},
  onEditContent = () => {}
} = {}) {
  if (!host) throw new Error("createContentQualityAdminController requires a host element.");
  if (!supabase) throw new Error("createContentQualityAdminController requires Supabase.");

  const state = {
    enabled: false,
    busy: false,
    loaded: false,
    publicationAvailable: true,
    statusMessage: "",
    error: "",
    selectedKey: "",
    selectedKeys: new Set(),
    filters: { query: "", status: "all", contentType: "all", publication: "all" },
    dashboard: emptyContentQualityDashboard(),
    preview: null,
    history: [],
    modalOpen: false
  };

  function language() {
    return String(getLanguage?.() || "ro").toLowerCase().startsWith("en") ? "en" : "ro";
  }

  function text(ro, en) {
    return language() === "en" ? en : ro;
  }

  function itemKey(item) {
    return `${item.content_type}:${item.content_id}`;
  }

  function selectedItem() {
    return state.dashboard.items.find((item) => itemKey(item) === state.selectedKey) || null;
  }

  function filteredItems() {
    return filterQualityItems(state.dashboard.items, state.filters);
  }

  function selectedItems() {
    return state.dashboard.items.filter((item) => state.selectedKeys.has(itemKey(item)));
  }

  function statusOptions(selected) {
    return ["draft", "in_review", "changes_requested", "verified", "archived"]
      .map((status) => `<option value="${status}"${selected === status ? " selected" : ""}>${escapeHtml(qualityStatusLabel(status, language()))}</option>`)
      .join("");
  }

  function summaryHtml() {
    const summary = state.dashboard.summary;
    const rows = [
      [text("Publicate", "Published"), summary.published, "published"],
      [text("Gata de publicare", "Ready to publish"), summary.ready_to_publish, "ready"],
      [text("Legacy publicate", "Legacy published"), summary.legacy_published, "legacy"],
      [text("În review", "In review"), summary.in_review, "review"],
      [text("Necesită modificări", "Changes requested"), summary.changes_requested, "changes"],
      [text("Blocate", "Blocked"), summary.blocked, "blocked"]
    ];
    return rows.map(([label, value, tone]) => `
      <article class="mh-quality-stat is-${tone}"><span>${escapeHtml(label)}</span><strong>${Number(value || 0)}</strong></article>
    `).join("");
  }

  function checklistHtml(item) {
    return qualityChecklist(item, language())
      .map((entry) => `<li class="${entry.passed ? "is-pass" : "is-fail"}"><span>${entry.passed ? "✓" : "×"}</span>${escapeHtml(entry.label)}</li>`)
      .join("");
  }

  function itemListHtml() {
    const items = filteredItems();
    if (!items.length) {
      return `<div class="mh-quality-empty"><strong>${text("Niciun rezultat", "No results")}</strong><span>${text("Schimbă filtrele.", "Change the filters.")}</span></div>`;
    }

    return items.map((item) => {
      const key = itemKey(item);
      const active = key === state.selectedKey;
      const checked = state.selectedKeys.has(key);
      return `
        <article class="mh-quality-list-row${active ? " is-active" : ""}${checked ? " is-selected" : ""}">
          <label class="mh-quality-select-check" title="${text("Selectează", "Select")}">
            <input type="checkbox" data-quality-check="${escapeAttribute(key)}"${checked ? " checked" : ""}>
          </label>
          <button type="button" data-quality-select="${escapeAttribute(key)}">
            <span class="mh-quality-row-top">
              <span>${escapeHtml(qualityContentTypeLabel(item.content_type, language()))}</span>
              <span class="mh-quality-publication-badge${item.published ? " is-published" : ""}${item.publication_mode === "legacy" ? " is-legacy" : ""}">${escapeHtml(publicationStateLabel(item.publication, language()))}</span>
            </span>
            <strong>${escapeHtml(qualityItemTitle(item, language()))}</strong>
            <code>${escapeHtml(item.content_id)}</code>
            <span class="mh-quality-row-meta">
              <span>${escapeHtml(qualityStatusLabel(item.status, language()))}</span>
              <span>${Math.round(item.completeness_score)}%</span>
            </span>
          </button>
        </article>
      `;
    }).join("");
  }

  function historyHtml() {
    if (!state.history.length) return "";
    return `
      <details class="mh-quality-history">
        <summary>${text("Istoric publicare", "Publication history")}</summary>
        <ol>${state.history.map((entry) => `
          <li><strong>${escapeHtml(String(entry.operation || ""))}</strong><span>${escapeHtml(entry.actor_label || "Admin")} · ${escapeHtml(formatDate(entry.created_at, language()))}</span>${entry.reason ? `<small>${escapeHtml(entry.reason)}</small>` : ""}</li>
        `).join("")}</ol>
      </details>
    `;
  }

  function editorHtml() {
    const item = selectedItem();
    if (!item) {
      return `<div class="mh-quality-editor-empty"><strong>${text("Selectează un material", "Select content")}</strong><span>${text("Review-ul și publicarea apar aici.", "Review and publication controls appear here.")}</span></div>`;
    }

    const sources = item.source_urls.join("\n");
    const publicationAction = item.published
      ? `<button class="btn small danger" type="button" data-quality-unpublish${!state.publicationAvailable || state.busy ? " disabled" : ""}>${text("Retrage", "Unpublish")}</button>`
      : `<button class="btn" type="button" data-quality-publish${!state.publicationAvailable || !item.can_publish || state.busy ? " disabled" : ""}>${text("Publică", "Publish")}</button>`;

    return `
      <form class="mh-quality-editor" data-quality-form>
        <header>
          <div>
            <span class="mh-admin-eyebrow">${escapeHtml(qualityContentTypeLabel(item.content_type, language()))}</span>
            <h3>${escapeHtml(qualityItemTitle(item, language()))}</h3>
            <code>${escapeHtml(item.content_id)}</code>
          </div>
          <div class="mh-quality-editor-state">
            <span class="mh-quality-publication-badge${item.published ? " is-published" : ""}${item.publication_mode === "legacy" ? " is-legacy" : ""}">${escapeHtml(publicationStateLabel(item.publication, language()))}</span>
            <small>${escapeHtml(publicationModeLabel(item.publication_mode, language()))}</small>
          </div>
        </header>

        <div class="mh-quality-action-row">
          <button class="btn small" type="button" data-quality-preview${!state.publicationAvailable || state.busy ? " disabled" : ""}>${text("Preview elev", "Student preview")}</button>
          <button class="btn small" type="button" data-quality-edit>${text("Deschide editorul", "Open editor")}</button>
          ${["lesson", "problem"].includes(item.content_type) ? `<button class="btn small" type="button" data-quality-duplicate${!state.publicationAvailable || state.busy ? " disabled" : ""}>${text("Duplică", "Duplicate")}</button>` : ""}
          ${publicationAction}
        </div>

        ${item.publication_mode === "legacy" && item.published ? `<div class="mh-quality-legacy-note">${text("Acest material a rămas public prin backfill-ul de compatibilitate. După prima editare va trebui verificat și republicat.", "This content remains public through the compatibility backfill. After its first edit it must be reviewed and republished.")}</div>` : ""}

        <section class="mh-quality-auto-checks">
          <div class="mh-quality-section-head"><h4>${text("Verificări automate", "Automated checks")}</h4><strong>${Math.round(item.completeness_score)}%</strong></div>
          <ul>${checklistHtml(item)}</ul>
        </section>

        ${item.blocking_issues.length ? `<section class="mh-quality-blockers"><h4>${text("Blocaje", "Blockers")}</h4><ul>${item.blocking_issues.map((issue) => `<li>${escapeHtml(qualityIssueLabel(issue, language()))}</li>`).join("")}</ul></section>` : ""}

        <div class="mh-quality-form-grid">
          <label>${text("Status editorial", "Editorial status")}<select name="status">${statusOptions(item.status)}</select></label>
          <label class="mh-quality-check"><input type="checkbox" name="bilingual_checked"${item.bilingual_checked ? " checked" : ""}><span>${text("Bilingv verificat", "Bilingual reviewed")}</span></label>
          <label class="mh-quality-check"><input type="checkbox" name="math_checked"${item.math_checked ? " checked" : ""}><span>${text("Matematic verificat", "Math reviewed")}</span></label>
          <label class="mh-quality-check"><input type="checkbox" name="source_checked"${item.source_checked ? " checked" : ""}><span>${text("Surse verificate", "Sources reviewed")}</span></label>
        </div>

        <label>${text("Surse suplimentare", "Additional sources")}<textarea name="source_urls" rows="4" placeholder="https://...">${escapeHtml(sources)}</textarea><small>${text("Câte un URL sau identificator pe linie.", "One URL or source identifier per line.")}</small></label>
        <label>${text("Note reviewer", "Reviewer notes")}<textarea name="reviewer_notes" rows="6" maxlength="10000">${escapeHtml(item.reviewer_notes)}</textarea></label>

        ${historyHtml()}

        <footer>
          <div><span>${text("Ultimul review", "Last review")}: ${escapeHtml(formatDate(item.reviewed_at, language()))}</span><span>review v${Number(item.review_version || 1)} · publish v${Number(item.publication_version || 0)}</span></div>
          <div><button class="btn small" type="button" data-quality-reset>${text("Resetează review", "Reset review")}</button><button class="btn" type="submit"${state.busy ? " disabled" : ""}>${text("Salvează review", "Save review")}</button></div>
        </footer>
      </form>
    `;
  }

  function bulkHtml() {
    const selected = selectedItems();
    if (!selected.length) return "";
    const publishable = selected.filter((item) => item.can_publish && !item.published).length;
    const published = selected.filter((item) => item.published).length;
    return `
      <div class="mh-quality-bulk-bar">
        <strong>${selected.length} ${text("selectate", "selected")}</strong>
        <span>${publishable} ${text("eligibile", "publishable")} · ${published} ${text("publicate", "published")}</span>
        <div>
          <button class="btn small" type="button" data-quality-bulk-review${state.busy ? " disabled" : ""}>${text("Trimite la review", "Send to review")}</button>
          <button class="btn small" type="button" data-quality-bulk-unpublish${!state.publicationAvailable || !published || state.busy ? " disabled" : ""}>${text("Retrage", "Unpublish")}</button>
          <button class="btn" type="button" data-quality-bulk-publish${!state.publicationAvailable || !publishable || state.busy ? " disabled" : ""}>${text("Publică eligibile", "Publish eligible")}</button>
          <button class="btn small" type="button" data-quality-clear-selection>${text("Anulează selecția", "Clear")}</button>
        </div>
      </div>
    `;
  }

  function previewModalHtml() {
    if (!state.modalOpen || !state.preview) return "";
    const documentHtml = previewDocument(state.preview, language());
    const concepts = state.preview.concepts || [];
    return `
      <div class="mh-quality-modal" data-quality-modal>
        <div class="mh-quality-modal-card" role="dialog" aria-modal="true" aria-label="Preview">
          <header><div><span class="mh-admin-eyebrow">${text("Preview elev", "Student preview")}</span><h3>${escapeHtml(state.preview.content_id)}</h3></div><button class="btn small" type="button" data-quality-close-preview>${text("Închide", "Close")}</button></header>
          <div class="mh-quality-preview-meta"><span>${state.preview.student_visible ? text("Vizibil elevilor", "Visible to students") : text("Încă nepublicat", "Not published yet")}</span>${concepts.map((concept) => `<span>${escapeHtml(concept.title || concept.id)}</span>`).join("")}</div>
          <iframe sandbox="" title="Student preview" srcdoc="${escapeAttribute(documentHtml)}"></iframe>
        </div>
      </div>
    `;
  }

  function render() {
    host.hidden = !state.enabled;
    if (!state.enabled) return;

    host.innerHTML = `
      <div class="mh-quality-shell">
        <div class="mh-quality-toolbar">
          <div><span class="mh-admin-eyebrow">Publication Pipeline</span><h3>${text("Review și publicare", "Review and publishing")}</h3><p>${text("Conținutul nou rămâne ascuns până este verificat și publicat.", "New content stays hidden until it is verified and published.")}</p></div>
          <button class="btn small" type="button" data-quality-refresh${state.busy ? " disabled" : ""}>Refresh</button>
        </div>
        ${!state.publicationAvailable ? `<div class="mh-quality-warning">${text("SQL 051/052 nu este încă disponibil. Review-ul funcționează, dar publicarea este dezactivată.", "SQL 051/052 is not available yet. Review works, but publishing is disabled.")}</div>` : ""}
        <div class="mh-quality-summary">${summaryHtml()}</div>
        ${bulkHtml()}
        ${state.statusMessage ? `<div class="mh-quality-status">${escapeHtml(state.statusMessage)}</div>` : ""}
        ${state.error ? `<div class="mh-quality-error">${escapeHtml(state.error)}</div>` : ""}

        <div class="mh-quality-layout">
          <aside>
            <div class="mh-quality-filters">
              <label>${text("Caută", "Search")}<input type="search" data-quality-query value="${escapeHtml(state.filters.query)}" placeholder="ID, titlu..."></label>
              <label>${text("Tip", "Type")}<select data-quality-type><option value="all">${text("Toate", "All")}</option><option value="lesson"${state.filters.contentType === "lesson" ? " selected" : ""}>${text("Lecții", "Lessons")}</option><option value="problem"${state.filters.contentType === "problem" ? " selected" : ""}>${text("Probleme", "Problems")}</option><option value="exam"${state.filters.contentType === "exam" ? " selected" : ""}>${text("Examene", "Exams")}</option></select></label>
              <label>Status<select data-quality-status><option value="all">${text("Toate", "All")}</option>${["draft", "in_review", "changes_requested", "verified", "archived"].map((status) => `<option value="${status}"${state.filters.status === status ? " selected" : ""}>${escapeHtml(qualityStatusLabel(status, language()))}</option>`).join("")}</select></label>
              <label>${text("Publicare", "Publication")}<select data-quality-publication><option value="all">${text("Toate", "All")}</option><option value="published"${state.filters.publication === "published" ? " selected" : ""}>${text("Publicate", "Published")}</option><option value="unpublished"${state.filters.publication === "unpublished" ? " selected" : ""}>${text("Nepublicate", "Unpublished")}</option><option value="legacy"${state.filters.publication === "legacy" ? " selected" : ""}>Legacy</option><option value="verified"${state.filters.publication === "verified" ? " selected" : ""}>${text("Workflow verificat", "Verified workflow")}</option></select></label>
            </div>
            <div class="mh-quality-list">${itemListHtml()}</div>
          </aside>
          <main>${editorHtml()}</main>
        </div>
      </div>
      ${previewModalHtml()}
    `;
  }

  async function load(force = false) {
    if (!state.enabled) return state.dashboard;
    if (state.busy && !force) return state.dashboard;
    state.busy = true;
    state.error = "";
    if (!state.loaded) state.statusMessage = text("Se încarcă...", "Loading...");
    render();
    try {
      const payload = await loadEditorialDashboard(supabase, {
        limit: 2000,
        fallback: () => loadContentQualityDashboard(supabase, { limit: 1000 })
      });
      state.dashboard = normalizeContentQualityDashboard(payload);
      state.publicationAvailable = String(state.dashboard.schema_version).startsWith("editorial-workflow");
      state.loaded = true;
      if (state.selectedKey && !selectedItem()) state.selectedKey = "";
      if (!state.selectedKey && state.dashboard.items.length) state.selectedKey = itemKey(state.dashboard.items[0]);
      state.selectedKeys = new Set([...state.selectedKeys].filter((key) => state.dashboard.items.some((item) => itemKey(item) === key)));
      state.statusMessage = text("Catalog editorial sincronizat.", "Editorial catalogue synced.");
      await loadHistoryForSelected();
      return state.dashboard;
    } catch (error) {
      state.error = error?.message || String(error);
      state.statusMessage = "";
      throw error;
    } finally {
      state.busy = false;
      render();
    }
  }

  async function loadHistoryForSelected() {
    if (!state.publicationAvailable) {
      state.history = [];
      return;
    }
    const item = selectedItem();
    if (!item) {
      state.history = [];
      return;
    }
    try {
      const payload = await loadPublicationHistory(supabase, item, 30);
      state.history = Array.isArray(payload?.entries) ? payload.entries : [];
    } catch {
      state.history = [];
    }
  }

  async function afterMutation(message) {
    state.statusMessage = message;
    await onChanged?.();
    await load(true);
  }

  async function saveReview() {
    const item = selectedItem();
    const form = host.querySelector("[data-quality-form]");
    if (!item || !form) return;
    const data = new FormData(form);
    const payload = contentQualityPayload(item, {
      status: data.get("status"),
      bilingual_checked: form.querySelector('[name="bilingual_checked"]')?.checked,
      math_checked: form.querySelector('[name="math_checked"]')?.checked,
      source_checked: form.querySelector('[name="source_checked"]')?.checked,
      reviewer_notes: data.get("reviewer_notes"),
      source_urls: splitLines(data.get("source_urls"))
    });

    state.busy = true;
    state.error = "";
    render();
    try {
      await saveContentQualityReview(supabase, { contentType: item.content_type, contentId: item.content_id, payload });
      await afterMutation(text("Review salvat.", "Review saved."));
    } catch (error) {
      state.error = error?.message || String(error);
      state.busy = false;
      render();
    }
  }

  async function resetReview() {
    const item = selectedItem();
    if (!item || !confirm(text("Resetezi review-ul acestui material?", "Reset this content review?"))) return;
    state.busy = true;
    state.error = "";
    render();
    try {
      await resetContentQualityReview(supabase, { contentType: item.content_type, contentId: item.content_id });
      await afterMutation(text("Review resetat.", "Review reset."));
    } catch (error) {
      state.error = error?.message || String(error);
      state.busy = false;
      render();
    }
  }

  async function setPublication(publish) {
    const item = selectedItem();
    if (!item || !state.publicationAvailable) return;
    if (!publish && !confirm(text("Retragi acest material din catalogul elevilor?", "Remove this content from the student catalogue?"))) return;
    state.busy = true;
    state.error = "";
    render();
    try {
      if (publish) await publishContent(supabase, item);
      else await unpublishContent(supabase, item, "Withdrawn from Editorial Studio");
      await afterMutation(publish ? text("Conținut publicat.", "Content published.") : text("Conținut retras.", "Content unpublished."));
    } catch (error) {
      state.error = error?.message || String(error);
      state.busy = false;
      render();
    }
  }

  async function runBulk(action) {
    const items = selectedItems();
    if (!items.length) return;
    state.busy = true;
    state.error = "";
    render();
    try {
      if (action === "review") {
        await bulkSubmitForReview(supabase, items);
      } else if (action === "publish") {
        const eligible = items.filter((item) => item.can_publish && !item.published);
        if (!eligible.length) throw new Error(text("Niciun material selectat nu este eligibil.", "No selected content is publishable."));
        await bulkSetPublication(supabase, eligible, true);
      } else {
        const published = items.filter((item) => item.published);
        if (!published.length) throw new Error(text("Niciun material selectat nu este publicat.", "No selected content is published."));
        if (!confirm(text(`Retragi ${published.length} materiale?`, `Unpublish ${published.length} items?`))) {
          state.busy = false;
          render();
          return;
        }
        await bulkSetPublication(supabase, published, false, "Batch withdrawal from Editorial Studio");
      }
      state.selectedKeys.clear();
      await afterMutation(action === "review" ? text("Materialele au fost trimise la review.", "Content sent to review.") : action === "publish" ? text("Materialele eligibile au fost publicate.", "Eligible content published.") : text("Materialele au fost retrase.", "Content unpublished."));
    } catch (error) {
      state.error = error?.message || String(error);
      state.busy = false;
      render();
    }
  }

  async function duplicateSelected() {
    const item = selectedItem();
    if (!item || !state.publicationAvailable || !["lesson", "problem"].includes(item.content_type)) return;
    const suggested = `${item.content_id}-copy`;
    const newId = prompt(
      text("ID-ul noii copii", "New copy ID"),
      suggested
    );
    if (newId == null) return;

    state.busy = true;
    state.error = "";
    render();
    try {
      const duplicated = await duplicateContent(
        supabase,
        item,
        newId,
        text(" (Copie)", " (Copy)")
      );
      const targetId = String(duplicated?.new_id || newId).trim();
      state.selectedKey = `${item.content_type}:${targetId}`;
      await afterMutation(text("Copia a fost creată ca draft nepublicat.", "Copy created as an unpublished draft."));
    } catch (error) {
      state.error = error?.message || String(error);
      state.busy = false;
      render();
    }
  }

  async function openPreview() {
    const item = selectedItem();
    if (!item || !state.publicationAvailable) return;
    state.busy = true;
    state.error = "";
    render();
    try {
      state.preview = await loadEditorialPreview(supabase, item, language());
      state.modalOpen = true;
    } catch (error) {
      state.error = error?.message || String(error);
    } finally {
      state.busy = false;
      render();
    }
  }

  host.addEventListener("click", (event) => {
    const selectButton = event.target.closest("[data-quality-select]");
    if (selectButton) {
      state.selectedKey = selectButton.dataset.qualitySelect || "";
      void loadHistoryForSelected().finally(render);
      render();
      return;
    }
    if (event.target.closest("[data-quality-refresh]")) return void load(true).catch(() => {});
    if (event.target.closest("[data-quality-reset]")) return void resetReview();
    if (event.target.closest("[data-quality-publish]")) return void setPublication(true);
    if (event.target.closest("[data-quality-unpublish]")) return void setPublication(false);
    if (event.target.closest("[data-quality-preview]")) return void openPreview();
    if (event.target.closest("[data-quality-edit]")) return onEditContent?.(selectedItem());
    if (event.target.closest("[data-quality-duplicate]")) return void duplicateSelected();
    if (event.target.closest("[data-quality-bulk-review]")) return void runBulk("review");
    if (event.target.closest("[data-quality-bulk-publish]")) return void runBulk("publish");
    if (event.target.closest("[data-quality-bulk-unpublish]")) return void runBulk("unpublish");
    if (event.target.closest("[data-quality-clear-selection]")) { state.selectedKeys.clear(); render(); return; }
    if (event.target.closest("[data-quality-close-preview]") || event.target.matches("[data-quality-modal]")) {
      state.modalOpen = false;
      state.preview = null;
      render();
    }
  });

  host.addEventListener("input", (event) => {
    if (event.target.matches("[data-quality-query]")) {
      const cursor = event.target.selectionStart ?? event.target.value.length;
      state.filters.query = event.target.value;
      render();
      const nextQuery = host.querySelector("[data-quality-query]");
      nextQuery?.focus();
      nextQuery?.setSelectionRange?.(cursor, cursor);
    }
  });

  host.addEventListener("change", (event) => {
    if (event.target.matches("[data-quality-check]")) {
      const key = event.target.dataset.qualityCheck || "";
      if (event.target.checked) state.selectedKeys.add(key); else state.selectedKeys.delete(key);
      render();
      return;
    }
    if (event.target.matches("[data-quality-type]")) state.filters.contentType = event.target.value;
    if (event.target.matches("[data-quality-status]")) state.filters.status = event.target.value;
    if (event.target.matches("[data-quality-publication]")) state.filters.publication = event.target.value;
    state.selectedKey = "";
    render();
  });

  host.addEventListener("submit", (event) => {
    if (!event.target.matches("[data-quality-form]")) return;
    event.preventDefault();
    void saveReview();
  });

  render();

  return {
    async load(force = false) { return load(force); },
    render,
    invalidate() { state.loaded = false; },
    setAdmin(enabled) {
      state.enabled = Boolean(enabled);
      if (!state.enabled) {
        state.loaded = false;
        state.selectedKey = "";
        state.selectedKeys.clear();
        state.dashboard = emptyContentQualityDashboard();
      }
      render();
    },
    getState() {
      return {
        ...structuredClone({ ...state, selectedKeys: undefined }),
        selectedKeys: [...state.selectedKeys]
      };
    }
  };
}
