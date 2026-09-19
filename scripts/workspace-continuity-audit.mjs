import { readFileSync } from "node:fs";

const app = readFileSync("js/app.js", "utf8");
const continuity = readFileSync("js/workspace-continuity-controller.js", "utf8");
const studio = readFileSync("js/admin-studio-controller.js", "utf8");
const drafts = readFileSync("js/admin-draft-controller.js", "utf8");
const errors = [];
const requireAll = (source, label, tokens) => tokens.forEach((token) => { if (!source.includes(token)) errors.push(`${label}: missing ${token}`); });

requireAll(app, "app integration", [
  'import("./workspace-continuity-controller.js?v=154")',
  'drawer.dataset.workspaceItemId=item.id||""',
  'examDrawer.dataset.workspaceItemId=exam.id||""',
  'workspaceContinuityController?.restoreContent()'
]);
requireAll(continuity, "continuity controller", [
  'mh_content_workspace_v1',
  'mh_admin_workspace_v1',
  'mh_workspace_scroll_v1',
  'restoreElementScroll',
  'data-workspace-item-id',
  'data-admin-panel',
  'data-gamification-tab',
  'data-community-tab',
  'data-concept-view',
  'button.dataset.accessState !== "granted"',
  'window.addEventListener("pagehide"'
]);
requireAll(studio, "admin panel persistence", ['"concepts", "quality"', '"tags", "gamification", "community", "history"']);
requireAll(drafts, "lesson editor tab persistence", ['["quiz", "practice"].includes(parsed.lesson_tab)', '["quiz", "practice"].includes(getLessonTab?.())']);

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exitCode = 1;
} else {
  console.log("Workspace continuity audit passed.");
  console.log("- content drawer item + scroll restoration: present");
  console.log("- Admin drawer/panel/subtab + scroll restoration: present");
  console.log("- roadmap/app route scroll continuity: present");
  console.log("- lesson editor Practice tab survives refresh: present");
}
