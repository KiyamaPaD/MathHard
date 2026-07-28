import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const moduleJsFiles = [
  "js/app.js",
  "js/profile.js",
  "js/supabase-client.js",
  "js/content-repository.js",
  "js/progress-repository.js",
  "js/lesson-status-repository.js",
  "js/runtime-config.js",
  "js/content-model.js",
  "js/answer-engine.js",
  "js/mutation-queue.js",
  "js/profile-model.js",
  "js/profile-text.js",
  "js/app-progress.js",
  "js/auth-ui-controller.js",
  "js/admin-content-model.js",
  "js/exam-session-state.js",
  "js/admin-exam-recovery.js",
  "js/secure-evaluation-repository.js",
  "js/secure-exam-repository.js",
  "js/secure-problem-controller.js",
  "js/roadmap-model.js",
  "js/roadmap-repository.js",
  "js/roadmap-controller.js",
  "js/roadmap-admin-controller.js",
  "js/roadmap-admin-model.js",
  "js/learning-workspace-controller.js",
  "js/problem-workspace-repository.js",
  "js/problem-workspace-model.js",
  "js/quick-nav-controller.js",
  "js/ui-preferences-repository.js",
  "js/section-layout-controller.js",
  "js/browser-state.js",
  "js/runtime-diagnostics.js",
  "js/app-shell-controller.js",
  "js/analytics-model.js",
  "js/analytics-repository.js",
  "js/analytics-controller.js",
  "js/gamification-model.js",
  "js/gamification-repository.js",
  "js/gamification-controller.js",
  "js/admin-studio-controller.js",
  "js/gamification-admin-model.js",
  "js/gamification-admin-repository.js",
  "js/gamification-admin-controller.js",
  "js/admin-history-model.js",
  "js/admin-history-repository.js",
  "js/admin-history-controller.js"
];

const classicJsFiles = [
  "js/animation-numberline.js",
  "js/katex-init.js"
];

const requiredFiles = [
  "index.html",
  "profile.html",
  "README.md",
  "css/roadmap.css",
  "css/roadmap-studio.css",
  "css/learning-workspace.css",
  "css/problem-workspace.css",
  "css/lesson-status.css",
  "css/quick-nav.css",
  "css/section-layout.css",
  "css/app-shell.css",
  "css/analytics.css",
  "css/gamification.css",
  "css/admin-studio.css",
  "css/gamification-studio.css",
  "css/admin-history.css",
  "scripts/test-repositories.mjs",
  "scripts/debug-audit.mjs",
  ...classicJsFiles,
  ...moduleJsFiles
];

const removedLegacyFiles = [
  "js/data.js",
  "data/problems.json",
  "scripts/content-tools-lib.mjs",
  "scripts/audit-content.mjs",
  "scripts/export-content-sql.mjs"
];

const runtimeTextFiles = [
  "index.html",
  "profile.html",
  ...classicJsFiles,
  ...moduleJsFiles
];

const productionTextFiles = [
  "README.md",
  ...runtimeTextFiles
];

const forbiddenPatterns = [
  /ADMIN_PASS/i,
  /sb_secret_[A-Za-z0-9_-]+/i,
  /service[_-]?role\s*[:=]/i,
  /create_content\.php/i,
  /admin_login\.php/i,
  /get_problems\.php/i,
  /id=["']mh_secret["']/i,
  /Smecherul\.1978/i
];

const forbiddenRuntimeReferences = [
  /(?:^|[\/"'])js\/data\.js(?:$|[?"'])/i,
  /(?:^|[\/"'])data\/problems\.json(?:$|[?"'])/i,
  /loadRemoteContentCatalog/,
  /bundledCatalog\s*:/,
  /Șterge override/i
];

let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

for (const relativePath of requiredFiles) {
  if (!existsSync(resolve(root, relativePath))) {
    fail(`Missing required file: ${relativePath}`);
  }
}

for (const relativePath of removedLegacyFiles) {
  if (existsSync(resolve(root, relativePath))) {
    fail(`Legacy content file must be removed after Phase 06: ${relativePath}`);
  }
}

function checkClassicScript(relativePath) {
  execFileSync(process.execPath, ["--check", resolve(root, relativePath)], {
    stdio: "pipe"
  });
}

function checkModuleScript(relativePath) {
  const source = readFileSync(resolve(root, relativePath), "utf8");
  execFileSync(process.execPath, ["--input-type=module", "--check"], {
    input: source,
    stdio: ["pipe", "pipe", "pipe"]
  });
}

for (const relativePath of classicJsFiles) {
  try {
    checkClassicScript(relativePath);
  } catch (error) {
    fail(`JavaScript syntax error in ${relativePath}\n${error.stderr?.toString() || error.message}`);
  }
}

for (const relativePath of moduleJsFiles) {
  try {
    checkModuleScript(relativePath);
  } catch (error) {
    fail(`JavaScript module syntax error in ${relativePath}\n${error.stderr?.toString() || error.message}`);
  }
}

for (const relativePath of moduleJsFiles) {
  const source = readFileSync(resolve(root, relativePath), "utf8");
  const importPattern = /from\s+["'](\.\.?\/[^"']+)["']/g;
  for (const match of source.matchAll(importPattern)) {
    const importedPath = resolve(root, dirname(relativePath), match[1]);
    if (!existsSync(importedPath)) {
      fail(`${relativePath} imports missing module: ${match[1]}`);
    }
  }
}

for (const relativePath of productionTextFiles) {
  const content = readFileSync(resolve(root, relativePath), "utf8");
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      fail(`Forbidden legacy/secret pattern ${pattern} in ${relativePath}`);
    }
  }
}

for (const relativePath of runtimeTextFiles) {
  const content = readFileSync(resolve(root, relativePath), "utf8");
  for (const pattern of forbiddenRuntimeReferences) {
    if (pattern.test(content)) {
      fail(`Forbidden legacy runtime reference ${pattern} in ${relativePath}`);
    }
  }
}

const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
const profileHtml = readFileSync(resolve(root, "profile.html"), "utf8");
const appSource = readFileSync(resolve(root, "js/app.js"), "utf8");
const profileSource = readFileSync(resolve(root, "js/profile.js"), "utf8");
const contentRepositorySource = readFileSync(resolve(root, "js/content-repository.js"), "utf8");
const contentModelSource = readFileSync(resolve(root, "js/content-model.js"), "utf8");
const answerEngineSource = readFileSync(resolve(root, "js/answer-engine.js"), "utf8");
const mutationQueueSource = readFileSync(resolve(root, "js/mutation-queue.js"), "utf8");
const profileModelSource = readFileSync(resolve(root, "js/profile-model.js"), "utf8");
const profileTextSource = readFileSync(resolve(root, "js/profile-text.js"), "utf8");
const appProgressSource = readFileSync(resolve(root, "js/app-progress.js"), "utf8");
const authUiControllerSource = readFileSync(resolve(root, "js/auth-ui-controller.js"), "utf8");
const adminContentModelSource = readFileSync(resolve(root, "js/admin-content-model.js"), "utf8");
const examSessionStateSource = readFileSync(resolve(root, "js/exam-session-state.js"), "utf8");
const progressRepositorySource = readFileSync(resolve(root, "js/progress-repository.js"), "utf8");
const lessonStatusRepositorySource = readFileSync(resolve(root, "js/lesson-status-repository.js"), "utf8");
const adminExamRecoverySource = readFileSync(resolve(root, "js/admin-exam-recovery.js"), "utf8");
const secureEvaluationRepositorySource = readFileSync(resolve(root, "js/secure-evaluation-repository.js"), "utf8");
const secureExamRepositorySource = readFileSync(resolve(root, "js/secure-exam-repository.js"), "utf8");
const secureProblemControllerSource = readFileSync(resolve(root, "js/secure-problem-controller.js"), "utf8");
const roadmapModelSource = readFileSync(resolve(root, "js/roadmap-model.js"), "utf8");
const roadmapRepositorySource = readFileSync(resolve(root, "js/roadmap-repository.js"), "utf8");
const roadmapControllerSource = readFileSync(resolve(root, "js/roadmap-controller.js"), "utf8");
const roadmapAdminControllerSource = readFileSync(resolve(root, "js/roadmap-admin-controller.js"), "utf8");
const roadmapAdminModelSource = readFileSync(resolve(root, "js/roadmap-admin-model.js"), "utf8");
const learningWorkspaceControllerSource = readFileSync(resolve(root, "js/learning-workspace-controller.js"), "utf8");
const problemWorkspaceRepositorySource = readFileSync(resolve(root, "js/problem-workspace-repository.js"), "utf8");
const problemWorkspaceModelSource = readFileSync(resolve(root, "js/problem-workspace-model.js"), "utf8");
const problemWorkspaceCss = readFileSync(resolve(root, "css/problem-workspace.css"), "utf8");
const lessonStatusCss = readFileSync(resolve(root, "css/lesson-status.css"), "utf8");
const roadmapCss = readFileSync(resolve(root, "css/roadmap.css"), "utf8");
const roadmapStudioCss = readFileSync(resolve(root, "css/roadmap-studio.css"), "utf8");
const learningWorkspaceCss = readFileSync(resolve(root, "css/learning-workspace.css"), "utf8");

const quickNavSource = readFileSync(resolve(root, "js/quick-nav-controller.js"), "utf8");
const quickNavCss = readFileSync(resolve(root, "css/quick-nav.css"), "utf8");
const uiPreferencesRepositorySource = readFileSync(resolve(root, "js/ui-preferences-repository.js"), "utf8");
const sectionLayoutControllerSource = readFileSync(resolve(root, "js/section-layout-controller.js"), "utf8");
const sectionLayoutCss = readFileSync(resolve(root, "css/section-layout.css"), "utf8");
const appShellSource = readFileSync(resolve(root, "js/app-shell-controller.js"), "utf8");
const appShellCss = readFileSync(resolve(root, "css/app-shell.css"), "utf8");
const browserStateSource = readFileSync(resolve(root, "js/browser-state.js"), "utf8");
const runtimeDiagnosticsSource = readFileSync(resolve(root, "js/runtime-diagnostics.js"), "utf8");
const analyticsModelSource = readFileSync(resolve(root, "js/analytics-model.js"), "utf8");
const analyticsRepositorySource = readFileSync(resolve(root, "js/analytics-repository.js"), "utf8");
const analyticsControllerSource = readFileSync(resolve(root, "js/analytics-controller.js"), "utf8");
const analyticsCss = readFileSync(resolve(root, "css/analytics.css"), "utf8");
const gamificationModelSource = readFileSync(resolve(root, "js/gamification-model.js"), "utf8");
const gamificationRepositorySource = readFileSync(resolve(root, "js/gamification-repository.js"), "utf8");
const gamificationControllerSource = readFileSync(resolve(root, "js/gamification-controller.js"), "utf8");
const gamificationCss = readFileSync(resolve(root, "css/gamification.css"), "utf8");
const adminStudioSource = readFileSync(resolve(root, "js/admin-studio-controller.js"), "utf8");
const gamificationAdminModelSource = readFileSync(resolve(root, "js/gamification-admin-model.js"), "utf8");
const gamificationAdminRepositorySource = readFileSync(resolve(root, "js/gamification-admin-repository.js"), "utf8");
const gamificationAdminControllerSource = readFileSync(resolve(root, "js/gamification-admin-controller.js"), "utf8");
const adminHistoryModelSource = readFileSync(resolve(root, "js/admin-history-model.js"), "utf8");
const adminHistoryRepositorySource = readFileSync(resolve(root, "js/admin-history-repository.js"), "utf8");
const adminHistoryControllerSource = readFileSync(resolve(root, "js/admin-history-controller.js"), "utf8");
const adminHistoryCss = readFileSync(resolve(root, "css/admin-history.css"), "utf8");
const gamificationStudioCss = readFileSync(resolve(root, "css/gamification-studio.css"), "utf8");
const adminStudioCss = readFileSync(resolve(root, "css/admin-studio.css"), "utf8");

if (!/id=["']adminBtn["'][^>]*\bhidden\b/i.test(indexHtml)) {
  fail("Admin button must be hidden by default in index.html.");
}
if (!appSource.includes('from "./content-repository.js"')) {
  fail("app.js must use content-repository.js.");
}
if (!appSource.includes("loadContentCatalog")) {
  fail("app.js must load the Supabase catalog through loadContentCatalog().");
}
if (!appSource.includes('from "./progress-repository.js"')) {
  fail("app.js must use progress-repository.js.");
}
if (!appSource.includes('from "./secure-evaluation-repository.js"')) {
  fail("app.js must use the Phase 11A secure learning-event repository.");
}
if (!appSource.includes('from "./secure-problem-controller.js"')) {
  fail("app.js must use the Phase 11A secure problem controller.");
}
if (!appSource.includes('from "./secure-exam-repository.js"')) {
  fail("app.js must use the Phase 11B secure exam repository.");
}
if (!secureExamRepositorySource.includes('"mh_start_secure_exam_attempt"')) {
  fail("secure-exam-repository.js must start exams through mh_start_secure_exam_attempt().");
}
if (!secureExamRepositorySource.includes('"mh_save_secure_exam_answer"')) {
  fail("secure-exam-repository.js must autosave answers through mh_save_secure_exam_answer().");
}
if (!secureExamRepositorySource.includes('"mh_submit_secure_exam_attempt"')) {
  fail("secure-exam-repository.js must submit exams through mh_submit_secure_exam_attempt().");
}
if (!secureExamRepositorySource.includes('"mh_cancel_secure_exam_attempt"')) {
  fail("secure-exam-repository.js must cancel admin test attempts through mh_cancel_secure_exam_attempt().");
}
if (!secureEvaluationRepositorySource.includes('"mh_submit_problem_answer"')) {
  fail("secure-evaluation-repository.js must submit answers through mh_submit_problem_answer().");
}
if (!secureEvaluationRepositorySource.includes('"mh_get_problem_hint"')) {
  fail("secure-evaluation-repository.js must request hints through mh_get_problem_hint().");
}
if (!secureEvaluationRepositorySource.includes('"mh_reveal_problem_answer"')) {
  fail("secure-evaluation-repository.js must reveal solutions through mh_reveal_problem_answer().");
}
if (!secureProblemControllerSource.includes("export function createSecureProblemController")) {
  fail("secure-problem-controller.js must own the normal problem evaluation UI.");
}
if (!appSource.includes('from "./runtime-config.js"')) {
  fail("app.js must load non-content runtime configuration from runtime-config.js.");
}
if (!appSource.includes('from "./content-model.js"')) {
  fail("app.js must use the extracted content-model.js module.");
}
if (!appSource.includes('from "./answer-engine.js"')) {
  fail("app.js must use the extracted answer-engine.js module.");
}
if (!secureProblemControllerSource.includes("submitProblemAnswer(supabase, problem.id")) {
  fail("Normal problem answers must be checked by the secure Supabase RPC.");
}
if (!secureProblemControllerSource.includes("requestProblemHint(supabase, problem.id")) {
  fail("Normal problem hints must be loaded from the secure Supabase RPC.");
}
if (!secureProblemControllerSource.includes("revealProblemAnswer(supabase, problem.id")) {
  fail("Normal problem reveal must use the secure Supabase RPC.");
}
if (/SmartAnswer\.check\(|problem\.answer/.test(secureProblemControllerSource)) {
  fail("The secure normal-problem controller must not read or compare problem.answer in the browser.");
}
if (!appSource.includes('from "./mutation-queue.js"')) {
  fail("app.js must use the extracted mutation-queue.js module.");
}
if (!profileSource.includes('from "./profile-model.js"')) {
  fail("profile.js must use the extracted profile-model.js module.");
}
if (!profileSource.includes('from "./profile-text.js"')) {
  fail("profile.js must use the extracted profile-text.js module.");
}
if (!contentRepositorySource.includes('supabase.rpc("mh_get_content_catalog")')) {
  fail("content-repository.js must load the authenticated catalog through mh_get_content_catalog().");
}
if (!contentRepositorySource.includes("MathHardAuthRequiredError")) {
  fail("content-repository.js must fail closed when no authenticated session exists.");
}
if (/supabase\.from\(["']mh_(lessons|problems|exams)["']\)/.test(contentRepositorySource)) {
  fail("Normal catalog loading must not query content tables directly after Phase 10.");
}
if (contentRepositorySource.includes("provenance") || contentRepositorySource.includes("sourceCounts")) {
  fail("Supabase-only content repository must not keep legacy merge provenance state.");
}
if (!appSource.includes('from "./app-progress.js"')) {
  fail("app.js must use the extracted app-progress.js controller.");
}
if (!appSource.includes('from "./auth-ui-controller.js"')) {
  fail("app.js must use the extracted auth-ui-controller.js module.");
}
if (!appSource.includes('from "./admin-content-model.js"')) {
  fail("app.js must use the extracted admin-content-model.js module.");
}
if (!appSource.includes('from "./exam-session-state.js"')) {
  fail("app.js must use the extracted exam-session-state.js module.");
}
if (!appSource.includes('from "./admin-exam-recovery.js"')) {
  fail("app.js must use the Phase 10 admin exam recovery controller.");
}
if (!appProgressSource.includes("let progressUser = null") || !appProgressSource.includes("let authUser = null")) {
  fail("app-progress.js must keep auth identity separate from progress hydration state.");
}
if (!/function isGuestContentLocked\(\)\s*\{[\s\S]{0,180}return !MH_AUTH_USER\?\.id;/.test(appSource)) {
  fail("Phase 10 must require authentication before rendering learning content.");
}
if (!appSource.includes("invalidateContentCatalogCache")) {
  fail("app.js must clear secured catalog caches on logout/account changes.");
}
if (!authUiControllerSource.includes("onSessionResolved")) {
  fail("auth-ui-controller.js must expose session resolution to the authenticated content gate.");
}
if (!appProgressSource.includes('.from("user_problem_progress")') || !appProgressSource.includes('.select("*")')) {
  fail("app-progress.js must load progress with schema-compatible select(*).");
}
if (/const safe(?:Lesson|Problem|Exam)Rows\s*=\s*[^;]*\bsafe(?:Lesson|Problem|Exam)Rows\b/.test(profileSource)) {
  fail("profile.js contains a self-referencing safe progress variable.");
}
if (/\.from\(["']user_(lesson|problem|exam)_progress["']\)[\s\S]{0,180}\.(insert|upsert|update|delete)\(/.test(appSource)) {
  fail("app.js contains a direct progress-table mutation; use progress-repository.js instead.");
}
if (/exam_type:\s*document\.getElementById\(["']mh_exam_type/.test(appSource)) {
  fail("Admin exam payload still uses legacy exam_type instead of canonical type.");
}
if (!/default_hours:\s*Number\(document\.getElementById\(["']mh_exam_hours/.test(appSource)) {
  fail("Admin exam payload must write canonical default_hours.");
}
if (/function reconcileMutationError\([^)]*\)\s*\{[^}]*loadAppProgressFromDb/.test(appProgressSource)) {
  fail("Progress mutation errors must not immediately reload and erase optimistic UI state.");
}
if (!appProgressSource.includes("onTerminalProblemChanged(problemId, merged)")) {
  fail("app-progress.js must notify the UI after terminal problem mutations.");
}
if (!/onTerminalProblemChanged:\s*\(\)\s*=>\s*\{[\s\S]{0,260}renderCards\(\)/.test(appSource)) {
  fail("Solved problem mutations must refresh problem cards immediately.");
}
if (!appSource.includes('.from("mh_lessons").upsert(payload, { onConflict: "id" })')) {
  fail("Editing a lesson must update the Supabase source of truth via upsert.");
}
if (!adminStudioSource.includes('source: "Supabase"')) {
  fail("Admin must expose Supabase as the single content source.");
}
if (/src=["']\/?js\/data\.js["']/i.test(indexHtml) || /src=["']\/?js\/data\.js["']/i.test(profileHtml)) {
  fail("Production pages must not load the removed data.js asset.");
}

if (appSource.includes("const CHAPTER_TRANSLATIONS =") || appSource.includes("const TAG_TRANSLATIONS =")) {
  fail("app.js must not contain the extracted chapter/tag dictionaries.");
}
if (profileSource.includes("const PROFILE_TEXT =")) {
  fail("profile.js must not contain the extracted profile translation dictionary.");
}
if (!contentModelSource.includes("export function normalizeExam")) {
  fail("content-model.js must own catalog normalization.");
}
if (!answerEngineSource.includes("export const SmartAnswer")) {
  fail("answer-engine.js must own smart answer validation.");
}
if (!mutationQueueSource.includes("export function createKeyedMutationQueue")) {
  fail("mutation-queue.js must own keyed mutation serialization.");
}
if (!profileModelSource.includes("export function buildProfileStats")) {
  fail("profile-model.js must own profile progress aggregation.");
}
if (!profileTextSource.includes("export const PROFILE_TEXT")) {
  fail("profile-text.js must own profile translations.");
}
if (!appProgressSource.includes("export function createAppProgressController")) {
  fail("app-progress.js must own app progress hydration and mutations.");
}
if (!appProgressSource.includes("applyProblemProgressResult")) {
  fail("app-progress.js must reconcile canonical progress returned by secure evaluation RPCs.");
}
if (appProgressSource.includes("recordProblemEventSafe")) {
  fail("Phase 11A must not expose the legacy generic problem-event mutation path.");
}
if (!authUiControllerSource.includes("export function createAuthUiController")) {
  fail("auth-ui-controller.js must own auth-dependent UI synchronization.");
}
if (!adminContentModelSource.includes("export function validateExamPayload")) {
  fail("admin-content-model.js must own admin exam normalization and validation.");
}
if (!examSessionStateSource.includes("export function createExamSessionStore")) {
  fail("exam-session-state.js must own persistent exam session state.");
}
if (!examSessionStateSource.includes("attemptId")) {
  fail("Phase 11B exam session state must persist the secure attempt id.");
}
if (!appSource.includes("startSecureExamAttempt(")) {
  fail("Phase 11B must start exams through the secure server RPC.");
}
if (!appSource.includes("saveSecureExamAnswer(")) {
  fail("Phase 11B must autosave exam answers server-side.");
}
if (!appSource.includes("submitSecureExamAttempt(")) {
  fail("Phase 11B must grade exams server-side.");
}
if (/SmartAnswer\.check\([\s\S]{0,240}exam/i.test(appSource)) {
  fail("Exam answers must not be graded with SmartAnswer in the browser after Phase 11B.");
}
if (appSource.includes("scoreExamMcqItem(") || appSource.includes("isExactMcqSelectionCorrect(")) {
  fail("Client-side exam scoring helpers must be removed after Phase 11B.");
}
if (!adminExamRecoverySource.includes("export function createAdminExamRecoveryController")) {
  fail("admin-exam-recovery.js must expose the emergency admin unlock controller.");
}
if (!adminExamRecoverySource.includes("Deblochează examenul activ")) {
  fail("The Phase 10 emergency unlock control is missing its Romanian UI label.");
}
if (!progressRepositorySource.includes("export async function cancelExamAttempt")) {
  fail("progress-repository.js must expose admin exam cancellation.");
}
if (!appProgressSource.includes("cancelExamAttemptSafe")) {
  fail("app-progress.js must serialize admin exam cancellation with other exam mutations.");
}
if (!appSource.includes("Anulează examenul") || !appSource.includes("startedByAdmin")) {
  fail("app.js must expose the admin-only active-exam cancellation flow.");
}
if (appSource.includes("renderAdminExamForceStopButton") || appSource.includes("saveExamAttemptResultSafe(exam.id, currentScore")) {
  fail("Legacy force-stop behavior must not save a cancelled exam score.");
}
if (/const ACTIVE_EXAM_LOCK_KEY|function getExamState\(|function setExamState\(/.test(appSource)) {
  fail("app.js still contains exam persistence logic extracted during Phase 09.");
}
if (/function (?:mhClampOptionCount|mhEnsureDraftMcqShape|mhValidateExamPayload|loadAppProgressFromDb)\b/.test(appSource)) {
  fail("app.js still contains logic extracted during Phase 08.");
}
if (!indexHtml.includes('id="mhDynamicRoadmap"') || !indexHtml.includes('css/roadmap.css')) {
  fail("Phase 12 dynamic roadmap root or stylesheet is missing from index.html.");
}
if (!indexHtml.includes('id="mhRoadmapAdminStudio"')) {
  fail("Phase 12 Roadmap Studio root is missing from the Admin drawer.");
}
if (!appSource.includes('from "./roadmap-controller.js"') || !appSource.includes('from "./roadmap-admin-controller.js"')) {
  fail("app.js must use the extracted Phase 12 roadmap controllers.");
}
if (!appSource.includes("roadmapController?.refreshProgress()")) {
  fail("Roadmap progress must refresh when canonical lesson/problem/exam progress changes.");
}
if (!roadmapRepositorySource.includes('supabase.rpc("mh_get_roadmap_catalog")')) {
  fail("roadmap-repository.js must load the graph through mh_get_roadmap_catalog().");
}
if (!roadmapRepositorySource.includes('supabase.rpc("mh_select_roadmap"')) {
  fail("roadmap selection must persist through mh_select_roadmap().");
}
if (!roadmapModelSource.includes("export function buildRoadmapView")) {
  fail("roadmap-model.js must own prerequisite and completion derivation.");
}
if (!roadmapControllerSource.includes("data-roadmap-next") || !roadmapControllerSource.includes("unmetPrerequisites")) {
  fail("The user roadmap controller must expose next-step and prerequisite UI.");
}
if (!roadmapAdminControllerSource.includes("Roadmap Studio") || !roadmapAdminControllerSource.includes("replaceNodePrerequisites")) {
  fail("The Admin roadmap editor must support graph nodes and prerequisites.");
}
if (!roadmapCss.includes(".mh-roadmap-node.is-locked") || !roadmapCss.includes(".mh-roadmap-progress-ring")) {
  fail("Phase 12 roadmap status/progress styling is incomplete.");
}

if (appSource.split(/\r?\n/).length > 7850) {
  fail("app.js exceeded the Phase 10 architecture ceiling of 7850 lines.");
}
if (profileSource.split(/\r?\n/).length > 1150) {
  fail("profile.js exceeded the Phase 07 architecture ceiling of 1150 lines.");
}

try {
  execFileSync(process.execPath, [resolve(root, "scripts/test-repositories.mjs")], {
    cwd: root,
    stdio: "pipe"
  });
} catch (error) {
  fail(`Repository tests failed.\n${error.stdout?.toString() || ""}${error.stderr?.toString() || error.message}`);
}


if (!indexHtml.includes('href="css/quick-nav.css"')) {
  fail("Quick navigation stylesheet is missing from index.html.");
}
if (!indexHtml.includes('src="/js/quick-nav-controller.js"')) {
  fail("Quick navigation controller is missing from index.html.");
}
if (!quickNavSource.includes('mh:compact-home-request')) {
  fail("Quick navigation must delegate compact-home persistence to the shared layout controller.");
}
if (!quickNavSource.includes('data-tab="${CSS.escape(target)}"')) {
  fail("Quick navigation must activate the existing MathHard tabs instead of duplicating tab state.");
}
if (!quickNavCss.includes('body.mh-compact-home #hero')) {
  fail("Quick navigation stylesheet must implement compact-home mode.");
}

if (!indexHtml.includes('href="css/section-layout.css"')) {
  fail("Section layout stylesheet is missing from index.html.");
}
if (!indexHtml.includes('src="/js/section-layout-controller.js"')) {
  fail("Section layout controller is missing from index.html.");
}
if (!indexHtml.includes('href="css/app-shell.css"')) {
  fail("Phase 14A app shell stylesheet is missing from index.html.");
}
if (!indexHtml.includes('src="/js/app-shell-controller.js"')) {
  fail("Phase 14A app shell controller is missing from index.html.");
}
if (!appShellSource.includes("normalizeAppRoute") ||
    !appShellSource.includes("mh-shell-workspace-panel") ||
    !appShellSource.includes("data-shell-route")) {
  fail("Phase 14A app shell routing contract is incomplete.");
}
if (!appShellCss.includes(".mh-shell-sidebar") ||
    !appShellCss.includes(".mh-shell-bottom-nav") ||
    !appShellCss.includes(".mh-shell-workspace-panel")) {
  fail("Phase 14A responsive app shell styles are incomplete.");
}
if (!indexHtml.includes('id="mhCatalogWorkspace"')) {
  fail("The lessons/problems/exams workspace must be a collapsible Phase 12.2 section.");
}
if (!uiPreferencesRepositorySource.includes('"mh_get_ui_preferences"') ||
    !uiPreferencesRepositorySource.includes('"mh_save_ui_preferences"')) {
  fail("UI preferences must load and save through the authenticated Supabase RPCs.");
}
if (!sectionLayoutControllerSource.includes('mh:layout-preferences-changed') ||
    !sectionLayoutControllerSource.includes('mh:section-layout-request')) {
  fail("The section layout controller must expose synchronized layout events.");
}
for (const sectionId of ["mhHub", "mhRoadmap", "mhBoss", "mhRadar", "mhCatalogWorkspace"]) {
  if (!sectionLayoutControllerSource.includes(`id: "${sectionId}"`)) {
    fail(`Phase 12.2 collapsible section is missing from the controller: ${sectionId}`);
  }
}
if (!sectionLayoutCss.includes('.mh-collapsible-section.is-collapsed') ||
    !sectionLayoutCss.includes('.mh-section-collapse-toggle')) {
  fail("Phase 12.2 collapsible section styling is incomplete.");
}
if (!quickNavSource.includes('data-layout-action="expand-all"') ||
    !quickNavSource.includes('data-layout-action="reset"')) {
  fail("Quick navigation must expose show-all, close-all, and reset layout controls.");
}


if (!indexHtml.includes('id="mhLearningWorkspaceBar"')) {
  fail("Phase 13A learning workspace toolbar is missing from index.html.");
}
if (!indexHtml.includes('href="css/learning-workspace.css"') || !indexHtml.includes('href="css/roadmap-studio.css"')) {
  fail("Phase 13A workspace or Roadmap Studio stylesheet is missing from index.html.");
}
if (!appSource.includes('from "./learning-workspace-controller.js"')) {
  fail("app.js must use the Phase 13A learning workspace controller.");
}
if (!appSource.includes("getContentCatalog: () => DATA")) {
  fail("Roadmap Studio v2 must receive the authenticated content catalog.");
}
if (!roadmapAdminControllerSource.includes("data-roadmap-quick-add") || !roadmapAdminControllerSource.includes("data-roadmap-drag-node")) {
  fail("Roadmap Studio v2 must support quick catalog insertion and visual node movement.");
}
if (!roadmapAdminControllerSource.includes("patchRoadmapEntity") || !roadmapAdminControllerSource.includes("saveRoadmapPositions")) {
  fail("Roadmap Studio v2 must persist inline edits and ordering through roadmap-repository.js.");
}
if (!roadmapAdminModelSource.includes("createRoadmapNodeId") || !roadmapAdminModelSource.includes("filterRoadmapContent")) {
  fail("roadmap-admin-model.js must own ID generation and catalog filtering.");
}
if (!learningWorkspaceControllerSource.includes("findNodeByContent") || !learningWorkspaceCss.includes("is-learning-workspace")) {
  fail("Phase 13A workspace must integrate with the current roadmap and full-screen layout.");
}
if (!roadmapStudioCss.includes("mh-roadmap-admin-quick-add")) {
  fail("Roadmap Studio v2 styling is incomplete.");
}


if (!indexHtml.includes('css/problem-workspace.css')) {
  fail("Phase 13B problem workspace stylesheet is missing from index.html.");
}
if (!secureProblemControllerSource.includes('from "./problem-workspace-repository.js"')) {
  fail("secure-problem-controller.js must use the Phase 13B workspace repository.");
}
if (!secureProblemControllerSource.includes('id="problemBookmarkBtn"')) {
  fail("Phase 13B bookmark control is missing from the problem workspace.");
}
if (!secureProblemControllerSource.includes('id="problemNote"')) {
  fail("Phase 13B personal note editor is missing from the problem workspace.");
}
if (!secureProblemControllerSource.includes('data-explanation-mode="boss"')) {
  fail("Phase 13B explanation modes are missing from the problem workspace.");
}
if (!problemWorkspaceRepositorySource.includes('"mh_get_problem_workspace"')) {
  fail("problem-workspace-repository.js must load workspace state through mh_get_problem_workspace().");
}
if (!problemWorkspaceRepositorySource.includes('"mh_save_content_workspace"')) {
  fail("problem-workspace-repository.js must save workspace state through mh_save_content_workspace().");
}
if (!problemWorkspaceModelSource.includes("buildProblemRecommendations")) {
  fail("problem-workspace-model.js must provide recommendations.");
}
if (!problemWorkspaceCss.includes(".mh-problem-layout")) {
  fail("Phase 13B problem workspace layout styles are missing.");
}
if (!appSource.includes("getProblems: () => DATA.problems")) {
  fail("app.js must pass the catalog to the Phase 13B problem workspace.");
}


// Stability reset: browser recovery, diagnostics, storage isolation and race guards.
if (!indexHtml.includes('src="/js/runtime-diagnostics.js"') || !profileHtml.includes('src="/js/runtime-diagnostics.js"')) {
  fail("Runtime diagnostics must be loaded on both application pages.");
}
if (!appSource.includes('from "./browser-state.js"')) {
  fail("app.js must use the safe browser-state helpers.");
}
if (!browserStateSource.includes("safeReadJson") || !browserStateSource.includes("scopedStorageKey")) {
  fail("browser-state.js must expose safe parsing and per-user key helpers.");
}
if (!runtimeDiagnosticsSource.includes("unhandledrejection") || !runtimeDiagnosticsSource.includes("MathHardDiagnostics")) {
  fail("runtime-diagnostics.js must capture async failures and expose sanitized reports.");
}
if (/JSON\.parse\(localStorage\.getItem\(["']mh_(?:attempts|quiz_attempts|today_training)/.test(appSource)) {
  fail("app.js must not parse legacy global progress storage directly.");
}
if (/console\.log\(["'](?:AUTH EVENT:|GET USER RESULT:|LOGIN RESULT:|SIGNUP RESULT:|DELETE FUNCTION RESULT:)/.test(profileSource) || profileSource.includes("globalThis.supabase =")) {
  fail("profile.js must not expose sessions or sensitive auth diagnostics in the console.");
}
if (/if\s*\(\s*!timedOut\s*\)\s*await\s+persistAllLocalAnswers/.test(appSource) || !appSource.includes("await persistAllLocalAnswers();")) {
  fail("Secure exam submission must flush the latest answers even on timeout.");
}
if (!contentRepositorySource.includes("loadEpoch") || !contentRepositorySource.includes("CACHE_TTL_MS")) {
  fail("Content loading must protect cache TTL and stale request races.");
}
if (!roadmapRepositorySource.includes("loadEpoch")) {
  fail("Roadmap loading must protect against stale request overwrites.");
}
if (!secureProblemControllerSource.includes("workspaceSaveChain") || !secureProblemControllerSource.includes("Array.isArray(attempts[problem.id])")) {
  fail("Problem workspace saves and legacy attempt fallbacks must be race-safe.");
}
if (indexHtml.includes('/img/preview.png')) {
  fail("Open Graph image points to a removed asset.");
}


if (!appShellSource.includes('href="${item.href}"') || !appShellSource.includes('{ route: "profile"')) {
  fail("Phase 14A hotfix must expose Profile in the desktop app shell.");
}
if (!appShellSource.includes("mhAdminFloatingClose") || !appShellSource.includes("bindAdminClose")) {
  fail("Phase 14A hotfix must provide a persistent Admin close control.");
}
if (!appShellCss.includes(".mh-admin-floating-close") || !appShellCss.includes("border-radius: 18px")) {
  fail("Phase 14A hotfix must include rounded navigation and Admin close styles.");
}
if (!appShellSource.includes("button.hidden === false") ||
    !appShellSource.includes('button.getAttribute("aria-hidden") === "false"') ||
    !appShellCss.includes(".mh-shell-nav-button[hidden]")) {
  fail("Phase 14A.2 Admin navigation must remain fail-closed until role verification completes.");
}
if (!appShellSource.includes("bindExclusiveFullscreenSurfaces") ||
    !appShellCss.includes("body.mh-content-workspace-open") ||
    !appShellCss.includes("#drawer.open") ||
    !appShellCss.includes("z-index: 260")) {
  fail("Phase 14A.2 must isolate lesson, problem and exam workspaces above the app shell.");
}
if (!appShellCss.includes("body.mh-shell-ready #mhBoss") ||
    !appShellCss.includes("display: none !important")) {
  fail("Phase 14A.2 must remove the redundant quick-training block from Home.");
}
if (quickNavSource.includes('{ key: "boss"')) {
  fail("Phase 14A.2 quick navigation must not expose the removed quick-training block.");
}

if (!learningWorkspaceControllerSource.includes('is-problem-workspace') ||
    !learningWorkspaceControllerSource.includes('is-lesson-workspace')) {
  fail("Phase 14A.3 must expose explicit lesson/problem workspace classes.");
}
if (!problemWorkspaceCss.includes('.drawer.is-problem-workspace .panel .content.viewer') ||
    !problemWorkspaceCss.includes('@media (max-width: 1120px)') ||
    !problemWorkspaceCss.includes('grid-template-columns: minmax(0, 1fr) minmax(270px, 320px)')) {
  fail("Phase 14A.3 problem workspace responsive isolation is incomplete.");
}

if (!appSource.includes("attachMathToolbar: mhAttachMathToolbar") ||
    !secureProblemControllerSource.includes('attachMathToolbar?.(input, host.querySelector("#answerMathToolbar"))')) {
  fail("Phase 14A.4 must restore the interactive math toolbar in the secure problem workspace.");
}
if (!appSource.includes('class="mh-math-toolbar-master"') ||
    !problemWorkspaceCss.includes('.mh-math-toolbar-master')) {
  fail("Phase 14A.4 math operations keyboard markup or styles are missing.");
}
if (!problemWorkspaceCss.includes('.drawer.is-problem-workspace > .panel > header') ||
    !problemWorkspaceCss.includes('grid-template-rows: auto minmax(0, 1fr)') ||
    !problemWorkspaceCss.includes('.drawer.is-problem-workspace > .panel > .content:not(.viewer)')) {
  fail("Phase 14A.4 must replace the overlapping problem header with a dedicated two-row surface.");
}


// Phase 15A: server-backed mastery and analytics workspace.
if (!indexHtml.includes('href="css/analytics.css"')) {
  fail("Phase 15A analytics stylesheet is missing from index.html.");
}
if (!appShellSource.includes('"analytics"') ||
    !appShellSource.includes('id="mhShellPanelAnalytics"') ||
    !appShellSource.includes("mh:analytics-route")) {
  fail("Phase 15A Analytics route or app-shell workspace is incomplete.");
}
if (!analyticsRepositorySource.includes('"mh_get_user_analytics"')) {
  fail("analytics-repository.js must load server-backed analytics through mh_get_user_analytics().");
}
if (!analyticsModelSource.includes("buildAnalyticsInsights") ||
    !analyticsModelSource.includes("aggregateDailyActivity") ||
    !analyticsModelSource.includes("heatLevel")) {
  fail("analytics-model.js is missing mastery or chart helpers.");
}
if (!analyticsControllerSource.includes("mh-analytics-heatmap") ||
    !analyticsControllerSource.includes("mh-analytics-chapters") ||
    !analyticsControllerSource.includes("supabase.auth.onAuthStateChange")) {
  fail("analytics-controller.js must render heatmap/mastery and react to authentication changes.");
}
if (!analyticsCss.includes(".mh-analytics-summary-grid") ||
    !analyticsCss.includes(".mh-analytics-heatmap") ||
    !analyticsCss.includes(".mh-analytics-donut")) {
  fail("Phase 15A analytics visual system is incomplete.");
}

// Phase 16: server-backed levels, achievements, challenge and opt-in leaderboard.
if (!indexHtml.includes('href="css/gamification.css"') ||
    !indexHtml.includes('/js/gamification-controller.js')) {
  fail("Phase 16 gamification assets are missing from index.html.");
}
if (!appShellSource.includes('"gamification"') ||
    !appShellSource.includes('id="mhShellPanelGamification"') ||
    !appShellSource.includes("mh:gamification-route")) {
  fail("Phase 16 gamification route or app-shell workspace is incomplete.");
}
if (!gamificationRepositorySource.includes('"mh_get_gamification_dashboard"') ||
    !gamificationRepositorySource.includes('"mh_set_daily_goal"') ||
    !gamificationRepositorySource.includes('"mh_set_leaderboard_opt_in"') ||
    !gamificationRepositorySource.includes('"mh_claim_weekly_challenge"')) {
  fail("gamification-repository.js must use all Phase 16 secure RPCs.");
}
if (!gamificationModelSource.includes("normalizeGamificationPayload") ||
    !gamificationModelSource.includes("achievementProgress") ||
    !gamificationModelSource.includes("levelRemaining")) {
  fail("gamification-model.js is missing normalization or progress helpers.");
}
if (!gamificationControllerSource.includes("mh-game-achievements-grid") ||
    !gamificationControllerSource.includes("mh-game-leaderboard") ||
    !gamificationControllerSource.includes("supabase.auth.onAuthStateChange")) {
  fail("gamification-controller.js must render achievements/leaderboard and react to auth changes.");
}
if (!gamificationCss.includes(".mh-game-level-card") ||
    !gamificationCss.includes(".mh-game-achievements-grid") ||
    !gamificationCss.includes(".mh-game-leaderboard-row")) {
  fail("Phase 16 gamification visual system is incomplete.");
}



// Phase 17A: Admin Studio must be a separated, searchable workspace.
if (!indexHtml.includes('href="css/admin-studio.css"')) {
  fail("Phase 17A Admin Studio stylesheet is missing from index.html.");
}
for (const requiredAdminId of [
  "mhAdminStudio",
  "mhAdminSearch",
  "mhAdminGradeFilter",
  "mhAdminChapterFilter",
  "mhAdminDifficultyFilter",
  "mhAdminSort",
  "mhAdminList",
  "mhRoadmapAdminStudio"
]) {
  if (!indexHtml.includes(`id="${requiredAdminId}"`)) {
    fail(`Phase 17A Admin Studio is missing #${requiredAdminId}.`);
  }
}
if (!appSource.includes('from "./admin-studio-controller.js"')) {
  fail("app.js must import the Phase 17A Admin Studio controller.");
}
if (!adminStudioSource.includes("filterAdminItems") || !adminStudioSource.includes("suggestDuplicateId")) {
  fail("Phase 17A Admin Studio must provide filtering and safe duplicate IDs.");
}
if (!adminStudioCss.includes(".mh-admin-studio") || !adminStudioCss.includes(".mh-admin-content-list")) {
  fail("Phase 17A Admin Studio CSS is incomplete.");
}
if (!indexHtml.includes('id="block-title"')) {
  fail("Phase 17A shared lesson/problem title fields are missing from the editor.");
}


// Phase 17B: Admin-managed achievements, manual challenges and automation templates.
if (!indexHtml.includes('href="css/gamification-studio.css"') ||
    !indexHtml.includes('data-admin-panel-target="gamification"') ||
    !indexHtml.includes('id="mhGamificationAdminStudio"')) {
  fail("Phase 17B Gamification Studio shell is incomplete.");
}
if (!appSource.includes('from "./gamification-admin-controller.js"') ||
    !appSource.includes('panelName === "gamification"')) {
  fail("app.js must initialize Phase 17B Gamification Studio on demand.");
}
if (!gamificationAdminRepositorySource.includes('mh_admin_get_gamification_studio') ||
    !gamificationAdminRepositorySource.includes('mh_admin_upsert_achievement') ||
    !gamificationAdminRepositorySource.includes('mh_admin_upsert_challenge') ||
    !gamificationAdminRepositorySource.includes('mh_admin_generate_challenge')) {
  fail("Phase 17B repository is missing secure Admin RPCs.");
}
if (!gamificationAdminModelSource.includes('normalizeAchievementDraft') ||
    !gamificationAdminModelSource.includes('normalizeChallengeDraft') ||
    !gamificationAdminModelSource.includes('normalizeTemplateDraft')) {
  fail("Phase 17B gamification draft normalization is incomplete.");
}
if (!gamificationAdminControllerSource.includes('data-gamification-tab="achievements"') ||
    !gamificationAdminControllerSource.includes('data-gamification-tab="challenges"') ||
    !gamificationAdminControllerSource.includes('data-gamification-tab="automation"')) {
  fail("Phase 17B controller must expose achievements, challenges and automation tabs.");
}
if (!gamificationStudioCss.includes('.mh-gamification-admin-layout') ||
    !gamificationStudioCss.includes('.mh-gamification-admin-editor')) {
  fail("Phase 17B Gamification Studio CSS is incomplete.");
}
if (!gamificationRepositorySource.includes('mh_get_gamification_dashboard_v2')) {
  fail("Phase 17B user gamification must load reward and rarity metadata through dashboard v2.");
}



// Phase 17C: atomic roadmap ordering, dependency-safe deletes and Admin history.
if (!indexHtml.includes('href="css/admin-history.css"') ||
    !indexHtml.includes('data-admin-panel-target="history"') ||
    !indexHtml.includes('id="mhAdminHistoryStudio"') ||
    !indexHtml.includes('id="mhAdminGlobalSearch"')) {
  fail("Phase 17C Admin history or global search shell is incomplete.");
}
if (!appSource.includes('from "./admin-history-controller.js"') ||
    !appSource.includes("getAdminContentUsage") ||
    !appSource.includes("deleteAdminContentSafely")) {
  fail("Phase 17C app integration must use version history and dependency-safe deletes.");
}
if (!roadmapRepositorySource.includes('mh_admin_save_roadmap_positions') ||
    !roadmapRepositorySource.includes('mh_admin_validate_roadmap')) {
  fail("Phase 17C roadmap ordering and validation must be server-side and atomic.");
}
if (!adminHistoryRepositorySource.includes('mh_admin_get_audit_log') ||
    !adminHistoryRepositorySource.includes('mh_admin_restore_version') ||
    !adminHistoryRepositorySource.includes('mh_admin_get_content_usage')) {
  fail("Phase 17C Admin history repository is missing secure RPCs.");
}
if (!adminHistoryModelSource.includes("changedFields") ||
    !adminHistoryControllerSource.includes("data-admin-restore-version") ||
    !adminHistoryCss.includes(".mh-admin-history-layout")) {
  fail("Phase 17C Admin history UI or diff model is incomplete.");
}

// Phase 17C.2: distinct Read / Learned lesson states and gated lesson checks.
if (!indexHtml.includes('href="css/lesson-status.css"')) {
  fail("Phase 17C.2 lesson-status stylesheet is missing from index.html.");
}
if (!appSource.includes('from "./lesson-status-repository.js"') ||
    !appSource.includes("startLessonReadTracking") ||
    !appSource.includes("completeLessonQuizSafe") ||
    !appSource.includes("Verificare blocată")) {
  fail("Phase 17C.2 lesson Read / Learned flow is incomplete in app.js.");
}
if (!appProgressSource.includes("export let readSet") ||
    !appProgressSource.includes("markLessonReadSafe") ||
    !appProgressSource.includes("completeLessonQuizSafe")) {
  fail("Phase 17C.2 lesson status state is missing from app-progress.js.");
}
if (!appProgressSource.includes("lessonTimerSecondsRemaining") ||
    !appProgressSource.includes("waitForLessonTimer") ||
    !appProgressSource.includes("secondsRemaining > 0")) {
  fail("Phase 17C.2.2 must retry lesson read completion using the server timer.");
}
if (!appSource.includes("const serverDurationMs=eligibleAt-startedAt") ||
    !appSource.includes("Date.now()+serverDurationMs")) {
  fail("Phase 17C.2.2 must derive the lesson countdown from server duration, not device clock skew.");
}
if (!lessonStatusRepositorySource.includes('"mh_start_lesson_reading"') ||
    !lessonStatusRepositorySource.includes('"mh_mark_lesson_read"') ||
    !lessonStatusRepositorySource.includes('"mh_complete_lesson_quiz"')) {
  fail("Phase 17C.2 lesson status repository is missing secure RPCs.");
}
if (!roadmapModelSource.includes("readSet") ||
    !roadmapControllerSource.includes('"Citită"') ||
    !lessonStatusCss.includes(".mh-lesson-status-chip") ||
    !lessonStatusCss.includes(".mh-roadmap-node.is-read")) {
  fail("Phase 17C.2 lesson status visual integration is incomplete.");
}
if (!appSource.includes("roadmapController?.refreshProgress(); mhUpdateLessonDrawerButtons();") ||
    appSource.indexOf("setLessonOnlyActionsVisible(true);") > appSource.indexOf("mhUpdateLessonDrawerButtons();", appSource.indexOf("setLessonOnlyActionsVisible(true);"))) {
  fail("Phase 17C.2.4 must reconcile the open lesson verification button after progress changes.");
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("MathHard validation passed.");
}
