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
  for (const token of tokens) if (!source.includes(token)) errors.push(`${label} is missing: ${token}`);
}

function balancedDollarQuotes(source) {
  return (source.match(/\$\$/g) || []).length % 2 === 0;
}

const indexHtml = read("index.html");
const profileHtml = read("profile.html");
const publicHtml = read("u.html");
const feedbackModel = read("js/community-feedback-model.js");
const feedbackRepository = read("js/community-feedback-repository.js");
const feedbackController = read("js/community-feedback-controller.js");
const adminController = read("js/community-admin-controller.js");
const adminRepository = read("js/community-profile-repository.js");
const leaderboardController = read("js/community-leaderboard-controller.js");
const feedbackCss = read("css/community-feedback.css");
const adminCss = read("css/community-admin.css");
const migration = read("local-sql/057_product_phase_04c_community_feedback_integrity.sql");
const smoke = read("local-sql/057_phase4c_transactional_smoke_test.sql");

requireTokens(indexHtml, "Main feedback entry", [
  'data-community-feedback-open="feedback"',
  'css/community-feedback.css',
  '/js/community-feedback-controller.js'
]);
requireTokens(profileHtml, "Profile feedback entry", [
  'data-community-feedback-open="feedback"',
  '/js/community-feedback-controller.js'
]);
requireTokens(publicHtml, "Public profile report entry", [
  'id="communityReportProfile"',
  'data-community-feedback-open="profile-report"',
  '/js/community-feedback-controller.js'
]);
requireTokens(feedbackModel, "Community feedback model", [
  "COMMUNITY_FEEDBACK_CATEGORIES",
  "COMMUNITY_REPORT_REASONS",
  "validateCommunityFeedbackDraft",
  "validateCommunityProfileReportDraft",
  "normalizeCommunityModerationDashboard"
]);
requireTokens(feedbackRepository, "Community feedback repository", [
  "mh_submit_community_feedback",
  "mh_submit_community_profile_report",
  "mh_admin_get_community_moderation",
  "mh_admin_update_community_case",
  "mh_admin_set_community_access"
]);
if (feedbackRepository.includes(".from(")) errors.push("Community feedback repository uses direct table access.");
requireTokens(feedbackController, "Community feedback controller", [
  "data-community-feedback-open",
  "mhCommunityFeedbackForm",
  "mhCommunityReportForm",
  "client_token",
  "page_url",
  "submitCommunityProfileReport"
]);
if (/\son\w+\s*=/.test(feedbackController)) errors.push("Community feedback controller contains inline event handlers.");
requireTokens(adminController, "Community moderation Admin", [
  'data-community-tab="feedback"',
  'data-community-tab="reports"',
  'data-community-tab="integrity"',
  "mhCommunityCaseForm",
  "mhCommunityIntegrityForm",
  "setCommunityUserAccess"
]);
requireTokens(adminRepository, "Community Admin repository", [
  "loadCommunityModerationDashboard",
  "updateCommunityModerationCase",
  "setCommunityUserAccess"
]);
requireTokens(leaderboardController, "Universal leaderboard labels", [
  'county: "Județ"',
  'if (scope === "country") return copy.country',
  'return countryCode === "RO" ? copy.county : copy.region'
]);
if (leaderboardController.includes('return context.targetRegionName || context.regionName')) errors.push("Region tab still uses the selected region name as its permanent label.");
requireTokens(feedbackCss, "Feedback responsive UI", [
  ".mh-community-feedback-modal",
  "max-height:min(760px,calc(100dvh - 32px))",
  "@media(max-width:620px)"
]);
requireTokens(adminCss, "Moderation Admin UI", [
  ".mh-community-case-list",
  ".mh-community-integrity-list",
  ".mh-community-case-editor",
  ".mh-community-integrity-editor"
]);
requireTokens(migration, "Phase 4C SQL", [
  "mh_community_feedback",
  "mh_community_profile_reports",
  "mh_community_user_controls",
  "mh_community_moderation_actions",
  "mh_community_controls_enforce",
  "mh_submit_community_feedback",
  "mh_submit_community_profile_report",
  "mh_admin_get_community_moderation",
  "mh_admin_update_community_case",
  "mh_admin_set_community_access",
  "enable row level security",
  "Rate limit exceeded",
  "grant execute on function public.mh_submit_community_feedback"
]);
if (!balancedDollarQuotes(migration)) errors.push("Phase 4C SQL has unbalanced $$ blocks.");
if (/grant\s+(?:select|insert|update|delete)\s+on\s+table\s+public\.mh_community_/i.test(migration)) errors.push("Phase 4C grants direct table access.");
requireTokens(smoke, "Phase 4C smoke test", [
  "mh_submit_community_feedback",
  "mh_admin_get_community_moderation",
  "Client token leaked",
  "Phase 04C smoke test passed",
  "rollback;"
]);
if (!balancedDollarQuotes(smoke)) errors.push("Phase 4C smoke test has unbalanced $$ blocks.");

const model = await import(pathToFileURL(resolve(root, "js/community-feedback-model.js")).href);
assert.equal(model.validateCommunityFeedbackDraft({ subject: "Bug mobil", message: "Butonul nu răspunde după schimbarea tabului." }).valid, true);
assert.equal(model.validateCommunityFeedbackDraft({ subject: "x", message: "prea scurt" }).valid, false);
assert.equal(model.validateCommunityProfileReportDraft({ username: "test", reason: "spam", details: "Profilul publică mesaje repetitive." }).valid, true);
const dashboard = model.normalizeCommunityModerationDashboard({
  counts: { feedback_new: 2, reports_new: 1, restricted_users: 3 },
  feedback: [{ id: "f1", subject: "Test", message: "Mesaj suficient pentru test", status: "new" }],
  reports: [{ id: "r1", reported_username: "demo", details: "Raport", status: "in_review" }],
  users: [{ user_id: "u1", username: "demo", profile_allowed: false, leaderboard_allowed: true }]
});
assert.equal(dashboard.counts.feedbackNew, 2);
assert.equal(dashboard.users[0].profileAllowed, false);

console.log("MathHard Phase 4C Community Feedback & Integrity audit");
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exitCode = 1;
} else {
  console.log("- public feedback form and profile reports: present");
  console.log("- Admin feedback/report queues and integrity controls: present");
  console.log("- server-side rate limits and RLS-only tables: present");
  console.log("- generic county/country leaderboard labels: present");
  console.log("MathHard Phase 4C Community Feedback & Integrity audit passed.");
}
