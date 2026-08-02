import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function fail(message) {
  errors.push(message);
}

function source(relativePath) {
  const absolute = resolve(root, relativePath);
  if (!existsSync(absolute)) {
    fail(`Missing file: ${relativePath}`);
    return "";
  }
  return readFileSync(absolute, "utf8");
}

const required = [
  "css/microinteractions.css",
  "data/microinteractions.json",
  "img/microinteractions-sprite.svg",
  "src/microinteractions/microinteraction-engine.ts",
  "js/microinteraction-engine.js",
  "js/microinteractions-bootstrap.js",
  "js/microinteractions-react-island.js",
  "tsconfig.microinteractions.json"
];
required.forEach(source);

for (const file of [
  "js/microinteraction-engine.js",
  "js/microinteractions-bootstrap.js",
  "js/microinteractions-react-island.js",
  "js/secure-problem-controller.js",
  "js/lesson-quiz-controller.js",
  "js/gamification-controller.js",
  "js/app.js"
]) {
  try {
    execFileSync(process.execPath, ["--check", resolve(root, file)], { stdio: "pipe" });
  } catch (error) {
    fail(`Syntax check failed: ${file}`);
  }
}

const index = source("index.html");
const profile = source("profile.html");
const publicProfile = source("u.html");
const bootstrap = source("js/microinteractions-bootstrap.js");
const engine = source("js/microinteraction-engine.js");
const engineTs = source("src/microinteractions/microinteraction-engine.ts");
const reactIsland = source("js/microinteractions-react-island.js");
const css = source("css/microinteractions.css");
const performanceBootstrap = source("js/performance-bootstrap.js");
const problem = source("js/secure-problem-controller.js");
const lesson = source("js/lesson-quiz-controller.js");
const exam = source("js/app.js");
const gamification = source("js/gamification-controller.js");
const svg = source("img/microinteractions-sprite.svg");

for (const [name, html] of [["index.html", index], ["profile.html", profile], ["u.html", publicProfile]]) {
  if (!html.includes("/css/microinteractions.css?v=4i")) fail(`${name} must load microinteraction styles.`);
  if (!html.includes('name="mathhard-build" content="5a4"')) fail(`${name} must expose build 5a4.`);
}
if (!performanceBootstrap.includes('safelyLoadModule("./microinteractions-bootstrap.js?v=4j2")')) {
  fail("Main-page microinteractions must be lazy-loaded by performance-bootstrap.js.");
}
if (index.includes('<script type="module" src="/js/microinteractions-bootstrap.js')) {
  fail("index.html must not load the microinteraction runtime eagerly.");
}
if (!profile.includes('/js/microinteractions-bootstrap.js?v=4j2') || !publicProfile.includes('/js/microinteractions-bootstrap.js?v=4j2')) {
  fail("Profile pages must load the lightweight motion bootstrap.");
}

for (const marker of ["customElements.define", "ResizeObserver", "IntersectionObserver", "MutationObserver", ".animate(", "CanvasRenderingContext2D", "CSS.registerProperty"]) {
  if (!engine.includes(marker) && !engineTs.includes(marker)) fail(`Motion engine missing technology marker: ${marker}`);
}
if (!bootstrap.includes("requestIdleCallback") || !bootstrap.includes("React microinteraction island unavailable")) {
  fail("Motion bootstrap must lazy-load React and keep a local fallback.");
}

if (!bootstrap.includes('from "./microinteraction-engine.js?v=4j2"')) {
  fail("Motion bootstrap must cache-bust the updated XP animation engine.");
}
for (const motionSource of [engine, engineTs]) {
  if (!motionSource.includes("width:0;height:1.55rem") || !motionSource.includes(":host([data-active]){width:1.55rem")) {
    fail("XP pulse must collapse outside the active animation.");
  }
}

if (!reactIsland.includes("react@18.3.1") || !reactIsland.includes("react-dom@18.3.1")) {
  fail("React island dependencies must be pinned.");
}
if (!reactIsland.includes("createRoot") || !reactIsland.includes("mathhard:celebrate")) {
  fail("React celebration island is incomplete.");
}
if (!css.includes("prefers-reduced-motion: reduce") || !css.includes("mh-confetti-canvas") || !css.includes("mh-motion-ripple")) {
  fail("Motion CSS must include reduced-motion, Canvas and ripple protections.");
}
for (const symbol of ["sparkle", "check", "book", "trophy", "bolt"]) {
  if (!svg.includes(`id="${symbol}"`)) fail(`SVG sprite missing symbol: ${symbol}`);
}

for (const [name, file] of [
  ["problem", problem],
  ["lesson", lesson],
  ["exam", exam],
  ["gamification", gamification]
]) {
  if (!file.includes('"mathhard:celebrate"')) fail(`${name} flow must dispatch celebration events.`);
}
if (!problem.includes('kind: "problem"')) fail("Problem celebration kind missing.");
if (!lesson.includes('kind: "lesson"')) fail("Lesson celebration kind missing.");
if (!exam.includes('kind: "exam"')) fail("Exam celebration kind missing.");
if (!gamification.includes('kind: "achievement"') || !gamification.includes('kind: "level"')) {
  fail("Gamification must announce achievements and level changes.");
}

try {
  const config = JSON.parse(source("data/microinteractions.json"));
  if (!config?.durations?.counter || !config?.confetti?.exam || !Array.isArray(config?.selectors?.reveal)) {
    fail("Microinteraction JSON config is incomplete.");
  }
} catch (error) {
  fail(`Invalid microinteraction JSON: ${error.message}`);
}

try {
  const tsconfig = JSON.parse(source("tsconfig.microinteractions.json"));
  if (tsconfig?.compilerOptions?.target !== "ES2022" || tsconfig?.compilerOptions?.strict !== true) {
    fail("TypeScript microinteraction build must target ES2022 in strict mode.");
  }
} catch (error) {
  fail(`Invalid TypeScript config: ${error.message}`);
}

console.log("MathHard Phase 4H Microinteractions audit");
console.log("- TypeScript motion engine: present");
console.log("- React celebration island: lazy + fallback");
console.log("- Web Components / WAAPI / Canvas / SVG: present");
console.log("- reduced motion: enforced");

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exitCode = 1;
} else {
  console.log("MathHard Phase 4H Microinteractions audit passed.");
}
