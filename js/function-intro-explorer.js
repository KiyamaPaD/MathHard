const FUNCTION_PRESETS = [
  { id: "linear", label: "f(x) = 2x + 3", formula: (x) => `2\\cdot(${x})+3`, evaluate: (x) => 2 * x + 3 },
  { id: "square", label: "f(x) = x²", formula: (x) => `(${x})^2`, evaluate: (x) => x * x },
  { id: "absolute", label: "f(x) = |x|", formula: (x) => `|${x}|`, evaluate: (x) => Math.abs(x) },
  { id: "shift", label: "f(x) = x − 5", formula: (x) => `(${x})-5`, evaluate: (x) => x - 5 }
];

const MAPPING_VARIANTS = {
  valid: {
    labelRo: "Funcție ✓",
    labelEn: "Function ✓",
    verdictClass: "is-ok",
    reasonRo: "Fiecare element din A are exact o săgeată care pleacă din el. Două inputuri pot ajunge la aceeași ieșire.",
    reasonEn: "Every element of A has exactly one outgoing arrow. Two inputs may reach the same output.",
    edges: [[0, 0], [1, 0], [2, 1]]
  },
  double: {
    labelRo: "Nu este funcție ✕",
    labelEn: "Not a function ✕",
    verdictClass: "is-bad",
    reasonRo: "Inputul 2 are două ieșiri diferite. Un input trebuie să aibă exact un singur output.",
    reasonEn: "Input 2 has two different outputs. One input must have exactly one output.",
    edges: [[0, 0], [1, 0], [1, 1], [2, 1]]
  },
  missing: {
    labelRo: "Nu este funcție ✕",
    labelEn: "Not a function ✕",
    verdictClass: "is-bad",
    reasonRo: "Elementul 3 din domeniu nu are nicio ieșire. Fiecare input trebuie folosit.",
    reasonEn: "Domain element 3 has no output. Every input must be assigned.",
    edges: [[0, 0], [1, 1]]
  }
};

let mappingSerial = 0;

function isEnglish() {
  return String(document.documentElement.lang || "ro").toLowerCase().startsWith("en");
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "—";
  if (Object.is(value, -0)) return "0";
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
}

function renderMath(host) {
  if (typeof globalThis.MH_render === "function") globalThis.MH_render(host);
}

function mountFunctionMachine(host) {
  if (!host || host.dataset.mhMounted === "1") return;
  host.dataset.mhMounted = "1";
  const en = isEnglish();

  host.innerHTML = `
    <section class="mh-function-machine" aria-label="${en ? "Interactive function machine" : "Mașină interactivă de funcții"}">
      <div class="mh-function-machine__head">
        <div>
          <strong>${en ? "Function machine" : "Mașina funcției"}</strong>
          <small>${en ? "Change the input or the rule and watch the output update." : "Schimbă inputul sau regula și urmărește cum se schimbă output-ul."}</small>
        </div>
        <span class="mh-function-machine__badge">INPUT → f → OUTPUT</span>
      </div>
      <div class="mh-function-machine__grid">
        <label class="mh-function-machine__stage">
          <span>${en ? "INPUT" : "INPUT"}</span>
          <input class="mh-function-machine__input" type="number" step="any" value="4" inputmode="decimal" aria-label="${en ? "Function input" : "Inputul funcției"}">
        </label>
        <div class="mh-function-machine__arrow" aria-hidden="true">→</div>
        <label class="mh-function-machine__stage mh-function-machine__stage--rule">
          <span>${en ? "RULE" : "FUNCȚIE"}</span>
          <select class="mh-function-machine__select" aria-label="${en ? "Choose function rule" : "Alege regula funcției"}">
            ${FUNCTION_PRESETS.map((preset) => `<option value="${preset.id}">${preset.label}</option>`).join("")}
          </select>
        </label>
        <div class="mh-function-machine__arrow" aria-hidden="true">→</div>
        <div class="mh-function-machine__stage mh-function-machine__stage--output">
          <span>${en ? "OUTPUT" : "OUTPUT"}</span>
          <strong class="mh-function-machine__output">11</strong>
        </div>
      </div>
      <div class="mh-function-machine__equation" aria-live="polite"></div>
      <p class="mh-function-machine__note">${en ? "The output depends on both the input and the chosen rule." : "Output-ul depinde și de input, și de regula aleasă."}</p>
    </section>
  `;

  const input = host.querySelector(".mh-function-machine__input");
  const select = host.querySelector(".mh-function-machine__select");
  const output = host.querySelector(".mh-function-machine__output");
  const equation = host.querySelector(".mh-function-machine__equation");

  const refresh = () => {
    const preset = FUNCTION_PRESETS.find((entry) => entry.id === select.value) || FUNCTION_PRESETS[0];
    const x = Number(input.value);
    if (!Number.isFinite(x)) {
      output.textContent = "—";
      equation.textContent = en ? "Enter a numeric input." : "Introdu un input numeric.";
      return;
    }
    const y = preset.evaluate(x);
    const xText = formatNumber(x);
    const yText = formatNumber(y);
    output.textContent = yText;
    equation.innerHTML = `\\[f(${xText})=${preset.formula(xText)}=${yText}\\]`;
    renderMath(equation);
  };

  input.addEventListener("input", refresh);
  select.addEventListener("change", refresh);
  refresh();
}

function mappingSvg(variant, markerId) {
  const left = ["1", "2", "3"];
  const right = ["a", "b", "c"];
  const ys = [70, 125, 180];
  const edges = MAPPING_VARIANTS[variant]?.edges || [];
  const edgeClass = variant === "valid" ? "mh-map-edge is-ok" : "mh-map-edge is-bad";

  const lines = edges.map(([from, to]) => {
    const bend = from === 1 && variant === "double" ? (to === 0 ? -8 : 8) : 0;
    return `<path class="${edgeClass}" d="M 170 ${ys[from]} C 245 ${ys[from] + bend}, 315 ${ys[to] - bend}, 390 ${ys[to]}" marker-end="url(#${markerId})"/>`;
  }).join("");

  const leftNodes = left.map((value, index) => `<g><circle class="mh-map-node" cx="130" cy="${ys[index]}" r="21"/><text class="mh-map-node-text" x="130" y="${ys[index] + 5}">${value}</text></g>`).join("");
  const rightNodes = right.map((value, index) => `<g><circle class="mh-map-node" cx="430" cy="${ys[index]}" r="21"/><text class="mh-map-node-text" x="430" y="${ys[index] + 5}">${value}</text></g>`).join("");

  return `
    <svg class="mh-function-map__svg" viewBox="0 0 560 240" role="img" aria-label="Mapping diagram from A to B">
      <defs>
        <marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path class="mh-map-arrowhead ${variant === "valid" ? "is-ok" : "is-bad"}" d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>
      <text class="mh-function-map__set-label" x="130" y="27">A</text>
      <text class="mh-function-map__set-label" x="430" y="27">B</text>
      <ellipse class="mh-function-map__oval" cx="130" cy="125" rx="72" ry="102"/>
      <ellipse class="mh-function-map__oval" cx="430" cy="125" rx="72" ry="102"/>
      ${lines}
      ${leftNodes}
      ${rightNodes}
    </svg>
  `;
}

function mountFunctionMapping(host) {
  if (!host || host.dataset.mhMounted === "1") return;
  host.dataset.mhMounted = "1";
  const en = isEnglish();
  const serial = ++mappingSerial;

  host.innerHTML = `
    <section class="mh-function-map" aria-label="${en ? "Function mapping examples" : "Exemple de corespondențe"}">
      <div class="mh-function-map__head">
        <div>
          <strong>${en ? "Is it a function?" : "Este funcție?"}</strong>
          <small>${en ? "Switch between the three mappings." : "Comută între cele trei corespondențe."}</small>
        </div>
        <div class="mh-function-map__tabs" role="group" aria-label="${en ? "Mapping cases" : "Cazuri de corespondență"}">
          <button type="button" data-map-case="valid" class="is-active">${en ? "Valid" : "Funcție"}</button>
          <button type="button" data-map-case="double">${en ? "Two outputs" : "Două ieșiri"}</button>
          <button type="button" data-map-case="missing">${en ? "Missing output" : "Fără ieșire"}</button>
        </div>
      </div>
      <div class="mh-function-map__canvas"></div>
      <div class="mh-function-map__verdict" aria-live="polite"></div>
      <p class="mh-function-map__rule">${en ? "Quick check: from every domain element, exactly one arrow must leave." : "Test rapid: din fiecare element al domeniului trebuie să plece exact o săgeată."}</p>
    </section>
  `;

  const canvas = host.querySelector(".mh-function-map__canvas");
  const verdict = host.querySelector(".mh-function-map__verdict");
  const buttons = [...host.querySelectorAll("[data-map-case]")];

  const show = (variant) => {
    const cfg = MAPPING_VARIANTS[variant] || MAPPING_VARIANTS.valid;
    buttons.forEach((button) => button.classList.toggle("is-active", button.dataset.mapCase === variant));
    canvas.innerHTML = mappingSvg(variant, `mh-function-map-arrow-${serial}-${variant}`);
    verdict.className = `mh-function-map__verdict ${cfg.verdictClass}`;
    verdict.innerHTML = `<strong>${en ? cfg.labelEn : cfg.labelRo}</strong><span>${en ? cfg.reasonEn : cfg.reasonRo}</span>`;
  };

  buttons.forEach((button) => button.addEventListener("click", () => show(button.dataset.mapCase)));
  show("valid");
}

export function mountFunctionIntroExplorers(root = document) {
  root.querySelectorAll?.("[data-mh-function-machine]").forEach(mountFunctionMachine);
  root.querySelectorAll?.("[data-mh-function-mapping]").forEach(mountFunctionMapping);
}
