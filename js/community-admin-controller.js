import {
  assignCommunityBadge,
  loadCommunityBadgeStudio,
  loadCommunityModerationDashboard,
  loadCommunityIntegrityDashboard,
  resetCommunityUsername,
  reviewCommunityIntegrityFlag,
  revokeCommunityBadge,
  runCommunityIntegrityScan,
  saveCommunityBadgeDefinition,
  saveCommunityBlockedDomain,
  saveCommunityIntegrityUser,
  setCommunityUserAccess,
  updateCommunityModerationCase
} from "./community-profile-repository.js";
import {
  normalizeCommunityBadgeDraft,
  normalizeCommunityBadgeStudio,
  normalizeCommunityModerationDashboard,
  validateCommunityBadgeDraft
} from "./community-admin-model.js";
import { normalizeCommunityCase } from "./community-feedback-model.js";
import {
  communityIntegrityUserDraft,
  normalizeCommunityIntegrityDashboard
} from "./community-integrity-model.js";

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
const BADGE_EVENT_LABELS = { awarded: "Acordat", updated: "Actualizat", revoked: "Retras" };
const BADGE_SOURCE_LABELS = { automatic: "Automat", admin: "Admin", system: "Sistem", subscription: "Abonament", user_roles: "Rol administrativ", migration: "Migrare", "smoke-test": "Test" };

const INTEGRITY_STATUS_LABELS = { all: "Toți", open: "Deschise", critical: "Critice", held: "Suspendați", new: "Nou", in_review: "În analiză", confirmed: "Confirmat", dismissed: "Respins" };
const FLAG_STATUS_LABELS = { new: "Nou", in_review: "În analiză", confirmed: "Confirmat", dismissed: "Respins" };
const FLAG_SEVERITY_LABELS = { low: "Scăzut", medium: "Mediu", high: "Ridicat", critical: "Critic" };
const ACCOUNT_KIND_LABELS = { member: "Membru", test: "Cont test", internal: "Cont intern" };
const REVIEW_STATUS_LABELS = { clear: "Curat", needs_review: "Necesită verificare", blocked: "Blocat" };

function badgeEventLabel(value) { return BADGE_EVENT_LABELS[value] || "Actualizat"; }
function badgeSourceLabel(value) { return BADGE_SOURCE_LABELS[value] || "Sistem"; }

function moderationErrorMessage(error) {
  const code = String(error?.code || "").trim();
  const message = String(error?.message || "").trim();
  if (/admin required/i.test(message) || code === "42501") return "Sesiunea Admin nu mai este validă. Reautentifică-te.";
  if (/not found/i.test(message) || code === "P0002") return "Cazul nu mai există.";
  if (/invalid status|invalid priority|invalid case/i.test(message) || code === "22023") return "Datele cazului nu sunt valide.";
  if (/could not find the function|does not exist/i.test(message) || ["PGRST202", "PGRST203", "42883"].includes(code.toUpperCase())) {
    return "Migrarea de salvare nu este instalată sau schema API nu s-a reîncărcat.";
  }
  return code ? `Cazul nu a putut fi salvat (${code}).` : "Cazul nu a putut fi salvat.";
}

function validateModerationCaseDraft(value) {
  const kind = String(value.kind || "");
  const id = String(value.id || "");
  const status = String(value.status || "");
  const priority = String(value.priority || "");
  if (!id || !["feedback", "profile_report"].includes(kind)) return "Cazul selectat nu este valid.";
  if (!Object.hasOwn(STATUS_LABELS, status)) return "Statusul selectat nu este valid.";
  if (!Object.hasOwn(PRIORITY_LABELS, priority)) return "Prioritatea selectată nu este validă.";
  return "";
}

export function createCommunityAdminController({ host, supabase }) {
  if (!host) return { load() {}, refresh() {}, setAdmin() {} };

  const state = {
    isAdmin: false,
    loading: false,
    activeTab: "badges",
    query: "",
    status: "open",
    integrityStatus: "all",
    badgeLoaded: false,
    moderationLoaded: false,
    integrityLoaded: false,
    badges: { badges: [], users: [] },
    moderation: { counts: {}, feedback: [], reports: [], users: [] },
    integrity: { counts: {}, users: [], flags: [], domains: [] },
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
        <button data-community-tab="assignments" type="button">Acordări</button><button data-community-tab="badge-history" type="button">Istoric badge-uri</button>
        <button data-community-tab="feedback" type="button">Feedback <em data-community-count="feedback"></em></button>
        <button data-community-tab="reports" type="button">Raportări <em data-community-count="reports"></em></button>
        <button data-community-tab="integrity" type="button">Integritate <em data-community-count="integrity"></em></button>
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

  function setFormBusy(form, busy) {
    form?.querySelectorAll("button, input, select, textarea").forEach((element) => {
      element.disabled = busy;
    });
  }

  function caseMatchesFilter(status) {
    return state.status === "all"
      || state.status === status
      || (state.status === "open" && ["new", "in_review"].includes(status));
  }

  function updateCounts() {
    const feedbackCount = state.moderation.counts.feedbackNew || 0;
    const reportCount = state.moderation.counts.reportsNew || 0;
    const f = host.querySelector('[data-community-count="feedback"]');
    const r = host.querySelector('[data-community-count="reports"]');
    const i = host.querySelector('[data-community-count="integrity"]');
    const integrityCount = state.integrity.counts.openFlags || 0;
    if (f) f.textContent = feedbackCount ? String(feedbackCount) : "";
    if (r) r.textContent = reportCount ? String(reportCount) : "";
    if (i) i.textContent = integrityCount ? String(integrityCount) : "";
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
    return `<form class="mh-community-case-editor" id="mhCommunityCaseForm"><input type="hidden" name="kind" value="${kind}"><input type="hidden" name="id" value="${escapeHtml(item.id)}"><div class="mh-community-editor-head"><div><span>${isReport ? "Raportare profil" : "Feedback"}</span><h3>${escapeHtml(isReport ? `@${item.reportedUsername}` : item.subject)}</h3><code>${escapeHtml(formatDate(item.createdAt))}</code></div></div><div class="mh-community-case-meta"><span>${escapeHtml(isReport ? REASON_LABELS[item.reason] : CATEGORY_LABELS[item.category])}</span><span>${escapeHtml(item.reporterLabel || "Utilizator")}</span>${item.pageUrl ? `<a href="${escapeHtml(item.pageUrl)}" target="_blank" rel="noopener noreferrer">Deschide pagina</a>` : ""}</div><p class="mh-community-case-message">${escapeHtml(item.message)}</p>${item.contactEmail ? `<p class="mh-community-case-contact">Contact: ${escapeHtml(item.contactEmail)}</p>` : ""}<div class="mh-community-form-grid"><label><span>Status</span><select name="status">${Object.entries(STATUS_LABELS).map(([value,label]) => `<option value="${value}" ${item.status === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><label><span>Prioritate</span><select name="priority">${Object.entries(PRIORITY_LABELS).map(([value,label]) => `<option value="${value}" ${item.priority === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><label class="is-wide"><span>Notă internă</span><textarea name="admin_note" maxlength="2000">${escapeHtml(item.adminNote)}</textarea></label></div><div class="mh-community-case-actions"><button class="btn" id="mhCommunityCaseSaveBtn" type="button" data-community-action="save-case">Salvează cazul</button>${isReport ? `<button class="btn small danger" type="button" data-community-restrict-profile="${escapeHtml(item.reportedUserId)}">Ascunde profilul</button><button class="btn small" type="button" data-community-restrict-leaderboard="${escapeHtml(item.reportedUserId)}">Exclude din clasament</button>` : ""}</div></form>`;
  }

  function renderCases(kind) {
    const items = kind === "feedback" ? state.moderation.feedback : state.moderation.reports;
    const selectedId = kind === "feedback" ? state.selectedFeedbackId : state.selectedReportId;
    const selected = items.find((item) => item.id === selectedId) || null;
    body.innerHTML = `${searchToolbar(kind === "feedback" ? "Subiect, mesaj sau email" : "Username sau detalii", "search-cases", true)}<div class="mh-community-admin-layout"><section class="mh-community-admin-list"><div class="mh-community-case-list">${items.map((item) => caseCard(item, selectedId, kind)).join("") || '<p class="legend">Nu există cazuri pentru filtrul selectat.</p>'}</div></section><aside class="mh-community-admin-editor">${caseEditor(selected, kind === "feedback" ? "feedback" : "profile_report")}</aside></div>`;
    bindCaseSaveButton();
  }

  function integrityCard(user) {
    const restricted = !user.profileAllowed || !user.leaderboardAllowed || user.integrityHold || user.contentReviewStatus === "blocked";
    const severity = ["", "low", "medium", "high", "critical"][Math.min(4, user.highestSeverity)] || "";
    return `<button class="mh-community-integrity-row ${state.selectedIntegrityUserId === user.userId ? "is-active" : ""}" data-community-integrity-user="${escapeHtml(user.userId)}" type="button"><span><strong>${escapeHtml(user.displayName)}</strong><small>@${escapeHtml(user.username)} · ${escapeHtml(user.email)}</small></span><div>${user.openFlags ? `<b data-severity="${escapeHtml(severity)}">${user.openFlags} flag-uri</b>` : ""}${user.openReports ? `<b>${user.openReports} raportări</b>` : ""}<em data-restricted="${restricted}">${restricted ? "Restricționat" : ACCOUNT_KIND_LABELS[user.accountKind]}</em></div></button>`;
  }

  function integrityFlagCard(flag) {
    return `<article class="mh-community-integrity-flag" data-severity="${escapeHtml(flag.severity)}"><div><strong>${escapeHtml(flag.title)}</strong><small>${escapeHtml(FLAG_SEVERITY_LABELS[flag.severity])} · ${escapeHtml(formatDate(flag.lastDetectedAt))}${flag.autoExclude ? " · exclude automat" : ""}</small></div><pre>${escapeHtml(JSON.stringify(flag.evidence, null, 2))}</pre><form data-community-integrity-flag-form="${escapeHtml(flag.id)}"><select name="status">${Object.entries(FLAG_STATUS_LABELS).map(([value,label]) => `<option value="${value}" ${flag.status === value ? "selected" : ""}>${label}</option>`).join("")}</select><input name="note" maxlength="2000" value="${escapeHtml(flag.adminNote)}" placeholder="Notă internă"><button class="btn small" type="submit">Salvează flag-ul</button></form></article>`;
  }

  function integrityEditor(user) {
    if (!user) return '<div class="mh-community-editor-empty"><strong>Selectează un profil</strong><span>Controlează integritatea, vizibilitatea și tipul contului.</span></div>';
    const flags = state.integrity.flags.filter((flag) => flag.userId === user.userId);
    const draft = communityIntegrityUserDraft(user);
    return `<div class="mh-community-integrity-editor"><form id="mhCommunityIntegrityForm"><input type="hidden" name="user_id" value="${escapeHtml(user.userId)}"><div class="mh-community-editor-head"><div><span>Integritate comunitate</span><h3>${escapeHtml(user.displayName)}</h3><code>@${escapeHtml(user.username)} · ${escapeHtml(user.role)}</code></div><button class="btn small" data-community-action="scan-selected" type="button">Scanează</button></div><div class="mh-community-form-grid"><label><span>Tip cont</span><select name="account_kind">${Object.entries(ACCOUNT_KIND_LABELS).map(([value,label]) => `<option value="${value}" ${draft.account_kind === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><label><span>Review profil</span><select name="content_review_status">${Object.entries(REVIEW_STATUS_LABELS).map(([value,label]) => `<option value="${value}" ${draft.content_review_status === value ? "selected" : ""}>${label}</option>`).join("")}</select></label></div><div class="mh-community-integrity-switches"><label class="mh-community-check"><input name="profile_allowed" type="checkbox" ${draft.profile_allowed ? "checked" : ""}><span>Profil public permis</span></label><label class="mh-community-check"><input name="leaderboard_allowed" type="checkbox" ${draft.leaderboard_allowed ? "checked" : ""}><span>Clasamente permise</span></label><label class="mh-community-check"><input name="bio_allowed" type="checkbox" ${draft.bio_allowed ? "checked" : ""}><span>Bio și headline publice</span></label><label class="mh-community-check"><input name="links_allowed" type="checkbox" ${draft.links_allowed ? "checked" : ""}><span>Linkuri publice</span></label><label class="mh-community-check"><input name="integrity_hold" type="checkbox" ${draft.integrity_hold ? "checked" : ""}><span>Suspendare temporară din clasamente</span></label><label class="mh-community-check"><input name="allow_internal_leaderboard" type="checkbox" ${draft.allow_internal_leaderboard ? "checked" : ""}><span>Permite cont intern în clasamente</span></label></div><label><span>Notă internă</span><textarea name="note" maxlength="1000">${escapeHtml(draft.note)}</textarea></label><button class="btn" type="submit">Salvează integritatea</button></form><form class="mh-community-username-reset" id="mhCommunityUsernameResetForm"><input type="hidden" name="user_id" value="${escapeHtml(user.userId)}"><label><span>Resetare username</span><input name="username" maxlength="24" value="${escapeHtml(user.username)}"></label><label><span>Motiv</span><input name="note" maxlength="500" placeholder="Motiv intern"></label><button class="btn small" type="submit">Schimbă username-ul</button></form><section class="mh-community-integrity-flags"><div class="mh-community-list-head"><strong>Flag-uri de integritate</strong><span>${flags.length}</span></div>${flags.map(integrityFlagCard).join("") || '<p class="legend">Nu există flag-uri pentru acest utilizator.</p>'}</section></div>`;
  }

  function integritySearchToolbar() {
    return `<div class="mh-community-search-row"><input id="mhCommunitySearch" type="search" value="${escapeHtml(state.query)}" placeholder="Username, nume sau email"><select id="mhCommunityIntegrityStatus">${Object.entries(INTEGRITY_STATUS_LABELS).map(([value,label]) => `<option value="${value}" ${state.integrityStatus === value ? "selected" : ""}>${label}</option>`).join("")}</select><button class="btn" data-community-action="search-integrity" type="button">Caută</button><button class="btn small" data-community-action="scan-all" type="button">Scanează</button></div>`;
  }

  function blockedDomainsPanel() {
    return `<section class="mh-community-blocked-domains"><div class="mh-community-list-head"><strong>Domenii blocate</strong><span>${state.integrity.domains.length}</span></div><form id="mhCommunityBlockedDomainForm"><input name="domain" placeholder="exemplu.ro" required><input name="reason" maxlength="500" placeholder="Motiv"><label class="mh-community-check"><input name="active" type="checkbox" checked><span>Activ</span></label><button class="btn small" type="submit">Salvează domeniul</button></form><div>${state.integrity.domains.map((domain) => `<span><strong>${escapeHtml(domain.domain)}</strong><small>${escapeHtml(domain.reason || "Fără motiv")} · ${domain.active ? "activ" : "inactiv"}</small></span>`).join("")}</div></section>`;
  }

  function renderIntegrity() {
    const selected = state.integrity.users.find((user) => user.userId === state.selectedIntegrityUserId) || null;
    body.innerHTML = `${integritySearchToolbar()}<div class="mh-community-integrity-summary"><span>${state.integrity.counts.openFlags || 0} deschise</span><span>${state.integrity.counts.criticalFlags || 0} critice</span><span>${state.integrity.counts.heldUsers || 0} suspendați</span><span>${state.integrity.counts.internalUsers || 0} interni/test</span></div><div class="mh-community-admin-layout"><section class="mh-community-admin-list"><div class="mh-community-integrity-list">${state.integrity.users.map(integrityCard).join("") || '<p class="legend">Nu există rezultate.</p>'}</div></section><aside class="mh-community-admin-editor">${integrityEditor(selected)}</aside></div>${blockedDomainsPanel()}`;
  }


  function renderBadgeHistory() {
    const events = state.badges.history || [];
    body.innerHTML = `<section class="mh-community-badge-history"><div class="mh-community-list-head"><strong>${events.length} evenimente recente</strong><span>Acordări, modificări și retrageri</span></div><div class="mh-community-history-list">${events.map((event) => `<article><span class="mh-community-badge-icon">${escapeHtml(event.badgeIcon)}</span><div><strong>${escapeHtml(event.badgeTitle)}</strong><p>${escapeHtml(event.displayName)} · @${escapeHtml(event.username)}</p><small>${escapeHtml(badgeEventLabel(event.eventType))} · ${escapeHtml(badgeSourceLabel(event.source))}${event.reason ? ` · ${escapeHtml(event.reason)}` : ""}</small></div><time>${escapeHtml(formatDate(event.createdAt))}</time></article>`).join("") || '<p class="legend">Nu există evenimente de badge.</p>'}</div></section>`;
  }

  function render() {
    host.querySelectorAll("[data-community-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.communityTab === state.activeTab));
    updateCounts();
    if (state.activeTab === "assignments") renderAssignments();
    else if (state.activeTab === "badge-history") renderBadgeHistory();
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

  async function loadIntegrity({ force = false } = {}) {
    if (!state.isAdmin || state.loading || (state.integrityLoaded && !force)) return;
    state.loading = true;
    setFeedback("Se încarcă...", "loading");
    try {
      state.integrity = normalizeCommunityIntegrityDashboard(await loadCommunityIntegrityDashboard(supabase, { status: state.integrityStatus, query: state.query, limit: 120 }));
      state.integrityLoaded = true;
      if (state.selectedIntegrityUserId && !state.integrity.users.some((user) => user.userId === state.selectedIntegrityUserId)) state.selectedIntegrityUserId = "";
      render();
      setFeedback();
    } catch (error) {
      console.error("Community integrity load failed:", error);
      setFeedback("Integritatea nu a putut fi încărcată. Rulează migrarea 061.", "error");
    } finally { state.loading = false; }
  }

  function load({ force = false } = {}) {
    if (state.activeTab === "integrity") return loadIntegrity({ force });
    return ["feedback", "reports"].includes(state.activeTab) ? loadModeration({ force }) : loadBadges({ force });
  }

  function bindCaseSaveButton() {
    const form = body.querySelector("#mhCommunityCaseForm");
    const button = body.querySelector("#mhCommunityCaseSaveBtn");
    if (!form || !button) return;

    const triggerSave = (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      void saveModerationCase(form);
    };

    button.dataset.bound = "1";
    button.addEventListener("pointerup", triggerSave);
    button.addEventListener("click", triggerSave);
  }

  async function saveModerationCase(form = body.querySelector("#mhCommunityCaseForm")) {
    if (!form?.matches?.("#mhCommunityCaseForm") || form.dataset.saving === "1") return;

    const value = formValues(form);
    const validationError = validateModerationCaseDraft(value);
    if (validationError) {
      setFeedback(validationError, "error");
      return;
    }

    form.dataset.saving = "1";
    setFeedback("Se salvează...", "loading");
    setFormBusy(form, true);

    try {
      const persisted = normalizeCommunityCase(await updateCommunityModerationCase(supabase, {
        kind: value.kind,
        id: value.id,
        status: value.status,
        priority: value.priority,
        adminNote: value.admin_note
      }), value.kind);

      if (!persisted.id || persisted.id !== value.id) throw new Error("Invalid moderation save response");

      const collection = value.kind === "feedback" ? "feedback" : "reports";
      const selectedKey = value.kind === "feedback" ? "selectedFeedbackId" : "selectedReportId";
      const index = state.moderation[collection].findIndex((item) => item.id === persisted.id);
      if (index >= 0) state.moderation[collection][index] = { ...state.moderation[collection][index], ...persisted };
      state[selectedKey] = persisted.id;
      if (!caseMatchesFilter(persisted.status)) state.status = persisted.status;

      render();
      setFeedback("Caz salvat.", "success");
      state.moderationLoaded = false;
    } catch (error) {
      console.error("Community case update failed:", error);
      setFeedback(moderationErrorMessage(error), "error");
      if (form.isConnected) {
        delete form.dataset.saving;
        setFormBusy(form, false);
      }
    }
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
    if (action === "save-case") {
      event.preventDefault();
      const form = event.target.closest("#mhCommunityCaseForm") || body.querySelector("#mhCommunityCaseForm");
      void saveModerationCase(form);
      return;
    }
    if (action === "refresh") {
      state.badgeLoaded = false;
      state.moderationLoaded = false;
      state.integrityLoaded = false;
      return void load({ force: true });
    }
    if (action === "new-badge") { state.selectedBadgeId = ""; render(); return; }
    if (["search-users", "search-cases", "search-integrity"].includes(action)) {
      state.query = host.querySelector("#mhCommunitySearch")?.value.trim() || "";
      state.status = host.querySelector("#mhCommunityStatusFilter")?.value || state.status;
      state.integrityStatus = host.querySelector("#mhCommunityIntegrityStatus")?.value || state.integrityStatus;
      if (action === "search-users") return void loadBadges({ force: true });
      if (action === "search-integrity") return void loadIntegrity({ force: true });
      return void loadModeration({ force: true });
    }
    if (action === "scan-all" || action === "scan-selected") {
      setFeedback("Se scanează...", "loading");
      try {
        await runCommunityIntegrityScan(supabase, action === "scan-selected" ? state.selectedIntegrityUserId : null);
        state.integrityLoaded = false;
        await loadIntegrity({ force: true });
        setFeedback("Scanare finalizată.", "success");
      } catch (error) { console.error("Integrity scan failed:", error); setFeedback("Scanarea nu a putut fi finalizată.", "error"); }
      return;
    }

    const revoke = event.target.closest("[data-community-revoke]");
    if (revoke) {
      if (!confirm("Retragi acest badge?")) return;
      setFeedback("Se retrage...", "loading");
      try {
        await revokeCommunityBadge(supabase, revoke.dataset.communityUser, revoke.dataset.communityRevoke);
        state.badges = normalizeCommunityBadgeStudio(await loadCommunityBadgeStudio(supabase, state.query));
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
    const formId = form.getAttribute("id") || "";
    const value = formValues(form);

    if (formId === "mhCommunityBadgeForm") {
      const validation = validateCommunityBadgeDraft(value);
      if (!validation.valid) return setFeedback(validation.errors[0], "error");
      setFeedback("Se salvează...", "loading");
      try { state.badges = normalizeCommunityBadgeStudio(await saveCommunityBadgeDefinition(supabase, validation.badge)); state.selectedBadgeId = validation.badge.id; render(); setFeedback("Badge salvat.", "success"); }
      catch (error) { console.error("Community badge save failed:", error); setFeedback("Badge-ul nu a putut fi salvat.", "error"); }
      return;
    }

    if (formId === "mhCommunityAssignmentForm") {
      if (!value.badge_id) return setFeedback("Alege un badge.", "error");
      setFeedback("Se acordă...", "loading");
      try {
        await assignCommunityBadge(supabase, { user_id: value.user_id, badge_id: value.badge_id, featured: value.featured, note: value.note, expires_at: value.expires_at || null });
        state.badges = normalizeCommunityBadgeStudio(await loadCommunityBadgeStudio(supabase, state.query));
        render();
        setFeedback("Badge acordat.", "success");
      }
      catch (error) { console.error("Community badge assignment failed:", error); setFeedback("Badge-ul nu a putut fi acordat.", "error"); }
      return;
    }

    if (formId === "mhCommunityCaseForm") {
      await saveModerationCase(form);
      return;
    }

    if (formId === "mhCommunityIntegrityForm") {
      setFeedback("Se salvează...", "loading");
      try {
        await saveCommunityIntegrityUser(supabase, value);
        state.integrityLoaded = false;
        await loadIntegrity({ force: true });
        setFeedback("Integritate actualizată.", "success");
      } catch (error) { console.error("Community integrity save failed:", error); setFeedback("Integritatea nu a putut fi salvată.", "error"); }
      return;
    }

    if (formId === "mhCommunityUsernameResetForm") {
      setFeedback("Se schimbă username-ul...", "loading");
      try {
        await resetCommunityUsername(supabase, { userId: value.user_id, username: value.username, note: value.note });
        state.integrityLoaded = false;
        await loadIntegrity({ force: true });
        setFeedback("Username actualizat.", "success");
      } catch (error) { console.error("Community username reset failed:", error); setFeedback("Username-ul nu a putut fi schimbat.", "error"); }
      return;
    }

    if (form.matches("[data-community-integrity-flag-form]")) {
      setFeedback("Se salvează flag-ul...", "loading");
      try {
        await reviewCommunityIntegrityFlag(supabase, { flagId: form.dataset.communityIntegrityFlagForm, status: value.status, note: value.note });
        state.integrityLoaded = false;
        await loadIntegrity({ force: true });
        setFeedback("Flag actualizat.", "success");
      } catch (error) { console.error("Integrity flag save failed:", error); setFeedback("Flag-ul nu a putut fi salvat.", "error"); }
      return;
    }

    if (formId === "mhCommunityBlockedDomainForm") {
      setFeedback("Se salvează domeniul...", "loading");
      try {
        await saveCommunityBlockedDomain(supabase, { domain: value.domain, reason: value.reason, active: value.active });
        state.integrityLoaded = false;
        await loadIntegrity({ force: true });
        setFeedback("Domeniu salvat.", "success");
      } catch (error) { console.error("Blocked domain save failed:", error); setFeedback("Domeniul nu a putut fi salvat.", "error"); }
    }
  });

  render();

  return {
    load,
    saveCurrentCase() { return saveModerationCase(); },
    refresh() { state.badgeLoaded = false; state.moderationLoaded = false; return load({ force: true }); },
    setAdmin(isAdmin) {
      state.isAdmin = Boolean(isAdmin);
      if (!state.isAdmin) {
        state.badgeLoaded = false;
        state.moderationLoaded = false;
        state.integrityLoaded = false;
        state.badges = { badges: [], users: [] };
        state.moderation = { counts: {}, feedback: [], reports: [], users: [] };
        state.integrity = { counts: {}, users: [], flags: [], domains: [] };
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
