import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const controller = readFileSync(resolve(root, "js/gamification-admin-controller.js"), "utf8");

const failures = [];
const requireText = (text, label) => {
  if (!controller.includes(text)) failures.push(`missing: ${label}`);
};
const rejectText = (text, label) => {
  if (controller.includes(text)) failures.push(`unexpected: ${label}`);
};

rejectText('value="Reuniune și intersecție"', "C1 strongest-concept hardcode in Simulator UI");
rejectText('value="Diagrame cu 3 mulțimi"', "C1 review-concept hardcode in Simulator UI");
requireText('placeholder="opțional · ex. un concept din capitol"', "chapter-agnostic strongest concept placeholder");
requireText('placeholder="opțional · ex. un concept de consolidat"', "chapter-agnostic review concept placeholder");
requireText('selectedAchievement.progress_current', "Progress Lab achievement current progress render");
requireText('selectedAchievement.progress_target', "Progress Lab achievement target progress render");
requireText('chapterExtensionTotal ? "Verifică extensia" : "Fără extensie"', "zero-extension Progress Lab state");
requireText('state.lab.achievementId = "";', "chapter change resets achievement selection");
requireText('const leftMatch = leftChapter === chapterId ? 0 : 1;', "chapter achievements prioritized in Progress Lab");
requireText('${chapterCoreTotal} core · ${chapterVerificationTotal} verificări · ${chapterSynthesisTotal} sinteză · ${chapterPracticeTotal} probleme · ${chapterExtensionTotal} extensii', "chapter composition summary");

if (failures.length) {
  console.error("gamification-c4-audit failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("gamification-c4-audit passed");
