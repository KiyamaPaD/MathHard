import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const read = (path) => {
  const absolute = resolve(root, path);
  if (!existsSync(absolute)) {
    errors.push(`Missing file: ${path}`);
    return "";
  }
  return readFileSync(absolute, "utf8");
};
const sqlFiles = (directory, prefix = "") => readdirSync(directory).flatMap((name) => {
  if ([".git", "node_modules", "local-sql", ".netlify-dist", ".vs"].includes(name)) return [];
  const absolute = join(directory, name);
  const relative = prefix ? `${prefix}/${name}` : name;
  return statSync(absolute).isDirectory()
    ? sqlFiles(absolute, relative)
    : (name.toLowerCase().endsWith(".sql") ? [relative] : []);
});

const controller = read("js/roadmap-controller.js");
const css = read("css/roadmap.css");

if (!controller.includes('target_type || ""') || !controller.includes('=== "mathhard_m1"')) {
  errors.push("M1 curriculum notice must be scoped to the mathhard_m1 roadmap target type.");
}
if (!controller.includes("Ordinea MathHard") || !controller.includes("MathHard order")) {
  errors.push("MathHard curriculum ordering disclaimer is missing or not bilingual.");
}
if (!controller.includes("pot diferi de manual sau de planificarea profesorului")) {
  errors.push("Curriculum disclaimer must state that MathHard ordering can differ from school ordering.");
}
if (!controller.includes("conceptele, prerechizitele și acoperirea pentru examen")) {
  errors.push("Curriculum disclaimer must direct learners toward concepts, prerequisites and exam coverage.");
}
if (!controller.includes("M1 · Mate-Info")) {
  errors.push("M1 roadmap identity badge is missing.");
}
if (!controller.includes("renderMathHardCurriculumNotice(roadmap, language)")) {
  errors.push("Curriculum notice is not rendered in the roadmap experience.");
}
if (!css.includes(".mh-roadmap-curriculum-note") || !css.includes(".mh-roadmap-curriculum-badge")) {
  errors.push("Curriculum notice styling is missing.");
}
if (!controller.includes("data-roadmap-section-toggle") || !controller.includes("collapsedSections")) {
  errors.push("Roadmap stages must support independent collapse/expand controls.");
}
if (!controller.includes('aria-expanded="${collapsed ? "false" : "true"}"') || !controller.includes("mh-roadmap-section-body")) {
  errors.push("Roadmap stage collapse controls must expose accessible expanded state and a collapsible body.");
}
if (!css.includes(".mh-roadmap-section-body[hidden]") || !css.includes("display: none !important")) {
  errors.push("Collapsed roadmap stage bodies must stay hidden even when layout display rules apply.");
}
if (sqlFiles(root).length) {
  errors.push("Database SQL must remain outside the application repository.");
}

console.log("MathHard 090 Curriculum Foundation audit");
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exitCode = 1;
} else {
  console.log("- custom MathHard M1 roadmap identity: present");
  console.log("- school/manual numbering disclaimer: present");
  console.log("- concept/prerequisite/exam-coverage guidance: present");
  console.log("- compact responsive curriculum notice: present");
  console.log("- independent collapsible roadmap stages: present");
  console.log("- SQL kept outside Git: confirmed");
  console.log("MathHard 090 Curriculum Foundation audit passed.");
}
