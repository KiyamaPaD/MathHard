import {
  deleteConceptSafely,
  loadConceptCatalog,
  replaceConceptPrerequisites,
  saveConcept
} from "./concept-repository.js";
import {
  buildConceptIndex,
  conceptLabel,
  conceptTypeLabel,
  filterConcepts,
  normalizeConceptCatalog,
  prerequisitesForConcept
} from "./concept-model.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function splitValues(value) {
  return [...new Set(
    String(value || "")
      .split(/[;,\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
  )];
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function emptyDraft() {
  return {
    id: "",
    slug: "",
    concept_type: "concept",
    domain: "",
    title_ro: "",
    title_en: "",
    summary_ro: "",
    summary_en: "",
    details_ro: "",
    details_en: "",
    notation: "",
    tags: [],
    published: false,
    position: 0,
    prerequisite_ids: []
  };
}

function draftFromConcept(index, concept) {
  return {
    ...emptyDraft(),
    ...concept,
    tags: Array.isArray(concept?.tags) ? [...concept.tags] : [],
    prerequisite_ids: prerequisitesForConcept(index, concept?.id)
      .filter((entry) => entry.edge_type === "required")
      .map((entry) => entry.prerequisite_concept_id)
  };
}

export function createConceptAdminController({
  host,
  supabase,
  getLanguage = () => "ro",
  onChanged = async () => {}
} = {}) {
  if (!host) throw new Error("createConceptAdminController requires a host element.");
  if (!supabase) throw new Error("createConceptAdminController requires Supabase.");

  const state = {
    enabled: false,
    busy: false,
    status: "",
    query: "",
    catalog: buildConceptIndex(normalizeConceptCatalog({})),
    selectedId: "",
    draft: emptyDraft()
  };

  function language() {
    return String(getLanguage?.() || "ro").toLowerCase().startsWith("en") ? "en" : "ro";
  }

  function selectedConcept() {
    return state.catalog.byId.get(state.selectedId) || null;
  }

  function mappingCount(conceptId) {
    return state.catalog.mappings.filter((mapping) => mapping.concept_id === conceptId).length;
  }

  function dependentCount(conceptId) {
    return state.catalog.edges.filter((edge) => edge.prerequisite_concept_id === conceptId).length;
  }

  function renderList() {
    const items = filterConcepts(state.catalog.concepts, state.query);
    if (!items.length) {
      return `<div class="mh-concept-admin-empty">${state.query ? "Niciun rezultat." : "Nu există încă concepte."}</div>`;
    }

    return items.map((concept) => `
      <button class="mh-concept-admin-list-item ${concept.id === state.selectedId ? "is-active" : ""}"
        type="button" data-concept-select="${escapeHtml(concept.id)}">
        <span>
          <small>${escapeHtml(conceptTypeLabel(concept.concept_type, language()))}${concept.domain ? ` · ${escapeHtml(concept.domain)}` : ""}</small>
          <strong>${escapeHtml(conceptLabel(concept, language()))}</strong>
          <code>${escapeHtml(concept.id)}</code>
        </span>
        <b>${concept.published ? "Public" : "Draft"}</b>
      </button>
    `).join("");
  }

  function prerequisiteOptions() {
    const selected = new Set(state.draft.prerequisite_ids || []);
    const candidates = state.catalog.concepts.filter((concept) => concept.id !== state.draft.id);
    if (!candidates.length) return `<div class="mh-concept-admin-empty">Nu există alte concepte.</div>`;

    return `
      <div class="mh-concept-admin-prerequisites">
        ${candidates.map((concept) => `
          <label>
            <input type="checkbox" name="concept_prerequisite" value="${escapeHtml(concept.id)}" ${selected.has(concept.id) ? "checked" : ""}>
            <span><strong>${escapeHtml(conceptLabel(concept, language()))}</strong><small>${escapeHtml(concept.id)}</small></span>
          </label>
        `).join("")}
      </div>
    `;
  }

  function renderEditor() {
    const editing = Boolean(state.selectedId && selectedConcept());
    const draft = state.draft;
    return `
      <form class="mh-concept-admin-form" data-concept-form>
        <div class="mh-concept-admin-form-head">
          <div>
            <span class="mh-admin-eyebrow">${editing ? "Editare" : "Concept nou"}</span>
            <h3>${editing ? escapeHtml(conceptLabel(selectedConcept(), language())) : "Concept Layer"}</h3>
          </div>
          <div>
            ${editing ? `<button class="btn small" type="button" data-concept-delete>Șterge</button>` : ""}
            <button class="btn small" type="button" data-concept-new>Nou</button>
          </div>
        </div>

        <div class="mh-concept-admin-grid">
          <label>ID
            <input name="id" value="${escapeHtml(draft.id)}" ${editing ? "disabled" : ""} placeholder="ex: ecuatii-gradul-intai" required>
          </label>
          <label>Slug
            <input name="slug" value="${escapeHtml(draft.slug)}" placeholder="generat din ID dacă rămâne gol">
          </label>
          <label>Tip
            <select name="concept_type">
              ${["concept", "skill", "theorem", "method"].map((type) => `
                <option value="${type}" ${draft.concept_type === type ? "selected" : ""}>${escapeHtml(conceptTypeLabel(type, language()))}</option>
              `).join("")}
            </select>
          </label>
          <label>Domeniu
            <input name="domain" value="${escapeHtml(draft.domain)}" placeholder="Algebră, Geometrie, Analiză...">
          </label>
          <label>Poziție
            <input name="position" type="number" value="${Number(draft.position || 0)}">
          </label>
          <label class="mh-concept-admin-check">
            <input name="published" type="checkbox" ${draft.published ? "checked" : ""}>
            <span>Publicat</span>
          </label>
        </div>

        <div class="mh-concept-admin-grid">
          <label>Titlu RO
            <input name="title_ro" value="${escapeHtml(draft.title_ro)}" required>
          </label>
          <label>Titlu EN
            <input name="title_en" value="${escapeHtml(draft.title_en)}">
          </label>
        </div>

        <div class="mh-concept-admin-grid">
          <label>Rezumat RO
            <textarea name="summary_ro" rows="3">${escapeHtml(draft.summary_ro)}</textarea>
          </label>
          <label>Rezumat EN
            <textarea name="summary_en" rows="3">${escapeHtml(draft.summary_en)}</textarea>
          </label>
          <label>Detalii RO
            <textarea name="details_ro" rows="5">${escapeHtml(draft.details_ro)}</textarea>
          </label>
          <label>Detalii EN
            <textarea name="details_en" rows="5">${escapeHtml(draft.details_en)}</textarea>
          </label>
        </div>

        <div class="mh-concept-admin-grid">
          <label>Notație
            <input name="notation" value="${escapeHtml(draft.notation)}" placeholder="ex: ax + b = 0">
          </label>
          <label>Tag-uri
            <input name="tags" value="${escapeHtml((draft.tags || []).join(", "))}" placeholder="ecuații, algebră, bază">
          </label>
        </div>

        <details class="mh-concept-admin-disclosure">
          <summary>Prerechizite <small>${(draft.prerequisite_ids || []).length}</small></summary>
          ${prerequisiteOptions()}
        </details>

        <div class="mh-concept-admin-meta">
          ${editing ? `
            <span>${mappingCount(draft.id)} mapări în conținut</span>
            <span>${dependentCount(draft.id)} concepte dependente</span>
          ` : ""}
        </div>

        <div class="mh-concept-admin-actions">
          <button class="btn" type="submit" ${state.busy ? "disabled" : ""}>${editing ? "Actualizează" : "Creează conceptul"}</button>
        </div>
      </form>
    `;
  }

  function render() {
    host.hidden = !state.enabled;
    if (!state.enabled) return;

    host.innerHTML = `
      <div class="mh-concept-admin-shell">
        <div class="mh-concept-admin-toolbar">
          <div>
            <span class="mh-admin-eyebrow">Curriculum semantic</span>
            <h3>Concept Layer</h3>
            <p>Conceptele sunt reutilizate de lecții și probleme. Detaliile rămân ascunse implicit pentru elev.</p>
          </div>
          <button class="btn small" type="button" data-concept-refresh ${state.busy ? "disabled" : ""}>Refresh</button>
        </div>
        ${state.status ? `<div class="mh-concept-admin-status">${escapeHtml(state.status)}</div>` : ""}
        <div class="mh-concept-admin-layout">
          <aside>
            <label class="mh-concept-admin-search">Caută
              <input type="search" data-concept-search value="${escapeHtml(state.query)}" placeholder="titlu, ID, domeniu, tag...">
            </label>
            <div class="mh-concept-admin-list">${renderList()}</div>
          </aside>
          <main>${renderEditor()}</main>
        </div>
      </div>
    `;
  }

  function readForm() {
    const form = host.querySelector("[data-concept-form]");
    if (!form) return null;
    const data = new FormData(form);
    const id = state.selectedId || String(data.get("id") || "").trim();
    const titleRo = String(data.get("title_ro") || "").trim();
    if (!id) throw new Error("Lipsește ID-ul conceptului.");
    if (!titleRo) throw new Error("Lipsește titlul RO.");

    return {
      payload: {
        id,
        slug: String(data.get("slug") || "").trim() || slugify(id),
        concept_type: String(data.get("concept_type") || "concept").trim(),
        domain: String(data.get("domain") || "").trim(),
        title_ro: titleRo,
        title_en: String(data.get("title_en") || "").trim(),
        summary_ro: String(data.get("summary_ro") || "").trim(),
        summary_en: String(data.get("summary_en") || "").trim(),
        details_ro: String(data.get("details_ro") || "").trim(),
        details_en: String(data.get("details_en") || "").trim(),
        notation: String(data.get("notation") || "").trim(),
        tags: splitValues(data.get("tags")),
        published: Boolean(form.querySelector('[name="published"]')?.checked),
        position: Number(data.get("position") || 0)
      },
      prerequisites: [...form.querySelectorAll('[name="concept_prerequisite"]:checked')]
        .map((input) => input.value)
    };
  }

  async function load(forceRefresh = false) {
    if (!state.enabled) return;
    state.busy = true;
    state.status = "Se încarcă...";
    render();
    try {
      state.catalog = buildConceptIndex(normalizeConceptCatalog(await loadConceptCatalog({
        supabase,
        forceRefresh
      })));
      if (state.selectedId && !state.catalog.byId.has(state.selectedId)) state.selectedId = "";
      state.draft = state.selectedId
        ? draftFromConcept(state.catalog, state.catalog.byId.get(state.selectedId))
        : emptyDraft();
      state.status = `${state.catalog.concepts.length} concepte · ${state.catalog.mappings.length} mapări`;
    } catch (error) {
      state.status = `Eroare: ${error.message || error}`;
    } finally {
      state.busy = false;
      render();
    }
  }

  async function submit() {
    const values = readForm();
    if (!values) return;
    state.draft = {
      ...state.draft,
      ...values.payload,
      prerequisite_ids: [...values.prerequisites]
    };
    state.busy = true;
    state.status = "Se salvează...";
    render();
    try {
      const saved = await saveConcept(supabase, values.payload);
      await replaceConceptPrerequisites(supabase, values.payload.id, values.prerequisites);
      state.selectedId = String(saved?.id || values.payload.id);
      await load(true);
      await onChanged?.();
      state.status = "Concept salvat.";
      render();
    } catch (error) {
      state.status = `Eroare: ${error.message || error}`;
      state.busy = false;
      render();
    }
  }

  async function removeSelected() {
    const concept = selectedConcept();
    if (!concept) return;
    if (!confirm(`Ștergi conceptul ${concept.id}?`)) return;
    state.busy = true;
    state.status = "Se verifică dependențele...";
    render();
    try {
      await deleteConceptSafely(supabase, concept.id);
      state.selectedId = "";
      state.draft = emptyDraft();
      await load(true);
      await onChanged?.();
      state.status = "Concept șters.";
      render();
    } catch (error) {
      state.status = `Nu poate fi șters: ${error.message || error}`;
      state.busy = false;
      render();
    }
  }

  host.addEventListener("click", (event) => {
    const selectButton = event.target.closest("[data-concept-select]");
    if (selectButton) {
      state.selectedId = selectButton.dataset.conceptSelect || "";
      state.draft = draftFromConcept(state.catalog, selectedConcept());
      render();
      return;
    }
    if (event.target.closest("[data-concept-new]")) {
      state.selectedId = "";
      state.draft = emptyDraft();
      state.status = "";
      render();
      return;
    }
    if (event.target.closest("[data-concept-refresh]")) {
      void load(true);
      return;
    }
    if (event.target.closest("[data-concept-delete]")) {
      void removeSelected();
    }
  });

  host.addEventListener("input", (event) => {
    if (event.target.matches("[data-concept-search]")) {
      state.query = event.target.value;
      const list = host.querySelector(".mh-concept-admin-list");
      if (list) list.innerHTML = renderList();
    }
  });

  host.addEventListener("submit", (event) => {
    if (!event.target.matches("[data-concept-form]")) return;
    event.preventDefault();
    void submit();
  });

  return {
    load,
    render,
    setAdmin(value) {
      state.enabled = Boolean(value);
      if (!state.enabled) {
        state.status = "";
        state.selectedId = "";
        state.draft = emptyDraft();
      }
      render();
    }
  };
}
