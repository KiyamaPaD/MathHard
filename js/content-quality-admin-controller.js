import {
  loadContentQualityDashboard,
  resetContentQualityReview,
  saveContentQualityReview
} from "./content-quality-repository.js";
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

export function createContentQualityAdminController({
  host,
  supabase,
  getLanguage = () => "ro"
} = {}) {
  if (!host) throw new Error("createContentQualityAdminController requires a host element.");
  if (!supabase) throw new Error("createContentQualityAdminController requires Supabase.");

  const state = {
    enabled: false,
    busy: false,
    loaded: false,
    statusMessage: "",
    error: "",
    selectedKey: "",
    filters: { query: "", status: "all", contentType: "all" },
    dashboard: emptyContentQualityDashboard()
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

  function statusOptions(selected) {
    return ["draft", "in_review", "changes_requested", "verified", "archived"]
      .map((status) => `<option value="${status}"${selected === status ? " selected" : ""}>${escapeHtml(qualityStatusLabel(status, language()))}</option>`)
      .join("");
  }

  function summaryHtml() {
    const summary = state.dashboard.summary;
    const rows = [
      [text("Total", "Total"), summary.total],
      [text("Pregătite automat", "Automatically ready"), summary.automated_ready],
      [text("Verificate", "Verified"), summary.verified],
      [text("Eligibile publicare", "Publish eligible"), summary.eligible_for_publish],
      [text("Blocate", "Blocked"), summary.blocked]
    ];
    return rows.map(([label, value]) => `
      <article><span>${escapeHtml(label)}</span><strong>${Number(value || 0)}</strong></article>
    `).join("");
  }

  function itemListHtml() {
    const items = filterQualityItems(state.dashboard.items, state.filters);
    if (!items.length) {
      return `<div class="mh-quality-empty">${text("Nu există rezultate.", "No results.")}</div>`;
    }

    return items.map((item) => {
      const active = itemKey(item) === state.selectedKey;
      const issueCount = item.blocking_issues.length;
      return `
        <button class="mh-quality-list-item${active ? " is-active" : ""}" type="button"
          data-quality-select="${escapeHtml(itemKey(item))}">
          <span class="mh-quality-list-main">
            <small>${escapeHtml(qualityContentTypeLabel(item.content_type, language()))}</small>
            <strong>${escapeHtml(qualityItemTitle(item, language()))}</strong>
            <code>${escapeHtml(item.content_id)}</code>
          </span>
          <span class="mh-quality-list-meta">
            <b data-status="${escapeHtml(item.status)}">${escapeHtml(qualityStatusLabel(item.status, language()))}</b>
            <em>${Math.round(item.completeness_score)}%</em>
            ${issueCount ? `<small>${issueCount} ${text("blocaje", "blockers")}</small>` : `<small>${text("fără blocaje", "no blockers")}</small>`}
          </span>
        </button>
      `;
    }).join("");
  }

  function checklistHtml(item) {
    return qualityChecklist(item, language()).map((entry) => `
      <li class="${entry.passed ? "is-ok" : "is-missing"}">
        <span>${entry.passed ? "✓" : "!"}</span>
        <strong>${escapeHtml(entry.label)}</strong>
      </li>
    `).join("");
  }

  function editorHtml() {
    const item = selectedItem();
    if (!item) {
      return `<div class="mh-quality-empty mh-quality-empty-large">${text("Selectează un material pentru review.", "Select content to review.")}</div>`;
    }

    const sources = item.source_urls.join("\n");
    return `
      <form class="mh-quality-review-form" data-quality-form>
        <header>
          <div>
            <span class="mh-admin-eyebrow">${escapeHtml(qualityContentTypeLabel(item.content_type, language()))}</span>
            <h3>${escapeHtml(qualityItemTitle(item, language()))}</h3>
            <code>${escapeHtml(item.content_id)}</code>
          </div>
          <span class="mh-quality-readiness${item.eligible_for_publish ? " is-ready" : ""}">
            ${item.eligible_for_publish ? text("Eligibil pentru publicare", "Publish eligible") : text("Publicare blocată", "Publishing blocked")}
          </span>
        </header>

        <section class="mh-quality-auto-checks">
          <div class="mh-quality-section-head">
            <h4>${text("Verificări automate", "Automated checks")}</h4>
            <strong>${Math.round(item.completeness_score)}%</strong>
          </div>
          <ul>${checklistHtml(item)}</ul>
        </section>

        ${item.blocking_issues.length ? `
          <section class="mh-quality-blockers">
            <h4>${text("Blocaje", "Blockers")}</h4>
            <ul>${item.blocking_issues.map((issue) => `<li>${escapeHtml(qualityIssueLabel(issue, language()))}</li>`).join("")}</ul>
          </section>
        ` : ""}

        <div class="mh-quality-form-grid">
          <label>${text("Status editorial", "Editorial status")}
            <select name="status">${statusOptions(item.status)}</select>
          </label>
          <label class="mh-quality-check"><input type="checkbox" name="bilingual_checked"${item.bilingual_checked ? " checked" : ""}><span>${text("Bilingv verificat", "Bilingual reviewed")}</span></label>
          <label class="mh-quality-check"><input type="checkbox" name="math_checked"${item.math_checked ? " checked" : ""}><span>${text("Matematic verificat", "Math reviewed")}</span></label>
          <label class="mh-quality-check"><input type="checkbox" name="source_checked"${item.source_checked ? " checked" : ""}><span>${text("Surse verificate", "Sources reviewed")}</span></label>
        </div>

        <label>${text("Surse suplimentare", "Additional sources")}
          <textarea name="source_urls" rows="4" placeholder="https://...">${escapeHtml(sources)}</textarea>
          <small>${text("Câte un URL sau identificator pe linie.", "One URL or source identifier per line.")}</small>
        </label>

        <label>${text("Note reviewer", "Reviewer notes")}
          <textarea name="reviewer_notes" rows="6" maxlength="10000">${escapeHtml(item.reviewer_notes)}</textarea>
        </label>

        <footer>
          <div>
            <span>${text("Ultimul review", "Last review")}: ${escapeHtml(formatDate(item.reviewed_at, language()))}</span>
            <span>v${Number(item.review_version || 1)}</span>
          </div>
          <div>
            <button class="btn small" type="button" data-quality-reset>${text("Resetează review", "Reset review")}</button>
            <button class="btn" type="submit"${state.busy ? " disabled" : ""}>${text("Salvează review", "Save review")}</button>
          </div>
        </footer>
      </form>
    `;
  }

  function render() {
    host.hidden = !state.enabled;
    if (!state.enabled) return;

    host.innerHTML = `
      <div class="mh-quality-shell">
        <div class="mh-quality-toolbar">
          <div>
            <span class="mh-admin-eyebrow">Content Quality Pipeline</span>
            <h3>${text("Control editorial", "Editorial control")}</h3>
            <p>${text("Review bilingv, matematic și al surselor înainte de verificare.", "Bilingual, mathematical and source review before verification.")}</p>
          </div>
          <button class="btn small" type="button" data-quality-refresh${state.busy ? " disabled" : ""}>Refresh</button>
        </div>

        <div class="mh-quality-summary">${summaryHtml()}</div>
        ${state.statusMessage ? `<div class="mh-quality-status">${escapeHtml(state.statusMessage)}</div>` : ""}
        ${state.error ? `<div class="mh-quality-error">${escapeHtml(state.error)}</div>` : ""}

        <div class="mh-quality-layout">
          <aside>
            <div class="mh-quality-filters">
              <label>${text("Caută", "Search")}<input type="search" data-quality-query value="${escapeHtml(state.filters.query)}" placeholder="ID, titlu..."></label>
              <label>${text("Tip", "Type")}
                <select data-quality-type>
                  <option value="all">${text("Toate", "All")}</option>
                  <option value="lesson"${state.filters.contentType === "lesson" ? " selected" : ""}>${text("Lecții", "Lessons")}</option>
                  <option value="problem"${state.filters.contentType === "problem" ? " selected" : ""}>${text("Probleme", "Problems")}</option>
                  <option value="exam"${state.filters.contentType === "exam" ? " selected" : ""}>${text("Examene", "Exams")}</option>
                </select>
              </label>
              <label>Status
                <select data-quality-status>
                  <option value="all">${text("Toate", "All")}</option>
                  ${["draft", "in_review", "changes_requested", "verified", "archived"].map((status) => `
                    <option value="${status}"${state.filters.status === status ? " selected" : ""}>${escapeHtml(qualityStatusLabel(status, language()))}</option>
                  `).join("")}
                </select>
              </label>
            </div>
            <div class="mh-quality-list">${itemListHtml()}</div>
          </aside>
          <main>${editorHtml()}</main>
        </div>
      </div>
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
      const payload = await loadContentQualityDashboard(supabase, { limit: 1000 });
      state.dashboard = normalizeContentQualityDashboard(payload);
      state.loaded = true;
      if (state.selectedKey && !selectedItem()) state.selectedKey = "";
      if (!state.selectedKey && state.dashboard.items.length) {
        state.selectedKey = itemKey(state.dashboard.items[0]);
      }
      state.statusMessage = text("Catalog quality sincronizat.", "Quality catalog synced.");
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
    state.statusMessage = text("Se salvează review-ul...", "Saving review...");
    render();
    try {
      await saveContentQualityReview(supabase, {
        contentType: item.content_type,
        contentId: item.content_id,
        payload
      });
      state.statusMessage = text("Review salvat.", "Review saved.");
      await load(true);
    } catch (error) {
      state.error = error?.message || String(error);
      state.statusMessage = "";
      state.busy = false;
      render();
    }
  }

  async function resetReview() {
    const item = selectedItem();
    if (!item) return;
    if (!confirm(text("Resetezi review-ul acestui material?", "Reset this content review?"))) return;
    state.busy = true;
    state.error = "";
    render();
    try {
      await resetContentQualityReview(supabase, {
        contentType: item.content_type,
        contentId: item.content_id
      });
      state.statusMessage = text("Review resetat.", "Review reset.");
      await load(true);
    } catch (error) {
      state.error = error?.message || String(error);
      state.busy = false;
      render();
    }
  }

  host.addEventListener("click", (event) => {
    const selectButton = event.target.closest("[data-quality-select]");
    if (selectButton) {
      state.selectedKey = selectButton.dataset.qualitySelect || "";
      render();
      return;
    }
    if (event.target.closest("[data-quality-refresh]")) {
      void load(true).catch(() => {});
      return;
    }
    if (event.target.closest("[data-quality-reset]")) {
      void resetReview();
    }
  });

  host.addEventListener("input", (event) => {
    if (event.target.matches("[data-quality-query]")) {
      state.filters.query = event.target.value;
      render();
    }
  });

  host.addEventListener("change", (event) => {
    if (event.target.matches("[data-quality-type]")) {
      state.filters.contentType = event.target.value;
      state.selectedKey = "";
      render();
    }
    if (event.target.matches("[data-quality-status]")) {
      state.filters.status = event.target.value;
      state.selectedKey = "";
      render();
    }
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
        state.dashboard = emptyContentQualityDashboard();
      }
      render();
    },
    getState() {
      return structuredClone(state);
    }
  };
}
