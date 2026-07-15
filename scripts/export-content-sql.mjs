import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalCatalog,
  loadBundledCatalog,
  loadJsonCatalog,
  mergeCatalogsPreservingFallback,
  sqlJson,
  sqlString,
  sqlTextArray
} from "./content-tools-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const importOutputPath = resolve(process.cwd(), process.argv[2] || "MathHard-Phase-04-Content-Import.sql");
const rollbackOutputPath = resolve(process.cwd(), process.argv[3] || "MathHard-Phase-04-Content-Rollback.sql");
const batchId = "phase04-local-catalog-v1";

const bundle = canonicalCatalog(await loadBundledCatalog(root));
const json = canonicalCatalog(await loadJsonCatalog(root));
const catalog = canonicalCatalog(mergeCatalogsPreservingFallback(bundle, json));

function valuesSql(rows, mapper) {
  return rows.map((row) => `  (${mapper(row).join(", ")})`).join(",\n");
}

const lessonValues = valuesSql(catalog.lessons, (row) => [
  sqlString(row.id), sqlString(row.grade), sqlString(row.chapter), sqlTextArray(row.tags),
  sqlString(row.title_ro), sqlString(row.title_en), sqlString(row.learn_ro), sqlString(row.learn_en),
  sqlString(row.why_ro), sqlString(row.why_en), sqlString(row.body_ro), sqlString(row.body_en),
  sqlString(row.examples_ro), sqlString(row.examples_en), sqlTextArray(row.sources)
]);

const problemValues = valuesSql(catalog.problems, (row) => [
  sqlString(row.id), sqlString(row.lesson_id || null), String(row.difficulty), sqlString(row.olymp_level),
  sqlString(row.title_ro), sqlString(row.title_en), sqlString(row.statement_ro), sqlString(row.statement_en),
  sqlString(row.answer), sqlString(row.hint1_ro), sqlString(row.hint1_en), sqlString(row.hint2_ro),
  sqlString(row.hint2_en), sqlString(row.source)
]);

const examValues = valuesSql(catalog.exams, (row) => [
  sqlString(row.id), sqlString(row.type), String(row.year), sqlString(row.title_ro), sqlString(row.title_en),
  String(row.default_hours), sqlTextArray(row.problems), sqlJson(row.items), sqlString(row.scoring_profile),
  row.scoring_config === null ? "null" : sqlJson(row.scoring_config), sqlString(row.credit_html)
]);

const importSql = `-- MathHard Phase 04: import bundled content into Supabase\n` +
`-- Existing Supabase rows win: ON CONFLICT DO NOTHING never overwrites admin edits.\n` +
`-- Keep outside the Git repository.\n\n` +
`begin;\n\n` +
`create table if not exists public.mh_content_import_log (\n` +
`  batch_id text not null,\n` +
`  content_type text not null check (content_type in ('lesson', 'problem', 'exam')),\n` +
`  content_id text not null,\n` +
`  imported_at timestamptz not null default now(),\n` +
`  primary key (batch_id, content_type, content_id)\n` +
`);\n` +
`alter table public.mh_content_import_log enable row level security;\n\n` +
`with inserted as (\n` +
`  insert into public.mh_lessons (\n` +
`    id, grade, chapter, tags, title_ro, title_en, learn_ro, learn_en,\n` +
`    why_ro, why_en, body_ro, body_en, examples_ro, examples_en, sources\n` +
`  ) values\n${lessonValues}\n` +
`  on conflict (id) do nothing\n` +
`  returning id\n` +
`)\n` +
`insert into public.mh_content_import_log (batch_id, content_type, content_id)\n` +
`select ${sqlString(batchId)}, 'lesson', id from inserted\n` +
`on conflict do nothing;\n\n` +
`with inserted as (\n` +
`  insert into public.mh_problems (\n` +
`    id, lesson_id, difficulty, olymp_level, title_ro, title_en, statement_ro, statement_en,\n` +
`    answer, hint1_ro, hint1_en, hint2_ro, hint2_en, source\n` +
`  ) values\n${problemValues}\n` +
`  on conflict (id) do nothing\n` +
`  returning id\n` +
`)\n` +
`insert into public.mh_content_import_log (batch_id, content_type, content_id)\n` +
`select ${sqlString(batchId)}, 'problem', id from inserted\n` +
`on conflict do nothing;\n\n` +
`with inserted as (\n` +
`  insert into public.mh_exams (\n` +
`    id, type, year, title_ro, title_en, default_hours, problems, items,\n` +
`    scoring_profile, scoring_config, credit_html\n` +
`  ) values\n${examValues}\n` +
`  on conflict (id) do nothing\n` +
`  returning id\n` +
`)\n` +
`insert into public.mh_content_import_log (batch_id, content_type, content_id)\n` +
`select ${sqlString(batchId)}, 'exam', id from inserted\n` +
`on conflict do nothing;\n\n` +
`commit;\n\n` +
`notify pgrst, 'reload schema';\n\n` +
`select content_type, count(*) as inserted_by_phase04\n` +
`from public.mh_content_import_log\n` +
`where batch_id = ${sqlString(batchId)}\n` +
`group by content_type\n` +
`order by content_type;\n\n` +
`select 'mh_lessons' as table_name, count(*) as row_count from public.mh_lessons\n` +
`union all select 'mh_problems', count(*) from public.mh_problems\n` +
`union all select 'mh_exams', count(*) from public.mh_exams\n` +
`order by table_name;\n`;

const rollbackSql = `-- MathHard Phase 04 rollback\n` +
`-- Deletes only rows that were actually inserted by the Phase 04 batch and\n` +
`-- have not been edited since import. Keep outside the Git repository.\n\n` +
`begin;\n\n` +
`delete from public.mh_exams target\n` +
`using public.mh_content_import_log log\n` +
`where log.batch_id = ${sqlString(batchId)}\n` +
`  and log.content_type = 'exam'\n` +
`  and target.id = log.content_id\n` +
`  and target.updated_at <= log.imported_at + interval '5 seconds';\n\n` +
`delete from public.mh_problems target\n` +
`using public.mh_content_import_log log\n` +
`where log.batch_id = ${sqlString(batchId)}\n` +
`  and log.content_type = 'problem'\n` +
`  and target.id = log.content_id\n` +
`  and target.updated_at <= log.imported_at + interval '5 seconds';\n\n` +
`delete from public.mh_lessons target\n` +
`using public.mh_content_import_log log\n` +
`where log.batch_id = ${sqlString(batchId)}\n` +
`  and log.content_type = 'lesson'\n` +
`  and target.id = log.content_id\n` +
`  and target.updated_at <= log.imported_at + interval '5 seconds';\n\n` +
`delete from public.mh_content_import_log\n` +
`where batch_id = ${sqlString(batchId)};\n\n` +
`commit;\n\n` +
`notify pgrst, 'reload schema';\n`;

await Promise.all([
  writeFile(importOutputPath, importSql, "utf8"),
  writeFile(rollbackOutputPath, rollbackSql, "utf8")
]);

console.log(`Content import SQL written to ${importOutputPath}`);
console.log(`Content rollback SQL written to ${rollbackOutputPath}`);
console.log(`Lessons: ${catalog.lessons.length}; problems: ${catalog.problems.length}; exams: ${catalog.exams.length}`);
