import {
  makeQuizItem,
  makeQuizOption,
  normalizeAdminLessonQuiz,
  validateAdminLessonQuiz
} from "./lesson-quiz-model.js";
import {
  adminDeleteLessonQuiz,
  adminGetLessonQuiz,
  adminSaveLessonQuiz
} from "./lesson-quiz-repository.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createLessonQuizAdminController({ host, supabase, onSaved = () => {}, getUserId = () => "" } = {}) {
  if (!host) throw new Error("Lesson quiz admin host is required.");

  let context = { type: "lesson", lessonId: "", existing: false };
  let draft = normalizeAdminLessonQuiz({}, "");
  let loadingEpoch = 0;
  let saving = false;
  let localSaveTimer = null;
  const LOCAL_DRAFT_VERSION = 1;

  function localDraftKey(lessonId = context.lessonId) {
    const user = String(getUserId?.() || "anonymous").replace(/[^a-zA-Z0-9_-]/g, "_");
    const lesson = String(lessonId || "new").replace(/[^a-zA-Z0-9_-]/g, "_");
    return `mh_lesson_quiz_admin_draft_v1:${user}:${lesson}`;
  }

  function readLocalDraft(lessonId = context.lessonId) {
    try {
      const parsed = JSON.parse(localStorage.getItem(localDraftKey(lessonId)) || "null");
      if (!parsed || parsed.version !== LOCAL_DRAFT_VERSION) return null;
      return normalizeAdminLessonQuiz(parsed.draft, lessonId);
    } catch {
      return null;
    }
  }

  function clearLocalDraft(lessonId = context.lessonId) {
    try { localStorage.removeItem(localDraftKey(lessonId)); } catch {}
  }

  function saveLocalDraft(readDom = true) {
    if (!context.existing || !context.lessonId || saving) return false;
    if (localSaveTimer) {
      clearTimeout(localSaveTimer);
      localSaveTimer = null;
    }
    try {
      if (readDom) readDraftFromDom();
      draft.lesson_id = context.lessonId;
      localStorage.setItem(localDraftKey(), JSON.stringify({
        version: LOCAL_DRAFT_VERSION,
        saved_at: new Date().toISOString(),
        draft
      }));
      return true;
    } catch {
      return false;
    }
  }

  function scheduleLocalDraftSave() {
    if (localSaveTimer) clearTimeout(localSaveTimer);
    localSaveTimer = setTimeout(saveLocalDraft, 220);
  }

  function status(message, tone = "") {
    const node = host.querySelector("[data-quiz-admin-status]");
    if (!node) return;
    node.textContent = message || "";
    node.dataset.tone = tone;
  }

  function render() {
    const disabled = !context.existing || !context.lessonId;
    host.innerHTML = `
      <section class="mh-lesson-quiz-admin-card">
        <header class="mh-lesson-quiz-admin-header">
          <div>
            <span class="mh-admin-eyebrow">Lecție</span>
            <h3>Verificare</h3>
            <p class="legend">Răspunsurile corecte nu sunt afișate elevilor.</p>
          </div>
          <div class="mh-lesson-quiz-admin-actions">
            ${disabled ? "" : `<span class="mh-lesson-quiz-publication ${draft.is_published ? "is-published" : "is-draft"}" data-quiz-publication-state>${draft.is_published ? "Publicată" : "Draft"}</span>`}
            <button class="btn small" data-quiz-admin-publish type="button" ${disabled || saving ? "disabled" : ""}>${draft.is_published ? "Retrage" : "Publică"}</button>
            <button class="btn small" data-quiz-admin-add type="button" ${disabled || saving ? "disabled" : ""}>Adaugă întrebare</button>
            <button class="btn small" data-quiz-admin-reload type="button" ${disabled || saving ? "disabled" : ""}>Reîncarcă</button>
          </div>
        </header>
        ${disabled ? `
          <div class="mh-admin-empty-state">
            <strong>Salvează lecția înainte.</strong>
            <span>Verificarea poate fi adăugată după ce salvezi lecția.</span>
          </div>` : `
          <div class="mh-lesson-quiz-settings">
            <label><span>Publicată</span><input data-quiz-setting="is_published" type="checkbox" ${draft.is_published ? "checked" : ""}></label>
            <label><span>Întrebări per set</span><input data-quiz-setting="question_count" type="number" min="1" max="20" value="${draft.question_count}"></label>
            <label><span>Prag (%)</span><input data-quiz-setting="pass_threshold" type="number" min="1" max="100" value="${draft.pass_threshold}"></label>
            <label><span>Amestecă întrebările</span><input data-quiz-setting="randomize_questions" type="checkbox" ${draft.randomize_questions ? "checked" : ""}></label>
            <label><span>Amestecă variantele</span><input data-quiz-setting="randomize_options" type="checkbox" ${draft.randomize_options ? "checked" : ""}></label>
          </div>
          <div class="mh-lesson-quiz-admin-list">
            ${draft.items.map((item, itemIndex) => `
              <article class="mh-lesson-quiz-item" data-quiz-item-index="${itemIndex}">
                <header>
                  <strong>Întrebarea ${itemIndex + 1}</strong>
                  <div>
                    <button class="btn small" data-quiz-item-up="${itemIndex}" type="button" ${itemIndex === 0 ? "disabled" : ""}>↑</button>
                    <button class="btn small" data-quiz-item-down="${itemIndex}" type="button" ${itemIndex === draft.items.length - 1 ? "disabled" : ""}>↓</button>
                    <button class="btn small" data-quiz-item-delete="${itemIndex}" type="button">Șterge</button>
                  </div>
                </header>
                <div class="mh-admin-form-grid">
                  <label><span>ID</span><input data-quiz-item-field="id" value="${escapeHtml(item.id)}"></label>
                  <label><span>Tip</span><select data-quiz-item-field="kind">
                    <option value="simple" ${item.kind === "simple" ? "selected" : ""}>Simplă</option>
                    <option value="multi" ${item.kind === "multi" ? "selected" : ""}>Răspuns multiplu</option>
                    <option value="recap" ${item.kind === "recap" ? "selected" : ""}>Recapitulare</option>
                  </select></label>
                  <label><span>Activă</span><input data-quiz-item-field="is_active" type="checkbox" ${item.is_active ? "checked" : ""}></label>
                </div>
                <label><span>Enunț RO</span><textarea data-quiz-item-field="prompt_ro" rows="2">${escapeHtml(item.prompt_ro)}</textarea></label>
                <label><span>Enunț EN</span><textarea data-quiz-item-field="prompt_en" rows="2">${escapeHtml(item.prompt_en)}</textarea></label>
                <div class="mh-lesson-quiz-options">
                  ${item.options.map((option, optionIndex) => `
                    <div class="mh-lesson-quiz-option" data-quiz-option-index="${optionIndex}">
                      <label class="mh-lesson-quiz-correct"><input data-quiz-option-field="is_correct" type="checkbox" ${option.is_correct ? "checked" : ""}><span>Corectă</span></label>
                      <input data-quiz-option-field="id" value="${escapeHtml(option.id)}" aria-label="ID variantă">
                      <input data-quiz-option-field="text_ro" value="${escapeHtml(option.text_ro)}" placeholder="Variantă RO">
                      <input data-quiz-option-field="text_en" value="${escapeHtml(option.text_en)}" placeholder="Variantă EN">
                      <button class="btn small" data-quiz-option-delete="${optionIndex}" type="button" ${item.options.length <= 2 ? "disabled" : ""}>×</button>
                    </div>`).join("")}
                  <button class="btn small" data-quiz-option-add="${itemIndex}" type="button" ${item.options.length >= 8 ? "disabled" : ""}>Adaugă variantă</button>
                </div>
                <label><span>Explicație RO</span><textarea data-quiz-item-field="explanation_ro" rows="2">${escapeHtml(item.explanation_ro)}</textarea></label>
                <label><span>Explicație EN</span><textarea data-quiz-item-field="explanation_en" rows="2">${escapeHtml(item.explanation_en)}</textarea></label>
              </article>`).join("") || `<div class="mh-admin-empty-state"><strong>Nicio întrebare</strong><span>Adaugă prima întrebare.</span></div>`}
          </div>
          <footer class="mh-lesson-quiz-admin-footer">
            <span class="legend" data-quiz-admin-status></span>
            <div>
              <button class="btn" data-quiz-admin-save type="button" ${saving ? "disabled" : ""}>${saving ? "Se salvează…" : "Salvează verificarea"}</button>
              <button class="btn" data-quiz-admin-delete type="button" ${draft.exists && !saving ? "" : "disabled"}>Șterge verificarea</button>
            </div>
          </footer>`}
      </section>`;

    if (disabled) return;
    bind();
  }

  function readDraftFromDom() {
    const settings = host.querySelectorAll("[data-quiz-setting]");
    settings.forEach((input) => {
      const key = input.dataset.quizSetting;
      draft[key] = input.type === "checkbox" ? input.checked : Number(input.value || 0);
    });
    host.querySelectorAll("[data-quiz-item-index]").forEach((card) => {
      const itemIndex = Number(card.dataset.quizItemIndex);
      const item = draft.items[itemIndex];
      card.querySelectorAll("[data-quiz-item-field]").forEach((input) => {
        const key = input.dataset.quizItemField;
        item[key] = input.type === "checkbox" ? input.checked : input.value;
      });
      card.querySelectorAll("[data-quiz-option-index]").forEach((row) => {
        const optionIndex = Number(row.dataset.quizOptionIndex);
        const option = item.options[optionIndex];
        row.querySelectorAll("[data-quiz-option-field]").forEach((input) => {
          const key = input.dataset.quizOptionField;
          option[key] = input.type === "checkbox" ? input.checked : input.value;
        });
      });
    });
  }

  function syncPublicationControls() {
    const checkbox = host.querySelector('[data-quiz-setting="is_published"]');
    const button = host.querySelector("[data-quiz-admin-publish]");
    const badge = host.querySelector("[data-quiz-publication-state]");
    const isPublished = Boolean(checkbox?.checked);
    if (button) button.textContent = isPublished ? "Retrage" : "Publică";
    if (badge) {
      badge.textContent = isPublished ? "Publicată" : "Draft";
      badge.classList.toggle("is-published", isPublished);
      badge.classList.toggle("is-draft", !isPublished);
    }
  }

  async function persistDraft(publishOverride = null) {
    if (saving) return;
    readDraftFromDom();
    draft.lesson_id = context.lessonId;
    if (typeof publishOverride === "boolean") {
      draft.is_published = publishOverride;
    }

    const errors = validateAdminLessonQuiz(draft);
    if (errors.length) {
      status(errors.join(" "), "error");
      return;
    }

    saving = true;
    render();
    status("Se salvează…");
    try {
      const saved = await adminSaveLessonQuiz(supabase, draft);
      draft = normalizeAdminLessonQuiz(saved, context.lessonId);
      saving = false;
      render();
      status(
        draft.is_published
          ? "Verificarea a fost salvată și publicată."
          : "Verificarea a fost salvată ca draft.",
        "success"
      );
      clearLocalDraft(context.lessonId);
      await onSaved(context.lessonId, draft);
    } catch (error) {
      saving = false;
      render();
      console.error("Lesson quiz save failed:", error);
      status(`Eroare: ${error?.message || error}`, "error");
    }
  }

  function bind() {
    host.querySelector("[data-quiz-admin-add]")?.addEventListener("click", () => {
      readDraftFromDom();
      draft.items.push(makeQuizItem(draft.items.length, context.lessonId));
      saveLocalDraft(false);
      render();
    });
    host.querySelector("[data-quiz-admin-reload]")?.addEventListener("click", () => {
      if (readLocalDraft(context.lessonId) && !confirm("Renunți la modificările nesalvate și reîncarci versiunea publicată?")) return;
      clearLocalDraft(context.lessonId);
      void load(context.lessonId, { preferLocal: false });
    });
    host.querySelectorAll("[data-quiz-item-up]").forEach((button) => button.addEventListener("click", () => {
      readDraftFromDom();
      const index = Number(button.dataset.quizItemUp);
      [draft.items[index - 1], draft.items[index]] = [draft.items[index], draft.items[index - 1]];
      saveLocalDraft(false);
      render();
    }));
    host.querySelectorAll("[data-quiz-item-down]").forEach((button) => button.addEventListener("click", () => {
      readDraftFromDom();
      const index = Number(button.dataset.quizItemDown);
      [draft.items[index + 1], draft.items[index]] = [draft.items[index], draft.items[index + 1]];
      saveLocalDraft(false);
      render();
    }));
    host.querySelectorAll("[data-quiz-item-delete]").forEach((button) => button.addEventListener("click", () => {
      readDraftFromDom();
      draft.items.splice(Number(button.dataset.quizItemDelete), 1);
      saveLocalDraft(false);
      render();
    }));
    host.querySelectorAll("[data-quiz-option-add]").forEach((button) => button.addEventListener("click", () => {
      readDraftFromDom();
      const index = Number(button.dataset.quizOptionAdd);
      draft.items[index].options.push(makeQuizOption(draft.items[index].options.length));
      saveLocalDraft(false);
      render();
    }));
    host.querySelectorAll("[data-quiz-option-delete]").forEach((button) => button.addEventListener("click", () => {
      readDraftFromDom();
      const itemCard = button.closest("[data-quiz-item-index]");
      const itemIndex = Number(itemCard.dataset.quizItemIndex);
      draft.items[itemIndex].options.splice(Number(button.dataset.quizOptionDelete), 1);
      saveLocalDraft(false);
      render();
    }));
    host.querySelector('[data-quiz-setting="is_published"]')?.addEventListener("change", () => { syncPublicationControls(); scheduleLocalDraftSave(); });
    host.querySelector("[data-quiz-admin-publish]")?.addEventListener("click", () => {
      const checkbox = host.querySelector('[data-quiz-setting="is_published"]');
      void persistDraft(!Boolean(checkbox?.checked));
    });
    host.querySelector("[data-quiz-admin-save]")?.addEventListener("click", () => {
      void persistDraft();
    });
    host.querySelector("[data-quiz-admin-delete]")?.addEventListener("click", async () => {
      if (!confirm("Ștergi verificarea acestei lecții?")) return;
      try {
        await adminDeleteLessonQuiz(supabase, context.lessonId);
        clearLocalDraft(context.lessonId);
        draft = normalizeAdminLessonQuiz({}, context.lessonId);
        render();
        status("Verificare ștearsă.", "success");
        onSaved(context.lessonId, draft);
      } catch (error) {
        status(`Eroare: ${error?.message || error}`, "error");
      }
    });
    host.querySelectorAll("input, textarea, select").forEach((field) => {
      field.addEventListener("input", scheduleLocalDraftSave);
      field.addEventListener("change", scheduleLocalDraftSave);
    });
  }

  async function load(lessonId, { preferLocal = true } = {}) {
    context = { type: "lesson", lessonId: String(lessonId || ""), existing: Boolean(lessonId) };
    const epoch = ++loadingEpoch;
    draft = normalizeAdminLessonQuiz({}, context.lessonId);
    render();
    if (!context.existing) return;
    status("Se încarcă…");
    try {
      const data = await adminGetLessonQuiz(supabase, context.lessonId);
      if (epoch !== loadingEpoch) return;
      const localDraft = preferLocal ? readLocalDraft(context.lessonId) : null;
      draft = localDraft || data;
      render();
      if (localDraft) status("Draft local restaurat.", "warning");
    } catch (error) {
      if (epoch !== loadingEpoch) return;
      render();
      status(`Eroare: ${error?.message || error}`, "error");
    }
  }

  function setContext(type, lessonId, existing = false) {
    saveLocalDraft();
    if (type !== "lesson") {
      context = { type, lessonId: "", existing: false };
      draft = normalizeAdminLessonQuiz({}, "");
      host.hidden = true;
      return;
    }
    host.hidden = false;
    void load(existing ? lessonId : "");
  }

  const saveOnPageHide = () => saveLocalDraft();
  const saveOnVisibilityChange = () => {
    if (document.visibilityState === "hidden") saveLocalDraft();
  };
  window.addEventListener("pagehide", saveOnPageHide);
  document.addEventListener("visibilitychange", saveOnVisibilityChange);

  render();
  return {
    load,
    setContext,
    render,
    saveLocalDraft,
    clearLocalDraft,
    getDraft: () => normalizeAdminLessonQuiz(draft, context.lessonId)
  };
}
