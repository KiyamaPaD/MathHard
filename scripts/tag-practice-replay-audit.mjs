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
const analytics = read("js/analytics-repository.js") + read("js/analytics-controller.js");
const profileSettings = read("js/community-profile-settings-controller.js");
const profilePage = read("js/community-profile-page.js");
const layout = read("js/section-layout-controller.js");
const allHtml = ["index.html", "profile.html", "u.html", "404.html", "offline.html"].map(read).join("\n");

if (html.includes('id="exactStars"') || html.includes('id="minDiff"') || html.includes('id="maxDiff"')) errors.push("Legacy advanced difficulty controls must stay removed.");
if (app.includes('difficulty_range:') || app.includes('global_tags:') || app.includes('structural_tags:')) errors.push("Removed difficulty/structural/global filter copy must not return.");
if (!html.includes('id="problemSort"') || !app.includes('filter.problemSort')) errors.push("Problem star/difficulty sorting must stay in the contextual toolbar.");
if (!html.includes('id="lessonCategory"') || !html.includes('id="examCategory"') || !app.includes('filter.lessonCategory') || !app.includes('filter.examCategory')) errors.push("Lesson/exam category filtering is incomplete.");
if (!app.includes('"ubb"') || !app.includes('"utcn"') || !app.includes('"bac"') || !app.includes('"olympiad"')) errors.push("Exam category presets are incomplete.");
if (!shell.includes("toggle.hidden = open") || !shell.includes('new Set(["dashboard", "roadmap"]).has(route)')) errors.push("Mobile menu/Continue shell behavior is incomplete.");
if (!tags.includes('"mh_get_tag_catalog"') || !tags.includes("group_key") || !tags.includes("filter_visible") || !tags.includes('"mh_admin_replace_content_tags"')) errors.push("Normalized compact tag catalogue/admin mapping contract is incomplete.");
if (!tagAdmin.includes("group_key") || !tagAdmin.includes("filter_visible")) errors.push("Admin Tag Studio taxonomy controls are incomplete.");
if (!replay.includes('"mh_start_problem_replay"') || !replay.includes('"mh_get_practice_replay_analytics"')) errors.push("Problem replay repository contract is incomplete.");
if (!problem.includes("0 XP") || !problem.includes('import("./practice-replay-repository.js")') || !problem.includes("renderReplayHistory") || !problem.includes("attempt_count")) errors.push("Problem replay must stay isolated at 0 XP with answer history hidden.");
if (!problem.includes("reveal_seconds_remaining") || !problemWorkspace.includes("revealGate") || !problem.includes("hint1_used&&replay?.hint2_used")) errors.push("Problem solution gate must require both hints plus the server countdown.");
if (!problem.includes("replaySolution") || !problem.includes("result?.solution") || !replay.includes("p_locale:locale(lang)")) errors.push("Replay solution must stay hidden until the gated reveal and then render the localized explanation.");
if (!problem.includes("Reluarea golește răspunsul și istoricul vizibil") || !problem.includes("is-unsaved-danger") && !profileSettings.includes("is-unsaved-danger")) errors.push("Replay/profile warning UX is incomplete.");
if (!exam.includes('"mh_start_exam_session"') || !exam.includes('"mh_submit_exam_session"')) errors.push("Exam repository must use the official/replay session router.");
if (!app.includes("duration_seconds") || !app.includes("submitted_answer") || !app.includes("correct_answer")) errors.push("Post-exam duration and answer review rendering is incomplete.");
if (!analytics.includes("practiceReplays") || !analytics.includes("renderPracticeReplays") || !analytics.includes("Problemă reîncercată") || !analytics.includes("Examen reîncercat") || !analytics.includes("Analiză completă")) errors.push("Expanded replay Analytics is incomplete.");
if (!profileSettings.includes("showUnsavedWarning") || !profileSettings.includes("beforeunload") || !profileSettings.includes("is-unsaved-danger")) errors.push("Mandatory unsaved-profile warning is incomplete.");
if (profilePage.includes("Se încarcă profilul") || profilePage.includes("Profilurile publice afișează")) errors.push("Public profile must not inject the stale loading placeholder.");
if (layout.includes("Aspectul paginii a fost salvat") || layout.includes("Page appearance was saved")) errors.push("Redundant page-appearance saved toast must stay removed.");
if ((allHtml.match(/localStorage\.getItem\("mh_theme"\)/g) || []).length < 5) errors.push("Theme bootstrap must exist on all five HTML entry points.");
if (sqlFiles(root).length) errors.push("Database SQL must remain outside the application repository.");

console.log("MathHard 087 Filters + Replay Privacy + Profile/Analytics audit");
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exitCode = 1;
} else {
  console.log("- compact tags/categories + contextual star sorting: present");
  console.log("- replay answer privacy + 0 XP + solution gate: present");
  console.log("- exam post-submit duration/review contract: present");
  console.log("- unsaved profile guard + global theme bootstrap: present");
  console.log("- expanded replay Analytics: present");
  console.log("- SQL kept outside Git: confirmed");
  console.log("MathHard 087 audit passed.");
}
