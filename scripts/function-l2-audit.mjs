import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const app = read("js/app.js");
const explorer = read("js/function-intro-explorer.js");
const css = read("css/style.css");
const externalSqlPaths = [
  "local-sql/MathHard_152_C5_L2_FUNCTION_EQUALITY_IMAGE_PREIMAGE.sql",
  "local-sql/MathHard_POST_152_CHECK.sql"
];
const externalSqlAvailable = externalSqlPaths.every((file) => existsSync(resolve(root, file)));
const sql = externalSqlAvailable ? read(externalSqlPaths[0]) : "";
const post = externalSqlAvailable ? read(externalSqlPaths[1]) : "";

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const has = (source, token, label = token) => expect(source.includes(token), `missing: ${label}`);
const lacks = (source, token, label = token) => expect(!source.includes(token), `unexpected: ${label}`);

has(app, 'import("./function-intro-explorer.js?v=152")', "fresh function explorer cache key");
expect(app.split(/\r?\n/).length <= 7850, "app.js exceeds 7850-line architecture ceiling");

for (const token of [
  'host?.dataset?.mhTraceMode === "image-preimage"',
  'mountFunctionTraceExplorer(host)',
  'data-trace-mode="image"',
  'data-trace-mode="preimage"',
  'data-trace-restrict',
  'restrictedDomain: new Set(["1", "3"])',
  'f^{-1}',
  'operatorname{Im}f'
]) has(explorer, token, `Trace explorer ${token}`);

for (const token of [
  ".mh-function-trace",
  ".mh-function-trace__tabs",
  ".mh-function-trace__restriction",
  ".mh-trace-edge.is-highlighted",
  ".mh-trace-node.is-highlighted",
  ".mh-function-trace__result"
]) has(css, token, `Trace CSS ${token}`);
lacks(css, ":has(", "Trace explorer should not require :has()");

if (externalSqlAvailable) {
  for (const token of [
    "m1-ix-function-equality-image",
    "data-mh-trace-mode=\"image-preimage\"",
    "function-image-preimage",
    "function-equality",
    "function-restriction",
    "f^{-1}(\\{0\\})=\\mathbb R",
    "vidă, finită sau infinită",
    "A=\\{-2,0,1,3\\}",
    "A=\\{-3,-1,0,2\\}",
    "function-l2-v1",
    "requires exactly 9 non-empty lines"
  ]) has(sql, token, `SQL ${token}`);

  const bodyStart = sql.indexOf("$mh152_body$");
  const bodyEnd = sql.indexOf("$mh152_body$", bodyStart + 1);
  expect(bodyStart >= 0 && bodyEnd > bodyStart, "lesson body dollar quote missing");
  if (bodyStart >= 0 && bodyEnd > bodyStart) {
    const body = sql.slice(bodyStart, bodyEnd);
    expect(!/(^|[^A-Za-z0-9])C5([^A-Za-z0-9]|$)/.test(body), "learner-facing C5 shorthand leaked into lesson body");
    expect(!/(^|[^A-Za-z0-9])L\d+([^A-Za-z0-9]|$)/.test(body), "learner-facing Lx shorthand leaked into lesson body");
    for (const token of ["derivat", "integral", "limită", "limita"]) lacks(body.toLowerCase(), token, `analysis leakage ${token}`);
  }

  const q01Start = sql.indexOf("function-equality-image-q01");
  const q02Start = sql.indexOf("function-equality-image-q02", q01Start);
  const q01 = q01Start >= 0 && q02Start > q01Start ? sql.slice(q01Start, q02Start) : "";
  has(q01, "2x+3", "Q01 fresh formula");
  has(q01, "[-1,+\\infty)", "Q01 fresh domain");
  lacks(q01, "x^2", "Q01 theory-copy leakage");

  const q05Start = sql.indexOf("function-equality-image-q05");
  const q06Start = sql.indexOf("function-equality-image-q06", q05Start);
  const q05 = q05Start >= 0 && q06Start > q05Start ? sql.slice(q05Start, q06Start) : "";
  has(q05, "A=\\{-2,0,1,3\\}", "Q05 finite domain");

  const p06Start = sql.indexOf("('m1-ix-func-l2-p06'");
  const p07Start = sql.indexOf("('m1-ix-func-l2-p07'", p06Start);
  const p06 = p06Start >= 0 && p07Start > p06Start ? sql.slice(p06Start, p07Start) : "";
  has(p06, "\\{-3,-1,0,2\\}", "P06 fresh domain");
  lacks(p06, "\\{-2,-1,0,1,2\\}", "P06 previous-lesson dataset");

  for (const token of [
    "preimage cardinality statement must include empty, finite and infinite cases",
    "Q01 duplicated the central theory example",
    "Q05 must use a finite-domain image check",
    "P06 reused the previous lesson dosar",
    "function-image-preimage must be PRIMARY mastery",
    "function-equality and function-restriction must be SUPPORTING mastery",
    "P10 must reuse both C3 domain concepts as secondary evidence",
    "inverse-function mastery leaked into image/preimage lesson"
  ]) has(post, token, `POST 152 ${token}`);
}

if (failures.length) {
  console.error("function-l2-audit failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

if (!externalSqlAvailable) console.log("- external SQL artifacts are not stored in Git; function lesson 2 database/content contract checks skipped.");
console.log("function-l2-audit passed");
