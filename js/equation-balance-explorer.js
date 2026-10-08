function isEnglish() {
  return String(document.documentElement.lang || "ro").toLowerCase().startsWith("en");
}

function renderMath(root) {
  try { globalThis.MH_render?.(root); } catch {}
}

const STATES = {
  start: {
    left: "x+3",
    right: "7",
    tilt: "0deg",
    badgeRo: "Echilibru",
    badgeEn: "Balanced",
    noteRo: "Ecuația pornește în echilibru: cei doi membri au aceeași valoare pentru soluție.",
    noteEn: "The equation starts balanced: both sides have the same value at the solution."
  },
  minusBoth: {
    left: "x",
    right: "4",
    tilt: "0deg",
    badgeRo: "Echilibru păstrat",
    badgeEn: "Balance preserved",
    noteRo: "Am scăzut 3 din ambii membri. Transformarea este reversibilă și păstrează soluțiile.",
    noteEn: "We subtracted 3 from both sides. The reversible transformation preserves the solutions."
  },
  plusBoth: {
    left: "x+5",
    right: "9",
    tilt: "0deg",
    badgeRo: "Echilibru păstrat",
    badgeEn: "Balance preserved",
    noteRo: "Am adăugat 2 în ambii membri. Ecuația arată diferit, dar mulțimea soluțiilor rămâne aceeași.",
    noteEn: "We added 2 to both sides. The equation looks different, but the solution set stays the same."
  },
  leftOnly: {
    left: "x",
    right: "7",
    tilt: "-5deg",
    badgeRo: "Echilibru stricat",
    badgeEn: "Balance broken",
    noteRo: "Am scăzut 3 doar din stânga. Nu mai avem o transformare echivalentă: am schimbat ecuația.",
    noteEn: "We subtracted 3 only on the left. This is not an equivalent transformation: the equation changed."
  }
};

function mountEquationBalance(host) {
  if (!host || host.dataset.mhMounted === "1") return;
  host.dataset.mhMounted = "1";
  const en = isEnglish();
  host.dataset.mhInteractiveHelp = en
    ? "Apply an operation to both sides and compare it with changing only one side."
    : "Aplică o operație pe ambii membri și compar-o cu modificarea unui singur membru.";

  host.innerHTML = `
    <section class="mh-equation-balance" aria-label="${en ? "Interactive equation balance" : "Balanță interactivă pentru ecuații"}">
      <div class="mh-equation-balance__head">
        <div>
          <strong>${en ? "Keep the equality balanced" : "Păstrează egalitatea în echilibru"}</strong>
          <small>${en ? "Start from x + 3 = 7 and apply the same reversible operation to both sides." : "Pornește de la x + 3 = 7 și aplică aceeași transformare reversibilă ambilor membri."}</small>
        </div>
        <span class="mh-equation-balance__badge" data-balance-badge>${en ? "Balanced" : "Echilibru"}</span>
      </div>

      <div class="mh-equation-balance__scene" data-balance-scene>
        <div class="mh-equation-balance__beam" aria-hidden="true"></div>
        <div class="mh-equation-balance__pivot" aria-hidden="true"></div>
        <div class="mh-equation-balance__pans">
          <div class="mh-equation-balance__pan">
            <span>${en ? "LEFT SIDE" : "MEMBRUL STÂNG"}</span>
            <strong data-balance-left>\\(x+3\\)</strong>
          </div>
          <div class="mh-equation-balance__equals" aria-hidden="true">=</div>
          <div class="mh-equation-balance__pan">
            <span>${en ? "RIGHT SIDE" : "MEMBRUL DREPT"}</span>
            <strong data-balance-right>\\(7\\)</strong>
          </div>
        </div>
      </div>

      <div class="mh-equation-balance__controls" role="group" aria-label="${en ? "Equation transformations" : "Transformări ale ecuației"}">
        <button type="button" data-balance-action="minusBoth">${en ? "−3 on both sides" : "−3 pe ambele"}</button>
        <button type="button" data-balance-action="plusBoth">${en ? "+2 on both sides" : "+2 pe ambele"}</button>
        <button type="button" class="is-warning" data-balance-action="leftOnly">${en ? "Trap: −3 only on the left" : "Capcană: −3 doar în stânga"}</button>
        <button type="button" data-balance-action="start">${en ? "Reset" : "Reset"}</button>
      </div>

      <div class="mh-equation-balance__equation" data-balance-equation aria-live="polite"></div>
      <p class="mh-equation-balance__note" data-balance-note></p>
      <p class="mh-equation-balance__rule">${en ? "Reflex: use reversible transformations that preserve the solution set." : "Reflex: folosește transformări reversibile care păstrează mulțimea soluțiilor."}</p>
    </section>
  `;

  const scene = host.querySelector("[data-balance-scene]");
  const left = host.querySelector("[data-balance-left]");
  const right = host.querySelector("[data-balance-right]");
  const badge = host.querySelector("[data-balance-badge]");
  const equation = host.querySelector("[data-balance-equation]");
  const note = host.querySelector("[data-balance-note]");
  const buttons = [...host.querySelectorAll("[data-balance-action]")];

  const show = (key) => {
    const state = STATES[key] || STATES.start;
    scene.style.setProperty("--mh-balance-tilt", state.tilt);
    scene.classList.toggle("is-broken", key === "leftOnly");
    left.innerHTML = `\\(${state.left}\\)`;
    right.innerHTML = `\\(${state.right}\\)`;
    badge.textContent = en ? state.badgeEn : state.badgeRo;
    badge.classList.toggle("is-broken", key === "leftOnly");
    equation.innerHTML = `\\[${state.left}=${state.right}\\]`;
    note.textContent = en ? state.noteEn : state.noteRo;
    buttons.forEach((button) => button.classList.toggle("is-active", button.dataset.balanceAction === key));
    renderMath(host);
  };

  host.addEventListener("click", (event) => {
    const button = event.target.closest("[data-balance-action]");
    if (!button) return;
    show(button.dataset.balanceAction);
  });
  host.addEventListener("mathhard:interactive-reset", () => show("start"));
  show("start");
}

export function mountEquationBalanceExplorers(root = document) {
  root.querySelectorAll("[data-mh-equation-balance]").forEach(mountEquationBalance);
}
