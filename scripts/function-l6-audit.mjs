import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { __test } from "../js/function-properties-lab.js";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const app = read("js/app.js");
const polish = read("js/learning-polish-controller.js");
const lab = read("js/function-properties-lab.js");
const sqlPath = "local-sql/MathHard_163_C5_L6_MONOTONICITY_BOUNDEDNESS_EXTREMA.sql";
const postPath = "local-sql/MathHard_POST_163_CHECK.sql";
const externalSqlAvailable = existsSync(resolve(root, sqlPath)) && existsSync(resolve(root, postPath));
const sql = externalSqlAvailable ? read(sqlPath) : "";
const post = externalSqlAvailable ? read(postPath) : "";
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const has = (source, token, label = token) => expect(source.includes(token), `missing: ${label}`);
const lacks = (source, token, label = token) => expect(!source.includes(token), `unexpected: ${label}`);

expect(/\[data-mh-function-monotonicity-lab\].*\[data-mh-function-bounds-extrema-lab\]/.test(app), "L6 visual labs must share one lazy gate");
expect(/import\("\.\/function-properties-lab\.js\?v=163"\)/.test(app), "versioned function-properties lab import missing");
has(polish, "[data-mh-function-monotonicity-lab]", "learning polish selector for monotonicity lab");
has(polish, "[data-mh-function-bounds-extrema-lab]", "learning polish selector for bounds/extrema lab");
for (const token of ["Monotonicity Lab","Bounds &amp; Extrema Lab","mountFunctionPropertiesLabs","openInterval","closedInterval"]) has(lab, token, `L6 lab ${token}`);

expect(__test.classifyMonotoneValues([0,2,2,7]) === "increasing", "nonstrict increasing classification failed");
expect(__test.classifyMonotoneValues([6,4,4,1]) === "decreasing", "nonstrict decreasing classification failed");
expect(__test.classifyMonotoneValues([0,1,2,3]) === "strict-increasing", "strict increasing classification failed");
expect(__test.classifyMonotoneValues([4,2,0,-1]) === "strict-decreasing", "strict decreasing classification failed");
expect(__test.classifyMonotoneValues([3,3,3]) === "constant", "constant classification failed");
expect(__test.classifyMonotoneValues([3,-2,3]) === "not-monotone", "direction-change classification failed");
const openState = __test.boundStatus({values:[-2,0,3], upper:3, lower:-2, upperAttained:false, lowerAttained:false});
expect(openState.upperBound && openState.lowerBound && !openState.hasMaximum && !openState.hasMinimum, "open-bound state failed");
const closedState = __test.boundStatus({values:[-2,0,3], upper:3, lower:-2, upperAttained:true, lowerAttained:true});
expect(closedState.hasMaximum && closedState.hasMinimum, "closed-bound state failed");

if (externalSqlAvailable) {
  const bodyStart = sql.indexOf("$mh163_body$");
  const bodyEnd = sql.indexOf("$mh163_body$", bodyStart + 1);
  expect(bodyStart >= 0 && bodyEnd > bodyStart, "L6 lesson body dollar quote missing");
  const body = bodyStart >= 0 && bodyEnd > bodyStart ? sql.slice(bodyStart, bodyEnd) : "";

  expect((body.match(/<section class="mh-enrichment-box/g) || []).length === 3, "expected exactly 3 canonical enrichment wrappers");
  for (const cls of ["mh-enrichment-box--fun","mh-enrichment-box--spoiler","mh-enrichment-box--beyond"]) has(body, cls, `enrichment class ${cls}`);
  expect((body.match(/data-enrichment-required="false"/g) || []).length === 3, "each enrichment must set required=false");
  expect((body.match(/data-enrichment-evidence="false"/g) || []).length === 3, "each enrichment must set evidence=false");
  lacks(body, "\\<section", "escaped section wrapper");
  lacks(body, "&lt;section", "HTML-escaped section wrapper");

  const section18Start = body.indexOf("<h2>18. MONOTONIA");
  const section18End = body.indexOf("<h2>METODA MATHHARD", section18Start);
  const section18 = section18Start >= 0 && section18End > section18Start ? body.slice(section18Start, section18End) : "";
  for (const token of ["A=\\mathbb R","A=(0,1)","A=[0,1]","f(x)=5"]) has(section18, token, `section 18 example ${token}`);
  expect((section18.match(/<tr>/g) || []).length >= 5, "section 18 comparison table must contain header + four situations");

  for (const token of ["data-mh-function-monotonicity-lab","data-mh-function-bounds-extrema-lab","HARTA LECȚIEI","CE TREBUIE SĂ ȘTII","🎯 OBIECTIVUL","🔎 URMEAZĂ"]) has(body, token, `lesson body ${token}`);
  lacks(body.toLowerCase(), "se apropie de", "limit-adjacent language");
  lacks(body.toLowerCase(), "tinde către", "limit language");

  const beyondStart = body.indexOf("mh-enrichment-box--beyond");
  const beyondEnd = body.indexOf("</section>", beyondStart);
  const beforeBeyond = beyondStart >= 0 ? body.slice(0, beyondStart) : body;
  const afterBeyond = beyondEnd >= 0 ? body.slice(beyondEnd + 10) : "";
  lacks(beforeBeyond, "\\sup\\operatorname", "sup outside Beyond");
  lacks(beforeBeyond, "\\inf\\operatorname", "inf outside Beyond");
  lacks(afterBeyond, "\\sup\\operatorname", "sup outside Beyond");
  lacks(afterBeyond, "\\inf\\operatorname", "inf outside Beyond");

  const quizStart = sql.indexOf("-- 2. VERIFICATION BANK");
  const quizEnd = sql.indexOf("-- 3. SEMANTIC GRADER", quizStart);
  const quiz = quizStart >= 0 && quizEnd > quizStart ? sql.slice(quizStart, quizEnd) : "";
  expect((quiz.match(/'m1-ix-function-monotone-bounded-extrema-q\d{2}'/g) || []).length === 10, "expected exactly 10 L6 verification rows");
  expect((quiz.match(/\)\),\s*'[^']+','',true\)/g) || []).length === 10, "every verification item must have a non-empty explanation_ro");

  const practiceStart = sql.indexOf("-- 4. PRACTICE BANK");
  const practiceEnd = sql.indexOf("-- 5. CONCEPT / EVIDENCE GRAPH", practiceStart);
  const practice = practiceStart >= 0 && practiceEnd > practiceStart ? sql.slice(practiceStart, practiceEnd) : "";
  expect((practice.match(/\('m1-ix-func-l6-p\d{2}'/g) || []).length === 11, "expected exactly 11 L6 practice rows");
  const ids = Array.from({length:11}, (_,i)=>`m1-ix-func-l6-p${String(i+1).padStart(2,"0")}`);
  for (const [index,id] of ids.entries()) {
    const start = practice.indexOf(`('${id}'`);
    const end = index === ids.length - 1 ? practice.length : practice.indexOf(`('${ids[index+1]}'`, start + 1);
    const chunk = start >= 0 && end > start ? practice.slice(start, end) : "";
    expect(chunk.includes("$p$") && chunk.includes("$s$"), `${id} missing statement/solution dollar blocks`);
    const canonical = chunk.match(/\$p\$[\s\S]*?\$p\$,'',(?:E'[^']*'|'[^']*'),'([^']+)','','([^']+)','',\$s\$([\s\S]*?)\$s\$,'','([^']+)','','([^']+)',''/);
    expect(Boolean(canonical), `${id} does not match canonical hint/solution/simple/boss structure`);
    if (canonical) expect(canonical.slice(1).every((value)=>String(value).trim().length>0), `${id} contains an empty canonical feedback field`);
  }

  for (const token of [
    "('absolute-value-function','problem','m1-ix-func-l6-p03','supporting',true",
    "('floor-function','problem','m1-ix-func-l6-p08','supporting',true",
    "('function-restriction','lesson','m1-ix-function-monotone-bounded-extrema','reference',false",
    "('real-ordering','lesson','m1-ix-function-monotone-bounded-extrema','reference',false"
  ]) has(sql, token, `evidence contract ${token}`);
  has(post, "all_quiz_explanations_present", "POST quiz explanation audit");
  has(post, "all_practice_feedback_present", "POST practice feedback audit");
}

expect(app.split(/\r?\n/).length <= 7850, "app.js exceeds 7850-line architecture ceiling");
if (failures.length) {
  console.error("function-l6-audit failed");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
if (!externalSqlAvailable) console.log("- external SQL artifacts are not stored in Git; function lesson 6 database/content contract checks skipped.");
console.log("function-l6-audit passed");
