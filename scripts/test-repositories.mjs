import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

async function importBrowserModule(relativePath) {
  const absolutePath = resolve(root, relativePath);
  const source = await readFile(absolutePath, "utf8");

  // The application intentionally uses browser ES modules with a .js
  // extension and has no package.json. Node would otherwise classify those
  // files as CommonJS. Loading the exact source through a data URL lets this
  // test execute it as ESM without changing the browser runtime or adding
  // project-wide Node configuration.
  const encoded = Buffer.from(
    `${source}\n//# sourceURL=${pathToFileURL(absolutePath).href}`,
    "utf8"
  ).toString("base64");

  return import(`data:text/javascript;base64,${encoded}`);
}

const { catalogTotals, mergeById } = await importBrowserModule(
  "js/content-repository.js"
);
const {
  finishExamAttempt,
  markLessonLearned,
  recordProblemEvent,
  startExamAttempt
} = await importBrowserModule("js/progress-repository.js");

const merged = mergeById(
  {
    lessons: [{ id: "l1", title_ro: "Local" }],
    problems: [{ id: "p1", answer: "1" }],
    exams: []
  },
  {
    lessons: [{ id: "l1", title_en: "Remote" }, { id: "l2" }],
    problems: [{ id: "p1", answer: "2" }],
    exams: [{ id: "e1" }]
  }
);

assert.equal(merged.lessons.length, 2);
assert.deepEqual(merged.lessons.find((x) => x.id === "l1"), {
  id: "l1",
  title_ro: "Local",
  title_en: "Remote"
});
assert.equal(merged.problems[0].answer, "2");
assert.deepEqual(catalogTotals(merged), {
  lessonsTotal: 2,
  problemsTotal: 1,
  examsTotal: 1
});

const calls = [];
const supabase = {
  rpc: async (name, args) => {
    calls.push({ name, args });
    return { data: [{ ok: true, name }], error: null };
  }
};

await markLessonLearned(supabase, "lesson-1");
await recordProblemEvent(supabase, "problem-1", "wrong");
await startExamAttempt(supabase, "exam-1");
await finishExamAttempt(supabase, "exam-1", 72.5);

assert.deepEqual(calls, [
  { name: "mh_mark_lesson_learned", args: { p_lesson_id: "lesson-1" } },
  { name: "mh_record_problem_event", args: { p_problem_id: "problem-1", p_event: "wrong" } },
  { name: "mh_start_exam_attempt", args: { p_exam_id: "exam-1" } },
  { name: "mh_finish_exam_attempt", args: { p_exam_id: "exam-1", p_score: 72.5 } }
]);

await assert.rejects(
  () => recordProblemEvent(supabase, "problem-1", "invalid"),
  /Invalid problem event/
);

console.log("MathHard repository tests passed.");
