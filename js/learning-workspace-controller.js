function asText(value) {
  return String(value ?? "").trim();
}

function translated(item, language, field = "title") {
  const primary = language === "en" ? item?.[`${field}_en`] : item?.[`${field}_ro`];
  const fallback = language === "en" ? item?.[`${field}_ro`] : item?.[`${field}_en`];
  return asText(primary || fallback || item?.id);
}

function sortLessons(items) {
  return [...items].sort((left, right) => {
    const grade = asText(left?.grade).localeCompare(asText(right?.grade), "ro", { numeric: true });
    if (grade !== 0) return grade;
    const chapter = asText(left?.chapter).localeCompare(asText(right?.chapter), "ro");
    if (chapter !== 0) return chapter;
    return asText(left?.title_ro || left?.id).localeCompare(asText(right?.title_ro || right?.id), "ro");
  });
}

function sortProblems(items) {
  return [...items].sort((left, right) => {
    const difficulty = Number(left?.difficulty || 0) - Number(right?.difficulty || 0);
    if (difficulty !== 0) return difficulty;
    return asText(left?.title_ro || left?.id).localeCompare(asText(right?.title_ro || right?.id), "ro");
  });
}

export function createLearningWorkspaceController({
  drawer,
  toolbar,
  getLanguage,
  getCatalog,
  getRoadmapController,
  onOpenItem,
  onClose,
  onOpenRoadmap
}) {
  if (!drawer) throw new Error("createLearningWorkspaceController requires drawer.");
  if (!toolbar) throw new Error("createLearningWorkspaceController requires toolbar.");

  let active = null;

  const breadcrumb = toolbar.querySelector("[data-learning-breadcrumb]");
  const position = toolbar.querySelector("[data-learning-position]");
  const previousButton = toolbar.querySelector("[data-learning-prev]");
  const nextButton = toolbar.querySelector("[data-learning-next]");
  const roadmapButton = toolbar.querySelector("[data-learning-roadmap]");
  const closeButton = toolbar.querySelector("[data-learning-close]");

  function language() {
    return getLanguage?.() === "en" ? "en" : "ro";
  }

  function buildSequence(item, type) {
    const catalog = getCatalog?.() || {};
    if (type === "lesson") return sortLessons(catalog.lessons || []);
    if (type === "problem") {
      const all = catalog.problems || [];
      const lessonId = asText(item?.lessonId || item?.lesson_id);
      const related = lessonId
        ? all.filter((problem) => asText(problem?.lessonId || problem?.lesson_id) === lessonId)
        : [];
      return sortProblems(related.length ? related : all);
    }
    return [];
  }

  function roadmapMatch(type, itemId) {
    const controller = getRoadmapController?.();
    return controller?.findNodeByContent?.(type, itemId) || null;
  }

  function render() {
    if (!active) {
      toolbar.hidden = true;
      drawer.classList.remove("is-learning-workspace");
      return;
    }

    const lang = language();
    const { item, type, sequence, index } = active;
    const previous = index > 0 ? sequence[index - 1] : null;
    const next = index >= 0 && index < sequence.length - 1 ? sequence[index + 1] : null;
    const match = roadmapMatch(type, item.id);

    toolbar.hidden = false;
    drawer.classList.add("is-learning-workspace");

    const typeLabel = type === "lesson"
      ? (lang === "ro" ? "Lecție" : "Lesson")
      : (lang === "ro" ? "Problemă" : "Problem");
    const context = type === "lesson"
      ? [item?.grade, item?.chapter].filter(Boolean).join(" • ")
      : [item?.lessonId || item?.lesson_id, item?.difficulty != null ? `${lang === "ro" ? "dificultate" : "difficulty"} ${item.difficulty}` : ""].filter(Boolean).join(" • ");

    breadcrumb.textContent = [typeLabel, context, translated(item, lang)].filter(Boolean).join("  ›  ");
    position.textContent = index >= 0
      ? `${index + 1} / ${sequence.length}`
      : "";

    previousButton.disabled = !previous;
    previousButton.title = previous ? translated(previous, lang) : "";
    previousButton.textContent = lang === "ro" ? "← Anterior" : "← Previous";
    nextButton.disabled = !next;
    nextButton.title = next ? translated(next, lang) : "";
    nextButton.textContent = lang === "ro" ? "Următor →" : "Next →";
    roadmapButton.hidden = !match;
    roadmapButton.textContent = lang === "ro" ? "🗺️ Vezi în roadmap" : "🗺️ View in roadmap";
    closeButton.textContent = lang === "ro" ? "✖ Închide" : "✖ Close";
  }

  previousButton?.addEventListener("click", () => {
    if (!active || active.index <= 0) return;
    onOpenItem?.(active.sequence[active.index - 1], active.type);
  });

  nextButton?.addEventListener("click", () => {
    if (!active || active.index < 0 || active.index >= active.sequence.length - 1) return;
    onOpenItem?.(active.sequence[active.index + 1], active.type);
  });

  roadmapButton?.addEventListener("click", () => {
    if (!active) return;
    const match = roadmapMatch(active.type, active.item.id);
    if (!match) return;
    onClose?.();
    onOpenRoadmap?.(match);
  });

  closeButton?.addEventListener("click", () => onClose?.());

  function open(item, type) {
    const normalizedType = type === "problem" ? "problem" : "lesson";
    const sequence = buildSequence(item, normalizedType);
    const index = sequence.findIndex((entry) => asText(entry?.id) === asText(item?.id));
    active = { item, type: normalizedType, sequence, index };
    render();
  }

  function clear() {
    active = null;
    render();
  }

  function refresh() {
    if (!active) return;
    open(active.item, active.type);
  }

  return {
    open,
    clear,
    refresh,
    get active() {
      return active;
    }
  };
}
