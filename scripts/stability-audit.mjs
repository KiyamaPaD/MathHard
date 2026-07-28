import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

function fail(message) {
  errors.push(message);
}

const app = read("js/app.js");
const bootstrap = read("js/performance-bootstrap.js");
const runtimeLoader = read("js/runtime-loader.js");

if (!bootstrap.includes("let initialized = false") ||
    !bootstrap.includes("if (initialized) return")) {
  fail("Performance bootstrap is missing its duplicate-initialization guard.");
}

if (!bootstrap.includes("safelyLoadModule") ||
    !bootstrap.includes("requestRouteModule") ||
    !bootstrap.includes("renderRouteError") ||
    !bootstrap.includes("data-lazy-route-retry")) {
  fail("Lazy modules must have handled failures and a visible route retry state.");
}

if (/void\s+loadModuleOnce\s*\(/.test(bootstrap) ||
    /void\s+loadRouteModule\s*\(/.test(bootstrap)) {
  fail("Performance bootstrap contains a lazy import without a rejection handler.");
}

if (!runtimeLoader.includes("removeFailedLazyScript") ||
    !runtimeLoader.includes('mhLazyRuntimeState = "failed"') ||
    !runtimeLoader.includes("classicScriptLoads.delete(absoluteSrc)")) {
  fail("Classic runtime loader cannot recover safely after a failed request.");
}

if (/void\s+loadAdminRuntime\(\)\s*;/.test(app)) {
  fail("Admin runtime prefetch contains an unhandled rejected promise.");
}

if (!app.includes("prepareAdminControllersForUser") ||
    !app.includes('let adminControllerUserId = ""') ||
    !app.includes("updateDraftContext: false")) {
  fail("Admin in-memory state is not isolated across authenticated users.");
}

const authHandlerStart = app.indexOf("async function handleResolvedAuthSession");
const authHandlerEnd = app.indexOf("const authUiController", authHandlerStart);
const authHandler = authHandlerStart >= 0 && authHandlerEnd > authHandlerStart
  ? app.slice(authHandlerStart, authHandlerEnd)
  : "";
const outgoingSave = authHandler.indexOf("adminDraftController?.saveNow()");
const userAssignment = authHandler.indexOf("MH_AUTH_USER = nextUser");
if (outgoingSave < 0 || userAssignment < 0 || outgoingSave > userAssignment) {
  fail("Outgoing Admin drafts must be saved before the active user changes.");
}

const restoreFunctionEnd = app.indexOf("let adminVisibilityEpoch", app.indexOf("function restoreLastAdminEditorContext"));
const preVisibilityBlock = app.slice(app.indexOf("function restoreLastAdminEditorContext"), restoreFunctionEnd);
if (/\n\s*mhSetTypeBlocks\([^\n]+\);\n\s*mhSetAdminModeCreate\(\);\n\s*mhRenderAdminList\(\);\n\s*restoreLastAdminEditorContext\(\);/.test(preVisibilityBlock)) {
  fail("Admin editor still performs eager startup initialization before authorization.");
}

console.log("MathHard final stability audit");
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("MathHard final stability audit passed.");
}
