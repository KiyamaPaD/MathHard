import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const externalSqlPaths = [
  "local-sql/060_product_phase_04f_badge_profile_personalization.sql",
  "local-sql/060_phase4f_transactional_smoke_test.sql"
];
const externalSqlAvailable = externalSqlPaths.every((file) => fs.existsSync(path.join(root, file)));
const readExternalSql = (file) => externalSqlAvailable ? read(file) : "";
const checks = [];
const expect = (condition, message) => checks.push({ condition: Boolean(condition), message });

const sql = readExternalSql("local-sql/060_product_phase_04f_badge_profile_personalization.sql");
const smoke = readExternalSql("local-sql/060_phase4f_transactional_smoke_test.sql");
const profileHtml = read("profile.html");
const publicHtml = read("u.html");
const model = read("js/community-profile-model.js");
const settings = read("js/community-profile-settings-controller.js");
const publicPage = read("js/community-profile-page.js");
const repository = read("js/community-profile-repository.js");
const admin = read("js/community-admin-controller.js");
const css = read("css/community-profile.css");
const profileText = read("js/profile-text.js");

if (externalSqlAvailable) {
  expect(sql.includes("mh_community_badge_events"), "badge event history table");
  expect(sql.includes("mh_refresh_automatic_community_badges"), "automatic badge evaluator");
  expect(sql.includes("delete from public.mh_user_community_badges") && sql.includes("metadata->>'source'='automatic'"), "automatic activity badges can be withdrawn when criteria expire");
  expect(sql.includes("mh_get_my_community_profile_v2"), "owner profile v2 RPC");
  expect(sql.includes("mh_update_my_community_profile_v2"), "profile save v2 RPC");
  expect(sql.includes("mh_get_public_community_profile_v2"), "public profile v2 RPC");
  expect(sql.includes("mh_admin_get_community_badge_studio_v2"), "badge studio v2 RPC");
  expect(sql.includes("notify pgrst, 'reload schema'"), "PostgREST schema reload");
  expect(sql.includes("revoke all on table public.mh_community_badge_events"), "badge history table is RPC-only");
  expect(smoke.includes("Phase 04F smoke test passed") && smoke.trim().endsWith("rollback;"), "transactional smoke test rolls back");
}

for (const field of ["headline", "pronouns", "dream_school", "favorite_problem_type", "learning_style", "collaboration_status", "weekly_goal", "profile_frame", "badge_display_style", "featured_badge_ids", "featured_stat_keys"]) {
  expect(profileHtml.includes(`name="${field}"`), `profile field ${field}`);
}
expect(profileHtml.includes('name="featured_stat_keys"'), "featured statistics picker");
expect(profileHtml.includes('id="communityFeaturedBadges"'), "favorite badges selector");
expect(profileHtml.includes('id="communityBadgeVisibility"'), "per-badge public visibility selector");
expect(publicHtml.includes('id="communityPublicHeadline"') && publicHtml.includes('id="communityPublicPronouns"'), "public headline and pronouns");
expect(model.includes("COMMUNITY_PROFILE_FRAMES") && model.includes("COMMUNITY_BADGE_STYLES") && model.includes("COMMUNITY_STAT_KEYS"), "profile personalization model constants");
expect(settings.includes("featured_badge_ids") && settings.includes("featured_stat_keys"), "profile settings persist badge and stat choices");
expect(settings.includes("public_badge_ids") && settings.includes("data-badge-visibility"), "profile settings persist per-badge visibility");
expect(publicPage.includes("profile.featuredStatKeys") && publicPage.includes("profile.featuredBadgeIds"), "public profile honors selected stats and badges");
expect(repository.includes("mh_get_my_community_profile_v2") && repository.includes("mh_get_public_community_profile_v2"), "repository uses v2 profile RPCs");
expect(admin.includes('data-community-tab="badge-history"') && admin.includes("renderBadgeHistory"), "Admin badge history tab");
expect(css.includes('[data-frame="neon"]') && css.includes('[data-badge-style="cards"]'), "profile frame and badge style CSS");
expect(css.includes("#communityBadgeVisibility") && css.includes("community-badge-visibility-item"), "responsive badge visibility controls");
expect(profileText.includes("community_badge_visibility"), "badge visibility label is localized");
if (externalSqlAvailable) {
  expect(sql.includes("public_badge_ids") && sql.includes("set is_public=(badge_id=any(v_public_badges))"), "badge visibility is persisted server-side");
  expect(sql.includes("featured_badge_id',case when v_profile.show_badges and exists"), "public RPC suppresses private featured badge IDs");
}

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error("MathHard Phase 4F audit failed:");
  for (const failure of failed) console.error(`- ${failure.message}`);
  process.exit(1);
}

if (!externalSqlAvailable) console.log("- external SQL artifacts are not stored in Git; database contract checks skipped.");
console.log("MathHard Phase 4F Badge Engine & Profile Personalization audit passed.");
