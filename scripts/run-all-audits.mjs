import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const currentFile = fileURLToPath(import.meta.url);
const startedAt = Date.now();

const preferredLast = new Map([
  ["runtime-contract-audit.mjs", 90],
  ["stability-audit.mjs", 91],
  ["security-audit.mjs", 92],
  ["validate-project.mjs", 98],
  ["test-repositories.mjs", 99]
]);

const auditFiles = readdirSync(scriptsDirectory)
  .filter((name) => name.endsWith(".mjs"))
  .map((name) => resolve(scriptsDirectory, name))
  .filter((absolutePath) => absolutePath !== currentFile)
  .filter((absolutePath) => !absolutePath.endsWith("write-deploy-manifest.mjs"))
  .filter((absolutePath) => !absolutePath.endsWith("build-static-site.mjs"))
  .sort((left, right) => {
    const leftName = left.split(/[\\/]/).at(-1);
    const rightName = right.split(/[\\/]/).at(-1);
    const weightDifference = (preferredLast.get(leftName) || 0) - (preferredLast.get(rightName) || 0);
    return weightDifference || leftName.localeCompare(rightName);
  });

const failures = [];

console.log(`MathHard full release gate — ${auditFiles.length} audit files\n`);

for (const [index, absolutePath] of auditFiles.entries()) {
  const name = absolutePath.split(/[\\/]/).at(-1);
  const auditStartedAt = Date.now();
  console.log(`\n[${index + 1}/${auditFiles.length}] ${name}`);

  const result = spawnSync(process.execPath, [absolutePath], {
    cwd: resolve(scriptsDirectory, ".."),
    stdio: "inherit",
    env: {
      ...process.env,
      NO_COLOR: "1",
      TERM: process.env.TERM || "dumb"
    }
  });

  const duration = ((Date.now() - auditStartedAt) / 1000).toFixed(2);
  if (result.status !== 0) {
    failures.push({ name, status: result.status ?? 1 });
    console.error(`FAILED: ${name} (${duration}s)`);
  } else {
    console.log(`PASSED: ${name} (${duration}s)`);
  }
}

const totalDuration = ((Date.now() - startedAt) / 1000).toFixed(2);
console.log("\nMathHard release gate summary");
console.log(`- passed: ${auditFiles.length - failures.length}`);
console.log(`- failed: ${failures.length}`);
console.log(`- duration: ${totalDuration}s`);

if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure.name} exited with code ${failure.status}.`);
  process.exitCode = 1;
} else {
  console.log("MathHard full release gate passed.");
}
