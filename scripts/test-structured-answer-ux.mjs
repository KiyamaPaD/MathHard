import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  STRUCTURED_ANSWER_MAX_LENGTH,
  STRUCTURED_ANSWER_MAX_LINES,
  STRUCTURED_ANSWER_MAX_NEWLINES,
  STRUCTURED_ANSWER_MAX_ROWS,
  STRUCTURED_ANSWER_MIN_ROWS,
  applyStructuredAnswerPreset,
  bindStructuredAnswerPreset,
  bindStructuredAnswerTextarea,
  canApplyStructuredAnswerPreset,
  canInsertStructuredAnswerNewline,
  clampStructuredAnswerNewlines,
  countStructuredAnswerNewlines,
  inferStructuredAnswerPreset,
  isStructuredAnswerProblem,
  shouldSubmitAnswerOnKeydown,
  structuredAnswerPresetMarkup,
  structuredTextareaMetrics
} from "../js/structured-answer-ux.js";

assert.equal(STRUCTURED_ANSWER_MAX_LENGTH, 500);
assert.equal(STRUCTURED_ANSWER_MIN_ROWS, 3);
assert.equal(STRUCTURED_ANSWER_MAX_ROWS, 8);
assert.equal(STRUCTURED_ANSWER_MAX_LINES, 16);
assert.equal(STRUCTURED_ANSWER_MAX_NEWLINES, 15);

assert.equal(isStructuredAnswerProblem({ answer_ui_mode: "structured" }), true);
assert.equal(isStructuredAnswerProblem({ answer_ui_mode: "singleline" }), false);
assert.equal(isStructuredAnswerProblem({ answer_ui_mode: "single_line" }), false);
assert.equal(isStructuredAnswerProblem({ answer_mode: "multiline" }), true);
assert.equal(isStructuredAnswerProblem({ answer_mode: "singleline" }), false);
assert.equal(isStructuredAnswerProblem({ structured_answer: true }), true);
assert.equal(isStructuredAnswerProblem({ structured_answer: "true" }), true);
assert.equal(isStructuredAnswerProblem({ structured_answer: false, answer_ui_mode: "structured" }), false);
assert.equal(isStructuredAnswerProblem({ structured_answer: { version: 1, blocks: [{ id: "a" }] } }), true);
assert.equal(isStructuredAnswerProblem({ structured_answer: JSON.stringify({ version: 1, blocks: [{ id: "a" }] }) }), true);
assert.equal(isStructuredAnswerProblem({ structured_answer: {} }), true);
assert.equal(isStructuredAnswerProblem({ answer_fields: [{ id: "a" }] }), true);
assert.equal(isStructuredAnswerProblem({}), true);
assert.equal(isStructuredAnswerProblem({ answer_ui_mode: "single-line" }), false);

assert.equal(shouldSubmitAnswerOnKeydown({ key: "Enter", structured: false }), true);
assert.equal(shouldSubmitAnswerOnKeydown({ key: "Enter", structured: true }), false);
assert.equal(shouldSubmitAnswerOnKeydown({ key: "Enter", structured: true, ctrlKey: true }), true);
assert.equal(shouldSubmitAnswerOnKeydown({ key: "Enter", structured: true, metaKey: true }), true);
assert.equal(shouldSubmitAnswerOnKeydown({ key: "a", structured: true, ctrlKey: true }), false);

assert.equal(countStructuredAnswerNewlines("a\nb\nc"), 2);
assert.equal(canInsertStructuredAnswerNewline("a\nb"), true);
assert.equal(canInsertStructuredAnswerNewline(Array(16).fill("x").join("\n")), false);
assert.equal(clampStructuredAnswerNewlines(Array(18).fill("x").join("\n")).split("\n").length, 16);

const alphaPreset = inferStructuredAnswerPreset(
  '<p>Calculează:</p><p>a) 2+3</p><p>b) 4+5</p><p>c) 6+7</p><p><strong>Format:</strong> 3 rânduri.</p>'
);
assert.equal(alphaPreset?.kind, "alpha");
assert.deepEqual(alphaPreset?.labels, ["a)", "b)", "c)"]);
assert.equal(alphaPreset?.text, "a) \nb) \nc) ");

const longAlphaPreset = inferStructuredAnswerPreset(
  '<p>a) A</p><p>b) B</p><p>c) C</p><p>d) D</p><p>e) E</p><p>f) F</p><p>g) G</p><p>h) H</p><p>i) I</p><p>j) J</p><p>k) K</p><p>l) L</p><p>m) M</p><p><strong>Format obligatoriu:</strong> exact 13 rânduri.</p>'
);
assert.equal(longAlphaPreset?.labels.at(-1), "m)");
assert.equal(longAlphaPreset?.lineCount, 13);

const orderedPreset = inferStructuredAnswerPreset(
  '<p>Răspunde în <strong>EXACT 9 RÂNDURI</strong>:</p><ol><li>unu</li><li>doi</li><li>trei</li><li>patru</li><li>cinci</li><li>șase</li><li>șapte</li><li>opt</li><li>nouă</li></ol>'
);
assert.equal(orderedPreset?.kind, "numeric");
assert.equal(orderedPreset?.lineCount, 9);
assert.equal(orderedPreset?.labels[0], "1)");
assert.equal(orderedPreset?.labels[8], "9)");

const genericLinesPreset = inferStructuredAnswerPreset('<p>Răspunde în <strong>2 rânduri</strong>: valoarea, apoi justificarea.</p>');
assert.equal(genericLinesPreset?.text, "1) \n2) ");
assert.equal(inferStructuredAnswerPreset('<p>Calculează 2+3.</p>'), null);
assert.equal(canApplyStructuredAnswerPreset(""), true);
assert.equal(canApplyStructuredAnswerPreset("   "), true);
assert.equal(canApplyStructuredAnswerPreset("a) 5"), false);

const presetListeners = new Map();
let presetFocused = false;
let presetSelection = null;
const presetTextarea = {
  value: "",
  setSelectionRange(start, end) { presetSelection = [start, end]; },
  dispatchEvent(event) { presetListeners.set(event.type, event); },
  focus() { presetFocused = true; }
};
assert.equal(applyStructuredAnswerPreset(presetTextarea, alphaPreset), true);
assert.equal(presetTextarea.value, "a) \nb) \nc) ");
assert.deepEqual(presetSelection, [3, 3]);
assert.equal(presetFocused, true);
assert.equal(presetListeners.has("input"), true);
assert.equal(applyStructuredAnswerPreset(presetTextarea, alphaPreset), false);

const metrics = structuredTextareaMetrics({
  fontSize: "16px",
  lineHeight: "24px",
  paddingTop: "11px",
  paddingBottom: "11px",
  borderTopWidth: "1px",
  borderBottomWidth: "1px"
});
assert.equal(metrics.minHeight, 96);
assert.equal(metrics.maxHeight, 216);

const listeners = new Map();
const fakeTextarea = {
  tagName: "TEXTAREA",
  value: "",
  scrollHeight: 100,
  style: {},
  addEventListener(type, callback) {
    listeners.set(type, callback);
  }
};
const resize = bindStructuredAnswerTextarea(fakeTextarea, {
  getStyle: () => ({
    fontSize: "16px",
    lineHeight: "24px",
    paddingTop: "11px",
    paddingBottom: "11px",
    borderTopWidth: "1px",
    borderBottomWidth: "1px"
  })
});
assert.equal(fakeTextarea.style.height, "100px");
assert.equal(fakeTextarea.style.overflowY, "hidden");
assert.equal(typeof listeners.get("input"), "function");
assert.equal(typeof listeners.get("keydown"), "function");

fakeTextarea.scrollHeight = 400;
resize();
assert.equal(fakeTextarea.style.height, "216px");
assert.equal(fakeTextarea.style.overflowY, "auto");

let prevented = false;
fakeTextarea.value = Array(16).fill("x").join("\n");
listeners.get("keydown")({
  key: "Enter",
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  preventDefault() { prevented = true; }
});
assert.equal(prevented, true);

prevented = false;
listeners.get("keydown")({
  key: "Enter",
  ctrlKey: false,
  metaKey: false,
  altKey: true,
  preventDefault() { prevented = true; }
});
assert.equal(prevented, true);

fakeTextarea.value = Array(18).fill("x").join("\n");
listeners.get("input")({});
assert.equal(fakeTextarea.value.split("\n").length, 16);

prevented = false;
listeners.get("keydown")({
  key: "Enter",
  ctrlKey: true,
  metaKey: false,
  altKey: false,
  preventDefault() { prevented = true; }
});
assert.equal(prevented, false);

const controllerSource = readFileSync(
  fileURLToPath(new URL("../js/secure-problem-controller.js", import.meta.url)),
  "utf8"
);
assert.match(controllerSource, /const structuredAnswer = isStructuredAnswerProblem\(problem\);/);
assert.match(controllerSource, /<textarea id="answerInput"/);
assert.match(controllerSource, /maxlength="\$\{STRUCTURED_ANSWER_MAX_LENGTH\}"/);
assert.match(controllerSource, /bindStructuredAnswerTextarea\(input\)/);
assert.match(controllerSource, /answerPresetBtn/);
assert.match(controllerSource, /inferStructuredAnswerPreset\(statement/);
assert.match(controllerSource, /bindStructuredAnswerPreset\(\{/);
assert.match(structuredAnswerPresetMarkup(alphaPreset), /Inserează formatul/);
assert.match(controllerSource, /shouldSubmitAnswerOnKeydown\(\{/);
assert.doesNotMatch(controllerSource, /\bP(?:8|9|11)\b/);


const appSource = readFileSync(fileURLToPath(new URL("../js/app.js", import.meta.url)), "utf8");
assert.match(appSource, /expression\.match\(\/\[A-Za-zĂÂÎȘȚăâîșț\]/);

console.log("Structured Answer UX tests passed.");
