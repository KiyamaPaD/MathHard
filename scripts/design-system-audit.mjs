import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const errors = [];

function requireTokens(source, label, tokens) {
  for (const token of tokens) {
    if (!source.includes(token)) errors.push(`${label}: lipsește ${token}`);
  }
}

for (const page of ["index.html", "profile.html", "u.html"]) {
  const source = read(page);
  requireTokens(source, page, ["/css/design-system.css?v=4j3"]);
  const designIndex = source.indexOf("/css/design-system.css?v=4j3");
  const motionIndex = source.indexOf("/css/microinteractions.css?v=4i");
  if (designIndex < motionIndex) errors.push(`${page}: design-system.css trebuie încărcat după stilurile componentelor.`);
}

for (const page of ["404.html", "offline.html"]) {
  requireTokens(read(page), page, ["/css/system-page.css?v=4j"]);
}

const design = read("css/design-system.css");
requireTokens(design, "Design system", [
  "--mh-surface-1",
  "--mh-radius-xl",
  "--mh-shadow-lg",
  ".mh-shell-workspace-header",
  "position: relative",
  ".mh-shell-dashboard-grid { grid-template-columns: 1fr; }",
  ".profile-tabs",
  "grid-template-columns: repeat(5, minmax(0, 1fr))",
  "@media (max-width: 900px)",
  "body.mh-shell-ready > header .search",
]);

const shell = read("js/app-shell-controller.js");
requireTokens(shell, "App shell", [
  "const ICONS = Object.freeze",
  "function iconMarkup",
  'data-shell-utility="theme"',
  'data-shell-utility="language"',
  "mh-shell-bottom-icon",
  "mobileToggle.setAttribute(\"aria-label\", text.menu)",
]);
if (/icon:\s*["'][⌂◇◉▤◆▣↗◫✦≡⌁◷]/u.test(shell)) {
  errors.push("App shell: navigația folosește încă simboluri text în loc de pictograme SVG.");
}

const app = read("js/app.js");
if (/header_btn_theme_(?:dark|light):\s*["'][🌙☀]/u.test(app)) {
  errors.push("Header: etichetele temei conțin încă emoji.");
}
if (/langBtn\.textContent[^\n]+🌐/u.test(app)) {
  errors.push("Header: selectorul de limbă conține încă emoji.");
}

const problemCss = read("css/problem-workspace.css");
requireTokens(problemCss, "Problem workspace", [
  ".mh-problem-hero {",
  "position: relative",
  "top: auto",
  "position: static",
  "top: auto",
]);

const communityAdminCss = read("css/community-admin.css");
requireTokens(communityAdminCss, "Community Admin", [
  "#mhCommunityAdminBody",
  ".mh-community-admin-feedback:empty",
  "Phase 4J.1 — stable vertical rhythm",
  ".mh-community-integrity-editor",
]);

requireTokens(design, "Visual hotfix", [
  ".mh-secure-lesson-quiz > .quizHead",
  "position: static !important",
  "background: transparent !important",
  "#aboutModal.open",
  "padding-top: max(78px",
]);

if (/data-community-feedback-open=["']feedback["']/.test(design)) {
  errors.push("Sugestii: design system still forces a highlighted gradient on the trigger button.");
}

const feedbackCss = read("css/community-feedback.css");
requireTokens(feedbackCss, "Suggestions dialog header", [
  ".mh-community-feedback-dialog>header",
  "position:static",
  "border:0",
  "background:transparent",
  "backdrop-filter:none",
]);

requireTokens(shell, "Admin drawer state", [
  "function bindAdminDrawerState()",
  "const closeDrawer = () =>",
  'document.getElementById("closeAdmin")?.addEventListener("click", closeDrawer)',
]);
if (shell.includes("mhAdminFloatingClose") || shell.includes("mh-admin-floating-close")) {
  errors.push("The obsolete floating Admin close control is still present.");
}

requireTokens(problemCss, "Problem summary sticky layer", [
  ".mh-problem-workspace > .mh-problem-hero",
  "position: sticky",
  "top: 0",
  "z-index: 20",
  "background-color: var(--bg)",
]);

requireTokens(shell, "Distinct navigation icons", [
  `xp: '<circle cx="12" cy="12" r="9"`,
  `analytics: '<path d="M4 20V10"`,
]);

requireTokens(app, "Utility modal toggles", [
  'if (modal.classList.contains("open"))',
  'function toggleAbout(event)',
  'if (aboutModal.classList.contains("open"))',
]);

if (errors.length) {
  console.error("MathHard design-system audit failed:\n- " + errors.join("\n- "));
  process.exit(1);
}

console.log("MathHard 4J.3 sticky problem and Admin cleanup audit passed.");
