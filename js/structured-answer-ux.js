const STRUCTURED_MODE_VALUES = new Set(["structured", "multiline"]);
const SINGLE_LINE_MODE_VALUES = new Set(["singleline", "single_line", "single-line"]);

export const STRUCTURED_ANSWER_MAX_LENGTH = 500;
export const STRUCTURED_ANSWER_MIN_ROWS = 3;
export const STRUCTURED_ANSWER_MAX_ROWS = 8;
export const STRUCTURED_ANSWER_MAX_LINES = 16;
export const STRUCTURED_ANSWER_MAX_NEWLINES = STRUCTURED_ANSWER_MAX_LINES - 1;

const ANSWER_PRESET_MIN_LINES = 2;
const ANSWER_PRESET_MAX_LINES = STRUCTURED_ANSWER_MAX_LINES;

function statementToLines(value) {
  return String(value ?? "")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|li|div|section|article|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function explicitLineCount(statement) {
  const plain = statementToLines(statement).join(" ");
  const match = plain.match(/\b(?:exact\s+)?(\d{1,2})\s*(?:r[aâ]nduri|randuri|lines?)\b/i);
  if (!match) return 0;
  const count = Number(match[1]);
  return Number.isInteger(count) && count >= ANSWER_PRESET_MIN_LINES && count <= ANSWER_PRESET_MAX_LINES ? count : 0;
}

function alphaLabelsFromStatement(statement) {
  const labels = [];
  for (const line of statementToLines(statement)) {
    const match = line.match(/^([a-z])\s*[.)]\s*/i);
    if (match) labels.push(match[1].toLowerCase());
  }
  if (labels.length < ANSWER_PRESET_MIN_LINES) return [];
  const unique = [...new Set(labels)];
  if (unique.length !== labels.length) return [];
  const sequential = unique.every((label, index) => label === String.fromCharCode(97 + index));
  return sequential ? unique : [];
}

function orderedListCount(statement) {
  const html = String(statement ?? "");
  const blocks = html.match(/<ol\b[\s\S]*?<\/ol>/gi) || [];
  let count = 0;
  for (const block of blocks) count += (block.match(/<li\b/gi) || []).length;
  return count >= ANSWER_PRESET_MIN_LINES && count <= ANSWER_PRESET_MAX_LINES ? count : 0;
}

export function inferStructuredAnswerPreset(statement, { language = "ro" } = {}) {
  const alpha = alphaLabelsFromStatement(statement);
  const count = explicitLineCount(statement);

  if (alpha.length && (!count || count === alpha.length)) {
    const labels = alpha.map((label) => `${label})`);
    return {
      kind: "alpha",
      labels,
      lineCount: labels.length,
      text: labels.map((label) => `${label} `).join("\n"),
      summary: `${labels[0]}–${labels.at(-1)}`
    };
  }

  const listCount = orderedListCount(statement);
  const numericCount = count || listCount;
  if (numericCount >= ANSWER_PRESET_MIN_LINES && numericCount <= ANSWER_PRESET_MAX_LINES) {
    const labels = Array.from({ length: numericCount }, (_, index) => `${index + 1})`);
    return {
      kind: "numeric",
      labels,
      lineCount: numericCount,
      text: labels.map((label) => `${label} `).join("\n"),
      summary: language === "en" ? `${numericCount} lines` : `${numericCount} rânduri`
    };
  }

  return null;
}

export function canApplyStructuredAnswerPreset(currentValue) {
  return String(currentValue ?? "").trim().length === 0;
}

export function applyStructuredAnswerPreset(textarea, preset) {
  if (!textarea || !preset?.text || !canApplyStructuredAnswerPreset(textarea.value)) return false;
  textarea.value = preset.text;
  const firstLabelLength = String(preset.labels?.[0] || "").length + 1;
  textarea.setSelectionRange?.(firstLabelLength, firstLabelLength);
  textarea.dispatchEvent?.(new Event("input", { bubbles: true }));
  textarea.focus?.();
  return true;
}

export function structuredAnswerPresetMarkup(preset, { language = "ro" } = {}) {
  if (!preset) return "";
  const ro = language !== "en";
  const summary = preset.summary ? ` · ${preset.summary}` : "";
  return `<div class="mh-answer-preset-row"><button class="btn small mh-answer-preset-btn" id="answerPresetBtn" type="button">↳ ${ro ? "Inserează formatul" : "Insert answer format"}${summary}</button><span class="legend">${ro ? "Completezi doar după etichete." : "Fill in after the labels."}</span></div>`;
}

export function bindStructuredAnswerPreset({ button, textarea, preset, onApply = () => {} } = {}) {
  if (!button || !textarea || !preset) return () => {};
  const sync = () => { button.disabled = !canApplyStructuredAnswerPreset(textarea.value); };
  button.addEventListener?.("click", () => {
    if (applyStructuredAnswerPreset(textarea, preset)) onApply();
    sync();
  });
  textarea.addEventListener?.("input", sync);
  sync();
  return sync;
}

function normalizedMode(value) {
  return String(value ?? "").trim().toLowerCase();
}

function explicitBoolean(value) {
  if (value === true || value === false) return value;
  const normalized = normalizedMode(value);
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return null;
}

function explicitStructuredMetadata(value) {
  const booleanValue = explicitBoolean(value);
  if (booleanValue !== null) return booleanValue;

  if (Array.isArray(value)) {
    return value.length > 0 ? true : null;
  }

  if (value && typeof value === "object") {
    return Object.keys(value).length > 0 ? true : null;
  }

  const raw = String(value ?? "").trim();
  if (!raw) return null;

  if ((raw.startsWith("{") && raw.endsWith("}")) || (raw.startsWith("[") && raw.endsWith("]"))) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.length > 0 ? true : null;
      if (parsed && typeof parsed === "object") {
        return Object.keys(parsed).length > 0 ? true : null;
      }
    } catch {
      // Invalid JSON is not enough to activate structured mode.
    }
  }

  return null;
}

function firstStructuredSpec(problem = {}) {
  return problem.structured_answer ??
    problem.is_structured_answer ??
    problem.answer_structure ??
    problem.structured_fields ??
    problem.answer_fields ??
    null;
}

/**
 * Phase 109 hotfix: the problem answer editor is multiline by default.
 *
 * Bare Enter must always be safe for writing a multi-line solution. The catalog
 * currently does not guarantee answer_ui_mode/structured metadata for every
 * problem, so defaulting to single-line made Enter open the submit confirmation
 * instead of inserting a newline.
 *
 * Future problems can explicitly opt out with answer_ui_mode="singleline" (or
 * single_line / single-line). Explicit structured metadata still wins.
 */
export function isStructuredAnswerProblem(problem = {}) {
  const explicit = explicitStructuredMetadata(firstStructuredSpec(problem));
  if (explicit !== null) return explicit;

  const mode = normalizedMode(
    problem.answer_ui_mode ??
    problem.answer_input_mode ??
    problem.input_mode ??
    problem.answer_mode
  );

  if (STRUCTURED_MODE_VALUES.has(mode)) return true;
  if (SINGLE_LINE_MODE_VALUES.has(mode)) return false;

  // Fail safe for UX: Enter writes a new line instead of attempting a submit.
  return true;
}

export function shouldSubmitAnswerOnKeydown({
  key = "",
  ctrlKey = false,
  metaKey = false,
  structured = false
} = {}) {
  if (key !== "Enter") return false;
  return structured ? Boolean(ctrlKey || metaKey) : true;
}

export function countStructuredAnswerNewlines(value) {
  return (String(value ?? "").match(/\n/g) || []).length;
}

export function canInsertStructuredAnswerNewline(value, maxNewlines = STRUCTURED_ANSWER_MAX_NEWLINES) {
  return countStructuredAnswerNewlines(value) < maxNewlines;
}

export function clampStructuredAnswerNewlines(value, maxNewlines = STRUCTURED_ANSWER_MAX_NEWLINES) {
  const text = String(value ?? "");
  let newlineCount = 0;
  let output = "";

  for (const char of text) {
    if (char === "\n") {
      if (newlineCount >= maxNewlines) {
        output += " ";
        continue;
      }
      newlineCount += 1;
    }
    output += char;
  }

  return output;
}

function finitePositive(value, fallback) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

export function structuredTextareaMetrics(style = {}, {
  minRows = STRUCTURED_ANSWER_MIN_ROWS,
  maxRows = STRUCTURED_ANSWER_MAX_ROWS
} = {}) {
  const fontSize = finitePositive(style.fontSize, 16);
  const rawLineHeight = String(style.lineHeight ?? "").trim();
  const lineHeight = rawLineHeight.endsWith("px")
    ? finitePositive(rawLineHeight, fontSize * 1.5)
    : finitePositive(rawLineHeight, fontSize * 1.5);
  const paddingTop = finitePositive(style.paddingTop, 0);
  const paddingBottom = finitePositive(style.paddingBottom, 0);
  const borderTop = finitePositive(style.borderTopWidth, 0);
  const borderBottom = finitePositive(style.borderBottomWidth, 0);
  const chrome = paddingTop + paddingBottom + borderTop + borderBottom;

  return {
    lineHeight,
    chrome,
    minHeight: Math.ceil(lineHeight * minRows + chrome),
    maxHeight: Math.ceil(lineHeight * maxRows + chrome)
  };
}

/**
 * Applies the Phase 109 textarea behavior and returns a resize callback.
 * The callback is useful after programmatic value resets (e.g. replay mode).
 */
export function bindStructuredAnswerTextarea(textarea, {
  minRows = STRUCTURED_ANSWER_MIN_ROWS,
  maxRows = STRUCTURED_ANSWER_MAX_ROWS,
  maxNewlines = STRUCTURED_ANSWER_MAX_NEWLINES,
  getStyle = (element) => globalThis.getComputedStyle?.(element) || {}
} = {}) {
  if (!textarea || String(textarea.tagName || "").toUpperCase() !== "TEXTAREA") {
    return () => {};
  }

  textarea.style.resize = "none";
  textarea.style.overflowY = "hidden";
  textarea.style.lineHeight = textarea.style.lineHeight || "1.5";
  textarea.style.font = "inherit";

  const resize = () => {
    const metrics = structuredTextareaMetrics(getStyle(textarea), { minRows, maxRows });
    textarea.style.height = "auto";
    const scrollHeight = Math.max(0, Number(textarea.scrollHeight || 0));
    const nextHeight = Math.max(metrics.minHeight, Math.min(scrollHeight, metrics.maxHeight));
    if (nextHeight > 0) textarea.style.height = `${Math.ceil(nextHeight)}px`;
    textarea.style.overflowY = scrollHeight > metrics.maxHeight + 1 ? "auto" : "hidden";
  };

  textarea.addEventListener?.("keydown", (event) => {
    if (
      event?.key === "Enter" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !canInsertStructuredAnswerNewline(textarea.value, maxNewlines)
    ) {
      event.preventDefault?.();
    }
  });

  textarea.addEventListener?.("input", () => {
    const limitedValue = clampStructuredAnswerNewlines(textarea.value, maxNewlines);
    if (limitedValue !== textarea.value) {
      const cursor = Number(textarea.selectionStart ?? limitedValue.length);
      textarea.value = limitedValue;
      const nextCursor = Math.min(cursor, limitedValue.length);
      textarea.setSelectionRange?.(nextCursor, nextCursor);
    }
    resize();
  });
  resize();
  return resize;
}
