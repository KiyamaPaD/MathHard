import {
  ACHIEVEMENT_METRICS,
  ACHIEVEMENT_CATEGORIES,
  CHALLENGE_METRICS,
  nextDuplicateId,
  normalizeAchievementDraft,
  normalizeChallengeDraft,
  normalizeTemplateDraft
} from "./gamification-admin-model.js";
import {
  deleteAchievement,
  deleteChallenge,
  deleteChallengeTemplate,
  generateChallenge,
  loadGamificationStudio,
  saveAchievement,
  saveChallenge,
  saveChallengeTemplate
} from "./gamification-admin-repository.js";

const METRIC_LABELS = {
  learned_lessons: "Lecții finalizate",
  solved_problems: "Probleme rezolvate",
  passed_exams: "Examene promovate",
  total_xp: "XP total",
  perfect_solutions: "Rezolvări perfecte",
  current_streak: "Streak curent",
  longest_streak: "Streak maxim",
  accuracy: "Acuratețe (%)",
  chapter_checks_completed: "Verificări de capitol",
  chapter_completed: "Capitol finalizat",
  chapters_completed: "Capitole finalizate",
  extensions_completed: "Extensii finalizate",
  chapter_practice_completed: "Toate problemele unui capitol",
  answer_correct: "Răspunsuri corecte",
  solved_problem: "Probleme rezolvate",
  lesson_completed: "Lecții finalizate",
  exam_finished: "Examene finalizate"
};

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function unwrap(data) {
  return Array.isArray(data) && data.length === 1 ? data[0] : data;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nextWeekEnd(start = todayIso()) {
  const date = new Date(`${start}T12:00:00`);
  date.setDate(date.getDate() + 6);
  return date.toISOString().slice(0, 10);
}

function readForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function setFormValues(form, values = {}) {
  for (const element of form.elements) {
    if (!element.name) continue;
    const value = values[element.name];
    if (element.type === "checkbox") element.checked = Boolean(value);
    else if (value != null) element.value = String(value);
  }
}

function metricOptions(metrics, selected) {
  return metrics.map((metric) => `<option value="${esc(metric)}"${metric === selected ? " selected" : ""}>${esc(METRIC_LABELS[metric] || metric)}</option>`).join("");
}

function statusBadge(active, labelActive = "Activ", labelInactive = "Inactiv") {
  return `<span class="mh-gamification-state" data-state="${active ? "active" : "inactive"}">${active ? labelActive : labelInactive}</span>`;
}

export function createGamificationAdminController({ host, supabase } = {}) {
  if (!host) throw new Error("Gamification Studio host is missing.");

  const state = {
    loaded: false,
    loading: false,
    activeTab: "achievements",
    query: "",
    payload: { achievements: [], challenges: [], templates: [] },
    chapters: [],
    editing: { type: null, id: null }
  };

  host.innerHTML = `
    <div class="mh-gamification-admin-toolbar">
      <div class="mh-gamification-admin-tabs" role="tablist">
        <button class="is-active" data-gamification-tab="achievements" type="button">Achievements</button>
        <button data-gamification-tab="challenges" type="button">Challenge-uri</button>
        <button data-gamification-tab="automation" type="button">Automatizări</button>
        <button data-gamification-tab="simulator" type="button">Simulator UI</button>
      </div>
      <div class="mh-gamification-admin-actions">
        <input id="mhGamificationAdminSearch" type="search" placeholder="Caută..." autocomplete="off">
        <button class="btn small" data-gamification-action="refresh" type="button">Actualizează</button>
        <button class="btn" data-gamification-action="new" type="button">Creează</button>
      </div>
    </div>
    <div class="mh-gamification-admin-feedback" id="mhGamificationAdminFeedback" role="status"></div>
    <div class="mh-gamification-admin-layout">
      <section class="mh-gamification-admin-list" id="mhGamificationAdminList"></section>
      <aside class="mh-gamification-admin-editor" id="mhGamificationAdminEditor"></aside>
    </div>
  `;

  const listHost = host.querySelector("#mhGamificationAdminList");
  const editorHost = host.querySelector("#mhGamificationAdminEditor");
  const feedback = host.querySelector("#mhGamificationAdminFeedback");
  const search = host.querySelector("#mhGamificationAdminSearch");

  function setFeedback(message = "", stateName = "") {
    feedback.textContent = message;
    feedback.dataset.state = stateName;
  }

  function currentItems() {
    const source = state.activeTab === "achievements"
      ? state.payload.achievements
      : state.activeTab === "challenges"
        ? state.payload.challenges
        : state.activeTab === "automation"
          ? state.payload.templates
          : [];
    const query = state.query.trim().toLowerCase();
    if (!query) return source;
    return source.filter((item) => [item.id, item.title_ro, item.title_en, item.metric]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }

  function renderAchievementCard(item) {
    const unlocked = Number(item.unlocked_count || 0);
    return `
      <article class="mh-gamification-admin-row" data-id="${esc(item.id)}">
        <div class="mh-gamification-admin-row-icon">${esc(item.icon || "✦")}</div>
        <div class="mh-gamification-admin-row-main">
          <div class="mh-gamification-admin-row-title">
            <strong>${esc(item.title_ro || item.id)}</strong>
            ${statusBadge(item.active)}
            <span class="mh-gamification-rarity" data-rarity="${esc(item.rarity || "common")}">${esc(item.rarity || "common")}</span>
          </div>
          <code>${esc(item.id)}</code>
          <div class="mh-gamification-admin-meta">
            <span>${esc(METRIC_LABELS[item.criteria?.metric] || item.criteria?.metric)}</span>
            <span>Țintă: ${esc(item.criteria?.threshold ?? 0)}</span>
            <span>+${esc(item.reward_xp || 0)} XP</span>
            <span>Deblocat: ${unlocked}</span>
          </div>
        </div>
        <div class="mh-gamification-admin-row-actions">
          <button class="btn small" data-row-action="preview" type="button">Testează</button>
          <button class="btn small" data-row-action="edit" type="button">Editează</button>
          <button class="btn small" data-row-action="duplicate" type="button">Duplică</button>
          <button class="btn small danger" data-row-action="delete" type="button">Șterge</button>
        </div>
      </article>`;
  }

  function renderChallengeCard(item) {
    const stats = item.stats || {};
    const current = item.featured ? '<span class="mh-gamification-state" data-state="featured">Curent</span>' : "";
    return `
      <article class="mh-gamification-admin-row" data-id="${esc(item.id)}">
        <div class="mh-gamification-admin-row-icon">◆</div>
        <div class="mh-gamification-admin-row-main">
          <div class="mh-gamification-admin-row-title">
            <strong>${esc(item.title_ro || item.id)}</strong>
            ${statusBadge(item.active)}${current}
            <span class="mh-gamification-source">${esc(item.source || "manual")}</span>
          </div>
          <code>${esc(item.id)}</code>
          <div class="mh-gamification-admin-meta">
            <span>${esc(METRIC_LABELS[item.metric] || item.metric)}: ${esc(item.target)}</span>
            <span>+${esc(item.reward_xp)} XP</span>
            <span>${esc(item.starts_on)} → ${esc(item.ends_on)}</span>
            <span>Participanți: ${esc(stats.participants || 0)}</span>
            <span>Finalizat: ${esc(stats.completed || 0)}</span>
            <span>Revendicări: ${esc(stats.claims || 0)}</span>
          </div>
        </div>
        <div class="mh-gamification-admin-row-actions">
          <button class="btn small" data-row-action="edit" type="button">Editează</button>
          <button class="btn small" data-row-action="duplicate" type="button">Duplică</button>
          <button class="btn small danger" data-row-action="delete" type="button">Șterge</button>
        </div>
      </article>`;
  }

  function renderTemplateCard(item) {
    return `
      <article class="mh-gamification-admin-row" data-id="${esc(item.id)}">
        <div class="mh-gamification-admin-row-icon">↻</div>
        <div class="mh-gamification-admin-row-main">
          <div class="mh-gamification-admin-row-title">
            <strong>${esc(item.title_ro || item.id)}</strong>
            ${statusBadge(item.enabled, "Automat", "Oprit")}
          </div>
          <code>${esc(item.id)}</code>
          <div class="mh-gamification-admin-meta">
            <span>${esc(METRIC_LABELS[item.metric] || item.metric)}</span>
            <span>Țintă: ${esc(item.target_min)}–${esc(item.target_max)}</span>
            <span>XP: ${esc(item.reward_min)}–${esc(item.reward_max)}</span>
          </div>
        </div>
        <div class="mh-gamification-admin-row-actions">
          <button class="btn small" data-row-action="generate" type="button">Generează</button>
          <button class="btn small" data-row-action="edit" type="button">Editează</button>
          <button class="btn small" data-row-action="duplicate" type="button">Duplică</button>
          <button class="btn small danger" data-row-action="delete" type="button">Șterge</button>
        </div>
      </article>`;
  }

  function selectedChapter(id = "") {
    return state.chapters.find((chapter) => String(chapter.id) === String(id)) || state.chapters[0] || null;
  }

  function renderSimulator() {
    const chapter = selectedChapter();
    const conceptTotal = Array.isArray(chapter?.concept_ids) ? chapter.concept_ids.length : Number(chapter?.concept_total || 0);
    const practiceTotal = Number(chapter?.practice_total || 0);
    const extensionTotal = Number(chapter?.extension_total || 0);
    const defaultSolved = Math.min(practiceTotal, Number(chapter?.problems_solved || 0));
    const defaultExtensions = Math.min(extensionTotal, Number(chapter?.extensions_completed || 0));
    const exploration = practiceTotal + conceptTotal + extensionTotal > 0
      ? Math.round(100 * (defaultSolved + defaultExtensions) / (practiceTotal + conceptTotal + extensionTotal))
      : 0;

    listHost.innerHTML = `
      <section class="mh-gamification-simulator">
        <header>
          <div><span>ADMIN ONLY</span><h3>Simulator UI</h3><p>Preview-uri locale. Nu scriu progres, XP, claims sau achievements în baza de date.</p></div>
          <strong>0 DB writes</strong>
        </header>

        <div class="mh-gamification-simulator-grid">
          <form class="mh-gamification-sim-card" data-sim-form="chapter">
            <div class="mh-gamification-sim-card-head"><span>🏁</span><div><strong>Final de capitol</strong><small>Testează overlay-ul, confetti-ul și layout-ul fără să finalizezi capitolul real.</small></div></div>
            <label>Capitol
              <select name="chapter_id" data-sim-chapter-select>
                ${state.chapters.map((item) => `<option value="${esc(item.id)}">${esc(item.title || item.title_ro || item.id)}</option>`).join("")}
              </select>
            </label>
            ${chapter ? `
            <div class="mh-gamification-sim-fields">
              <label>Probleme rezolvate<input name="problems_solved" type="number" min="0" max="${practiceTotal}" value="${defaultSolved}"></label>
              <label>Concepte stăpânite<input name="concepts_mastered" type="number" min="0" max="${conceptTotal}" value="${Math.min(conceptTotal, Math.max(0, conceptTotal - 2))}"></label>
              <label>Extensii explorate<input name="extensions_completed" type="number" min="0" max="${extensionTotal}" value="${defaultExtensions}"></label>
              <label>Explorare %<input name="exploration_percent" type="number" min="0" max="100" value="${exploration}"></label>
              <label>Accuracy verificări %<input name="verification_accuracy" type="number" min="0" max="100" step="0.1" value="94"></label>
              <label>Probleme fără hint<input name="problems_without_hints" type="number" min="0" max="${practiceTotal}" value="${Math.min(defaultSolved, Math.max(0, defaultSolved - 2))}"></label>
              <label>Concept puternic<input name="strongest_concept" value="Reuniune și intersecție"></label>
              <label>Concept de revăzut<input name="review_concept" value="Diagrame cu 3 mulțimi"></label>
            </div>` : `<div class="mh-admin-empty-state"><strong>Niciun capitol disponibil</strong><span>Rulează Phase 118C și reîncarcă Studio-ul.</span></div>`}
            <button class="btn" type="submit" ${chapter ? "" : "disabled"}>Simulează CAPITOL FINALIZAT</button>
          </form>

          <form class="mh-gamification-sim-card" data-sim-form="achievement">
            <div class="mh-gamification-sim-card-head"><span>✦</span><div><strong>Achievement unlock</strong><small>Rulează exact celebrarea vizuală pentru orice achievement, inclusiv Legendary/secret.</small></div></div>
            <label>Achievement
              <select name="achievement_id">
                ${state.payload.achievements.map((item) => `<option value="${esc(item.id)}">${esc(item.icon || "✦")} ${esc(item.title_ro || item.id)} · ${esc(item.rarity || "common")}</option>`).join("")}
              </select>
            </label>
            <button class="btn" type="submit" ${state.payload.achievements.length ? "" : "disabled"}>Simulează unlock + confetti</button>
            <small class="mh-gamification-sim-note">În simulator, achievement-ul nu este acordat și XP-ul nu este modificat. După animație rămâi exact în Admin Studio.</small>
          </form>
        </div>
      </section>`;
  }

  function renderList() {
    host.classList.toggle("is-simulator", state.activeTab === "simulator");
    search.hidden = state.activeTab === "simulator";
    host.querySelector("[data-gamification-action='new']")?.toggleAttribute("hidden", state.activeTab === "simulator");
    if (state.activeTab === "simulator") {
      editorHost.innerHTML = "";
      renderSimulator();
      return;
    }
    const items = currentItems();
    if (!items.length) {
      listHost.innerHTML = `<div class="mh-admin-empty-state"><strong>Niciun rezultat</strong><span>Schimbă filtrul sau creează un item nou.</span></div>`;
      return;
    }
    listHost.innerHTML = items.map((item) => state.activeTab === "achievements"
      ? renderAchievementCard(item)
      : state.activeTab === "challenges"
        ? renderChallengeCard(item)
        : renderTemplateCard(item)).join("");
  }

  function achievementForm(item = {}) {
    const draft = normalizeAchievementDraft(item);
    return `
      <form class="mh-gamification-form" data-editor-type="achievement">
        <div class="mh-gamification-form-header"><div><span>Achievement</span><h3>${state.editing.id ? "Editează" : "Creează"}</h3></div><button class="btn small" data-editor-action="close" type="button">Închide</button></div>
        <div class="mh-gamification-form-grid two">
          <label>ID<input name="id" value="${esc(draft.id)}" ${state.editing.id ? "readonly" : ""}></label>
          <label>Icon<input name="icon" value="${esc(draft.icon)}" maxlength="12"></label>
          <label>Titlu RO<input name="title_ro" value="${esc(draft.title_ro)}" required></label>
          <label>Titlu EN<input name="title_en" value="${esc(draft.title_en)}"></label>
        </div>
        <label>Descriere RO<textarea name="description_ro" rows="3">${esc(draft.description_ro)}</textarea></label>
        <label>Descriere EN<textarea name="description_en" rows="3">${esc(draft.description_en)}</textarea></label>
        <div class="mh-gamification-form-grid two">
          <label>Categorie<select name="category">${ACHIEVEMENT_CATEGORIES.map(v => `<option value="${v}"${draft.category===v?" selected":""}>${v}</option>`).join("")}</select></label>
          <label>Condiție<select name="metric">${metricOptions(ACHIEVEMENT_METRICS, draft.criteria.metric)}</select></label>
          <label>Țintă<input name="threshold" type="number" min="0" step="0.01" value="${esc(draft.criteria.threshold)}"></label>
          <label>Încercări minime<input name="min_attempts" type="number" min="0" value="${esc(draft.criteria.min_attempts || 0)}"></label>
          <label>Context capitol<input name="chapter_id" value="${esc(draft.criteria.chapter_id || "")}" placeholder="ex. m1-sets"></label>
          <label>Recompensă XP<input name="reward_xp" type="number" min="0" value="${esc(draft.reward_xp)}"></label>
          <label>Raritate<select name="rarity">${["common","uncommon","rare","epic","legendary"].map(v => `<option value="${v}"${draft.rarity===v?" selected":""}>${v}</option>`).join("")}</select></label>
          <label>Ordine<input name="sort_order" type="number" value="${esc(draft.sort_order)}"></label>
        </div>
        <div class="mh-gamification-switches">
          <label><input name="active" type="checkbox" ${draft.active ? "checked" : ""}> Activ</label>
          <label><input name="hidden_until_unlocked" type="checkbox" ${draft.hidden_until_unlocked ? "checked" : ""}> Ascuns până la deblocare</label>
        </div>
        <button class="btn" type="submit">Salvează achievement</button>
      </form>`;
  }

  function challengeForm(item = {}) {
    const base = { starts_on: todayIso(), ends_on: nextWeekEnd(), ...item };
    const draft = normalizeChallengeDraft(base);
    return `
      <form class="mh-gamification-form" data-editor-type="challenge">
        <div class="mh-gamification-form-header"><div><span>Challenge manual</span><h3>${state.editing.id ? "Editează" : "Creează"}</h3></div><button class="btn small" data-editor-action="close" type="button">Închide</button></div>
        <div class="mh-gamification-form-grid two">
          <label>ID<input name="id" value="${esc(draft.id)}" ${state.editing.id ? "readonly" : ""}></label>
          <label>Metrică<select name="metric">${metricOptions(CHALLENGE_METRICS, draft.metric)}</select></label>
          <label>Titlu RO<input name="title_ro" value="${esc(draft.title_ro)}" required></label>
          <label>Titlu EN<input name="title_en" value="${esc(draft.title_en)}"></label>
        </div>
        <label>Descriere RO<textarea name="description_ro" rows="3">${esc(draft.description_ro)}</textarea></label>
        <label>Descriere EN<textarea name="description_en" rows="3">${esc(draft.description_en)}</textarea></label>
        <div class="mh-gamification-form-grid two">
          <label>Țintă<input name="target" type="number" min="1" value="${esc(draft.target)}"></label>
          <label>Recompensă XP<input name="reward_xp" type="number" min="0" value="${esc(draft.reward_xp)}"></label>
          <label>Începe<input name="starts_on" type="date" value="${esc(draft.starts_on)}" required></label>
          <label>Se termină<input name="ends_on" type="date" value="${esc(draft.ends_on)}" required></label>
          <label>Prioritate<input name="sort_order" type="number" value="${esc(draft.sort_order)}"></label>
        </div>
        <div class="mh-gamification-switches">
          <label><input name="active" type="checkbox" ${draft.active ? "checked" : ""}> Activ</label>
          <label><input name="featured" type="checkbox" ${draft.featured ? "checked" : ""}> Challenge curent</label>
        </div>
        <button class="btn" type="submit">Salvează challenge</button>
      </form>`;
  }

  function templateForm(item = {}) {
    const draft = normalizeTemplateDraft(item);
    return `
      <form class="mh-gamification-form" data-editor-type="template">
        <div class="mh-gamification-form-header"><div><span>Template automat</span><h3>${state.editing.id ? "Editează" : "Creează"}</h3></div><button class="btn small" data-editor-action="close" type="button">Închide</button></div>
        <div class="mh-gamification-form-grid two">
          <label>ID<input name="id" value="${esc(draft.id)}" ${state.editing.id ? "readonly" : ""}></label>
          <label>Metrică<select name="metric">${metricOptions(CHALLENGE_METRICS, draft.metric)}</select></label>
          <label>Titlu RO<input name="title_ro" value="${esc(draft.title_ro)}" required></label>
          <label>Titlu EN<input name="title_en" value="${esc(draft.title_en)}"></label>
        </div>
        <label>Descriere RO <small>Folosește {target}</small><textarea name="description_ro" rows="3">${esc(draft.description_ro)}</textarea></label>
        <label>Descriere EN <small>Folosește {target}</small><textarea name="description_en" rows="3">${esc(draft.description_en)}</textarea></label>
        <div class="mh-gamification-form-grid two">
          <label>Țintă minimă<input name="target_min" type="number" min="1" value="${esc(draft.target_min)}"></label>
          <label>Țintă maximă<input name="target_max" type="number" min="1" value="${esc(draft.target_max)}"></label>
          <label>XP minim<input name="reward_min" type="number" min="0" value="${esc(draft.reward_min)}"></label>
          <label>XP maxim<input name="reward_max" type="number" min="0" value="${esc(draft.reward_max)}"></label>
          <label>Greutate<input name="weight" type="number" min="1" value="${esc(draft.weight)}"></label>
          <label>Ordine<input name="sort_order" type="number" value="${esc(draft.sort_order)}"></label>
        </div>
        <div class="mh-gamification-switches"><label><input name="enabled" type="checkbox" ${draft.enabled ? "checked" : ""}> Generare automată activă</label></div>
        <button class="btn" type="submit">Salvează template</button>
      </form>`;
  }

  function openEditor(item = null, duplicate = false) {
    const type = state.activeTab === "achievements" ? "achievement" : state.activeTab === "challenges" ? "challenge" : "template";
    let draft = item ? structuredClone(item) : {};
    if (duplicate && item) {
      const source = type === "achievement" ? state.payload.achievements : type === "challenge" ? state.payload.challenges : state.payload.templates;
      draft.id = nextDuplicateId(item.id, source.map((row) => row.id));
      if (type === "challenge") {
        draft.featured = false;
        draft.source = "manual";
      }
    }
    state.editing = { type, id: item && !duplicate ? item.id : null };
    editorHost.innerHTML = type === "achievement" ? achievementForm(draft) : type === "challenge" ? challengeForm(draft) : templateForm(draft);
    editorHost.classList.add("is-open");
  }

  function closeEditor() {
    state.editing = { type: null, id: null };
    editorHost.innerHTML = `<div class="mh-gamification-editor-empty"><strong>Selectează un item</strong><span>Editează, duplică sau creează unul nou.</span></div>`;
    editorHost.classList.remove("is-open");
  }

  function applyPayload(payload) {
    state.payload = {
      achievements: Array.isArray(payload?.achievements) ? payload.achievements : [],
      challenges: Array.isArray(payload?.challenges) ? payload.challenges : [],
      templates: Array.isArray(payload?.templates) ? payload.templates : []
    };
    state.loaded = true;
    renderList();
  }

  async function load({ force = false } = {}) {
    if (state.loading || (state.loaded && !force)) return;
    state.loading = true;
    setFeedback("Se încarcă...", "loading");
    try {
      applyPayload(await loadGamificationStudio(supabase));
      try {
        const { data: chapterData, error: chapterError } = await supabase.rpc("mh_get_user_chapter_progress", { p_locale: "ro" });
        if (chapterError) throw chapterError;
        const chapterPayload = unwrap(chapterData) || {};
        state.chapters = Array.isArray(chapterPayload.chapters) ? chapterPayload.chapters : [];
      } catch (chapterError) {
        console.warn("Chapter simulator targets unavailable:", chapterError);
        state.chapters = [];
      }
      renderList();
      setFeedback("Recompense actualizate.", "success");
    } catch (error) {
      console.error("Gamification Studio load failed:", error);
      setFeedback("Datele nu au putut fi încărcate. Reîncearcă.", "error");
    } finally {
      state.loading = false;
    }
  }

  async function persist(form) {
    const raw = readForm(form);
    for (const checkbox of form.querySelectorAll('input[type="checkbox"]')) raw[checkbox.name] = checkbox.checked;
    setFeedback("Se salvează...", "loading");
    try {
      const type = form.dataset.editorType;
      const payload = type === "achievement"
        ? await saveAchievement(supabase, normalizeAchievementDraft(raw))
        : type === "challenge"
          ? await saveChallenge(supabase, normalizeChallengeDraft(raw))
          : await saveChallengeTemplate(supabase, normalizeTemplateDraft(raw));
      applyPayload(payload);
      closeEditor();
      window.dispatchEvent(new CustomEvent("mh:gamification-admin-updated"));
      setFeedback("Salvat.", "success");
    } catch (error) {
      console.error("Gamification Studio save failed:", error);
      setFeedback("Datele nu au putut fi încărcate. Reîncearcă.", "error");
    }
  }

  host.addEventListener("click", async (event) => {
    const tab = event.target.closest("[data-gamification-tab]");
    if (tab) {
      state.activeTab = tab.dataset.gamificationTab;
      host.querySelectorAll("[data-gamification-tab]").forEach((button) => button.classList.toggle("is-active", button === tab));
      closeEditor();
      renderList();
      return;
    }

    const action = event.target.closest("[data-gamification-action]")?.dataset.gamificationAction;
    if (action === "refresh") return void load({ force: true });
    if (action === "new") return openEditor();

    if (event.target.closest("[data-editor-action='close']")) return closeEditor();

    const rowAction = event.target.closest("[data-row-action]");
    if (!rowAction) return;
    const id = rowAction.closest("[data-id]")?.dataset.id;
    const source = state.activeTab === "achievements"
      ? state.payload.achievements
      : state.activeTab === "challenges"
        ? state.payload.challenges
        : state.activeTab === "automation"
          ? state.payload.templates
          : [];
    const item = source.find((row) => row.id === id);
    if (!item) return;

    const name = rowAction.dataset.rowAction;
    if (name === "preview" && state.activeTab === "achievements") {
      window.dispatchEvent(new CustomEvent("mathhard:celebrate", {
        detail: {
          kind: "achievement",
          title: "Achievement deblocat",
          subtitle: `${item.icon || "✦"} ${item.title_ro || item.id} · ${item.rarity || "common"}`,
          xp: Number(item.reward_xp || 0),
          duration: 4200
        }
      }));
      setFeedback(`Preview local: ${item.title_ro || item.id}. Nicio modificare salvată.`, "success");
      return;
    }
    if (name === "edit") return openEditor(item);
    if (name === "duplicate") return openEditor(item, true);
    if (name === "generate") {
      if (!confirm(`Generezi challenge din template-ul „${item.title_ro || item.id}”?`)) return;
      setFeedback("Se generează...", "loading");
      try {
        applyPayload(await generateChallenge(supabase, item.id, null, true));
        window.dispatchEvent(new CustomEvent("mh:gamification-admin-updated"));
        setFeedback("Challenge generat și setat ca activ.", "success");
      } catch (error) {
        setFeedback("Datele nu au putut fi încărcate. Reîncearcă.", "error");
      }
      return;
    }
    if (name === "delete") {
      if (!confirm(`Ștergi „${item.title_ro || item.id}”? Itemurile deja folosite trebuie dezactivate, nu șterse.`)) return;
      setFeedback("Se șterge...", "loading");
      try {
        const payload = state.activeTab === "achievements"
          ? await deleteAchievement(supabase, item.id)
          : state.activeTab === "challenges"
            ? await deleteChallenge(supabase, item.id)
            : await deleteChallengeTemplate(supabase, item.id);
        applyPayload(payload);
        closeEditor();
        window.dispatchEvent(new CustomEvent("mh:gamification-admin-updated"));
        setFeedback("Șters.", "success");
      } catch (error) {
        setFeedback("Datele nu au putut fi încărcate. Reîncearcă.", "error");
      }
    }
  });

  host.addEventListener("submit", (event) => {
    const simForm = event.target.closest("[data-sim-form]");
    if (simForm) {
      event.preventDefault();
      if (simForm.dataset.simForm === "achievement") {
        const id = String(new FormData(simForm).get("achievement_id") || "");
        const achievement = state.payload.achievements.find((item) => String(item.id) === id);
        if (!achievement) return;
        window.dispatchEvent(new CustomEvent("mathhard:celebrate", {
          detail: {
            kind: "achievement",
            title: "Achievement deblocat",
            subtitle: `${achievement.icon || "✦"} ${achievement.title_ro || achievement.id} · ${achievement.rarity || "common"}`,
            xp: Number(achievement.reward_xp || 0),
            duration: 4200
          }
        }));
        setFeedback(`Simulare: ${achievement.title_ro || achievement.id}. Nicio modificare salvată.`, "success");
        return;
      }

      const raw = readForm(simForm);
      const chapter = selectedChapter(raw.chapter_id);
      if (!chapter) return;
      const conceptTotal = Array.isArray(chapter.concept_ids) ? chapter.concept_ids.length : Number(chapter.concept_total || 0);
      const preview = {
        ...chapter,
        concept_total: conceptTotal,
        problems_solved: Number(raw.problems_solved || 0),
        concepts_mastered: Number(raw.concepts_mastered || 0),
        extensions_completed: Number(raw.extensions_completed || 0),
        exploration_percent: Number(raw.exploration_percent || 0),
        verification_accuracy: Number(raw.verification_accuracy || 0),
        problems_without_hints: Number(raw.problems_without_hints || 0),
        strongest_concept: raw.strongest_concept ? { title: raw.strongest_concept } : null,
        review_concept: raw.review_concept ? { title: raw.review_concept } : null
      };
      void import("./chapter-completion-controller.js")
        .then((module) => module.previewChapterCompletion(preview, "ro"))
        .catch((error) => {
          console.error("Chapter preview could not be opened:", error);
          setFeedback("Preview-ul de capitol nu a putut fi deschis.", "error");
        });
      setFeedback(`Simulare final capitol: ${chapter.title || chapter.id}. Nicio modificare salvată.`, "success");
      return;
    }

    const form = event.target.closest(".mh-gamification-form");
    if (!form) return;
    event.preventDefault();
    void persist(form);
  });

  host.addEventListener("change", (event) => {
    const select = event.target.closest("[data-sim-chapter-select]");
    if (!select || state.activeTab !== "simulator") return;
    const chosen = selectedChapter(select.value);
    if (!chosen) return;
    state.chapters = [chosen, ...state.chapters.filter((item) => item.id !== chosen.id)];
    renderSimulator();
  });

  search.addEventListener("input", () => {
    state.query = search.value;
    renderList();
  });

  closeEditor();
  renderList();

  return {
    load,
    refresh() { return load({ force: true }); },
    setAdmin(isAdmin) {
      if (!isAdmin) {
        state.loaded = false;
        state.payload = { achievements: [], challenges: [], templates: [] };
        state.chapters = [];
        closeEditor();
        renderList();
      }
    },
    getState() { return structuredClone(state); }
  };
}
