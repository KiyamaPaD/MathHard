const EPS = 1e-9;

const renderMath = (root) => { try { globalThis.MH_render?.(root); } catch (_) {} };
const fmt = (value) => {
  const n = Math.abs(value) < EPS ? 0 : value;
  if (Math.abs(n - Math.round(n)) < EPS) return String(Math.round(n));
  return String(Math.round(n * 100) / 100).replace("-0", "0");
};

export function classifyMonotoneValues(values) {
  const seq = Array.isArray(values) ? values.map(Number) : [];
  if (seq.length < 2 || seq.some((value) => !Number.isFinite(value))) return "unknown";
  let nonDec = true, nonInc = true, strictInc = true, strictDec = true;
  for (let i = 1; i < seq.length; i += 1) {
    if (seq[i] < seq[i - 1] - EPS) nonDec = false;
    if (seq[i] > seq[i - 1] + EPS) nonInc = false;
    if (seq[i] <= seq[i - 1] + EPS) strictInc = false;
    if (seq[i] >= seq[i - 1] - EPS) strictDec = false;
  }
  if (strictInc) return "strict-increasing";
  if (strictDec) return "strict-decreasing";
  if (nonDec && nonInc) return "constant";
  if (nonDec) return "increasing";
  if (nonInc) return "decreasing";
  return "not-monotone";
}

export function boundStatus({ values = [], upper = null, lower = null, upperAttained = null, lowerAttained = null } = {}) {
  const nums = values.map(Number).filter(Number.isFinite);
  const max = nums.length ? Math.max(...nums) : null;
  const min = nums.length ? Math.min(...nums) : null;
  const upperBound = Number.isFinite(upper) && nums.every((value) => value <= upper + EPS);
  const lowerBound = Number.isFinite(lower) && nums.every((value) => value >= lower - EPS);
  const upperHit = upperAttained === null ? (upperBound && nums.some((value) => Math.abs(value - upper) < EPS)) : Boolean(upperAttained);
  const lowerHit = lowerAttained === null ? (lowerBound && nums.some((value) => Math.abs(value - lower) < EPS)) : Boolean(lowerAttained);
  return { max, min, upperBound, lowerBound, upperHit, lowerHit, hasMaximum: upperBound && upperHit, hasMinimum: lowerBound && lowerHit };
}

const monotonicityLabel = (key) => ({
  "strict-increasing": "Strict crescătoare",
  increasing: "Crescătoare",
  constant: "Constantă",
  decreasing: "Descrescătoare",
  "strict-decreasing": "Strict descrescătoare",
  "not-monotone": "Nu este monotonă",
  unknown: "Necunoscută"
}[key] || "Necunoscută");

const monotonicityPresets = {
  strictInc: {
    label: "Strict crescătoare",
    points: [[-4,-3],[-1,-1],[2,2],[4,4]], values: [-3,-1,2,4],
    text: "Valorile cresc la fiecare pas; egalitatea nu apare.",
    rule: "x_1<x_2\\Rightarrow f(x_1)<f(x_2)"
  },
  incPlateau: {
    label: "Crescătoare + palier",
    points: [[-4,-3],[-1,0],[2,0],[4,3]], values: [-3,0,0,3],
    text: "Valorile nu scad, dar pe palier două intrări diferite au aceeași valoare.",
    rule: "x_1<x_2\\Rightarrow f(x_1)\\le f(x_2)"
  },
  strictDec: {
    label: "Strict descrescătoare",
    points: [[-4,4],[-1,2],[2,-1],[4,-3]], values: [4,2,-1,-3],
    text: "Valorile scad la fiecare pas; egalitatea nu apare.",
    rule: "x_1<x_2\\Rightarrow f(x_1)>f(x_2)"
  },
  decPlateau: {
    label: "Descrescătoare + palier",
    points: [[-4,3],[-1,1],[2,1],[4,-2]], values: [3,1,1,-2],
    text: "Valorile nu cresc, dar palierul împiedică monotonia strictă.",
    rule: "x_1<x_2\\Rightarrow f(x_1)\\ge f(x_2)"
  },
  change: {
    label: "Își schimbă sensul",
    points: [[-4,3],[0,-2],[4,3]], values: [3,-2,3],
    text: "Graficul coboară și apoi urcă; funcția nu este monotonă pe întregul interval.",
    rule: "\\text{nu există un singur sens de variație pe tot intervalul}"
  }
};

const boundsPresets = {
  upperHit: {
    label: "Majorant atins",
    points: [[-4,-1],[-1,3],[2,1],[4,2]], upper: 3, lower: -1,
    upperAttained: true, lowerAttained: true, openLeft: false, openRight: false,
    text: "M=3 este majorant și este atins, deci este maximum."
  },
  upperOpen: {
    label: "Majorant neatins",
    points: [[-3,-2],[3,3]], upper: 3, lower: -2,
    upperAttained: false, lowerAttained: true, openLeft: false, openRight: true,
    text: "M=3 mărginește valorile de sus, dar capătul este deschis: nu există maximum egal cu 3."
  },
  lowerHit: {
    label: "Minorant atins",
    points: [[-4,2],[-1,-2],[2,1],[4,3]], upper: 3, lower: -2,
    upperAttained: true, lowerAttained: true, openLeft: false, openRight: false,
    text: "m=-2 este minorant și este atins, deci este minimum."
  },
  lowerOpen: {
    label: "Minorant neatins",
    points: [[-3,-2],[3,3]], upper: 3, lower: -2,
    upperAttained: true, lowerAttained: false, openLeft: true, openRight: false,
    text: "m=-2 este minorant, dar capătul stâng este deschis: -2 nu este minimum."
  },
  openInterval: {
    label: "Capete deschise",
    points: [[-3,-2],[3,3]], upper: 3, lower: -2,
    upperAttained: false, lowerAttained: false, openLeft: true, openRight: true,
    text: "Funcția este mărginită între -2 și 3, dar niciuna dintre margini nu este atinsă."
  },
  closedInterval: {
    label: "Capete închise",
    points: [[-3,-2],[3,3]], upper: 3, lower: -2,
    upperAttained: true, lowerAttained: true, openLeft: false, openRight: false,
    text: "Ambele margini sunt atinse: maximumul este 3, iar minimumul este -2."
  }
};

function graphSvg({ points, upper = null, lower = null, openLeft = false, openRight = false }) {
  const width = 680, height = 360, originX = 340, originY = 180, sx = 58, sy = 48;
  const xPx = (x) => originX + x * sx;
  const yPx = (y) => originY - y * sy;
  const ticksX = [-5,-4,-3,-2,-1,0,1,2,3,4,5];
  const ticksY = [-3,-2,-1,0,1,2,3,4];
  const gridX = ticksX.map((x) => `<g><line class="mh-gr-grid" x1="${xPx(x)}" y1="18" x2="${xPx(x)}" y2="338"/><text class="mh-gr-axis-label" x="${xPx(x)}" y="${originY + 21}">${x}</text></g>`).join("");
  const gridY = ticksY.map((y) => `<g><line class="mh-gr-grid" x1="34" y1="${yPx(y)}" x2="646" y2="${yPx(y)}"/><text class="mh-gr-axis-label" x="${originX - 14}" y="${yPx(y) + 4}">${y}</text></g>`).join("");
  const polyline = `<polyline class="mh-gr-primary" points="${points.map(([x,y]) => `${xPx(x)},${yPx(y)}`).join(" ")}"/>`;
  const level = (value, label) => Number.isFinite(value) ? `<line class="mh-gr-level" x1="34" y1="${yPx(value)}" x2="646" y2="${yPx(value)}"/><text class="mh-gr-level-label" x="590" y="${yPx(value)-8}">${label}=${fmt(value)}</text>` : "";
  const endpoints = [
    { point: points[0], open: openLeft },
    { point: points.at(-1), open: openRight }
  ].map(({ point: [x,y], open }) => `<circle class="${open ? "mh-sf-open" : "mh-sf-closed"}" cx="${xPx(x)}" cy="${yPx(y)}" r="6"/>`).join("");
  return `<svg class="mh-graph-reader-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafic pentru proprietățile funcției">${gridX}${gridY}<line class="mh-gr-axis" x1="34" y1="${originY}" x2="646" y2="${originY}"/><line class="mh-gr-axis" x1="${originX}" y1="338" x2="${originX}" y2="18"/><text class="mh-gr-axis-name" x="638" y="${originY-9}">x</text><text class="mh-gr-axis-name" x="${originX+10}" y="28">y</text>${level(upper,"M")}${level(lower,"m")}${polyline}${endpoints}</svg>`;
}

function mountMonotonicityLab(host) {
  if (!host || host.dataset.mhMounted === "1") return;
  host.dataset.mhMounted = "1";
  let preset = "strictInc";
  host.dataset.mhInteractiveHelp = "Schimbă presetul și citește graficul de la stânga spre dreapta. Compară ≤ cu < și ≥ cu >.";
  host.innerHTML = `<section class="mh-graph-reader"><div class="mh-graph-reader__head"><div><strong>Laborator de monotonie</strong><small>Citește sensul de variație.</small></div><div class="mh-graph-reader__tabs" role="group"></div></div><div class="mh-graph-reader__layout"><div class="mh-graph-reader__canvas"></div><aside class="mh-graph-reader__readout"></aside></div><div class="mh-graph-reader__rule"></div></section>`;
  const tabs = host.querySelector(".mh-graph-reader__tabs");
  const canvas = host.querySelector(".mh-graph-reader__canvas");
  const readout = host.querySelector(".mh-graph-reader__readout");
  const rule = host.querySelector(".mh-graph-reader__rule");
  function render() {
    const cfg = monotonicityPresets[preset];
    tabs.innerHTML = Object.entries(monotonicityPresets).map(([key,val]) => `<button type="button" data-mono-preset="${key}" class="${key === preset ? "is-active" : ""}">${val.label}</button>`).join("");
    canvas.innerHTML = graphSvg({ points: cfg.points });
    const classification = classifyMonotoneValues(cfg.values);
    readout.innerHTML = `<strong>Clasificare</strong><p>${cfg.text}</p><p><strong>${monotonicityLabel(classification)}</strong></p>`;
    rule.textContent = `\\[${cfg.rule}\\]`;
    host.querySelectorAll("[data-mono-preset]").forEach((button) => button.addEventListener("click", () => { preset = button.dataset.monoPreset; render(); }));
    renderMath(host);
  }
  host.addEventListener("mathhard:interactive-reset", () => { preset = "strictInc"; render(); });
  render();
}

function mountBoundsLab(host) {
  if (!host || host.dataset.mhMounted === "1") return;
  host.dataset.mhMounted = "1";
  let preset = "upperHit";
  host.dataset.mhInteractiveHelp = "Compară barierele orizontale cu capete deschise și închise. Un maximum/minimum trebuie să fie atins.";
  host.innerHTML = `<section class="mh-graph-reader"><div class="mh-graph-reader__head"><div><strong>Laborator de mărginire și extreme</strong><small>Margine versus extrem atins.</small></div><div class="mh-graph-reader__tabs" role="group"></div></div><div class="mh-graph-reader__layout"><div class="mh-graph-reader__canvas"></div><aside class="mh-graph-reader__readout"></aside></div><div class="mh-graph-reader__rule"></div></section>`;
  const tabs = host.querySelector(".mh-graph-reader__tabs");
  const canvas = host.querySelector(".mh-graph-reader__canvas");
  const readout = host.querySelector(".mh-graph-reader__readout");
  const rule = host.querySelector(".mh-graph-reader__rule");
  function render() {
    const cfg = boundsPresets[preset];
    tabs.innerHTML = Object.entries(boundsPresets).map(([key,val]) => `<button type="button" data-bound-preset="${key}" class="${key === preset ? "is-active" : ""}">${val.label}</button>`).join("");
    canvas.innerHTML = graphSvg(cfg);
    const state = boundStatus({ values: cfg.points.map((point) => point[1]), upper: cfg.upper, lower: cfg.lower, upperAttained: cfg.upperAttained, lowerAttained: cfg.lowerAttained });
    readout.innerHTML = `<strong>Ce se schimbă?</strong><p>${cfg.text}</p><p>\(M=${fmt(cfg.upper)}\): ${state.hasMaximum ? "maximum" : "doar majorant"}</p><p>\(m=${fmt(cfg.lower)}\): ${state.hasMinimum ? "minimum" : "doar minorant"}</p>`;
    rule.textContent = `\\[\\text{extrem}=\\text{margine atinsă}\\]`;
    host.querySelectorAll("[data-bound-preset]").forEach((button) => button.addEventListener("click", () => { preset = button.dataset.boundPreset; render(); }));
    renderMath(host);
  }
  host.addEventListener("mathhard:interactive-reset", () => { preset = "upperHit"; render(); });
  render();
}

export function mountFunctionPropertiesLabs(root = document) {
  root.querySelectorAll("[data-mh-function-monotonicity-lab]").forEach(mountMonotonicityLab);
  root.querySelectorAll("[data-mh-function-bounds-extrema-lab]").forEach(mountBoundsLab);
}

export const __test = { monotonicityPresets, boundsPresets, classifyMonotoneValues, monotonicityLabel, boundStatus };
