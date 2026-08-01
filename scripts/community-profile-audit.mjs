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

const profileHtml = read("profile.html");
const publicHtml = read("u.html");
const indexHtml = read("index.html");
const model = read("js/community-profile-model.js");
const repository = read("js/community-profile-repository.js");
const settings = read("js/community-profile-settings-controller.js");
const profileText = read("js/profile-text.js");
const publicPage = read("js/community-profile-page.js");
const adminModel = read("js/community-admin-model.js");
const adminController = read("js/community-admin-controller.js");
const app = read("js/app.js");
const profileCss = read("css/community-profile.css");
const adminCss = read("css/community-admin.css");
const migration = read("local-sql/054_product_phase_04a_global_profiles_badges.sql");
const smoke = read("local-sql/054_phase4a_transactional_smoke_test.sql");

requireTokens(profileHtml, "Profile editor", [
  'data-profile-tab="community"',
  'id="communityProfileForm"',
  'name="username"',
  'name="country_code"',
  'name="region_code"',
  'name="favorite_topics"',
  'name="featured_badge_id"',
  'name="is_public"',
  'name="leaderboard_opt_in"',
  'name="show_personality"',
  'name="show_activity"'
]);
requireTokens(publicHtml, "Public profile page", [
  'id="communityPublicContent"',
  'id="communityPublicBadges"',
  'id="communityPublicAchievements"',
  'id="communityPublicActivity"',
  '/js/community-profile-page.js'
]);
requireTokens(indexHtml, "Admin community workspace", [
  'data-admin-panel-target="community"',
  'id="mhCommunityAdminStudio"',
  'css/community-admin.css'
]);
requireTokens(model, "Community profile model", [
  "COMMUNITY_PROFILE_LIMITS",
  "normalizeProfileUrl",
  "COMMUNITY_PRIVACY_KEYS",
  "normalizeUsername",
  "validateUsername",
  "validateCommunityProfileDraft",
  "show_personality",
  "lastActiveAt"
]);
requireTokens(repository, "Community profile repository", [
  "mh_get_my_community_profile",
  "mh_update_my_community_profile",
  "mh_check_community_username",
  "mh_get_public_community_profile",
  "mh_get_community_countries",
  "mh_get_community_regions",
  "mh_admin_get_community_badge_studio",
  "mh_admin_upsert_community_badge",
  "mh_admin_assign_community_badge",
  "mh_admin_revoke_community_badge"
]);
if (repository.includes(".from(")) errors.push("Community profile repository uses a direct table query instead of RPCs.");
requireTokens(profileText, "Community profile translations", [
  'community_kicker: "Comunitate"',
  'community_kicker: "Community"',
  'community_privacy_personality',
  'community_privacy_activity'
]);
requireTokens(settings, "Community profile settings", [
  "loadOwnCommunityProfile",
  "Array.from(form.elements)",
  "normalizeLinkInputs",
  "communityPreviewLinks",
  "saveOwnCommunityProfile",
  "checkCommunityUsername",
  "COMMUNITY_PRIVACY_KEYS",
  "mh:community-profile-saved"
]);
requireTokens(publicPage, "Public profile renderer", [
  "profile.privacy.show_location",
  "profile.privacy.show_personality",
  "profile.privacy.show_progress",
  "profile.privacy.show_badges",
  "profile.privacy.show_achievements",
  "profile.privacy.show_links",
  "profile.privacy.show_activity"
]);
if (/\b(?:email|provider|user_id|uuid)\b/i.test(publicPage)) errors.push("Public profile renderer references an internal account field.");
if (/Phase 4A|server-side|backend/i.test(settings)) errors.push("Community profile settings expose implementation copy to learners.");
if (settings.includes("new FormData(form)")) errors.push("Community preview still drops disabled values through FormData.");
if ((settings.match(/setBusy\(true\);/g) || []).length > 2) errors.push("Community profile settings contain duplicate busy-state calls.");
requireTokens(adminModel, "Badge admin model", [
  "validateCommunityBadgeDraft",
  '"manual"',
  '"automatic"',
  '"subscription"',
  '"system"'
]);
requireTokens(adminController, "Badge Admin Studio", [
  "mhCommunityBadgeForm",
  "mhCommunityAssignmentForm",
  'assignmentMode === "manual"',
  "assignCommunityBadge",
  "revokeCommunityBadge"
]);
requireTokens(app, "Admin integration", [
  'import("./community-admin-controller.js")',
  "createCommunityAdminController",
  'panelName === "community"',
  "communityAdminController?.setAdmin"
]);
requireTokens(profileCss, "Community profile styling", [
  ".community-settings-layout",
  ".community-public-page",
  "@media"
]);
requireTokens(adminCss, "Community Admin styling", [
  ".mh-community-admin-layout",
  ".mh-community-badge-form",
  "@media"
]);

requireTokens(migration, "Phase 4A SQL", [
  "create table if not exists public.mh_geo_countries",
  "create table if not exists public.mh_geo_regions",
  "create table if not exists public.mh_community_badges",
  "create table if not exists public.mh_community_profiles",
  "create table if not exists public.mh_user_community_badges",
  "mh_community_profiles_username_lower_idx",
  "show_personality boolean",
  "mh_get_public_community_profile",
  "mh_admin_assign_community_badge",
  "Only manual badges can be assigned here",
  "if not public.is_admin()",
  "revoke all on table public.mh_community_profiles",
  "v_stats := v_stats - 'current_streak' - 'longest_streak'",
  "case when v_profile.show_personality",
  "case when v_profile.show_activity",
  "if tg_op = 'DELETE' then",
  "mh_user_roles_remove_community_admin_badge",
  "case when p_public_only then '{}'::jsonb else jsonb_build_object("
]);
if (!balancedDollarQuotes(migration)) errors.push("Phase 4A SQL has unbalanced $$ blocks.");
if ((migration.match(/\('RO','/g) || []).length < 1) errors.push("Romania is missing from the country catalogue.");
if ((migration.match(/'RO-BN'/g) || []).length < 1) errors.push("Bistrița-Năsăud is missing from the region catalogue.");
if ((migration.match(/eu_member/g) || []).length < 5) errors.push("EU membership metadata is incomplete.");
if (!migration.includes("where assignment.user_id = p_user_id") || !migration.includes("and (not p_public_only or assignment.is_public)")) {
  errors.push("Public badge RPC does not filter assignments by owner and visibility.");
}

requireTokens(smoke, "Phase 4A smoke test", [
  "begin;",
  "mh_get_my_community_profile",
  "mh_update_my_community_profile",
  "mh_get_public_community_profile",
  "mh_admin_upsert_community_badge",
  "mh_admin_assign_community_badge",
  "mh_admin_revoke_community_badge",
  "Phase 04A smoke test passed",
  "rollback;"
]);
if (!balancedDollarQuotes(smoke)) errors.push("Phase 4A smoke test has unbalanced $$ blocks.");

const modelModule = await import(pathToFileURL(resolve(root, "js/community-profile-model.js")).href);
assert.equal(modelModule.validateUsername("cristi.math").valid, true);
assert.equal(modelModule.validateUsername("admin").valid, false);
assert.equal(modelModule.COMMUNITY_PRIVACY_KEYS.includes("show_personality"), true);
assert.equal(modelModule.publicProfileUrl("Cristi.Math", "https://mathhard.app"), "https://mathhard.app/u.html?u=cristi.math");
assert.equal(modelModule.normalizeProfileUrl("ftcprogrammingatlas.com"), "https://ftcprogrammingatlas.com/");
assert.equal(modelModule.normalizeProfileUrl("https://github.com/KiyamaPaD"), "https://github.com/KiyamaPaD");
assert.equal(modelModule.normalizeProfileUrl("javascript:alert(1)"), "");

console.log("MathHard Phase 4A Global Profiles & Badges audit");
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("- rich opt-in public profiles: present");
  console.log("- country and region foundation: present");
  console.log("- section-level privacy enforced in UI and SQL: present");
  console.log("- manual, automatic, subscription and system badge modes: present");
  console.log("- Admin badge definitions and controlled assignment: present");
  console.log("- public RPC avoids direct profile-table access: confirmed");
  console.log("MathHard Phase 4A Global Profiles & Badges audit passed.");
}
