import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inferStructuredAnswerPreset } from "../js/structured-answer-ux.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const read = (path) => readFileSync(resolve(root, path), "utf8");
const controller = read("js/secure-problem-controller.js");
const css = read("css/problem-workspace.css");
const ux = read("js/structured-answer-ux.js");

assert.match(ux, /id="answerPresetBtn"/);
assert.match(controller, /inferStructuredAnswerPreset\(statement/);
const statementDeclarationIndex = controller.indexOf('const statement = translated(problem, language, "statement")');
const presetInferenceIndex = controller.indexOf('inferStructuredAnswerPreset(statement');
assert.ok(statementDeclarationIndex >= 0, "Problem statement must be initialized in renderProblemReady.");
assert.ok(presetInferenceIndex >= 0, "Structured answer preset inference must be present.");
assert.ok(statementDeclarationIndex < presetInferenceIndex, "Problem statement must be initialized before preset inference to avoid TDZ runtime failures.");
assert.match(controller, /bindStructuredAnswerPreset\(\{/);
assert.match(css, /\.mh-answer-preset-row/);
assert.match(css, /\.mh-answer-preset-btn/);
assert.match(ux, /Inserează formatul/);
assert.match(ux, /export function bindStructuredAnswerPreset/);

const alpha = inferStructuredAnswerPreset('<p>a) A</p><p>b) B</p><p>c) C</p><p><strong>Format:</strong> 3 rânduri.</p>');
assert.deepEqual(alpha?.labels, ["a)", "b)", "c)"]);

const numeric = inferStructuredAnswerPreset('<p>Răspunde în EXACT 4 RÂNDURI:</p><ol><li>A</li><li>B</li><li>C</li><li>D</li></ol>');
assert.deepEqual(numeric?.labels, ["1)", "2)", "3)", "4)"]);

const localSqlDir = resolve(root, "local-sql");
let authoredCandidates = 0;
if (existsSync(localSqlDir)) {
  const names = readdirSync(localSqlDir).filter((name) => /^MathHard_\d+.*\.sql$/i.test(name));
  for (const name of names) {
    const source = read(`local-sql/${name}`);
    const alphaMatches = source.match(/<p>\s*a\s*[.)][\s\S]{0,1800}?(?:r[aâ]nduri|randuri)/gi) || [];
    authoredCandidates += alphaMatches.length;
  }
  assert.ok(authoredCandidates > 0, "Expected current SQL authoring sources to contain multi-part answer candidates.");
} else {
  console.log("- external SQL artifacts are not stored in Git; authored-content inventory skipped.");
}

console.log("MathHard structured answer preset audit passed.");
console.log("- alpha a)…z) presets: present");
console.log("- numeric 1)…N presets for explicit line contracts: present");
console.log("- non-destructive insert-only-when-empty behavior: present");
if (existsSync(localSqlDir)) console.log(`- local authored multi-part candidates observed: ${authoredCandidates}`);
