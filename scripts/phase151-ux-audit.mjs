import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const index = read("index.html");
const app = read("js/app.js");
const roadmap = read("js/roadmap-controller.js");
const explorer = read("js/function-intro-explorer.js");
const css = read("css/style.css");
const externalSqlPaths = [
  "local-sql/MathHard_151_UX_LABELS_VISUALS_ROADMAP_STATE.sql",
  "local-sql/MathHard_POST_151_CHECK.sql"
];
const externalSqlAvailable = externalSqlPaths.every((file) => existsSync(resolve(root, file)));
const sql = externalSqlAvailable ? read("local-sql/MathHard_151_UX_LABELS_VISUALS_ROADMAP_STATE.sql") : "";
const post = externalSqlAvailable ? read("local-sql/MathHard_POST_151_CHECK.sql") : "";

const failures = [];
const expect = (value, message) => { if (!value) failures.push(message); };
const has = (source, token, message = token) => expect(source.includes(token), `missing: ${message}`);
const lacks = (source, token, message = token) => expect(!source.includes(token), `unexpected: ${message}`);

// Release cache bust: Phase 150 changed app/CSS but kept the old URL. Phase 151 must force fresh assets.
for (const token of [
  'data-mh-build="5b2"',
  'name="mathhard-build" content="5b2"',
  'href="css/style.css?v=5b2"',
  '/js/app.js?v=5b2'
]) has(index, token, `release cache token ${token}`);
has(app, 'import("./roadmap-controller.js?v=151")', "fresh roadmap controller import");
has(app, 'import("./function-intro-explorer.js?v=152")', "fresh function explorer import");
has(app, 'console.error("Function intro explorer failed:"', "visible function explorer load error");

// The explorer stays progressively enhanced and idempotent.
for (const token of [
  'host.dataset.mhMounted === "1"',
  '[data-mh-function-machine]',
  '[data-mh-function-mapping]',
  'data-map-case="valid"',
  'data-map-case="double"',
  'data-map-case="missing"'
]) has(explorer, token, `function explorer ${token}`);
for (const token of [".mh-function-machine", ".mh-function-map", ".mh-function-map__svg"]) has(css, token, `visual CSS ${token}`);

// Roadmap look must survive refresh locally without coupling UI state to Supabase.
for (const token of [
  'safeReadJson, safeWriteJson',
  'ROADMAP_UI_STORAGE_KEY = "mathhard:roadmap-ui:v1"',
  'getRoadmapUiStorage()',
  'const savedUiState = loadRoadmapUiState()',
  'const collapsedSections = savedUiState.sections',
  'const collapsedGroups = savedUiState.grades',
  'const collapsedChapters = savedUiState.chapters',
  'persistUiState();'
]) has(roadmap, token, `roadmap persistence ${token}`);
expect((roadmap.match(/persistUiState\(\);/g) || []).length >= 3, "all roadmap collapse levels must persist");
lacks(roadmap, "supabase.from(\"roadmap_ui", "roadmap UI state must not require a Supabase table");

if (externalSqlAvailable) {
  // SQL migration must humanize learner labels and provide non-empty visual fallbacks.
  for (const token of [
    "DE LA ȘIRURI ȘI PROGRESII LA FUNCȚII",
    "mh-function-machine--fallback",
    "mh-function-map--fallback",
    "mh151_humanize_refs",
    "lecția „",
    "capitolul „",
    "drop function public.mh151_humanize_refs",
    "Keep MathHard M1 private"
  ]) has(sql, token, `Phase 151 SQL ${token}`);
  for (const token of [
    "C5L1 still exposes internal Cx/Lx shorthand",
    "chapter-member lessons still expose Cx/Lx shorthand",
    "learner-facing practice rows still expose Cx/Lx shorthand",
    "verification rows still expose Cx/Lx shorthand",
    "Function Machine static fallback missing",
    "A-to-B mapping static fallback missing"
  ]) has(post, token, `POST 151 ${token}`);
}

if (failures.length) {
  console.error("phase151-ux-audit failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

if (!externalSqlAvailable) console.log("- external SQL artifacts are not stored in Git; Phase 151 database/content contract checks skipped.");
console.log("phase151-ux-audit passed");
