import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const checkedReferences = new Set();

const htmlFiles = ["index.html", "profile.html", "u.html", "404.html", "offline.html"];

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

function fail(message) {
  errors.push(message);
}

function stripQueryAndHash(value) {
  return String(value || "").split("#", 1)[0].split("?", 1)[0];
}

function isExternalReference(value) {
  return /^(?:[a-z]+:|\/\/|#)/i.test(value) || value.startsWith("data:");
}

function resolveLocalReference(ownerPath, rawReference) {
  const cleanReference = stripQueryAndHash(rawReference).trim();
  if (!cleanReference || isExternalReference(cleanReference)) return null;

  let decodedReference = cleanReference;
  try {
    decodedReference = decodeURIComponent(cleanReference);
  } catch {
    fail(`${ownerPath}: invalid encoded path ${JSON.stringify(rawReference)}.`);
  }

  return decodedReference.startsWith("/")
    ? resolve(root, `.${decodedReference}`)
    : resolve(root, dirname(ownerPath), decodedReference);
}

function checkReference(ownerPath, rawReference, kind) {
  const absolutePath = resolveLocalReference(ownerPath, rawReference);
  if (!absolutePath) return;

  const key = `${ownerPath}:${kind}:${absolutePath}`;
  if (checkedReferences.has(key)) return;
  checkedReferences.add(key);

  const relativePath = relative(root, absolutePath).replaceAll("\\", "/");
  if (relativePath.startsWith("../") || relativePath === "..") {
    fail(`${ownerPath}: ${kind} escapes the project root: ${rawReference}.`);
    return;
  }
  if (!existsSync(absolutePath)) {
    fail(`${ownerPath}: missing ${kind} ${rawReference} -> ${relativePath}.`);
  }
}

function auditHtml(relativePath) {
  const source = read(relativePath);
  const ids = new Map();

  for (const match of source.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)) {
    const id = match[1].trim();
    ids.set(id, (ids.get(id) || 0) + 1);
  }
  for (const [id, count] of ids) {
    if (count > 1) fail(`${relativePath}: duplicate id ${JSON.stringify(id)} (${count} occurrences).`);
  }

  const tagReferencePattern = /<(script|link|img|source|video|audio|a)\b[^>]*?\b(src|href|poster)\s*=\s*["']([^"']+)["'][^>]*>/gi;
  for (const match of source.matchAll(tagReferencePattern)) {
    const [, tag, attribute, value] = match;
    if (tag.toLowerCase() === "a" && value.startsWith("#")) continue;
    checkReference(relativePath, value, `${tag.toLowerCase()} ${attribute.toLowerCase()}`);
  }

  for (const match of source.matchAll(/\bpattern\s*=\s*["']([^"']+)["']/gi)) {
    const pattern = match[1];
    try {
      new RegExp(pattern, "v");
    } catch (error) {
      fail(`${relativePath}: invalid HTML pattern ${JSON.stringify(pattern)} for browser v-mode: ${error.message}`);
    }
  }

  for (const match of source.matchAll(/<button\b([^>]*)>/gi)) {
    if (!/\btype\s*=\s*["'](?:button|submit|reset)["']/i.test(match[1])) {
      fail(`${relativePath}: every button must declare an explicit type.`);
    }
  }

  for (const match of source.matchAll(/<img\b([^>]*)>/gi)) {
    if (!/\balt\s*=\s*["'][^"']*["']/i.test(match[1])) {
      fail(`${relativePath}: every image must declare alt text, including an empty decorative alt.`);
    }
  }

  for (const match of source.matchAll(/<a\b([^>]*)>/gi)) {
    const attributes = match[1];
    if (/\btarget\s*=\s*["']_blank["']/i.test(attributes)
      && !/\brel\s*=\s*["'][^"']*\bnoopener\b[^"']*["']/i.test(attributes)) {
      fail(`${relativePath}: target=_blank link is missing rel=noopener.`);
    }
  }
}

function walkFiles(directory, extension) {
  const output = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) output.push(...walkFiles(absolutePath, extension));
    else if (extname(entry.name) === extension) output.push(absolutePath);
  }
  return output;
}

function auditJavaScript(absolutePath) {
  const relativePath = relative(root, absolutePath).replaceAll("\\", "/");
  const source = readFileSync(absolutePath, "utf8");
  const importPatterns = [
    /\b(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
  ];

  for (const pattern of importPatterns) {
    for (const match of source.matchAll(pattern)) {
      const reference = match[1];
      if (!reference.startsWith(".") && !reference.startsWith("/")) continue;
      checkReference(relativePath, reference, "JavaScript import");
    }
  }
}

function auditCss(absolutePath) {
  const relativePath = relative(root, absolutePath).replaceAll("\\", "/");
  const source = readFileSync(absolutePath, "utf8");
  for (const match of source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    const reference = match[1].trim();
    if (!reference || reference.startsWith("#") || reference.startsWith("data:")) continue;
    checkReference(relativePath, reference, "CSS asset");
  }
}

for (const htmlFile of htmlFiles) {
  if (!existsSync(resolve(root, htmlFile))) fail(`Missing runtime page: ${htmlFile}.`);
  else auditHtml(htmlFile);
}

for (const absolutePath of walkFiles(resolve(root, "js"), ".js")) auditJavaScript(absolutePath);
for (const absolutePath of walkFiles(resolve(root, "css"), ".css")) auditCss(absolutePath);

const problemController = read("js/secure-problem-controller.js");
if (!problemController.includes('<section class="mh-problem-hero"')
  || problemController.includes('<header class="mh-problem-hero"')) {
  fail("Problem summary must remain a normal section and must not regress to the globally sticky header element.");
}

console.log("MathHard Phase 4K.1 runtime contract audit");
console.log(`- HTML pages checked: ${htmlFiles.length}`);
console.log(`- local runtime references checked: ${checkedReferences.size}`);

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("MathHard Phase 4K.1 runtime contract audit passed.");
}
