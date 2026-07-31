import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootArgIndex = process.argv.indexOf("--root");
const root = rootArgIndex >= 0 && process.argv[rootArgIndex + 1]
  ? resolve(process.argv[rootArgIndex + 1])
  : resolve(scriptDir, "..");

const failures = [];
const warnings = [];
const rpcNames = new Set();
const tableNames = new Set();
const allowedExtensions = new Set([".js", ".mjs", ".html", ".json", ".md"]);
const ignoredDirectories = new Set([".git", "node_modules", ".netlify", "dist", "build", "coverage"]);

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function read(relativePath) {
  const fullPath = resolve(root, relativePath);
  if (!existsSync(fullPath)) {
    fail(`Missing security-audit target: ${relativePath}`);
    return "";
  }
  return readFileSync(fullPath, "utf8");
}

function walk(directory, output = []) {
  if (!existsSync(directory)) return output;
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) continue;
    const fullPath = resolve(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) walk(fullPath, output);
    else if (allowedExtensions.has(extname(entry).toLowerCase())) output.push(fullPath);
  }
  return output;
}

function lineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

const targets = [
  "js/admin-draft-controller.js",
  "js/browser-state.js",
  "js/content-repository.js",
  "js/secure-evaluation-repository.js",
  "js/secure-exam-repository.js",
  "js/app.js",
  "js/profile.js",
  "js/supabase-client.js"
];

const sources = new Map(targets.map((path) => [path, read(path)]));
const allFiles = [
  ...walk(resolve(root, "js")),
  ...["index.html", "profile.html", "README.md"]
    .map((path) => resolve(root, path))
    .filter(existsSync)
];

const hardSecretPatterns = [
  { pattern: /sb_secret_[A-Za-z0-9_-]+/g, label: "Supabase secret key" },
  { pattern: /service[_-]?role\s*[:=]\s*["'][^"']+/gi, label: "service role credential" },
  { pattern: /(?:ADMIN_PASS|MATHHARD_SUPER_SECRET)\s*[:=]/gi, label: "legacy admin secret" },
  { pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g, label: "private key" }
];

for (const fullPath of allFiles) {
  const source = readFileSync(fullPath, "utf8");
  const displayPath = relative(root, fullPath).replaceAll("\\", "/");

  for (const { pattern, label } of hardSecretPatterns) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      fail(`${displayPath}:${lineNumber(source, match.index)} exposes a ${label}.`);
    }
  }

  const sensitiveLogPattern = /console\.(?:log|info|debug|warn|error)\s*\([^\n;]*(?:access_token|refresh_token|authorization\s*:|document\.cookie|localStorage\.getItem\([^)]*(?:token|session))/gi;
  for (const match of source.matchAll(sensitiveLogPattern)) {
    fail(`${displayPath}:${lineNumber(source, match.index)} may log credentials or session material.`);
  }

  const genericPayloadLogPattern = /console\.(?:log|info|debug)\s*\([^\n;]*(?:\bsession\b|\buser\b|\bpayload\b|\banswer\b|\bmetadata\b)/gi;
  for (const match of source.matchAll(genericPayloadLogPattern)) {
    warn(`${displayPath}:${lineNumber(source, match.index)} logs a potentially sensitive object; review before production.`);
  }

  for (const match of source.matchAll(/\.rpc\(\s*["']([^"']+)["']/g)) rpcNames.add(match[1]);
  for (const match of source.matchAll(/\brpc\(\s*[^,\n]+,\s*["']([^"']+)["']/g)) rpcNames.add(match[1]);
  for (const match of source.matchAll(/\.from\(\s*["']([^"']+)["']/g)) tableNames.add(match[1]);
}

const adminDraft = sources.get("js/admin-draft-controller.js") || "";
if (!adminDraft.includes("DRAFT_TTL_MS") || !adminDraft.includes("MAX_DRAFT_BYTES")) {
  fail("Admin drafts need TTL and payload-size limits.");
}
if (!adminDraft.includes("owner_scope") || !adminDraft.includes("if (!scope || !storageKey) return false")) {
  fail("Admin drafts must fail closed when no authenticated user scope is available.");
}
if (/userId\s*\|\|\s*["']anonymous["']/.test(adminDraft)) {
  fail("Admin drafts still use a shared anonymous storage scope.");
}
if (!adminDraft.includes("BLOCKED_FIELD_PATTERN") || !adminDraft.includes("data-sensitive")) {
  fail("Admin draft serialization needs a sensitive-field denylist.");
}
if (!adminDraft.includes('form.removeEventListener("input"') || !adminDraft.includes('form.removeEventListener("change"')) {
  fail("Admin draft controller does not remove form listeners during cleanup.");
}

const browserState = sources.get("js/browser-state.js") || "";
if (!browserState.includes("DEFAULT_MAX_STORAGE_BYTES") || !browserState.includes("byteLength")) {
  fail("Browser storage helpers need payload-size enforcement.");
}
if (!browserState.includes("if (!base") || !browserState.includes("!scope")) {
  fail("User-scoped browser storage must refuse keys without a user scope.");
}

const contentRepository = sources.get("js/content-repository.js") || "";
if (!contentRepository.includes("SENSITIVE_CATALOG_KEY") || !contentRepository.includes("containsSensitiveCatalogData")) {
  fail("Content cache needs a sensitive-field persistence guard.");
}
if (!contentRepository.includes("MAX_CACHE_BYTES") || !contentRepository.includes("[authenticated]")) {
  fail("Content cache needs size limits and redacted diagnostics.");
}
if (!contentRepository.includes("inFlightLoad?.userId === userId")) {
  fail("Content catalog requests are not deduplicated per user.");
}

const secureEvaluation = sources.get("js/secure-evaluation-repository.js") || "";
if (!secureEvaluation.includes("sanitizeLearningEventMetadata") || !secureEvaluation.includes("BLOCKED_METADATA_KEY")) {
  fail("Learning-event metadata must be filtered before RPC submission.");
}
if (!secureEvaluation.includes("runSingleFlight") || !secureEvaluation.includes("recentLearningEvents")) {
  fail("Secure evaluation RPCs need duplicate-request prevention.");
}

const secureExam = sources.get("js/secure-exam-repository.js") || "";
if (!secureExam.includes("sanitizeSecureExamAnswer") || !secureExam.includes("assertOnlyKeys")) {
  fail("Secure exam answer RPC needs a strict payload allowlist.");
}
if (!secureExam.includes("enqueueAttemptMutation") || !secureExam.includes("attemptMutationTails")) {
  fail("Secure exam state mutations must be serialized and deduplicated per attempt.");
}

const app = sources.get("js/app.js") || "";
if (!app.includes("getVerifiedActiveUser") || !app.includes('from("user_roles")')) {
  fail("Admin access must verify the active Supabase user and user_roles.");
}
if (!app.includes("setAdminButtonVisibility(false") || !app.includes("isCurrentUserAdmin(activeUser)")) {
  fail("Admin access is not visibly fail-closed and revalidated on entry.");
}

const supabaseClient = sources.get("js/supabase-client.js") || "";
if (!supabaseClient.includes("sb_publishable_")) {
  warn("Supabase client does not visibly use the publishable-key format; verify no anon/service secret was substituted.");
}
if (/service[_-]?role/i.test(supabaseClient) || /sb_secret_/i.test(supabaseClient)) {
  fail("Frontend Supabase client contains a server-side credential.");
}

const sensitiveRpcNamePattern = /(?:admin|submit|save|cancel|delete|publish|reveal|hint|start|finish|complete|mark|upsert|update)/i;
const sensitiveRpcs = [...rpcNames].filter((name) => sensitiveRpcNamePattern.test(name)).sort();

console.log("\nMathHard Phase 18C.2 static security audit");
console.log(`Root: ${root}`);
console.log(`RPC inventory (${rpcNames.size}): ${[...rpcNames].sort().join(", ") || "none"}`);
console.log(`Sensitive RPC candidates (${sensitiveRpcs.length}): ${sensitiveRpcs.join(", ") || "none"}`);
console.log(`Table inventory (${tableNames.size}): ${[...tableNames].sort().join(", ") || "none"}`);
console.log("Database RLS, grants, SECURITY DEFINER search_path and EXECUTE privileges must be verified with the separate read-only Supabase SQL audit.");

if (warnings.length) {
  console.warn("\nWarnings:");
  warnings.forEach((message) => console.warn(`- ${message}`));
}

if (failures.length) {
  console.error("\nSecurity audit failed:");
  failures.forEach((message) => console.error(`- ${message}`));
  process.exitCode = 1;
} else {
  console.log("\nStatic security audit passed.");
}
