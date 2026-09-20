import { buildConceptIndex, conceptIdsForContent } from "./concept-model.js";
import { sortProblemCatalog } from "./practice-group-model.js";
const INTERACTIVE_SELECTOR = [
  "[data-mh-function-machine]",
  "[data-mh-function-mapping]",
  "[data-mh-function-representation-lab]",
  "[data-mh-function-vertical-test]"
].join(",");

function text(value) { return String(value ?? "").trim(); }
function normalize(value) {
  return text(value).toLocaleLowerCase("ro-RO").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function slugify(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "sectiune";
}
function uniqueId(root, base) {
  let id = `mh-sec-${base}`;
  let n = 2;
  while (root.querySelector(`#${CSS.escape(id)}`)) id = `mh-sec-${base}-${n++}`;
  return id;
}
function isVisibleHeading(heading) {
  if (!heading || heading.closest("[hidden], .mh-lesson-polish-ui")) return false;
  const label = text(heading.textContent);
  return Boolean(label && !/^surse$/i.test(label));
}
function sectionText(heading, headings) {
  const index = headings.indexOf(heading);
  const next = headings[index + 1] || null;
  const parts = [text(heading.textContent)];
  let node = heading.nextElementSibling;
  while (node && node !== next) {
    if (!node.matches?.(".mh-lesson-polish-ui")) parts.push(text(node.textContent));
    node = node.nextElementSibling;
  }
  return parts.filter(Boolean).join(" ");
}
function scrollToHeading(viewer, heading) {
  if (!viewer || !heading) return;
  const top = Math.max(0, heading.offsetTop - 56);
  viewer.scrollTo({ top, behavior: "smooth" });
}
function copyText(value) {
  const raw = text(value);
  if (!raw) return Promise.resolve(false);
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(raw).then(() => true).catch(() => false);
  try {
    const area = document.createElement("textarea");
    area.value = raw;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return Promise.resolve(ok);
  } catch { return Promise.resolve(false); }
}

function enhanceGlossary(root, language) {
  const ro = language !== "en";
  root.querySelectorAll("[data-mh-glossary]").forEach((node, index) => {
    if (node.dataset.mhGlossaryReady === "1") return;
    node.dataset.mhGlossaryReady = "1";
    node.classList.add("mh-glossary-term");
    node.tabIndex = 0;
    node.setAttribute("role", "button");
    node.setAttribute("aria-expanded", "false");
    const bubble = document.createElement("span");
    bubble.className = "mh-glossary-bubble";
    bubble.hidden = true;
    bubble.id = `mh-glossary-${Date.now()}-${index}`;
    bubble.textContent = node.dataset.mhGlossary || (ro ? "Definiție contextuală" : "Contextual definition");
    node.setAttribute("aria-controls", bubble.id);
    node.appendChild(bubble);
    const toggle = (event) => {
      event?.stopPropagation?.();
      bubble.hidden = !bubble.hidden;
      node.setAttribute("aria-expanded", bubble.hidden ? "false" : "true");
    };
    node.addEventListener("click", toggle);
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(event); }
      if (event.key === "Escape") { bubble.hidden = true; node.setAttribute("aria-expanded", "false"); }
    });
  });
}

function enhanceCopyables(root, language) {
  const ro = language !== "en";
  root.querySelectorAll("[data-mh-copyable]").forEach((node) => {
    if (node.dataset.mhCopyReady === "1") return;
    node.dataset.mhCopyReady = "1";
    node.classList.add("mh-copyable-block");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mh-copyable-btn";
    button.title = ro ? "Copiază" : "Copy";
    button.setAttribute("aria-label", button.title);
    button.textContent = "⧉";
    button.addEventListener("click", async () => {
      const explicit = node.dataset.mhCopyValue;
      const clone = node.cloneNode(true);
      clone.querySelectorAll?.(".mh-copyable-btn").forEach((entry) => entry.remove());
      const ok = await copyText(explicit || clone.textContent || "");
      button.textContent = ok ? "✓" : "!";
      setTimeout(() => { button.textContent = "⧉"; }, 1100);
    });
    node.appendChild(button);
  });
}

function enhanceInteractive(host, language) {
  if (!host || host.querySelector(":scope > .mh-interactive-shell-controls")) return;
  host.dataset.mhPolishShell = "1";
  const ro = language !== "en";
  const controls = document.createElement("div");
  controls.className = "mh-interactive-shell-controls mh-lesson-polish-ui";
  controls.innerHTML = `
    <button type="button" data-mh-interactive-reset title="${ro ? "Resetează vizualul" : "Reset visual"}" aria-label="${ro ? "Resetează vizualul" : "Reset visual"}">↺</button>
    <button type="button" data-mh-interactive-help title="${ro ? "Cum se folosește" : "How to use"}" aria-label="${ro ? "Cum se folosește" : "How to use"}">?</button>
    <button type="button" data-mh-interactive-fullscreen title="${ro ? "Ecran complet" : "Fullscreen"}" aria-label="${ro ? "Ecran complet" : "Fullscreen"}">⛶</button>`;
  const help = document.createElement("div");
  help.className = "mh-interactive-shell-help mh-lesson-polish-ui";
  help.hidden = true;
  host.prepend(controls);
  host.appendChild(help);
  controls.querySelector("[data-mh-interactive-reset]")?.addEventListener("click", () => {
    host.dispatchEvent(new CustomEvent("mathhard:interactive-reset", { bubbles: false }));
  });
  controls.querySelector("[data-mh-interactive-help]")?.addEventListener("click", () => {
    help.textContent = host.dataset.mhInteractiveHelp || (ro
      ? "Folosește controalele vizualului; modificările rămân doar în această demonstrație."
      : "Use the visual controls; changes stay inside this demonstration.");
    help.hidden = !help.hidden;
  });
  controls.querySelector("[data-mh-interactive-fullscreen]")?.addEventListener("click", async () => {
    if (document.fullscreenElement === host) {
      await document.exitFullscreen?.();
      return;
    }
    if (host.requestFullscreen) {
      try { await host.requestFullscreen(); return; } catch {}
    }
    host.classList.toggle("is-mh-pseudo-fullscreen");
  });
}

function enhanceInteractives(root, language) {
  root.querySelectorAll(INTERACTIVE_SELECTOR).forEach((host) => enhanceInteractive(host, language));
}

function enhanceOverflow(root) {
  root.querySelectorAll("table").forEach((table) => {
    if (table.closest(".mh-table-scroll") || table.closest(".mh-representation-table-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "mh-table-scroll";
    table.parentNode?.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
  root.querySelectorAll(".katex-display").forEach((block) => {
    block.classList.add("mh-math-scroll");
    block.tabIndex = 0;
  });
}

function buildLessonTools({ root, viewer, headings, language }) {
  const ro = language !== "en";
  const bar = document.createElement("div");
  bar.className = "mh-lesson-mini-tools mh-lesson-polish-ui";
  bar.innerHTML = `
    <button type="button" class="mh-lesson-tool-btn" data-mh-toc-toggle>☰ <span>${ro ? "Cuprins" : "Contents"}</span></button>
    <div class="mh-lesson-current" data-mh-current-section></div>
    <div class="mh-lesson-read-progress" aria-label="${ro ? "Progres de citire" : "Reading progress"}"><span data-mh-read-percent>0%</span><i><b data-mh-read-bar></b></i></div>
    <button type="button" class="mh-lesson-tool-btn mh-lesson-tool-icon" data-mh-search-toggle title="${ro ? "Caută în lecție" : "Search lesson"}" aria-label="${ro ? "Caută în lecție" : "Search lesson"}">⌕</button>
    <div class="mh-lesson-toc-popover" data-mh-toc-popover hidden></div>
    <div class="mh-lesson-search-popover" data-mh-search-popover hidden>
      <input type="search" data-mh-lesson-search placeholder="${ro ? "Caută în lecție…" : "Search this lesson…"}" autocomplete="off">
      <div data-mh-search-results></div>
    </div>`;
  root.prepend(bar);

  const toc = bar.querySelector("[data-mh-toc-popover]");
  const current = bar.querySelector("[data-mh-current-section]");
  const percent = bar.querySelector("[data-mh-read-percent]");
  const readBar = bar.querySelector("[data-mh-read-bar]");
  const searchPanel = bar.querySelector("[data-mh-search-popover]");
  const searchInput = bar.querySelector("[data-mh-lesson-search]");
  const searchResults = bar.querySelector("[data-mh-search-results]");

  toc.innerHTML = headings.map((heading, index) => `<button type="button" data-mh-toc-index="${index}">${text(heading.textContent)}</button>`).join("");
  toc.querySelectorAll("[data-mh-toc-index]").forEach((button) => button.addEventListener("click", () => {
    const heading = headings[Number(button.dataset.mhTocIndex)];
    toc.hidden = true;
    scrollToHeading(viewer, heading);
  }));
  bar.querySelector("[data-mh-toc-toggle]")?.addEventListener("click", () => {
    toc.hidden = !toc.hidden;
    searchPanel.hidden = true;
  });
  bar.querySelector("[data-mh-search-toggle]")?.addEventListener("click", () => {
    searchPanel.hidden = !searchPanel.hidden;
    toc.hidden = true;
    if (!searchPanel.hidden) searchInput?.focus();
  });
  const closePopovers = (event) => {
    if (event?.type === "keydown" && event.key !== "Escape") return;
    if (event?.type === "click" && bar.contains(event.target)) return;
    toc.hidden = true;
    searchPanel.hidden = true;
  };
  document.addEventListener("click", closePopovers);
  document.addEventListener("keydown", closePopovers);

  const searchable = headings.map((heading) => ({ heading, blob: normalize(sectionText(heading, headings)) }));
  const updateSearch = () => {
    const q = normalize(searchInput?.value);
    if (!q) { searchResults.innerHTML = `<p>${ro ? "Scrie un termen sau o idee." : "Type a term or idea."}</p>`; return; }
    const matches = searchable.filter((entry) => entry.blob.includes(q)).slice(0, 8);
    searchResults.innerHTML = matches.length
      ? matches.map((entry, index) => `<button type="button" data-mh-search-index="${searchable.indexOf(entry)}"><strong>${text(entry.heading.textContent)}</strong><span>${ro ? "Mergi la secțiune" : "Go to section"} →</span></button>`).join("")
      : `<p>${ro ? "Nicio secțiune găsită." : "No matching section."}</p>`;
    searchResults.querySelectorAll("[data-mh-search-index]").forEach((button) => button.addEventListener("click", () => {
      const entry = searchable[Number(button.dataset.mhSearchIndex)];
      searchPanel.hidden = true;
      scrollToHeading(viewer, entry?.heading);
    }));
  };
  searchInput?.addEventListener("input", updateSearch);
  updateSearch();

  const update = () => {
    const max = Math.max(1, viewer.scrollHeight - viewer.clientHeight);
    const ratio = Math.min(1, Math.max(0, viewer.scrollTop / max));
    const pct = Math.round(ratio * 100);
    percent.textContent = `${pct}%`;
    readBar.style.width = `${pct}%`;
    const threshold = viewer.scrollTop + 92;
    let active = headings[0];
    for (const heading of headings) {
      if (heading.offsetTop <= threshold) active = heading;
      else break;
    }
    current.textContent = text(active?.textContent || "");
    toc.querySelectorAll("button").forEach((button, index) => button.classList.toggle("is-active", headings[index] === active));
  };
  viewer.addEventListener("scroll", update, { passive: true });
  update();
  return () => {
    viewer.removeEventListener("scroll", update);
    document.removeEventListener("click", closePopovers);
    document.removeEventListener("keydown", closePopovers);
  };
}

function showResumeToast(root, language, top) {
  if (Number(top || 0) < 140 || root.querySelector(".mh-resume-toast")) return;
  const toast = document.createElement("div");
  toast.className = "mh-resume-toast mh-lesson-polish-ui";
  toast.textContent = language === "en" ? "Continued from where you left off" : "Ai continuat de unde ai rămas";
  root.appendChild(toast);
  setTimeout(() => toast.classList.add("is-visible"), 40);
  setTimeout(() => { toast.classList.remove("is-visible"); setTimeout(() => toast.remove(), 220); }, 1900);
}

export function mountLessonPolish({ root, lesson, language = "ro", viewer = root } = {}) {
  const workspaceBar=document.getElementById("mhLearningWorkspaceBar");
  workspaceBar?.querySelectorAll("[data-mh-problem-polish]").forEach((node) => node.remove());
  if(workspaceBar?._mhProblemPolishListener){window.removeEventListener("mh:progress-mutated",workspaceBar._mhProblemPolishListener);workspaceBar._mhProblemPolishListener=null;}
  if (!root || !lesson || root.dataset.mhLessonPolish === "1") return () => {};
  root.dataset.mhLessonPolish = "1";

  const explicit = [...root.querySelectorAll("[data-mh-anchor]")];
  explicit.forEach((marker) => {
    const anchor = slugify(marker.dataset.mhAnchor);
    const heading = marker.matches("h2,h3")
      ? marker
      : marker.closest?.("h2,h3") || (marker.nextElementSibling?.matches?.("h2,h3") ? marker.nextElementSibling : null);
    if (heading) heading.id = `mh-sec-${anchor}`;
    if (marker !== heading) marker.hidden = true;
  });

  const headings = [...root.querySelectorAll("h2,h3")].filter(isVisibleHeading);
  const used = new Set(headings.map((heading) => heading.id).filter(Boolean));
  headings.forEach((heading) => {
    if (heading.id) return;
    const base = slugify(heading.textContent);
    let id = `mh-sec-${base}`;
    let n = 2;
    while (used.has(id)) id = `mh-sec-${base}-${n++}`;
    used.add(id);
    heading.id = id;
  });

  const cleanups = [];
  if (headings.length >= 3 && viewer) cleanups.push(buildLessonTools({ root, viewer, headings, language }));
  enhanceGlossary(root, language);
  enhanceCopyables(root, language);
  enhanceInteractives(root, language);
  enhanceOverflow(root);
  const observer = new MutationObserver(() => { enhanceInteractives(root, language); enhanceOverflow(root); });
  observer.observe(root, { childList: true, subtree: true });
  cleanups.push(() => observer.disconnect());

  const restored = (event) => {
    if (String(event.detail?.id || "") !== String(lesson.id || "") || event.detail?.type !== "lesson") return;
    showResumeToast(root, language, event.detail?.scrollTop);
  };
  window.addEventListener("mathhard:workspace-restored", restored);
  cleanups.push(() => window.removeEventListener("mathhard:workspace-restored", restored));
  const restoredTop = Number(viewer?.dataset?.mhRestoredScrollTop || 0);
  if (restoredTop > 140) { showResumeToast(root, language, restoredTop); delete viewer.dataset.mhRestoredScrollTop; }


  return () => {
    cleanups.forEach((cleanup) => cleanup?.());
    delete root.dataset.mhLessonPolish;
  };
}

export function mountProblemReview({ host, lesson, onReviewLesson = () => {}, language = "ro" } = {}) {
  const status = host?.querySelector("#statusArea");
  if (!status || !lesson?.id) return () => {};
  const marker = host.querySelector("[data-mh-review-anchor]");
  const button = document.createElement("button"); button.type="button"; button.className="mh-review-link"; button.hidden=true;
  button.textContent=marker?.dataset.mhReviewLabel || (language === "en" ? "↗ Review the concept in the lesson" : "↗ Revizuiește conceptul în lecție");
  button.addEventListener("click",()=>onReviewLesson(lesson,marker?.dataset.mhReviewAnchor||"")); status.insertAdjacentElement("afterend",button);
  return (visible) => { button.hidden = !visible; };
}

export function enhanceAdaptiveMathToolbar(host, problem = {}, language = "ro") {
  if (!host || host.querySelector(".mh-math-quick-row")) return;
  const blob = `${problem.title_ro||""} ${problem.title_en||""} ${problem.statement_ro||""} ${problem.statement_en||""} ${problem.lessonId||problem.lesson_id||""}`.toLowerCase();
  const wanted = /func|grafic|imagine|preimagine/.test(blob) ? ["∈","∉","→","{ }","( )","ℝ","∅","≤","≥"] : /multim|subset|interval|logic/.test(blob) ? ["∈","∉","⊂","⊆","⊊","∪","∩","{ }","∅"] : ["√","a/b","( )","{ }","≤","≥","≠","∞"];
  const originals = [...host.querySelectorAll(".mh-math-toolbar-master .mh-math-toolbtn")];
  const row = document.createElement("div"); row.className="mh-math-quick-row"; row.setAttribute("aria-label", language === "en" ? "Quick symbols" : "Simboluri rapide");
  for (const label of wanted) { const original = originals.find((button)=>text(button.querySelector("span")?.textContent)===label); if(!original) continue; const clone=original.cloneNode(true); clone.querySelector("code")?.remove(); clone.addEventListener("mousedown",(event)=>event.preventDefault()); clone.addEventListener("click",()=>original.click()); row.appendChild(clone); }
  host.prepend(row);
}

export function mountProblemPolish({ problem, lesson = null, problems = [], getProblemState = () => "unopened", onOpenProblem = () => {}, conceptCatalog = [], language = "ro" } = {}) {
  const toolbar = document.getElementById("mhLearningWorkspaceBar");
  const context = toolbar?.querySelector(".mh-learning-workspace-context");
  context?.querySelectorAll("[data-mh-problem-polish]").forEach((node) => node.remove());
  if (toolbar?._mhProblemPolishListener) window.removeEventListener("mh:progress-mutated", toolbar._mhProblemPolishListener);
  if (!problem || !context) return;
  const lessonId = text(problem.lessonId || problem.lesson_id);
  const scoped = problems.filter((entry) => text(entry.lessonId || entry.lesson_id) === lessonId);
  const problemIndex = new Map(problems.map((entry, index) => [entry.id, index]));
  const sequence = sortProblemCatalog([...scoped], { mode: "easy-asc", lessonScoped: true, lesson, problemIndex });
  if (sequence.length < 2 || sequence.length > 20) return;
  const currentIndex = Math.max(0, sequence.findIndex((entry) => entry.id === problem.id));
  const nav = document.createElement("div"), dots = document.createElement("div"), summary = document.createElement("div");
  nav.className = "mh-learning-practice-nav"; nav.dataset.mhProblemPolish = "1";
  nav.innerHTML = `<button type="button" data-mh-practice-prev title="${language === "en" ? "Previous practice problem" : "Problema anterioară"}" aria-label="${language === "en" ? "Previous practice problem" : "Problema anterioară"}">‹</button><strong>P${String(currentIndex + 1).padStart(2,"0")} / ${sequence.length}</strong><button type="button" data-mh-practice-next title="${language === "en" ? "Next practice problem" : "Problema următoare"}" aria-label="${language === "en" ? "Next practice problem" : "Problema următoare"}">›</button>`;
  const prev = nav.querySelector("[data-mh-practice-prev]"), next = nav.querySelector("[data-mh-practice-next]");
  prev.disabled = currentIndex <= 0; next.disabled = currentIndex >= sequence.length - 1;
  prev.addEventListener("click", () => currentIndex > 0 && onOpenProblem(sequence[currentIndex - 1]));
  next.addEventListener("click", () => currentIndex < sequence.length - 1 && onOpenProblem(sequence[currentIndex + 1]));
  dots.className = "mh-learning-problem-dots"; dots.dataset.mhProblemPolish = "1";
  summary.className="mh-learning-practice-summary"; summary.dataset.mhProblemPolish="1"; summary.hidden=true;
  dots.innerHTML = sequence.map((entry,index)=>{ const label=text(language==="en"?(entry.title_en||entry.title_ro||entry.id):(entry.title_ro||entry.title_en||entry.id)); return `<button type="button" data-mh-problem-index="${index}" title="${label.replaceAll('"','&quot;')}" aria-label="${label.replaceAll('"','&quot;')}"></button>`; }).join("");
  dots.querySelectorAll("[data-mh-problem-index]").forEach((button)=>button.addEventListener("click",()=>onOpenProblem(sequence[Number(button.dataset.mhProblemIndex)])));
  context.append(nav,dots,summary);
  const conceptIndex = buildConceptIndex(conceptCatalog || []), seen = new Set(), labels = [];
  for (const entry of sequence) for (const id of conceptIdsForContent(conceptIndex,"problem",entry.id)) { if(seen.has(id)) continue; seen.add(id); const c=conceptIndex.byId.get(id); labels.push(language==="en"?(c?.title_en||c?.title_ro||id):(c?.title_ro||c?.title_en||id)); }
  const renderState=()=>{
    dots.querySelectorAll("[data-mh-problem-index]").forEach((button)=>{ const entry=sequence[Number(button.dataset.mhProblemIndex)], state=getProblemState(entry.id); button.className=`is-${state}${entry.id===problem.id?" is-current":""}`; });
    const done=sequence.every((entry)=>getProblemState(entry.id)==="solved"); summary.hidden=!done; if(done) summary.textContent=labels.length?`${language==="en"?"✓ Practiced":"✓ Ai exersat"}: ${labels.slice(0,4).join(" · ")}`:(language==="en"?"✓ Practice set completed":"✓ Seria de practică este finalizată");
  };
  renderState(); toolbar._mhProblemPolishListener=renderState; window.addEventListener("mh:progress-mutated",renderState);
}

export function enhanceContextualContent(root, language = "ro") {
  if (!root) return;
  enhanceGlossary(root, language);
  enhanceCopyables(root, language);
}
