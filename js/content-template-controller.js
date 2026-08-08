import {
  contentTemplateById,
  contentTemplatesForType,
  templatePlaceholderCount
} from "./content-template-model.js";

const SAFE_DEFAULTS = new Map([
  ["mh_grade", new Set(["V"])],
  ["mh_chapter", new Set(["Numere Naturale"])],
  ["mh_difficulty", new Set(["1"])],
  ["mh_exam_type", new Set(["EN"])],
  ["mh_exam_hours", new Set(["2"])],
  ["mh_exam_title_ro", new Set(["Examen nou"])],
  ["mh_exam_title_en", new Set(["New exam"])],
  ["mh_exam_scoring_profile", new Set(["default_exact_v1"])]
]);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isSafeToFill(field, nextValue) {
  const current = String(field?.value ?? "");
  if (!current.trim()) return true;
  if (current === String(nextValue ?? "")) return false;
  return SAFE_DEFAULTS.get(field?.id)?.has(current) || false;
}

function dispatchFieldChange(field) {
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

export function applyContentTemplate(form, templateId) {
  if (!form) throw new Error("Template application requires the editor form.");
  const template = contentTemplateById(templateId);
  if (!template) throw new Error("Unknown content template.");

  const changed = [];
  const preserved = [];
  let placeholders = 0;

  for (const [fieldId, nextValue] of Object.entries(template.fields || {})) {
    const field = form.querySelector(`#${fieldId}`);
    if (!field) continue;
    if (!isSafeToFill(field, nextValue)) {
      preserved.push(fieldId);
      continue;
    }
    field.value = String(nextValue ?? "");
    placeholders += templatePlaceholderCount(nextValue);
    changed.push(fieldId);
    dispatchFieldChange(field);
  }

  return {
    templateId: template.id,
    type: template.type,
    changed,
    preserved,
    placeholders
  };
}

export function createContentTemplateController({
  host,
  form,
  getLanguage = () => "ro",
  getType = () => "lesson",
  onApplied = () => {}
} = {}) {
  if (!host) throw new Error("createContentTemplateController requires a host element.");
  if (!form) throw new Error("createContentTemplateController requires the editor form.");

  const state = { selectedId: "", status: "" };

  function language() {
    return String(getLanguage?.() || "ro").toLowerCase().startsWith("en") ? "en" : "ro";
  }

  function text(ro, en) {
    return language() === "en" ? en : ro;
  }

  function type() {
    return String(getType?.() || "lesson").toLowerCase();
  }

  function templates() {
    return contentTemplatesForType(type(), language());
  }

  function selectedTemplate() {
    const list = templates();
    if (!list.some((entry) => entry.id === state.selectedId)) state.selectedId = list[0]?.id || "";
    return list.find((entry) => entry.id === state.selectedId) || null;
  }

  function render() {
    const list = templates();
    const selected = selectedTemplate();
    host.innerHTML = `
      <section class="mh-content-template-panel">
        <div class="mh-content-template-head">
          <div><span>${text("Șabloane", "Templates")}</span><strong>${text("Structură rapidă", "Quick structure")}</strong></div>
          <span class="mh-content-template-type">${escapeHtml(type())}</span>
        </div>
        <div class="mh-content-template-controls">
          <select class="select" data-content-template-select aria-label="${text("Alege șablon", "Choose template")}">
            ${list.map((entry) => `<option value="${escapeHtml(entry.id)}"${entry.id === state.selectedId ? " selected" : ""}>${escapeHtml(entry.label)}</option>`).join("")}
          </select>
          <button class="btn small" type="button" data-content-template-apply${selected ? "" : " disabled"}>${text("Aplică șablonul", "Apply template")}</button>
        </div>
        <div class="mh-content-template-foot">
          <p>${escapeHtml(selected?.description || "")}</p>
          <span role="status">${escapeHtml(state.status)}</span>
        </div>
      </section>`;
    bind();
  }

  function applySelected() {
    const selected = selectedTemplate();
    if (!selected) return;
    const idInput = form.querySelector("#mh_id");
    if (idInput?.disabled) {
      state.status = text("Disponibil doar la creare. Folosește «Formular nou».", "Available only when creating. Use “New form”.");
      render();
      return;
    }

    try {
      const result = applyContentTemplate(form, selected.id);
      state.status = text(
        `${result.changed.length} câmpuri completate${result.preserved.length ? ` · ${result.preserved.length} păstrate` : ""}.`,
        `${result.changed.length} fields filled${result.preserved.length ? ` · ${result.preserved.length} preserved` : ""}.`
      );
      onApplied?.(result);
      render();
    } catch (error) {
      state.status = String(error?.message || error);
      render();
    }
  }

  function bind() {
    host.querySelector("[data-content-template-select]")?.addEventListener("change", (event) => {
      state.selectedId = event.target.value;
      state.status = "";
      render();
    });
    host.querySelector("[data-content-template-apply]")?.addEventListener("click", applySelected);
  }

  const onFormChange = (event) => {
    if (event.target?.id !== "mh_type") return;
    state.selectedId = "";
    state.status = "";
    render();
  };
  const onFormReset = () => queueMicrotask(() => { state.selectedId = ""; state.status = ""; render(); });
  form.addEventListener("change", onFormChange);
  form.addEventListener("reset", onFormReset);
  render();

  return {
    render,
    refreshLanguage() {
      render();
    },
    reset() {
      state.selectedId = "";
      state.status = "";
      render();
    },
    destroy() {
      form.removeEventListener("change", onFormChange);
      form.removeEventListener("reset", onFormReset);
      host.innerHTML = "";
    },
    getState: () => ({ ...state })
  };
}
