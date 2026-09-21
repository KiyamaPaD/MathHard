import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { __test } from "../js/function-graph-reader.js";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const app = read("js/app.js");
const reader = read("js/function-graph-reader.js");
const polish = read("js/learning-polish-controller.js");
const css = read("css/style.css");
const sqlPath = "local-sql/MathHard_158_C5_L4_FUNCTION_SIGN_GRAPH_EQUATIONS.sql";
const postPath = "local-sql/MathHard_POST_158_CHECK.sql";
const externalSqlAvailable = existsSync(resolve(root, sqlPath)) && existsSync(resolve(root, postPath));
const sql = externalSqlAvailable ? read(sqlPath) : "";
const post = externalSqlAvailable ? read(postPath) : "";

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const has = (source, token, label = token) => expect(source.includes(token), `missing: ${label}`);
const lacks = (source, token, label = token) => expect(!source.includes(token), `unexpected: ${label}`);

has(app, 'import("./function-graph-reader.js?v=158")', "lazy Graph Reader import");
for (const token of ["data-mh-function-graph-reader","data-mh-function-zero-touch","data-mh-c4-sequence-compare","data-mh-c4-mixed-decision"]) has(polish, token, `polish selector ${token}`);
for (const token of ["horizontalIntersections","polylineIntersections","Graph Reader","Domeniu comun","Intersecții","Soluții","infinit de multe soluții"]) has(reader, token, `Graph Reader ${token}`);
for (const token of [".mh-graph-reader",".mh-graph-reader__layout",".mh-zero-touch",".mh-gr-level",".mh-gr-overlap"]) has(css, token, `Graph Reader CSS ${token}`);
lacks(css, ":has(", "Graph Reader must not require :has()");

const m1 = __test.horizontalIntersections(__test.mainPoints, 1);
expect(JSON.stringify(m1.points) === JSON.stringify([[-2,1],[0,1],[5,1]]), `m=1 geometry wrong: ${JSON.stringify(m1.points)}`);
const one = __test.polylineIntersections([[-4,-3],[5,6]],[[-4,7],[5,-2]]);
expect(one.points.length === 1 && Math.abs(one.points[0][0]-1) < 1e-9, `single-intersection preset wrong: ${JSON.stringify(one)}`);
const two = __test.polylineIntersections([[-4,2],[0,-2],[4,2],[5,3]],[[-4,0],[5,0]]);
expect(JSON.stringify(two.points) === JSON.stringify([[-2,0],[2,0]]), `two-intersection preset wrong: ${JSON.stringify(two)}`);
const overlap = __test.polylineIntersections([[-4,-2],[-1,1],[2,1],[5,3]],[[-4,3],[-1,1],[2,1],[5,-2]]);
expect(overlap.overlaps.length === 1 && Math.abs(overlap.overlaps[0][0]+1)<1e-9 && Math.abs(overlap.overlaps[0][1]-2)<1e-9, `overlap preset wrong: ${JSON.stringify(overlap)}`);

if (externalSqlAvailable) {
  for (const token of [
    "m1-ix-function-graph-reading",
    "function-sign-zeros",
    "graphical-equation-solving",
    "D_f\\cap D_g",
    "infinit de multe soluții",
    "data-mh-function-graph-reader",
    "data-mh-function-zero-touch",
    "(-2,1),(0,1),(5,1)",
    "function-l4-v1",
    "P11 requires exactly 10 non-empty lines.",
    "cardinality-finite",
    "implication-false-case",
    "interval-basics",
    "sequence-explicit"
  ]) has(sql, token, `SQL ${token}`);

  const bodyStart = sql.indexOf("$mh158_body$");
  const bodyEnd = sql.indexOf("$mh158_body$", bodyStart + 1);
  expect(bodyStart >= 0 && bodyEnd > bodyStart, "lesson body dollar quote missing");
  if (bodyStart >= 0 && bodyEnd > bodyStart) {
    const body = sql.slice(bodyStart, bodyEnd);
    expect(!/(^|[^A-Za-z0-9])C5([^A-Za-z0-9]|$)/.test(body), "learner-facing C5 shorthand leaked into body");
    expect(!/(^|[^A-Za-z0-9])L\d+([^A-Za-z0-9]|$)/.test(body), "learner-facing Lx shorthand leaked into body");
    has(body, 'data-mh-anchor="function-common-domain-equations"', "common-domain anchor");
    has(body, 'data-mh-glossary=', "lesson glossary marker");
    has(body, 'data-mh-copyable', "lesson copy marker");
  }

  const practiceStart = sql.indexOf("-- 4. PRACTICE BANK");
  const practiceEnd = sql.indexOf("-- 5. CONCEPT / EVIDENCE GRAPH", practiceStart);
  const practiceSql = practiceStart >= 0 && practiceEnd > practiceStart ? sql.slice(practiceStart, practiceEnd) : "";
  expect([...practiceSql.matchAll(/\('m1-ix-func-l4-p\d{2}'/g)].length === 11, "expected exactly 11 C5L4 practice inserts");
  const quizStart = sql.indexOf("-- 2. VERIFICATION BANK");
  const quizEnd = sql.indexOf("-- 3. SEMANTIC GRADER", quizStart);
  const quizSql = quizStart >= 0 && quizEnd > quizStart ? sql.slice(quizStart, quizEnd) : "";
  expect([...quizSql.matchAll(/'m1-ix-function-graph-reading-q\d{2}'/g)].length === 10, "expected exactly 10 C5L4 quiz rows");
  lacks(practiceSql, "(-1,3)\\n", "P10 must not duplicate Q08's point pair");

  for (const token of [
    "graphical-equation-solving must be PRIMARY",
    "P11 must integrate both PRIMARY concepts",
    "P09 still leaks central theory example",
    "P10 still duplicates Q08",
    "C1 curation missing",
    "C2 curation missing",
    "C3 curation missing",
    "C4 curation missing"
  ]) has(post, token, `POST 158 ${token}`);
}

expect(app.split(/\r?\n/).length <= 7850, "app.js exceeds 7850-line architecture ceiling");

if (failures.length) {
  console.error("function-l4-audit failed");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
if (!externalSqlAvailable) console.log("- external SQL artifacts are not stored in Git; function lesson 4 database/content contract checks skipped.");
console.log("function-l4-audit passed");
