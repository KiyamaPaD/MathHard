import {
  deleteRoadmapEntity,
  loadRoadmapAdminData,
  patchRoadmapEntity,
  replaceNodePrerequisites,
  saveRoadmap,
  saveRoadmapNode,
  saveRoadmapPositions,
  saveRoadmapSection,
  validateRoadmapGraph
} from "./roadmap-repository.js";
import {
  createRoadmapNodeId,
  filterAndSortRoadmaps,
  filterRoadmapContent,
  moveOrderedItem,
  nextPosition,
  normalizeOrderedPositions,
  roadmapCategories,
  roadmapCategoryLabel,
  slugifyRoadmapValue
} from "./roadmap-admin-model.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formData(form) {
  return new FormData(form);
}

function formValue(form, name) {
  return String(formData(form).get(name) ?? "").trim();
}

function formNumber(form, name, fallback = 0) {
  const value = Number(formData(form).get(name));
  return Number.isFinite(value) ? value : fallback;
}

function formChecked(form, name) {
  return Boolean(form.querySelector(`[name="${name}"]`)?.checked);
}

function translated(item, language = "ro") {
  return String(
    language === "en"
      ? (item?.title_en || item?.title_ro || item?.id || "")
      : (item?.title_ro || item?.title_en || item?.id || "")
  ).trim();
}

function sectionTitle(section) {
  return String(section?.title_ro || section?.title_en || section?.section_key || section?.id || "");
}

function nodeTitle(node, contentCatalog) {
  const override = String(node?.title_ro || node?.title_en || "").trim();
  if (override) return override;
  const collection = node?.node_type === "lesson"
    ? contentCatalog?.lessons
    : node?.node_type === "problem"
      ? contentCatalog?.problems
      : node?.node_type === "exam"
        ? contentCatalog?.exams
        : [];
  return translated((collection || []).find((item) => item.id === node?.content_id)) || node?.content_id || node?.id || "Nod";
}

function iconForType(type) {
  if (type === "lesson") return "📘";
  if (type === "problem") return "🧩";
  if (type === "exam") return "📑";
  return "🏁";
}


const SECTION_GROUP_DEFINITIONS = [
  { key: "intro", label: "Introducere", aliases: ["intro"] },
  { key: "grade-9", label: "Clasa a IX-a", aliases: ["ix", "9"] },
  { key: "grade-10", label: "Clasa a X-a", aliases: ["x", "10"] },
  { key: "grade-11", label: "Clasa a XI-a", aliases: ["xi", "11"] },
  { key: "grade-12", label: "Clasa a XII-a", aliases: ["xii", "12"] },
  { key: "bac-core", label: "Recapitulare BAC", aliases: ["bac"] },
  { key: "admission-core", label: "Pregătire admitere", aliases: ["admitere", "admission"] }
];

function normalizeSectionGroupText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function sectionVisualGroup(section) {
  const id = normalizeSectionGroupText(section?.id);
  const key = normalizeSectionGroupText(section?.section_key);
  const title = normalizeSectionGroupText(section?.title_ro || section?.title_en);
  const identifiers = [key, id].filter(Boolean);

  // Prefer stable section_key / id tokens. This is what makes MathHard M1
  // deterministic: ix-algebra, x-geometrie, xi-analiza, xii-algebra etc.
  const tokenMatch = (token) => identifiers.some((value) => (
    value === token
    || value.startsWith(`${token}-`)
    || value.includes(`-${token}-`)
    || value.endsWith(`-${token}`)
  ));

  if (tokenMatch("xii") || tokenMatch("12")) return { key: "grade-12", label: "Clasa a XII-a" };
  if (tokenMatch("xi") || tokenMatch("11")) return { key: "grade-11", label: "Clasa a XI-a" };
  if (tokenMatch("x") || tokenMatch("10")) return { key: "grade-10", label: "Clasa a X-a" };
  if (tokenMatch("ix") || tokenMatch("9")) return { key: "grade-9", label: "Clasa a IX-a" };

  if (/clasa-a-xii-a|grade-12/.test(title)) return { key: "grade-12", label: "Clasa a XII-a" };
  if (/clasa-a-xi-a|grade-11/.test(title)) return { key: "grade-11", label: "Clasa a XI-a" };
  if (/clasa-a-x-a|grade-10/.test(title)) return { key: "grade-10", label: "Clasa a X-a" };
  if (/clasa-a-ix-a|grade-9/.test(title)) return { key: "grade-9", label: "Clasa a IX-a" };
  if (/\bbac\b/.test(title) || tokenMatch("bac")) return { key: "bac-core", label: "Recapitulare BAC" };
  if (/admit/.test(title) || tokenMatch("admitere") || tokenMatch("admission")) return { key: "admission-core", label: "Pregătire admitere" };
  if (tokenMatch("intro") || /introducere|introduction/.test(title)) return { key: "intro", label: "Introducere" };
  return { key: "general", label: "Alte etape" };
}

function sectionTopicLabel(section) {
  const raw = sectionTitle(section);
  if (!raw) return "Etapă";
  const compact = raw.replace(/\s+/g, " ").trim();
  const classPrefix = /^(?:clasa\s*a\s*(?:ix|x|xi|xii|9|10|11|12)\s*-?\s*a?|grade\s*(?:9|10|11|12))\s*[—–\-:|•·]+\s*(.+)$/i;
  const classSuffix = /^(.+?)\s*[—–\-:|•·]+\s*(?:clasa\s*a\s*(?:ix|x|xi|xii|9|10|11|12)\s*-?\s*a?|grade\s*(?:9|10|11|12))$/i;
  const prefixMatch = compact.match(classPrefix);
  if (prefixMatch?.[1]) return prefixMatch[1].trim();
  const suffixMatch = compact.match(classSuffix);
  if (suffixMatch?.[1]) return suffixMatch[1].trim();
  const cleaned = compact
    .replace(/clasa\s*a\s*(?:ix|x|xi|xii|9|10|11|12)\s*-?\s*a?/ig, "")
    .replace(/grade\s*(?:9|10|11|12)/ig, "")
    .replace(/[—–\-:|•·]{2,}/g, " ")
    .replace(/^\s*[·:—–\-]+|[·:—–\-]+\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || compact;
}

function sectionGroupRank(groupKey) {
  const rank = {
    intro: 0,
    "grade-9": 10,
    "grade-10": 20,
    "grade-11": 30,
    "grade-12": 40,
    "bac-core": 50,
    "admission-core": 60,
    general: 99
  };
  return rank[groupKey] ?? 99;
}

export function createRoadmapAdminController({
  root,
  supabase,
  getContentCatalog = () => ({}),
  onChanged = async () => {}
}) {
  if (!root) throw new Error("createRoadmapAdminController requires a root element.");
  if (!supabase) throw new Error("createRoadmapAdminController requires Supabase.");

  let enabled = false;
  let data = { roadmaps: [], sections: [], nodes: [], edges: [] };
  let selectedRoadmapId = "";
  let statusMessage = "";
  let busy = false;
  let quickType = "all";
  let quickQuery = "";
  let quickSectionId = "";
  let editingNodeId = "";
  let draggedNodeId = "";
  let roadmapQuery = "";
  let roadmapCategory = "all";
  let roadmapStatus = "all";
  let roadmapSort = "position";
  let boardQuery = "";
  let boardType = "all";
  let boardStatus = "all";
  let boardRequirement = "all";

  function catalog() {
    return getContentCatalog?.() || {};
  }

  function orderedRoadmaps() {
    return [...data.roadmaps].sort((left, right) => (
      Number(left?.position || 0) - Number(right?.position || 0)
      || String(left?.id || "").localeCompare(String(right?.id || ""), "ro")
    ));
  }

  function selectedRoadmap() {
    return data.roadmaps.find((item) => item.id === selectedRoadmapId) || null;
  }

  function defaultRoadmap() {
    return orderedRoadmaps().find((item) => item.published !== false) || null;
  }

  function selectedSections() {
    return data.sections
      .filter((section) => section.roadmap_id === selectedRoadmapId)
      .sort((left, right) => Number(left.position || 0) - Number(right.position || 0));
  }

  function sectionNodes(sectionId) {
    return data.nodes
      .filter((node) => node.section_id === sectionId)
      .sort((left, right) => Number(left.position || 0) - Number(right.position || 0));
  }

  function selectedNodes() {
    return selectedSections().flatMap((section) => sectionNodes(section.id));
  }

  function prerequisitesFor(nodeId) {
    return data.edges
      .filter((edge) => edge.dependent_node_id === nodeId && edge.edge_type === "required")
      .map((edge) => edge.prerequisite_node_id);
  }

  function roadmapOptions() {
    return orderedRoadmaps().map((roadmap) => `
      <option value="${escapeHtml(roadmap.id)}" ${roadmap.id === selectedRoadmapId ? "selected" : ""}>
        ${escapeHtml(roadmap.icon || "🗺️")} ${escapeHtml(roadmap.title_ro || roadmap.id)}
      </option>
    `).join("");
  }

  function sectionOptions(selected = quickSectionId) {
    return selectedSections().map((section) => `
      <option value="${escapeHtml(section.id)}" ${section.id === selected ? "selected" : ""}>
        ${escapeHtml(sectionTitle(section))}
      </option>
    `).join("");
  }

  function categoryOptions({ includeAll = false } = {}) {
    const values = roadmapCategories(data.roadmaps);
    return [
      includeAll ? `<option value="all" ${roadmapCategory === "all" ? "selected" : ""}>Toate categoriile</option>` : "",
      ...values.map((value) => `<option value="${escapeHtml(value)}" ${value === roadmapCategory ? "selected" : ""}>${escapeHtml(roadmapCategoryLabel(value))}</option>`)
    ].join("");
  }

  function roadmapCounts(roadmapId) {
    const sections = data.sections.filter((section) => section.roadmap_id === roadmapId);
    const nodes = data.nodes.filter((node) => node.roadmap_id === roadmapId);
    return { sections: sections.length, nodes: nodes.length };
  }

  function renderRoadmapLibrary() {
    const implicit = defaultRoadmap();
    const visible = filterAndSortRoadmaps(data.roadmaps, {
      query: roadmapQuery,
      category: roadmapCategory,
      status: roadmapStatus,
      sort: roadmapSort
    });
    const manualOrdering = roadmapSort === "position" && !roadmapQuery && roadmapCategory === "all" && roadmapStatus === "all";
    const ordered = orderedRoadmaps();

    return `
      <section class="mh-roadmap-admin-library">
        <div class="mh-roadmap-admin-library-head">
          <div>
            <strong>Roadmap-uri</strong>
            <span>${implicit ? `Implicit: ${escapeHtml(implicit.icon || "🗺️")} ${escapeHtml(implicit.title_ro || implicit.id)} · alegerea elevului are prioritate` : "Niciun roadmap publicat implicit"}</span>
          </div>
          <span class="mh-roadmap-admin-result-count">${visible.length}/${data.roadmaps.length}</span>
        </div>
        <div class="mh-roadmap-admin-library-filters">
          <label>Caută
            <input data-roadmap-library-search value="${escapeHtml(roadmapQuery)}" placeholder="titlu, ID, categorie...">
          </label>
          <label>Categorie
            <select class="select" data-roadmap-library-category>${categoryOptions({ includeAll: true })}</select>
          </label>
          <label>Status
            <select class="select" data-roadmap-library-status>
              <option value="all" ${roadmapStatus === "all" ? "selected" : ""}>Toate</option>
              <option value="published" ${roadmapStatus === "published" ? "selected" : ""}>Publicate</option>
              <option value="draft" ${roadmapStatus === "draft" ? "selected" : ""}>Draft</option>
            </select>
          </label>
          <label>Sortare
            <select class="select" data-roadmap-library-sort>
              <option value="position" ${roadmapSort === "position" ? "selected" : ""}>Ordine manuală</option>
              <option value="title" ${roadmapSort === "title" ? "selected" : ""}>Titlu A–Z</option>
              <option value="category" ${roadmapSort === "category" ? "selected" : ""}>Categorie</option>
              <option value="status" ${roadmapSort === "status" ? "selected" : ""}>Status</option>
            </select>
          </label>
          <button class="btn small" type="button" data-roadmap-library-reset ${!roadmapQuery && roadmapCategory === "all" && roadmapStatus === "all" && roadmapSort === "position" ? "disabled" : ""}>Reset</button>
        </div>
        <div class="mh-roadmap-admin-library-list">
          ${visible.length ? visible.map((roadmap) => {
            const counts = roadmapCounts(roadmap.id);
            const orderedIndex = ordered.findIndex((item) => item.id === roadmap.id);
            const isImplicit = implicit?.id === roadmap.id;
            return `
              <article class="mh-roadmap-admin-roadmap-card ${roadmap.id === selectedRoadmapId ? "is-selected" : ""}">
                <div class="mh-roadmap-admin-roadmap-main">
                  <span class="mh-roadmap-admin-roadmap-icon">${escapeHtml(roadmap.icon || "🗺️")}</span>
                  <div>
                    <div class="mh-roadmap-admin-node-title-line">
                      <strong>${escapeHtml(roadmap.title_ro || roadmap.id)}</strong>
                      ${isImplicit ? `<span class="mh-roadmap-admin-pill is-default">implicit</span>` : ""}
                      <span class="mh-roadmap-admin-pill">${escapeHtml(roadmapCategoryLabel(roadmap.target_type))}</span>
                      <span class="mh-roadmap-admin-pill ${roadmap.published !== false ? "is-live" : "is-draft"}">${roadmap.published !== false ? "publicat" : "draft"}</span>
                    </div>
                    <span>${escapeHtml(roadmap.id)} · ${counts.sections} etape · ${counts.nodes} noduri</span>
                  </div>
                </div>
                <div class="mh-roadmap-admin-roadmap-actions">
                  <button class="btn small" type="button" data-roadmap-library-edit="${escapeHtml(roadmap.id)}">${roadmap.id === selectedRoadmapId ? "✓ Editat" : "Editează"}</button>
                  <button class="btn small" type="button" data-roadmap-order-move="up" data-roadmap-order-id="${escapeHtml(roadmap.id)}" ${!manualOrdering || orderedIndex <= 0 ? "disabled" : ""} title="Mută mai sus">↑</button>
                  <button class="btn small" type="button" data-roadmap-order-move="down" data-roadmap-order-id="${escapeHtml(roadmap.id)}" ${!manualOrdering || orderedIndex < 0 || orderedIndex >= ordered.length - 1 ? "disabled" : ""} title="Mută mai jos">↓</button>
                  <button class="btn small" type="button" data-roadmap-set-default="${escapeHtml(roadmap.id)}" ${isImplicit || roadmap.published === false ? "disabled" : ""}>⭐ Implicit</button>
                </div>
              </article>
            `;
          }).join("") : `<div class="mh-roadmap-admin-empty">Niciun roadmap pentru filtrele selectate.</div>`}
        </div>
      </section>
    `;
  }

  function prerequisitePicker(nodeId = editingNodeId) {
    const selected = new Set(prerequisitesFor(nodeId));
    const nodes = selectedNodes().filter((node) => node.id !== nodeId);
    if (!nodes.length) return `<div class="mh-roadmap-admin-empty">Adaugă mai întâi alte noduri în roadmap.</div>`;

    return `
      <div class="mh-roadmap-admin-prerequisite-picker" data-roadmap-prerequisite-picker>
        ${nodes.map((node) => `
          <label class="mh-roadmap-admin-prerequisite-option">
            <input type="checkbox" name="prerequisite_node_id" value="${escapeHtml(node.id)}" ${selected.has(node.id) ? "checked" : ""}>
            <span>${iconForType(node.node_type)} <strong>${escapeHtml(nodeTitle(node, catalog()))}</strong><br><small>${escapeHtml(node.id)}</small></span>
          </label>
        `).join("")}
      </div>
    `;
  }

  function summaryCards() {
    const roadmap = selectedRoadmap();
    const sections = selectedSections();
    const nodes = selectedNodes();
    const liveNodes = nodes.filter((node) => node.published !== false).length;
    return `
      <div class="mh-roadmap-admin-summary-grid">
        <div class="mh-roadmap-admin-summary-card"><strong>${roadmap ? 1 : 0}</strong><span>roadmap selectat</span></div>
        <div class="mh-roadmap-admin-summary-card"><strong>${sections.length}</strong><span>etape</span></div>
        <div class="mh-roadmap-admin-summary-card"><strong>${nodes.length}</strong><span>noduri</span></div>
        <div class="mh-roadmap-admin-summary-card"><strong>${liveNodes}</strong><span>publicate</span></div>
      </div>
    `;
  }

  function renderQuickAdd() {
    const sections = selectedSections();
    if (!sections.length) {
      return `<div class="mh-roadmap-admin-empty">Creează o etapă înainte să adaugi conținut.</div>`;
    }
    if (!quickSectionId || !sections.some((section) => section.id === quickSectionId)) {
      quickSectionId = sections[0].id;
    }

    const choices = filterRoadmapContent(catalog(), {
      type: quickType,
      query: quickQuery,
      limit: 40
    });
    const existing = new Set(selectedNodes().map((node) => `${node.node_type}:${node.content_id}`));

    return `
      <section class="mh-roadmap-admin-quick-add">
        <strong>⚡ Adăugare rapidă din catalog</strong>
        <div class="mh-roadmap-admin-quick-grid">
          <label>Etapa
            <select class="select" data-roadmap-quick-section>${sectionOptions(quickSectionId)}</select>
          </label>
          <label>Tip
            <select class="select" data-roadmap-quick-type>
              <option value="all" ${quickType === "all" ? "selected" : ""}>Toate</option>
              <option value="lesson" ${quickType === "lesson" ? "selected" : ""}>Lecții</option>
              <option value="problem" ${quickType === "problem" ? "selected" : ""}>Probleme</option>
              <option value="exam" ${quickType === "exam" ? "selected" : ""}>Examene</option>
            </select>
          </label>
          <label>Caută
            <input data-roadmap-quick-search value="${escapeHtml(quickQuery)}" placeholder="titlu, ID, capitol, clasă...">
          </label>
        </div>
        <div class="mh-roadmap-admin-search-results">
          ${choices.length ? choices.map((choice) => {
            const key = `${choice.nodeType}:${choice.contentId}`;
            const alreadyAdded = existing.has(key);
            return `
              <article class="mh-roadmap-admin-content-result">
                <div>
                  <strong>${iconForType(choice.nodeType)} ${escapeHtml(choice.titleRo || choice.contentId)}</strong>
                  <span>${escapeHtml(choice.contentId)}${choice.subtitle ? ` • ${escapeHtml(choice.subtitle)}` : ""}</span>
                </div>
                <button class="btn small" type="button"
                  data-roadmap-quick-add="${escapeHtml(choice.contentId)}"
                  data-roadmap-quick-node-type="${escapeHtml(choice.nodeType)}"
                  ${alreadyAdded ? "disabled" : ""}>
                  ${alreadyAdded ? "✓ Adăugat" : "＋ Adaugă"}
                </button>
              </article>
            `;
          }).join("") : `<div class="mh-roadmap-admin-empty">Niciun rezultat.</div>`}
        </div>
      </section>
    `;
  }

  function boardFiltersActive() {
    return Boolean(boardQuery || boardType !== "all" || boardStatus !== "all" || boardRequirement !== "all");
  }

  function nodeMatchesBoardFilters(node) {
    if (boardType !== "all" && node.node_type !== boardType) return false;
    if (boardStatus === "published" && node.published === false) return false;
    if (boardStatus === "draft" && node.published !== false) return false;
    if (boardRequirement === "required" && node.required === false) return false;
    if (boardRequirement === "optional" && node.required !== false) return false;
    if (!boardQuery) return true;

    const query = boardQuery.toLocaleLowerCase("ro");
    const haystack = [
      node.id,
      node.content_id,
      node.node_type,
      node.title_ro,
      node.title_en,
      nodeTitle(node, catalog())
    ].map((value) => String(value || "")).join(" ").toLocaleLowerCase("ro");
    return haystack.includes(query);
  }

  function renderBoardToolbar(visibleCount, totalCount) {
    return `
      <section class="mh-roadmap-admin-board-filterbar">
        <div class="mh-roadmap-admin-board-filter-head">
          <strong>Conținut roadmap</strong>
          <span>${visibleCount}/${totalCount} noduri</span>
        </div>
        <div class="mh-roadmap-admin-board-filters">
          <label>Caută
            <input data-roadmap-board-search value="${escapeHtml(boardQuery)}" placeholder="titlu, ID, content ID...">
          </label>
          <label>Tip
            <select class="select" data-roadmap-board-type>
              <option value="all" ${boardType === "all" ? "selected" : ""}>Toate</option>
              <option value="lesson" ${boardType === "lesson" ? "selected" : ""}>Lecții</option>
              <option value="problem" ${boardType === "problem" ? "selected" : ""}>Probleme</option>
              <option value="exam" ${boardType === "exam" ? "selected" : ""}>Examene</option>
              <option value="milestone" ${boardType === "milestone" ? "selected" : ""}>Milestones</option>
            </select>
          </label>
          <label>Status
            <select class="select" data-roadmap-board-status>
              <option value="all" ${boardStatus === "all" ? "selected" : ""}>Toate</option>
              <option value="published" ${boardStatus === "published" ? "selected" : ""}>Publicate</option>
              <option value="draft" ${boardStatus === "draft" ? "selected" : ""}>Draft</option>
            </select>
          </label>
          <label>Cerință
            <select class="select" data-roadmap-board-requirement>
              <option value="all" ${boardRequirement === "all" ? "selected" : ""}>Toate</option>
              <option value="required" ${boardRequirement === "required" ? "selected" : ""}>Obligatorii</option>
              <option value="optional" ${boardRequirement === "optional" ? "selected" : ""}>Opționale</option>
            </select>
          </label>
          <button class="btn small" type="button" data-roadmap-board-reset ${boardFiltersActive() ? "" : "disabled"}>Reset</button>
        </div>
      </section>
    `;
  }

  function renderBoard() {
    const sections = selectedSections();
    if (!sections.length) return `<div class="mh-roadmap-admin-empty">Nicio etapă. Folosește formularul „Etapă” de mai jos.</div>`;

    const totalCount = selectedNodes().length;
    const visibleCount = selectedNodes().filter(nodeMatchesBoardFilters).length;
    const filtering = boardFiltersActive();
    const groupMap = new Map();

    sections.forEach((section, sectionIndex) => {
      const allNodes = sectionNodes(section.id);
      const nodes = allNodes.filter(nodeMatchesBoardFilters);
      if (filtering && !nodes.length) return;

      const group = sectionVisualGroup(section);
      if (!groupMap.has(group.key)) {
        groupMap.set(group.key, {
          key: group.key,
          label: group.label,
          sections: [],
          topics: new Set(),
          totalNodes: 0,
          visibleNodes: 0,
          firstSectionIndex: sectionIndex
        });
      }

      const bucket = groupMap.get(group.key);
      bucket.sections.push({ section, sectionIndex, allNodes, nodes });
      bucket.topics.add(sectionTopicLabel(section));
      bucket.totalNodes += allNodes.length;
      bucket.visibleNodes += nodes.length;
      bucket.firstSectionIndex = Math.min(bucket.firstSectionIndex, sectionIndex);
    });

    const grouped = [...groupMap.values()].sort((left, right) => (
      sectionGroupRank(left.key) - sectionGroupRank(right.key)
      || left.firstSectionIndex - right.firstSectionIndex
    ));

    const groupCards = grouped.map((group) => {
      const topicBadges = [...group.topics].filter(Boolean).slice(0, 10);
      const isLargeCurriculumGroup = /^grade-/.test(group.key);
      return `
        <details class="mh-roadmap-admin-super-node ${isLargeCurriculumGroup ? "is-grade-group" : ""}" open>
          <summary class="mh-roadmap-admin-super-node-head">
            <span class="mh-roadmap-admin-super-node-marker" aria-hidden="true">${isLargeCurriculumGroup ? "🎓" : group.key === "intro" ? "🧭" : "🗂️"}</span>
            <span class="mh-roadmap-admin-super-node-copy">
              <span class="mh-roadmap-admin-group-kicker">super-nod</span>
              <strong>${escapeHtml(group.label)}</strong>
              <small>${group.sections.length} etape · ${filtering ? `${group.visibleNodes}/${group.totalNodes}` : group.totalNodes} noduri</small>
            </span>
            <span class="mh-roadmap-admin-super-node-topics">
              ${topicBadges.map((topic) => `<span class="mh-roadmap-admin-group-chip">${escapeHtml(topic)}</span>`).join("")}
            </span>
            <span class="mh-roadmap-admin-super-node-chevron" aria-hidden="true">⌄</span>
          </summary>
          <div class="mh-roadmap-admin-group-sections">
            ${group.sections.map(({ section, sectionIndex, allNodes, nodes }) => `
              <article class="mh-roadmap-admin-section-card" data-roadmap-drop-section="${escapeHtml(section.id)}">
                <header>
                  <div>
                    <strong>${escapeHtml(sectionTitle(section))}</strong>
                    <span>${escapeHtml(section.id)} • ${filtering ? `${nodes.length}/${allNodes.length}` : allNodes.length} noduri</span>
                  </div>
                  <div class="mh-roadmap-admin-section-actions">
                    <button class="btn small" type="button" data-roadmap-section-move="up" data-roadmap-section-id="${escapeHtml(section.id)}" ${sectionIndex === 0 || filtering ? "disabled" : ""}>↑</button>
                    <button class="btn small" type="button" data-roadmap-section-move="down" data-roadmap-section-id="${escapeHtml(section.id)}" ${sectionIndex === sections.length - 1 || filtering ? "disabled" : ""}>↓</button>
                    <button class="btn small" type="button" data-roadmap-section-quick-add="${escapeHtml(section.id)}">＋ Conținut</button>
                    <button class="btn small" type="button" data-roadmap-edit-section="${escapeHtml(section.id)}">✏️</button>
                    <button class="btn small" type="button" data-roadmap-delete-section="${escapeHtml(section.id)}">🗑</button>
                  </div>
                </header>
                <div class="mh-roadmap-admin-node-list">
                  ${nodes.length ? nodes.map((node) => {
                    const nodeIndex = allNodes.findIndex((item) => item.id === node.id);
                    return `
                      <div class="mh-roadmap-admin-node-row" draggable="${filtering ? "false" : "true"}" data-roadmap-drag-node="${escapeHtml(node.id)}">
                        <div>
                          <div class="mh-roadmap-admin-node-title-line">
                            <strong>${iconForType(node.node_type)} ${escapeHtml(nodeTitle(node, catalog()))}</strong>
                            <span class="mh-roadmap-admin-pill ${node.published !== false ? "is-live" : "is-draft"}">${node.published !== false ? "publicat" : "draft"}</span>
                            ${node.required !== false ? `<span class="mh-roadmap-admin-pill">obligatoriu</span>` : `<span class="mh-roadmap-admin-pill">opțional</span>`}
                          </div>
                          <span>${escapeHtml(node.node_type)} • ${escapeHtml(node.content_id || "milestone")} • prerechizite: ${escapeHtml(prerequisitesFor(node.id).length || 0)}</span>
                        </div>
                        <div class="mh-roadmap-admin-node-actions">
                          <button class="btn small" type="button" data-roadmap-node-move="up" data-roadmap-node-id="${escapeHtml(node.id)}" ${nodeIndex === 0 || filtering ? "disabled" : ""}>↑</button>
                          <button class="btn small" type="button" data-roadmap-node-move="down" data-roadmap-node-id="${escapeHtml(node.id)}" ${nodeIndex === allNodes.length - 1 || filtering ? "disabled" : ""}>↓</button>
                          <select class="select" data-roadmap-node-section="${escapeHtml(node.id)}" title="Mută în altă etapă">
                            ${sectionOptions(section.id)}
                          </select>
                          <button class="btn small" type="button" data-roadmap-node-toggle-required="${escapeHtml(node.id)}">${node.required !== false ? "★" : "☆"}</button>
                          <button class="btn small" type="button" data-roadmap-node-toggle-published="${escapeHtml(node.id)}">${node.published !== false ? "👁" : "🙈"}</button>
                          <button class="btn small" type="button" data-roadmap-duplicate-node="${escapeHtml(node.id)}">⧉</button>
                          <button class="btn small" type="button" data-roadmap-edit-node="${escapeHtml(node.id)}">✏️</button>
                          <button class="btn small" type="button" data-roadmap-delete-node="${escapeHtml(node.id)}">🗑</button>
                        </div>
                      </div>
                    `;
                  }).join("") : `<div class="mh-roadmap-admin-empty">Trage aici un nod sau folosește „＋ Conținut”.</div>`}
                </div>
              </article>
            `).join("")}
          </div>
        </details>
      `;
    }).join("");

    return `
      ${renderBoardToolbar(visibleCount, totalCount)}
      <div class="mh-roadmap-admin-list">
        ${groupCards || `<div class="mh-roadmap-admin-empty">Niciun nod pentru filtrele selectate.</div>`}
      </div>
    `;
  }


  function render() {
    root.hidden = !enabled;
    if (!enabled) return;

    const roadmap = selectedRoadmap();
    root.innerHTML = `
      <div class="mh-roadmap-admin-dashboard">
        <div class="mh-roadmap-admin-head">
          <div>
            <h3>🧭 Plan de studiu</h3>
            <p>Organizezi roadmap-urile, categoriile și ordinea lor, apoi editezi etapele și conținutul.</p>
          </div>
          <div class="mh-roadmap-admin-head-actions">
            <button class="btn small" type="button" data-roadmap-admin-validate ${busy || !roadmap ? "disabled" : ""}>✓ Validează</button>
            <button class="btn small" type="button" data-roadmap-admin-refresh ${busy ? "disabled" : ""}>Refresh</button>
            <button class="btn small" type="button" data-roadmap-new-roadmap>＋ Roadmap</button>
          </div>
        </div>

        ${statusMessage ? `<div class="mh-roadmap-admin-status">${escapeHtml(statusMessage)}</div>` : ""}

        ${renderRoadmapLibrary()}

        <div class="mh-roadmap-admin-selector">
          <label><span>Roadmap editat</span><select class="select" data-roadmap-admin-select>${roadmapOptions()}</select></label>
          ${roadmap ? `<button class="btn small" type="button" data-roadmap-delete-roadmap="${escapeHtml(roadmap.id)}">🗑 Șterge roadmap</button>` : ""}
        </div>

        ${summaryCards()}
        ${roadmap ? renderQuickAdd() : ""}
        ${roadmap ? renderBoard() : `<div class="mh-roadmap-admin-empty">Creează primul roadmap din formular.</div>`}

        <details class="mh-roadmap-admin-form">
          <summary><strong>⚙️ Setări roadmap</strong></summary>
          <form data-roadmap-form="roadmap">
            <div class="mh-roadmap-admin-grid">
              <label>ID<input name="id" value="${escapeHtml(roadmap?.id || "")}" placeholder="ubb-admitere"></label>
              <label>Slug<input name="slug" value="${escapeHtml(roadmap?.slug || "")}" placeholder="road-to-ubb"></label>
              <label>Icon<input name="icon" value="${escapeHtml(roadmap?.icon || "🗺️")}"></label>
              <label>Categorie<input name="target_type" list="mhRoadmapCategoryOptions" value="${escapeHtml(roadmap?.target_type || "custom")}" placeholder="admission"></label>
              <datalist id="mhRoadmapCategoryOptions">
                <option value="mathhard_m1">MathHard M1</option>
                <option value="admission">Admitere</option>
                <option value="bac">BAC</option>
                <option value="olympiad">Olimpiadă</option>
                <option value="school">Școală</option>
                <option value="custom">Custom</option>
                ${roadmapCategories(data.roadmaps).map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(roadmapCategoryLabel(value))}</option>`).join("")}
              </datalist>
              <label>Poziție<input name="position" type="number" value="${Number(roadmap?.position || 0)}"></label>
            </div>
            <label>Titlu RO<input name="title_ro" value="${escapeHtml(roadmap?.title_ro || "")}"></label>
            <label>Titlu EN<input name="title_en" value="${escapeHtml(roadmap?.title_en || "")}"></label>
            <label>Descriere RO<textarea name="description_ro" rows="2">${escapeHtml(roadmap?.description_ro || "")}</textarea></label>
            <label>Descriere EN<textarea name="description_en" rows="2">${escapeHtml(roadmap?.description_en || "")}</textarea></label>
            <label class="mh-roadmap-admin-check"><input name="published" type="checkbox" ${roadmap?.published !== false ? "checked" : ""}> Publicat</label>
            <div class="mh-roadmap-admin-actions"><button class="btn" type="submit" ${busy ? "disabled" : ""}>💾 Salvează roadmap</button></div>
          </form>
        </details>

        <details class="mh-roadmap-admin-form" data-roadmap-section-details>
          <summary><strong>➕ / ✏️ Etapă</strong></summary>
          <form data-roadmap-form="section">
            <div class="mh-roadmap-admin-grid">
              <label>ID<input name="id" placeholder="ubb-algebra"></label>
              <label>Roadmap ID<input name="roadmap_id" value="${escapeHtml(selectedRoadmapId)}" readonly></label>
              <label>Cheie secțiune<input name="section_key" placeholder="algebra"></label>
              <label>Poziție<input name="position" type="number" value="${nextPosition(selectedSections())}"></label>
            </div>
            <label>Titlu RO<input name="title_ro"></label>
            <label>Titlu EN<input name="title_en"></label>
            <label>Descriere RO<textarea name="description_ro" rows="2"></textarea></label>
            <label>Descriere EN<textarea name="description_en" rows="2"></textarea></label>
            <div class="mh-roadmap-admin-actions">
              <button class="btn" type="submit" ${busy ? "disabled" : ""}>💾 Salvează etapa</button>
              <button class="btn small" type="reset">♻️ Reset</button>
            </div>
          </form>
        </details>

        <details class="mh-roadmap-admin-form" data-roadmap-node-details>
          <summary><strong>➕ / ✏️ Nod și prerechizite</strong></summary>
          <form data-roadmap-form="node">
            <div class="mh-roadmap-admin-grid">
              <label>ID<input name="id" placeholder="generat automat dacă rămâne gol"></label>
              <label>Roadmap ID<input name="roadmap_id" value="${escapeHtml(selectedRoadmapId)}" readonly></label>
              <label>Etapă<select name="section_id" class="select">${sectionOptions()}</select></label>
              <label>Tip<select name="node_type" class="select"><option value="lesson">lesson</option><option value="problem">problem</option><option value="exam">exam</option><option value="milestone">milestone</option></select></label>
              <label>Content ID<input name="content_id" placeholder="selectează din catalog sau scrie ID"></label>
              <label>Minute<input name="estimated_minutes" type="number" min="0" value="20"></label>
              <label>Poziție<input name="position" type="number" value="0"></label>
            </div>
            <label>Titlu RO override<input name="title_ro"></label>
            <label>Titlu EN override<input name="title_en"></label>
            <label>Descriere RO<textarea name="description_ro" rows="2"></textarea></label>
            <label>Descriere EN<textarea name="description_en" rows="2"></textarea></label>
            <div><span class="legend">Prerechizite</span>${prerequisitePicker()}</div>
            <div class="mh-roadmap-admin-check-row">
              <label class="mh-roadmap-admin-check"><input name="required" type="checkbox" checked> Obligatoriu</label>
              <label class="mh-roadmap-admin-check"><input name="published" type="checkbox" checked> Publicat</label>
            </div>
            <div class="mh-roadmap-admin-actions">
              <button class="btn" type="submit" ${busy ? "disabled" : ""}>💾 Salvează nodul</button>
              <button class="btn small" type="reset" data-roadmap-reset-node>♻️ Reset</button>
            </div>
          </form>
        </details>
      </div>
    `;

    bindInteractions();
  }

  async function runMutation(label, callback) {
    if (busy) return;
    busy = true;
    statusMessage = `${label}…`;
    render();
    try {
      await callback();
      await load();
      await onChanged();
      statusMessage = `${label}: gata.`;
    } catch (error) {
      console.error(`${label} failed:`, error);
      statusMessage = `${label}: ${error?.message || error}`;
    } finally {
      busy = false;
      render();
    }
  }

  function fillForm(type, item) {
    const form = root.querySelector(`[data-roadmap-form="${type}"]`);
    if (!form || !item) return;
    const details = form.closest("details");
    if (details) details.open = true;

    for (const element of form.elements) {
      if (!element.name) continue;
      if (element.type === "checkbox") element.checked = Boolean(item[element.name]);
      else if (Object.hasOwn(item, element.name)) element.value = item[element.name] ?? "";
    }

    if (type === "node") {
      editingNodeId = item.id;
      const pickerHost = form.querySelector("[data-roadmap-prerequisite-picker]")?.parentElement;
      if (pickerHost) pickerHost.innerHTML = `<span class="legend">Prerechizite</span>${prerequisitePicker(item.id)}`;
    }
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function persistRoadmapOrder(items) {
    const normalized = normalizeOrderedPositions(items);
    const changed = normalized.filter((item) => {
      const current = data.roadmaps.find((roadmap) => roadmap.id === item.id);
      return current && Number(current.position || 0) !== Number(item.position || 0);
    });
    for (const item of changed) {
      await patchRoadmapEntity(supabase, "mh_roadmaps", item.id, { position: item.position });
    }
  }

  async function reorderRoadmap(roadmapId, direction) {
    await persistRoadmapOrder(moveOrderedItem(orderedRoadmaps(), roadmapId, direction));
  }

  async function setDefaultRoadmap(roadmapId) {
    const roadmap = data.roadmaps.find((item) => item.id === roadmapId);
    if (!roadmap) throw new Error("Roadmap-ul nu există.");
    if (roadmap.published === false) throw new Error("Publică roadmap-ul înainte să îl setezi implicit.");
    const ordered = orderedRoadmaps().filter((item) => item.id !== roadmapId);
    await persistRoadmapOrder([roadmap, ...ordered]);
  }

  async function reorderSections(sectionId, direction) {
    const ordered = normalizeOrderedPositions(moveOrderedItem(selectedSections(), sectionId, direction));
    await saveRoadmapPositions(supabase, "mh_roadmap_sections", ordered, { roadmapId: selectedRoadmapId });
  }

  async function reorderNode(nodeId, direction) {
    const node = data.nodes.find((item) => item.id === nodeId);
    if (!node) return;
    const ordered = normalizeOrderedPositions(moveOrderedItem(sectionNodes(node.section_id), nodeId, direction));
    await saveRoadmapPositions(supabase, "mh_roadmap_nodes", ordered, { roadmapId: selectedRoadmapId });
  }

  async function moveNodeToSection(nodeId, sectionId) {
    const node = data.nodes.find((item) => item.id === nodeId);
    if (!node || node.section_id === sectionId) return;

    const sourceRows = normalizeOrderedPositions(
      sectionNodes(node.section_id).filter((item) => item.id !== nodeId)
    ).map((item) => ({ ...item, section_id: node.section_id }));
    const targetRows = normalizeOrderedPositions([
      ...sectionNodes(sectionId),
      { ...node, section_id: sectionId }
    ]).map((item) => ({ ...item, section_id: sectionId }));

    await saveRoadmapPositions(
      supabase,
      "mh_roadmap_nodes",
      [...sourceRows, ...targetRows],
      { roadmapId: selectedRoadmapId }
    );
  }

  async function duplicateNode(nodeId) {
    const node = data.nodes.find((item) => item.id === nodeId);
    if (!node) return;
    const copyId = createRoadmapNodeId({
      roadmapId: node.roadmap_id,
      sectionId: node.section_id,
      nodeType: node.node_type,
      contentId: `${node.content_id || node.id}-copy`,
      existingIds: data.nodes.map((item) => item.id)
    });
    const saved = await saveRoadmapNode(supabase, {
      ...node,
      id: copyId,
      position: nextPosition(sectionNodes(node.section_id))
    });
    await replaceNodePrerequisites(supabase, {
      roadmapId: saved.roadmap_id,
      nodeId: saved.id,
      prerequisiteNodeIds: prerequisitesFor(nodeId)
    });
  }

  async function quickAdd(contentId, nodeType) {
    const sections = selectedSections();
    const section = sections.find((item) => item.id === quickSectionId) || sections[0];
    if (!section) throw new Error("Selectează mai întâi o etapă.");
    const collection = nodeType === "lesson"
      ? catalog().lessons
      : nodeType === "problem"
        ? catalog().problems
        : catalog().exams;
    const content = (collection || []).find((item) => item.id === contentId);
    const nodeId = createRoadmapNodeId({
      roadmapId: selectedRoadmapId,
      sectionId: section.id,
      nodeType,
      contentId,
      existingIds: data.nodes.map((item) => item.id)
    });
    await saveRoadmapNode(supabase, {
      id: nodeId,
      roadmap_id: selectedRoadmapId,
      section_id: section.id,
      node_type: nodeType,
      content_id: contentId,
      title_ro: "",
      title_en: "",
      description_ro: "",
      description_en: "",
      estimated_minutes: nodeType === "exam" ? 120 : nodeType === "problem" ? 20 : 30,
      required: true,
      published: true,
      position: nextPosition(sectionNodes(section.id))
    });
    statusMessage = `${translated(content)} a fost adăugat.`;
  }

  function collectPrerequisites(form) {
    return [...form.querySelectorAll('input[name="prerequisite_node_id"]:checked')]
      .map((input) => input.value)
      .filter(Boolean);
  }

  async function validateSelectedRoadmap() {
    if (!selectedRoadmapId || busy) return;
    busy = true;
    statusMessage = "Se validează roadmap-ul…";
    render();
    try {
      const result = await validateRoadmapGraph(supabase, selectedRoadmapId);
      const issues = Array.isArray(result?.issues) ? result.issues : [];
      statusMessage = result?.valid
        ? "Roadmap valid. Nu au fost găsite probleme."
        : `Roadmap invalid: ${issues.map((issue) => issue.message || issue.code).join(" · ")}`;
    } catch (error) {
      console.error("Roadmap validation failed:", error);
      statusMessage = `Validare roadmap: ${error?.message || error}`;
    } finally {
      busy = false;
      render();
    }
  }

  function bindInteractions() {
    root.querySelector("[data-roadmap-admin-refresh]")?.addEventListener("click", () => void load());
    root.querySelector("[data-roadmap-admin-validate]")?.addEventListener("click", () => {
      void validateSelectedRoadmap();
    });
    root.querySelector("[data-roadmap-admin-select]")?.addEventListener("change", (event) => {
      selectedRoadmapId = String(event.target.value || "");
      quickSectionId = selectedSections()[0]?.id || "";
      editingNodeId = "";
      render();
    });
    root.querySelector("[data-roadmap-new-roadmap]")?.addEventListener("click", () => {
      selectedRoadmapId = "";
      render();
      const form = root.querySelector('[data-roadmap-form="roadmap"]');
      form?.reset();
      form?.closest("details")?.setAttribute("open", "");
    });

    root.querySelector("[data-roadmap-library-search]")?.addEventListener("input", (event) => {
      roadmapQuery = event.target.value;
      const caret = event.target.selectionStart;
      render();
      const replacement = root.querySelector("[data-roadmap-library-search]");
      replacement?.focus();
      replacement?.setSelectionRange(caret, caret);
    });
    root.querySelector("[data-roadmap-library-category]")?.addEventListener("change", (event) => {
      roadmapCategory = event.target.value || "all";
      render();
    });
    root.querySelector("[data-roadmap-library-status]")?.addEventListener("change", (event) => {
      roadmapStatus = event.target.value || "all";
      render();
    });
    root.querySelector("[data-roadmap-library-sort]")?.addEventListener("change", (event) => {
      roadmapSort = event.target.value || "position";
      render();
    });
    root.querySelector("[data-roadmap-library-reset]")?.addEventListener("click", () => {
      roadmapQuery = "";
      roadmapCategory = "all";
      roadmapStatus = "all";
      roadmapSort = "position";
      render();
    });
    for (const button of root.querySelectorAll("[data-roadmap-library-edit]")) {
      button.addEventListener("click", () => {
        selectedRoadmapId = button.dataset.roadmapLibraryEdit || "";
        quickSectionId = selectedSections()[0]?.id || "";
        editingNodeId = "";
        render();
      });
    }
    for (const button of root.querySelectorAll("[data-roadmap-order-move]")) {
      button.addEventListener("click", () => void runMutation("Reordonare roadmap", () => reorderRoadmap(
        button.dataset.roadmapOrderId,
        button.dataset.roadmapOrderMove
      )));
    }
    for (const button of root.querySelectorAll("[data-roadmap-set-default]")) {
      button.addEventListener("click", () => void runMutation("Setare roadmap implicit", () => setDefaultRoadmap(
        button.dataset.roadmapSetDefault
      )));
    }

    root.querySelector("[data-roadmap-board-search]")?.addEventListener("input", (event) => {
      boardQuery = event.target.value;
      const caret = event.target.selectionStart;
      render();
      const replacement = root.querySelector("[data-roadmap-board-search]");
      replacement?.focus();
      replacement?.setSelectionRange(caret, caret);
    });
    root.querySelector("[data-roadmap-board-type]")?.addEventListener("change", (event) => {
      boardType = event.target.value || "all";
      render();
    });
    root.querySelector("[data-roadmap-board-status]")?.addEventListener("change", (event) => {
      boardStatus = event.target.value || "all";
      render();
    });
    root.querySelector("[data-roadmap-board-requirement]")?.addEventListener("change", (event) => {
      boardRequirement = event.target.value || "all";
      render();
    });
    root.querySelector("[data-roadmap-board-reset]")?.addEventListener("click", () => {
      boardQuery = "";
      boardType = "all";
      boardStatus = "all";
      boardRequirement = "all";
      render();
    });

    root.querySelector("[data-roadmap-quick-section]")?.addEventListener("change", (event) => {
      quickSectionId = event.target.value;
      render();
    });
    root.querySelector("[data-roadmap-quick-type]")?.addEventListener("change", (event) => {
      quickType = event.target.value;
      render();
    });
    root.querySelector("[data-roadmap-quick-search]")?.addEventListener("input", (event) => {
      quickQuery = event.target.value;
      const caret = event.target.selectionStart;
      render();
      const replacement = root.querySelector("[data-roadmap-quick-search]");
      replacement?.focus();
      replacement?.setSelectionRange(caret, caret);
    });

    for (const button of root.querySelectorAll("[data-roadmap-quick-add]")) {
      button.addEventListener("click", () => void runMutation("Adăugare conținut", () => quickAdd(
        button.dataset.roadmapQuickAdd,
        button.dataset.roadmapQuickNodeType
      )));
    }
    for (const button of root.querySelectorAll("[data-roadmap-section-quick-add]")) {
      button.addEventListener("click", () => {
        quickSectionId = button.dataset.roadmapSectionQuickAdd;
        root.querySelector(".mh-roadmap-admin-quick-add")?.scrollIntoView({ behavior: "smooth", block: "start" });
        render();
      });
    }

    root.querySelector('[data-roadmap-form="roadmap"]')?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const id = formValue(form, "id") || slugifyRoadmapValue(formValue(form, "title_ro"), "roadmap");
      void runMutation("Salvare roadmap", async () => {
        const saved = await saveRoadmap(supabase, {
          id,
          slug: formValue(form, "slug") || id,
          icon: formValue(form, "icon"),
          target_type: formValue(form, "target_type"),
          position: formNumber(form, "position"),
          title_ro: formValue(form, "title_ro"),
          title_en: formValue(form, "title_en"),
          description_ro: formValue(form, "description_ro"),
          description_en: formValue(form, "description_en"),
          published: formChecked(form, "published")
        });
        selectedRoadmapId = saved.id;
      });
    });

    root.querySelector('[data-roadmap-form="section"]')?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const titleRo = formValue(form, "title_ro");
      const id = formValue(form, "id") || `${slugifyRoadmapValue(selectedRoadmapId)}-${slugifyRoadmapValue(titleRo, "etapa")}`;
      void runMutation("Salvare etapă", () => saveRoadmapSection(supabase, {
        id,
        roadmap_id: selectedRoadmapId,
        section_key: formValue(form, "section_key") || slugifyRoadmapValue(titleRo, id),
        position: formNumber(form, "position", nextPosition(selectedSections())),
        title_ro: titleRo,
        title_en: formValue(form, "title_en"),
        description_ro: formValue(form, "description_ro"),
        description_en: formValue(form, "description_en")
      }));
    });

    root.querySelector('[data-roadmap-form="node"]')?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const sectionId = formValue(form, "section_id");
      const nodeType = formValue(form, "node_type");
      const contentId = formValue(form, "content_id");
      const id = formValue(form, "id") || createRoadmapNodeId({
        roadmapId: selectedRoadmapId,
        sectionId,
        nodeType,
        contentId: contentId || formValue(form, "title_ro") || "milestone",
        existingIds: data.nodes.map((item) => item.id)
      });
      void runMutation("Salvare nod", async () => {
        const saved = await saveRoadmapNode(supabase, {
          id,
          roadmap_id: selectedRoadmapId,
          section_id: sectionId,
          node_type: nodeType,
          content_id: contentId,
          title_ro: formValue(form, "title_ro"),
          title_en: formValue(form, "title_en"),
          description_ro: formValue(form, "description_ro"),
          description_en: formValue(form, "description_en"),
          estimated_minutes: formNumber(form, "estimated_minutes"),
          position: formNumber(form, "position", nextPosition(sectionNodes(sectionId))),
          required: formChecked(form, "required"),
          published: formChecked(form, "published")
        });
        await replaceNodePrerequisites(supabase, {
          roadmapId: saved.roadmap_id,
          nodeId: saved.id,
          prerequisiteNodeIds: collectPrerequisites(form)
        });
        editingNodeId = "";
      });
    });

    root.querySelector("[data-roadmap-reset-node]")?.addEventListener("click", () => {
      editingNodeId = "";
      setTimeout(render, 0);
    });

    for (const button of root.querySelectorAll("[data-roadmap-edit-section]")) {
      button.addEventListener("click", () => fillForm("section", data.sections.find((item) => item.id === button.dataset.roadmapEditSection)));
    }
    for (const button of root.querySelectorAll("[data-roadmap-edit-node]")) {
      button.addEventListener("click", () => fillForm("node", data.nodes.find((item) => item.id === button.dataset.roadmapEditNode)));
    }
    for (const button of root.querySelectorAll("[data-roadmap-section-move]")) {
      button.addEventListener("click", () => void runMutation("Reordonare etapă", () => reorderSections(
        button.dataset.roadmapSectionId,
        button.dataset.roadmapSectionMove
      )));
    }
    for (const button of root.querySelectorAll("[data-roadmap-node-move]")) {
      button.addEventListener("click", () => void runMutation("Reordonare nod", () => reorderNode(
        button.dataset.roadmapNodeId,
        button.dataset.roadmapNodeMove
      )));
    }
    for (const select of root.querySelectorAll("[data-roadmap-node-section]")) {
      select.addEventListener("change", () => void runMutation("Mutare nod", () => moveNodeToSection(
        select.dataset.roadmapNodeSection,
        select.value
      )));
    }
    for (const button of root.querySelectorAll("[data-roadmap-node-toggle-required]")) {
      button.addEventListener("click", () => {
        const node = data.nodes.find((item) => item.id === button.dataset.roadmapNodeToggleRequired);
        if (!node) return;
        void runMutation("Schimbare obligativitate", () => patchRoadmapEntity(supabase, "mh_roadmap_nodes", node.id, { required: node.required === false }));
      });
    }
    for (const button of root.querySelectorAll("[data-roadmap-node-toggle-published]")) {
      button.addEventListener("click", () => {
        const node = data.nodes.find((item) => item.id === button.dataset.roadmapNodeTogglePublished);
        if (!node) return;
        void runMutation("Schimbare publicare", () => patchRoadmapEntity(supabase, "mh_roadmap_nodes", node.id, { published: node.published === false }));
      });
    }
    for (const button of root.querySelectorAll("[data-roadmap-duplicate-node]")) {
      button.addEventListener("click", () => void runMutation("Duplicare nod", () => duplicateNode(button.dataset.roadmapDuplicateNode)));
    }

    for (const row of root.querySelectorAll("[data-roadmap-drag-node]")) {
      row.addEventListener("dragstart", () => {
        draggedNodeId = row.dataset.roadmapDragNode;
        row.classList.add("is-dragging");
      });
      row.addEventListener("dragend", () => {
        draggedNodeId = "";
        row.classList.remove("is-dragging");
        root.querySelectorAll(".is-drop-target").forEach((item) => item.classList.remove("is-drop-target"));
      });
    }
    for (const section of root.querySelectorAll("[data-roadmap-drop-section]")) {
      section.addEventListener("dragover", (event) => {
        if (!draggedNodeId) return;
        event.preventDefault();
        section.classList.add("is-drop-target");
      });
      section.addEventListener("dragleave", () => section.classList.remove("is-drop-target"));
      section.addEventListener("drop", (event) => {
        event.preventDefault();
        section.classList.remove("is-drop-target");
        if (!draggedNodeId) return;
        const nodeId = draggedNodeId;
        draggedNodeId = "";
        void runMutation("Mutare nod", () => moveNodeToSection(nodeId, section.dataset.roadmapDropSection));
      });
    }

    for (const button of root.querySelectorAll("[data-roadmap-delete-node]")) {
      button.addEventListener("click", () => {
        const id = button.dataset.roadmapDeleteNode;
        if (!confirm(`Ștergi nodul ${id}?`)) return;
        void runMutation("Ștergere nod", () => deleteRoadmapEntity(supabase, "mh_roadmap_nodes", id));
      });
    }
    for (const button of root.querySelectorAll("[data-roadmap-delete-section]")) {
      button.addEventListener("click", () => {
        const id = button.dataset.roadmapDeleteSection;
        if (!confirm(`Ștergi etapa ${id} și toate nodurile ei?`)) return;
        void runMutation("Ștergere etapă", () => deleteRoadmapEntity(supabase, "mh_roadmap_sections", id));
      });
    }
    root.querySelector("[data-roadmap-delete-roadmap]")?.addEventListener("click", (event) => {
      const id = event.currentTarget.dataset.roadmapDeleteRoadmap;
      if (!confirm(`Ștergi roadmap-ul ${id} și întregul său graf?`)) return;
      void runMutation("Ștergere roadmap", async () => {
        await deleteRoadmapEntity(supabase, "mh_roadmaps", id);
        selectedRoadmapId = "";
      });
    });
  }

  async function load() {
    if (!enabled) return data;
    busy = true;
    render();
    try {
      data = await loadRoadmapAdminData(supabase);
      if (!selectedRoadmapId || !data.roadmaps.some((item) => item.id === selectedRoadmapId)) {
        selectedRoadmapId = orderedRoadmaps()[0]?.id || "";
      }
      if (!quickSectionId || !selectedSections().some((section) => section.id === quickSectionId)) {
        quickSectionId = selectedSections()[0]?.id || "";
      }
      return data;
    } finally {
      busy = false;
      render();
    }
  }

  function setAdmin(isAdmin) {
    enabled = Boolean(isAdmin);
    if (!enabled) {
      data = { roadmaps: [], sections: [], nodes: [], edges: [] };
      selectedRoadmapId = "";
      statusMessage = "";
      roadmapQuery = "";
      roadmapCategory = "all";
      roadmapStatus = "all";
      roadmapSort = "position";
      boardQuery = "";
      boardType = "all";
      boardStatus = "all";
      boardRequirement = "all";
      root.hidden = true;
      root.innerHTML = "";
      return;
    }
    render();
  }

  return { load, render, setAdmin };
}
