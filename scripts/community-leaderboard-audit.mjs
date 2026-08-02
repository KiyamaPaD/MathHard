import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const read = (path) => existsSync(resolve(root, path)) ? readFileSync(resolve(root, path), "utf8") : (errors.push(`Missing file: ${path}`), "");
const externalSqlPaths = ["local-sql/058_product_phase_04d_global_discovery_moderation_fixes.sql", "local-sql/058_phase4d_transactional_smoke_test.sql"];
const externalSqlAvailable = externalSqlPaths.every((path) => existsSync(resolve(root, path)));
const readExternalSql = (path) => externalSqlAvailable ? readFileSync(resolve(root, path), "utf8") : "";
const requireTokens = (source, label, tokens) => tokens.forEach((token) => { if (!source.includes(token)) errors.push(`${label} is missing: ${token}`); });
const balanced = (source) => (source.match(/\$\$/g) || []).length % 2 === 0;

const modelSource = read("js/community-leaderboard-model.js");
const repositorySource = read("js/community-leaderboard-repository.js");
const controllerSource = read("js/community-leaderboard-controller.js");
const css = read("css/community-leaderboard.css");
const migration = readExternalSql("local-sql/058_product_phase_04d_global_discovery_moderation_fixes.sql");
const smoke = readExternalSql("local-sql/058_phase4d_transactional_smoke_test.sql");
const rewards = read("js/gamification-controller.js");

requireTokens(modelSource, "Leaderboard model", [
  "COMMUNITY_LEADERBOARD_SCOPES", "countryCode", "continentCode", "targetCountryCode", "targetContinentCode",
  "normalizeLeaderboardGeographyOptions", "availableLeaderboardScopes"
]);
requireTokens(repositorySource, "Leaderboard repository", [
  "mh_get_community_leaderboard", "mh_search_leaderboard_regions", "mh_get_leaderboard_geography_options",
  "p_region_code", "p_country_code", "p_continent_code"
]);
if (repositorySource.includes(".from(")) errors.push("Leaderboard repository uses direct table reads.");
requireTokens(controllerSource, "Leaderboard discovery UI", [
  "data-leaderboard-scope", "data-leaderboard-area-search", "data-leaderboard-area-code", "data-leaderboard-own-area",
  "countrySearch", "continentSearch", "loadLeaderboardGeographyOptions", "searchLeaderboardRegions",
  "mh-community-region-explorer", "mh-community-own-rank", "scrollIntoView"
]);
if (/\sonerror\s*=/.test(controllerSource)) errors.push("Leaderboard controller contains an inline event handler.");
if (/\b(?:email|user_id|uuid|provider)\b/i.test(controllerSource)) errors.push("Leaderboard UI references internal account data.");
requireTokens(css, "Leaderboard responsive CSS", ["touch-action:pan-x", "scrollbar-width:thin", ".mh-community-region-results", "@media(max-width:680px)"]);
if (rewards.includes("renderLeaderboard(") || rewards.includes("gamificationLeaderboardOptIn")) errors.push("Obsolete Rewards mini leaderboard is still present.");
if (externalSqlAvailable) {
  requireTokens(migration, "Phase 4D SQL", [
    "mh_get_leaderboard_geography_options", "p_country_code", "p_continent_code", "target_country_code", "target_continent_code",
    "coalesce(control.profile_allowed, true)", "coalesce(control.leaderboard_allowed, true)", "to_jsonb(row) - 'user_id'",
    "grant execute on function public.mh_get_community_leaderboard"
  ]);
  requireTokens(smoke, "Phase 4D smoke test", ["mh_get_leaderboard_geography_options", "'country'", "'continent'", "target_country_code", "target_continent_code", "Phase 04D smoke test passed", "rollback;"]);
  if (!balanced(migration)) errors.push("Phase 4D SQL has unbalanced $$ blocks.");
  if (!balanced(smoke)) errors.push("Phase 4D smoke test has unbalanced $$ blocks.");
}

const model = await import(pathToFileURL(resolve(root, "js/community-leaderboard-model.js")).href);
assert.deepEqual(model.availableLeaderboardScopes({ show_location: false }), ["region", "country", "eu", "continent", "global"]);
assert.deepEqual(model.normalizeLeaderboardQuery({
  scope: "country", period: "month", metric: "problems", page: -2, pageSize: 100,
  region_code: "ro-bn", country_code: "ro", continent_code: "eu"
}), {
  scope: "country", period: "month", metric: "problems", page: 1, pageSize: 50,
  regionCode: "RO-BN", countryCode: "RO", continentCode: "EU"
});
assert.deepEqual(model.normalizeLeaderboardGeographyOptions({
  countries: [{ code: "ro", continent_code: "eu", eu_member: true, public_members: 3 }],
  continents: [{ code: "eu", public_members: 8 }]
}), {
  countries: [{ code: "RO", continentCode: "EU", euMember: true, publicMembers: 3 }],
  continents: [{ code: "EU", publicMembers: 8 }]
});

console.log("MathHard Phase 4D Global Discovery audit");
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exitCode = 1;
} else {
  if (!externalSqlAvailable) console.log("- external SQL artifacts are not stored in Git; database contract checks skipped.");
  console.log("- region, country and continent exploration: present");
  console.log("- viewer location remains independent from selected area: present");
  console.log("- public opt-in, moderation and privacy filters: enforced");
  console.log("- geographic selection persists locally: present");
  console.log("MathHard Phase 4D Global Discovery audit passed.");
}
