import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('js/app.js');
const html = read('index.html');
const css = read('css/mobile-hardening.css');

const checks = [
  ['shared modal opener exists', app.includes('function openUtilityModal(target')],
  ['shared modal closer exists', app.includes('function closeUtilityModal(target')],
  ['opening one modal closes the other', app.includes('closeUtilityModals(target);')],
  ['Help uses shared opener', app.includes('openUtilityModal(modal, event.currentTarget);')],
  ['About uses shared opener', app.includes('openUtilityModal(aboutModal')],
  ['Escape closes active modal', app.includes('event.key !== "Escape"')],
  ['legacy direct About open removed', !app.includes('aboutModal.classList.add("open")')],
  ['legacy direct About close removed', !app.includes('aboutModal.classList.remove("open")')],
  ['About initialized only once', (app.match(/setupAboutModalAndBullets/g) || []).length === 1],
  ['Help dialog has aria state', /id="modal"[^>]*aria-hidden="true"/.test(html)],
  ['About dialog has aria state', /id="aboutModal"[^>]*aria-hidden="true"/.test(html)],
  ['modal body lock exists', css.includes('body.mh-modal-open')],
  ['dynamic viewport height is used', css.includes('100dvh')],
  ['About content has internal scrolling', /#aboutModal \.about-body\s*\{[^}]*overflow-y:\s*auto/s.test(css)],
  ['mobile sheet is viewport-contained', /@media \(max-width: 720px\)[\s\S]*max-height: calc\(100dvh/s.test(css)]
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
  if (!ok) failed += 1;
}

if (failed) {
  console.error(`Utility modal audit failed: ${failed} check(s).`);
  process.exit(1);
}

console.log('Utility modal audit passed.');
