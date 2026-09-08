import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const source = readFileSync(fileURLToPath(new URL('../js/katex-init.js', import.meta.url)), 'utf8');

assert.match(source, /function mhPreviewLineIsMathOnly/);
assert.match(source, /function mhPrepareStructuredAnswerPreview/);
assert.match(source, /lineEl\.textContent = rawLine/);
assert.match(source, /mhPreviewHasExplicitMathDelimiters\(expression\)/);
assert.match(source, /mhPrepareStructuredAnswerPreview\(target\);\s*\n\s*renderMathInElement/);

const sandbox = {
  console,
  globalThis: {},
  window: {
    renderMathInElement() {},
    addEventListener() {}
  },
  document: { body: {} },
  requestAnimationFrame(callback) { callback(); }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'katex-init.js' });

const isMath = sandbox.mhPreviewLineIsMathOnly;
assert.equal(typeof isMath, 'function');

// Pure mathematics remains KaTeX.
assert.equal(isMath('p(x) → q(x)'), true);
assert.equal(isMath('Mp=Mq'), true);
assert.equal(isMath('{-2,-1,0,1,2}'), true);
assert.equal(isMath('x^2 <= 4'), true);
assert.equal(isMath('sqrt(2)'), true);
assert.equal(isMath('a) p⇒q'), true);

// Natural-language answer rows remain normal text and therefore preserve spaces.
assert.equal(isMath('p garantează q'), false);
assert.equal(isMath('p este suficientă pentru q'), false);
assert.equal(isMath('q este o condiție necesară pentru p'), false);
assert.equal(isMath('Predicatele sunt echivalente pe întreg domeniul D.'), false);
assert.equal(isMath('au aceleași elemente'), false);
assert.equal(isMath('adevărat'), false);
assert.equal(isMath('DA'), false);

// Explicit delimiters are respected when an author/user deliberately requests math.
assert.equal(isMath('\\(p \\Rightarrow q\\)'), true);
assert.equal(isMath('$x^2=4$'), true);

console.log('MathHard universal answer-preview render audit passed.');
