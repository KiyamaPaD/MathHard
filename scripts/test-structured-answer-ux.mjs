import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  STRUCTURED_ANSWER_MAX_LENGTH,
  STRUCTURED_ANSWER_MAX_NEWLINES,
  STRUCTURED_ANSWER_MAX_ROWS,
  STRUCTURED_ANSWER_MIN_ROWS,
  bindStructuredAnswerTextarea,
  canInsertStructuredAnswerNewline,
  countStructuredAnswerNewlines,
  isStructuredAnswerProblem,
  shouldSubmitAnswerOnKeydown,
  structuredTextareaMetrics
} from "../js/structured-answer-ux.js";

assert.equal(STRUCTURED_ANSWER_MAX_LENGTH, 1200);
assert.equal(STRUCTURED_ANSWER_MIN_ROWS, 3);
assert.equal(STRUCTURED_ANSWER_MAX_ROWS, 8);
assert.equal(STRUCTURED_ANSWER_MAX_NEWLINES, 12);

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
assert.equal(isStructuredAnswerProblem({ structured_answer: {} }), false);
assert.equal(isStructuredAnswerProblem({ answer_fields: [{ id: "a" }] }), true);
assert.equal(isStructuredAnswerProblem({}), false);

assert.equal(shouldSubmitAnswerOnKeydown({ key: "Enter", structured: false }), true);
assert.equal(shouldSubmitAnswerOnKeydown({ key: "Enter", structured: true }), false);
assert.equal(shouldSubmitAnswerOnKeydown({ key: "Enter", structured: true, ctrlKey: true }), true);
assert.equal(shouldSubmitAnswerOnKeydown({ key: "Enter", structured: true, metaKey: true }), true);
assert.equal(shouldSubmitAnswerOnKeydown({ key: "a", structured: true, ctrlKey: true }), false);

assert.equal(countStructuredAnswerNewlines("a\nb\nc"), 2);
assert.equal(canInsertStructuredAnswerNewline("a\nb"), true);
assert.equal(canInsertStructuredAnswerNewline(Array(13).fill("x").join("\n")), false);

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
fakeTextarea.value = Array(13).fill("x").join("\n");
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
assert.match(controllerSource, /shouldSubmitAnswerOnKeydown\(\{/);
assert.doesNotMatch(controllerSource, /\bP(?:8|9|11)\b/);

console.log("Structured Answer UX tests passed.");
