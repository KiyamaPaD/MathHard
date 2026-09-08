const MH_KATEX_OPTS = {
  delimiters: [
    { left: '$$',  right: '$$',  display: true  },
    { left: '\\[', right: '\\]', display: true  },
    { left: '\\(', right: '\\)', display: false },
    { left: '$',   right: '$',   display: false }
  ],
  throwOnError: false,
  ignoredTags: ['script','noscript','style','textarea']
};

const MH_PREVIEW_MATH_FUNCTIONS = new Set([
  'sqrt','root','frac','abs','norm','floor','ceil',
  'sin','cos','tan','tg','cot','ctg','sec','csc','ln','log',
  'sum','prod','lim','int','iint','iiint','oint',
  'diff','dd','pdiff','partial','eval','binom','vec','hat','bar',
  'card','min','max','gcd','lcm'
]);

function mhPreviewSplitPrefix(rawLine) {
  const line = String(rawLine ?? '').trim();
  const match = line.match(/^(\([A-Za-z0-9]+\)|[A-Za-z0-9]+[.)])\s*(.*)$/);
  if (!match) return { prefix: '', expression: line };
  return { prefix: match[1], expression: String(match[2] || '').trim() };
}

function mhPreviewHasExplicitMathDelimiters(value) {
  const s = String(value ?? '').trim();
  return (
    (s.startsWith('\\(') && s.endsWith('\\)')) ||
    (s.startsWith('\\[') && s.endsWith('\\]')) ||
    (s.startsWith('$$') && s.endsWith('$$')) ||
    (s.startsWith('$') && s.endsWith('$') && s.length > 2)
  );
}

function mhPreviewStripKnownMathFunctions(value) {
  return String(value ?? '').replace(/\b([A-Za-z][A-Za-z0-9_]*)\s*\(/g, (match, name) => {
    return MH_PREVIEW_MATH_FUNCTIONS.has(String(name).toLowerCase()) ? '(' : match;
  });
}

/**
 * Universal answer-preview rule:
 * - math-only rows stay KaTeX;
 * - prose rows stay normal text, preserving spaces exactly.
 *
 * This intentionally does NOT try to typeset an entire natural-language answer
 * as mathematics. It fixes the old heuristic where some prose rows happened to
 * be rendered by KaTeX and lost visible word spacing while slightly longer rows
 * stayed plain text.
 */
function mhPreviewLineIsMathOnly(rawLine) {
  const { expression } = mhPreviewSplitPrefix(rawLine);
  const s = String(expression ?? '').trim();
  if (!s) return false;
  if (mhPreviewHasExplicitMathDelimiters(s)) return true;

  // Common structured-answer atoms that should remain plain prose/labels.
  if (/^(?:da|nu|yes|no|true|false|adev[aă]rat[aă]?|fals[aă]?|suficient[aă]?|necesar[aă]?)$/iu.test(s)) {
    return false;
  }

  let probe = mhPreviewStripKnownMathFunctions(s);

  // Remove LaTeX commands before looking for natural-language words.
  probe = probe
    .replace(/\\[A-Za-z]+\*?/g, ' ')
    .replace(/\\./g, ' ')
    .replace(/[0-9_{}()[\],.;:+\-*/=<>^|!%&~]/g, ' ')
    .replace(/[⇒⇔→↔≤≥≠≈∈∉⊂⊆⊊∪∩∅√∞πΣΠ∧∨¬]/g, ' ');

  const words = probe.match(/[A-Za-zĂÂÎȘȚăâîșț]+/g) || [];
  const naturalWords = words.filter((word) => {
    if (word.length < 3) return false;
    if (/^[A-ZĂÂÎȘȚ]+$/.test(word)) return false;
    return true;
  });

  return naturalWords.length === 0;
}

function mhPreviewRawLines(rawHost) {
  if (!rawHost) return [];
  const clone = rawHost.cloneNode(true);
  clone.querySelectorAll?.('br').forEach((br) => br.replaceWith('\n'));
  return String(clone.textContent || '').replace(/\r\n?/g, '\n').split('\n');
}

function mhPrepareStructuredAnswerPreview(target) {
  if (!target?.querySelectorAll) return;

  const previewRoots = [];
  if (target.matches?.('.mh-live-preview-render, .mh-live-preview')) previewRoots.push(target);
  target.querySelectorAll('.mh-live-preview-render').forEach((node) => previewRoots.push(node));

  for (const renderRoot of previewRoots) {
    const previewHost = renderRoot.closest?.('.mh-live-preview') || renderRoot.parentElement;
    const rawHost = previewHost?.querySelector?.('.mh-live-preview-raw');
    const rawLines = mhPreviewRawLines(rawHost);
    const renderedLines = [...renderRoot.querySelectorAll('.mh-live-preview-render-line')];

    renderedLines.forEach((lineEl, index) => {
      const rawLine = String(rawLines[index] ?? '').trim();
      if (!rawLine) return;

      const { expression } = mhPreviewSplitPrefix(rawLine);
      if (mhPreviewHasExplicitMathDelimiters(expression)) {
        // app.js has already built a preview string by this point. Restore the
        // user's explicit delimiters so KaTeX auto-render receives the original
        // expression instead of a second-pass conversion of the backslashes.
        lineEl.textContent = rawLine;
        lineEl.dataset.mhPreviewMode = 'math-explicit';
        return;
      }

      if (mhPreviewLineIsMathOnly(rawLine)) {
        lineEl.dataset.mhPreviewMode = 'math';
        return;
      }

      // Rebuild prose from the untouched raw answer, not from the generated
      // LaTeX string. This preserves every normal word space and punctuation.
      lineEl.textContent = rawLine;
      lineEl.dataset.mhPreviewMode = 'prose';
    });
  }
}

function MH_render(el){
  if (!window.renderMathInElement) return;
  const target = el || document.body;
  requestAnimationFrame(() => {
    mhPrepareStructuredAnswerPreview(target);
    renderMathInElement(target, MH_KATEX_OPTS);
  });
}

// Exposed only for deterministic release-gate tests / future preview reuse.
globalThis.mhPreviewLineIsMathOnly = mhPreviewLineIsMathOnly;
globalThis.mhPrepareStructuredAnswerPreview = mhPrepareStructuredAnswerPreview;

window.addEventListener('load', () => {
  MH_render(document.body);
});
