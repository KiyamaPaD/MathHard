export const COMMUNITY_LEADERBOARD_SCOPES = Object.freeze([
  "region", "country", "eu", "continent", "global"
]);

export const COMMUNITY_LEADERBOARD_PERIODS = Object.freeze([
  "week", "month", "all"
]);

export const COMMUNITY_LEADERBOARD_METRICS = Object.freeze([
  "xp", "problems", "lessons", "exams"
]);

const asText = (value, max = 200) => String(value ?? "").trim().slice(0, max);
const asCount = (value, minimum = 0) => Math.max(minimum, Number(value) || 0);
const normalizeRegionCode = (value) => {
  const code = asText(value, 16).toUpperCase();
  return /^[A-Z0-9]{2,3}-[A-Z0-9]{1,8}$/.test(code) ? code : "";
};

export function normalizeLeaderboardQuery(query = {}) {
  const scope = COMMUNITY_LEADERBOARD_SCOPES.includes(query.scope) ? query.scope : "global";
  const period = COMMUNITY_LEADERBOARD_PERIODS.includes(query.period) ? query.period : "week";
  const metric = COMMUNITY_LEADERBOARD_METRICS.includes(query.metric) ? query.metric : "xp";
  const page = Math.max(1, Math.trunc(Number(query.page) || 1));
  const pageSize = Math.min(50, Math.max(10, Math.trunc(Number(query.pageSize ?? query.page_size) || 25)));
  const regionCode = normalizeRegionCode(query.regionCode ?? query.region_code);
  return { scope, period, metric, page, pageSize, regionCode };
}

export function normalizeLeaderboardContext(context = {}) {
  return {
    authenticated: Boolean(context.authenticated),
    profileReady: Boolean(context.profile_ready ?? context.profileReady),
    isPublic: Boolean(context.is_public ?? context.isPublic),
    leaderboardOptIn: Boolean(context.leaderboard_opt_in ?? context.leaderboardOptIn),
    showProgress: Boolean(context.show_progress ?? context.showProgress),
    showLocation: Boolean(context.show_location ?? context.showLocation),
    username: asText(context.username, 24),
    countryCode: asText(context.country_code ?? context.countryCode, 2).toUpperCase(),
    regionCode: normalizeRegionCode(context.region_code ?? context.regionCode),
    regionName: asText(context.region_name ?? context.regionName, 140),
    regionType: asText(context.region_type ?? context.regionType, 60),
    continentCode: asText(context.continent_code ?? context.continentCode, 2).toUpperCase(),
    euMember: Boolean(context.eu_member ?? context.euMember),
    targetRegionCode: normalizeRegionCode(context.target_region_code ?? context.targetRegionCode),
    targetRegionName: asText(context.target_region_name ?? context.targetRegionName, 140),
    targetRegionType: asText(context.target_region_type ?? context.targetRegionType, 60),
    targetCountryCode: asText(context.target_country_code ?? context.targetCountryCode, 2).toUpperCase()
  };
}

export function normalizeLeaderboardBadge(badge = {}) {
  if (!badge || typeof badge !== "object") return null;
  const id = asText(badge.id, 80);
  if (!id) return null;
  return {
    id,
    icon: asText(badge.icon || "◆", 16),
    titleRo: asText(badge.title_ro ?? badge.titleRo ?? badge.title, 120),
    titleEn: asText(badge.title_en ?? badge.titleEn ?? badge.title, 120),
    rarity: asText(badge.rarity || "common", 24),
    color: asText(badge.color || "sky", 24)
  };
}

export function normalizeLeaderboardRow(row = {}) {
  return {
    rank: Math.max(1, Math.trunc(Number(row.rank) || 1)),
    username: asText(row.username, 24),
    displayName: asText(row.display_name ?? row.displayName ?? row.username, 60),
    avatarUrl: asText(row.avatar_url ?? row.avatarUrl, 500),
    level: Math.max(1, Math.trunc(Number(row.level) || 1)),
    value: asCount(row.value),
    totalXp: asCount(row.total_xp ?? row.totalXp),
    problemsSolved: asCount(row.problems_solved ?? row.problemsSolved),
    lessonsLearned: asCount(row.lessons_learned ?? row.lessonsLearned),
    examsPassed: asCount(row.exams_passed ?? row.examsPassed),
    countryCode: asText(row.country_code ?? row.countryCode, 2).toUpperCase(),
    regionName: asText(row.region_name ?? row.regionName, 140),
    isCurrentUser: Boolean(row.is_current_user ?? row.isCurrentUser),
    badge: normalizeLeaderboardBadge(row.badge)
  };
}

export function normalizeLeaderboardRegion(region = {}) {
  return {
    code: normalizeRegionCode(region.code),
    countryCode: asText(region.country_code ?? region.countryCode, 2).toUpperCase(),
    name: asText(region.name, 140),
    type: asText(region.type ?? region.region_type ?? region.regionType, 60),
    publicMembers: asCount(region.public_members ?? region.publicMembers)
  };
}

export function normalizeLeaderboardRegionResults(payload = []) {
  return (Array.isArray(payload) ? payload : [])
    .map(normalizeLeaderboardRegion)
    .filter((region) => region.code && region.name);
}

export function normalizeCommunityLeaderboard(payload = {}, fallbackQuery = {}) {
  const query = normalizeLeaderboardQuery({
    ...fallbackQuery,
    scope: payload.scope ?? fallbackQuery.scope,
    period: payload.period ?? fallbackQuery.period,
    metric: payload.metric ?? fallbackQuery.metric,
    page: payload.page ?? fallbackQuery.page,
    pageSize: payload.page_size ?? fallbackQuery.pageSize,
    regionCode: payload.context?.target_region_code ?? fallbackQuery.regionCode
  });

  const rows = Array.isArray(payload.rows)
    ? payload.rows.map(normalizeLeaderboardRow).filter((row) => row.username)
    : [];
  const own = payload.own_row ? normalizeLeaderboardRow(payload.own_row) : null;
  const totalCount = Math.max(0, Math.trunc(Number(payload.total_count) || 0));

  return {
    generatedAt: payload.generated_at || "",
    query,
    context: normalizeLeaderboardContext(payload.context || {}),
    rows,
    ownRow: own?.username ? own : null,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / query.pageSize))
  };
}

export function availableLeaderboardScopes(context = {}) {
  const normalized = normalizeLeaderboardContext(context);
  const scopes = ["region"];
  if (normalized.showLocation && normalized.countryCode) scopes.push("country");
  if (normalized.showLocation && normalized.euMember) scopes.push("eu");
  if (normalized.showLocation && normalized.continentCode) scopes.push("continent");
  scopes.push("global");
  return scopes;
}

export function leaderboardProfileUrl(username, origin = "") {
  const base = String(origin || "").replace(/\/$/, "");
  return `${base}/u.html?u=${encodeURIComponent(asText(username, 24))}`;
}
