import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

async function importBrowserModule(relativePath) {
  const absolutePath = resolve(root, relativePath);
  const source = await readFile(absolutePath, "utf8");
  const encoded = Buffer.from(
    `${source}\n//# sourceURL=${pathToFileURL(absolutePath).href}`,
    "utf8"
  ).toString("base64");
  return import(`data:text/javascript;base64,${encoded}`);
}

class SessionStorageMock {
  #values = new Map();

  getItem(key) {
    return this.#values.has(key) ? this.#values.get(key) : null;
  }

  setItem(key, value) {
    this.#values.set(key, String(value));
  }

  removeItem(key) {
    this.#values.delete(key);
  }

  clear() {
    this.#values.clear();
  }
}

globalThis.sessionStorage = new SessionStorageMock();

const {
  catalogTotals,
  getContentCatalogDiagnostics,
  invalidateContentCatalogCache,
  loadContentCatalog
} = await importBrowserModule("js/content-repository.js");
const {
  finishExamAttempt,
  markLessonLearned,
  recordProblemEvent,
  startExamAttempt
} = await importBrowserModule("js/progress-repository.js");

function makeContentClient({ failures = {} } = {}) {
  const rows = {
    mh_lessons: [{ id: "lesson-1", title_ro: "Lecție Supabase" }],
    mh_problems: [{ id: "problem-1", lesson_id: "lesson-1", answer: "2" }],
    mh_exams: [{ id: "exam-1", problems: ["problem-1"] }]
  };

  return {
    from(table) {
      return {
        async select() {
          if (failures[table]) {
            return { data: null, error: new Error(failures[table]) };
          }
          return { data: rows[table] || [], error: null };
        }
      };
    }
  };
}

invalidateContentCatalogCache();
const contentClient = makeContentClient();
const catalog = await loadContentCatalog({ supabase: contentClient });

assert.deepEqual(catalogTotals(catalog), {
  lessonsTotal: 1,
  problemsTotal: 1,
  examsTotal: 1
});
assert.equal(getContentCatalogDiagnostics().status, "supabase");

const degradedCatalog = await loadContentCatalog({
  supabase: makeContentClient({ failures: { mh_problems: "temporary failure" } }),
  forceRefresh: true
});

assert.equal(degradedCatalog.problems.length, 1);
assert.equal(getContentCatalogDiagnostics().status, "degraded");
assert.deepEqual(getContentCatalogDiagnostics().staleGroups, ["problems"]);

invalidateContentCatalogCache();
await assert.rejects(
  () => loadContentCatalog({
    supabase: makeContentClient({ failures: { mh_lessons: "offline" } }),
    forceRefresh: true
  }),
  /could not be loaded from Supabase/i
);

const calls = [];
const progressClient = {
  rpc: async (name, args) => {
    calls.push({ name, args });
    return { data: [{ ok: true, name }], error: null };
  }
};

await markLessonLearned(progressClient, "lesson-1");
await recordProblemEvent(progressClient, "problem-1", "wrong");
await startExamAttempt(progressClient, "exam-1");
await finishExamAttempt(progressClient, "exam-1", 72.5);

assert.deepEqual(calls, [
  { name: "mh_mark_lesson_learned", args: { p_lesson_id: "lesson-1" } },
  { name: "mh_record_problem_event", args: { p_problem_id: "problem-1", p_event: "wrong" } },
  { name: "mh_start_exam_attempt", args: { p_exam_id: "exam-1" } },
  { name: "mh_finish_exam_attempt", args: { p_exam_id: "exam-1", p_score: 72.5 } }
]);

await assert.rejects(
  () => recordProblemEvent(progressClient, "problem-1", "invalid"),
  /Invalid problem event/
);

console.log("MathHard repository tests passed.");
