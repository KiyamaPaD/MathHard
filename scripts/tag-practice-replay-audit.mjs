import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const read = (path) => {
  const absolute = resolve(root, path);
  if (!existsSync(absolute)) { errors.push(`Missing file: ${path}`); return ""; }
  return readFileSync(absolute, "utf8");
};
const sqlFiles = (directory, prefix = "") => readdirSync(directory).flatMap((name) => {
  if ([".git", "node_modules", "local-sql"].includes(name)) return [];
  const absolute = join(directory, name);
  const relative = prefix ? `${prefix}/${name}` : name;
  return statSync(absolute).isDirectory() ? sqlFiles(absolute, relative) : (name.toLowerCase().endsWith(".sql") ? [relative] : []);
});

const html = read("index.html");
const app = read("js/app.js");
const shell = read("js/app-shell-controller.js");
const tags = read("js/tag-repository.js");
const tagAdmin = read("js/tag-admin-controller.js");
const problem = read("js/secure-problem-controller.js");
const problemWorkspace = read("js/problem-workspace-repository.js");
const replay = read("js/practice-replay-repository.js");
const exam = read("js/secure-exam-repository.js");
const analyticsController = read("js/analytics-controller.js");
const analyticsCss = read("css/analytics.css");
const analytics = read("js/analytics-repository.js") + analyticsController;
const profileSettings = read("js/community-profile-settings-controller.js");
const profilePage = read("js/community-profile-page.js");
const publicProfileHtml = read("u.html");
const roadmap = read("js/roadmap-controller.js") + read("css/roadmap.css");
const layout = read("js/section-layout-controller.js");
const allHtml = ["index.html", "profile.html", "u.html", "404.html", "offline.html"].map(read).join("\n");

if (html.includes('id="exactStars"') || html.includes('id="minDiff"') || html.includes('id="maxDiff"')) errors.push("Legacy advanced difficulty controls must stay removed.");
if (!html.includes('id="problemStars"') || !app.includes('filter.exactDifficulty') || !app.includes('Number(P.difficulty) !== Number(filter.exactDifficulty)')) errors.push("Contextual exact 0–5 star filtering must be available for Problems and Problem Progress.");
if (app.includes('difficulty_range:') || app.includes('global_tags:') || app.includes('structural_tags:')) errors.push("Removed difficulty/structural/global filter copy must not return.");
if (!html.includes('id="problemSort"') || !app.includes('filter.problemSort')) errors.push("Problem star/difficulty sorting must stay in the contextual toolbar.");
if (!app.includes('["problems", "xp"].includes(TAB)') || !app.includes('filter(passProblem)')) errors.push("Problem Progress must share active problem filters and contextual star/Olympiad sorting.");
if (!app.includes('["lessons","problems","xp","exams"].includes(TAB)')) errors.push("Tag filtering must preserve the active Problem Progress tab instead of rendering another content type under it.");
if (html.includes('data-chip="exams"') || app.includes('mhUi("exam_problems")') || app.includes('exam_linked_problems')) errors.push("The redundant Problems from exams sidebar/main shortcut must stay removed.");
if (!html.includes('data-chip="exam-tips"') || !app.includes('if (chip === "exam-tips") return openTips()')) errors.push("Exam tips must exist as a dedicated Special category.");
if (!html.includes('id="lessonCategory"') || !html.includes('id="examCategory"') || !app.includes('filter.lessonCategory') || !app.includes('filter.examCategory')) errors.push("Lesson/exam category filtering is incomplete.");
if (!app.includes('"ubb"') || !app.includes('"utcn"') || !app.includes('"bac"') || !app.includes('"olympiad"')) errors.push("Exam category presets are incomplete.");
if (!shell.includes("toggle.hidden = open") || !shell.includes('new Set(["dashboard", "roadmap"]).has(route)')) errors.push("Mobile menu/Continue shell behavior is incomplete.");
if (!tags.includes('"mh_get_tag_catalog"') || !tags.includes("group_key") || !tags.includes("filter_visible") || !tags.includes('"mh_admin_replace_content_tags"')) errors.push("Normalized compact tag catalogue/admin mapping contract is incomplete.");
if (!tagAdmin.includes("group_key") || !tagAdmin.includes("filter_visible")) errors.push("Admin Tag Studio taxonomy controls are incomplete.");
if (!replay.includes('"mh_start_problem_replay"') || !replay.includes('"mh_get_practice_replay_analytics"')) errors.push("Problem replay repository contract is incomplete.");
if (!problem.includes("0 XP") || !problem.includes('import("./practice-replay-repository.js")') || !problem.includes("renderReplayHistory") || !problem.includes("attempt_count")) errors.push("Problem replay must stay isolated at 0 XP with answer history hidden.");
if (!problem.includes("reveal_seconds_remaining") || !problemWorkspace.includes("revealGate") || !problem.includes("solutionAccessGranted")) errors.push("Problem solution gate/solved-state sticky unlock contract is incomplete.");
if (!problem.includes("openExplanationModes") || !problem.includes('data-solution-panel') || !problem.includes('aria-pressed')) errors.push("Explanation modes must preserve independent simultaneous open state.");
if (!problem.includes("replaySolution") || !problem.includes("result?.solution") || !replay.includes("p_locale:locale(lang)")) errors.push("Replay solution localization/rendering contract is incomplete.");
const feedbackIndex = problem.indexOf("mh-feedback-card");
const solutionIndex = problem.indexOf("mh-solution-card");
const trainingIndex = problem.indexOf("Continuă antrenamentul");
if (!(solutionIndex >= 0 && feedbackIndex > solutionIndex && trainingIndex > feedbackIndex)) errors.push("Work feedback must sit below solution/explanation and directly before Continue training.");
if (!problem.includes("Reluarea golește răspunsul și istoricul vizibil") || !problem.includes("is-unsaved-danger") && !profileSettings.includes("is-unsaved-danger")) errors.push("Replay/profile warning UX is incomplete.");
if (!exam.includes('"mh_start_exam_session"') || !exam.includes('"mh_submit_exam_session"') || !exam.includes('"mh_get_exam_replay_history"')) errors.push("Exam repository must use the official/replay session router and read-only history RPC.");
if (!app.includes("duration_seconds") || !app.includes("submitted_answer") || !app.includes("correct_answer") || !app.includes("examReplayBtn") || !app.includes("Record personal") || !app.includes("contorul de examene promovate nu crește")) errors.push("Post-exam duration/review/replay-history rendering is incomplete.");
if (!analytics.includes("practiceReplays") || !analytics.includes("renderPracticeReplays") || !analytics.includes("Problemă reîncercată") || !analytics.includes("Examen reîncercat") || !analytics.includes("Analiză completă")) errors.push("Expanded replay Analytics is incomplete.");
if (!analyticsController.includes("safe.length>initial") || !analyticsController.includes("safe.map((row,index)") || !analyticsCss.includes("data-analytics-extra][hidden]")) errors.push("Recent Activity must show Full Analysis only on overflow and hide extra rows by default.");
if (!profileSettings.includes("showUnsavedWarning") || !profileSettings.includes("beforeunload") || !profileSettings.includes("is-unsaved-danger")) errors.push("Mandatory unsaved-profile warning is incomplete.");
if (profilePage.includes("Se încarcă profilul") || profilePage.includes("Profilurile publice afișează")) errors.push("Public profile must not inject the stale loading placeholder.");
if (!profilePage.includes("if (profile.isOwner) reportButton.remove()") || !read("css/community-profile.css").includes("community-public-actions [hidden]")) errors.push("Own public profile must remove the Report action completely.");
if (publicProfileHtml.includes('href="/index.html') || publicProfileHtml.includes('href="/index.html#') || profilePage.includes('href="/index.html"')) errors.push("Full public profile must remain a leaf page with no route back into the app.");
if (!roadmap.includes("mh-roadmap-target-label") || !roadmap.includes("margin-left: 10px")) errors.push("Roadmap target label offset is missing.");
if (!app.includes("getExamCatalogItemCount") || !app.includes("exam.items.length") || !app.includes("exam.problems.length")) errors.push("Exam item count must fall back to embedded/legacy items for Admin catalog rows.");
if (app.includes('<details class="mh-math-toolbar-master" open>')) errors.push("Math operations toolbar must be collapsed by default.");
if (layout.includes("Aspectul paginii a fost salvat") || layout.includes("Page appearance was saved")) errors.push("Redundant page-appearance saved toast must stay removed.");
if ((allHtml.match(/localStorage\.getItem\("mh_theme"\)/g) || []).length < 5) errors.push("Theme bootstrap must exist on all five HTML entry points.");
if (sqlFiles(root).length) errors.push("Database SQL must remain outside the application repository.");

console.log("MathHard 089 V2 Progress Filters + Exam Sidebar + Workspace polish audit");
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exitCode = 1;
} else {
  console.log("- compact tags/categories + contextual star sorting + exact 0–5★ filter: present");
  console.log("- Problem Progress shares problem tags/search/star/Olympiad filters without tab mismatch: present");
  console.log("- redundant exam-problems sidebar entry removed; Exam tips moved to Special categories: present");
  console.log("- replay answer privacy + solved-state solution access + multi-view explanations: present");
  console.log("- exam post-submit duration/review contract: present");
  console.log("- leaf public profile + unsaved profile guard + global theme bootstrap: present");
  console.log("- Admin exam item-count fallback + roadmap target spacing: present");
  console.log("- Recent Activity overflow/full analysis: present");
  console.log("- exam replay history + personal best: present");
  console.log("- solved solution access remains sticky across view switches: present");
  console.log("- own-profile Report removal + collapsed math tools: present");
  console.log("- SQL kept outside Git: confirmed");
  console.log("MathHard 089 audit passed.");
}
