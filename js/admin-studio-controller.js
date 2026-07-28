const TYPE_LABELS = {
  ro: {
    all: "Tot conținutul",
    lesson: "Lecții",
    problem: "Probleme",
    exam: "Examene",
    research: "Cercetare",
    history: "Istorie"
  },
  en: {
    all: "All content",
    lesson: "Lessons",
    problem: "Problems",
    exam: "Exams",
    research: "Research",
    history: "History"
  }
};

const UI_TEXT = {
  ro: {
    item: "item",
    items: "iteme",
    visible: "afișate",
    total: "total",
    emptyTitle: "Nu există rezultate",
    emptyText: "Schimbă căutarea sau filtrele.",
    edit: "Editează",
    duplicate: "Duplică",
    preview: "Vezi",
    remove: "Șterge",
    grade: "Clasă",
    chapter: "Capitol",
    difficulty: "Dificultate",
    year: "An",
    lessonId: "Lecție",
    source: "Supabase",
    catalogReady: "Catalog sincronizat",
    catalogCache: "Catalog din cache",
    catalogUnknown: "Stare necunoscută"
  },
  en: {
    item: "item",
    items: "items",
    visible: "shown",
    total: "total",
    emptyTitle: "No results",
    emptyText: "Change the search or filters.",
    edit: "Edit",
    duplicate: "Duplicate",
    preview: "View",
    remove: "Delete",
    grade: "Grade",
    chapter: "Chapter",
    difficulty: "Difficulty",
    year: "Year",
    lessonId: "Lesson",
    source: "Supabase",
    catalogReady: "Catalog synced",
    catalogCache: "Catalog cache in use",
    catalogUnknown: "Unknown status"
  }
};

function safeLanguage(value) {
  return String(value || "ro").toLowerCase().startsWith("en") ? "en" : "ro";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getAdminContentType(item) {
  const explicit = String(item?.content_type || "").trim();
  if (explicit) return explicit;
  if (Array.isArray(item?.items) || item?.default_hours != null || item?.year != null) return "exam";
  if (item?.lesson_id != null || item?.difficulty != null || item?.answer != null) return "problem";
  if (item?.chapter === "CERCETARE") return "research";
  if (item?.chapter === "Istoria matematicii") return "history";
  return "lesson";
}

function itemTitle(item) {
  return item?.title_ro || item?.title_en || item?.exam_title_ro || item?.exam_title_en || item?.id || "";
}

function normalizedSearchText(item) {
  const values = [
    item?.id,
    itemTitle(item),
    item?.title_ro,
    item?.title_en,
    item?.chapter,
    item?.grade,
    item?.lesson_id,
    item?.lessonId,
    item?.olymp_level,
    item?.type,
    item?.year,
    ...(Array.isArray(item?.tags) ? item.tags : [])
  ];
  return values.filter(Boolean).join(" ").toLocaleLowerCase("ro");
}

export function filterAdminItems(items, filters = {}) {
  const type = String(filters.type || "all");
  const query = String(filters.query || "").trim().toLocaleLowerCase("ro");
  const grade = String(filters.grade || "all");
  const chapter = String(filters.chapter || "all");
  const difficulty = String(filters.difficulty || "all");
  const sort = String(filters.sort || "title-asc");

  const filtered = (Array.isArray(items) ? items : []).filter((item) => {
    const itemType = getAdminContentType(item);
    if (type !== "all" && itemType !== type) return false;
    if (query && !normalizedSearchText(item).includes(query)) return false;
    if (grade !== "all" && String(item?.grade || "") !== grade) return false;
    if (chapter !== "all" && String(item?.chapter || "") !== chapter) return false;
    if (difficulty !== "all" && String(item?.difficulty ?? "") !== difficulty) return false;
    return true;
  });

  return filtered.sort((left, right) => {
    const leftTitle = itemTitle(left).toLocaleLowerCase("ro");
    const rightTitle = itemTitle(right).toLocaleLowerCase("ro");
    if (sort === "title-desc") return rightTitle.localeCompare(leftTitle, "ro");
    if (sort === "id-asc") return String(left?.id || "").localeCompare(String(right?.id || ""), "ro");
    if (sort === "type-asc") {
      const typeCompare = getAdminContentType(left).localeCompare(getAdminContentType(right), "ro");
      return typeCompare || leftTitle.localeCompare(rightTitle, "ro");
    }
    if (sort === "difficulty-desc") {
      const difficultyCompare = Number(right?.difficulty || 0) - Number(left?.difficulty || 0);
      return difficultyCompare || leftTitle.localeCompare(rightTitle, "ro");
    }
    if (sort === "year-desc") {
      const yearCompare = Number(right?.year || 0) - Number(left?.year || 0);
      return yearCompare || leftTitle.localeCompare(rightTitle, "ro");
    }
    return leftTitle.localeCompare(rightTitle, "ro");
  });
}

export function suggestDuplicateId(id, existingIds = []) {
  const base = `${String(id || "item").replace(/-copy(?:-\d+)?$/i, "")}-copy`;
  const used = new Set(Array.from(existingIds, (value) => String(value)));
  if (!used.has(base)) return base;
  let index = 2;
  while (used.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => String(item?.[key] ?? "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ro", { numeric: true }));
}

function optionHtml(value, label, selected) {
  return `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

export function createAdminStudioController({
  root,
  getLanguage = () => "ro",
  onCreate = () => {},
  onEdit = () => {},
  onDuplicate = () => {},
  onDelete = () => {},
  onPreview = () => {},
  onRefresh = () => {},
  onLogout = () => {},
  onPanelChange = () => {}
} = {}) {
  if (!root) throw new Error("createAdminStudioController requires a root element.");

  const state = {
    items: [],
    diagnostics: {},
    panel: "dashboard",
    filters: {
      type: "all",
      query: "",
      grade: "all",
      chapter: "all",
      difficulty: "all",
      sort: "title-asc"
    }
  };

  const listHost = root.querySelector("#mhAdminList");
  const listInfo = root.querySelector("#mhAdminListInfo");
  const searchInput = root.querySelector("#mhAdminSearch");
  const gradeSelect = root.querySelector("#mhAdminGradeFilter");
  const chapterSelect = root.querySelector("#mhAdminChapterFilter");
  const difficultySelect = root.querySelector("#mhAdminDifficultyFilter");
  const sortSelect = root.querySelector("#mhAdminSort");

  function language() {
    return safeLanguage(getLanguage());
  }

  function texts() {
    return UI_TEXT[language()];
  }

  function showPanel(panelName, { focus = false } = {}) {
    state.panel = panelName;
    root.querySelectorAll("[data-admin-panel]").forEach((panel) => {
      const active = panel.dataset.adminPanel === panelName;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    root.querySelectorAll("[data-admin-panel-target]").forEach((button) => {
      const active = button.dataset.adminPanelTarget === panelName;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
    if (focus) {
      root.querySelector(`[data-admin-panel="${panelName}"]`)?.focus?.({ preventScroll: true });
    }
    try { onPanelChange(panelName); } catch (error) { console.error("Admin panel change failed:", error); }
  }

  function setType(type) {
    state.filters.type = type;
    const contextCreate = root.querySelector("[data-admin-context-create]");
    if (contextCreate) {
      const createType = type === "all" ? "lesson" : type;
      contextCreate.dataset.adminCreateType = createType;
      const singularRo = { lesson: "lecție", problem: "problemă", exam: "examen", research: "material", history: "material" };
      const singularEn = { lesson: "lesson", problem: "problem", exam: "exam", research: "item", history: "item" };
      const singular = language() === "ro" ? singularRo[createType] : singularEn[createType];
      contextCreate.textContent = language() === "ro" ? `Creează ${singular}` : `Create ${singular}`;
    }
    root.querySelectorAll("[data-admin-content-type]").forEach((button) => {
      const active = button.dataset.adminContentType === type;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    updateFilterOptions();
    renderList();
  }

  function updateFilterOptions() {
    const typeItems = state.filters.type === "all"
      ? state.items
      : state.items.filter((item) => getAdminContentType(item) === state.filters.type);

    const grades = uniqueValues(typeItems, "grade");
    const chapters = uniqueValues(typeItems, "chapter");
    const previousGrade = state.filters.grade;
    const previousChapter = state.filters.chapter;

    if (gradeSelect) {
      gradeSelect.innerHTML = optionHtml("all", language() === "ro" ? "Toate clasele" : "All grades", previousGrade)
        + grades.map((value) => optionHtml(value, value, previousGrade)).join("");
      if (!grades.includes(previousGrade)) state.filters.grade = "all";
      gradeSelect.value = state.filters.grade;
    }

    if (chapterSelect) {
      chapterSelect.innerHTML = optionHtml("all", language() === "ro" ? "Toate capitolele" : "All chapters", previousChapter)
        + chapters.map((value) => optionHtml(value, value, previousChapter)).join("");
      if (!chapters.includes(previousChapter)) state.filters.chapter = "all";
      chapterSelect.value = state.filters.chapter;
    }

    if (difficultySelect) {
      const relevant = state.filters.type === "problem" || state.filters.type === "all";
      difficultySelect.disabled = !relevant;
      if (!relevant) {
        state.filters.difficulty = "all";
        difficultySelect.value = "all";
      }
    }
  }

  function renderOverview() {
    const counts = state.items.reduce((result, item) => {
      const type = getAdminContentType(item);
      result[type] = (result[type] || 0) + 1;
      result.total += 1;
      return result;
    }, { total: 0 });

    const assignments = {
      mhAdminCountTotal: counts.total || 0,
      mhAdminCountLessons: counts.lesson || 0,
      mhAdminCountProblems: counts.problem || 0,
      mhAdminCountExams: counts.exam || 0,
      mhAdminCountExtra: (counts.research || 0) + (counts.history || 0)
    };
    for (const [id, value] of Object.entries(assignments)) {
      const element = root.querySelector(`#${id}`);
      if (element) element.textContent = String(value);
    }

    const catalogStatus = root.querySelector("#mhAdminCatalogStatus");
    if (catalogStatus) {
      const diagnostics = state.diagnostics || {};
      const stale = Array.isArray(diagnostics.staleGroups) && diagnostics.staleGroups.length > 0;
      catalogStatus.textContent = stale
        ? `${texts().catalogCache}: ${diagnostics.staleGroups.join(", ")}`
        : diagnostics.status
          ? texts().catalogReady
          : texts().catalogUnknown;
      catalogStatus.dataset.state = stale ? "warning" : diagnostics.status ? "ready" : "unknown";
    }
  }

  function renderList() {
    if (!listHost) return;
    const filtered = filterAdminItems(state.items, state.filters);
    const text = texts();
    const totalLabel = state.items.length === 1 ? text.item : text.items;
    if (listInfo) {
      listInfo.textContent = `${filtered.length} ${text.visible} · ${state.items.length} ${text.total} ${totalLabel}`;
    }

    if (!filtered.length) {
      listHost.innerHTML = `
        <div class="mh-admin-empty-state">
          <strong>${escapeHtml(text.emptyTitle)}</strong>
          <span>${escapeHtml(text.emptyText)}</span>
        </div>
      `;
      return;
    }

    listHost.innerHTML = filtered.map((item) => {
      const type = getAdminContentType(item);
      const meta = [];
      if (item?.grade) meta.push(`${text.grade}: ${item.grade}`);
      if (item?.chapter) meta.push(`${text.chapter}: ${item.chapter}`);
      if (item?.difficulty != null && type === "problem") meta.push(`${text.difficulty}: ${item.difficulty}`);
      if (item?.year && type === "exam") meta.push(`${text.year}: ${item.year}`);
      if ((item?.lesson_id || item?.lessonId) && type === "problem") meta.push(`${text.lessonId}: ${item.lesson_id || item.lessonId}`);
      const tags = Array.isArray(item?.tags) ? item.tags.slice(0, 3) : [];

      return `
        <article class="mh-admin-content-row" data-admin-item-id="${escapeHtml(item.id)}" data-admin-item-type="${escapeHtml(type)}">
          <div class="mh-admin-content-main">
            <div class="mh-admin-content-title-row">
              <span class="mh-admin-type-badge" data-type="${escapeHtml(type)}">${escapeHtml(TYPE_LABELS[language()][type] || type)}</span>
              <strong>${escapeHtml(itemTitle(item) || item.id)}</strong>
            </div>
            <code>${escapeHtml(item.id)}</code>
            ${meta.length ? `<div class="mh-admin-content-meta">${meta.map((entry) => `<span>${escapeHtml(entry)}</span>`).join("")}</div>` : ""}
            ${tags.length ? `<div class="mh-admin-content-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
          </div>
          <div class="mh-admin-content-actions">
            <button class="btn small" type="button" data-admin-action="preview">${escapeHtml(text.preview)}</button>
            <button class="btn small" type="button" data-admin-action="edit">${escapeHtml(text.edit)}</button>
            <button class="btn small" type="button" data-admin-action="duplicate">${escapeHtml(text.duplicate)}</button>
            <button class="btn small danger" type="button" data-admin-action="delete">${escapeHtml(text.remove)}</button>
          </div>
        </article>
      `;
    }).join("");
  }

  function findItemFromAction(target) {
    const row = target.closest("[data-admin-item-id]");
    if (!row) return null;
    return state.items.find((item) => item.id === row.dataset.adminItemId && getAdminContentType(item) === row.dataset.adminItemType) || null;
  }

  root.addEventListener("click", (event) => {
    const panelButton = event.target.closest("[data-admin-panel-target]");
    if (panelButton) {
      showPanel(panelButton.dataset.adminPanelTarget);
      return;
    }

    const typeButton = event.target.closest("[data-admin-content-type]");
    if (typeButton) {
      setType(typeButton.dataset.adminContentType);
      return;
    }

    const createButton = event.target.closest("[data-admin-create-type]");
    if (createButton) {
      onCreate(createButton.dataset.adminCreateType);
      showPanel("editor");
      return;
    }

    const openContentButton = event.target.closest("[data-admin-open-content]");
    if (openContentButton) {
      showPanel("content");
      setType(openContentButton.dataset.adminOpenContent || "all");
      return;
    }

    if (event.target.closest("[data-admin-refresh]")) {
      void onRefresh();
      return;
    }

    if (event.target.closest("[data-admin-logout]")) {
      void onLogout();
      return;
    }

    const actionButton = event.target.closest("[data-admin-action]");
    if (!actionButton) return;
    const item = findItemFromAction(actionButton);
    if (!item) return;
    const action = actionButton.dataset.adminAction;
    if (action === "preview") onPreview(item);
    if (action === "edit") {
      onEdit(item);
      showPanel("editor");
    }
    if (action === "duplicate") {
      onDuplicate(item);
      showPanel("editor");
    }
    if (action === "delete") void onDelete(item);
  });

  searchInput?.addEventListener("input", () => {
    state.filters.query = searchInput.value;
    renderList();
  });
  gradeSelect?.addEventListener("change", () => {
    state.filters.grade = gradeSelect.value;
    renderList();
  });
  chapterSelect?.addEventListener("change", () => {
    state.filters.chapter = chapterSelect.value;
    renderList();
  });
  difficultySelect?.addEventListener("change", () => {
    state.filters.difficulty = difficultySelect.value;
    renderList();
  });
  sortSelect?.addEventListener("change", () => {
    state.filters.sort = sortSelect.value;
    renderList();
  });

  function render(items, diagnostics = {}) {
    state.items = Array.isArray(items) ? items : [];
    state.diagnostics = diagnostics || {};
    updateFilterOptions();
    renderOverview();
    renderList();
  }

  function resetFilters() {
    state.filters = {
      type: "all",
      query: "",
      grade: "all",
      chapter: "all",
      difficulty: "all",
      sort: "title-asc"
    };
    if (searchInput) searchInput.value = "";
    if (sortSelect) sortSelect.value = "title-asc";
    setType("all");
  }

  showPanel("dashboard");
  setType("all");

  return {
    render,
    renderList,
    showPanel,
    openContent(type = "all") {
      showPanel("content");
      setType(type);
    },
    openEditor() {
      showPanel("editor");
    },
    resetFilters,
    getState() {
      return structuredClone(state);
    }
  };
}
