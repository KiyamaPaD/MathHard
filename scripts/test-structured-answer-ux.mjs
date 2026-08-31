import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  STRUCTURED_ANSWER_MAX_LENGTH,
  STRUCTURED_ANSWER_MAX_ROWS,
  STRUCTURED_ANSWER_MIN_ROWS,
  bindStructuredAnswerTextarea,
  isStructuredAnswerProblem,
  shouldSubmitAnswerOnKeydown,
  structuredTextareaMetrics
} from "../js/structured-answer-ux.js";

assert.equal(STRUCTURED_ANSWER_MAX_LENGTH, 1200);
assert.equal(STRUCTURED_ANSWER_MIN_ROWS, 3);
assert.equal(STRUCTURED_ANSWER_MAX_ROWS, 8);

assert.equal(isStructuredAnswerProblem({ answer_ui_mode: "structured" }), true);
assert.equal(isStructuredAnswerProblem({ answer_ui_mode: "singleline" }), false);
assert.equal(isStructuredAnswerProblem({ answer_mode: "multiline" }), true);
assert.equal(isStructuredAnswerProblem({ answer_mode: "singleline" }), false);
assert.equal(isStructuredAnswerProblem({ structured_answer: true }), true);
assert.equal(isStructuredAnswerProblem({ structured_answer: "true" }), true);
assert.equal(isStructuredAnswerProblem({ structured_answer: false, answer_ui_mode: "structured" }), false);
assert.equal(isStructuredAnswerProblem({}), false);

assert.equal(shouldSubmitAnswerOnKeydown({ key: "Enter", structured: false }), true);
assert.equal(shouldSubmitAnswerOnKeydown({ key: "Enter", structured: true }), false);
assert.equal(shouldSubmitAnswerOnKeydown({ key: "Enter", structured: true, ctrlKey: true }), true);
assert.equal(shouldSubmitAnswerOnKeydown({ key: "Enter", structured: true, metaKey: true }), true);
assert.equal(shouldSubmitAnswerOnKeydown({ key: "a", structured: true, ctrlKey: true }), false);


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

fakeTextarea.scrollHeight = 400;
resize();
assert.equal(fakeTextarea.style.height, "216px");
assert.equal(fakeTextarea.style.overflowY, "auto");


const controllerSource = readFileSync(
  fileURLToPath(new URL("../js/secure-problem-controller.js", import.meta.url)),
  "utf8"
);
assert.match(controllerSource, /const structuredAnswer = isStructuredAnswerProblem\(problem\);/);
assert.match(controllerSource, /<textarea id="answerInput"/);
assert.match(controllerSource, /maxlength="\$\{STRUCTURED_ANSWER_MAX_LENGTH\}"/);
assert.match(controllerSource, /bindStructuredAnswerTextarea\(input\)/);
assert.match(controllerSource, /shouldSubmitAnswerOnKeydown\(\{/);
assert.doesNotMatch(controllerSource, /\bP(?:8|9|11)\b/);

console.log("Structured Answer UX tests passed.");
