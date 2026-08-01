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
  requireTokens(source, page, ["/css/design-system.css?v=4j"]);
  const designIndex = source.indexOf("/css/design-system.css?v=4j");
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

if (errors.length) {
  console.error("MathHard design-system audit failed:\n- " + errors.join("\n- "));
  process.exit(1);
}

console.log("MathHard 4J design-system audit passed.");
