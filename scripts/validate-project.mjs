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
  "js/concept-model.js",
  "js/concept-repository.js",
  "js/concept-admin-controller.js",
  "js/content-quality-model.js",
  "js/content-quality-repository.js",
  "js/content-quality-admin-controller.js",
  "js/content-publication-model.js",
  "js/content-publication-repository.js",
  "js/progress-repository.js",
  "js/lesson-status-repository.js",
  "js/lesson-quiz-model.js",
  "js/lesson-quiz-repository.js",
  "js/lesson-quiz-controller.js",
  "js/lesson-quiz-admin-controller.js",
  "js/runtime-config.js",
  "js/content-model.js",
  "js/answer-engine.js",
  "js/mutation-queue.js",
  "js/profile-model.js",
  "js/profile-text.js",
  "js/profile-experience-model.js",
  "js/profile-experience-controller.js",
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
  "js/chapter-completion-controller.js",
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
  "js/beta-readiness-controller.js",
  "js/system-page.js",
  "js/runtime-loader.js",
  "js/performance-bootstrap.js",
  "js/app-shell-controller.js",
  "js/analytics-model.js",
  "js/concept-mastery-model.js",
  "js/concept-mastery-repository.js",
  "js/concept-retention-model.js",
  "js/concept-retention-repository.js",
  "js/analytics-repository.js",
  "js/analytics-controller.js",
  "js/ui-feedback.js",
  "js/onboarding-controller.js",
  "js/gamification-model.js",
  "js/gamification-repository.js",
  "js/gamification-controller.js",
  "js/admin-studio-controller.js",
  "js/admin-draft-controller.js",
  "js/gamification-admin-model.js",
  "js/gamification-admin-repository.js",
  "js/gamification-admin-controller.js",
  "js/admin-history-model.js",
  "js/admin-history-repository.js",
  "js/admin-history-controller.js",
  "js/community-profile-model.js",
  "js/community-profile-repository.js",
  "js/community-profile-settings-controller.js",
  "js/community-profile-page.js",
  "js/community-feedback-model.js",
  "js/community-feedback-repository.js",
  "js/community-feedback-controller.js",
  "js/community-leaderboard-model.js",
  "js/community-leaderboard-repository.js",
  "js/community-leaderboard-controller.js",
  "js/community-admin-model.js",
  "js/community-integrity-model.js",
  "js/community-admin-controller.js",
  "js/microinteraction-engine.js",
  "js/microinteractions-bootstrap.js",
  "js/microinteractions-react-island.js"
];

const classicJsFiles = [
  "js/animation-numberline.js",
  "js/katex-init.js",
  "js/loading-screen.js"
];

const requiredFiles = [
  "package.json",
  "index.html",
  "profile.html",
  "u.html",
  "README.md",
  "css/roadmap.css",
  "css/chapter-completion.css",
  "css/roadmap-studio.css",
  "css/learning-workspace.css",
  "css/problem-workspace.css",
  "css/concepts.css",
  "css/concept-studio.css",
  "css/content-quality-studio.css",
  "css/lesson-status.css",
  "css/lesson-quiz-admin.css",
  "css/quick-nav.css",
  "css/section-layout.css",
  "css/app-shell.css",
  "css/analytics.css",
  "css/gamification.css",
  "css/admin-studio.css",
  "css/gamification-studio.css",
  "css/admin-history.css",
  "css/profile.css",
  "css/community-profile.css",
  "css/community-feedback.css",
  "css/community-leaderboard.css",
  "css/community-admin.css",
  "css/loading-screen.css",
  "css/ui-feedback.css",
  "css/beta-readiness.css",
  "css/microinteractions.css",
  "css/onboarding.css",
  "css/system-page.css",
  "css/mobile-hardening.css",
  "404.html",
  "offline.html",
  "netlify.toml",
  "site.webmanifest",
  "robots.txt",
  "sitemap.xml",
  "data/microinteractions.json",
  "img/microinteractions-sprite.svg",
  "src/microinteractions/microinteraction-engine.ts",
  "tsconfig.microinteractions.json",
  "scripts/run-all-audits.mjs",
  "scripts/runtime-contract-audit.mjs",
  "scripts/test-repositories.mjs",
  "scripts/performance-audit.mjs",
  "scripts/stability-audit.mjs",
  "scripts/concept-layer-audit.mjs",
  "scripts/concept-coverage-audit.mjs",
  "scripts/concept-mastery-audit.mjs",
  "scripts/concept-retention-audit.mjs",
  "scripts/content-quality-audit.mjs",
  "scripts/publication-workflow-audit.mjs",
  "scripts/frontend-experience-audit.mjs",
  "scripts/debug-audit.mjs",
  "scripts/community-profile-audit.mjs",
  "scripts/community-leaderboard-audit.mjs",
  "scripts/community-feedback-audit.mjs",
  "scripts/community-safety-integrity-audit.mjs",
  "scripts/beta-readiness-audit.mjs",
  "scripts/microinteractions-audit.mjs",
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
  "u.html",
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
  /Șterge override/i,
  /window\.DATA_QUIZZES/
];

let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

try {
  const packageConfig = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  if (packageConfig.type !== "module") {
    fail('package.json must declare "type": "module" so Node can import browser ES modules during audits.');
  }
} catch (error) {
  fail(`Invalid package.json: ${error.message}`);
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
    const importSpecifier = match[1];
    const filesystemSpecifier = importSpecifier.split(/[?#]/, 1)[0];
    const importedPath = resolve(root, dirname(relativePath), filesystemSpecifier);
    if (!existsSync(importedPath)) {
      fail(`${relativePath} imports missing module: ${importSpecifier}`);
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
const publicProfileHtml = readFileSync(resolve(root, "u.html"), "utf8");
const communityProfileModelSource = readFileSync(resolve(root, "js/community-profile-model.js"), "utf8");
const communityProfileRepositorySource = readFileSync(resolve(root, "js/community-profile-repository.js"), "utf8");
const communityProfilePageSource = readFileSync(resolve(root, "js/community-profile-page.js"), "utf8");
const communityLeaderboardModelSource = readFileSync(resolve(root, "js/community-leaderboard-model.js"), "utf8");
const communityLeaderboardRepositorySource = readFileSync(resolve(root, "js/community-leaderboard-repository.js"), "utf8");
const communityLeaderboardControllerSource = readFileSync(resolve(root, "js/community-leaderboard-controller.js"), "utf8");
const communityProfileSettingsSource = readFileSync(resolve(root, "js/community-profile-settings-controller.js"), "utf8");
const communityIntegrityModelSource = readFileSync(resolve(root, "js/community-integrity-model.js"), "utf8");
const communityAdminControllerSource = readFileSync(resolve(root, "js/community-admin-controller.js"), "utf8");
const appSource = readFileSync(resolve(root, "js/app.js"), "utf8");
const profileSource = readFileSync(resolve(root, "js/profile.js"), "utf8");
const contentRepositorySource = readFileSync(resolve(root, "js/content-repository.js"), "utf8");
const contentModelSource = readFileSync(resolve(root, "js/content-model.js"), "utf8");
const conceptModelSource = readFileSync(resolve(root, "js/concept-model.js"), "utf8");
const conceptRepositorySource = readFileSync(resolve(root, "js/concept-repository.js"), "utf8");
const conceptAdminControllerSource = readFileSync(resolve(root, "js/concept-admin-controller.js"), "utf8");
const conceptsCss = readFileSync(resolve(root, "css/concepts.css"), "utf8");
const conceptStudioCss = readFileSync(resolve(root, "css/concept-studio.css"), "utf8");
const answerEngineSource = readFileSync(resolve(root, "js/answer-engine.js"), "utf8");
const mutationQueueSource = readFileSync(resolve(root, "js/mutation-queue.js"), "utf8");
const profileModelSource = readFileSync(resolve(root, "js/profile-model.js"), "utf8");
const profileTextSource = readFileSync(resolve(root, "js/profile-text.js"), "utf8");
const profileExperienceModelSource = readFileSync(resolve(root, "js/profile-experience-model.js"), "utf8");
const profileExperienceControllerSource = readFileSync(resolve(root, "js/profile-experience-controller.js"), "utf8");
const profileCss = readFileSync(resolve(root, "css/profile.css"), "utf8");
const appProgressSource = readFileSync(resolve(root, "js/app-progress.js"), "utf8");
const authUiControllerSource = readFileSync(resolve(root, "js/auth-ui-controller.js"), "utf8");
const adminContentModelSource = readFileSync(resolve(root, "js/admin-content-model.js"), "utf8");
const examSessionStateSource = readFileSync(resolve(root, "js/exam-session-state.js"), "utf8");
const progressRepositorySource = readFileSync(resolve(root, "js/progress-repository.js"), "utf8");
const lessonStatusRepositorySource = readFileSync(resolve(root, "js/lesson-status-repository.js"), "utf8");
const lessonQuizModelSource = readFileSync(resolve(root, "js/lesson-quiz-model.js"), "utf8");
const lessonQuizRepositorySource = readFileSync(resolve(root, "js/lesson-quiz-repository.js"), "utf8");
const lessonQuizControllerSource = readFileSync(resolve(root, "js/lesson-quiz-controller.js"), "utf8");
const lessonQuizAdminControllerSource = readFileSync(resolve(root, "js/lesson-quiz-admin-controller.js"), "utf8");
const adminDraftControllerSource = readFileSync(resolve(root, "js/admin-draft-controller.js"), "utf8");
const adminStudioControllerSource = readFileSync(resolve(root, "js/admin-studio-controller.js"), "utf8");
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
const lessonQuizAdminCss = readFileSync(resolve(root, "css/lesson-quiz-admin.css"), "utf8");
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
const mobileHardeningCss = readFileSync(resolve(root, "css/mobile-hardening.css"), "utf8");
const browserStateSource = readFileSync(resolve(root, "js/browser-state.js"), "utf8");
const runtimeDiagnosticsSource = readFileSync(resolve(root, "js/runtime-diagnostics.js"), "utf8");
const runtimeLoaderSource = readFileSync(resolve(root, "js/runtime-loader.js"), "utf8");
const performanceBootstrapSource = readFileSync(resolve(root, "js/performance-bootstrap.js"), "utf8");
const analyticsModelSource = readFileSync(resolve(root, "js/analytics-model.js"), "utf8");
const conceptMasteryModelSource = readFileSync(resolve(root, "js/concept-mastery-model.js"), "utf8");
const conceptMasteryRepositorySource = readFileSync(resolve(root, "js/concept-mastery-repository.js"), "utf8");
const conceptRetentionModelSource = readFileSync(resolve(root, "js/concept-retention-model.js"), "utf8");
const conceptRetentionRepositorySource = readFileSync(resolve(root, "js/concept-retention-repository.js"), "utf8");
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
const buildStaticSiteSource = readFileSync(resolve(root, "scripts/build-static-site.mjs"), "utf8");

if (!/id=["']adminBtn["'][^>]*\bhidden\b/i.test(indexHtml)) {
  fail("Admin button must be hidden by default in index.html.");
}
if (!buildStaticSiteSource.includes('admin-studio.html') ||
    !buildStaticSiteSource.includes('id="mhAdminMount"') ||
    !buildStaticSiteSource.includes("Admin Studio removed from the public HTML")) {
  fail("Production build must extract Admin Studio from the public index HTML.");
}
if (!appSource.includes('from "./content-repository.js"')) {
  fail("app.js must use content-repository.js.");
}
if (!appSource.includes("loadContentCatalog")) {
  fail("app.js must load the Supabase catalog through loadContentCatalog().");
}
if (!appSource.includes('from "./concept-repository.js"') ||
    !appSource.includes('from "./concept-model.js"') ||
    !appSource.includes("refreshConceptCatalog") ||
    !appSource.includes("renderContentConceptDetails")) {
  fail("app.js must integrate the canonical Concept Layer without replacing the content catalog.");
}
if (!conceptRepositorySource.includes('"mh_get_concept_catalog"') ||
    !conceptRepositorySource.includes('"mh_get_public_concept_catalog"') ||
    !conceptRepositorySource.includes('supabase.rpc("mh_admin_replace_content_concepts"')) {
  fail("Concept repository is missing the authenticated/public read contract or mapping RPC.");
}
if (!conceptModelSource.includes("normalizeConceptCatalog") ||
    !conceptModelSource.includes("renderContentConceptDetails") ||
    !conceptsCss.includes(".mh-concept-disclosure")) {
  fail("Concept details must be normalized and hidden behind progressive disclosure.");
}
if (!conceptAdminControllerSource.includes("createConceptAdminController") ||
    !conceptStudioCss.includes(".mh-concept-admin-shell") ||
    !indexHtml.includes('id="mhConceptAdminStudio"')) {
  fail("Admin Studio must expose the Concept Layer editor.");
}
if (!appSource.includes('from "./progress-repository.js"')) {
  fail("app.js must use progress-repository.js.");
}
if (!appSource.includes('from "./secure-evaluation-repository.js"')) {
  fail("app.js must use the Phase 11A secure learning-event repository.");
}
if (!appSource.includes('from "./secure-problem-controller.js?v=4j5"')) {
  fail("app.js must use the Phase 11A secure problem controller.");
}
if (!appSource.includes('from "./secure-exam-repository.js"')) {
  fail("app.js must use the Phase 11B secure exam repository.");
}
if (!secureExamRepositorySource.includes('"mh_start_exam_session"')) {
  fail("secure-exam-repository.js must start official/replay exams through mh_start_exam_session().");
}
if (!secureExamRepositorySource.includes('"mh_get_active_exam_session"')) {
  fail("secure-exam-repository.js must restore official/replay exams through mh_get_active_exam_session().");
}
if (!secureExamRepositorySource.includes('"mh_save_exam_session_answer"')) {
  fail("secure-exam-repository.js must autosave official/replay answers through mh_save_exam_session_answer().");
}
if (!secureExamRepositorySource.includes('"mh_submit_exam_session"')) {
  fail("secure-exam-repository.js must submit official/replay exams through mh_submit_exam_session().");
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
if (!profileSource.includes('from "./profile-experience-controller.js"') ||
    !profileSource.includes("renderProfileExperience")) {
  fail("Profile v2 must render its overview through the extracted experience controller.");
}
if (!profileHtml.includes('data-profile-tab="overview"') ||
    !profileHtml.includes('data-profile-tab="progress"') ||
    !profileHtml.includes('data-profile-tab="activity"') ||
    !profileHtml.includes('data-profile-tab="account"') ||
    !profileHtml.includes('id="profileCompletionRing"') ||
    !profileHtml.includes('id="profileContinueBtn"')) {
  fail("Phase 17D profile tabs, completion spotlight or Continue action are missing.");
}
if (!profileExperienceModelSource.includes("calculateOverallCompletion") ||
    !profileExperienceModelSource.includes("calculateLevelState") ||
    !profileExperienceControllerSource.includes("mh_profile_active_tab_v2") ||
    !profileExperienceControllerSource.includes("mh_active_workspace_v1")) {
  fail("Phase 17D profile summary or persistent navigation model is incomplete.");
}
if (!profileCss.includes(".profile-completion-ring") ||
    !profileCss.includes(".profile-tabs") ||
    !profileCss.includes(".profile-focus-card")) {
  fail("Phase 17D profile visual system is incomplete.");
}
if (!contentRepositorySource.includes('"mh_get_content_catalog"') ||
    !contentRepositorySource.includes('"mh_get_public_content_catalog"') ||
    !contentRepositorySource.includes('const GUEST_SCOPE = "__guest__"')) {
  fail("content-repository.js must separate authenticated and student-safe guest catalog RPCs.");
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
if (!adminStudioSource.includes('source: "Catalog"')) {
  fail("Admin must expose the canonical catalogue as the single content source.");
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
if (!profileHtml.includes('data-profile-tab="community"') || !profileHtml.includes('id="communityProfileForm"')) {
  fail("Phase 4A community profile editor is missing from profile.html.");
}
if (!publicProfileHtml.includes('id="communityPublicContent"') || !publicProfileHtml.includes('/js/community-profile-page.js')) {
  fail("Phase 4A public profile page is incomplete.");
}
if (!communityProfileModelSource.includes("COMMUNITY_PRIVACY_KEYS") || !communityProfileModelSource.includes("show_personality")) {
  fail("Community profile model must centralize profile privacy, including personality fields.");
}
if (!communityProfileRepositorySource.includes("mh_get_public_community_profile") || communityProfileRepositorySource.includes(".from(")) {
  fail("Community profiles must use the sanitized RPC contract instead of direct table reads.");
}
if (!communityProfilePageSource.includes("profile.privacy.show_activity") || !communityProfilePageSource.includes("profile.privacy.show_personality")) {
  fail("Public profiles must honor activity and personality privacy switches.");
}
if (!communityAdminControllerSource.includes("mhCommunityAssignmentForm") || !communityAdminControllerSource.includes('assignmentMode === "manual"')) {
  fail("Community Admin must expose controlled manual badge assignment.");
}
if (!indexHtml.includes('data-admin-panel-target="community"') || !indexHtml.includes('id="mhCommunityAdminStudio"')) {
  fail("Phase 4A Community workspace is missing from Admin Studio.");
}
if (!indexHtml.includes("css/community-leaderboard.css")) {
  fail("Phase 4B leaderboard stylesheet is missing from index.html.");
}
if (!appShellSource.includes('id="mhShellPanelLeaderboards"') || !appShellSource.includes("mh:leaderboards-route")) {
  fail("Phase 4B leaderboard route is missing from the app shell.");
}
if (!performanceBootstrapSource.includes('leaderboards: "./community-leaderboard-controller.js"')) {
  fail("Phase 4B leaderboard controller must be lazy-loaded by route.");
}
if (!communityLeaderboardModelSource.includes("availableLeaderboardScopes") || !communityLeaderboardModelSource.includes("normalizeCommunityLeaderboard")) {
  fail("Phase 4B leaderboard model must centralize scope and payload normalization.");
}
if (!communityLeaderboardRepositorySource.includes("mh_get_community_leaderboard") || !communityLeaderboardRepositorySource.includes("mh_search_leaderboard_regions") || !communityLeaderboardRepositorySource.includes("mh_get_leaderboard_geography_options") || communityLeaderboardRepositorySource.includes(".from(")) {
  fail("Community leaderboard data must use sanitized leaderboard and geography RPC contracts.");
}
if (!communityLeaderboardControllerSource.includes("data-leaderboard-scope") || !communityLeaderboardControllerSource.includes("data-leaderboard-area-search") || !communityLeaderboardControllerSource.includes("mh-community-region-explorer") || !communityLeaderboardControllerSource.includes("mh-community-own-rank")) {
  fail("Community leaderboard discovery workspace is incomplete.");
}
if (/\sonerror\s*=/.test(communityLeaderboardControllerSource)) {
  fail("Phase 4B leaderboard avatars must not use inline event handlers.");
}
if (!communityProfileSettingsSource.includes("Array.from(form.elements)") || communityProfileSettingsSource.includes("new FormData(form)")) {
  fail("Community profile preview must read disabled form controls safely during save.");
}
if (!communityProfileSettingsSource.includes("normalizeLinkInputs") || !communityProfileModelSource.includes("normalizeProfileUrl")) {
  fail("Community profile links must be normalized before validation and save.");
}
if (!communityProfileRepositorySource.includes("mh_get_my_community_profile_v3") || !communityProfileRepositorySource.includes("mh_admin_get_community_integrity_v2")) {
  fail("Community safety and integrity RPC contracts are missing.");
}
if (!communityIntegrityModelSource.includes("normalizeCommunityIntegrityDashboard") || !communityIntegrityModelSource.includes("communityIntegrityUserDraft")) {
  fail("Community integrity model is incomplete.");
}
if (!communityAdminControllerSource.includes('data-community-tab="integrity"') || !communityAdminControllerSource.includes("mhCommunityIntegrityForm")) {
  fail("Community Integrity Admin workspace is missing.");
}
if (gamificationControllerSource.includes("renderLeaderboard(") || gamificationControllerSource.includes("gamificationLeaderboardOptIn")) {
  fail("The obsolete Rewards mini leaderboard must be removed after Phase 4B.");
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
const usesRoadmapControllerRuntime =
  appSource.includes('from "./roadmap-controller.js"') ||
  appSource.includes('import("./roadmap-controller.js")');
if (!usesRoadmapControllerRuntime || !appSource.includes('import("./roadmap-admin-controller.js")')) {
  fail("app.js must use the extracted Phase 12 roadmap controllers, with Admin loaded on demand.");
}
if (!appSource.includes("roadmapController?.refreshProgress()")) {
  fail("Roadmap progress must refresh when canonical lesson/problem/exam progress changes.");
}
if (!roadmapRepositorySource.includes('"mh_get_roadmap_catalog"') ||
    !roadmapRepositorySource.includes('"mh_get_public_roadmap_catalog"')) {
  fail("roadmap-repository.js must separate authenticated and public read-only roadmap RPCs.");
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
if (!roadmapAdminControllerSource.includes("Plan de studiu") || !roadmapAdminControllerSource.includes("replaceNodePrerequisites")) {
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


try {
  execFileSync(process.execPath, [resolve(root, "scripts/performance-audit.mjs")], {
    cwd: root,
    stdio: "pipe"
  });
} catch (error) {
  fail(`Performance audit failed.
${error.stdout?.toString() || ""}${error.stderr?.toString() || error.message}`);
}


try {
  execFileSync(process.execPath, [resolve(root, "scripts/stability-audit.mjs")], {
    cwd: root,
    stdio: "pipe"
  });
} catch (error) {
  fail(`Stability audit failed.
${error.stdout?.toString() || ""}${error.stderr?.toString() || error.message}`);
}


if (!indexHtml.includes('href="css/quick-nav.css"')) {
  fail("Quick navigation stylesheet is missing from index.html.");
}
if (!/src="\/js\/performance-bootstrap\.js(?:\?[^"]*)?"/.test(indexHtml) ||
    !performanceBootstrapSource.includes('./quick-nav-controller.js')) {
  fail("Quick navigation controller must be loaded through the performance bootstrap.");
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
if (!performanceBootstrapSource.includes('./section-layout-controller.js')) {
  fail("Section layout controller must be loaded through the performance bootstrap.");
}
if (!/href="css\/app-shell\.css(?:\?[^"]*)?"/.test(indexHtml)) {
  fail("Phase 14A app shell stylesheet is missing from index.html.");
}
if (!/src="\/js\/app-shell-controller\.js(?:\?[^"]*)?"/.test(indexHtml)) {
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
  fail("Plan de studiu Studio must receive the authenticated content catalog.");
}
if (!roadmapAdminControllerSource.includes("data-roadmap-quick-add") || !roadmapAdminControllerSource.includes("data-roadmap-drag-node")) {
  fail("Plan de studiu Studio must support quick catalog insertion and visual node movement.");
}
if (!roadmapAdminControllerSource.includes("patchRoadmapEntity") || !roadmapAdminControllerSource.includes("saveRoadmapPositions")) {
  fail("Plan de studiu Studio must persist inline edits and ordering through roadmap-repository.js.");
}
if (!roadmapAdminModelSource.includes("createRoadmapNodeId") || !roadmapAdminModelSource.includes("filterRoadmapContent")) {
  fail("roadmap-admin-model.js must own ID generation and catalog filtering.");
}
if (!learningWorkspaceControllerSource.includes("findNodeByContent") ||
    !learningWorkspaceControllerSource.includes("roadmapContentSequence") ||
    !learningWorkspaceControllerSource.includes("isRoadmapLocked") ||
    !learningWorkspaceCss.includes("is-learning-workspace")) {
  fail("Learning workspace must navigate within the current roadmap and preserve roadmap locks.");
}
if (!mobileHardeningCss.includes("MathHard Phase 100 — compact mobile content workspaces") ||
    !mobileHardeningCss.includes(".drawer.is-lesson-workspace > .panel > header") ||
    !mobileHardeningCss.includes(".drawer.is-exam-workspace .examTop") ||
    !mobileHardeningCss.includes("grid-template-columns: repeat(4, minmax(0, 1fr))") ||
    !learningWorkspaceControllerSource.includes('"is-exam-workspace"') ||
    !appSource.includes('classList.add("is-exam-workspace")')) {
  fail("Phase 100 mobile lesson/problem/exam workspace compaction is incomplete.");
}
if (!roadmapModelSource.includes('"completion:read"') ||
    !appSource.includes("Introducere finalizată") ||
    !appSource.includes("lessonCompletesOnRead")) {
  fail("Read-only introduction completion must be represented consistently in roadmap and lesson UI.");
}
if (!lessonQuizControllerSource.includes("requiredCorrect") ||
    !lessonQuizControllerSource.includes("Ai nevoie de minimum")) {
  fail("Lesson checks must show the concrete minimum correct-answer requirement.");
}
if (!roadmapStudioCss.includes("mh-roadmap-admin-quick-add")) {
  fail("Plan de studiu styling is incomplete.");
}


if (!indexHtml.includes('css/problem-workspace.css')) {
  fail("Phase 13B problem workspace stylesheet is missing from index.html.");
}
if (!secureProblemControllerSource.includes('"./problem-workspace-repository.js"')) {
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
if (!performanceBootstrapSource.includes('./runtime-diagnostics.js') ||
    !profileHtml.includes('src="/js/runtime-diagnostics.js"')) {
  fail("Runtime diagnostics must load lazily on index.html and directly on profile.html.");
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
if (!secureProblemControllerSource.includes('<section class="mh-problem-hero"') ||
    secureProblemControllerSource.includes('<header class="mh-problem-hero"') ||
    !secureProblemControllerSource.includes('id="mhProblemTitle"')) {
  fail("Problem summary must use a non-header section so legacy panel header styles cannot make it sticky.");
}
if (!problemWorkspaceCss.includes("Phase 4J.5 — one scroll layer for the complete problem") ||
    !problemWorkspaceCss.includes(".mh-problem-workspace > .mh-problem-hero") ||
    !problemWorkspaceCss.includes(".mh-problem-workspace > .mh-problem-layout") ||
    !problemWorkspaceCss.includes("position: static !important") ||
    !problemWorkspaceCss.includes("overflow-y: auto") ||
    !problemWorkspaceCss.includes("overflow: visible") ||
    !problemWorkspaceCss.includes("height: auto")) {
  fail("Problem workspace must use one scrolling layer and keep its summary in normal document flow.");
}
if (/\.mh-problem-workspace\s*>\s*\.mh-problem-hero[\s\S]{0,320}position:\s*sticky/.test(problemWorkspaceCss)) {
  fail("Problem summary must scroll naturally with the complete problem.");
}
if (/Phase 4J\.5[\s\S]*?\.mh-problem-workspace\s*>\s*\.mh-problem-layout[\s\S]{0,260}overflow-y:\s*auto/.test(problemWorkspaceCss)) {
  fail("Problem layout must not create a nested scrolling layer.");
}
if (indexHtml.includes('/img/preview.png')) {
  fail("Open Graph image points to a removed asset.");
}


if (!appShellSource.includes('href="${item.href}"') || !appShellSource.includes('{ route: "profile"')) {
  fail("Phase 14A hotfix must expose Profile in the desktop app shell.");
}
if (appShellSource.includes("mhAdminFloatingClose") || appShellSource.includes("mh-admin-floating-close") || appShellCss.includes(".mh-admin-floating-close")) {
  fail("The obsolete floating Admin close control must be removed completely.");
}
if (!appShellSource.includes("bindAdminDrawerState") || !appShellSource.includes('document.getElementById("closeAdmin")?.addEventListener("click", closeDrawer)')) {
  fail("The regular Admin drawer close action and state synchronization must remain available.");
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

// Product Phase 01C: server-derived concept mastery inside Analytics.
if (!conceptMasteryRepositorySource.includes('"mh_get_concept_mastery"') ||
    !conceptMasteryRepositorySource.includes("not_installed")) {
  fail("Concept mastery repository must use the secure RPC and tolerate frontend-first deploys.");
}
if (!conceptMasteryModelSource.includes("normalizeConceptMasteryPayload") ||
    !conceptMasteryModelSource.includes("buildConceptMasteryHighlights")) {
  fail("Concept mastery normalization or prioritization helpers are missing.");
}
if (!analyticsRepositorySource.includes("loadConceptMastery") ||
    !analyticsControllerSource.includes("renderConceptMastery") ||
    !analyticsControllerSource.includes("mh-analytics-concept-mastery")) {
  fail("Analytics is missing the Phase 01C concept mastery integration.");
}
if (!analyticsCss.includes(".mh-analytics-concept-mastery") ||
    !analyticsCss.includes(".mh-analytics-concept-row")) {
  fail("Phase 01C concept mastery styles are incomplete.");
}

// Product Phase 01D: derived retention and spaced review queue.
if (!conceptRetentionRepositorySource.includes('"mh_get_concept_retention"') ||
    !conceptRetentionRepositorySource.includes("not_installed")) {
  fail("Concept retention repository must use the secure RPC and tolerate frontend-first deploys.");
}
if (!conceptRetentionModelSource.includes("normalizeConceptRetentionPayload") ||
    !conceptRetentionModelSource.includes("buildConceptReviewQueue")) {
  fail("Concept retention normalization or queue helpers are missing.");
}
if (!analyticsRepositorySource.includes("loadConceptRetention") ||
    !analyticsControllerSource.includes("renderConceptRetention") ||
    !analyticsControllerSource.includes("mh-analytics-concept-retention")) {
  fail("Analytics is missing the Phase 01D concept retention integration.");
}
if (!analyticsCss.includes(".mh-analytics-concept-retention") ||
    !analyticsCss.includes(".mh-analytics-review-row")) {
  fail("Phase 01D concept retention styles are incomplete.");
}

// Phase 16: server-backed levels, achievements, challenge and opt-in leaderboard.
if (!indexHtml.includes('href="css/gamification.css"') ||
    !performanceBootstrapSource.includes('./gamification-controller.js')) {
  fail("Phase 16 gamification assets or lazy route loading are missing.");
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
    !gamificationControllerSource.includes("supabase.auth.onAuthStateChange")) {
  fail("gamification-controller.js must render rewards and react to auth changes.");
}
if (gamificationControllerSource.includes("mh-game-leaderboard") || gamificationControllerSource.includes("renderLeaderboard(")) {
  fail("The obsolete Rewards mini leaderboard must not be rendered after Phase 4B.");
}
if (!gamificationCss.includes(".mh-game-level-card") ||
    !gamificationCss.includes(".mh-game-achievements-grid")) {
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
if (!appSource.includes('import("./admin-studio-controller.js")')) {
  fail("app.js must lazy-load the Phase 17A Admin Studio controller.");
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
if (!appSource.includes('import("./gamification-admin-controller.js")') ||
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
if (!appSource.includes('import("./admin-history-controller.js")') ||
    !appSource.includes('import("./admin-history-repository.js")') ||
    !appSource.includes("getAdminContentUsage") ||
    !appSource.includes("deleteAdminContentSafely")) {
  fail("Phase 17C app integration must use lazy version history and dependency-safe deletes.");
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

// Phase 17C.3: secure lesson quizzes and Admin quiz editor.
if (!indexHtml.includes('href="css/lesson-quiz-admin.css"') ||
    !indexHtml.includes('id="mhLessonQuizAdmin"') ||
    !indexHtml.includes('data-lesson-editor-tab="quiz"')) {
  fail("Phase 17C.3 lesson quiz Admin shell is incomplete.");
}
if (!appSource.includes('from "./lesson-quiz-controller.js"') ||
    !appSource.includes('import("./lesson-quiz-admin-controller.js")') ||
    !appSource.includes("refreshLessonQuizAvailability") ||
    !appSource.includes("lessonQuizController.open")) {
  fail("Phase 17C.3 secure lesson quiz integration is incomplete in app.js.");
}
if (!lessonQuizRepositorySource.includes('mh_get_lesson_quiz_availability') ||
    !lessonQuizRepositorySource.includes('mh_start_lesson_quiz') ||
    !lessonQuizRepositorySource.includes('mh_submit_lesson_quiz') ||
    !lessonQuizRepositorySource.includes('mh_admin_save_lesson_quiz')) {
  fail("Phase 17C.3 lesson quiz repository is missing secure RPCs.");
}
if (!lessonQuizControllerSource.includes("submitSecureLessonQuiz") ||
    !lessonQuizAdminControllerSource.includes("validateAdminLessonQuiz") ||
    !lessonQuizModelSource.includes("normalizeQuizAvailability") ||
    !lessonQuizAdminCss.includes(".mh-lesson-quiz-admin-card")) {
  fail("Phase 17C.3 lesson quiz UI/model is incomplete.");
}
if (!lessonQuizRepositorySource.includes("mh_admin_set_lesson_quiz_published") ||
    !lessonQuizRepositorySource.includes("LESSON_QUIZ_PUBLICATION_MISMATCH") ||
    !lessonQuizAdminControllerSource.includes("data-quiz-admin-publish") ||
    !lessonQuizAdminControllerSource.includes("Verificarea a fost salvată și publicată") ||
    !lessonQuizModelSource.includes("buildAdminLessonQuizPayload") ||
    !lessonQuizAdminCss.includes(".mh-lesson-quiz-publication")) {
  fail("Phase 17C.3.1 lesson quiz publication confirmation is incomplete.");
}

// Phase 17C.3.2: persistent workspace and Admin draft recovery.
if (!appSource.includes('import("./admin-draft-controller.js")') ||
    !appSource.includes("restoreLastAdminEditorContext") ||
    !appSource.includes("adminStudioController?.restoreState()")) {
  fail("Phase 17C.3.2 persistent Admin workspace integration is incomplete.");
}
if (!adminDraftControllerSource.includes("mh_admin_content_draft_v2") ||
    !adminDraftControllerSource.includes("visibilitychange") ||
    !adminDraftControllerSource.includes("pagehide")) {
  fail("Phase 17C.3.2 Admin content draft recovery is incomplete.");
}
if (!adminStudioControllerSource.includes("mh_admin_studio_state_v2") ||
    !adminStudioControllerSource.includes("restoreState")) {
  fail("Phase 17C.3.2 Admin panel/filter persistence is incomplete.");
}
if (!lessonQuizAdminControllerSource.includes("mh_lesson_quiz_admin_draft_v1") ||
    !lessonQuizAdminControllerSource.includes("Draft local restaurat")) {
  fail("Phase 17C.3.2 lesson quiz draft recovery is incomplete.");
}
if (!profileSource.includes("mh_active_workspace_v1") ||
    !profileSource.includes("backHomeBtn")) {
  fail("Phase 17C.3.2 profile return route persistence is incomplete.");
}

// Phase 18A: clean loading screen controlled by application readiness.
const loadingScreenSource = readFileSync(resolve(root, "js/loading-screen.js"), "utf8");
const loadingScreenCss = readFileSync(resolve(root, "css/loading-screen.css"), "utf8");
const katexInitSource18A = readFileSync(resolve(root, "js/katex-init.js"), "utf8");
if (!indexHtml.includes('href="/css/loading-screen.css"') ||
    !indexHtml.includes('src="/js/loading-screen.js"') ||
    !indexHtml.includes('id="math-loader"') ||
    !profileHtml.includes('href="/css/loading-screen.css"') ||
    !profileHtml.includes('src="/js/loading-screen.js"') ||
    !profileHtml.includes('id="math-loader"')) {
  fail("Phase 18A loading screen must be shared by index.html and profile.html.");
}
if (!loadingScreenSource.includes("window.MathHardLoading") ||
    !loadingScreenSource.includes("slowThresholdMs") ||
    !loadingScreenSource.includes("prefers-reduced-motion") && !loadingScreenCss.includes("prefers-reduced-motion")) {
  fail("Phase 18A loading controller or reduced-motion fallback is incomplete.");
}
if (!appSource.includes("window.MathHardLoading?.ready()") ||
    !profileSource.includes("window.MathHardLoading?.ready()")) {
  fail("Phase 18A application and profile must explicitly complete their loading screens.");
}
if (katexInitSource18A.includes("math-loader") || katexInitSource18A.includes("loader-hidden")) {
  fail("KaTeX initialization must not control the application loading screen.");
}


// Phase 18B: unified UI states, connection feedback and first-user onboarding.
const uiFeedbackSource18B = readFileSync(resolve(root, "js/ui-feedback.js"), "utf8");
const onboardingSource18B = readFileSync(resolve(root, "js/onboarding-controller.js"), "utf8");
const uiFeedbackCss18B = readFileSync(resolve(root, "css/ui-feedback.css"), "utf8");
const onboardingCss18B = readFileSync(resolve(root, "css/onboarding.css"), "utf8");
const uiPreferencesSource18B = readFileSync(resolve(root, "js/ui-preferences-repository.js"), "utf8");
if (!indexHtml.includes('href="/css/ui-feedback.css"') ||
    !indexHtml.includes('href="/css/onboarding.css"') ||
    !indexHtml.includes('src="/js/ui-feedback.js"') ||
    !performanceBootstrapSource.includes('./onboarding-controller.js') ||
    !profileHtml.includes('href="/css/ui-feedback.css"') ||
    !profileHtml.includes('src="/js/ui-feedback.js"')) {
  fail("Phase 18B shared UI states or lazy onboarding are missing from the pages.");
}
if (!uiFeedbackSource18B.includes("normalizeUiError") ||
    !uiFeedbackSource18B.includes("renderUiState") ||
    !uiFeedbackSource18B.includes("initConnectionFeedback") ||
    !uiFeedbackCss18B.includes(".mh-ui-skeleton-grid") ||
    !uiFeedbackCss18B.includes(".mh-connection-banner")) {
  fail("Phase 18B UI feedback foundation is incomplete.");
}
if (!onboardingSource18B.includes("loadRoadmapCatalog") ||
    !onboardingSource18B.includes("selectRoadmap") ||
    !onboardingSource18B.includes("mh:onboarding-open") ||
    !onboardingCss18B.includes(".mh-onboarding-dialog")) {
  fail("Phase 18B onboarding must select a roadmap and support reopening.");
}
if (!uiPreferencesSource18B.includes("onboarding") ||
    !uiPreferencesSource18B.includes("version: 2") ||
    !onboardingSource18B.includes("localOnboarding.completed") ||
    !onboardingSource18B.includes("writeLocal(user.id, completion)")) {
  fail("Phase 18B.1 onboarding completion must survive refresh and older server preference sanitizers.");
}
const roadmapStudioCss18B1 = readFileSync(resolve(root, "css/roadmap-studio.css"), "utf8");
const adminStudioCss18B1 = readFileSync(resolve(root, "css/admin-studio.css"), "utf8");
if (!roadmapStudioCss18B1.includes("Phase 18B.1 — mobile Admin/Roadmap stacking fix") ||
    !roadmapStudioCss18B1.includes("position: static") ||
    !adminStudioCss18B1.includes("mobile Admin shell separated")) {
  fail("Phase 18B.1 mobile Admin/Roadmap overlap guard is missing.");
}
if (!existsSync(resolve(root, "404.html")) || !existsSync(resolve(root, "offline.html"))) {
  fail("Phase 18B 404 and offline pages are missing.");
}

// Phase 18C: mobile layout hardening and non-sensitive layout diagnostics.
const mobileCssReference = 'href="/css/mobile-hardening.css"';
if (!indexHtml.includes(mobileCssReference) || !profileHtml.includes(mobileCssReference)) {
  fail("Phase 18C mobile hardening stylesheet must be loaded by index.html and profile.html.");
}
const indexMobileCssPosition = indexHtml.indexOf(mobileCssReference);
const profileMobileCssPosition = profileHtml.indexOf(mobileCssReference);
if (indexMobileCssPosition < indexHtml.indexOf('href="css/gamification-studio.css"') ||
    profileMobileCssPosition < profileHtml.indexOf('href="/css/profile.css"')) {
  fail("Phase 18C mobile hardening stylesheet must be loaded after component stylesheets.");
}
if (!mobileHardeningCss.includes("Phase 18C — mobile layout hardening") ||
    !mobileHardeningCss.includes("body.mh-shell-ready > header") ||
    !mobileHardeningCss.includes(".mh-shell-workspace-kicker") ||
    !mobileHardeningCss.includes("#adminDrawer .mh-admin-topbar") ||
    !mobileHardeningCss.includes(".mh-lesson-quiz-option") ||
    !mobileHardeningCss.includes("@media (max-width: 380px)")) {
  fail("Phase 18C mobile hardening coverage is incomplete.");
}
const layoutDiagnosticsBlock = runtimeDiagnosticsSource.slice(
  runtimeDiagnosticsSource.indexOf("export function collectLayoutDiagnostics"),
  runtimeDiagnosticsSource.indexOf("function getPerformanceSnapshot")
);
if (!runtimeDiagnosticsSource.includes("collectLayoutDiagnostics") ||
    !runtimeDiagnosticsSource.includes("overflowingElements") ||
    !runtimeDiagnosticsSource.includes("getPerformanceSnapshot") ||
    layoutDiagnosticsBlock.includes("innerText") ||
    layoutDiagnosticsBlock.includes("textContent") ||
    layoutDiagnosticsBlock.includes(".value")) {
  fail("Phase 18C layout diagnostics must report geometry without collecting page text.");
}

// Phase 18C.3: route-aware lazy loading and duplicate-request guards.
if (!/src="\/js\/performance-bootstrap\.js(?:\?[^"]*)?"/.test(indexHtml) ||
    indexHtml.includes('src="/js/analytics-controller.js"') ||
    indexHtml.includes('src="/js/gamification-controller.js"') ||
    indexHtml.includes('src="/js/animation-numberline.js"')) {
  fail("Phase 18C.3 heavy route modules and the number-line runtime must not load eagerly.");
}
if (!performanceBootstrapSource.includes("requestIdleCallback") ||
    !performanceBootstrapSource.includes('mh:analytics-route') ||
    !performanceBootstrapSource.includes('mh:gamification-route')) {
  fail("Phase 18C.3 performance bootstrap must support idle and route-aware loading.");
}
if (!runtimeLoaderSource.includes("loadClassicScriptOnce") ||
    !runtimeLoaderSource.includes("loadNumberLineRuntime") ||
    !appSource.includes('from "./runtime-loader.js"')) {
  fail("Phase 18C.3 number-line runtime must load once and only when requested.");
}
if (!appSource.includes("loadAdminRuntime") ||
    !appSource.includes('import("./roadmap-admin-controller.js")') ||
    !analyticsControllerSource.includes("reloadAfterCurrent") ||
    !gamificationControllerSource.includes("reloadAfterCurrent")) {
  fail("Phase 18C.3 Admin and dashboard requests must be lazy and coalesced.");
}
if (!uiPreferencesRepositorySource.includes("preferenceLoadsByUser") ||
    !roadmapRepositorySource.includes("userOverride")) {
  fail("Phase 18C.3 user preference and roadmap loads must reuse authenticated context.");
}

// Phase 102: lesson proposed-problems transition closes the lesson workspace
// before opening a clean Problems catalogue filtered to that lesson.
const proposedProblemsHandlerStart = appSource.lastIndexOf('const goBtn = document.getElementById("goProblemsBtn")');
const proposedProblemsHandlerEnd = appSource.indexOf('const und=document.getElementById("understoodBtn")', proposedProblemsHandlerStart);
const proposedProblemsHandler = proposedProblemsHandlerStart >= 0 && proposedProblemsHandlerEnd > proposedProblemsHandlerStart
  ? appSource.slice(proposedProblemsHandlerStart, proposedProblemsHandlerEnd)
  : "";
if (!proposedProblemsHandler.includes("closeDrawerSafely()") ||
    !proposedProblemsHandler.includes("mhResetContentFilters()") ||
    !proposedProblemsHandler.includes("filter.byLessonId = lessonId") ||
    !proposedProblemsHandler.includes('selectTab("problems")') ||
    !proposedProblemsHandler.includes('[data-shell-route="problems"]') ||
    !proposedProblemsHandler.includes('document.getElementById("mhCatalogWorkspace")?.scrollIntoView') ||
    proposedProblemsHandler.indexOf("closeDrawerSafely()") > proposedProblemsHandler.indexOf('selectTab("problems")')) {
  fail("Phase 104 proposed-problems action must close the lesson and activate the lesson-scoped Problems shell route.");
}
if (!appSource.includes("mhProtectSetBraces") || !appSource.includes('.replaceAll("⦃", "\\\\left\\\\{")')) {
  fail("Phase 104 live math preview must preserve visible finite-set braces.");
}

// Phase 119: nested chapter UX + non-destructive Admin simulation.
const roadmapCss119 = readFileSync(resolve(root, "css/roadmap.css"), "utf8");
const roadmapController119 = readFileSync(resolve(root, "js/roadmap-controller.js"), "utf8");
const chapterCompletion119 = readFileSync(resolve(root, "js/chapter-completion-controller.js"), "utf8");
const gamificationAdmin119 = readFileSync(resolve(root, "js/gamification-admin-controller.js"), "utf8");
if (!roadmapCss119.includes(".mh-roadmap-chapter-body[hidden]") ||
    !roadmapCss119.includes(".mh-roadmap-chapter-card > .mh-roadmap-chapter-head") ||
    !roadmapCss119.includes("position: static")) {
  fail("Phase 119 roadmap chapters must hide deterministically and must not inherit the global sticky header.");
}
const chapterToggle119 = roadmapController119.slice(
  roadmapController119.indexOf('for (const button of root.querySelectorAll("[data-roadmap-chapter-toggle]"))'),
  roadmapController119.indexOf('for (const button of root.querySelectorAll("[data-roadmap-node-id]"))')
);
if (!chapterToggle119.includes("body.hidden = willCollapse") ||
    !chapterToggle119.includes('card.classList.toggle("is-collapsed"') ||
    !chapterToggle119.includes('button.setAttribute("aria-expanded"') ||
    chapterToggle119.includes("render();")) {
  fail("Phase 119 chapter collapse must update the existing DOM without re-rendering the full roadmap.");
}
if (!chapterCompletion119.includes("previewChapterCompletion") ||
    !chapterCompletion119.includes("mathhard:admin-preview-chapter") ||
    !chapterCompletion119.includes("SIMULARE ADMIN")) {
  fail("Phase 119 chapter finale must expose a clearly marked, non-destructive Admin preview.");
}
if (!gamificationAdmin119.includes("Simulator UI") ||
    !gamificationAdmin119.includes("0 DB writes") ||
    !gamificationAdmin119.includes("mh_get_user_chapter_progress") ||
    !gamificationAdmin119.includes('import("./chapter-completion-controller.js")') ||
    !gamificationAdmin119.includes("Simulează unlock + confetti")) {
  fail("Phase 119 Gamification Studio must expose chapter and achievement UI simulation without progress writes.");
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("MathHard validation passed.");
}
