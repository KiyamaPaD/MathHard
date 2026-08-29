import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const controller = readFileSync(resolve(root, "js/secure-problem-controller.js"), "utf8");
const app = readFileSync(resolve(root, "js/app.js"), "utf8");
const errors = [];

function expect(condition, message) {
  if (!condition) errors.push(message);
}

expect(controller.includes("function gradingFeedbackText"), "secure problem controller must render optional semantic-grading feedback");
expect(controller.includes('result?.gradable === false ? "needs_format" : "wrong"'), "ungradable semantic answers must have a non-punitive format feedback path");
expect(controller.includes('if (result?.gradable !== false) pushLocalAttempt(value, ok);'), "ungradable semantic format errors must not be persisted as local wrong attempts");
expect(controller.includes('needs_format: "⚠️ Răspunsul nu a putut fi interpretat pentru această problemă."'), "Romanian semantic format feedback is missing");
expect(controller.includes('needs_format: "⚠️ This answer could not be interpreted for this problem."'), "English semantic format feedback is missing");
expect(!controller.includes("SmartAnswer"), "secure problem grading must remain server-side and isolated from the legacy browser SmartAnswer engine");
expect(app.includes('{ label: "⊊", insert: "⊊", hint: "submultime stricta" }'), "math answer toolbar must expose strict-subset symbol ⊊");
expect(app.includes('{ label: "⊈", insert: "⊈", hint: "nu este submultime" }'), "math answer toolbar must expose not-subset symbol ⊈");

if (errors.length) {
  console.error("MathHard semantic problem grading audit failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("MathHard semantic problem grading audit");
console.log("- optional grading feedback UI: present");
console.log("- ungradable answers do not masquerade as ordinary mathematical mistakes: present");
console.log("- ungradable format errors are not stored as local wrong attempts: present");
console.log("- secure problem controller remains independent from SmartAnswer: confirmed");
console.log("- set-relation answer symbols ⊊ and ⊈ are available in the math toolbar: present");
console.log("MathHard semantic problem grading audit passed.");
