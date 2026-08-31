const STRUCTURED_MODE_VALUES = new Set(["structured", "multiline"]);
const SINGLE_LINE_MODE_VALUES = new Set(["singleline", "single_line", "single-line"]);

export const STRUCTURED_ANSWER_MAX_LENGTH = 1200;
export const STRUCTURED_ANSWER_MIN_ROWS = 3;
export const STRUCTURED_ANSWER_MAX_ROWS = 8;
export const STRUCTURED_ANSWER_MAX_NEWLINES = 12;

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
      !event.altKey &&
      !canInsertStructuredAnswerNewline(textarea.value, maxNewlines)
    ) {
      event.preventDefault?.();
    }
  });

  textarea.addEventListener?.("input", resize);
  resize();
  return resize;
}
