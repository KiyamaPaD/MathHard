import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const controller = readFileSync(resolve(root, "js/admin-history-controller.js"), "utf8");
const css = readFileSync(resolve(root, "css/admin-history.css"), "utf8");
const errors = [];

function requireToken(source, token, message) {
  if (!source.includes(token)) errors.push(message);
}

requireToken(controller, "mh-admin-history-inline-detail", "Responsive inline history detail is missing.");
requireToken(controller, "async function selectEntry", "Immediate history selection path is missing.");
requireToken(controller, "state.versionsLoading = true;\n    render();\n    await loadVersions", "History selection must render before waiting for versions.");
requireToken(controller, "versionsRequestEpoch", "Stale version-request protection is missing.");
requireToken(controller, "state.selectedId !== selectedId", "Version responses are not guarded against selection changes.");
requireToken(controller, 'aria-expanded="${active}"', "History rows do not expose their selected state.");
requireToken(css, ".mh-admin-history-item.is-active", "Responsive active history-card shell is missing.");
requireToken(css, ".mh-admin-history-inline-detail", "Responsive inline detail styling is missing.");
requireToken(css, ".mh-admin-history-detail { display: none; }", "The detached detail pane is still visible on narrow layouts.");

const narrowBlock = css.match(/@media \(max-width: 980px\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!narrowBlock.includes(".mh-admin-history-inline-detail")) {
  errors.push("Inline history details are not enabled in the <=980px layout.");
}

console.log("MathHard Admin History interaction audit");
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exitCode = 1;
} else {
  console.log("- selected row renders immediately: present");
  console.log("- stale version responses cannot overwrite a newer selection: present");
  console.log("- narrow layout opens details directly below the selected card: present");
  console.log("MathHard Admin History interaction audit passed.");
}
