import { readFileSync } from "node:fs";
import { analyzeExamIndependence, normalizeExamComparableText, validateExamPayload } from "../js/admin-content-model.js";

const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const authoring = readFileSync(new URL("../js/content-authoring-controller.js", import.meta.url), "utf8");
const sqlPath = new URL("../local-sql/063_product_phase_05b_1_independent_exam_bank.sql", import.meta.url);
let sql = "";
try { sql = readFileSync(sqlPath, "utf8"); } catch {}
const errors = [];
const requireToken = (source, token, message) => { if (!source.includes(token)) errors.push(message); };

requireToken(index, 'data-mh-build="5b1"', "Build marker is stale");
requireToken(index, 'id="mh_exam_problems" name="exam_problems" type="hidden"', "Legacy practice-problem exam field is still user-facing");
requireToken(index, "Bancă de examen independentă", "Independent exam-bank policy is not visible in the editor");
requireToken(app, "problems: normalizedItems.length ? []", "Embedded exam items do not automatically clear legacy problem links");
requireToken(authoring, "analyzeExamIndependence", "Draft readiness does not inspect exam-bank independence");
requireToken(authoring, "mh-exam-independence", "Exam-bank status is not rendered in Draft readiness");

const problems = [{ id: "practice-1", statement_ro: "Calculează suma 37 + 48.", statement_en: "Compute 37 + 48." }];
const exams = [{ id: "exam-old", items: [{ id: "old-1", prompt_ro: "Compară numerele 5402 și 5399.", prompt_en: "Compare 5402 and 5399." }] }];
const exact = analyzeExamIndependence({ id: "exam-new", items: [{ id: "x", prompt_ro: "Calculează suma 37 + 48." }], problems: [] }, { problems, exams });
if (!exact.blockingIssues.some((item) => item.code === "duplicate_problem_bank")) errors.push("Exact practice-bank duplicates are not blocked");

const repeatExam = analyzeExamIndependence({ id: "exam-new", items: [{ id: "x", prompt_ro: "Compară numerele 5402 și 5399." }], problems: [] }, { problems, exams });
if (!repeatExam.blockingIssues.some((item) => item.code === "duplicate_exam_bank")) errors.push("Exact cross-exam duplicates are not blocked");

const similar = analyzeExamIndependence({ id: "exam-new", items: [{ id: "x", prompt_ro: "Calculează suma 39 + 46." }], problems: [] }, { problems, exams });
if (!similar.warnings.some((item) => item.code === "similar_problem_bank")) errors.push("Small numeric variants are not surfaced as similarity warnings");

const fresh = analyzeExamIndependence({ id: "exam-new", items: [{ id: "x", prompt_ro: "Pe o axă, punctele A și B sunt la distanță de șase intervale egale; A corespunde lui 120, iar B lui 300. Determină valoarea unui interval." }], problems: [] }, { problems, exams });
if (fresh.blockingIssues.length) errors.push("Independent exam item was blocked incorrectly");

const legacyCreateErrors = validateExamPayload({ id: "legacy-new", title_ro: "Legacy", items: [], problems: ["practice-1"] }, { problems, exams, allowLegacyProblemLinks: false });
if (!legacyCreateErrors.some((message) => message.includes("item propriu")) || !legacyCreateErrors.some((message) => message.includes("nu pot reutiliza"))) errors.push("New legacy-linked exams are not rejected");

if (normalizeExamComparableText("<b>Numărul 1 234</b>") !== "numarul 1 234") errors.push("Prompt normalization is unstable");

if (sql) {
  requireToken(sql, "mh_exam_independent_bank_guard", "SQL backend exam-bank guard is missing");
  requireToken(sql, "mh_exam_prompt_fingerprint", "SQL exact-duplicate fingerprint is missing");
  requireToken(sql, "063", "SQL migration number is missing");
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log("MathHard Phase 5B.1 Independent Exam Bank audit passed.");
console.log("- new exams use embedded items only");
console.log("- exact practice/exam duplicates are blocked");
console.log("- small numeric variants are warnings, not automatic blockers");
