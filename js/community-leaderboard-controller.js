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
  searchLeaderboardRegions
} from "./community-leaderboard-repository.js";

const STORAGE_KEY = "mh_community_leaderboard_filters_v1";
let host = null;

const COPY = {
  ro: {
    loading: "Se încarcă clasamentul…",
    error: "Clasamentul nu a putut fi încărcat.",
    retry: "Reîncearcă",
    title: "Clasamente MathHard",
    subtitle: "Compară progresul pe regiune, țară, continent și global.",
    scope: "Zonă",
    period: "Perioadă",
    metric: "Clasificare",
    position: "Loc",
    profile: "Profil",
    level: "Nivel",
    xp: "XP",
    problems: "Probleme",
    lessons: "Lecții",
    exams: "Examene",
    week: "Săptămâna aceasta",
    month: "Luna aceasta",
    all: "All-time",
    global: "Global",
    eu: "Uniunea Europeană",
    continent: "Continent",
    country: "Țară",
    region: "Regiune",
    county: "Județ",
    empty: "Nu există încă suficiente rezultate pentru acest clasament.",
    chooseRegionEmpty: "Alege o regiune pentru a vedea clasamentul ei.",
    ownRank: "Poziția ta",
    outsidePage: "Poziția ta nu este pe pagina curentă.",
    previous: "Anterior",
    next: "Următor",
    page: "Pagina",
    of: "din",
    publicNeeded: "Activează profilul public și participarea în clasamente pentru a apărea aici.",
    configure: "Configurează profilul",
    locationNeeded: "Activează locația publică pentru clasamentele geografice.",
    profileUnavailable: "Poți vedea clasamentele publice. Completează profilul comunității ca să apari și tu.",
    regionSearch: "Explorează regiuni",
    regionSearchPlaceholder: "Caută Bistrița-Năsăud, Cluj, Bavaria…",
    regionSearchHint: "Poți vedea orice clasament regional fără să-ți schimbi locația profilului.",
    selectedRegion: "Clasament selectat",
    chooseRegion: "Caută și alege o regiune pentru a continua.",
    myRegion: "Regiunea mea",
    popularRegions: "Regiuni active",
    searchingRegions: "Se caută…",
    noRegionResults: "Nu am găsit regiunea.",
    publicMembers: "membri publici",
    rankSuffix: "",
    europe: "Europa",
    africa: "Africa",
    asia: "Asia",
    northAmerica: "America de Nord",
    southAmerica: "America de Sud",
    oceania: "Oceania",
    antarctica: "Antarctica"
  },
  en: {
    loading: "Loading leaderboard…",
    error: "The leaderboard could not be loaded.",
    retry: "Retry",
    title: "MathHard leaderboards",
    subtitle: "Compare progress by region, country, continent and globally.",
    scope: "Area",
    period: "Period",
    metric: "Ranking",
    position: "Rank",
    profile: "Profile",
    level: "Level",
    xp: "XP",
    problems: "Problems",
    lessons: "Lessons",
    exams: "Exams",
    week: "This week",
    month: "This month",
    all: "All-time",
    global: "Global",
    eu: "European Union",
    continent: "Continent",
    country: "Country",
    region: "Region",
    county: "County",
    empty: "There are not enough results for this leaderboard yet.",
    chooseRegionEmpty: "Choose a region to view its leaderboard.",
    ownRank: "Your rank",
    outsidePage: "Your rank is outside the current page.",
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    publicNeeded: "Enable a public profile and leaderboard participation to appear here.",
    configure: "Configure profile",
    locationNeeded: "Enable public location for geographic leaderboards.",
    profileUnavailable: "You can browse public leaderboards. Complete your community profile to appear in them.",
    regionSearch: "Explore regions",
    regionSearchPlaceholder: "Search Bistrița-Năsăud, Cluj, Bavaria…",
    regionSearchHint: "Browse any regional leaderboard without changing your profile location.",
    selectedRegion: "Selected leaderboard",
    chooseRegion: "Search for and choose a region to continue.",
    myRegion: "My region",
    popularRegions: "Active regions",
    searchingRegions: "Searching…",
    noRegionResults: "No matching region found.",
    publicMembers: "public members",
    rankSuffix: "",
    europe: "Europe",
    africa: "Africa",
    asia: "Asia",
    northAmerica: "North America",
    southAmerica: "South America",
    oceania: "Oceania",
    antarctica: "Antarctica"
  }
};

const CONTINENTS = {
  EU: "europe",
  AF: "africa",
  AS: "asia",
  NA: "northAmerica",
  SA: "southAmerica",
  OC: "oceania",
  AN: "antarctica"
};

let active = false;
let loading = false;
let reloadAfterCurrent = false;
let lastPayload = null;
let query = readSavedQuery();
let regionSearchTimer = 0;
let regionSearchSerial = 0;

function language() {
  return document.documentElement.lang?.toLowerCase().startsWith("en") ? "en" : "ro";
}

function t() {
  return COPY[language()];
}

function readSavedQuery() {
  try {
    return normalizeLeaderboardQuery(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
  } catch {
    return normalizeLeaderboardQuery({});
  }
}

function saveQuery() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(query));
  } catch {
    // Filters remain usable without persistence.
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value) {
  return new Intl.NumberFormat(language() === "en" ? "en-US" : "ro-RO").format(Number(value) || 0);
}

function countryLabel(code) {
  if (!code) return "";
  try {
    return new Intl.DisplayNames([language() === "en" ? "en" : "ro"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

function scopeLabel(scope, context) {
  const copy = t();
  if (scope === "region") {
    const countryCode = context.targetCountryCode || context.countryCode;
    return countryCode === "RO" ? copy.county : copy.region;
  }
  if (scope === "country") return copy.country;
  if (scope === "eu") return copy.eu;
  if (scope === "continent") return copy.continent;
  return copy.global;
}

function metricLabel(metric) {
  return t()[metric] || metric;
}

function periodLabel(period) {
  return t()[period] || period;
}

function avatarMarkup(row) {
  const initial = escapeHtml((row.displayName || row.username || "M").charAt(0).toUpperCase());
  if (!row.avatarUrl) return `<span class="mh-community-rank-avatar">${initial}</span>`;
  return `<span class="mh-community-rank-avatar" data-avatar-fallback="${initial}"><img src="${escapeHtml(row.avatarUrl)}" alt="" referrerpolicy="no-referrer"></span>`;
}

function badgeMarkup(row) {
  if (!row.badge) return "";
  const title = language() === "en"
    ? (row.badge.titleEn || row.badge.titleRo)
    : (row.badge.titleRo || row.badge.titleEn);
  return `<span class="mh-community-rank-badge" data-rarity="${escapeHtml(row.badge.rarity)}">${escapeHtml(row.badge.icon)} ${escapeHtml(title)}</span>`;
}

function renderRow(row, { own = false } = {}) {
  const profileUrl = leaderboardProfileUrl(row.username, location.origin);
  return `
    <tr class="${row.isCurrentUser || own ? "is-current" : ""}">
      <td data-label="${escapeHtml(t().position)}"><strong class="mh-community-rank-position">#${formatNumber(row.rank)}</strong></td>
      <td data-label="${escapeHtml(t().profile)}">
        <a class="mh-community-rank-user" href="${escapeHtml(profileUrl)}">
          ${avatarMarkup(row)}
          <span class="mh-community-rank-identity">
            <strong>${escapeHtml(row.displayName || row.username)}</strong>
            <small>@${escapeHtml(row.username)}</small>
            ${badgeMarkup(row)}
          </span>
        </a>
      </td>
      <td data-label="${escapeHtml(t().level)}"><span class="mh-community-rank-level">${formatNumber(row.level)}</span></td>
      <td data-label="${escapeHtml(metricLabel(query.metric))}"><strong>${formatNumber(row.value)}</strong></td>
      <td data-label="${escapeHtml(t().xp)}">${formatNumber(row.totalXp)}</td>
      <td data-label="${escapeHtml(t().problems)}">${formatNumber(row.problemsSolved)}</td>
      <td data-label="${escapeHtml(t().lessons)}">${formatNumber(row.lessonsLearned)}</td>
      <td data-label="${escapeHtml(t().exams)}">${formatNumber(row.examsPassed)}</td>
    </tr>
  `;
}

function regionExplorerMarkup(payload) {
  if (query.scope !== "region") return "";
  const copy = t();
  const context = payload.context;
  const targetName = context.targetRegionName;
  const targetCountry = countryLabel(context.targetCountryCode);
  const ownAvailable = Boolean(context.regionCode && context.regionName);
  const ownSelected = context.targetRegionCode && context.targetRegionCode === context.regionCode;
  const ownButton = ownAvailable && !ownSelected
    ? `<button type="button" class="mh-community-region-own" data-leaderboard-own-region="${escapeHtml(context.regionCode)}">${escapeHtml(copy.myRegion)} · ${escapeHtml(context.regionName)}</button>`
    : "";

  return `
    <section class="mh-community-region-explorer" aria-labelledby="mhCommunityRegionExplorerTitle">
      <div class="mh-community-region-explorer-head">
        <div>
          <span id="mhCommunityRegionExplorerTitle">${escapeHtml(copy.regionSearch)}</span>
          <small>${escapeHtml(copy.regionSearchHint)}</small>
        </div>
        ${ownButton}
      </div>
      <div class="mh-community-region-picker">
        <label class="mh-community-region-search" for="mhCommunityRegionSearch">
          <span aria-hidden="true">⌕</span>
          <input id="mhCommunityRegionSearch" type="search" autocomplete="off" spellcheck="false"
            placeholder="${escapeHtml(copy.regionSearchPlaceholder)}"
            role="combobox" aria-autocomplete="list" aria-expanded="false"
            aria-controls="mhCommunityRegionResults" data-leaderboard-region-search>
        </label>
        <div id="mhCommunityRegionResults" class="mh-community-region-results" role="listbox" hidden></div>
      </div>
      <div class="mh-community-region-current ${targetName ? "has-region" : ""}">
        <span>${escapeHtml(copy.selectedRegion)}</span>
        <strong>${escapeHtml(targetName || copy.chooseRegion)}</strong>
        ${targetName && targetCountry ? `<small>${escapeHtml(targetCountry)}${context.targetRegionType ? ` · ${escapeHtml(context.targetRegionType)}` : ""}</small>` : ""}
      </div>
    </section>
  `;
}

function controls(payload) {
  const copy = t();
  const scopes = availableLeaderboardScopes(payload.context);
  if (!scopes.includes(query.scope)) query = { ...query, scope: "global", page: 1 };
  const scopeButtons = scopes.map((scope) => `
    <button type="button" data-leaderboard-scope="${scope}" class="${query.scope === scope ? "is-active" : ""}">${escapeHtml(scopeLabel(scope, payload.context))}</button>
  `).join("");
  const periodButtons = COMMUNITY_LEADERBOARD_PERIODS.map((period) => `
    <button type="button" data-leaderboard-period="${period}" class="${query.period === period ? "is-active" : ""}">${escapeHtml(periodLabel(period))}</button>
  `).join("");
  const metricButtons = COMMUNITY_LEADERBOARD_METRICS.map((metric) => `
    <button type="button" data-leaderboard-metric="${metric}" class="${query.metric === metric ? "is-active" : ""}">${escapeHtml(metricLabel(metric))}</button>
  `).join("");

  return `
    <div class="mh-community-leaderboard-controls">
      <div><span>${escapeHtml(copy.scope)}</span><div class="mh-community-segmented">${scopeButtons}</div></div>
      <div><span>${escapeHtml(copy.period)}</span><div class="mh-community-segmented">${periodButtons}</div></div>
      <div><span>${escapeHtml(copy.metric)}</span><div class="mh-community-segmented">${metricButtons}</div></div>
    </div>
    ${regionExplorerMarkup(payload)}
  `;
}

function noticeMarkup(payload) {
  const context = payload.context;
  const copy = t();
  if (query.scope === "region" && !context.targetRegionCode) {
    return `<p class="mh-community-leaderboard-notice">${escapeHtml(copy.chooseRegion)}</p>`;
  }
  if (!context.authenticated) {
    return `<p class="mh-community-leaderboard-notice">${escapeHtml(copy.profileUnavailable)} <a href="/profile.html#community">${escapeHtml(copy.configure)}</a></p>`;
  }
  if (!context.isPublic || !context.showProgress || !context.leaderboardOptIn) {
    return `<p class="mh-community-leaderboard-notice">${escapeHtml(copy.publicNeeded)} <a href="/profile.html#community">${escapeHtml(copy.configure)}</a></p>`;
  }
  if (!context.showLocation && query.scope !== "global" && query.scope !== "region") {
    return `<p class="mh-community-leaderboard-notice">${escapeHtml(copy.locationNeeded)} <a href="/profile.html#community">${escapeHtml(copy.configure)}</a></p>`;
  }
  return "";
}

function paginationMarkup(payload) {
  if (payload.totalPages <= 1) return "";
  return `
    <nav class="mh-community-leaderboard-pagination" aria-label="Pagination">
      <button type="button" data-leaderboard-page="${query.page - 1}" ${query.page <= 1 ? "disabled" : ""}>← ${escapeHtml(t().previous)}</button>
      <span>${escapeHtml(t().page)} ${formatNumber(query.page)} ${escapeHtml(t().of)} ${formatNumber(payload.totalPages)}</span>
      <button type="button" data-leaderboard-page="${query.page + 1}" ${query.page >= payload.totalPages ? "disabled" : ""}>${escapeHtml(t().next)} →</button>
    </nav>
  `;
}

function renderPayload(payload) {
  if (!host) return;
  lastPayload = payload;
  const copy = t();
  const pageHasOwn = payload.rows.some((row) => row.isCurrentUser);
  const own = payload.ownRow && !pageHasOwn
    ? `<section class="mh-community-own-rank"><div><span>${escapeHtml(copy.ownRank)}</span><small>${escapeHtml(copy.outsidePage)}</small></div><table><tbody>${renderRow(payload.ownRow, { own: true })}</tbody></table></section>`
    : "";
  const emptyText = query.scope === "region" && !payload.context.targetRegionCode
    ? copy.chooseRegionEmpty
    : copy.empty;

  host.innerHTML = `
    <section class="mh-community-leaderboard-shell">
      <header class="mh-community-leaderboard-head">
        <div><h2>${escapeHtml(copy.title)}</h2><p>${escapeHtml(copy.subtitle)}</p></div>
        <span class="mh-community-leaderboard-count">${formatNumber(payload.totalCount)}</span>
      </header>
      ${controls(payload)}
      ${noticeMarkup(payload)}
      <div class="mh-community-leaderboard-table-wrap">
        <table class="mh-community-leaderboard-table">
          <thead><tr>
            <th>${escapeHtml(copy.position)}</th>
            <th>${escapeHtml(copy.profile)}</th>
            <th>${escapeHtml(copy.level)}</th>
            <th>${escapeHtml(metricLabel(query.metric))}</th>
            <th>${escapeHtml(copy.xp)}</th>
            <th>${escapeHtml(copy.problems)}</th>
            <th>${escapeHtml(copy.lessons)}</th>
            <th>${escapeHtml(copy.exams)}</th>
          </tr></thead>
          <tbody>${payload.rows.length ? payload.rows.map((row) => renderRow(row)).join("") : `<tr><td colspan="8"><div class="mh-community-leaderboard-empty">${escapeHtml(emptyText)}</div></td></tr>`}</tbody>
        </table>
      </div>
      ${own}
      ${paginationMarkup(payload)}
    </section>
  `;
  bindControls();
}

function renderState(kind) {
  if (!host) return;
  const copy = t();
  if (kind === "loading") {
    host.innerHTML = `<div class="mh-ui-state is-loading"><div class="mh-ui-spinner" aria-hidden="true"></div><p>${escapeHtml(copy.loading)}</p></div>`;
    return;
  }
  host.innerHTML = `<div class="mh-ui-state is-error"><p>${escapeHtml(copy.error)}</p><button class="btn small primary" type="button" data-leaderboard-retry>${escapeHtml(copy.retry)}</button></div>`;
  host.querySelector("[data-leaderboard-retry]")?.addEventListener("click", () => void refresh(), { once: true });
}

function revealActiveSegments() {
  host?.querySelectorAll(".mh-community-segmented .is-active").forEach((button) => {
    button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  });
}

function setRegionResultsState(list, input, markup, expanded = true) {
  if (!list || !input) return;
  list.innerHTML = markup;
  list.hidden = !expanded;
  input.setAttribute("aria-expanded", String(expanded));
}

function regionResultsMarkup(regions) {
  const copy = t();
  if (!regions.length) return `<p class="mh-community-region-results-state">${escapeHtml(copy.noRegionResults)}</p>`;
  return regions.map((region) => {
    const country = countryLabel(region.countryCode);
    return `
      <button type="button" role="option" data-leaderboard-region-code="${escapeHtml(region.code)}">
        <span><strong>${escapeHtml(region.name)}</strong><small>${escapeHtml(country)}${region.type ? ` · ${escapeHtml(region.type)}` : ""}</small></span>
        <em>${formatNumber(region.publicMembers)} ${escapeHtml(copy.publicMembers)}</em>
      </button>
    `;
  }).join("");
}

async function runRegionSearch(input, list) {
  const serial = ++regionSearchSerial;
  setRegionResultsState(list, input, `<p class="mh-community-region-results-state">${escapeHtml(t().searchingRegions)}</p>`);
  try {
    const regions = await searchLeaderboardRegions(supabase, input.value, 14);
    if (serial !== regionSearchSerial || !input.isConnected) return;
    setRegionResultsState(list, input, regionResultsMarkup(regions));
    list.querySelectorAll("[data-leaderboard-region-code]").forEach((button, index) => {
      button.addEventListener("click", () => {
        query = normalizeLeaderboardQuery({
          ...query,
          scope: "region",
          regionCode: button.dataset.leaderboardRegionCode,
          page: 1
        });
        saveQuery();
        void refresh();
      });
      if (index === 0) button.dataset.firstRegionResult = "true";
    });
  } catch (error) {
    console.error("Region search failed:", error);
    if (serial === regionSearchSerial && input.isConnected) {
      setRegionResultsState(list, input, `<p class="mh-community-region-results-state">${escapeHtml(t().error)}</p>`);
    }
  }
}

function bindRegionExplorer() {
  const input = host.querySelector("[data-leaderboard-region-search]");
  const list = host.querySelector("#mhCommunityRegionResults");
  if (!input || !list) return;

  const queueSearch = (delay = 220) => {
    window.clearTimeout(regionSearchTimer);
    regionSearchTimer = window.setTimeout(() => void runRegionSearch(input, list), delay);
  };

  input.addEventListener("focus", () => queueSearch(0));
  input.addEventListener("input", () => queueSearch());
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.blur();
      return;
    }
    if (event.key === "ArrowDown") {
      const first = list.querySelector("[data-first-region-result]");
      if (first) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  input.addEventListener("blur", () => {
    window.setTimeout(() => {
      if (!list.contains(document.activeElement)) {
        list.hidden = true;
        input.setAttribute("aria-expanded", "false");
      }
    }, 100);
  });
  list.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (!list.contains(document.activeElement) && document.activeElement !== input) {
        list.hidden = true;
        input.setAttribute("aria-expanded", "false");
      }
    }, 100);
  });

  host.querySelector("[data-leaderboard-own-region]")?.addEventListener("click", (event) => {
    query = normalizeLeaderboardQuery({
      ...query,
      scope: "region",
      regionCode: event.currentTarget.dataset.leaderboardOwnRegion,
      page: 1
    });
    saveQuery();
    void refresh();
  });
}

function bindControls() {
  host.querySelectorAll("[data-avatar-fallback] img").forEach((image) => {
    image.addEventListener("error", () => {
      const wrapper = image.closest("[data-avatar-fallback]");
      if (!wrapper) return;
      wrapper.replaceChildren(document.createTextNode(wrapper.dataset.avatarFallback || "M"));
    }, { once: true });
  });
  host.querySelectorAll("[data-leaderboard-scope]").forEach((button) => button.addEventListener("click", () => {
    query = normalizeLeaderboardQuery({ ...query, scope: button.dataset.leaderboardScope, page: 1 });
    saveQuery();
    void refresh();
  }));
  host.querySelectorAll("[data-leaderboard-period]").forEach((button) => button.addEventListener("click", () => {
    query = normalizeLeaderboardQuery({ ...query, period: button.dataset.leaderboardPeriod, page: 1 });
    saveQuery();
    void refresh();
  }));
  host.querySelectorAll("[data-leaderboard-metric]").forEach((button) => button.addEventListener("click", () => {
    query = normalizeLeaderboardQuery({ ...query, metric: button.dataset.leaderboardMetric, page: 1 });
    saveQuery();
    void refresh();
  }));
  host.querySelectorAll("[data-leaderboard-page]").forEach((button) => button.addEventListener("click", () => {
    query = normalizeLeaderboardQuery({ ...query, page: button.dataset.leaderboardPage });
    saveQuery();
    void refresh();
  }));
  bindRegionExplorer();
  requestAnimationFrame(revealActiveSegments);
}

async function refresh() {
  if (!host || !active) return;
  if (loading) {
    reloadAfterCurrent = true;
    return;
  }
  loading = true;
  renderState("loading");
  try {
    let payload = await loadCommunityLeaderboard(supabase, query);
    const scopes = availableLeaderboardScopes(payload.context);
    if (!scopes.includes(query.scope)) {
      query = normalizeLeaderboardQuery({ ...query, scope: "global", page: 1 });
      payload = await loadCommunityLeaderboard(supabase, query);
    } else if (query.page > payload.totalPages) {
      query = normalizeLeaderboardQuery({ ...query, page: payload.totalPages });
      payload = await loadCommunityLeaderboard(supabase, query);
    }
    if (query.scope === "region" && payload.context.targetRegionCode && query.regionCode !== payload.context.targetRegionCode) {
      query = normalizeLeaderboardQuery({ ...query, regionCode: payload.context.targetRegionCode });
    }
    renderPayload(payload);
    saveQuery();
  } catch (error) {
    console.error("Community leaderboard load failed:", error);
    renderState("error");
  } finally {
    loading = false;
    if (reloadAfterCurrent && active) {
      reloadAfterCurrent = false;
      queueMicrotask(() => void refresh());
    }
  }
}

function rerenderLanguage() {
  if (active && lastPayload) renderPayload(lastPayload);
}

function initLeaderboardWorkspace() {
  host = document.getElementById("mhShellPanelLeaderboards");
  if (!host) return;

  window.addEventListener("mh:leaderboards-route", (event) => {
    active = Boolean(event.detail?.active);
    if (active) void refresh();
  });
  window.addEventListener("mh:community-profile-saved", () => {
    if (active) void refresh();
  });
  supabase.auth.onAuthStateChange(() => {
    lastPayload = null;
    if (active) void refresh();
  });
  document.addEventListener("visibilitychange", () => {
    if (active && document.visibilityState === "visible") void refresh();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === "mh_lang" && active) rerenderLanguage();
  });
  new MutationObserver(rerenderLanguage).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"]
  });

  if (location.hash.replace(/^#/, "") === "leaderboards") {
    active = true;
    void refresh();
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLeaderboardWorkspace, { once: true });
  } else {
    initLeaderboardWorkspace();
  }
}
