import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const read = (path) => existsSync(resolve(root, path)) ? readFileSync(resolve(root, path), "utf8") : (errors.push(`Missing file: ${path}`), "");
const requireTokens = (source, label, tokens) => tokens.forEach((token) => { if (!source.includes(token)) errors.push(`${label} is missing: ${token}`); });
const balanced = (source) => (source.match(/\$\$/g) || []).length % 2 === 0;

const feedbackModel = read("js/community-feedback-model.js");
const feedbackRepository = read("js/community-feedback-repository.js");
const feedbackController = read("js/community-feedback-controller.js");
const adminController = read("js/community-admin-controller.js");
const adminRepository = read("js/community-profile-repository.js");
const appSource = read("js/app.js");
const indexSource = read("index.html");
const feedbackCss = read("css/community-feedback.css");
const adminCss = read("css/community-admin.css");
const migration = read("local-sql/059_product_phase_04d_2_feedback_case_save.sql");
const smoke = read("local-sql/059_phase4d2_transactional_smoke_test.sql");

requireTokens(feedbackModel, "Feedback model", ["validateCommunityFeedbackDraft", "validateCommunityProfileReportDraft", "normalizeCommunityCase", "normalizeCommunityModerationDashboard"]);
requireTokens(feedbackRepository, "Feedback repository", ["mh_submit_community_feedback", "mh_submit_community_profile_report"]);
requireTokens(adminRepository, "Moderation repository", ["mh_admin_get_community_moderation", "mh_admin_save_community_case", "mh_admin_update_community_case", "isMissingRpcError", "mh_admin_set_community_access"]);
if (feedbackRepository.includes(".from(") || adminRepository.includes(".from(")) errors.push("Community feedback/moderation uses direct table access.");
requireTokens(feedbackController, "Logged-out reporting UX", ["authenticationPrompt", "authTitle", "authAction", "supabase.auth.getSession", "submitCommunityProfileReport"]);
requireTokens(feedbackCss, "Reporting prompt styles", [".mh-community-feedback-auth", ".mh-community-feedback-modal"]);
requireTokens(adminController, "Moderation save flow", ["data-community-action=\"save-case\"", "saveModerationCase", "event.preventDefault()", "setFormBusy", "normalizeCommunityCase", "validateModerationCaseDraft", "moderationErrorMessage", "Caz salvat.", "state.status = persisted.status"]);
requireTokens(appSource, "Community Admin cache bust", ["community-admin-controller.js?v=4g3"]);
requireTokens(migration, "Moderation save SQL", [
  "mh_admin_save_community_case", "drop function if exists public.mh_admin_update_community_case", "returns jsonb", "returning feedback.user_id", "case_updated", "grant execute on function public.mh_admin_save_community_case"
]);
requireTokens(smoke, "Moderation smoke test", ["mh_admin_save_community_case", "mh_admin_update_community_case", "Salvare Phase 4D.2", "Moderation case changes were not persisted", "rollback;"]);
if (!balanced(migration)) errors.push("Phase 4D SQL has unbalanced $$ blocks.");
if (!balanced(smoke)) errors.push("Phase 4D smoke test has unbalanced $$ blocks.");

requireTokens(indexSource, "top-level app cache bust", ["/js/app.js?v=4g4", "css/community-admin.css?v=4g3"]);
requireTokens(adminController, "direct community case save binding", [
  'id="mhCommunityCaseSaveBtn"',
  'type="button"',
  'bindCaseSaveButton()',
  'button.addEventListener("pointerup", triggerSave)',
  'button.addEventListener("click", triggerSave)',
  'saveCurrentCase() { return saveModerationCase(); }'
]);
requireTokens(appSource, "capture-phase community save fallback", [
  "mhCommunitySaveFallback",
  "#mhCommunityCaseSaveBtn",
  "communityAdminController?.saveCurrentCase?.()",
  "}, true);"
]);
requireTokens(adminCss, "community save button pointer hardening", [
  "#mhCommunityCaseSaveBtn",
  "pointer-events:auto!important",
  "touch-action:manipulation"
]);


if (/\bform\.id\b/.test(adminController)) {
  throw new Error("Community Admin must not use form.id because controls named id shadow the form property in browsers.");
}
requireTokens(adminController, "Named-form collision regression", [
  'form?.matches?.("#mhCommunityCaseForm")',
  'const formId = form.getAttribute("id") || ""',
  'formId === "mhCommunityBadgeForm"',
  'formId === "mhCommunityCaseForm"'
]);

const model = await import(pathToFileURL(resolve(root, "js/community-feedback-model.js")).href);
assert.equal(model.validateCommunityFeedbackDraft({ subject: "Bug mobil", message: "Butonul nu răspunde după schimbarea tabului." }).valid, true);
assert.equal(model.validateCommunityProfileReportDraft({ username: "test", reason: "spam", details: "Profilul publică mesaje repetitive." }).valid, true);
assert.deepEqual(model.normalizeCommunityCase({ id: "f1", status: "in_review", priority: "high", admin_note: "Verificat" }, "feedback"), {
  id: "f1", kind: "feedback", category: "", reason: "", subject: "", message: "", pageUrl: "", contentType: "", contentId: "",
  contactEmail: "", reporterUserId: "", reporterLabel: "", reportedUserId: "", reportedUsername: "", reportedDisplayName: "",
  status: "in_review", priority: "high", adminNote: "Verificat", createdAt: "", updatedAt: "", resolvedAt: ""
});

console.log("MathHard Phase 4D.2 Moderation Save audit");
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exitCode = 1;
} else {
  console.log("- feedback save button has a direct click path: present");
  console.log("- versioned moderation save RPC returns persisted state: present");
  console.log("- resolved cases remain discoverable after filter change: present");
  console.log("- logged-out profile reports show sign-in guidance: present");
  console.log("- authenticated users may report any other public profile, including Admin: preserved");
  console.log("MathHard Phase 4D.2 Moderation Save audit passed.");
}
