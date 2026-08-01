import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const index = read("index.html");
const css = read("css/admin-layout-polish.css");

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

expect(index.indexOf("admin-layout-polish.css") > index.indexOf("mobile-hardening.css"), "Phase 4E stylesheet must load after mobile hardening.");

[
  ".mh-admin-editor-header",
  ".mh-admin-savebar",
  ".mh-quality-bulk-bar",
  ".mh-roadmap-admin-head",
  ".mh-roadmap-admin-form > summary",
  ".mh-community-admin-editor",
  ".mh-lesson-quiz-admin-footer"
].forEach((selector) => {
  expect(css.includes(selector), `Missing overlap fix for ${selector}.`);
});

expect(css.includes("position: static !important"), "Nested sticky elements are not neutralized.");
expect(css.includes("grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr)"), "Community columns are not constrained.");
expect(css.includes("@media (max-width: 1180px)"), "Community layout lacks the wide responsive breakpoint.");
expect(css.includes("overflow-wrap: anywhere"), "Long Admin labels are not protected against overflow.");
expect(css.includes(".mh-concept-coverage-section"), "Concept coverage cards are not hardened.");
expect(css.includes(".mh-roadmap-admin-dashboard"), "Roadmap Studio is not hardened.");
expect(css.includes(".mh-quality-editor > header"), "Publication detail header is not isolated.");
expect(/\.mh-quality-editor\s*>\s*header\s*\{[^}]*position:\s*static\s*!important/s.test(css), "Publication detail header is still sticky through the global panel header rule.");
expect(/\.mh-quality-editor\s*>\s*header\s*\{[^}]*z-index:\s*auto\s*!important/s.test(css), "Publication detail header still keeps a floating stacking layer.");
expect(css.includes("grid-template-columns: minmax(0, 1fr) !important"), "Publication detail summary is not moved to its own row.");
expect(css.includes("justify-self: stretch"), "Publication state card can still float over the right column.");

// Phase 4F.1 — Community workspace centering and overflow containment.
expect(index.includes('/css/admin-layout-polish.css?v=4f1'), "Phase 4F.1 Admin layout stylesheet is not loaded.");
expect(css.includes('.mh-admin-workspace[data-admin-panel="community"] > #mhCommunityAdminStudio'), "Community workspace is not centered inside the Admin viewport.");
expect(css.includes('width: min(100%, 1380px)'), "Community workspace lacks the shared Admin content width.");
expect(css.includes('#mhCommunityAdminStudio .mh-community-admin-toolbar'), "Community toolbar containment is missing.");
expect(css.includes('grid-template-columns: minmax(0, 1fr) auto'), "Community toolbar can still push content outside the viewport.");
expect(css.includes('#mhCommunityAdminStudio #mhCommunityAdminBody'), "Community body width is not explicitly constrained.");


if (failures.length) {
  console.error("MathHard Phase 4F.1 Admin Layout audit failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("MathHard Phase 4F.1 Admin Layout audit passed.");
