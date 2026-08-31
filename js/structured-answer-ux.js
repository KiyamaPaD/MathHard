const STRUCTURED_MODE_VALUES = new Set(["structured", "multiline"]);

export const STRUCTURED_ANSWER_MAX_LENGTH = 1200;
export const STRUCTURED_ANSWER_MIN_ROWS = 3;
export const STRUCTURED_ANSWER_MAX_ROWS = 8;

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

/**
 * Canonical Phase 109 contract: answer_ui_mode="structured".
 * Compatibility aliases keep the UI safe while older/newer catalog payloads
 * may expose answer_mode="multiline" or an explicit structured_answer flag.
 */
export function isStructuredAnswerProblem(problem = {}) {
  const explicit = explicitBoolean(
    problem.structured_answer ?? problem.is_structured_answer
  );
  if (explicit !== null) return explicit;

  const mode = normalizedMode(
    problem.answer_ui_mode ??
    problem.answer_input_mode ??
    problem.input_mode ??
    problem.answer_mode
  );
  return STRUCTURED_MODE_VALUES.has(mode);
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

  textarea.addEventListener?.("input", resize);
  resize();
  return resize;
}
