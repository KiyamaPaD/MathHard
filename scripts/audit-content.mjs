import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CONTENT_KEYS,
  canonicalCatalog,
  countDuplicateIds,
  loadBundledCatalog,
  loadJsonCatalog,
  mergeCatalogsPreservingFallback
} from "./content-tools-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = canonicalCatalog(await loadBundledCatalog(root));
const json = canonicalCatalog(await loadJsonCatalog(root));
const merged = canonicalCatalog(mergeCatalogsPreservingFallback(bundle, json));

const report = {
  generatedAt: new Date().toISOString(),
  counts: {},
  overlaps: {},
  duplicates: {},
  missingTranslations: {},
  orphanProblems: [],
  missingExamProblemReferences: [],
  invalidDifficulty: [],
  invalidIds: []
};

for (const key of CONTENT_KEYS) {
  const bundleIds = new Set(bundle[key].map((item) => item.id).filter(Boolean));
  const jsonIds = new Set(json[key].map((item) => item.id).filter(Boolean));

  report.counts[key] = {
    bundle: bundleIds.size,
    json: jsonIds.size,
    merged: new Set(merged[key].map((item) => item.id).filter(Boolean)).size
  };
  report.overlaps[key] = [...bundleIds].filter((id) => jsonIds.has(id));
  report.duplicates[key] = {
    bundle: countDuplicateIds(bundle[key]),
    json: countDuplicateIds(json[key])
  };
}

const lessonIds = new Set(merged.lessons.map((item) => item.id));
const problemIds = new Set(merged.problems.map((item) => item.id));

report.orphanProblems = merged.problems
  .filter((problem) => problem.lesson_id && !lessonIds.has(problem.lesson_id))
  .map((problem) => ({ id: problem.id, lesson_id: problem.lesson_id }));

for (const exam of merged.exams) {
  for (const problemId of exam.problems) {
    if (!problemIds.has(problemId)) {
      report.missingExamProblemReferences.push({ exam_id: exam.id, problem_id: problemId });
    }
  }
}

report.invalidDifficulty = merged.problems
  .filter((problem) => !Number.isInteger(problem.difficulty) || problem.difficulty < 0 || problem.difficulty > 5)
  .map((problem) => ({ id: problem.id, difficulty: problem.difficulty }));

for (const key of CONTENT_KEYS) {
  report.invalidIds.push(
    ...merged[key]
      .filter((item) => !item.id || /\s/.test(item.id))
      .map((item) => ({ kind: key, id: item.id }))
  );
}

report.missingTranslations.lessons = merged.lessons
  .filter((item) => !item.title_ro || !item.title_en || !item.body_ro || !item.body_en)
  .map((item) => ({
    id: item.id,
    missing: [
      !item.title_ro ? "title_ro" : null,
      !item.title_en ? "title_en" : null,
      !item.body_ro ? "body_ro" : null,
      !item.body_en ? "body_en" : null
    ].filter(Boolean)
  }));

report.missingTranslations.problems = merged.problems
  .filter((item) => !item.title_ro || !item.title_en || !item.statement_ro || !item.statement_en)
  .map((item) => ({
    id: item.id,
    missing: [
      !item.title_ro ? "title_ro" : null,
      !item.title_en ? "title_en" : null,
      !item.statement_ro ? "statement_ro" : null,
      !item.statement_en ? "statement_en" : null
    ].filter(Boolean)
  }));

report.missingTranslations.exams = merged.exams
  .filter((item) => !item.title_ro || !item.title_en)
  .map((item) => ({
    id: item.id,
    missing: [!item.title_ro ? "title_ro" : null, !item.title_en ? "title_en" : null].filter(Boolean)
  }));

console.log("MathHard content audit");
for (const key of CONTENT_KEYS) {
  const counts = report.counts[key];
  console.log(`- ${key}: data.js=${counts.bundle}, JSON=${counts.json}, merged=${counts.merged}, overlap=${report.overlaps[key].length}`);
}
console.log(`- orphan problems: ${report.orphanProblems.length}`);
console.log(`- missing exam problem references: ${report.missingExamProblemReferences.length}`);
console.log(`- invalid difficulties: ${report.invalidDifficulty.length}`);
console.log(`- invalid IDs: ${report.invalidIds.length}`);
console.log(`- lessons with incomplete RO/EN core fields: ${report.missingTranslations.lessons.length}`);
console.log(`- problems with incomplete RO/EN core fields: ${report.missingTranslations.problems.length}`);
console.log(`- exams with incomplete RO/EN titles: ${report.missingTranslations.exams.length}`);

const jsonFlagIndex = process.argv.indexOf("--json");
if (jsonFlagIndex !== -1) {
  const outputPath = process.argv[jsonFlagIndex + 1];
  if (!outputPath) throw new Error("--json requires an output path.");
  await writeFile(resolve(process.cwd(), outputPath), JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(`Audit JSON written to ${outputPath}`);
}

if (
  Object.values(report.duplicates).some((group) => group.bundle.length || group.json.length) ||
  report.orphanProblems.length ||
  report.missingExamProblemReferences.length ||
  report.invalidDifficulty.length ||
  report.invalidIds.length
) {
  process.exitCode = 2;
}
