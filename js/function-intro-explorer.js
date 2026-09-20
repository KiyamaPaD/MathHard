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
  host.dataset.mhInteractiveHelp = en ? "Change the input or rule and compare input, rule and output." : "Schimbă inputul sau regula și compară inputul, regula și output-ul.";

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
  host.addEventListener("mathhard:interactive-reset", () => { input.value = "4"; select.value = "linear"; refresh(); });
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
  if (host?.dataset?.mhTraceMode === "image-preimage") {
    mountFunctionTraceExplorer(host);
    return;
  }
  if (!host || host.dataset.mhMounted === "1") return;
  host.dataset.mhMounted = "1";
  const en = isEnglish();
  const serial = ++mappingSerial;
  host.dataset.mhInteractiveHelp = en ? "Switch between mappings and check the one-arrow-per-input rule." : "Comută între corespondențe și verifică regula: exact o săgeată din fiecare input.";

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
  host.addEventListener("mathhard:interactive-reset", () => show("valid"));
  show("valid");
}

const TRACE_MAPPING = {
  domain: ["1", "2", "3", "4"],
  codomain: ["a", "b", "c", "d"],
  edges: [["1", "a"], ["2", "b"], ["3", "a"], ["4", "c"]],
  restrictedDomain: new Set(["1", "3"])
};

function traceSetText(values) {
  return values.length ? `\\{${values.join(",")}\\}` : `\\varnothing`;
}

function mountFunctionTraceExplorer(host) {
  if (!host || host.dataset.mhMounted === "1") return;
  host.dataset.mhMounted = "1";
  const en = isEnglish();
  const serial = ++mappingSerial;
  host.dataset.mhInteractiveHelp = en ? "Choose Image or Preimage, then tap a node. The restriction toggle changes the active domain." : "Alege Imagine sau Preimagine, apoi apasă un nod. Toggle-ul de restricție schimbă domeniul activ.";
  let mode = "image";
  let restricted = false;
  let selectedLeft = "1";
  let selectedRight = "a";

  host.innerHTML = `
    <section class="mh-function-trace" aria-label="${en ? "Interactive image and preimage explorer" : "Explorer interactiv pentru imagine și preimagine"}">
      <div class="mh-function-trace__head">
        <div>
          <strong>${en ? "Trace the arrows" : "Urmărește săgețile"}</strong>
          <small>${en ? "Choose a direction, then select an input or an output." : "Alege direcția, apoi selectează un input sau un output."}</small>
        </div>
        <div class="mh-function-trace__controls">
          <div class="mh-function-trace__tabs" role="group" aria-label="${en ? "Trace direction" : "Direcția urmăririi"}">
            <button type="button" data-trace-mode="image" class="is-active">${en ? "IMAGE" : "IMAGINE"}</button>
            <button type="button" data-trace-mode="preimage">${en ? "PREIMAGE" : "PREIMAGINE"}</button>
          </div>
          <label class="mh-function-trace__restriction">
            <input type="checkbox" data-trace-restrict>
            <span>${en ? "Restrict to C = {1,3}" : "Restricționează la C = {1,3}"}</span>
          </label>
        </div>
      </div>
      <div class="mh-function-trace__status" aria-live="polite"></div>
      <div class="mh-function-trace__canvas"></div>
      <div class="mh-function-trace__result" aria-live="polite"></div>
      <div class="mh-function-trace__summary"></div>
    </section>
  `;

  const canvas = host.querySelector(".mh-function-trace__canvas");
  const status = host.querySelector(".mh-function-trace__status");
  const result = host.querySelector(".mh-function-trace__result");
  const summary = host.querySelector(".mh-function-trace__summary");
  const modeButtons = [...host.querySelectorAll("[data-trace-mode]")];
  const restrictInput = host.querySelector("[data-trace-restrict]");

  const activeDomain = () => TRACE_MAPPING.domain.filter((value) => !restricted || TRACE_MAPPING.restrictedDomain.has(value));
  const activeEdges = () => TRACE_MAPPING.edges.filter(([from]) => activeDomain().includes(from));
  const imageSet = () => [...new Set(activeEdges().map(([, to]) => to))].sort();
  const preimages = (target) => activeEdges().filter(([, to]) => to === target).map(([from]) => from);

  const render = () => {
    const active = new Set(activeDomain());
    if (!active.has(selectedLeft)) selectedLeft = activeDomain()[0] || "";
    const edges = activeEdges();
    const ysLeft = { "1": 58, "2": 108, "3": 158, "4": 208 };
    const ysRight = { a: 58, b: 108, c: 158, d: 208 };
    const markerId = `mh-function-trace-arrow-${serial}`;

    let highlightedSources = new Set();
    let highlightedTargets = new Set();
    if (mode === "image" && selectedLeft) {
      highlightedSources.add(selectedLeft);
      const edge = edges.find(([from]) => from === selectedLeft);
      if (edge) highlightedTargets.add(edge[1]);
    } else if (mode === "preimage") {
      highlightedTargets.add(selectedRight);
      preimages(selectedRight).forEach((value) => highlightedSources.add(value));
    }

    const paths = edges.map(([from, to]) => {
      const isHighlighted = mode === "image"
        ? from === selectedLeft
        : to === selectedRight;
      return `<path class="mh-trace-edge${isHighlighted ? " is-highlighted" : ""}" d="M 185 ${ysLeft[from]} C 255 ${ysLeft[from]}, 315 ${ysRight[to]}, 385 ${ysRight[to]}" marker-end="url(#${markerId})"/>`;
    }).join("");

    const leftNodes = TRACE_MAPPING.domain.map((value) => {
      if (!active.has(value)) return "";
      const selected = mode === "image" && value === selectedLeft;
      const highlighted = highlightedSources.has(value);
      return `<g class="mh-trace-node${selected ? " is-selected" : ""}${highlighted ? " is-highlighted" : ""}" data-trace-left="${value}" role="button" tabindex="0" aria-label="${en ? `Input ${value}` : `Input ${value}`}"><circle cx="135" cy="${ysLeft[value]}" r="22"/><text x="135" y="${ysLeft[value] + 5}">${value}</text></g>`;
    }).join("");

    const rightNodes = TRACE_MAPPING.codomain.map((value) => {
      const selected = mode === "preimage" && value === selectedRight;
      const highlighted = highlightedTargets.has(value);
      return `<g class="mh-trace-node${selected ? " is-selected" : ""}${highlighted ? " is-highlighted" : ""}" data-trace-right="${value}" role="button" tabindex="0" aria-label="${en ? `Output ${value}` : `Output ${value}`}"><circle cx="435" cy="${ysRight[value]}" r="22"/><text x="435" y="${ysRight[value] + 5}">${value}</text></g>`;
    }).join("");

    canvas.innerHTML = `
      <svg class="mh-function-trace__svg" viewBox="0 0 570 270" role="img" aria-label="${en ? "Mapping from A to B" : "Corespondență de la A la B"}">
        <defs><marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="mh-trace-arrowhead" d="M 0 0 L 10 5 L 0 10 z"/></marker></defs>
        <text class="mh-function-trace__set-label" x="135" y="24">${restricted ? "C" : "A"}</text>
        <text class="mh-function-trace__set-label" x="435" y="24">B</text>
        <ellipse class="mh-function-trace__oval" cx="135" cy="133" rx="76" ry="119"/>
        <ellipse class="mh-function-trace__oval" cx="435" cy="133" rx="76" ry="119"/>
        ${paths}${leftNodes}${rightNodes}
      </svg>
    `;

    canvas.querySelectorAll("[data-trace-left]").forEach((node) => {
      const select = () => { if (mode === "image") { selectedLeft = node.dataset.traceLeft; render(); } };
      node.addEventListener("click", select);
      node.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); } });
    });
    canvas.querySelectorAll("[data-trace-right]").forEach((node) => {
      const select = () => { if (mode === "preimage") { selectedRight = node.dataset.traceRight; render(); } };
      node.addEventListener("click", select);
      node.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); } });
    });

    modeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.traceMode === mode));
    status.innerHTML = restricted
      ? `${en ? "Restriction active" : "Restricție activă"}: \\(C=\\{1,3\\}\\subseteq A\\)`
      : `${en ? "Full domain" : "Domeniu complet"}: \\(A=\\{1,2,3,4\\}\\)`;

    if (mode === "image") {
      const edge = edges.find(([from]) => from === selectedLeft);
      const target = edge?.[1] || "—";
      result.innerHTML = `<strong>${en ? "Image" : "Imagine"}</strong><span>\\[f(${selectedLeft})=${target}\\]</span>`;
    } else {
      const values = preimages(selectedRight);
      result.innerHTML = `<strong>${en ? "Preimage" : "Preimagine"}</strong><span>\\[f^{-1}(\\{${selectedRight}\\})=${traceSetText(values)}\\]</span>`;
    }
    summary.innerHTML = `${en ? "Current image of the function" : "Imaginea funcției în starea curentă"}: \\(\\operatorname{Im}f=${traceSetText(imageSet())}\\)`;
    renderMath(host);
  };

  modeButtons.forEach((button) => button.addEventListener("click", () => {
    mode = button.dataset.traceMode === "preimage" ? "preimage" : "image";
    render();
  }));
  restrictInput.addEventListener("change", () => { restricted = restrictInput.checked; render(); });
  host.addEventListener("mathhard:interactive-reset", () => { mode = "image"; restricted = false; selectedLeft = "1"; selectedRight = "a"; restrictInput.checked = false; render(); });
  render();
}

export function mountFunctionIntroExplorers(root = document) {
  root.querySelectorAll?.("[data-mh-function-machine]").forEach(mountFunctionMachine);
  root.querySelectorAll?.("[data-mh-function-mapping]").forEach(mountFunctionMapping);
}
