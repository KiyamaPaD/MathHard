import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const read = (path) => readFileSync(resolve(root, path), "utf8");

function requireTokens(source, label, tokens) {
  for (const token of tokens) {
    assert.ok(source.includes(token), `${label} is missing: ${token}`);
  }
}

function forbidTokens(source, label, tokens) {
  for (const token of tokens) {
    assert.ok(!source.includes(token), `${label} still contains: ${token}`);
  }
}

function visibleHtml(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/\s+/g, " ");
}

const index = read("index.html");
const profile = read("profile.html");
const publicProfile = read("u.html");
const app = read("js/app.js");
const shell = read("js/app-shell-controller.js");
const analytics = read("js/analytics-controller.js");
const rewards = read("js/gamification-controller.js");
const leaderboard = read("js/community-leaderboard-controller.js");
const feedback = read("js/community-feedback-controller.js");
const profileTextSource = read("js/profile-text.js");
const languageGuard = read("js/ui-language-guard.js");
const performanceBootstrap = read("js/performance-bootstrap.js");
const systemPage = read("js/system-page.js");
const numberLine = read("js/animation-numberline.js");
const secureProblem = read("js/secure-problem-controller.js");

requireTokens(index, "Main page localization bootstrap", [
  'meta name="mathhard-build" content="5a5"',
  '/js/app.js?v=5a5',
  '>Sugestii</button>',
  '>🛠 Administrare</button>',
  'data-i18n="roadmap_title">Planul tău de studiu</span>'
]);

forbidTokens(visibleHtml(index), "Romanian main-page defaults", [
  '>Feedback<',
  '>Analytics<',
  '>Roadmap-uri<',
  '>Admin<',
  '>Streak<',
  '>Preview live<',
  '>Hint 1:<',
  '>Hint 2:<'
]);

requireTokens(app, "Main application copy", [
  'header_btn_feedback: "Sugestii"',
  'header_btn_feedback: "Feedback"',
  'header_btn_admin: "Administrare"',
  'header_btn_admin: "Admin"',
  'header_btn_focus_off: "Concentrare"',
  'header_btn_focus_off: "Focus"',
  '"Previzualizare în timp real"',
  '"Live preview"',
  'research: LANG === "ro" ? "Cercetare" : "Research"'
]);

requireTokens(shell, "Application shell copy", [
  'roadmap: ["Plan de studiu"',
  'roadmap: ["Roadmap"',
  'analytics: ["Analiză"',
  'analytics: ["Analytics"',
  'admin: "Administrare"',
  'admin: "Admin"'
]);

requireTokens(analytics, "Analytics workspace copy", [
  'title: "Analiză"',
  'title: "Analytics"',
  'mastery: "Stăpânire pe capitole"',
  'mastery: "Mastery by chapter"',
  'hints: "indicii"',
  'hints: "hints"'
]);

requireTokens(rewards, "Rewards workspace copy", [
  'streak: "Serie"',
  'streak: "Streak"',
  'weekly: "Provocare săptămânală"',
  'weekly: "Weekly challenge"',
  'achievements: "Realizări"',
  'achievements: "Achievements"'
]);

requireTokens(leaderboard, "Leaderboard copy", [
  'all: "Toată perioada"',
  'all: "All-time"',
  'metric: "Criteriu"',
  'metric: "Ranking"'
]);

requireTokens(feedback, "Feedback and suggestion copy", [
  'feedbackTitle: "Trimite o sugestie"',
  'feedbackTitle: "Send feedback"',
  'spam: "Mesaje nedorite"',
  'spam: "Spam"'
]);

requireTokens(performanceBootstrap, "Localization lazy loading", [
  'safelyLoadModule("./ui-language-guard.js?v=4i")'
]);

requireTokens(languageGuard, "Dynamic admin localization guard", [
  'const ADMIN_ROOT_SELECTOR = "#adminDrawer"',
  'const EXACT_EN',
  'const EXACT_RO',
  'const TOKEN_EN',
  'const TOKEN_RO',
  'ORIGINAL_TEXT',
  'ORIGINAL_ATTRIBUTES'
]);

requireTokens(systemPage, "System-page copy", [
  'notFoundHeading: "Pagina nu există"',
  'notFoundHeading: "Page not found"',
  'offlineHeading: "Fără conexiune"',
  'offlineHeading: "No connection"'
]);

requireTokens(numberLine, "Number-line Romanian copy", [
  'resetView: "Resetează vizualizarea"',
  'reset: "Resetează"',
  'replay: "▶︎ Reluare"',
  'Spațiu (pornire/pauză)'
]);
forbidTokens(numberLine.split("en: {")[0], "Number-line Romanian copy", [
  'Reset view',
  'Replay',
  'Click pe axă',
  'drag: pan'
]);

requireTokens(secureProblem, "Secure problem copy", [
  'hint_locked: "Indiciul nu este încă deblocat."',
  'hint_missing: "Această problemă nu are acest indiciu."',
  'hint_locked: "The hint is not unlocked yet."'
]);

forbidTokens(visibleHtml(profile), "Romanian profile defaults", [
  '>Username<',
  '>Bio<',
  '>Badge-uri<',
  '>Streak<',
  '>Linkuri<',
  '>Website<'
]);
requireTokens(profile, "Profile localization hooks", [
  'data-profile-text-key="feedback_btn">Sugestii</button>',
  'data-profile-text-key="analytics_btn">Analiză</a>',
  'data-profile-text-key="community_username_label">Nume de utilizator</span>',
  'data-profile-text-key="community_bio">Descriere</span>',
  'data-profile-text-key="community_website">Site web</span>',
  'data-profile-text-key="change_password_btn"',
  'data-profile-text-key="delete_account_btn"'
]);

requireTokens(publicProfile, "Public profile localization", [
  'meta name="mathhard-build" content="5a5"',
  '>Insigne</h2>',
  '>Realizări</h2>',
  '>Adrese</h2>',
  '/js/community-profile-page.js?v=4i'
]);

const profileModule = await import(pathToFileURL(resolve(root, "js/profile-text.js")).href);
const { PROFILE_TEXT } = profileModule;
assert.deepEqual(
  Object.keys(PROFILE_TEXT.ro).sort(),
  Object.keys(PROFILE_TEXT.en).sort(),
  "Romanian and English profile dictionaries must expose identical keys."
);
assert.equal(PROFILE_TEXT.ro.feedback_btn, "Sugestii");
assert.equal(PROFILE_TEXT.en.feedback_btn, "Feedback");
assert.equal(PROFILE_TEXT.ro.analytics_btn, "Analiză");
assert.equal(PROFILE_TEXT.en.analytics_btn, "Analytics");
assert.equal(PROFILE_TEXT.ro.community_username_label, "Nume de utilizator");
assert.equal(PROFILE_TEXT.en.community_username_label, "Username");

console.log("MathHard RO/EN localization audit passed.");
