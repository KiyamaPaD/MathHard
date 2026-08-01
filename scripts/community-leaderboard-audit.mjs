import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function read(relativePath) {
  const absolute = resolve(root, relativePath);
  if (!existsSync(absolute)) {
    errors.push(`Missing file: ${relativePath}`);
    return "";
  }
  return readFileSync(absolute, "utf8");
}

function requireTokens(source, label, tokens) {
  for (const token of tokens) {
    if (!source.includes(token)) errors.push(`${label} is missing: ${token}`);
  }
}

function balancedDollarQuotes(source) {
  return (source.match(/\$\$/g) || []).length % 2 === 0;
}

const indexHtml = read("index.html");
const profileHtml = read("profile.html");
const publicHtml = read("u.html");
const shell = read("js/app-shell-controller.js");
const bootstrap = read("js/performance-bootstrap.js");
const model = read("js/community-leaderboard-model.js");
const repository = read("js/community-leaderboard-repository.js");
const controller = read("js/community-leaderboard-controller.js");
const profileModel = read("js/community-profile-model.js");
const profileSettings = read("js/community-profile-settings-controller.js");
const rewards = read("js/gamification-controller.js");
const css = read("css/community-leaderboard.css");
const migration = read("local-sql/055_product_phase_04b_geographic_leaderboards.sql");
const smoke = read("local-sql/055_phase4b_transactional_smoke_test.sql");

requireTokens(indexHtml, "App stylesheet", ["css/community-leaderboard.css"]);
requireTokens(profileHtml, "Profile integration", [
  'id="profileLeaderboardsBtn"',
  'id="communityPreviewLinks"'
]);
requireTokens(publicHtml, "Public profile integration", [
  'id="communityLeaderboardLink"',
  '/index.html#leaderboards'
]);
requireTokens(shell, "App shell route", [
  '"leaderboards"',
  'id="mhShellPanelLeaderboards"',
  'mh:leaderboards-route'
]);
requireTokens(bootstrap, "Lazy route loader", [
  'leaderboards: "./community-leaderboard-controller.js"',
  'mh:leaderboards-route'
]);
requireTokens(model, "Leaderboard model", [
  "COMMUNITY_LEADERBOARD_SCOPES",
  "COMMUNITY_LEADERBOARD_PERIODS",
  "COMMUNITY_LEADERBOARD_METRICS",
  "availableLeaderboardScopes",
  "normalizeCommunityLeaderboard"
]);
requireTokens(repository, "Leaderboard repository", [
  "mh_get_community_leaderboard",
  "p_scope",
  "p_period",
  "p_metric",
  "p_page_size"
]);
if (repository.includes(".from(")) errors.push("Leaderboard repository uses direct table reads instead of the public-safe RPC.");
requireTokens(controller, "Leaderboard controller", [
  "data-leaderboard-scope",
  "data-leaderboard-period",
  "data-leaderboard-metric",
  "mh-community-own-rank",
  "mh:community-profile-saved",
  "data-avatar-fallback"
]);
if (/\sonerror\s*=/.test(controller)) errors.push("Leaderboard controller contains an inline error handler, which conflicts with CSP hardening.");
requireTokens(profileModel, "Profile URL model", [
  "normalizeProfileUrl",
  "Public progress is required to join leaderboards",
  "Progresul public este necesar pentru a participa în clasamente"
]);
requireTokens(profileSettings, "Profile preview fix", [
  "Array.from(form.elements)",
  "normalizeLinkInputs",
  "communityPreviewLinks",
  "form.elements.show_progress.checked = true"
]);
if (profileSettings.includes("new FormData(form)")) errors.push("Profile preview still relies on FormData, which drops disabled fields during save.");
if ((profileSettings.match(/setBusy\(true\);/g) || []).length > 2) errors.push("Profile settings contain duplicate busy-state calls.");
if (rewards.includes("renderLeaderboard(") || rewards.includes("gamificationLeaderboardOptIn")) {
  errors.push("The obsolete Rewards mini leaderboard is still rendered.");
}
requireTokens(css, "Leaderboard responsive CSS", [
  ".mh-community-leaderboard-table",
  ".mh-community-own-rank",
  "@media(max-width:680px)",
  "overflow:visible"
]);

requireTokens(migration, "Phase 4B SQL", [
  "mh_community_url_normalize",
  "mh_community_profiles_leaderboard_progress_check",
  "mh_get_community_leaderboard",
  "cp.is_public and cp.leaderboard_opt_in and cp.show_progress",
  "case when cp.show_location then cp.country_code end as country_code",
  "when 'region'",
  "when 'country'",
  "when 'eu'",
  "when 'continent'",
  "to_jsonb(row) - 'user_id'",
  "user_weekly_challenge_claims",
  "grant execute on function public.mh_get_community_leaderboard"
]);
if (!balancedDollarQuotes(migration)) errors.push("Phase 4B SQL has unbalanced $$ blocks.");
if (/'user_id'\s*,/.test(migration)) errors.push("Leaderboard SQL appears to expose user_id in a JSON payload.");
requireTokens(smoke, "Phase 4B smoke test", [
  "begin;",
  "ftcprogrammingatlas.com",
  "javascript:alert(1)",
  "mh_get_community_leaderboard",
  "Internal user ID leaked",
  "Phase 04B smoke test passed",
  "rollback;"
]);
if (!balancedDollarQuotes(smoke)) errors.push("Phase 4B smoke test has unbalanced $$ blocks.");

const leaderboardModel = await import(pathToFileURL(resolve(root, "js/community-leaderboard-model.js")).href);
assert.deepEqual(
  leaderboardModel.availableLeaderboardScopes({
    show_location: true,
    region_code: "RO-BN",
    country_code: "RO",
    continent_code: "EU",
    eu_member: true
  }),
  ["region", "country", "eu", "continent", "global"]
);
assert.deepEqual(
  leaderboardModel.normalizeLeaderboardQuery({ scope: "invalid", period: "invalid", metric: "invalid", page: -3, pageSize: 200 }),
  { scope: "global", period: "week", metric: "xp", page: 1, pageSize: 50 }
);

const profileModelModule = await import(pathToFileURL(resolve(root, "js/community-profile-model.js")).href);
assert.equal(profileModelModule.normalizeProfileUrl("ftcprogrammingatlas.com"), "https://ftcprogrammingatlas.com/");
assert.equal(profileModelModule.normalizeProfileUrl("javascript:alert(1)"), "");

console.log("MathHard Phase 4B Geographic Leaderboards audit");
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exitCode = 1;
} else {
  console.log("- saved profile preview and URL normalization: present");
  console.log("- geographic, EU, continent and global scopes: present");
  console.log("- weekly, monthly and all-time ranking metrics: present");
  console.log("- public opt-in and location privacy: enforced");
  console.log("- obsolete Rewards mini leaderboard: removed");
  console.log("MathHard Phase 4B Geographic Leaderboards audit passed.");
}
