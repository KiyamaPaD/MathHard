import { supabase } from "./supabase-client.js";
import { getChapterLabel } from "./content-model.js";

const STYLE_ID = "mh-curriculum-ui-runtime-style";
const CHAPTER_RPC = "mh_get_chapter_order";
const MOVE_RPC = "mh_admin_move_chapter";
const GRADE_ROMANS = new Set(["V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]);

let chapterRows = [];
let treeObserver = null;
let conceptObserver = null;
let scheduled = false;
let applying = false;
let authUserId = "";
let loadRevision = 0;

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function asRows(payload) {
  const candidate = Array.isArray(payload) && payload.length === 1 && Array.isArray(payload[0])
    ? payload[0]
    : payload;
  return (Array.isArray(candidate) ? candidate : [])
    .map((row) => ({
      grade: String(row?.grade || "").trim(),
      chapter: String(row?.chapter || "").trim(),
      position: Number(row?.position ?? 0)
    }))
    .filter((row) => row.grade && row.chapter && Number.isFinite(row.position))
    .sort((a, b) => (
      a.grade.localeCompare(b.grade, "ro", { numeric: true })
      || a.position - b.position
      || a.chapter.localeCompare(b.chapter, "ro")
    ));
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mh-chapter-order-actions{
      display:inline-flex;
      align-items:center;
      gap:4px;
      margin-inline-start:8px;
      vertical-align:middle;
    }
    .mh-chapter-order-btn{
      inline-size:24px;
      block-size:24px;
      display:inline-grid;
      place-items:center;
      padding:0;
      border:1px solid var(--border);
      border-radius:7px;
      background:rgba(255,255,255,.04);
      color:inherit;
      font:700 14px/1 system-ui,sans-serif;
      cursor:pointer;
    }
    .mh-chapter-order-btn:hover:not(:disabled){
      background:rgba(255,255,255,.10);
      transform:translateY(-1px);
    }
    .mh-chapter-order-btn:disabled{
      opacity:.28;
      cursor:default;
    }
    .mh-concept-notation-math{
      display:inline-flex;
      align-items:center;
      min-height:30px;
      padding:3px 8px;
      border:1px solid var(--border);
      border-radius:8px;
      background:rgba(255,255,255,.035);
    }
    .mh-concept-notation-math .katex{font-size:1.04em}
    .mh-concept-notation-preview{
      display:block;
      min-height:34px;
      margin-top:6px;
      padding:7px 9px;
      border:1px dashed var(--border);
      border-radius:9px;
      background:rgba(255,255,255,.025);
    }
    .mh-concept-notation-preview:empty{display:none}
  `;
  document.head.appendChild(style);
}

function isAdminUiGranted() {
  return document.getElementById("adminBtn")?.dataset?.accessState === "granted";
}

function gradeFromSummary(summary) {
  const text = normalizeText(summary?.textContent || "");
  if (!text) return "";

  if (text.includes("cursuri si capitole") || text.includes("courses & chapters")) return "FAC";

  const roman = text.match(/\b(viii|vii|vi|v|xii|xi|x|ix)\b/i)?.[1]?.toUpperCase() || "";
  if (!roman || !GRADE_ROMANS.has(roman)) return "";

  if (text.includes("olimp") || text.includes("olymp")) return `OL-${roman}`;
  if (text.includes("clasa") || text.includes("class")) return roman;
  return "";
}

function chapterForSummary(grade, summary) {
  const text = normalizeText(summary?.textContent || "")
    .replace(/^📂\s*/, "")
    .replace(/[↑↓]/g, "")
    .trim();

  const candidates = chapterRows.filter((row) => row.grade === grade);
  return candidates.find((row) => {
    const raw = normalizeText(row.chapter);
    const ro = normalizeText(getChapterLabel(row.chapter, "ro"));
    const en = normalizeText(getChapterLabel(row.chapter, "en"));
    return text === raw || text === ro || text === en;
  })?.chapter || "";
}

function rowsForGrade(grade) {
  return chapterRows
    .filter((row) => row.grade === grade)
    .sort((a, b) => a.position - b.position || a.chapter.localeCompare(b.chapter, "ro"));
}

function chapterPosition(grade, chapter) {
  const row = chapterRows.find((entry) => entry.grade === grade && entry.chapter === chapter);
  return row ? row.position : Number.MAX_SAFE_INTEGER;
}

function replaceGradeRows(grade, nextRows) {
  chapterRows = [
    ...chapterRows.filter((row) => row.grade !== grade),
    ...asRows(nextRows)
  ].sort((a, b) => (
    a.grade.localeCompare(b.grade, "ro", { numeric: true })
    || a.position - b.position
    || a.chapter.localeCompare(b.chapter, "ro")
  ));
}

async function moveChapter(grade, chapter, direction) {
  if (!isAdminUiGranted() || ![-1, 1].includes(direction)) return;

  const buttons = [...document.querySelectorAll(".mh-chapter-order-btn")];
  buttons.forEach((button) => { button.disabled = true; });

  try {
    const { data, error } = await supabase.rpc(MOVE_RPC, {
      p_grade: grade,
      p_chapter: chapter,
      p_direction: direction
    });
    if (error) throw error;
    replaceGradeRows(grade, data);
    applyChapterOrder();
  } catch (error) {
    console.error("Chapter reorder failed:", error);
    alert(`Ordinea capitolelor nu a putut fi salvată: ${error?.message || error}`);
  } finally {
    scheduleApply();
  }
}

function ensureChapterButtons(summary, grade, chapter, index, total) {
  const existing = summary.querySelector(":scope > .mh-chapter-order-actions");
  if (!isAdminUiGranted()) {
    existing?.remove();
    return;
  }

  const actions = existing || document.createElement("span");
  actions.className = "mh-chapter-order-actions";
  actions.setAttribute("aria-label", "Ordine capitol");
  actions.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  const makeButton = (direction, label, title, disabled) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mh-chapter-order-btn";
    button.textContent = label;
    button.title = title;
    button.setAttribute("aria-label", title);
    button.disabled = disabled;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void moveChapter(grade, chapter, direction);
    });
    return button;
  };

  actions.replaceChildren(
    makeButton(-1, "↑", "Mută capitolul mai sus", index <= 0),
    makeButton(1, "↓", "Mută capitolul mai jos", index >= total - 1)
  );

  if (!existing) summary.appendChild(actions);
}

function applyChapterOrder() {
  const root = document.getElementById("treeNested");
  if (!root || !chapterRows.length || applying) return;

  applying = true;
  try {
    root.querySelectorAll("details").forEach((gradeDetails) => {
      const summary = gradeDetails.querySelector(":scope > summary");
      const grade = gradeFromSummary(summary);
      if (!grade) return;

      const branch = gradeDetails.querySelector(":scope > .branch.sub");
      if (!branch) return;

      const chapterDetails = [...branch.children].filter((node) => node.tagName === "DETAILS");
      if (!chapterDetails.length) return;

      const mapped = chapterDetails.map((details) => {
        const chapterSummary = details.querySelector(":scope > summary");
        return {
          details,
          summary: chapterSummary,
          chapter: chapterForSummary(grade, chapterSummary)
        };
      });

      mapped.sort((left, right) => {
        const diff = chapterPosition(grade, left.chapter) - chapterPosition(grade, right.chapter);
        if (diff !== 0) return diff;
        return normalizeText(left.summary?.textContent).localeCompare(
          normalizeText(right.summary?.textContent),
          "ro"
        );
      });

      mapped.forEach(({ details }) => branch.appendChild(details));

      const orderedRows = rowsForGrade(grade);
      mapped.forEach(({ summary, chapter }, index) => {
        if (!summary || !chapter) return;
        const orderedIndex = orderedRows.findIndex((row) => row.chapter === chapter);
        ensureChapterButtons(
          summary,
          grade,
          chapter,
          orderedIndex >= 0 ? orderedIndex : index,
          Math.max(orderedRows.length, mapped.length)
        );
      });
    });
  } finally {
    applying = false;
  }
}

function renderNotationElement(code) {
  if (!code || code.dataset.mhKatexNotation === "1") return;
  const raw = String(code.textContent || "").trim();
  if (!raw) return;

  const host = document.createElement("span");
  host.className = "mh-concept-notation-math";
  host.dataset.mhKatexNotation = "1";
  host.dataset.rawNotation = raw;
  code.replaceWith(host);

  if (globalThis.katex?.render) {
    globalThis.katex.render(raw, host, {
      throwOnError: false,
      displayMode: false,
      strict: "ignore",
      trust: false
    });
  } else {
    host.textContent = raw;
  }
}

function renderConceptNotation(root = document) {
  root.querySelectorAll?.(".mh-concept-detail-head code").forEach(renderNotationElement);

  const adminHost = document.getElementById("mhConceptAdminStudio");
  const notationInput = adminHost?.querySelector('input[name="notation"]');
  if (notationInput) {
    const label = notationInput.closest("label");
    let preview = label?.querySelector(".mh-concept-notation-preview");
    if (label && !preview) {
      preview = document.createElement("span");
      preview.className = "mh-concept-notation-preview";
      preview.setAttribute("aria-label", "Preview KaTeX");
      label.appendChild(preview);
    }

    const raw = String(notationInput.value || "").trim();
    if (preview) {
      preview.replaceChildren();
      if (raw) {
        if (globalThis.katex?.render) {
          globalThis.katex.render(raw, preview, {
            throwOnError: false,
            displayMode: false,
            strict: "ignore",
            trust: false
          });
        } else {
          preview.textContent = raw;
        }
      }
    }
  }

  if (typeof globalThis.MH_render === "function") {
    const conceptDetails = document.querySelector(".mh-concept-disclosure")?.parentElement;
    if (conceptDetails) globalThis.MH_render(conceptDetails);
    if (adminHost && !adminHost.hidden) globalThis.MH_render(adminHost);
  }
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    applyChapterOrder();
    renderConceptNotation(document);
  });
}

async function loadChapterOrder() {
  const revision = ++loadRevision;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.id) {
    authUserId = "";
    chapterRows = [];
    return;
  }

  authUserId = userData.user.id;
  const { data, error } = await supabase.rpc(CHAPTER_RPC);
  if (revision !== loadRevision) return;
  if (error) {
    console.warn("Chapter order is unavailable:", error);
    chapterRows = [];
    return;
  }

  chapterRows = asRows(data);
  scheduleApply();
}

function observeUi() {
  const tree = document.getElementById("treeNested");
  if (tree && !treeObserver) {
    treeObserver = new MutationObserver(() => {
      if (!applying) scheduleApply();
    });
    treeObserver.observe(tree, { childList: true, subtree: true });
  }

  if (!conceptObserver) {
    conceptObserver = new MutationObserver(() => scheduleApply());
    ["cards", "viewContent", "mhConceptAdminStudio"].forEach((id) => {
      const target = document.getElementById(id);
      if (target) conceptObserver.observe(target, { childList: true, subtree: true });
    });
  }

  const adminBtn = document.getElementById("adminBtn");
  if (adminBtn) {
    new MutationObserver(() => scheduleApply())
      .observe(adminBtn, { attributes: true, attributeFilter: ["data-access-state", "hidden", "style"] });
  }

  document.addEventListener("input", (event) => {
    if (event.target?.matches?.('#mhConceptAdminStudio input[name="notation"]')) {
      renderConceptNotation(document);
    }
  });

  window.addEventListener("load", scheduleApply, { once: true });
}

async function init() {
  injectStyles();
  observeUi();
  await loadChapterOrder();
  renderConceptNotation(document);

  supabase.auth.onAuthStateChange((event, session) => {
    const nextUserId = session?.user?.id || "";
    if (nextUserId === authUserId && event !== "SIGNED_OUT") return;
    window.setTimeout(() => void loadChapterOrder(), 0);
  });
}

void init();
