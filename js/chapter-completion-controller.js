let activeOverlay = null;
let requestPromise = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function unwrap(data) {
  return Array.isArray(data) && data.length === 1 ? data[0] : data;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function textFor(language, ro, en) {
  return language === "en" ? en : ro;
}

function closeOverlay() {
  if (!activeOverlay) return;
  activeOverlay.remove();
  activeOverlay = null;
}

function metric(label, value, total = null) {
  return `<div class="mh-chapter-final-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(total == null ? value : `${value} / ${total}`)}</strong></div>`;
}

function insight(label, value) {
  if (!value && value !== 0) return "";
  return `<div class="mh-chapter-final-insight"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function findRoadmapNode(nodeId) {
  if (!nodeId) return null;
  return document.querySelector(`[data-roadmap-node-id="${CSS.escape(String(nodeId))}"]`);
}

function revealRoadmapNode(nodeId) {
  let node = findRoadmapNode(nodeId);
  if (!node) return null;

  const grade = node.closest(".mh-roadmap-grade-group");
  const gradeBody = grade?.querySelector(":scope > .mh-roadmap-grade-body");
  if (gradeBody?.hidden) {
    grade?.querySelector(":scope > [data-roadmap-grade-toggle]")?.click();
    node = findRoadmapNode(nodeId) || node;
  }

  const section = node.closest(".mh-roadmap-section-card");
  const sectionBody = section?.querySelector(":scope > .mh-roadmap-section-body");
  if (sectionBody?.hidden) {
    section?.querySelector("[data-roadmap-section-toggle]")?.click();
    node = findRoadmapNode(nodeId) || node;
  }

  const chapter = node.closest(".mh-roadmap-chapter-card");
  const chapterBody = chapter?.querySelector(":scope > .mh-roadmap-chapter-body");
  if (chapterBody?.hidden) {
    chapter?.querySelector("[data-roadmap-chapter-toggle]")?.click();
    node = findRoadmapNode(nodeId) || node;
  }

  return node;
}

function openRoadmapNode(nodeId) {
  if (!nodeId) return false;
  let node = findRoadmapNode(nodeId);
  if (!node) return false;
  closeOverlay();
  node = revealRoadmapNode(nodeId) || node;
  setTimeout(() => {
    node = findRoadmapNode(nodeId) || node;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => node.click(), 220);
  }, 80);
  return true;
}

function reviewChapter(chapter) {
  closeOverlay();
  let node = chapter?.first_node_id ? findRoadmapNode(chapter.first_node_id) : null;
  if (chapter?.first_node_id) node = revealRoadmapNode(chapter.first_node_id) || node;
  setTimeout(() => {
    node = chapter?.first_node_id ? findRoadmapNode(chapter.first_node_id) || node : node;
    const chapterCard = node?.closest(".mh-roadmap-chapter-card");
    (chapterCard || node)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 80);
}

function renderCompletion(payload, language, { simulation = false } = {}) {
  const chapter = payload?.chapter || {};
  const overlay = document.createElement("div");
  overlay.className = "mh-chapter-final-overlay";
  overlay.innerHTML = `
    <section class="mh-chapter-final" role="dialog" aria-modal="true" aria-labelledby="mhChapterFinalTitle">
      <button class="mh-chapter-final-close" type="button" data-chapter-final-close aria-label="${escapeHtml(textFor(language, "Închide", "Close"))}">×</button>
      ${simulation ? `<div class="mh-chapter-final-simulation"><strong>${textFor(language, "SIMULARE ADMIN", "ADMIN PREVIEW")}</strong><span>${textFor(language, "Nu se modifică progresul, XP-ul sau achievements-urile.", "Progress, XP and achievements are not changed.")}</span></div>` : ""}
      <div class="mh-chapter-final-hero">
        <span class="mh-chapter-final-kicker">${textFor(language, "CAPITOL FINALIZAT", "CHAPTER COMPLETED")}</span>
        <div class="mh-chapter-final-trophy" aria-hidden="true">🏆</div>
        <h2 id="mhChapterFinalTitle">${escapeHtml(chapter.title || "")}</h2>
        <p>${textFor(language, "Ai terminat traseul obligatoriu.", "You completed the required path.")}</p>
      </div>

      <div class="mh-chapter-final-statuses">
        <div class="is-complete"><span>✅</span><div><strong>${textFor(language, "Capitol complet", "Chapter complete")}</strong><small>${textFor(language, "Lecțiile, verificările și sinteza obligatorie sunt gata.", "Required lessons, checks and synthesis are complete.")}</small></div></div>
        <div class="is-exploration"><span>◐</span><div><strong>${textFor(language, "Explorare", "Exploration")} ${number(chapter.exploration_percent)}%</strong><small>${textFor(language, "Problemele și extensiile sunt bonus și nu schimbă finalizarea capitolului.", "Problems and extensions are bonus and do not change chapter completion.")}</small></div></div>
      </div>

      <div class="mh-chapter-final-metrics">
        ${metric(textFor(language, "Lecții obligatorii", "Required lessons"), number(chapter.core_lessons_completed), number(chapter.core_lesson_total))}
        ${metric(textFor(language, "Verificări promovate", "Checks passed"), number(chapter.verifications_passed), number(chapter.verification_total))}
        ${metric(textFor(language, "Sinteză", "Synthesis"), number(chapter.syntheses_completed), number(chapter.synthesis_total))}
        ${metric(textFor(language, "Probleme rezolvate", "Problems solved"), number(chapter.problems_solved), number(chapter.practice_total))}
        ${metric(textFor(language, "Concepte stăpânite", "Concepts mastered"), number(chapter.concepts_mastered), number(chapter.concept_total))}
        ${metric(textFor(language, "Extensii explorate", "Extensions explored"), number(chapter.extensions_completed), number(chapter.extension_total))}
      </div>

      <section class="mh-chapter-final-strengths">
        <h3>${textFor(language, "Unde ai fost cel mai bun", "Where you were strongest")}</h3>
        <div>
          ${insight(textFor(language, "Acuratețe verificări", "Check accuracy"), chapter.verification_accuracy == null ? null : `${number(chapter.verification_accuracy)}%`)}
          ${insight(textFor(language, "Cel mai puternic concept", "Strongest concept"), chapter.strongest_concept?.title)}
          ${insight(textFor(language, "Concept de revăzut", "Concept to review"), chapter.review_concept?.title)}
          ${insight(textFor(language, "Probleme rezolvate fără hint", "Problems solved without hints"), number(chapter.problems_without_hints))}
        </div>
      </section>

      <div class="mh-chapter-final-actions">
        <button class="btn mh-chapter-final-primary" type="button" data-chapter-final-continue ${chapter.next_node_id ? "" : "disabled"}>${textFor(language, "CONTINUĂ → următorul capitol", "CONTINUE → next chapter")}</button>
        <button class="btn secondary" type="button" data-chapter-final-review>${textFor(language, "Revizuiește capitolul", "Review chapter")}</button>
      </div>
    </section>
  `;

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest("[data-chapter-final-close]")) closeOverlay();
  });
  overlay.querySelector("[data-chapter-final-continue]")?.addEventListener("click", () => {
    if (simulation) return closeOverlay();
    if (!openRoadmapNode(chapter.next_node_id)) closeOverlay();
  });
  overlay.querySelector("[data-chapter-final-review]")?.addEventListener("click", () => {
    if (simulation) return closeOverlay();
    reviewChapter(chapter);
  });
  document.body.appendChild(overlay);
  activeOverlay = overlay;
  requestAnimationFrame(() => overlay.classList.add("is-visible"));
  overlay.querySelector("[data-chapter-final-continue]:not([disabled]), [data-chapter-final-review]")?.focus();
}

export async function maybeShowChapterCompletion(supabase, lessonId, language = "ro") {
  if (!supabase?.rpc || !lessonId || requestPromise) return null;
  requestPromise = (async () => {
    const { data, error } = await supabase.rpc("mh_claim_chapter_completion", {
      p_lesson_id: String(lessonId),
      p_locale: language === "en" ? "en" : "ro"
    });
    if (error) {
      if (!["PGRST202", "42883"].includes(String(error.code || ""))) console.error("chapter completion error:", error);
      return null;
    }
    const payload = unwrap(data);
    if (payload?.show) renderCompletion(payload, language === "en" ? "en" : "ro");
    return payload;
  })().finally(() => { requestPromise = null; });
  return requestPromise;
}
export function previewChapterCompletion(chapter = {}, language = "ro") {
  const lang = language === "en" ? "en" : "ro";
  const coreTotal = Math.max(0, number(chapter.core_lesson_total));
  const checkTotal = Math.max(0, number(chapter.verification_total));
  const synthesisTotal = Math.max(0, number(chapter.synthesis_total));
  const practiceTotal = Math.max(0, number(chapter.practice_total));
  const extensionTotal = Math.max(0, number(chapter.extension_total));
  const conceptTotal = Math.max(0, number(chapter.concept_total));
  const simulated = {
    ...chapter,
    title: String(chapter.title || (lang === "en" ? "Chapter preview" : "Previzualizare capitol")),
    core_lesson_total: coreTotal,
    core_lessons_completed: coreTotal,
    verification_total: checkTotal,
    verifications_passed: checkTotal,
    synthesis_total: synthesisTotal,
    syntheses_completed: synthesisTotal,
    practice_total: practiceTotal,
    problems_solved: Math.max(0, Math.min(practiceTotal, number(chapter.problems_solved))),
    extension_total: extensionTotal,
    extensions_completed: Math.max(0, Math.min(extensionTotal, number(chapter.extensions_completed))),
    concept_total: conceptTotal,
    concepts_mastered: Math.max(0, Math.min(conceptTotal, number(chapter.concepts_mastered))),
    exploration_percent: Math.max(0, Math.min(100, number(chapter.exploration_percent))),
    next_node_id: chapter.next_node_id || "__admin_preview__"
  };
  renderCompletion({ show: true, chapter: simulated }, lang, { simulation: true });
  window.dispatchEvent(new CustomEvent("mathhard:celebrate", {
    detail: {
      kind: "achievement",
      title: lang === "en" ? "Chapter completed" : "Capitol finalizat",
      subtitle: simulated.title,
      duration: 3600
    }
  }));
  return simulated;
}

if (typeof window !== "undefined") {
  window.addEventListener("mathhard:admin-preview-chapter", (event) => {
    previewChapterCompletion(event.detail?.chapter || {}, event.detail?.language || document.documentElement.lang || "ro");
  });
}

