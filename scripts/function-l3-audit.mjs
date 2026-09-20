import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const app = read("js/app.js");
const explorer = read("js/function-graph-explorer.js");
const css = read("css/style.css");
const externalSqlPaths = [
  "local-sql/MathHard_155_C5_L3_FUNCTION_REPRESENTATIONS_GRAPH.sql",
  "local-sql/MathHard_POST_155_CHECK.sql"
];
const externalSqlAvailable = externalSqlPaths.every((file) => existsSync(resolve(root, file)));
const sql = externalSqlAvailable ? read(externalSqlPaths[0]) : "";
const post = externalSqlAvailable ? read(externalSqlPaths[1]) : "";

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const has = (source, token, label = token) => expect(source.includes(token), `missing: ${label}`);
const lacks = (source, token, label = token) => expect(!source.includes(token), `unexpected: ${label}`);

has(app, 'import("./function-graph-explorer.js?v=155")', "fresh function graph explorer import");
expect(app.split(/\r?\n/).length <= 7850, "app.js exceeds 7850-line architecture ceiling");

for (const token of [
  "mountFunctionGraphExplorers",
  "data-mh-function-representation-lab",
  "data-mh-function-vertical-test",
  "DOMENIU FINIT",
  "DOMENIU REAL",
  "Valori atinse",
  "selectedInput",
  "mh-rep-real-line",
  "Domeniu declarat?"
]) has(explorer, token, `Representation Lab ${token}`);

for (const token of [
  ".mh-representation-lab",
  ".mh-representation-lab__grid",
  ".mh-representation-table",
  ".mh-representation-graph",
  ".mh-vertical-test",
  ".mh-vtest-probe",
  ".mh-vertical-test__domain-note"
]) has(css, token, `graph lesson CSS ${token}`);
lacks(css, ":has(", "graph lesson must not require :has()");

if (externalSqlAvailable) {
  for (const token of [
    "m1-ix-function-representations",
    "Păstrând fixate domeniul și codomeniul declarate",
    "Valori atinse",
    "data-mh-function-representation-lab",
    "data-mh-function-vertical-test",
    "cel mult un punct",
    "exact un punct",
    "abscise din afara",
    "function-graph",
    "function-representations",
    "function-l3-v1",
    "mh_func_l3_answer_lines_v1",
    "line-label parser damaged tuple/set content",
    "P11 requires exactly 10 non-empty lines."
  ]) has(sql, token, `SQL ${token}`);

  const bodyStart = sql.indexOf("$mh155_body$");
  const bodyEnd = sql.indexOf("$mh155_body$", bodyStart + 1);
  expect(bodyStart >= 0 && bodyEnd > bodyStart, "lesson body dollar quote missing");
  if (bodyStart >= 0 && bodyEnd > bodyStart) {
    const body = sql.slice(bodyStart, bodyEnd);
    expect(!/(^|[^A-Za-z0-9])C5([^A-Za-z0-9]|$)/.test(body), "learner-facing C5 shorthand leaked into lesson body");
    expect(!/(^|[^A-Za-z0-9])L\d+([^A-Za-z0-9]|$)/.test(body), "learner-facing Lx shorthand leaked into lesson body");
    has(body, "Interactivul este doar suport de învățare", "Representation Lab evidence boundary");
    has(body, "simpla interacțiune nu generează evidence", "vertical-test evidence boundary");
    lacks(body.replace(/\s+/g, ""), "f(x)>0", "systematic sign analysis before next lesson");
    lacks(body.replace(/\s+/g, ""), "f(x)<0", "systematic sign analysis before next lesson");
  }

  const practiceStart = sql.indexOf("-- 4. PRACTICE BANK");
  const practiceEnd = sql.indexOf("-- 5. CONCEPT / DEPENDENCY / EVIDENCE GRAPH", practiceStart);
  const practiceSql = practiceStart >= 0 && practiceEnd > practiceStart ? sql.slice(practiceStart, practiceEnd) : "";
  const problemMatches = [...practiceSql.matchAll(/\('m1-ix-func-l3-p\d{2}'/g)];
  expect(problemMatches.length === 11, `expected 11 practice rows, found ${problemMatches.length}`);
  const quizStart = sql.indexOf("-- 2. VERIFICATION BANK");
  const quizEnd = sql.indexOf("-- 3. SEMANTIC GRADER", quizStart);
  const quizSql = quizStart >= 0 && quizEnd > quizStart ? sql.slice(quizStart, quizEnd) : "";
  const quizMatches = [...quizSql.matchAll(/'m1-ix-function-representations-q\d{2}'/g)];
  expect(quizMatches.length === 10, `expected 10 quiz rows, found ${quizMatches.length}`);

  for (const token of [
    "function-graph must be PRIMARY mastery",
    "function-representations must be SUPPORTING mastery",
    "function-image-preimage must not become a hard prerequisite",
    "P10 must reuse expression-domain-restrictions as secondary evidence",
    "L3 line-safe preset parser missing",
    "L3 preset parser damaged ordered-pair content",
    "P11 weak non-domain justification was accepted"
  ]) has(post, token, `POST 155 ${token}`);
}

if (failures.length) {
  console.error("function-l3-audit failed");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

if (!externalSqlAvailable) console.log("- external SQL artifacts are not stored in Git; function lesson 3 database/content contract checks skipped.");
console.log("function-l3-audit passed");
