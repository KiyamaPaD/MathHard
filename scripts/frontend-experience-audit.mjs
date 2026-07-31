import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function read(relativePath) {
  const path = resolve(root, relativePath);
  if (!existsSync(path)) {
    errors.push(`Missing file: ${relativePath}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function requireTokens(source, label, tokens) {
  for (const token of tokens) {
    if (!source.includes(token)) errors.push(`${label} is missing: ${token}`);
  }
}

function forbidTokens(source, label, tokens) {
  for (const token of tokens) {
    if (source.includes(token)) errors.push(`${label} still exposes obsolete copy: ${token}`);
  }
}

const index = read("index.html");
const app = read("js/app.js");
const adminCss = read("css/admin-studio.css");
const adminModel = read("js/admin-content-model.js");
const quizAdmin = read("js/lesson-quiz-admin-controller.js");
const quizRepository = read("js/lesson-quiz-repository.js");
const secureProblem = read("js/secure-problem-controller.js");
const lessonQuiz = read("js/lesson-quiz-controller.js");
const offline = read("offline.html");
const profileText = read("js/profile-text.js");

requireTokens(index, "Admin workspace", [
  "Conținut, publicare și progres",
  "Caută titlu, ID sau capitol",
  "data-admin-panel=\"dashboard\"",
  "id=\"mh_learn_en\"",
  "id=\"mh_why_en\"",
  "id=\"mh_examples_ro\"",
  "id=\"mh_examples_en\"",
  "id=\"mh_sources\"",
  "id=\"mh_hint1_en\"",
  "id=\"mh_hint2_en\"",
  "id=\"mh_source\"",
  "class=\"mh-admin-savebar\""
]);

requireTokens(adminCss, "Admin styling", [
  ".mh-admin-language-grid",
  ".mh-admin-language-card",
  ".mh-admin-savebar",
  ".mh-admin-status-dot"
]);

requireTokens(adminModel, "Admin form model", ["export function linesFromInput"]);
requireTokens(app, "Admin persistence hardening", [
  "setAdminVerificationPending",
  "restoreAdminAfterTemporaryCheckFailure",
  "activeUser === undefined",
  "isAdmin === undefined",
  "setAdminVerificationPending();\n    },\n    loadProgress"
]);

if (/hideAdminButton:\s*\(\)\s*=>\s*\{[\s\S]{0,180}setAdminButtonVisibility\(false/.test(app)) {
  errors.push("Auth refresh still hides Admin before role verification finishes.");
}
if (!/source:\s*document\.getElementById\("mh_source"\)\.value\.trim\(\)/.test(app)) {
  errors.push("Problem source is not preserved by the Admin editor.");
}
if (/source:\s*""/.test(app.slice(app.indexOf("function mhBuildProblemPayload"), app.indexOf("function mhBuildExamPayload")))) {
  errors.push("Problem payload still overwrites source with an empty value.");
}

forbidTokens(offline, "Offline page", ["Supabase"]);
forbidTokens(quizAdmin, "Lesson quiz Admin UI", ["server-side", "există în Supabase"]);
forbidTokens(quizRepository, "Lesson quiz messages", ["confirmată de Supabase"]);
forbidTokens(secureProblem, "Problem workspace", ["secure evaluation", "server-side", "salvat în Supabase", "verificat de Supabase"]);
forbidTokens(lessonQuiz, "Lesson quiz student UI", ["server-side", "Supabase"]);
forbidTokens(profileText, "Profile copy", ["sincronizarea progresului", "info_provider", "info_user_id"]);
forbidTokens(read("profile.html"), "Profile page", ["profileInfoProvider", "profileInfoId", ">Provider<", ">User ID<"]);
forbidTokens(read("js/roadmap-controller.js"), "Roadmap student UI", ["mh-roadmap-schema-badge", "phase-12"]);
forbidTokens(secureProblem, "Problem attempt copy", ["Istoric securizat", "Secure history"]);

forbidTokens(index, "Admin editor", [
  "Item open",
  ">open</option>",
  ">mcq</option>",
  "Phase 13B",
  "Am înțeles",
  "Itemi examen (open + grile)",
  "Credit / sursă (HTML)"
]);
forbidTokens(app, "Exam editor", [
  "Item open",
  "Răspuns corect (open)",
  ">open</option>",
  ">mcq</option>"
]);

const htmlFiles = ["404.html", "offline.html", "profile.html", "index.html"];
for (const relativePath of htmlFiles) {
  const html = read(relativePath);
  const imageTags = html.match(/<img\b[^>]*>/gi) || [];
  for (const tag of imageTags) {
    const decorative = /aria-hidden=["']true["']/i.test(tag);
    const altMatch = tag.match(/\balt=["']([^"']*)["']/i);
    if (!altMatch) errors.push(`${relativePath} contains an image without alt.`);
    else if (!decorative && !altMatch[1].trim()) errors.push(`${relativePath} contains a non-decorative image with empty alt.`);
  }
}

console.log("MathHard Frontend Experience audit");
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("- Admin remains open during transient auth revalidation: present");
  console.log("- transient connection failures preserve verified Admin state: present");
  console.log("- bilingual/source authoring fields and sticky save actions: present");
  console.log("- problem source preservation: present");
  console.log("- student-facing infrastructure copy removed: confirmed");
  console.log("- image alternative text checks: passed");
  console.log("MathHard Frontend Experience audit passed.");
}
