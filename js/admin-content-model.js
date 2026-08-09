import { normalizeExamItem } from "./content-model.js";

function text(value) {
  return String(value ?? "").trim();
}

function stripMarkup(value) {
  return text(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/gi, " ");
}

export function normalizeExamComparableText(value, { ignoreNumbers = false } = {}) {
  let normalized = stripMarkup(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (ignoreNumbers) normalized = normalized.replace(/\d+(?:[.,]\d+)*/g, " # ");
  return normalized
    .replace(/[^a-z0-9#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function promptVariants(item) {
  return [item?.prompt_ro, item?.prompt_en, item?.statement_ro, item?.statement_en]
    .map((value) => normalizeExamComparableText(value))
    .filter((value, index, all) => value && all.indexOf(value) === index);
}

function shapeVariants(item) {
  return [item?.prompt_ro, item?.prompt_en, item?.statement_ro, item?.statement_en]
    .map((value) => normalizeExamComparableText(value, { ignoreNumbers: true }))
    .filter((value, index, all) => value && all.indexOf(value) === index);
}

function tokenSet(value) {
  return new Set(String(value || "").split(" ").filter((token) => token.length > 1));
}

function jaccard(left, right) {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (a.size < 5 || b.size < 5) return 0;
  let common = 0;
  for (const token of a) if (b.has(token)) common += 1;
  return common / (a.size + b.size - common);
}

function issue(code, itemId, match = {}, similarity = 1) {
  return {
    code,
    itemId: text(itemId),
    matchType: text(match.type),
    matchId: text(match.id),
    similarity: Number(similarity || 0)
  };
}

function sourceRows({ problems = [], exams = [], currentExamId = "" } = {}) {
  const rows = [];
  for (const problem of Array.isArray(problems) ? problems : []) {
    rows.push({ type: "problem", id: problem?.id, item: problem });
  }
  for (const exam of Array.isArray(exams) ? exams : []) {
    if (!exam?.id || String(exam.id) === String(currentExamId || "")) continue;
    (Array.isArray(exam.items) ? exam.items : []).forEach((item, index) => {
      rows.push({ type: "exam", id: `${exam.id}:${item?.id || index + 1}`, item });
    });
  }
  return rows;
}

export function analyzeExamIndependence(payload = {}, context = {}) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const legacyProblems = Array.isArray(payload?.problems) ? payload.problems.filter(Boolean) : [];
  const allowLegacyProblemLinks = Boolean(context?.allowLegacyProblemLinks);
  const blockers = [];
  const warnings = [];
  const sources = sourceRows(context);
  const seenExact = new Map();

  if (legacyProblems.length && !allowLegacyProblemLinks) {
    blockers.push(issue("legacy_problem_links", payload?.id));
  } else if (legacyProblems.length) {
    warnings.push(issue("legacy_exam", payload?.id));
  }
  if (items.length && legacyProblems.length) blockers.push(issue("mixed_exam_banks", payload?.id));

  items.forEach((item, index) => {
    const itemId = text(item?.id) || `item-${index + 1}`;
    const exact = promptVariants(item);
    const shapes = shapeVariants(item);

    for (const value of exact) {
      if (seenExact.has(value)) {
        blockers.push(issue("duplicate_within_exam", itemId, { type: "exam", id: seenExact.get(value) }));
      } else {
        seenExact.set(value, itemId);
      }
    }

    for (const source of sources) {
      const sourceExact = promptVariants(source.item);
      if (exact.some((value) => sourceExact.includes(value))) {
        blockers.push(issue(source.type === "problem" ? "duplicate_problem_bank" : "duplicate_exam_bank", itemId, source));
        continue;
      }

      const sourceShapes = shapeVariants(source.item);
      const structuralMatch = shapes.some((value) => value.length >= 18 && sourceShapes.includes(value));
      let bestSimilarity = 0;
      if (!structuralMatch) {
        for (const left of shapes) {
          for (const right of sourceShapes) bestSimilarity = Math.max(bestSimilarity, jaccard(left, right));
        }
      }
      if (structuralMatch || bestSimilarity >= 0.82) {
        warnings.push(issue(source.type === "problem" ? "similar_problem_bank" : "similar_exam_bank", itemId, source, structuralMatch ? 0.99 : bestSimilarity));
      }
    }
  });

  const dedupe = (list) => {
    const seen = new Set();
    return list.filter((entry) => {
      const key = [entry.code, entry.itemId, entry.matchType, entry.matchId].join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const blockingIssues = dedupe(blockers);
  const similarityWarnings = dedupe(warnings);
  return {
    independent: blockingIssues.length === 0,
    blockingIssues,
    warnings: similarityWarnings,
    legacyProblems: [...legacyProblems]
  };
}

export function examIndependenceIssueLabel(entry, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  const item = entry?.itemId ? ` (${entry.itemId})` : "";
  const target = entry?.matchId ? ` → ${entry.matchId}` : "";
  const labels = english ? {
    legacy_problem_links: "New exams cannot reuse IDs from the practice problem bank.",
    mixed_exam_banks: "An exam cannot mix embedded exam items with practice-problem links.",
    duplicate_within_exam: "The same prompt appears twice inside this exam.",
    duplicate_problem_bank: "This exam item duplicates a practice problem.",
    duplicate_exam_bank: "This exam item duplicates an item from another exam.",
    similar_problem_bank: "Very similar to a practice problem; review before saving.",
    similar_exam_bank: "Very similar to an item from another exam; review before saving.",
    legacy_exam: "Legacy exam: it still references the old practice-problem bank. Convert it when editing its items."
  } : {
    legacy_problem_links: "Examenele noi nu pot reutiliza ID-uri din banca de Probleme.",
    mixed_exam_banks: "Un examen nu poate combina itemi proprii cu legături spre banca de Probleme.",
    duplicate_within_exam: "Același enunț apare de două ori în acest examen.",
    duplicate_problem_bank: "Itemul de examen dublează o problemă din banca de practică.",
    duplicate_exam_bank: "Itemul de examen dublează un item din alt examen.",
    similar_problem_bank: "Foarte asemănător cu o problemă de practică; verifică înainte de salvare.",
    similar_exam_bank: "Foarte asemănător cu un item din alt examen; verifică înainte de salvare.",
    legacy_exam: "Examen legacy: încă folosește vechea bancă de Probleme. Convertește-l când îi editezi itemii."
  };
  return `${labels[entry?.code] || entry?.code || ""}${item}${target}`;
}

export function clampOptionCount(value) {
  return Math.max(2, Math.min(8, Number(value) || 4));
}

export function getOptionLabels(optionMode, optionsCount) {
  if (optionMode === "A-D") return ["A", "B", "C", "D"];
  if (optionMode === "A-E") return ["A", "B", "C", "D", "E"];

  const count = clampOptionCount(optionsCount);
  return Array.from({ length: count }, (_, index) => String.fromCharCode(65 + index));
}

export function ensureDraftMcqShape(item) {
  const mode = item.option_mode || "A-D";
  const labels = getOptionLabels(mode, item.options_count || item.options?.length || 4);
  const oldOptions = Array.isArray(item.options) ? item.options : [];

  const byLabel = new Map(
    oldOptions.map((option, index) => [
      String(option?.label || labels[index] || "").trim().toUpperCase(),
      option
    ])
  );

  item.options = labels.map((label, index) => {
    const old = byLabel.get(label) || oldOptions[index] || {};
    return {
      id: old.id || `opt_${item.id || "item"}_${index}`,
      label,
      text_ro: old.text_ro || old.text || "",
      text_en: old.text_en || old.text || "",
      is_correct: Boolean(old.is_correct)
    };
  });

  item.options_count = labels.length;
  item.option_mode = mode;

  if (!item.allow_multiple) {
    let foundOne = false;
    item.options.forEach((option) => {
      if (option.is_correct && !foundOne) {
        foundOne = true;
      } else if (option.is_correct) {
        option.is_correct = false;
      }
    });
  }

  return item;
}

export function normalizeDraftExamItem(item, index) {
  const base = normalizeExamItem(item, index);

  if (base.type === "mcq") {
    return ensureDraftMcqShape(base);
  }

  return {
    ...base,
    type: "open",
    option_mode: base.option_mode || "A-D"
  };
}

export function tagsFromInput(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}


export function linesFromInput(value) {
  return [...new Set(
    String(value || "")
      .split(/[,\n\r]+/)
      .map((entry) => entry.trim())
      .filter(Boolean)
  )];
}

export function problemsArrayFromInput(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function hasAnyText(...values) {
  return values.some((value) => String(value ?? "").trim() !== "");
}

export function validateExamPayload(payload, context = {}) {
  const errors = [];
  const items = Array.isArray(payload.items) ? payload.items : [];
  const legacyProblems = Array.isArray(payload.problems)
    ? payload.problems.filter(Boolean)
    : [];
  const allowLegacyProblemLinks = Boolean(context?.allowLegacyProblemLinks);

  if (!payload.id) errors.push("Examenul trebuie să aibă ID.");

  if (!hasAnyText(payload.title_ro, payload.title_en)) {
    errors.push("Examenul trebuie să aibă titlu RO sau EN.");
  }

  if (!items.length && !(allowLegacyProblemLinks && legacyProblems.length)) {
    errors.push("Examenul trebuie să aibă cel puțin un item propriu; banca de Probleme nu se reutilizează în examene.");
  }

  const seenIds = new Set();

  items.forEach((rawItem, index) => {
    const item = normalizeDraftExamItem(rawItem, index);
    const label = `Item ${index + 1}`;

    if (!item.id) {
      errors.push(`${label}: lipsește id-ul.`);
    } else if (seenIds.has(item.id)) {
      errors.push(`${label}: id duplicat (${item.id}).`);
    } else {
      seenIds.add(item.id);
    }

    if (!hasAnyText(item.prompt_ro, item.prompt_en)) {
      errors.push(`${label}: lipsește prompt-ul (RO sau EN).`);
    }

    if (!Number.isFinite(Number(item.points)) || Number(item.points) < 0) {
      errors.push(`${label}: punctaj invalid.`);
    }

    if (item.type === "open") {
      if (!String(item.answer || "").trim()) {
        errors.push(`${label}: item open fără answer.`);
      }
      return;
    }

    if (item.type !== "mcq") {
      errors.push(`${label}: tip necunoscut (${item.type}).`);
      return;
    }

    const options = Array.isArray(item.options) ? item.options : [];
    const correctCount = options.filter((option) => option.is_correct).length;

    if (options.length < 2) {
      errors.push(`${label}: item mcq trebuie să aibă cel puțin 2 opțiuni.`);
    }

    if (options.length > 8) {
      errors.push(`${label}: item mcq are prea multe opțiuni (maxim 8).`);
    }

    const labels = options
      .map((option) => String(option.label || "").trim())
      .filter(Boolean);

    if (labels.length !== options.length) {
      errors.push(`${label}: una sau mai multe opțiuni nu au label valid.`);
    } else if (new Set(labels).size !== labels.length) {
      errors.push(`${label}: există label-uri duplicate la opțiuni.`);
    }

    options.forEach((option, optionIndex) => {
      if (!hasAnyText(option.text_ro, option.text_en)) {
        errors.push(`${label}: opțiunea ${option.label || optionIndex + 1} nu are text.`);
      }
    });

    if (!item.allow_none && correctCount === 0) {
      errors.push(`${label}: trebuie marcată cel puțin o variantă corectă.`);
    }

    if (!item.allow_multiple && correctCount > 1) {
      errors.push(`${label}: allow_multiple este OFF, deci ai voie la o singură variantă corectă.`);
    }

    if (item.option_mode === "A-D" && options.length !== 4) {
      errors.push(`${label}: modul A-D cere exact 4 opțiuni.`);
    }

    if (item.option_mode === "A-E" && options.length !== 5) {
      errors.push(`${label}: modul A-E cere exact 5 opțiuni.`);
    }

    if (item.option_mode === "custom") {
      const expectedCount = clampOptionCount(item.options_count || options.length || 4);
      if (options.length !== expectedCount) {
        errors.push(`${label}: numărul de opțiuni nu bate cu options_count.`);
      }
    }
  });

  const independence = analyzeExamIndependence(payload, { ...context, allowLegacyProblemLinks });
  independence.blockingIssues.forEach((entry) => errors.push(examIndependenceIssueLabel(entry, "ro")));

  return errors;
}
