import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const errors = [];
const pass = (label, ok) => { if (!ok) errors.push(label); };
const read = (path) => readFileSync(resolve(root, path), "utf8");

const externalSqlPaths = [
  "local-sql/MathHard_180_C6_L1_EQUATION_FOUNDATIONS.sql",
  "local-sql/MathHard_POST_180_CHECK.sql"
];
const externalSqlAvailable = externalSqlPaths.every((path) => existsSync(resolve(root, path)));
const sql = externalSqlAvailable ? read(externalSqlPaths[0]) : "";
const post = externalSqlAvailable ? read(externalSqlPaths[1]) : "";
const controller = read("js/learning-polish-controller.js");
const app = read("js/app.js");
const visual = read("js/equation-balance-explorer.js");
const css = read("css/style.css");

if (externalSqlAvailable) {
  const bodyMatch = sql.match(/\$mh180_body\$([\s\S]*?)\$mh180_body\$/);
  const body = bodyMatch?.[1] || "";

  pass("lesson body dollar block exists", Boolean(bodyMatch));
  pass("student body has no C5/C6/L1/L2 admin labels", !/(^|[^A-Za-z0-9_])(C5|C6|L1|L2)([^A-Za-z0-9_]|$)/i.test(body));
  pass("admissibility is part of the solution definition", body.includes("a\\text{ este admis") && body.includes("egalitatea este adevărată"));
  pass("working-set → admissible-values → solutions chain exists", body.includes("mulțimea de lucru") && body.includes("valori admise") && body.includes("S\\subseteq D_E\\subseteq M"));
  pass("equivalence wording is tied to the same working set", body.includes("aceeași mulțime de lucru") && body.includes("S_1=S_2"));
  pass("reversible-transformations wording exists", body.includes("transformări reversibile care păstrează mulțimea soluțiilor"));
  pass("balance host is instructional-only", body.includes('data-mh-equation-balance') && body.includes('data-mh-required="false"') && body.includes('data-mh-evidence="false"'));
  pass("only the Fun Fact enrichment is present", body.includes("mh-enrichment-box--fun") && !body.includes("mh-enrichment-box--spoiler") && !body.includes("mh-enrichment-box--beyond"));
  pass("P10 explicitly asks for the lost solution", sql.includes("ce soluție se pierde") && sql.includes("S=\\{3,5\\}"));
  pass("P11 is difficulty 4 and exact 10 lines", /m1-ix-eq-l1-p11[\s\S]{0,120}'m1-ix-equation-foundations',4/.test(sql) && sql.includes("EXACT 10 RÂNDURI") && sql.includes("'required_lines',10"));
  pass("concept graph keeps only canonical equation nodes", sql.includes("'equation-foundations'") && sql.includes("'equivalent-equations'") && !sql.includes("('solution-verification'") && !sql.includes("('solution-admissibility'") && !sql.includes("('working-set-awareness'"));
  pass("equivalent-equations depends on equation-foundations", sql.includes("('equation-foundations','equivalent-equations','required')"));
  pass("verification pool contract is 10 / 6 / 80", sql.includes("question_count=6,pass_threshold=80") && (sql.match(/m1-ix-equation-foundations-q\d\d/g) || []).length === 10);
  pass("practice bank has 11 authored problems", new Set(sql.match(/m1-ix-eq-l1-p\d\d/g) || []).size === 11);
  pass("new grader route is registered", sql.includes("v_schema='equation-l1-v1'") && sql.includes("mh_validate_equation_l1_v1"));
  pass("POST audit is read-only", !/^\s*(insert|update|delete|alter|create|drop|truncate)\b/im.test(post));
}

pass("interactive selector registers balance host", controller.includes('"[data-mh-equation-balance]"'));
pass("balance module is lazy-loaded", controller.includes('import("./equation-balance-explorer.js?v=180")'));
pass("app cache-busts learning polish at v180", app.includes('import("./learning-polish-controller.js?v=180")'));
pass("app does not eagerly import balance module", !app.includes('from "./equation-balance-explorer.js') && !app.includes('import "./equation-balance-explorer.js'));
pass("visual module exports the mount function", visual.includes("export function mountEquationBalanceExplorers"));
pass("visual supports reset contract", visual.includes('mathhard:interactive-reset'));
pass("visual exposes both-side operations and one-side trap", visual.includes("minusBoth") && visual.includes("plusBoth") && visual.includes("leftOnly"));
pass("balance CSS exists", css.includes(".mh-equation-balance") && css.includes("--mh-balance-tilt"));

console.log("MathHard equation L1 audit");
if (!externalSqlAvailable) console.log("- external SQL artifacts are not stored in Git; C6L1 database/content contract checks skipped.");

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("MathHard equation L1 audit passed.");
}
