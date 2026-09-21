import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { __test } from "../js/function-graph-reader.js";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const app = read("js/app.js");
const reader = read("js/function-graph-reader.js");
const polish = read("js/learning-polish-controller.js");
const css = read("css/style.css");
const sqlPath = "local-sql/MathHard_160_C5_L5_STANDARD_FUNCTIONS.sql";
const postPath = "local-sql/MathHard_POST_160_CHECK.sql";
const externalSqlAvailable = existsSync(resolve(root, sqlPath)) && existsSync(resolve(root, postPath));
const sql = externalSqlAvailable ? read(sqlPath) : "";
const post = externalSqlAvailable ? read(postPath) : "";
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const has = (source, token, label = token) => expect(source.includes(token), `missing: ${label}`);
const lacks = (source, token, label = token) => expect(!source.includes(token), `unexpected: ${label}`);

expect(/\[data-mh-function-graph-reader\].*\[data-mh-standard-function-gallery\]/.test(app), "standard gallery must share lazy graph module gate");
expect(/import\("\.\/function-graph-reader\.js\?v=[^"]+"\)/.test(app), "versioned lazy graph module import missing");
has(polish, "[data-mh-standard-function-gallery]", "learning polish selector for Function Gallery");
for (const token of ["mountStandardFunctionGallery","standardGraphSvg","Math.floor","fractionalPart","mh-sf-open","mh-sf-closed","Function Gallery"]) has(reader, token, `gallery ${token}`);
for (const token of [".mh-standard-gallery__controls",".mh-sf-open",".mh-sf-closed"]) has(css, token, `gallery CSS ${token}`);
expect(__test.floorValue(-2.4) === -3, `floor(-2.4) wrong: ${__test.floorValue(-2.4)}`);
expect(Math.abs(__test.fractionalPart(-2.4) - 0.6) < 1e-9, `frac(-2.4) wrong: ${__test.fractionalPart(-2.4)}`);
expect(__test.floorValue(-1.2) === -2, `floor(-1.2) wrong: ${__test.floorValue(-1.2)}`);
expect(Math.abs(__test.fractionalPart(-1.2) - 0.8) < 1e-9, `frac(-1.2) wrong: ${__test.fractionalPart(-1.2)}`);

if (externalSqlAvailable) {
  for (const token of ["m1-ix-standard-functions","absolute-value-function","floor-function","fractional-part-function","data-mh-standard-function-gallery","function-l5-v1","P11","function-restriction","function-image-preimage","integer-part-interval"]) has(sql, token, `SQL ${token}`);
  const bodyStart = sql.indexOf("$mh160_body$");
  const bodyEnd = sql.indexOf("$mh160_body$", bodyStart + 1);
  expect(bodyStart >= 0 && bodyEnd > bodyStart, "lesson body dollar quote missing");
  if (bodyStart >= 0 && bodyEnd > bodyStart) {
    const body = sql.slice(bodyStart, bodyEnd);
    lacks(body.toLowerCase(), "grafic continuu", "continuity terminology before continuity lesson");
    has(body, "Reciproc, pentru orice \\(y\\in[0,\\infty)\\)", "absolute-value image attainment");
    has(body, "Reciproc, pentru orice \\(n\\in\\mathbb Z\\)", "floor image attainment");
    has(body, "Reciproc, pentru orice \\(t\\in[0,1)\\)", "fractional image attainment");
    has(body, 'data-mh-glossary=', "glossary authoring");
    has(body, 'data-mh-copyable', "copy authoring");
  }
  const practiceStart = sql.indexOf("-- 4. PRACTICE BANK");
  const practiceEnd = sql.indexOf("-- 5. CONCEPT / EVIDENCE GRAPH", practiceStart);
  const practice = practiceStart >= 0 && practiceEnd > practiceStart ? sql.slice(practiceStart, practiceEnd) : "";
  expect([...practice.matchAll(/\('m1-ix-func-l5-p\d{2}'/g)].length === 11, "expected exactly 11 C5L5 practice rows");
  const quizStart = sql.indexOf("-- 2. VERIFICATION BANK");
  const quizEnd = sql.indexOf("-- 3. SEMANTIC GRADER", quizStart);
  const quiz = quizStart >= 0 && quizEnd > quizStart ? sql.slice(quizStart, quizEnd) : "";
  expect([...quiz.matchAll(/'m1-ix-standard-functions-q\d{2}'/g)].length === 10, "expected exactly 10 C5L5 quiz rows");
  has(post, "P11 function-restriction secondary evidence missing", "POST restriction evidence guard");
  has(post, "P11 function-image-preimage secondary evidence missing", "POST image evidence guard");
  has(post, "student-facing mastery jargon leaked", "POST student-copy guard");
}

expect(app.split(/\r?\n/).length <= 7850, "app.js exceeds 7850-line architecture ceiling");
if (failures.length) {
  console.error("function-l5-audit failed");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
if (!externalSqlAvailable) console.log("- external SQL artifacts are not stored in Git; function lesson 5 database/content contract checks skipped.");
console.log("function-l5-audit passed");
