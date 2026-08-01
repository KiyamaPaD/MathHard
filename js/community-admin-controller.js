import {
  assignCommunityBadge,
  loadCommunityBadgeStudio,
  revokeCommunityBadge,
  saveCommunityBadgeDefinition
} from "./community-profile-repository.js";
import {
  normalizeCommunityBadgeDraft,
  normalizeCommunityBadgeStudio,
  validateCommunityBadgeDraft
} from "./community-admin-model.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formValues(form) {
  const value = Object.fromEntries(new FormData(form).entries());
  form.querySelectorAll('input[type="checkbox"]').forEach((input) => { value[input.name] = input.checked; });
  return value;
}

export function createCommunityAdminController({ host, supabase }) {
  if (!host) return { load() {}, refresh() {}, setAdmin() {} };

  const state = {
    loaded: false,
    loading: false,
    isAdmin: false,
    activeTab: "badges",
    query: "",
    payload: { badges: [], users: [] },
    selectedBadgeId: "",
    selectedUserId: ""
  };

  host.innerHTML = `
    <div class="mh-community-admin">
      <div class="mh-community-admin-toolbar">
        <div class="mh-community-admin-tabs" role="tablist">
          <button class="is-active" data-community-tab="badges" type="button">Badge-uri</button>
          <button data-community-tab="assignments" type="button">Acordări</button>
        </div>
        <button class="btn small" data-community-action="refresh" type="button">Actualizează</button>
      </div>
      <p class="mh-community-admin-feedback" id="mhCommunityAdminFeedback" role="status"></p>
      <div id="mhCommunityAdminBody"></div>
    </div>`;

  const body = host.querySelector("#mhCommunityAdminBody");
  const feedback = host.querySelector("#mhCommunityAdminFeedback");

  function setFeedback(message = "", status = "") {
    feedback.textContent = message;
    feedback.dataset.state = status;
  }

  function badgeCard(badge) {
    return `<button class="mh-community-badge-row ${state.selectedBadgeId === badge.id ? "is-active" : ""}" data-community-badge-id="${escapeHtml(badge.id)}" type="button">
      <span class="mh-community-badge-icon">${escapeHtml(badge.icon)}</span>
      <span><strong>${escapeHtml(badge.titleRo || badge.id)}</strong><small>${escapeHtml(badge.category)} · ${escapeHtml(badge.rarity)} · ${escapeHtml(badge.assignmentMode)}</small></span>
      <em>${badge.userCount}</em>
    </button>`;
  }

  function badgeEditor(badge = {}) {
    const draft = normalizeCommunityBadgeDraft({ active: true, ...badge, title_ro: badge.titleRo, title_en: badge.titleEn, description_ro: badge.descriptionRo, description_en: badge.descriptionEn, assignment_mode: badge.assignmentMode });
    return `<form class="mh-community-badge-form" id="mhCommunityBadgeForm">
      <div class="mh-community-editor-head"><div><span>Definiție</span><h3>${draft.id ? escapeHtml(draft.title_ro || draft.id) : "Badge nou"}</h3></div><button class="btn small" data-community-action="new-badge" type="button">Nou</button></div>
      <div class="mh-community-form-grid">
        <label><span>ID</span><input name="id" value="${escapeHtml(draft.id)}" ${draft.id ? "readonly" : ""} required></label>
        <label><span>Icon</span><input name="icon" maxlength="16" value="${escapeHtml(draft.icon)}" required></label>
        <label><span>Titlu RO</span><input name="title_ro" maxlength="120" value="${escapeHtml(draft.title_ro)}" required></label>
        <label><span>Titlu EN</span><input name="title_en" maxlength="120" value="${escapeHtml(draft.title_en)}" required></label>
        <label class="is-wide"><span>Descriere RO</span><textarea name="description_ro" maxlength="300" required>${escapeHtml(draft.description_ro)}</textarea></label>
        <label class="is-wide"><span>Descriere EN</span><textarea name="description_en" maxlength="300" required>${escapeHtml(draft.description_en)}</textarea></label>
        <label><span>Categorie</span><select name="category">${["community","education","support","staff","subscription","partner"].map((value) => `<option value="${value}" ${draft.category === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>
        <label><span>Raritate</span><select name="rarity">${["common","uncommon","rare","epic","legendary"].map((value) => `<option value="${value}" ${draft.rarity === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>
        <label><span>Acordare</span><select name="assignment_mode">${["manual","automatic","subscription","system"].map((value) => `<option value="${value}" ${draft.assignment_mode === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>
        <label><span>Culoare</span><input name="color" maxlength="24" value="${escapeHtml(draft.color)}"></label>
        <label><span>Ordine</span><input name="sort_order" type="number" value="${draft.sort_order}"></label>
        <label class="mh-community-check"><input name="active" type="checkbox" ${draft.active ? "checked" : ""}><span>Activ</span></label>
      </div>
      <button class="btn" type="submit">Salvează badge-ul</button>
    </form>`;
  }

  function renderBadges() {
    const selected = state.payload.badges.find((badge) => badge.id === state.selectedBadgeId) || null;
    body.innerHTML = `<div class="mh-community-admin-layout">
      <section class="mh-community-admin-list">
        <div class="mh-community-list-head"><strong>${state.payload.badges.length} badge-uri</strong><button class="btn small" data-community-action="new-badge" type="button">Creează</button></div>
        <div class="mh-community-badge-list">${state.payload.badges.map(badgeCard).join("") || '<p class="legend">Nu există badge-uri.</p>'}</div>
      </section>
      <aside class="mh-community-admin-editor">${badgeEditor(selected || {})}</aside>
    </div>`;
  }

  function userCard(user) {
    const assigned = user.badges.map((badge) => `<span title="${escapeHtml(badge.titleRo)}">${escapeHtml(badge.icon)} ${escapeHtml(badge.titleRo)}</span>`).join("");
    return `<button class="mh-community-user-row ${state.selectedUserId === user.userId ? "is-active" : ""}" data-community-user-id="${escapeHtml(user.userId)}" type="button">
      <span><strong>${escapeHtml(user.displayName)}</strong><small>@${escapeHtml(user.username)} · ${escapeHtml(user.email)}</small></span>
      <div>${assigned || '<em>Fără badge-uri</em>'}</div>
    </button>`;
  }

  function assignmentEditor(user) {
    if (!user) return '<div class="mh-community-editor-empty"><strong>Selectează un utilizator</strong><span>Caută după username, nume sau email.</span></div>';
    const manualBadges = state.payload.badges.filter((badge) => badge.assignmentMode === "manual" && badge.active);
    return `<div class="mh-community-assignment-editor">
      <div class="mh-community-editor-head"><div><span>Utilizator</span><h3>${escapeHtml(user.displayName)}</h3><code>@${escapeHtml(user.username)}</code></div></div>
      <form id="mhCommunityAssignmentForm">
        <label><span>Badge manual</span><select name="badge_id" required><option value="">Alege</option>${manualBadges.map((badge) => `<option value="${escapeHtml(badge.id)}">${escapeHtml(badge.icon)} ${escapeHtml(badge.titleRo)}</option>`).join("")}</select></label>
        <label><span>Notă internă</span><input name="note" maxlength="300" placeholder="Motivul acordării"></label>
        <label><span>Expiră la</span><input name="expires_at" type="datetime-local"></label>
        <label class="mh-community-check"><input name="featured" type="checkbox"><span>Setează ca badge principal</span></label>
        <input name="user_id" type="hidden" value="${escapeHtml(user.userId)}">
        <button class="btn" type="submit">Acordă</button>
      </form>
      <div class="mh-community-current-badges">
        <h4>Badge-uri acordate</h4>
        ${user.badges.map((badge) => `<div><span>${escapeHtml(badge.icon)} <strong>${escapeHtml(badge.titleRo)}</strong>${badge.featured ? " · principal" : ""}</span>${badge.assignmentMode === "manual" ? `<button class="btn small danger" data-community-revoke="${escapeHtml(badge.id)}" data-community-user="${escapeHtml(user.userId)}" type="button">Retrage</button>` : `<em>${escapeHtml(badge.assignmentMode)}</em>`}</div>`).join("") || '<p class="legend">Niciun badge acordat.</p>'}
      </div>
    </div>`;
  }

  function renderAssignments() {
    const selected = state.payload.users.find((user) => user.userId === state.selectedUserId) || null;
    body.innerHTML = `<div class="mh-community-search-row"><input id="mhCommunityUserSearch" type="search" value="${escapeHtml(state.query)}" placeholder="Username, nume sau email"><button class="btn" data-community-action="search-users" type="button">Caută</button></div>
      <div class="mh-community-admin-layout">
        <section class="mh-community-admin-list"><div class="mh-community-user-list">${state.payload.users.map(userCard).join("") || '<p class="legend">Caută un utilizator pentru a gestiona badge-urile.</p>'}</div></section>
        <aside class="mh-community-admin-editor">${assignmentEditor(selected)}</aside>
      </div>`;
  }

  function render() {
    host.querySelectorAll("[data-community-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.communityTab === state.activeTab));
    if (state.activeTab === "assignments") renderAssignments();
    else renderBadges();
  }

  async function load({ force = false, query = state.query } = {}) {
    if (!state.isAdmin || state.loading || (state.loaded && !force && query === state.query)) return;
    state.loading = true;
    state.query = query;
    setFeedback("Se încarcă...", "loading");
    try {
      state.payload = normalizeCommunityBadgeStudio(await loadCommunityBadgeStudio(supabase, query));
      state.loaded = true;
      if (state.selectedUserId && !state.payload.users.some((user) => user.userId === state.selectedUserId)) state.selectedUserId = "";
      render();
      setFeedback("", "");
    } catch (error) {
      console.error("Community badge studio load failed:", error);
      setFeedback("Datele nu au putut fi încărcate.", "error");
    } finally {
      state.loading = false;
    }
  }

  host.addEventListener("click", async (event) => {
    const tab = event.target.closest("[data-community-tab]");
    if (tab) {
      state.activeTab = tab.dataset.communityTab;
      render();
      return;
    }
    const badgeRow = event.target.closest("[data-community-badge-id]");
    if (badgeRow) { state.selectedBadgeId = badgeRow.dataset.communityBadgeId; render(); return; }
    const userRow = event.target.closest("[data-community-user-id]");
    if (userRow) { state.selectedUserId = userRow.dataset.communityUserId; render(); return; }
    const action = event.target.closest("[data-community-action]")?.dataset.communityAction;
    if (action === "refresh") return void load({ force: true });
    if (action === "new-badge") { state.selectedBadgeId = ""; render(); return; }
    if (action === "search-users") {
      const query = host.querySelector("#mhCommunityUserSearch")?.value.trim() || "";
      return void load({ force: true, query });
    }
    const revoke = event.target.closest("[data-community-revoke]");
    if (revoke) {
      if (!confirm("Retragi acest badge?")) return;
      setFeedback("Se retrage...", "loading");
      try {
        state.payload = normalizeCommunityBadgeStudio(await revokeCommunityBadge(supabase, revoke.dataset.communityUser, revoke.dataset.communityRevoke));
        render();
        setFeedback("Badge retras.", "success");
      } catch (error) {
        console.error("Community badge revoke failed:", error);
        setFeedback("Badge-ul nu a putut fi retras.", "error");
      }
    }
  });

  host.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (event.target.id === "mhCommunityBadgeForm") {
      const validation = validateCommunityBadgeDraft(formValues(event.target));
      if (!validation.valid) return setFeedback(validation.errors[0], "error");
      setFeedback("Se salvează...", "loading");
      try {
        state.payload = normalizeCommunityBadgeStudio(await saveCommunityBadgeDefinition(supabase, validation.badge));
        state.selectedBadgeId = validation.badge.id;
        render();
        setFeedback("Badge salvat.", "success");
      } catch (error) {
        console.error("Community badge save failed:", error);
        setFeedback("Badge-ul nu a putut fi salvat.", "error");
      }
      return;
    }
    if (event.target.id === "mhCommunityAssignmentForm") {
      const value = formValues(event.target);
      if (!value.badge_id) return setFeedback("Alege un badge.", "error");
      setFeedback("Se acordă...", "loading");
      try {
        state.payload = normalizeCommunityBadgeStudio(await assignCommunityBadge(supabase, {
          user_id: value.user_id,
          badge_id: value.badge_id,
          featured: value.featured,
          note: value.note,
          expires_at: value.expires_at || null
        }));
        render();
        setFeedback("Badge acordat.", "success");
      } catch (error) {
        console.error("Community badge assignment failed:", error);
        setFeedback("Badge-ul nu a putut fi acordat.", "error");
      }
    }
  });

  render();

  return {
    load,
    refresh() { return load({ force: true }); },
    setAdmin(isAdmin) {
      state.isAdmin = Boolean(isAdmin);
      if (!state.isAdmin) {
        state.loaded = false;
        state.payload = { badges: [], users: [] };
        state.selectedBadgeId = "";
        state.selectedUserId = "";
        render();
      }
    }
  };
}
