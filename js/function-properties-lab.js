const EPS = 1e-9;

const isEnglish = () => String(globalThis.LANG || document.documentElement.lang || "ro").toLowerCase().startsWith("en");
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

const monotonicityPresets = {
  strictInc: {
    labelRo: "Strict crescătoare", labelEn: "Strict increasing",
    points: [[-4,-3],[-1,-1],[2,2],[4,4]], values: [-3,-1,2,4],
    ro: "Valorile cresc la fiecare pas; egalitatea nu apare.",
    en: "The values rise at every step; equality never occurs.",
    rule: "x_1<x_2\\Rightarrow f(x_1)<f(x_2)"
  },
  incPlateau: {
    labelRo: "Crescătoare + palier", labelEn: "Increasing + plateau",
    points: [[-4,-3],[-1,0],[2,0],[4,3]], values: [-3,0,0,3],
    ro: "Valorile nu scad, dar pe palier două inputuri diferite au același output.",
    en: "The values never decrease, but the plateau gives equal outputs for distinct inputs.",
    rule: "x_1<x_2\\Rightarrow f(x_1)\\le f(x_2)"
  },
  strictDec: {
    labelRo: "Strict descrescătoare", labelEn: "Strict decreasing",
    points: [[-4,4],[-1,2],[2,-1],[4,-3]], values: [4,2,-1,-3],
    ro: "Valorile scad la fiecare pas; egalitatea nu apare.",
    en: "The values fall at every step; equality never occurs.",
    rule: "x_1<x_2\\Rightarrow f(x_1)>f(x_2)"
  },
  decPlateau: {
    labelRo: "Descrescătoare + palier", labelEn: "Decreasing + plateau",
    points: [[-4,3],[-1,1],[2,1],[4,-2]], values: [3,1,1,-2],
    ro: "Valorile nu cresc, dar palierul împiedică monotonia strictă.",
    en: "The values never increase, but the plateau prevents strict monotonicity.",
    rule: "x_1<x_2\\Rightarrow f(x_1)\\ge f(x_2)"
  },
  change: {
    labelRo: "Își schimbă sensul", labelEn: "Changes direction",
    points: [[-4,3],[0,-2],[4,3]], values: [3,-2,3],
    ro: "Graficul coboară și apoi urcă; funcția nu este monotonă pe întregul interval.",
    en: "The graph falls and then rises; the function is not monotone on the whole interval.",
    rule: "\\text{nu există un singur sens de variație pe tot intervalul}"
  }
};

const boundsPresets = {
  upperHit: {
    labelRo: "Majorant atins", labelEn: "Upper bound attained",
    points: [[-4,-1],[-1,3],[2,1],[4,2]], upper: 3, lower: -1,
    upperAttained: true, lowerAttained: true, openLeft: false, openRight: false,
    ro: "M=3 este majorant și este atins, deci este maximum.",
    en: "M=3 is an upper bound and is attained, so it is the maximum."
  },
  upperOpen: {
    labelRo: "Majorant neatins", labelEn: "Upper bound not attained",
    points: [[-3,-2],[3,3]], upper: 3, lower: -2,
    upperAttained: false, lowerAttained: true, openLeft: false, openRight: true,
    ro: "M=3 mărginește valorile de sus, dar capătul este deschis: nu există maximum egal cu 3.",
    en: "M=3 bounds the values above, but the endpoint is open: there is no maximum equal to 3."
  },
  lowerHit: {
    labelRo: "Minorant atins", labelEn: "Lower bound attained",
    points: [[-4,2],[-1,-2],[2,1],[4,3]], upper: 3, lower: -2,
    upperAttained: true, lowerAttained: true, openLeft: false, openRight: false,
    ro: "m=-2 este minorant și este atins, deci este minimum.",
    en: "m=-2 is a lower bound and is attained, so it is the minimum."
  },
  lowerOpen: {
    labelRo: "Minorant neatins", labelEn: "Lower bound not attained",
    points: [[-3,-2],[3,3]], upper: 3, lower: -2,
    upperAttained: true, lowerAttained: false, openLeft: true, openRight: false,
    ro: "m=-2 este minorant, dar capătul stâng este deschis: -2 nu este minimum.",
    en: "m=-2 is a lower bound, but the left endpoint is open: -2 is not the minimum."
  },
  openInterval: {
    labelRo: "Capete deschise", labelEn: "Open endpoints",
    points: [[-3,-2],[3,3]], upper: 3, lower: -2,
    upperAttained: false, lowerAttained: false, openLeft: true, openRight: true,
    ro: "Funcția este mărginită între -2 și 3, dar niciuna dintre margini nu este atinsă.",
    en: "The function is bounded between -2 and 3, but neither bound is attained."
  },
  closedInterval: {
    labelRo: "Capete închise", labelEn: "Closed endpoints",
    points: [[-3,-2],[3,3]], upper: 3, lower: -2,
    upperAttained: true, lowerAttained: true, openLeft: false, openRight: false,
    ro: "Ambele margini sunt atinse: maximumul este 3, iar minimumul este -2.",
    en: "Both bounds are attained: the maximum is 3 and the minimum is -2."
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
  return `<svg class="mh-graph-reader-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Function properties graph">${gridX}${gridY}<line class="mh-gr-axis" x1="34" y1="${originY}" x2="646" y2="${originY}"/><line class="mh-gr-axis" x1="${originX}" y1="338" x2="${originX}" y2="18"/><text class="mh-gr-axis-name" x="638" y="${originY-9}">x</text><text class="mh-gr-axis-name" x="${originX+10}" y="28">y</text>${level(upper,"M")}${level(lower,"m")}${polyline}${endpoints}</svg>`;
}

function mountMonotonicityLab(host) {
  if (!host || host.dataset.mhMounted === "1") return;
  host.dataset.mhMounted = "1";
  const en = isEnglish();
  let preset = "strictInc";
  host.dataset.mhInteractiveHelp = en ? "Switch presets and read the graph from left to right. Compare ≤ with < and ≥ with >." : "Schimbă presetul și citește graficul de la stânga spre dreapta. Compară ≤ cu < și ≥ cu >.";
  host.innerHTML = `<section class="mh-graph-reader"><div class="mh-graph-reader__head"><div><strong>Monotonicity Lab</strong><small>${en ? "Read the direction of variation." : "Citește sensul de variație."}</small></div><div class="mh-graph-reader__tabs" role="group"></div></div><div class="mh-graph-reader__layout"><div class="mh-graph-reader__canvas"></div><aside class="mh-graph-reader__readout"></aside></div><div class="mh-graph-reader__rule"></div></section>`;
  const tabs = host.querySelector(".mh-graph-reader__tabs");
  const canvas = host.querySelector(".mh-graph-reader__canvas");
  const readout = host.querySelector(".mh-graph-reader__readout");
  const rule = host.querySelector(".mh-graph-reader__rule");
  function render() {
    const cfg = monotonicityPresets[preset];
    tabs.innerHTML = Object.entries(monotonicityPresets).map(([key,val]) => `<button type="button" data-mono-preset="${key}" class="${key === preset ? "is-active" : ""}">${en ? val.labelEn : val.labelRo}</button>`).join("");
    canvas.innerHTML = graphSvg({ points: cfg.points });
    const classification = classifyMonotoneValues(cfg.values);
    readout.innerHTML = `<strong>${en ? "Classification" : "Clasificare"}</strong><p>${en ? cfg.en : cfg.ro}</p><p><code>${classification}</code></p>`;
    rule.innerHTML = `\\[${cfg.rule}\\]`;
    host.querySelectorAll("[data-mono-preset]").forEach((button) => button.addEventListener("click", () => { preset = button.dataset.monoPreset; render(); }));
    renderMath(host);
  }
  host.addEventListener("mathhard:interactive-reset", () => { preset = "strictInc"; render(); });
  render();
}

function mountBoundsLab(host) {
  if (!host || host.dataset.mhMounted === "1") return;
  host.dataset.mhMounted = "1";
  const en = isEnglish();
  let preset = "upperHit";
  host.dataset.mhInteractiveHelp = en ? "Compare horizontal bounds with open and closed endpoints. A maximum/minimum must be attained." : "Compară barierele orizontale cu capete deschise și închise. Un maximum/minimum trebuie să fie atins.";
  host.innerHTML = `<section class="mh-graph-reader"><div class="mh-graph-reader__head"><div><strong>Bounds &amp; Extrema Lab</strong><small>${en ? "Bound versus attained extreme." : "Margine versus extrem atins."}</small></div><div class="mh-graph-reader__tabs" role="group"></div></div><div class="mh-graph-reader__layout"><div class="mh-graph-reader__canvas"></div><aside class="mh-graph-reader__readout"></aside></div><div class="mh-graph-reader__rule"></div></section>`;
  const tabs = host.querySelector(".mh-graph-reader__tabs");
  const canvas = host.querySelector(".mh-graph-reader__canvas");
  const readout = host.querySelector(".mh-graph-reader__readout");
  const rule = host.querySelector(".mh-graph-reader__rule");
  function render() {
    const cfg = boundsPresets[preset];
    tabs.innerHTML = Object.entries(boundsPresets).map(([key,val]) => `<button type="button" data-bound-preset="${key}" class="${key === preset ? "is-active" : ""}">${en ? val.labelEn : val.labelRo}</button>`).join("");
    canvas.innerHTML = graphSvg(cfg);
    const state = boundStatus({ values: cfg.points.map((point) => point[1]), upper: cfg.upper, lower: cfg.lower, upperAttained: cfg.upperAttained, lowerAttained: cfg.lowerAttained });
    readout.innerHTML = `<strong>${en ? "What changes?" : "Ce se schimbă?"}</strong><p>${en ? cfg.en : cfg.ro}</p><p>\(M=${fmt(cfg.upper)}\): ${state.hasMaximum ? (en ? "maximum" : "maximum") : (en ? "upper bound only" : "doar majorant")}</p><p>\(m=${fmt(cfg.lower)}\): ${state.hasMinimum ? (en ? "minimum" : "minimum") : (en ? "lower bound only" : "doar minorant")}</p>`;
    rule.innerHTML = `\\[\\text{extrem}=\\text{bound}+\\text{attainment}\\]`;
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

export const __test = { monotonicityPresets, boundsPresets, classifyMonotoneValues, boundStatus };
