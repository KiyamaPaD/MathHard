import { supabase } from "./supabase-client.js";
import { getChapterLabel } from "./content-model.js";

const STYLE_ID = "mh-curriculum-ui-runtime-style";
const CHAPTER_RPC = "mh_get_chapter_order";
const MOVE_RPC = "mh_admin_move_chapter";
const GRADE_ROMANS = new Set(["V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]);

let chapterRows = [];
let treeObserver = null;
let adminObserver = null;
let scheduled = false;
let applying = false;
let moveInFlight = false;
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

function observeTree() {
  const root = document.getElementById("treeNested");
  if (!root) return;
  if (!treeObserver) {
    treeObserver = new MutationObserver(() => {
      if (!applying) scheduleApply();
    });
  }
  treeObserver.observe(root, { childList: true, subtree: true });
}

function setActionState(actions, { grade, chapter, index, total }) {
  actions.dataset.grade = grade;
  actions.dataset.chapter = chapter;
  const up = actions.querySelector('[data-chapter-direction="-1"]');
  const down = actions.querySelector('[data-chapter-direction="1"]');
  const busy = moveInFlight;
  if (up) up.disabled = busy || index <= 0;
  if (down) down.disabled = busy || index >= total - 1;
}

function ensureChapterButtons(summary, grade, chapter, index, total) {
  const existing = summary.querySelector(":scope > .mh-chapter-order-actions");
  if (!isAdminUiGranted()) {
    existing?.remove();
    return;
  }

  let actions = existing;
  if (!actions) {
    actions = document.createElement("span");
    actions.className = "mh-chapter-order-actions";
    actions.setAttribute("aria-label", "Ordine capitol");
    actions.innerHTML = `
      <button class="mh-chapter-order-btn" type="button" data-chapter-direction="-1" aria-label="Mută capitolul mai sus" title="Mută capitolul mai sus">↑</button>
      <button class="mh-chapter-order-btn" type="button" data-chapter-direction="1" aria-label="Mută capitolul mai jos" title="Mută capitolul mai jos">↓</button>
    `;
    summary.appendChild(actions);
  }

  setActionState(actions, { grade, chapter, index, total });
}

function sameNodeOrder(current, desired) {
  return current.length === desired.length && current.every((node, index) => node === desired[index]);
}

function applyChapterOrder() {
  const root = document.getElementById("treeNested");
  if (!root || !chapterRows.length || applying) return;

  applying = true;
  treeObserver?.disconnect();
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

      const desired = [...mapped].sort((left, right) => {
        const diff = chapterPosition(grade, left.chapter) - chapterPosition(grade, right.chapter);
        if (diff !== 0) return diff;
        return normalizeText(left.summary?.textContent).localeCompare(
          normalizeText(right.summary?.textContent),
          "ro"
        );
      });

      const desiredNodes = desired.map((entry) => entry.details);
      if (!sameNodeOrder(chapterDetails, desiredNodes)) {
        branch.append(...desiredNodes);
      }

      const orderedRows = rowsForGrade(grade);
      desired.forEach(({ summary: chapterSummary, chapter }, index) => {
        if (!chapterSummary || !chapter) return;
        const orderedIndex = orderedRows.findIndex((row) => row.chapter === chapter);
        ensureChapterButtons(
          chapterSummary,
          grade,
          chapter,
          orderedIndex >= 0 ? orderedIndex : index,
          Math.max(orderedRows.length, desired.length)
        );
      });
    });
  } finally {
    applying = false;
    observeTree();
  }
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    applyChapterOrder();
  });
}

async function moveChapter(grade, chapter, direction) {
  if (!isAdminUiGranted() || moveInFlight || ![-1, 1].includes(direction)) return;

  moveInFlight = true;
  applyChapterOrder();
  try {
    const { data, error } = await supabase.rpc(MOVE_RPC, {
      p_grade: grade,
      p_chapter: chapter,
      p_direction: direction
    });
    if (error) throw error;
    replaceGradeRows(grade, data);
  } catch (error) {
    console.error("Chapter reorder failed:", error);
    alert(`Ordinea capitolelor nu a putut fi salvată: ${error?.message || error}`);
  } finally {
    moveInFlight = false;
    applyChapterOrder();
  }
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

function observeAdminState() {
  const adminBtn = document.getElementById("adminBtn");
  if (!adminBtn || adminObserver) return;
  adminObserver = new MutationObserver(() => scheduleApply());
  adminObserver.observe(adminBtn, {
    attributes: true,
    attributeFilter: ["data-access-state", "hidden", "style"]
  });
}

function bindChapterActions() {
  const root = document.getElementById("treeNested");
  if (!root || root.dataset.mhChapterOrderBound === "1") return;
  root.dataset.mhChapterOrderBound = "1";

  root.addEventListener("click", (event) => {
    const button = event.target.closest?.(".mh-chapter-order-btn");
    if (!button || !root.contains(button)) return;

    event.preventDefault();
    event.stopPropagation();

    const actions = button.closest(".mh-chapter-order-actions");
    const grade = String(actions?.dataset?.grade || "");
    const chapter = String(actions?.dataset?.chapter || "");
    const direction = Number(button.dataset.chapterDirection || 0);
    if (!grade || !chapter || ![-1, 1].includes(direction)) return;
    void moveChapter(grade, chapter, direction);
  });
}

async function init() {
  injectStyles();
  bindChapterActions();
  observeTree();
  observeAdminState();
  await loadChapterOrder();

  window.addEventListener("load", scheduleApply, { once: true });

  supabase.auth.onAuthStateChange((event, session) => {
    const nextUserId = session?.user?.id || "";
    if (nextUserId === authUserId && event !== "SIGNED_OUT") return;
    window.setTimeout(() => void loadChapterOrder(), 0);
  });
}

void init();
