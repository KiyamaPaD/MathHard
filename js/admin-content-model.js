import { normalizeExamItem } from "./content-model.js";

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

export function validateExamPayload(payload) {
  const errors = [];
  const items = Array.isArray(payload.items) ? payload.items : [];
  const legacyProblems = Array.isArray(payload.problems)
    ? payload.problems.filter(Boolean)
    : [];

  if (!payload.id) errors.push("Examenul trebuie să aibă ID.");

  if (!hasAnyText(payload.title_ro, payload.title_en)) {
    errors.push("Examenul trebuie să aibă titlu RO sau EN.");
  }

  if (!items.length && !legacyProblems.length) {
    errors.push("Examenul trebuie să aibă măcar un item sau un problem ID.");
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

  return errors;
}
