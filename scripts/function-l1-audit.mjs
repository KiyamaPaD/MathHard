import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const app = readFileSync(resolve(root, "js/app.js"), "utf8");
const explorer = readFileSync(resolve(root, "js/function-intro-explorer.js"), "utf8");
const css = readFileSync(resolve(root, "css/style.css"), "utf8");
const sql = readFileSync(resolve(root, "local-sql/MathHard_150_C5_L1_FUNCTION_FOUNDATIONS.sql"), "utf8");
const post = readFileSync(resolve(root, "local-sql/MathHard_POST_150_CHECK.sql"), "utf8");

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const requireText = (source, token, label = token) => expect(source.includes(token), `missing: ${label}`);
const rejectText = (source, token, label = token) => expect(!source.includes(token), `unexpected: ${label}`);

requireText(app, 'import("./function-intro-explorer.js?v=151")', "lazy function explorer import with fresh cache key");
rejectText(app, 'from "./function-intro-explorer.js"', "function explorer must not be eagerly imported");
requireText(app, "mountFunctionIntroExplorers(content)", "lesson-body function explorer mount");
expect(app.split(/\r?\n/).length <= 7850, "app.js exceeds 7850-line architecture ceiling");

for (const token of [
  "[data-mh-function-machine]",
  "[data-mh-function-mapping]",
  'id: "linear"',
  'id: "square"',
  'id: "absolute"',
  'id: "shift"',
  'data-map-case="valid"',
  'data-map-case="double"',
  'data-map-case="missing"'
]) requireText(explorer, token, `explorer ${token}`);

for (const token of [
  ".mh-function-machine",
  ".mh-function-map",
  ".mh-map-edge.is-ok",
  ".mh-map-edge.is-bad",
  ".mh-function-map__verdict"
]) requireText(css, token, `CSS ${token}`);
rejectText(css, ":has(", "Phase 150 micro-visuals should not require :has()");

for (const token of [
  "m1-ix-function-foundations",
  "function-definition",
  "data-mh-function-machine",
  "data-mh-function-mapping",
  "FUNCȚIA LUI DIRICHLET",
  "\\mathbb N^*",
  "n\\longmapsto a_n",
  "x\\mapsto f(x)",
  "m1-ix-func-l1-p11",
  "<li>\\(f(0)\\);</li>",
  "function-l1-v1",
  "expression-domain-restrictions"
]) requireText(sql, token, `SQL ${token}`);

for (const forbidden of ["operatorname{Im}", "discontinuă", "discontinua", "Riemann", "Lebesgue"]) {
  rejectText(sql, forbidden, `L1 leakage: ${forbidden}`);
}

// P11 must require f(0) on line 5, never the attained-value set.
const p11Start = sql.indexOf("('m1-ix-func-l1-p11'");
expect(p11Start >= 0, "P11 SQL row not found");
if (p11Start >= 0) {
  const p11 = sql.slice(p11Start, sql.indexOf("-- Practice chapter membership.", p11Start));
  requireText(p11, "<li>\\(f(0)\\);</li>", "P11 line 5 f(0)");
  rejectText(p11, "valorile distincte obținute", "P11 should not require attained-value set");
  requireText(p11, "l5_rule\":\"numeric_f0_not_image_set", "P11 grader metadata L2 leakage guard");
}

// Dirichlet enrichment stays at definition level, not analysis.
const bodyStart = sql.indexOf("$mh150_body$");
const bodyEnd = sql.indexOf("$mh150_body$", bodyStart + 1);
expect(bodyStart >= 0 && bodyEnd > bodyStart, "lesson body dollar-quote not found");
if (bodyStart >= 0 && bodyEnd > bodyStart) {
  const body = sql.slice(bodyStart, bodyEnd).toLowerCase();
  for (const token of ["discontin", "limita", "limite", "riemann", "lebesgue", "derivat", "operatorname{im}"]) {
    expect(!body.includes(token), `analysis/L2 leakage in lesson body: ${token}`);
  }
}

for (const token of [
  "expected 10 active quiz items",
  "expected 11 practice problems",
  "P11 line 5 must require f(0)",
  "P05–P07 must reuse expression-domain-restrictions evidence",
  "L2 image/preimage mastery leaked into L1 evidence",
  "analysis/calculus language leaked into L1 body"
]) requireText(post, token, `POST audit ${token}`);

if (failures.length) {
  console.error("function-l1-audit failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("function-l1-audit passed");
