import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const read = (path) => existsSync(resolve(root, path))
  ? readFileSync(resolve(root, path), "utf8")
  : (errors.push(`Missing file: ${path}`), "");
const requireTokens = (source, label, tokens) => {
  for (const token of tokens) if (!source.includes(token)) errors.push(`${label} is missing: ${token}`);
};
const balanced = (source) => (source.match(/\$\$/g) || []).length % 2 === 0;

const migration = read("local-sql/061_product_phase_04g_3_community_safety_integrity.sql");
const smoke = read("local-sql/061_phase4g3_transactional_smoke_test.sql");
const repository = read("js/community-profile-repository.js");
const model = read("js/community-integrity-model.js");
const profileModel = read("js/community-profile-model.js");
const settings = read("js/community-profile-settings-controller.js");
const admin = read("js/community-admin-controller.js");
const adminCss = read("css/community-admin.css");
const app = read("js/app.js");
const index = read("index.html");
const profile = read("profile.html");

requireTokens(migration, "Phase 4G.3 SQL tables", [
  "mh_community_username_history",
  "mh_community_blocked_domains",
  "mh_community_integrity_flags",
  "enable row level security",
  "revoke all on table public.mh_community_integrity_flags"
]);
requireTokens(migration, "Username safety", [
  "mh_check_community_username_v2",
  "username_changed_at + interval '30 days'",
  "changed_at > now()-interval '90 days'",
  "mh_admin_reset_community_username",
  "mathhardsupport"
]);
requireTokens(migration, "Public profile safety", [
  "mh_community_url_safe",
  "mh_community_profile_safety_flags",
  "content_review_status",
  "v_has_control",
  "not v_control.bio_allowed",
  "not v_control.links_allowed",
  "content_review_status<>'clear'",
  "revoke all on function public.mh_get_public_community_profile_v2",
  "revoke all on function public.mh_update_my_community_profile_v2"
]);
requireTokens(migration, "Integrity engine", [
  "mh_scan_community_user_integrity",
  "rapid_correct_answers",
  "problem_solve_burst",
  "fast_exam",
  "xp_velocity",
  "mh_admin_get_community_integrity_v2",
  "mh_admin_review_community_integrity_flag"
]);
requireTokens(migration, "Leaderboard integrity", [
  "account_kind",
  "allow_internal_leaderboard",
  "integrity_hold",
  "internal_role.role = 'admin'",
  "integrity_flag.auto_exclude",
  "cp.content_review_status = 'clear'"
]);
requireTokens(migration, "Feedback protection", [
  "content_hash",
  "source_key",
  "interval '45 seconds'",
  "Daily rate limit exceeded",
  "Duplicate feedback"
]);
requireTokens(migration, "Hardened RPC privileges", [
  "security definer",
  "set search_path = public, pg_temp",
  "revoke all on function public.mh_admin_get_community_integrity_v2",
  "grant execute on function public.mh_get_public_community_profile_v3"
]);
if (!balanced(migration)) errors.push("Phase 4G.3 SQL has unbalanced $$ blocks.");
if (migration.includes("if found and not v_control")) errors.push("Public profile v3 still relies on ambiguous PL/pgSQL FOUND state.");

requireTokens(smoke, "Phase 4G.3 smoke test", [
  "begin;",
  "mh_check_community_username_v2",
  "mh_admin_get_community_integrity_v2",
  "mh_admin_run_community_integrity_scan",
  "Phase 04G.3 smoke test passed",
  "rollback;"
]);
if (!balanced(smoke)) errors.push("Phase 4G.3 smoke test has unbalanced $$ blocks.");

requireTokens(repository, "Community safety repository", [
  "mh_get_my_community_profile_v3",
  "mh_update_my_community_profile_v3",
  "mh_get_public_community_profile_v3",
  "mh_check_community_username_v2",
  "mh_admin_get_community_integrity_v2",
  "mh_admin_run_community_integrity_scan",
  "mh_admin_save_community_integrity_user",
  "mh_admin_review_community_integrity_flag",
  "mh_admin_reset_community_username",
  "mh_admin_upsert_community_blocked_domain"
]);
if (repository.includes(".from(")) errors.push("Community repository bypasses controlled RPCs.");

requireTokens(model, "Integrity model", [
  "normalizeCommunityIntegrityDashboard",
  "normalizeCommunityIntegrityUser",
  "normalizeCommunityIntegrityFlag",
  "communityIntegrityUserDraft",
  "COMMUNITY_ACCOUNT_KINDS"
]);
requireTokens(profileModel, "Profile safety model", ["safety", "usernameCooldownUntil", "contentReviewStatus"]);
requireTokens(settings, "Profile safety UX", ["usernameCooldownUntil", "unsafeLink", "contentReviewStatus"]);
requireTokens(admin, "Integrity Admin UI", [
  'data-community-tab="integrity"',
  "mhCommunityIntegrityForm",
  "mhCommunityUsernameResetForm",
  "mhCommunityBlockedDomainForm",
  "scan-all",
  "scan-selected",
  "data-community-integrity-flag-form"
]);
requireTokens(adminCss, "Integrity Admin styling", [
  ".mh-community-integrity-summary",
  ".mh-community-integrity-row",
  ".mh-community-integrity-flag",
  ".mh-community-blocked-domains"
]);
requireTokens(app, "Community Admin cache version", ['community-admin-controller.js?v=4g3']);
requireTokens(index, "Phase 4G.3 index cache", ["css/community-admin.css?v=4j1", "/js/app.js?v=5a1"]);
requireTokens(profile, "Phase 4G.3 profile cache", ["community-profile.css?v=4g3", "community-profile-settings-controller.js?v=4i"]);

const integrityModule = await import(pathToFileURL(resolve(root, "js/community-integrity-model.js")).href);
const normalized = integrityModule.normalizeCommunityIntegrityDashboard({
  counts: { open_flags: 2, critical_flags: 1, held_users: 1, internal_users: 3 },
  users: [{ user_id: "u1", username: "demo", account_kind: "test", integrity_hold: true }],
  flags: [{ id: "f1", user_id: "u1", severity: "critical", status: "new", title: "XP" }],
  domains: [{ domain: "spam.example", active: true }]
});
assert.equal(normalized.counts.openFlags, 2);
assert.equal(normalized.users[0].accountKind, "test");
assert.equal(normalized.users[0].integrityHold, true);
assert.equal(normalized.flags[0].severity, "critical");
assert.equal(normalized.domains[0].domain, "spam.example");
assert.equal(integrityModule.communityIntegrityUserDraft(normalized.users[0]).user_id, "u1");

console.log("MathHard Phase 4G.3 Community Safety & Integrity audit");
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("- username cooldown and history: present");
  console.log("- public profile and link safety: present");
  console.log("- Admin/test automatic leaderboard exclusion: present");
  console.log("- integrity flags and review dashboard: present");
  console.log("- feedback cooldown, daily limits and deduplication: present");
  console.log("MathHard Phase 4G.3 Community Safety & Integrity audit passed.");
}
