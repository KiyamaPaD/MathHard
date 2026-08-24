import {
  buildRoadmapView,
  getRoadmapNodeIcon,
  getRoadmapStatusLabel
} from "./roadmap-model.js";
import {
  buildRoadmapConceptCoverage,
  conceptLabel,
  conceptsForRoadmapNode
} from "./concept-model.js";
import {
  loadRoadmapCatalog,
  selectRoadmap
} from "./roadmap-repository.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function textFor(language, ro, en) {
  return language === "en" ? en : ro;
}

function nodeButtonTitle(state, language) {
  if (state.status === "locked" && state.unmetPrerequisites.length) {
    return textFor(
      language,
      `Mai întâi: ${state.unmetPrerequisites.join(", ")}`,
      `Complete first: ${state.unmetPrerequisites.join(", ")}`
    );
  }
  if (state.status === "planned") {
    return textFor(language, "Conținutul pentru acest pas urmează să fie publicat.", "Content for this step will be published soon.");
  }
  return state.node.description || state.node.title;
}

function renderAuthGate(language) {
  return `
    <div class="mh-roadmap-state-card">
      <div class="mh-roadmap-state-icon">🔐</div>
      <div>
        <strong>${textFor(language, "Autentifică-te pentru roadmap", "Sign in to use roadmaps")}</strong>
        <p>${textFor(
          language,
          "Roadmap-ul îți calculează progresul din lecțiile, problemele și examenele contului tău.",
          "The roadmap calculates progress from the lessons, problems and exams saved to your account."
        )}</p>
      </div>
    </div>
  `;
}

function renderError(language, message) {
  return `
    <div class="mh-roadmap-state-card is-error">
      <div class="mh-roadmap-state-icon">⚠️</div>
      <div>
        <strong>${textFor(language, "Roadmap-ul nu a putut fi încărcat", "The roadmap could not be loaded")}</strong>
        <p>${escapeHtml(message || textFor(language, "Încearcă din nou.", "Try again."))}</p>
        <button class="btn small" type="button" data-roadmap-retry="1">🔄 ${textFor(language, "Reîncearcă", "Retry")}</button>
      </div>
    </div>
  `;
}

function renderEmpty(language) {
  return `
    <div class="mh-roadmap-state-card">
      <div class="mh-roadmap-state-icon">🧭</div>
      <div>
        <strong>${textFor(language, "Niciun roadmap publicat încă", "No roadmap has been published yet")}</strong>
        <p>${textFor(language, "Adminul poate construi primul traseu din Roadmap Studio.", "An admin can build the first path in Roadmap Studio.")}</p>
      </div>
    </div>
  `;
}

function renderNode(state, language, conceptCatalog) {
  const { node } = state;
  const icon = getRoadmapNodeIcon(node);
  const statusText = state.read && !state.done
    ? textFor(language, "Citită", "Read")
    : getRoadmapStatusLabel(state.status, language);
  const disabled = state.status === "locked" || state.status === "planned" || node.node_type === "milestone";
  const duration = node.estimated_minutes > 0
    ? `<span class="mh-roadmap-node-duration">⏱ ${node.estimated_minutes} min</span>`
    : "";
  const optional = !node.required
    ? `<span class="mh-roadmap-node-optional">${textFor(language, "opțional", "optional")}</span>`
    : "";
  const concepts = node.node_type === "lesson" ? conceptsForRoadmapNode(conceptCatalog, node) : [];
  const conceptChips = concepts.length ? `
    <span class="mh-roadmap-node-concepts" aria-label="${escapeHtml(textFor(language, "Concepte", "Concepts"))}">
      ${concepts.slice(0, 3).map((concept) => `<b>${escapeHtml(conceptLabel(concept, language))}</b>`).join("")}
      ${concepts.length > 3 ? `<b>+${concepts.length - 3}</b>` : ""}
    </span>
  ` : "";

  return `
    <button
      class="mh-roadmap-node is-${escapeHtml(state.status)} ${state.read && !state.done ? "is-read" : ""} ${node.node_type === "milestone" ? "is-milestone" : ""}"
      type="button"
      data-roadmap-node-id="${escapeHtml(node.id)}"
      ${disabled ? "disabled" : ""}
      title="${escapeHtml(nodeButtonTitle(state, language))}"
    >
      <span class="mh-roadmap-node-marker">${icon}</span>
      <span class="mh-roadmap-node-copy">
        <span class="mh-roadmap-node-title">${escapeHtml(node.title)}</span>
        ${node.description ? `<span class="mh-roadmap-node-description">${escapeHtml(node.description)}</span>` : ""}
        ${conceptChips}
        <span class="mh-roadmap-node-meta">
          <span class="mh-roadmap-node-status">${escapeHtml(statusText)}</span>
          ${duration}
          ${optional}
        </span>
      </span>
      <span class="mh-roadmap-node-action" aria-hidden="true">${state.status === "done" ? "✓" : state.read ? "📖" : state.status === "available" ? "→" : state.status === "planned" ? "…" : "🔒"}</span>
    </button>
  `;
}

function renderSection(section, language, conceptCatalog) {
  const stats = section.progress;
  return `
    <section class="mh-roadmap-section-card">
      <header class="mh-roadmap-section-head">
        <div>
          <span class="mh-roadmap-section-kicker">${textFor(language, "Etapă", "Stage")} ${Number(section.position || 0) + 1}</span>
          <h3>${escapeHtml(section.title || section.section_key)}</h3>
          ${section.description ? `<p>${escapeHtml(section.description)}</p>` : ""}
        </div>
        <div class="mh-roadmap-section-score">${stats.done}/${stats.total}</div>
      </header>
      <div class="mh-roadmap-section-progress" aria-label="${stats.percent}%">
        <i style="width:${Math.max(0, Math.min(100, stats.percent))}%"></i>
      </div>
      <div class="mh-roadmap-node-list">
        ${section.nodes.map((state) => renderNode(state, language, conceptCatalog)).join("")}
      </div>
    </section>
  `;
}

export function createRoadmapController({
  root,
  supabase,
  getUser,
  getLanguage,
  getProgress,
  getContentCatalog,
  getConceptCatalog = () => ({}),
  onOpenContent = () => {}
}) {
  if (!root) throw new Error("createRoadmapController requires a root element.");
  if (!supabase) throw new Error("createRoadmapController requires Supabase.");

  let catalog = { roadmaps: [], selectedRoadmapId: "" };
  let selectedRoadmapId = "";
  let loading = false;
  let error = null;

  function currentLanguage() {
    return getLanguage?.() === "en" ? "en" : "ro";
  }

  function currentRoadmap() {
    return catalog.roadmaps.find((roadmap) => roadmap.id === selectedRoadmapId)
      || catalog.roadmaps[0]
      || null;
  }

  function currentView() {
    const progress = getProgress?.() || {};
    return buildRoadmapView({
      roadmap: currentRoadmap(),
      catalog: getContentCatalog?.() || {},
      learnedSet: progress.learnedSet || new Set(),
      readSet: progress.readSet || new Set(),
      solvedSet: progress.solvedSet || new Set(),
      examsPassedSet: progress.examsPassedSet || new Set(),
      language: currentLanguage()
    });
  }

  function bindInteractions() {
    root.querySelector("[data-roadmap-retry]")?.addEventListener("click", () => {
      void load(true).catch(() => {});
    });

    root.querySelector("[data-roadmap-select]")?.addEventListener("change", async (event) => {
      const nextId = String(event.target.value || "");
      if (!nextId || nextId === selectedRoadmapId) return;
      event.target.disabled = true;
      try {
        if (getUser?.()?.id) await selectRoadmap(supabase, nextId, { user: getUser?.() });
        selectedRoadmapId = nextId;
        render();
      } catch (selectionError) {
        error = selectionError;
        render();
      }
    });

    const view = currentView();
    root.querySelector("[data-roadmap-next]")?.addEventListener("click", () => {
      if (view.nextNode) onOpenContent(view.nextNode.node, view.nextNode);
    });

    for (const button of root.querySelectorAll("[data-roadmap-node-id]")) {
      button.addEventListener("click", () => {
        const state = view.nodeStates.get(button.dataset.roadmapNodeId);
        if (!state || !["available", "done"].includes(state.status)) return;
        onOpenContent(state.node, state);
      });
    }
  }

  function render() {
    const language = currentLanguage();

    if (loading) {
      root.innerHTML = `
        <div class="mh-roadmap-state-card">
          <div class="mh-roadmap-spinner" aria-hidden="true"></div>
          <div><strong>${textFor(language, "Se construiește traseul tău…", "Building your path…")}</strong></div>
        </div>
      `;
      return;
    }

    if (error) {
      root.innerHTML = renderError(language, textFor(language, "Încearcă din nou peste câteva momente.", "Try again in a few moments."));
      bindInteractions();
      return;
    }

    if (!catalog.roadmaps.length) {
      root.innerHTML = renderEmpty(language);
      return;
    }

    const roadmap = currentRoadmap();
    const view = currentView();
    const conceptCatalog = getConceptCatalog?.() || {};
    const conceptCoverage = buildRoadmapConceptCoverage(conceptCatalog, view.nodeStates);
    const selectedTitle = view.title || roadmap.id;
    const next = view.nextNode;
    const options = catalog.roadmaps.map((item) => {
      const title = language === "en"
        ? (item.title_en || item.title_ro || item.id)
        : (item.title_ro || item.title_en || item.id);
      return `<option value="${escapeHtml(item.id)}" ${item.id === roadmap.id ? "selected" : ""}>${escapeHtml(item.icon)} ${escapeHtml(title)}</option>`;
    }).join("");

    root.innerHTML = `
      <div class="mh-roadmap-toolbar">
        <label>
          <span class="mh-roadmap-target-label">${textFor(language, "Ținta ta", "Your target")}</span>
          <select class="select" data-roadmap-select="1">${options}</select>
        </label>
      </div>

      <div class="mh-roadmap-overview">
        <div class="mh-roadmap-overview-copy">
          <span class="mh-roadmap-overview-icon">${escapeHtml(roadmap.icon || "🗺️")}</span>
          <div>
            <h3>${escapeHtml(selectedTitle)}</h3>
            <p>${escapeHtml(view.description || "")}</p>
          </div>
        </div>

        <div class="mh-roadmap-overview-progress">
          <div class="mh-roadmap-progress-ring" style="--mh-roadmap-progress:${view.progress.percent * 3.6}deg">
            <span>${view.progress.percent}%</span>
          </div>
          <div>
            <strong>${view.progress.done}/${view.progress.total}</strong>
            <span>${textFor(language, "pași obligatorii", "required steps")}</span>
            <small class="mh-roadmap-concept-coverage">${conceptCoverage.uniqueConcepts} ${textFor(language, "concepte", "concepts")} · ${conceptCoverage.coveragePercent}% ${textFor(language, "mapare", "mapped")}</small>
          </div>
        </div>
      </div>

      <div class="mh-roadmap-next-card ${next ? "" : "is-complete"}">
        <div>
          <span class="mh-roadmap-next-kicker">${next ? textFor(language, "Următorul pas recomandat", "Recommended next step") : textFor(language, "Roadmap finalizat", "Roadmap completed")}</span>
          <strong>${escapeHtml(next?.node?.title || textFor(language, "Ai terminat toți pașii disponibili 🎉", "You completed all available steps 🎉"))}</strong>
          ${next?.node?.description ? `<p>${escapeHtml(next.node.description)}</p>` : ""}
        </div>
        ${next ? `<button class="btn" type="button" data-roadmap-next="1">▶️ ${textFor(language, "Continuă", "Continue")}</button>` : ""}
      </div>

      <div class="mh-roadmap-sections">
        ${view.sections.map((section) => renderSection(section, language, conceptCatalog)).join("")}
      </div>
    `;

    bindInteractions();
  }

  async function load(forceRefresh = false) {
    loading = true;
    error = null;
    render();
    try {
      catalog = await loadRoadmapCatalog({ supabase, forceRefresh, user: getUser?.() });
      selectedRoadmapId = catalog.selectedRoadmapId || catalog.roadmaps[0]?.id || "";
      return catalog;
    } catch (loadError) {
      error = loadError;
      throw loadError;
    } finally {
      loading = false;
      render();
    }
  }

  function clear() {
    catalog = { roadmaps: [], selectedRoadmapId: "" };
    selectedRoadmapId = "";
    loading = false;
    error = null;
    render();
  }

  function findNodeByContent(nodeType, contentId) {
    const type = String(nodeType || "").trim();
    const id = String(contentId || "").trim();
    if (!type || !id) return null;
    const view = currentView();
    for (const state of view.nodeStates.values()) {
      if (state?.node?.node_type === type && state?.node?.content_id === id) {
        return { state, view, roadmap: currentRoadmap() };
      }
    }
    return null;
  }

  return {
    clear,
    load,
    render,
    refreshProgress: render,
    findNodeByContent,
    getCurrentView: currentView,
    get selectedRoadmapId() {
      return selectedRoadmapId;
    },
    get catalog() {
      return catalog;
    }
  };
}
