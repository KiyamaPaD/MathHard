import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const read = (path) => readFileSync(resolve(root, path), "utf8");
const requireFile = (path) => { if (!existsSync(resolve(root, path))) errors.push(`Missing ${path}`); };
const requireText = (path, pattern, message) => { if (!pattern.test(read(path))) errors.push(message); };

for (const path of [
  "netlify.toml",
  "site.webmanifest",
  "robots.txt",
  "sitemap.xml",
  "css/beta-readiness.css",
  "js/beta-readiness-controller.js",
  "js/system-page.js",
  "404.html",
  "offline.html"
]) requireFile(path);

for (const page of ["index.html", "profile.html", "u.html"]) {
  requireText(page, /site\.webmanifest/, `${page} must load the web manifest.`);
  requireText(page, /beta-readiness\.css\?v=4g4/, `${page} must load beta readiness styles.`);
  requireText(page, /mathhard-build[^>]+(?:4g4|4h|4i|4j|4k1|5a1|5a7)/, `${page} must expose the current beta-or-later build label.`);
}
requireText("profile.html", /name="robots" content="noindex,nofollow"/, "Private profile editor must be noindex.");
requireText("js/performance-bootstrap.js", /beta-readiness-controller\.js/, "Index must load beta readiness lazily.");
requireText("profile.html", /beta-readiness-controller\.js\?v=4i/, "Profile must load beta readiness controller.");
requireText("u.html", /beta-readiness-controller\.js\?v=4i/, "Public profile must load beta readiness controller.");
requireText("js/beta-readiness-controller.js", /data-community-feedback-open/, "Recovery UI must connect to feedback.");
requireText("js/beta-readiness-controller.js", /unhandledrejection/, "Unhandled promise recovery is missing.");
requireText("js/community-feedback-controller.js", /communityFeedbackContentType/, "Feedback context type is missing.");
requireText("js/community-feedback-controller.js", /communityFeedbackContentId/, "Feedback context id is missing.");
requireText("js/community-feedback-controller.js", /communityFeedbackSubject/, "Contextual feedback subject is missing.");
requireText("js/runtime-diagnostics.js", /phase-5a7-content-templates/, "Runtime diagnostics build label is stale.");
requireText("netlify.toml", /X-Content-Type-Options\s*=\s*"nosniff"/, "Netlify nosniff header is missing.");
requireText("netlify.toml", /X-Frame-Options\s*=\s*"DENY"/, "Netlify frame protection is missing.");
requireText("netlify.toml", /Cache-Control\s*=\s*"no-cache, no-store, must-revalidate"/, "HTML no-cache policy is missing.");
requireText("robots.txt", /Disallow:\s*\/profile\.html/, "Profile editor must be excluded from crawling.");
requireText("sitemap.xml", /https:\/\/mathhard\.app\//, "Sitemap must use the production domain.");

for (const page of ["404.html", "offline.html"]) {
  const source = read(page);
  if (/\sonclick\s*=/.test(source)) errors.push(`${page} must not contain inline onclick handlers.`);
  if (!/system-page\.js\?v=4i/.test(source)) errors.push(`${page} must load system-page.js.`);
}

console.log("MathHard Phase 4G.4 Beta Readiness audit");
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("MathHard Phase 4G.4 Beta Readiness audit passed.");
}
