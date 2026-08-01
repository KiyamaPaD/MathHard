import {
  assignCommunityBadge,
  loadCommunityBadgeStudio,
  loadCommunityModerationDashboard,
  revokeCommunityBadge,
  saveCommunityBadgeDefinition,
  setCommunityUserAccess,
  updateCommunityModerationCase
} from "./community-profile-repository.js";
import {
  normalizeCommunityBadgeDraft,
  normalizeCommunityBadgeStudio,
  normalizeCommunityModerationDashboard,
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

function formatDate(value) {
  if (!value) return "—";
  try { return new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
  catch { return "—"; }
}

const STATUS_LABELS = { new: "Nou", in_review: "În analiză", resolved: "Rezolvat", closed: "Închis" };
const PRIORITY_LABELS = { low: "Scăzută", normal: "Normală", high: "Ridicată", urgent: "Urgentă" };
const CATEGORY_LABELS = { suggestion: "Sugestie", bug: "Problemă tehnică", content: "Conținut", account: "Cont", other: "Altceva" };
const REASON_LABELS = { impersonation: "Identitate falsă", inappropriate: "Conținut nepotrivit", spam: "Spam", unsafe_link: "Link nesigur", other: "Alt motiv" };

export function createCommunityAdminController({ host, supabase }) {
  if (!host) return { load() {}, refresh() {}, setAdmin() {} };

  const state = {
    isAdmin: false,
    loading: false,
    activeTab: "badges",
    query: "",
    status: "open",
    badgeLoaded: false,
    moderationLoaded: false,
    badges: { badges: [], users: [] },
    moderation: { counts: {}, feedback: [], reports: [], users: [] },
    selectedBadgeId: "",
    selectedUserId: "",
    selectedFeedbackId: "",
    selectedReportId: "",
    selectedIntegrityUserId: ""
  };

  host.innerHTML = `<div class="mh-community-admin">
    <div class="mh-community-admin-toolbar">
      <div class="mh-community-admin-tabs" role="tablist" aria-label="Administrare comunitate">
        <button class="is-active" data-community-tab="badges" type="button">Badge-uri</button>
        <button data-community-tab="assignments" type="button">Acordări</button>
        <button data-community-tab="feedback" type="button">Feedback <em data-community-count="feedback"></em></button>
        <button data-community-tab="reports" type="button">Raportări <em data-community-count="reports"></em></button>
        <button data-community-tab="integrity" type="button">Integritate</button>
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

  function updateCounts() {
    const feedbackCount = state.moderation.counts.feedbackNew || 0;
    const reportCount = state.moderation.counts.reportsNew || 0;
    const f = host.querySelector('[data-community-count="feedback"]');
    const r = host.querySelector('[data-community-count="reports"]');
    if (f) f.textContent = feedbackCount ? String(feedbackCount) : "";
    if (r) r.textContent = reportCount ? String(reportCount) : "";
  }

  function badgeCard(badge) {
    return `<button class="mh-community-badge-row ${state.selectedBadgeId === badge.id ? "is-active" : ""}" data-community-badge-id="${escapeHtml(badge.id)}" type="button"><span class="mh-community-badge-icon">${escapeHtml(badge.icon)}</span><span><strong>${escapeHtml(badge.titleRo || badge.id)}</strong><small>${escapeHtml(badge.category)} · ${escapeHtml(badge.rarity)} · ${escapeHtml(badge.assignmentMode)}</small></span><em>${badge.userCount}</em></button>`;
  }

  function badgeEditor(badge = {}) {
    const draft = normalizeCommunityBadgeDraft({ active: true, ...badge, title_ro: badge.titleRo, title_en: badge.titleEn, description_ro: badge.descriptionRo, description_en: badge.descriptionEn, assignment_mode: badge.assignmentMode });
    return `<form class="mh-community-badge-form" id="mhCommunityBadgeForm"><div class="mh-community-editor-head"><div><span>Definiție</span><h3>${draft.id ? escapeHtml(draft.title_ro || draft.id) : "Badge nou"}</h3></div><button class="btn small" data-community-action="new-badge" type="button">Nou</button></div><div class="mh-community-form-grid"><label><span>ID</span><input name="id" value="${escapeHtml(draft.id)}" ${draft.id ? "readonly" : ""} required></label><label><span>Icon</span><input name="icon" maxlength="16" value="${escapeHtml(draft.icon)}" required></label><label><span>Titlu RO</span><input name="title_ro" maxlength="120" value="${escapeHtml(draft.title_ro)}" required></label><label><span>Titlu EN</span><input name="title_en" maxlength="120" value="${escapeHtml(draft.title_en)}" required></label><label class="is-wide"><span>Descriere RO</span><textarea name="description_ro" maxlength="300" required>${escapeHtml(draft.description_ro)}</textarea></label><label class="is-wide"><span>Descriere EN</span><textarea name="description_en" maxlength="300" required>${escapeHtml(draft.description_en)}</textarea></label><label><span>Categorie</span><select name="category">${["community","education","support","staff","subscription","partner"].map((value) => `<option value="${value}" ${draft.category === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label><span>Raritate</span><select name="rarity">${["common","uncommon","rare","epic","legendary"].map((value) => `<option value="${value}" ${draft.rarity === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label><span>Acordare</span><select name="assignment_mode">${["manual","automatic","subscription","system"].map((value) => `<option value="${value}" ${draft.assignment_mode === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label><span>Culoare</span><input name="color" maxlength="24" value="${escapeHtml(draft.color)}"></label><label><span>Ordine</span><input name="sort_order" type="number" value="${draft.sort_order}"></label><label class="mh-community-check"><input name="active" type="checkbox" ${draft.active ? "checked" : ""}><span>Activ</span></label></div><button class="btn" type="submit">Salvează badge-ul</button></form>`;
  }

  function renderBadges() {
    const selected = state.badges.badges.find((badge) => badge.id === state.selectedBadgeId) || null;
    body.innerHTML = `<div class="mh-community-admin-layout"><section class="mh-community-admin-list"><div class="mh-community-list-head"><strong>${state.badges.badges.length} badge-uri</strong><button class="btn small" data-community-action="new-badge" type="button">Creează</button></div><div class="mh-community-badge-list">${state.badges.badges.map(badgeCard).join("") || '<p class="legend">Nu există badge-uri.</p>'}</div></section><aside class="mh-community-admin-editor">${badgeEditor(selected || {})}</aside></div>`;
  }

  function userCard(user) {
    const assigned = user.badges.map((badge) => `<span title="${escapeHtml(badge.titleRo)}">${escapeHtml(badge.icon)} ${escapeHtml(badge.titleRo)}</span>`).join("");
    return `<button class="mh-community-user-row ${state.selectedUserId === user.userId ? "is-active" : ""}" data-community-user-id="${escapeHtml(user.userId)}" type="button"><span><strong>${escapeHtml(user.displayName)}</strong><small>@${escapeHtml(user.username)} · ${escapeHtml(user.email)}</small></span><div>${assigned || "<em>Fără badge-uri</em>"}</div></button>`;
  }

  function assignmentEditor(user) {
    if (!user) return '<div class="mh-community-editor-empty"><strong>Selectează un utilizator</strong><span>Caută după username, nume sau email.</span></div>';
    const manualBadges = state.badges.badges.filter((badge) => badge.assignmentMode === "manual" && badge.active);
    return `<div class="mh-community-assignment-editor"><div class="mh-community-editor-head"><div><span>Utilizator</span><h3>${escapeHtml(user.displayName)}</h3><code>@${escapeHtml(user.username)}</code></div></div><form id="mhCommunityAssignmentForm"><label><span>Badge manual</span><select name="badge_id" required><option value="">Alege</option>${manualBadges.map((badge) => `<option value="${escapeHtml(badge.id)}">${escapeHtml(badge.icon)} ${escapeHtml(badge.titleRo)}</option>`).join("")}</select></label><label><span>Notă internă</span><input name="note" maxlength="300" placeholder="Motivul acordării"></label><label><span>Expiră la</span><input name="expires_at" type="datetime-local"></label><label class="mh-community-check"><input name="featured" type="checkbox"><span>Setează ca badge principal</span></label><input name="user_id" type="hidden" value="${escapeHtml(user.userId)}"><button class="btn" type="submit">Acordă</button></form><div class="mh-community-current-badges"><h4>Badge-uri acordate</h4>${user.badges.map((badge) => `<div><span>${escapeHtml(badge.icon)} <strong>${escapeHtml(badge.titleRo)}</strong>${badge.featured ? " · principal" : ""}</span>${badge.assignmentMode === "manual" ? `<button class="btn small danger" data-community-revoke="${escapeHtml(badge.id)}" data-community-user="${escapeHtml(user.userId)}" type="button">Retrage</button>` : `<em>${escapeHtml(badge.assignmentMode)}</em>`}</div>`).join("") || '<p class="legend">Niciun badge acordat.</p>'}</div></div>`;
  }

  function renderAssignments() {
    const selected = state.badges.users.find((user) => user.userId === state.selectedUserId) || null;
    body.innerHTML = `${searchToolbar("Caută utilizator", "search-users")}<div class="mh-community-admin-layout"><section class="mh-community-admin-list"><div class="mh-community-user-list">${state.badges.users.map(userCard).join("") || '<p class="legend">Caută un utilizator pentru a gestiona badge-urile.</p>'}</div></section><aside class="mh-community-admin-editor">${assignmentEditor(selected)}</aside></div>`;
  }

  function searchToolbar(placeholder, action, includeStatus = false) {
    return `<div class="mh-community-search-row"><input id="mhCommunitySearch" type="search" value="${escapeHtml(state.query)}" placeholder="${escapeHtml(placeholder)}">${includeStatus ? `<select id="mhCommunityStatusFilter"><option value="open" ${state.status === "open" ? "selected" : ""}>Deschise</option>${Object.entries(STATUS_LABELS).map(([value,label]) => `<option value="${value}" ${state.status === value ? "selected" : ""}>${label}</option>`).join("")}<option value="all" ${state.status === "all" ? "selected" : ""}>Toate</option></select>` : ""}<button class="btn" data-community-action="${action}" type="button">Caută</button></div>`;
  }

  function caseCard(item, selectedId, kind) {
    const title = kind === "feedback" ? item.subject : `@${item.reportedUsername}`;
    const label = kind === "feedback" ? CATEGORY_LABELS[item.category] : REASON_LABELS[item.reason];
    return `<button class="mh-community-case-row ${selectedId === item.id ? "is-active" : ""}" data-community-${kind}-id="${escapeHtml(item.id)}" type="button"><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(label || "Caz")} · ${escapeHtml(item.reporterLabel || "Utilizator")}</small></span><div><em data-priority="${escapeHtml(item.priority)}">${escapeHtml(PRIORITY_LABELS[item.priority])}</em><b data-status="${escapeHtml(item.status)}">${escapeHtml(STATUS_LABELS[item.status])}</b></div><time>${escapeHtml(formatDate(item.createdAt))}</time></button>`;
  }

  function caseEditor(item, kind) {
    if (!item) return `<div class="mh-community-editor-empty"><strong>Selectează un caz</strong><span>Detaliile și acțiunile apar aici.</span></div>`;
    const isReport = kind === "profile_report";
    return `<form class="mh-community-case-editor" id="mhCommunityCaseForm"><input type="hidden" name="kind" value="${kind}"><input type="hidden" name="id" value="${escapeHtml(item.id)}"><div class="mh-community-editor-head"><div><span>${isReport ? "Raportare profil" : "Feedback"}</span><h3>${escapeHtml(isReport ? `@${item.reportedUsername}` : item.subject)}</h3><code>${escapeHtml(formatDate(item.createdAt))}</code></div></div><div class="mh-community-case-meta"><span>${escapeHtml(isReport ? REASON_LABELS[item.reason] : CATEGORY_LABELS[item.category])}</span><span>${escapeHtml(item.reporterLabel || "Utilizator")}</span>${item.pageUrl ? `<a href="${escapeHtml(item.pageUrl)}" target="_blank" rel="noopener noreferrer">Deschide pagina</a>` : ""}</div><p class="mh-community-case-message">${escapeHtml(item.message)}</p>${item.contactEmail ? `<p class="mh-community-case-contact">Contact: ${escapeHtml(item.contactEmail)}</p>` : ""}<div class="mh-community-form-grid"><label><span>Status</span><select name="status">${Object.entries(STATUS_LABELS).map(([value,label]) => `<option value="${value}" ${item.status === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><label><span>Prioritate</span><select name="priority">${Object.entries(PRIORITY_LABELS).map(([value,label]) => `<option value="${value}" ${item.priority === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><label class="is-wide"><span>Notă internă</span><textarea name="admin_note" maxlength="2000">${escapeHtml(item.adminNote)}</textarea></label></div><div class="mh-community-case-actions"><button class="btn" type="submit">Salvează cazul</button>${isReport ? `<button class="btn small danger" type="button" data-community-restrict-profile="${escapeHtml(item.reportedUserId)}">Ascunde profilul</button><button class="btn small" type="button" data-community-restrict-leaderboard="${escapeHtml(item.reportedUserId)}">Exclude din clasament</button>` : ""}</div></form>`;
  }

  function renderCases(kind) {
    const items = kind === "feedback" ? state.moderation.feedback : state.moderation.reports;
    const selectedId = kind === "feedback" ? state.selectedFeedbackId : state.selectedReportId;
    const selected = items.find((item) => item.id === selectedId) || null;
    body.innerHTML = `${searchToolbar(kind === "feedback" ? "Subiect, mesaj sau email" : "Username sau detalii", "search-cases", true)}<div class="mh-community-admin-layout"><section class="mh-community-admin-list"><div class="mh-community-case-list">${items.map((item) => caseCard(item, selectedId, kind)).join("") || '<p class="legend">Nu există cazuri pentru filtrul selectat.</p>'}</div></section><aside class="mh-community-admin-editor">${caseEditor(selected, kind === "feedback" ? "feedback" : "profile_report")}</aside></div>`;
  }

  function integrityCard(user) {
    const restricted = !user.profileAllowed || !user.leaderboardAllowed;
    return `<button class="mh-community-integrity-row ${state.selectedIntegrityUserId === user.userId ? "is-active" : ""}" data-community-integrity-user="${escapeHtml(user.userId)}" type="button"><span><strong>${escapeHtml(user.displayName)}</strong><small>@${escapeHtml(user.username)} · ${escapeHtml(user.email)}</small></span><div>${user.openReports ? `<b>${user.openReports} raportări</b>` : ""}<em data-restricted="${restricted}">${restricted ? "Restricționat" : "Activ"}</em></div></button>`;
  }

  function integrityEditor(user) {
    if (!user) return '<div class="mh-community-editor-empty"><strong>Selectează un profil</strong><span>Controlează separat profilul public și participarea în clasamente.</span></div>';
    return `<form class="mh-community-integrity-editor" id="mhCommunityIntegrityForm"><input type="hidden" name="user_id" value="${escapeHtml(user.userId)}"><div class="mh-community-editor-head"><div><span>Acces comunitate</span><h3>${escapeHtml(user.displayName)}</h3><code>@${escapeHtml(user.username)}</code></div></div><label class="mh-community-check"><input name="profile_allowed" type="checkbox" ${user.profileAllowed ? "checked" : ""}><span>Profil public permis</span></label><label class="mh-community-check"><input name="leaderboard_allowed" type="checkbox" ${user.leaderboardAllowed ? "checked" : ""}><span>Participare în clasamente permisă</span></label><label><span>Notă internă</span><textarea name="note" maxlength="1000">${escapeHtml(user.note)}</textarea></label><p class="legend">O restricție dezactivează imediat vizibilitatea. Ridicarea ei nu republică automat profilul; utilizatorul îl poate reactiva din setări.</p><button class="btn" type="submit">Salvează accesul</button></form>`;
  }

  function renderIntegrity() {
    const selected = state.moderation.users.find((user) => user.userId === state.selectedIntegrityUserId) || null;
    body.innerHTML = `${searchToolbar("Username, nume sau email", "search-integrity")}<div class="mh-community-admin-layout"><section class="mh-community-admin-list"><div class="mh-community-integrity-list">${state.moderation.users.map(integrityCard).join("") || '<p class="legend">Nu există rezultate.</p>'}</div></section><aside class="mh-community-admin-editor">${integrityEditor(selected)}</aside></div>`;
  }

  function render() {
    host.querySelectorAll("[data-community-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.communityTab === state.activeTab));
    updateCounts();
    if (state.activeTab === "assignments") renderAssignments();
    else if (state.activeTab === "feedback") renderCases("feedback");
    else if (state.activeTab === "reports") renderCases("reports");
    else if (state.activeTab === "integrity") renderIntegrity();
    else renderBadges();
  }

  async function loadBadges({ force = false } = {}) {
    if (!state.isAdmin || state.loading || (state.badgeLoaded && !force)) return;
    state.loading = true;
    setFeedback("Se încarcă...", "loading");
    try {
      state.badges = normalizeCommunityBadgeStudio(await loadCommunityBadgeStudio(supabase, state.query));
      state.badgeLoaded = true;
      if (state.selectedUserId && !state.badges.users.some((user) => user.userId === state.selectedUserId)) state.selectedUserId = "";
      render();
      setFeedback();
    } catch (error) {
      console.error("Community badge studio load failed:", error);
      setFeedback("Datele nu au putut fi încărcate.", "error");
    } finally { state.loading = false; }
  }

  async function loadModeration({ force = false } = {}) {
    if (!state.isAdmin || state.loading || (state.moderationLoaded && !force)) return;
    state.loading = true;
    setFeedback("Se încarcă...", "loading");
    try {
      state.moderation = normalizeCommunityModerationDashboard(await loadCommunityModerationDashboard(supabase, { status: state.status, query: state.query, limit: 80 }));
      state.moderationLoaded = true;
      render();
      setFeedback();
    } catch (error) {
      console.error("Community moderation load failed:", error);
      setFeedback("Cazurile nu au putut fi încărcate.", "error");
    } finally { state.loading = false; }
  }

  function load({ force = false } = {}) {
    return ["feedback", "reports", "integrity"].includes(state.activeTab) ? loadModeration({ force }) : loadBadges({ force });
  }

  async function restrictUser(userId, profileAllowed, leaderboardAllowed, message) {
    if (!confirm(message)) return;
    setFeedback("Se salvează...", "loading");
    try {
      await setCommunityUserAccess(supabase, { userId, profileAllowed, leaderboardAllowed, note: "Acțiune dintr-o raportare" });
      state.moderationLoaded = false;
      await loadModeration({ force: true });
      setFeedback("Acces actualizat.", "success");
    } catch (error) {
      console.error("Community access update failed:", error);
      setFeedback("Accesul nu a putut fi actualizat.", "error");
    }
  }

  host.addEventListener("click", async (event) => {
    const tab = event.target.closest("[data-community-tab]");
    if (tab) {
      state.activeTab = tab.dataset.communityTab;
      state.query = "";
      render();
      void load();
      return;
    }
    const badgeRow = event.target.closest("[data-community-badge-id]");
    if (badgeRow) { state.selectedBadgeId = badgeRow.dataset.communityBadgeId; render(); return; }
    const userRow = event.target.closest("[data-community-user-id]");
    if (userRow) { state.selectedUserId = userRow.dataset.communityUserId; render(); return; }
    const feedbackRow = event.target.closest("[data-community-feedback-id]");
    if (feedbackRow) { state.selectedFeedbackId = feedbackRow.dataset.communityFeedbackId; render(); return; }
    const reportRow = event.target.closest("[data-community-reports-id]");
    if (reportRow) { state.selectedReportId = reportRow.dataset.communityReportsId; render(); return; }
    const integrityRow = event.target.closest("[data-community-integrity-user]");
    if (integrityRow) { state.selectedIntegrityUserId = integrityRow.dataset.communityIntegrityUser; render(); return; }

    const action = event.target.closest("[data-community-action]")?.dataset.communityAction;
    if (action === "refresh") {
      state.badgeLoaded = false;
      state.moderationLoaded = false;
      return void load({ force: true });
    }
    if (action === "new-badge") { state.selectedBadgeId = ""; render(); return; }
    if (["search-users", "search-cases", "search-integrity"].includes(action)) {
      state.query = host.querySelector("#mhCommunitySearch")?.value.trim() || "";
      state.status = host.querySelector("#mhCommunityStatusFilter")?.value || state.status;
      if (action === "search-users") return void loadBadges({ force: true });
      return void loadModeration({ force: true });
    }

    const revoke = event.target.closest("[data-community-revoke]");
    if (revoke) {
      if (!confirm("Retragi acest badge?")) return;
      setFeedback("Se retrage...", "loading");
      try {
        state.badges = normalizeCommunityBadgeStudio(await revokeCommunityBadge(supabase, revoke.dataset.communityUser, revoke.dataset.communityRevoke));
        render(); setFeedback("Badge retras.", "success");
      } catch (error) { console.error("Community badge revoke failed:", error); setFeedback("Badge-ul nu a putut fi retras.", "error"); }
      return;
    }

    const restrictProfile = event.target.closest("[data-community-restrict-profile]");
    if (restrictProfile) return void restrictUser(restrictProfile.dataset.communityRestrictProfile, false, false, "Ascunzi profilul și îl excluzi din clasamente?");
    const restrictLeaderboard = event.target.closest("[data-community-restrict-leaderboard]");
    if (restrictLeaderboard) {
      const userId = restrictLeaderboard.dataset.communityRestrictLeaderboard;
      const current = state.moderation.users.find((user) => user.userId === userId);
      return void restrictUser(userId, current?.profileAllowed !== false, false, "Excluzi acest profil din clasamente?");
    }
  });

  host.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const value = formValues(form);

    if (form.id === "mhCommunityBadgeForm") {
      const validation = validateCommunityBadgeDraft(value);
      if (!validation.valid) return setFeedback(validation.errors[0], "error");
      setFeedback("Se salvează...", "loading");
      try { state.badges = normalizeCommunityBadgeStudio(await saveCommunityBadgeDefinition(supabase, validation.badge)); state.selectedBadgeId = validation.badge.id; render(); setFeedback("Badge salvat.", "success"); }
      catch (error) { console.error("Community badge save failed:", error); setFeedback("Badge-ul nu a putut fi salvat.", "error"); }
      return;
    }

    if (form.id === "mhCommunityAssignmentForm") {
      if (!value.badge_id) return setFeedback("Alege un badge.", "error");
      setFeedback("Se acordă...", "loading");
      try { state.badges = normalizeCommunityBadgeStudio(await assignCommunityBadge(supabase, { user_id: value.user_id, badge_id: value.badge_id, featured: value.featured, note: value.note, expires_at: value.expires_at || null })); render(); setFeedback("Badge acordat.", "success"); }
      catch (error) { console.error("Community badge assignment failed:", error); setFeedback("Badge-ul nu a putut fi acordat.", "error"); }
      return;
    }

    if (form.id === "mhCommunityCaseForm") {
      setFeedback("Se salvează...", "loading");
      try {
        await updateCommunityModerationCase(supabase, { kind: value.kind, id: value.id, status: value.status, priority: value.priority, adminNote: value.admin_note });
        state.moderationLoaded = false;
        await loadModeration({ force: true });
        setFeedback("Caz actualizat.", "success");
      } catch (error) { console.error("Community case update failed:", error); setFeedback("Cazul nu a putut fi actualizat.", "error"); }
      return;
    }

    if (form.id === "mhCommunityIntegrityForm") {
      setFeedback("Se salvează...", "loading");
      try {
        await setCommunityUserAccess(supabase, { userId: value.user_id, profileAllowed: value.profile_allowed, leaderboardAllowed: value.leaderboard_allowed, note: value.note });
        state.moderationLoaded = false;
        await loadModeration({ force: true });
        setFeedback("Acces actualizat.", "success");
      } catch (error) { console.error("Community access save failed:", error); setFeedback("Accesul nu a putut fi salvat.", "error"); }
    }
  });

  render();

  return {
    load,
    refresh() { state.badgeLoaded = false; state.moderationLoaded = false; return load({ force: true }); },
    setAdmin(isAdmin) {
      state.isAdmin = Boolean(isAdmin);
      if (!state.isAdmin) {
        state.badgeLoaded = false;
        state.moderationLoaded = false;
        state.badges = { badges: [], users: [] };
        state.moderation = { counts: {}, feedback: [], reports: [], users: [] };
        state.selectedBadgeId = "";
        state.selectedUserId = "";
        state.selectedFeedbackId = "";
        state.selectedReportId = "";
        state.selectedIntegrityUserId = "";
        render();
      }
    }
  };
}
