const finiteInputs = [-2, -1, 0, 1, 2];
const fx = (x) => x + 2;

const isEnglish = () => String(globalThis.LANG || document.documentElement.lang || "ro").toLowerCase().startsWith("en");
const renderMath = (root) => {
  try { globalThis.MH_render?.(root); } catch (_) {}
};
const setText = (values) => values.length ? `\\{${values.join(",")}\\}` : "\\varnothing";

function graphSvg({ mode, activeInputs, selectedInput }) {
  const width = 440;
  const height = 300;
  const originX = 190;
  const originY = 215;
  const sx = 45;
  const sy = 38;
  const xToPx = (x) => originX + x * sx;
  const yToPx = (y) => originY - y * sy;
  const ticksX = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
  const ticksY = [-2, -1, 0, 1, 2, 3, 4, 5, 6];

  const xGrid = ticksX.map((x) => `<g><line class="mh-rep-grid" x1="${xToPx(x)}" y1="24" x2="${xToPx(x)}" y2="270"/><text class="mh-rep-axis-label" x="${xToPx(x)}" y="${originY + 22}">${x}</text></g>`).join("");
  const yGrid = ticksY.map((y) => `<g><line class="mh-rep-grid" x1="28" y1="${yToPx(y)}" x2="414" y2="${yToPx(y)}"/><text class="mh-rep-axis-label" x="${originX - 13}" y="${yToPx(y) + 4}">${y}</text></g>`).join("");

  const line = mode === "real"
    ? `<line class="mh-rep-real-line" x1="${xToPx(-4)}" y1="${yToPx(-2)}" x2="${xToPx(4)}" y2="${yToPx(6)}"/>`
    : "";

  const pointInputs = mode === "real" ? finiteInputs : activeInputs;
  const points = pointInputs.map((x) => {
    const selected = x === selectedInput;
    return `<g class="mh-rep-graph-point${selected ? " is-selected" : ""}" data-rep-graph-x="${x}" role="button" tabindex="0" aria-label="x=${x}, f(x)=${fx(x)}"><circle cx="${xToPx(x)}" cy="${yToPx(fx(x))}" r="${selected ? 8 : 6}"/><text x="${xToPx(x) + 9}" y="${yToPx(fx(x)) - 8}">(${x},${fx(x)})</text></g>`;
  }).join("");

  return `<svg class="mh-representation-graph" viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafic pentru f(x)=x+2">
    ${xGrid}${yGrid}
    <line class="mh-rep-axis" x1="28" y1="${originY}" x2="414" y2="${originY}"/>
    <line class="mh-rep-axis" x1="${originX}" y1="270" x2="${originX}" y2="24"/>
    <text class="mh-rep-axis-name" x="410" y="${originY - 8}">x</text>
    <text class="mh-rep-axis-name" x="${originX + 9}" y="30">y</text>
    ${line}${points}
  </svg>`;
}

function mappingSvg(activeInputs, selectedInput, mode) {
  const sampleInputs = mode === "real" ? finiteInputs : activeInputs;
  const outputs = [...new Set(sampleInputs.map(fx))].sort((a, b) => a - b);
  const yPositions = new Map(sampleInputs.map((x, index) => [x, 58 + index * 45]));
  const outPositions = new Map(outputs.map((y, index) => [y, 58 + index * (outputs.length > 1 ? Math.min(48, 180 / (outputs.length - 1)) : 45)]));
  const edges = sampleInputs.map((x) => {
    const y = fx(x);
    const selected = x === selectedInput;
    return `<path class="mh-rep-map-edge${selected ? " is-selected" : ""}" d="M 150 ${yPositions.get(x)} C 220 ${yPositions.get(x)}, 270 ${outPositions.get(y)}, 335 ${outPositions.get(y)}" marker-end="url(#mh-rep-arrow)"/>`;
  }).join("");
  const left = sampleInputs.map((x) => `<g class="mh-rep-map-node${x === selectedInput ? " is-selected" : ""}" data-rep-map-x="${x}" role="button" tabindex="0"><circle cx="115" cy="${yPositions.get(x)}" r="19"/><text x="115" y="${yPositions.get(x) + 5}">${x}</text></g>`).join("");
  const right = outputs.map((y) => `<g class="mh-rep-map-node${fx(selectedInput) === y ? " is-selected" : ""}"><circle cx="370" cy="${outPositions.get(y)}" r="19"/><text x="370" y="${outPositions.get(y) + 5}">${y}</text></g>`).join("");
  return `<svg class="mh-representation-map" viewBox="0 0 485 290" role="img" aria-label="Diagramă input-output">
    <defs><marker id="mh-rep-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="mh-rep-map-arrowhead" d="M0 0 L10 5 L0 10z"/></marker></defs>
    <text class="mh-rep-map-heading" x="115" y="25">Inputuri</text>
    <text class="mh-rep-map-heading" x="370" y="25">Valori atinse</text>
    <ellipse class="mh-rep-map-oval" cx="115" cy="145" rx="62" ry="125"/>
    <ellipse class="mh-rep-map-oval" cx="370" cy="145" rx="62" ry="125"/>
    ${edges}${left}${right}
  </svg>`;
}

function mountRepresentationLab(host) {
  if (!host || host.dataset.mhMounted === "1") return;
  host.dataset.mhMounted = "1";
  const en = isEnglish();
  host.dataset.mhInteractiveHelp = en ? "Select an input and compare formula, table, mapping and graph. Switch the domain mode to see what changes." : "Selectează un input și compară formula, tabelul, diagrama și graficul. Schimbă modul domeniului ca să vezi diferența.";
  let mode = "finite";
  let active = new Set(finiteInputs);
  let selectedInput = 1;

  host.innerHTML = `<section class="mh-representation-lab" aria-label="${en ? "Function representation lab" : "Laborator de reprezentări ale funcției"}">
    <div class="mh-representation-lab__head">
      <div><strong>${en ? "Representation Lab" : "Representation Lab"}</strong><small>${en ? "The same information in several representations." : "Aceeași informație în mai multe reprezentări."}</small></div>
      <div class="mh-representation-lab__mode" role="group" aria-label="${en ? "Domain mode" : "Tipul domeniului"}">
        <button type="button" data-rep-mode="finite" class="is-active">${en ? "FINITE DOMAIN" : "DOMENIU FINIT"}</button>
        <button type="button" data-rep-mode="real">${en ? "REAL DOMAIN" : "DOMENIU REAL"}</button>
      </div>
    </div>
    <div class="mh-representation-lab__formula"></div>
    <div class="mh-representation-lab__inputs" aria-label="${en ? "Input selection" : "Selectarea inputurilor"}"></div>
    <div class="mh-representation-lab__grid">
      <section class="mh-representation-card" data-rep-formula></section>
      <section class="mh-representation-card" data-rep-table></section>
      <section class="mh-representation-card" data-rep-map></section>
      <section class="mh-representation-card mh-representation-card--graph" data-rep-graph></section>
    </div>
    <p class="mh-representation-lab__note"></p>
  </section>`;

  const formulaLine = host.querySelector(".mh-representation-lab__formula");
  const inputs = host.querySelector(".mh-representation-lab__inputs");
  const formulaCard = host.querySelector("[data-rep-formula]");
  const tableCard = host.querySelector("[data-rep-table]");
  const mapCard = host.querySelector("[data-rep-map]");
  const graphCard = host.querySelector("[data-rep-graph]");
  const note = host.querySelector(".mh-representation-lab__note");
  const modeButtons = [...host.querySelectorAll("[data-rep-mode]")];

  const selectInput = (x) => {
    if (mode === "finite" && !active.has(x)) return;
    selectedInput = x;
    render();
  };

  const wireSelectable = () => {
    host.querySelectorAll("[data-rep-map-x],[data-rep-graph-x]").forEach((node) => {
      const x = Number(node.dataset.repMapX ?? node.dataset.repGraphX);
      const activate = () => selectInput(x);
      node.addEventListener("click", activate);
      node.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); }
      });
    });
  };

  function render() {
    modeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.repMode === mode));
    const activeInputs = finiteInputs.filter((x) => active.has(x));
    if (mode === "finite" && !active.has(selectedInput)) selectedInput = activeInputs[0] ?? 0;
    const shown = mode === "real" ? finiteInputs : activeInputs;
    const domainLatex = mode === "real" ? "\\mathbb R" : setText(activeInputs);
    const reached = mode === "real" ? "\\mathbb R" : setText([...new Set(activeInputs.map(fx))].sort((a, b) => a - b));

    formulaLine.innerHTML = `\\[f:${domainLatex}\\to\\mathbb R,\\qquad f(x)=x+2\\]`;
    inputs.innerHTML = mode === "finite"
      ? `<span>${en ? "Domain inputs:" : "Inputuri în domeniu:"}</span>${finiteInputs.map((x) => `<button type="button" data-rep-input="${x}" class="${active.has(x) ? "is-active" : ""}" aria-pressed="${active.has(x)}">${x}</button>`).join("")}`
      : `<span>${en ? "Sample values:" : "Valori de probă:"}</span>${finiteInputs.map((x) => `<button type="button" data-rep-select="${x}" class="${x === selectedInput ? "is-selected" : ""}">${x}</button>`).join("")}`;

    formulaCard.innerHTML = `<h3>${en ? "Formula" : "FORMULĂ"}</h3><div class="mh-representation-focus">\\[f(${selectedInput})=${fx(selectedInput)}\\]</div><p>${en ? "Input → output." : "Input → output."}</p>`;

    const head = shown.map((x) => `<th class="${x === selectedInput ? "is-selected" : ""}" data-rep-table-x="${x}">${x}</th>`).join("");
    const vals = shown.map((x) => `<td class="${x === selectedInput ? "is-selected" : ""}" data-rep-table-x="${x}">${fx(x)}</td>`).join("");
    tableCard.innerHTML = `<h3>${en ? "Table" : "TABEL"}</h3><div class="mh-representation-table-wrap"><table class="mh-representation-table"><tr><th>x</th>${head}</tr><tr><th>f(x)</th>${vals}</tr></table></div><p>\\(${selectedInput}\\mapsto ${fx(selectedInput)}\\)</p>`;

    mapCard.innerHTML = `<h3>${en ? "Mapping" : "DIAGRAMĂ"}</h3>${mappingSvg(activeInputs, selectedInput, mode)}<p>${en ? "Reached values" : "Valori atinse"}: \\(${reached}\\)</p>`;
    graphCard.innerHTML = `<h3>${en ? "Graph" : "GRAFIC"}</h3>${graphSvg({ mode, activeInputs, selectedInput })}<p class="mh-representation-point-readout">\\[x=${selectedInput},\\qquad f(${selectedInput})=${fx(selectedInput)},\\qquad (${selectedInput},${fx(selectedInput)})\\in G_f\\]</p>`;

    note.innerHTML = mode === "finite"
      ? (en ? "Only the selected domain inputs create graph points; they are not connected automatically." : "Numai inputurile selectate din domeniu produc puncte ale graficului; punctele nu se unesc automat.")
      : (en ? "The continuous line appears here because of this particular function on ℝ. An interval domain does not make every function graph smooth." : "Forma continuă apare aici datorită acestei funcții pe \\(\\mathbb R\\). Un domeniu de tip interval nu garantează, în general, că graficul oricărei funcții este o curbă netedă.");

    host.querySelectorAll("[data-rep-input]").forEach((button) => button.addEventListener("click", () => {
      const x = Number(button.dataset.repInput);
      if (active.has(x)) {
        if (active.size === 1) return;
        active.delete(x);
      } else active.add(x);
      if (!active.has(selectedInput)) selectedInput = [...active][0];
      render();
    }));
    host.querySelectorAll("[data-rep-select]").forEach((button) => button.addEventListener("click", () => selectInput(Number(button.dataset.repSelect))));
    host.querySelectorAll("[data-rep-table-x]").forEach((cell) => cell.addEventListener("click", () => selectInput(Number(cell.dataset.repTableX))));
    wireSelectable();
    renderMath(host);
  }

  modeButtons.forEach((button) => button.addEventListener("click", () => {
    mode = button.dataset.repMode;
    if (mode === "finite" && !active.has(selectedInput)) selectedInput = [...active][0];
    render();
  }));
  host.addEventListener("mathhard:interactive-reset", () => { mode = "finite"; active = new Set(finiteInputs); selectedInput = 1; render(); });
  render();
}

const testCases = {
  curve: { labelRo: "Curbă validă", verdictRo: "Poate fi graficul unei funcții ✓", labelEn: "Valid curve", verdictEn: "Can be a function graph ✓" },
  circle: { labelRo: "Cerc", verdictRo: "Nu poate fi graficul unei funcții de x ✗", labelEn: "Circle", verdictEn: "Cannot be a function graph of x ✗" },
  sideways: { labelRo: "Curbă laterală", verdictRo: "Nu poate fi graficul unei funcții de x ✗", labelEn: "Sideways curve", verdictEn: "Cannot be a function graph of x ✗" }
};

function verticalTestSvg(kind) {
  const base = `<line class="mh-vtest-axis" x1="24" y1="150" x2="336" y2="150"/><line class="mh-vtest-axis" x1="180" y1="20" x2="180" y2="275"/><line class="mh-vtest-probe" x1="235" y1="24" x2="235" y2="274"/>`;
  if (kind === "circle") return `<svg viewBox="0 0 360 295" role="img" aria-label="Cerc intersectat de o verticală în două puncte">${base}<circle class="mh-vtest-shape" cx="180" cy="150" r="88"/><circle class="mh-vtest-hit" cx="235" cy="81" r="6"/><circle class="mh-vtest-hit" cx="235" cy="219" r="6"/></svg>`;
  if (kind === "sideways") return `<svg viewBox="0 0 360 295" role="img" aria-label="Curbă laterală intersectată de o verticală în două puncte">${base}<path class="mh-vtest-shape" d="M110 55 Q290 150 110 245"/><circle class="mh-vtest-hit" cx="235" cy="112" r="6"/><circle class="mh-vtest-hit" cx="235" cy="188" r="6"/></svg>`;
  return `<svg viewBox="0 0 360 295" role="img" aria-label="Curbă validă intersectată de o verticală într-un punct">${base}<path class="mh-vtest-shape" d="M45 235 C105 210 120 92 180 115 S260 220 325 62"/><circle class="mh-vtest-hit" cx="235" cy="152" r="6"/></svg>`;
}

function mountVerticalTest(host) {
  if (!host || host.dataset.mhMounted === "1") return;
  host.dataset.mhMounted = "1";
  const en = isEnglish();
  host.dataset.mhInteractiveHelp = en ? "Switch drawings and use the vertical line to test whether one x would receive more than one output." : "Comută între desene și urmărește dreapta verticală: același x nu poate primi două outputuri.";
  let selected = "curve";
  host.innerHTML = `<section class="mh-vertical-test" aria-label="${en ? "Vertical line test" : "Criteriul dreptei verticale"}">
    <div class="mh-vertical-test__head"><div><strong>${en ? "Is it a function?" : "Este funcție?"}</strong><small>${en ? "Follow the vertical line." : "Urmărește dreapta verticală."}</small></div><div class="mh-vertical-test__tabs" role="group">${Object.entries(testCases).map(([key, value]) => `<button type="button" data-vtest="${key}" class="${key === selected ? "is-active" : ""}">${en ? value.labelEn : value.labelRo}</button>`).join("")}</div></div>
    <div class="mh-vertical-test__body"><div class="mh-vertical-test__canvas"></div><div class="mh-vertical-test__copy"></div></div>
    <div class="mh-vertical-test__domain-note"><strong>${en ? "Declared domain?" : "Domeniu declarat?"}</strong><span>${en ? "Then every x in D must appear exactly once on the graph, and no point may use an abscissa outside D." : "Atunci fiecare x∈D trebuie să apară exact o dată pe grafic, iar graficul nu trebuie să conțină puncte cu abscise din afara lui D."}</span></div>
  </section>`;
  const canvas = host.querySelector(".mh-vertical-test__canvas");
  const copy = host.querySelector(".mh-vertical-test__copy");
  const tabs = [...host.querySelectorAll("[data-vtest]")];
  const render = () => {
    tabs.forEach((button) => button.classList.toggle("is-active", button.dataset.vtest === selected));
    canvas.innerHTML = verticalTestSvg(selected);
    const cfg = testCases[selected];
    const valid = selected === "curve";
    copy.innerHTML = `<strong class="${valid ? "is-valid" : "is-invalid"}">${en ? cfg.verdictEn : cfg.verdictRo}</strong><p>${valid ? (en ? "The shown vertical meets the curve once, and no vertical needs to meet it more than once." : "Verticala indicată întâlnește curba o singură dată, iar nicio verticală nu trebuie să o întâlnească de două ori.") : (en ? "A vertical line meets the drawing in two points: the same x would have two different outputs." : "O dreaptă verticală întâlnește desenul în două puncte: același x ar avea două outputuri diferite.")}</p>`;
  };
  tabs.forEach((button) => button.addEventListener("click", () => { selected = button.dataset.vtest; render(); }));
  host.addEventListener("mathhard:interactive-reset", () => { selected = "curve"; render(); });
  render();
}

export function mountFunctionGraphExplorers(root = document) {
  root.querySelectorAll("[data-mh-function-representation-lab]").forEach(mountRepresentationLab);
  root.querySelectorAll("[data-mh-function-vertical-test]").forEach(mountVerticalTest);
}
