import { supabase } from "./supabase-client.js";
import {
  COMMUNITY_LEADERBOARD_METRICS,
  COMMUNITY_LEADERBOARD_PERIODS,
  availableLeaderboardScopes,
  leaderboardProfileUrl,
  normalizeLeaderboardQuery
} from "./community-leaderboard-model.js";
import {
  loadCommunityLeaderboard,
  loadLeaderboardGeographyOptions,
  searchLeaderboardRegions
} from "./community-leaderboard-repository.js";

const STORAGE_KEY = "mh_community_leaderboard_filters_v2";
let host = null;

const COPY = {
  ro: {
    loading: "Se încarcă clasamentul…", error: "Clasamentul nu a putut fi încărcat.", retry: "Reîncearcă",
    title: "Clasamente MathHard", subtitle: "Compară progresul pe județ, țară, continent și global.",
    scope: "Zonă", period: "Perioadă", metric: "Criteriu", position: "Loc", profile: "Profil",
    level: "Nivel", xp: "XP", problems: "Probleme", lessons: "Lecții", exams: "Examene",
    week: "Săptămâna aceasta", month: "Luna aceasta", all: "Toată perioada", global: "Global",
    eu: "Uniunea Europeană", continent: "Continent", country: "Țară", region: "Regiune", county: "Județ",
    empty: "Nu există încă rezultate pentru acest clasament.", chooseAreaEmpty: "Alege o zonă pentru a vedea clasamentul.",
    ownRank: "Poziția ta", outsidePage: "Poziția ta nu este pe pagina curentă.", previous: "Anterior", next: "Următor",
    page: "Pagina", of: "din", publicNeeded: "Activează profilul public și participarea în clasamente pentru a apărea aici.",
    configure: "Configurează profilul", profileUnavailable: "Poți vedea clasamentele publice. Completează profilul comunității ca să apari și tu.",
    selectedArea: "Clasament selectat", chooseArea: "Caută și alege o zonă pentru a continua.", publicMembers: "membri publici",
    regionSearch: "Explorează județe și regiuni", regionSearchPlaceholder: "Caută Bistrița-Năsăud, Cluj, Bavaria…",
    regionSearchHint: "Poți vedea orice clasament regional fără să-ți schimbi profilul.", myRegion: "Județul meu",
    countrySearch: "Explorează țări", countrySearchPlaceholder: "Caută România, Germania, Japonia…",
    countrySearchHint: "Compară orice țară fără să-ți modifici locația profilului.", myCountry: "Țara mea",
    continentSearch: "Explorează continente", continentSearchPlaceholder: "Caută Europa, Asia, America de Nord…",
    continentSearchHint: "Poți schimba continentul direct din clasament.", myContinent: "Continentul meu",
    searchingAreas: "Se caută…", noAreaResults: "Nu am găsit zona.",
    europe: "Europa", africa: "Africa", asia: "Asia", northAmerica: "America de Nord", southAmerica: "America de Sud",
    oceania: "Oceania", antarctica: "Antarctica"
  },
  en: {
    loading: "Loading leaderboard…", error: "The leaderboard could not be loaded.", retry: "Retry",
    title: "MathHard leaderboards", subtitle: "Compare progress by region, country, continent and globally.",
    scope: "Area", period: "Period", metric: "Ranking", position: "Rank", profile: "Profile",
    level: "Level", xp: "XP", problems: "Problems", lessons: "Lessons", exams: "Exams",
    week: "This week", month: "This month", all: "All-time", global: "Global",
    eu: "European Union", continent: "Continent", country: "Country", region: "Region", county: "County",
    empty: "There are no results for this leaderboard yet.", chooseAreaEmpty: "Choose an area to view its leaderboard.",
    ownRank: "Your rank", outsidePage: "Your rank is outside the current page.", previous: "Previous", next: "Next",
    page: "Page", of: "of", publicNeeded: "Enable a public profile and leaderboard participation to appear here.",
    configure: "Configure profile", profileUnavailable: "You can browse public leaderboards. Complete your community profile to appear in them.",
    selectedArea: "Selected leaderboard", chooseArea: "Search for and choose an area to continue.", publicMembers: "public members",
    regionSearch: "Explore regions", regionSearchPlaceholder: "Search Bistrița-Năsăud, Cluj, Bavaria…",
    regionSearchHint: "Browse any regional leaderboard without changing your profile location.", myRegion: "My region",
    countrySearch: "Explore countries", countrySearchPlaceholder: "Search Romania, Germany, Japan…",
    countrySearchHint: "Compare any country without changing your profile location.", myCountry: "My country",
    continentSearch: "Explore continents", continentSearchPlaceholder: "Search Europe, Asia, North America…",
    continentSearchHint: "Switch continents directly from the leaderboard.", myContinent: "My continent",
    searchingAreas: "Searching…", noAreaResults: "No matching area found.",
    europe: "Europe", africa: "Africa", asia: "Asia", northAmerica: "North America", southAmerica: "South America",
    oceania: "Oceania", antarctica: "Antarctica"
  }
};

const CONTINENTS = { EU: "europe", AF: "africa", AS: "asia", NA: "northAmerica", SA: "southAmerica", OC: "oceania", AN: "antarctica" };

let active = false;
let loading = false;
let reloadAfterCurrent = false;
let lastPayload = null;
let query = readSavedQuery();
let areaSearchTimer = 0;
let areaSearchSerial = 0;
let geographyOptions = null;
let geographyPromise = null;

function language() { return document.documentElement.lang?.toLowerCase().startsWith("en") ? "en" : "ro"; }
function t() { return COPY[language()]; }

function readSavedQuery() {
  try { return normalizeLeaderboardQuery(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")); }
  catch { return normalizeLeaderboardQuery({}); }
}
function saveQuery() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(query)); } catch { /* Optional persistence. */ } }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function formatNumber(value) { return new Intl.NumberFormat(language() === "en" ? "en-US" : "ro-RO").format(Number(value) || 0); }
function normalizeSearch(value) { return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }

function countryLabel(code) {
  if (!code) return "";
  try { return new Intl.DisplayNames([language() === "en" ? "en" : "ro"], { type: "region" }).of(code) || code; }
  catch { return code; }
}
function continentLabel(code) { return t()[CONTINENTS[code]] || code || ""; }
function scopeLabel(scope, context) {
  if (scope === "region") return context.countryCode === "RO" ? t().county : t().region;
  return t()[scope] || scope;
}
function metricLabel(metric) { return t()[metric] || metric; }
function periodLabel(period) { return t()[period] || period; }

function avatarMarkup(row) {
  const initial = escapeHtml((row.displayName || row.username || "M").charAt(0).toUpperCase());
  if (!row.avatarUrl) return `<span class="mh-community-rank-avatar">${initial}</span>`;
  return `<span class="mh-community-rank-avatar" data-avatar-fallback="${initial}"><img src="${escapeHtml(row.avatarUrl)}" alt="" referrerpolicy="no-referrer"></span>`;
}
function badgeMarkup(row) {
  if (!row.badge) return "";
  const title = language() === "en" ? (row.badge.titleEn || row.badge.titleRo) : (row.badge.titleRo || row.badge.titleEn);
  return `<span class="mh-community-rank-badge" data-rarity="${escapeHtml(row.badge.rarity)}">${escapeHtml(row.badge.icon)} ${escapeHtml(title)}</span>`;
}
function renderRow(row, { own = false } = {}) {
  const profileUrl = leaderboardProfileUrl(row.username, location.origin);
  return `<tr class="${row.isCurrentUser || own ? "is-current" : ""}">
    <td data-label="${escapeHtml(t().position)}"><strong class="mh-community-rank-position">#${formatNumber(row.rank)}</strong></td>
    <td data-label="${escapeHtml(t().profile)}"><a class="mh-community-rank-user" href="${escapeHtml(profileUrl)}">${avatarMarkup(row)}<span class="mh-community-rank-identity"><strong>${escapeHtml(row.displayName || row.username)}</strong><small>@${escapeHtml(row.username)}</small>${badgeMarkup(row)}</span></a></td>
    <td data-label="${escapeHtml(t().level)}"><span class="mh-community-rank-level">${formatNumber(row.level)}</span></td>
    <td data-label="${escapeHtml(metricLabel(query.metric))}"><strong>${formatNumber(row.value)}</strong></td>
    <td data-label="${escapeHtml(t().xp)}">${formatNumber(row.totalXp)}</td><td data-label="${escapeHtml(t().problems)}">${formatNumber(row.problemsSolved)}</td>
    <td data-label="${escapeHtml(t().lessons)}">${formatNumber(row.lessonsLearned)}</td><td data-label="${escapeHtml(t().exams)}">${formatNumber(row.examsPassed)}</td>
  </tr>`;
}

function explorerConfig(payload) {
  const context = payload.context;
  if (query.scope === "region") return {
    scope: "region", title: t().regionSearch, hint: t().regionSearchHint, placeholder: t().regionSearchPlaceholder,
    targetCode: context.targetRegionCode, targetName: context.targetRegionName,
    targetMeta: [countryLabel(context.targetCountryCode), context.targetRegionType].filter(Boolean).join(" · "),
    ownCode: context.showLocation ? context.regionCode : "", ownName: context.regionName, ownLabel: t().myRegion
  };
  if (query.scope === "country") return {
    scope: "country", title: t().countrySearch, hint: t().countrySearchHint, placeholder: t().countrySearchPlaceholder,
    targetCode: context.targetCountryCode, targetName: countryLabel(context.targetCountryCode),
    targetMeta: continentLabel(context.targetContinentCode),
    ownCode: context.showLocation ? context.countryCode : "", ownName: countryLabel(context.countryCode), ownLabel: t().myCountry
  };
  if (query.scope === "continent") return {
    scope: "continent", title: t().continentSearch, hint: t().continentSearchHint, placeholder: t().continentSearchPlaceholder,
    targetCode: context.targetContinentCode, targetName: continentLabel(context.targetContinentCode), targetMeta: "",
    ownCode: context.showLocation ? context.continentCode : "", ownName: continentLabel(context.continentCode), ownLabel: t().myContinent
  };
  return null;
}

function geographyExplorerMarkup(payload) {
  const config = explorerConfig(payload);
  if (!config) return "";
  const ownButton = config.ownCode && config.ownCode !== config.targetCode
    ? `<button type="button" class="mh-community-region-own" data-leaderboard-own-area="${escapeHtml(config.ownCode)}">${escapeHtml(config.ownLabel)} · ${escapeHtml(config.ownName)}</button>` : "";
  return `<section class="mh-community-region-explorer" data-area-scope="${config.scope}" aria-labelledby="mhCommunityAreaExplorerTitle">
    <div class="mh-community-region-explorer-head"><div><span id="mhCommunityAreaExplorerTitle">${escapeHtml(config.title)}</span><small>${escapeHtml(config.hint)}</small></div>${ownButton}</div>
    <div class="mh-community-region-picker"><label class="mh-community-region-search" for="mhCommunityAreaSearch"><span aria-hidden="true">⌕</span><input id="mhCommunityAreaSearch" type="search" autocomplete="off" spellcheck="false" placeholder="${escapeHtml(config.placeholder)}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="mhCommunityAreaResults" data-leaderboard-area-search></label><div id="mhCommunityAreaResults" class="mh-community-region-results" role="listbox" hidden></div></div>
    <div class="mh-community-region-current ${config.targetCode ? "has-region" : ""}"><span>${escapeHtml(t().selectedArea)}</span><strong>${escapeHtml(config.targetName || t().chooseArea)}</strong>${config.targetMeta ? `<small>${escapeHtml(config.targetMeta)}</small>` : ""}</div>
  </section>`;
}

function controls(payload) {
  const scopes = availableLeaderboardScopes(payload.context);
  const scopeButtons = scopes.map((scope) => `<button type="button" data-leaderboard-scope="${scope}" class="${query.scope === scope ? "is-active" : ""}">${escapeHtml(scopeLabel(scope, payload.context))}</button>`).join("");
  const periodButtons = COMMUNITY_LEADERBOARD_PERIODS.map((period) => `<button type="button" data-leaderboard-period="${period}" class="${query.period === period ? "is-active" : ""}">${escapeHtml(periodLabel(period))}</button>`).join("");
  const metricButtons = COMMUNITY_LEADERBOARD_METRICS.map((metric) => `<button type="button" data-leaderboard-metric="${metric}" class="${query.metric === metric ? "is-active" : ""}">${escapeHtml(metricLabel(metric))}</button>`).join("");
  return `<div class="mh-community-leaderboard-controls"><div><span>${escapeHtml(t().scope)}</span><div class="mh-community-segmented">${scopeButtons}</div></div><div><span>${escapeHtml(t().period)}</span><div class="mh-community-segmented">${periodButtons}</div></div><div><span>${escapeHtml(t().metric)}</span><div class="mh-community-segmented">${metricButtons}</div></div></div>${geographyExplorerMarkup(payload)}`;
}

function hasSelectedTarget(payload) {
  if (query.scope === "region") return Boolean(payload.context.targetRegionCode);
  if (query.scope === "country") return Boolean(payload.context.targetCountryCode);
  if (query.scope === "continent") return Boolean(payload.context.targetContinentCode);
  return true;
}
function noticeMarkup(payload) {
  if (!hasSelectedTarget(payload)) return `<p class="mh-community-leaderboard-notice">${escapeHtml(t().chooseArea)}</p>`;
  if (!payload.context.authenticated) return `<p class="mh-community-leaderboard-notice">${escapeHtml(t().profileUnavailable)} <a href="/profile.html#community">${escapeHtml(t().configure)}</a></p>`;
  if (!payload.context.isPublic || !payload.context.showProgress || !payload.context.leaderboardOptIn) return `<p class="mh-community-leaderboard-notice">${escapeHtml(t().publicNeeded)} <a href="/profile.html#community">${escapeHtml(t().configure)}</a></p>`;
  return "";
}
function paginationMarkup(payload) {
  if (payload.totalPages <= 1) return "";
  return `<nav class="mh-community-leaderboard-pagination" aria-label="Pagination"><button type="button" data-leaderboard-page="${query.page - 1}" ${query.page <= 1 ? "disabled" : ""}>← ${escapeHtml(t().previous)}</button><span>${escapeHtml(t().page)} ${formatNumber(query.page)} ${escapeHtml(t().of)} ${formatNumber(payload.totalPages)}</span><button type="button" data-leaderboard-page="${query.page + 1}" ${query.page >= payload.totalPages ? "disabled" : ""}>${escapeHtml(t().next)} →</button></nav>`;
}

function renderPayload(payload) {
  if (!host) return;
  lastPayload = payload;
  const pageHasOwn = payload.rows.some((row) => row.isCurrentUser);
  const own = payload.ownRow && !pageHasOwn ? `<section class="mh-community-own-rank"><div><span>${escapeHtml(t().ownRank)}</span><small>${escapeHtml(t().outsidePage)}</small></div><table><tbody>${renderRow(payload.ownRow, { own: true })}</tbody></table></section>` : "";
  const emptyText = hasSelectedTarget(payload) ? t().empty : t().chooseAreaEmpty;
  host.innerHTML = `<section class="mh-community-leaderboard-shell"><header class="mh-community-leaderboard-head"><div><h2>${escapeHtml(t().title)}</h2><p>${escapeHtml(t().subtitle)}</p></div><span class="mh-community-leaderboard-count">${formatNumber(payload.totalCount)}</span></header>${controls(payload)}${noticeMarkup(payload)}<div class="mh-community-leaderboard-table-wrap"><table class="mh-community-leaderboard-table"><thead><tr><th>${escapeHtml(t().position)}</th><th>${escapeHtml(t().profile)}</th><th>${escapeHtml(t().level)}</th><th>${escapeHtml(metricLabel(query.metric))}</th><th>${escapeHtml(t().xp)}</th><th>${escapeHtml(t().problems)}</th><th>${escapeHtml(t().lessons)}</th><th>${escapeHtml(t().exams)}</th></tr></thead><tbody>${payload.rows.length ? payload.rows.map((row) => renderRow(row)).join("") : `<tr><td colspan="8"><div class="mh-community-leaderboard-empty">${escapeHtml(emptyText)}</div></td></tr>`}</tbody></table></div>${own}${paginationMarkup(payload)}</section>`;
  bindControls();
}
function renderState(kind) {
  if (!host) return;
  if (kind === "loading") { host.innerHTML = `<div class="mh-ui-state is-loading"><div class="mh-ui-spinner" aria-hidden="true"></div><p>${escapeHtml(t().loading)}</p></div>`; return; }
  host.innerHTML = `<div class="mh-ui-state is-error"><p>${escapeHtml(t().error)}</p><button class="btn small primary" type="button" data-leaderboard-retry>${escapeHtml(t().retry)}</button></div>`;
  host.querySelector("[data-leaderboard-retry]")?.addEventListener("click", () => void refresh(), { once: true });
}
function revealActiveSegments() { host?.querySelectorAll(".mh-community-segmented .is-active").forEach((button) => button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })); }
function setAreaResultsState(list, input, markup, expanded = true) { if (!list || !input) return; list.innerHTML = markup; list.hidden = !expanded; input.setAttribute("aria-expanded", String(expanded)); }

async function ensureGeographyOptions() {
  if (geographyOptions) return geographyOptions;
  if (!geographyPromise) geographyPromise = loadLeaderboardGeographyOptions(supabase).then((value) => { geographyOptions = value; return value; }).finally(() => { geographyPromise = null; });
  return geographyPromise;
}
function areaResultsMarkup(items, scope) {
  if (!items.length) return `<p class="mh-community-region-results-state">${escapeHtml(t().noAreaResults)}</p>`;
  return items.map((item) => {
    const name = scope === "region" ? item.name : scope === "country" ? countryLabel(item.code) : continentLabel(item.code);
    const meta = scope === "region" ? [countryLabel(item.countryCode), item.type].filter(Boolean).join(" · ") : scope === "country" ? continentLabel(item.continentCode) : "";
    return `<button type="button" role="option" data-leaderboard-area-code="${escapeHtml(item.code)}"><span><strong>${escapeHtml(name)}</strong>${meta ? `<small>${escapeHtml(meta)}</small>` : ""}</span><em>${formatNumber(item.publicMembers)} ${escapeHtml(t().publicMembers)}</em></button>`;
  }).join("");
}
async function findAreas(scope, search) {
  if (scope === "region") return searchLeaderboardRegions(supabase, search, 14);
  const options = await ensureGeographyOptions();
  const normalized = normalizeSearch(search);
  const source = scope === "country" ? options.countries : options.continents;
  return source.filter((item) => {
    const label = scope === "country" ? countryLabel(item.code) : continentLabel(item.code);
    return !normalized || normalizeSearch(label).includes(normalized) || item.code.toLowerCase().includes(normalized);
  }).sort((a, b) => b.publicMembers - a.publicMembers || String(a.code).localeCompare(String(b.code))).slice(0, 20);
}
function applyAreaSelection(scope, code) {
  const patch = { ...query, scope, page: 1 };
  if (scope === "region") patch.regionCode = code;
  if (scope === "country") patch.countryCode = code;
  if (scope === "continent") patch.continentCode = code;
  query = normalizeLeaderboardQuery(patch);
  saveQuery();
  void refresh();
}
async function runAreaSearch(input, list, scope) {
  const serial = ++areaSearchSerial;
  setAreaResultsState(list, input, `<p class="mh-community-region-results-state">${escapeHtml(t().searchingAreas)}</p>`);
  try {
    const items = await findAreas(scope, input.value);
    if (serial !== areaSearchSerial || !input.isConnected) return;
    setAreaResultsState(list, input, areaResultsMarkup(items, scope));
    list.querySelectorAll("[data-leaderboard-area-code]").forEach((button, index) => {
      button.addEventListener("click", () => applyAreaSelection(scope, button.dataset.leaderboardAreaCode));
      if (index === 0) button.dataset.firstAreaResult = "true";
    });
  } catch (error) {
    console.error("Leaderboard area search failed:", error);
    if (serial === areaSearchSerial && input.isConnected) setAreaResultsState(list, input, `<p class="mh-community-region-results-state">${escapeHtml(t().error)}</p>`);
  }
}
function bindAreaExplorer() {
  const input = host.querySelector("[data-leaderboard-area-search]");
  const list = host.querySelector("#mhCommunityAreaResults");
  const scope = host.querySelector("[data-area-scope]")?.dataset.areaScope;
  if (!input || !list || !scope) return;
  const queueSearch = (delay = 180) => { window.clearTimeout(areaSearchTimer); areaSearchTimer = window.setTimeout(() => void runAreaSearch(input, list, scope), delay); };
  input.addEventListener("focus", () => queueSearch(0));
  input.addEventListener("input", () => queueSearch());
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { list.hidden = true; input.setAttribute("aria-expanded", "false"); input.blur(); }
    if (event.key === "ArrowDown") { const first = list.querySelector("[data-first-area-result]"); if (first) { event.preventDefault(); first.focus(); } }
  });
  input.addEventListener("blur", () => window.setTimeout(() => { if (!list.contains(document.activeElement)) { list.hidden = true; input.setAttribute("aria-expanded", "false"); } }, 100));
  list.addEventListener("focusout", () => window.setTimeout(() => { if (!list.contains(document.activeElement) && document.activeElement !== input) { list.hidden = true; input.setAttribute("aria-expanded", "false"); } }, 100));
  host.querySelector("[data-leaderboard-own-area]")?.addEventListener("click", (event) => applyAreaSelection(scope, event.currentTarget.dataset.leaderboardOwnArea));
}

function bindControls() {
  host.querySelectorAll("[data-avatar-fallback] img").forEach((image) => image.addEventListener("error", () => { const wrapper = image.closest("[data-avatar-fallback]"); if (wrapper) wrapper.replaceChildren(document.createTextNode(wrapper.dataset.avatarFallback || "M")); }, { once: true }));
  host.querySelectorAll("[data-leaderboard-scope]").forEach((button) => button.addEventListener("click", () => {
    const scope = button.dataset.leaderboardScope;
    const patch = { ...query, scope, page: 1 };
    if (scope === "region" && !patch.regionCode) patch.regionCode = lastPayload?.context.regionCode || "";
    if (scope === "country" && !patch.countryCode) patch.countryCode = lastPayload?.context.countryCode || "";
    if (scope === "continent" && !patch.continentCode) patch.continentCode = lastPayload?.context.continentCode || "";
    query = normalizeLeaderboardQuery(patch); saveQuery(); void refresh();
  }));
  host.querySelectorAll("[data-leaderboard-period]").forEach((button) => button.addEventListener("click", () => { query = normalizeLeaderboardQuery({ ...query, period: button.dataset.leaderboardPeriod, page: 1 }); saveQuery(); void refresh(); }));
  host.querySelectorAll("[data-leaderboard-metric]").forEach((button) => button.addEventListener("click", () => { query = normalizeLeaderboardQuery({ ...query, metric: button.dataset.leaderboardMetric, page: 1 }); saveQuery(); void refresh(); }));
  host.querySelectorAll("[data-leaderboard-page]").forEach((button) => button.addEventListener("click", () => { query = normalizeLeaderboardQuery({ ...query, page: button.dataset.leaderboardPage }); saveQuery(); void refresh(); }));
  bindAreaExplorer();
  requestAnimationFrame(revealActiveSegments);
}

async function refresh() {
  if (!host || !active) return;
  if (loading) { reloadAfterCurrent = true; return; }
  loading = true; renderState("loading");
  try {
    let payload = await loadCommunityLeaderboard(supabase, query);
    if (query.page > payload.totalPages) { query = normalizeLeaderboardQuery({ ...query, page: payload.totalPages }); payload = await loadCommunityLeaderboard(supabase, query); }
    const context = payload.context;
    if (query.scope === "region" && context.targetRegionCode) query = normalizeLeaderboardQuery({ ...query, regionCode: context.targetRegionCode });
    if (query.scope === "country" && context.targetCountryCode) query = normalizeLeaderboardQuery({ ...query, countryCode: context.targetCountryCode });
    if (query.scope === "continent" && context.targetContinentCode) query = normalizeLeaderboardQuery({ ...query, continentCode: context.targetContinentCode });
    renderPayload(payload); saveQuery();
  } catch (error) { console.error("Community leaderboard load failed:", error); renderState("error"); }
  finally { loading = false; if (reloadAfterCurrent && active) { reloadAfterCurrent = false; queueMicrotask(() => void refresh()); } }
}
function rerenderLanguage() { geographyOptions = null; if (active && lastPayload) renderPayload(lastPayload); }
function initLeaderboardWorkspace() {
  host = document.getElementById("mhShellPanelLeaderboards"); if (!host) return;
  window.addEventListener("mh:leaderboards-route", (event) => { active = Boolean(event.detail?.active); if (active) void refresh(); });
  window.addEventListener("mh:community-profile-saved", () => { geographyOptions = null; if (active) void refresh(); });
  supabase.auth.onAuthStateChange(() => { lastPayload = null; if (active) void refresh(); });
  document.addEventListener("visibilitychange", () => { if (active && document.visibilityState === "visible") void refresh(); });
  window.addEventListener("storage", (event) => { if (event.key === "mh_lang" && active) rerenderLanguage(); });
  new MutationObserver(rerenderLanguage).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  if (location.hash.replace(/^#/, "") === "leaderboards") { active = true; void refresh(); }
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initLeaderboardWorkspace, { once: true });
  else initLeaderboardWorkspace();
}
