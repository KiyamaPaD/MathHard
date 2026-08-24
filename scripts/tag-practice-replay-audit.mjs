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
const replay = read("js/practice-replay-repository.js");
const exam = read("js/secure-exam-repository.js");
const analytics = read("js/analytics-repository.js") + read("js/analytics-controller.js");
const profileSettings = read("js/community-profile-settings-controller.js");
const leaderboard = read("js/community-leaderboard-controller.js");

if (!html.includes('id="exactStars"') || !app.includes("filter.exactStars")) errors.push("Exact-star filtering is incomplete.");
if (!app.includes('const liveBadge = document.getElementById("olympOnlyState")')) errors.push("Olympiad toggle must refresh the live state badge.");
if (!shell.includes("toggle.hidden = open") || !shell.includes('new Set(["dashboard", "roadmap"]).has(route)')) errors.push("Mobile menu/Continue shell behavior is incomplete.");
if (!tags.includes('"mh_get_tag_catalog"') || !tags.includes("legacy_tags") || !tags.includes('"mh_admin_replace_content_tags"')) errors.push("Normalized tag catalogue/admin mapping contract is incomplete.");
if (!html.includes('id="mhTagAdminStudio"')) errors.push("Admin Tag Studio is missing from index.html.");
if (!replay.includes('"mh_start_problem_replay"') || !replay.includes('"mh_get_practice_replay_analytics"')) errors.push("Problem replay repository contract is incomplete.");
if (!problem.includes("Replay · 0 XP") || !problem.includes('import("./practice-replay-repository.js")')) errors.push("Problem replay UI must stay explicitly isolated at 0 XP.");
if (!exam.includes('"mh_start_exam_session"') || !exam.includes('"mh_submit_exam_session"')) errors.push("Exam repository must use the official/replay session router.");
if (!analytics.includes("practiceReplays") || !analytics.includes("renderPracticeReplays")) errors.push("Replay data must be visible in Analytics without entering official activity metrics.");
if (!profileSettings.includes("draftBaseline") || !profileSettings.includes("dirty")) errors.push("Profile Save dirty-state is incomplete.");
if (!leaderboard.includes("mh-community-full-profile")) errors.push("Leaderboard explicit Full Profile action is missing.");
if (sqlFiles(root).length) errors.push("085/086 SQL must remain outside the application repository.");

console.log("MathHard 085/086 Tags + Practice Replay audit");
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exitCode = 1;
} else {
  console.log("- exact stars + Olympiad state filtering: present");
  console.log("- mobile shell/profile UX fixes: present");
  console.log("- normalized tags + Admin Tag Studio: present");
  console.log("- problem/exam practice replay at 0 XP: present");
  console.log("- replay Analytics is separate from official progress: present");
  console.log("- SQL kept outside Git: confirmed");
  console.log("MathHard 085/086 audit passed.");
}
