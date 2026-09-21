import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requireToken = (source, token, label) => { if (!source.includes(token)) throw new Error(`${label}: missing ${token}`); };
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const requireVersionedImport = (source, modulePath, label) => {
  const pattern = new RegExp(`import\\(\\s*["']${escapeRegex(modulePath)}\\?v=[A-Za-z0-9._-]+["']\\s*\\)`);
  if (!pattern.test(source)) throw new Error(`${label}: missing versioned lazy import for ${modulePath}`);
};
const requireVersionedRef = (source, assetPath, label) => {
  const pattern = new RegExp(`${escapeRegex(assetPath)}\\?v=[A-Za-z0-9._-]+`);
  if (!pattern.test(source)) throw new Error(`${label}: missing versioned asset reference for ${assetPath}`);
};

const app = read("js/app.js");
const polish = read("js/learning-polish-controller.js");
const admin = read("js/admin-learning-polish-authoring.js");
const secure = read("js/secure-problem-controller.js");
const graph = read("js/function-graph-explorer.js");
const intro = read("js/function-intro-explorer.js");
const continuity = read("js/workspace-continuity-controller.js");
const learningCss = read("css/learning-workspace.css");
const problemCss = read("css/problem-workspace.css");
const authorCss = read("css/content-authoring.css");
const index = read("index.html");
const manifest = JSON.parse(read("deploy-manifest.json"));

for (const [token, label] of [
  ["mh-lesson-mini-tools", "compact sticky lesson tools"],
  ["data-mh-toc-toggle", "lesson TOC"],
  ["data-mh-lesson-search", "lesson search"],
  ["data-mh-glossary", "context glossary"],
  ["data-mh-copyable", "manual copyable content"],
  ["mh-interactive-shell-controls", "interactive shell"],
  ["requestFullscreen", "interactive fullscreen"],
  ["mathhard:interactive-reset", "interactive reset contract"],
  ["mountProblemPolish", "problem practice navigation"],
  ["mh-learning-practice-nav", "compact previous/current/next practice navigation"],
  ["mh-learning-practice-summary", "practice completion summary"],
  ["enhanceOverflow", "mobile math/table overflow hardening"],
  ["enhanceAdaptiveMathToolbar", "adaptive mobile math toolbar"],
  ["mountProblemReview", "review lesson action"]
]) requireToken(polish, token, label);

for (const token of ["data-polish=\"anchor\"", "data-polish=\"glossary\"", "data-polish=\"copy\"", "data-polish=\"review\"", "data-polish=\"visual-help\""]) requireToken(admin, token, "Admin contextual authoring");
requireVersionedImport(app, "./learning-polish-controller.js", "Lesson polish must remain lazy");
requireVersionedImport(app, "./admin-learning-polish-authoring.js", "Admin authoring helpers must remain lazy");
requireVersionedImport(secure, "./learning-polish-controller.js", "Problem polish must remain lazy");
requireToken(secure, "afterWrong > beforeWrong", "Wrong answers expose review action without treating format errors as concept mistakes");
requireToken(continuity, "mathhard:workspace-restored", "Resume indicator event");
requireToken(graph, "mh-representation-point-readout", "Graph point tap/readout");
requireToken(graph, "mathhard:interactive-reset", "Representation lab reset");
requireToken(intro, "mathhard:interactive-reset", "Function explorers reset");
for (const token of ["mh-lesson-mini-tools", "mh-glossary-term", "mh-copyable-btn", "mh-interactive-shell-controls", "mh-learning-practice-nav", "mh-learning-problem-dots", "mh-table-scroll"]) requireToken(learningCss, token, "Learning polish CSS");
for (const token of ["mh-review-link", "mh-math-quick-row"]) requireToken(problemCss, token, "Problem polish CSS");
requireToken(authorCss, "mh-admin-polish-tools", "Admin authoring helper CSS");
requireToken(index, `data-mh-build="${manifest.build}"`, "Build/cache contract");
for (const asset of ["css/learning-workspace.css", "css/problem-workspace.css", "css/content-authoring.css", "/js/app.js"]) {
  requireVersionedRef(index, asset, "Build/cache contract");
}

if (/logLearningEvent|submitProblemAnswer|replaceContentConcepts/.test(polish)) throw new Error("Instructional polish must not emit mastery/evidence or mutate content concepts.");

console.log("Phase 156 Learning Polish audit passed.");
console.log("- compact TOC/progress/search + anchors: present");
console.log("- fullscreen/reset/help + graph tap readout: present");
console.log("- opt-in glossary/copy/review Admin authoring: present");
console.log("- practice dots + completion summary + adaptive mobile toolbar: present");
console.log("- instructional polish remains evidence-free: confirmed");
