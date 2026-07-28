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
  filterRoadmapContent,
  moveOrderedItem,
  nextPosition,
  normalizeOrderedPositions,
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

  function catalog() {
    return getContentCatalog?.() || {};
  }

  function selectedRoadmap() {
    return data.roadmaps.find((item) => item.id === selectedRoadmapId) || null;
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
    return data.roadmaps.map((roadmap) => `
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

  function renderBoard() {
    const sections = selectedSections();
    if (!sections.length) return `<div class="mh-roadmap-admin-empty">Nicio etapă. Folosește formularul „Etapă” de mai jos.</div>`;

    return `
      <div class="mh-roadmap-admin-list">
        ${sections.map((section, sectionIndex) => {
          const nodes = sectionNodes(section.id);
          return `
            <article class="mh-roadmap-admin-section-card" data-roadmap-drop-section="${escapeHtml(section.id)}">
              <header>
                <div>
                  <strong>${escapeHtml(sectionTitle(section))}</strong>
                  <span>${escapeHtml(section.id)} • ${nodes.length} noduri</span>
                </div>
                <div class="mh-roadmap-admin-section-actions">
                  <button class="btn small" type="button" data-roadmap-section-move="up" data-roadmap-section-id="${escapeHtml(section.id)}" ${sectionIndex === 0 ? "disabled" : ""}>↑</button>
                  <button class="btn small" type="button" data-roadmap-section-move="down" data-roadmap-section-id="${escapeHtml(section.id)}" ${sectionIndex === sections.length - 1 ? "disabled" : ""}>↓</button>
                  <button class="btn small" type="button" data-roadmap-section-quick-add="${escapeHtml(section.id)}">＋ Conținut</button>
                  <button class="btn small" type="button" data-roadmap-edit-section="${escapeHtml(section.id)}">✏️</button>
                  <button class="btn small" type="button" data-roadmap-delete-section="${escapeHtml(section.id)}">🗑</button>
                </div>
              </header>
              <div class="mh-roadmap-admin-node-list">
                ${nodes.length ? nodes.map((node, nodeIndex) => `
                  <div class="mh-roadmap-admin-node-row" draggable="true" data-roadmap-drag-node="${escapeHtml(node.id)}">
                    <div>
                      <div class="mh-roadmap-admin-node-title-line">
                        <strong>${iconForType(node.node_type)} ${escapeHtml(nodeTitle(node, catalog()))}</strong>
                        <span class="mh-roadmap-admin-pill ${node.published !== false ? "is-live" : "is-draft"}">${node.published !== false ? "publicat" : "draft"}</span>
                        ${node.required !== false ? `<span class="mh-roadmap-admin-pill">obligatoriu</span>` : `<span class="mh-roadmap-admin-pill">opțional</span>`}
                      </div>
                      <span>${escapeHtml(node.node_type)} • ${escapeHtml(node.content_id || "milestone")} • prerechizite: ${escapeHtml(prerequisitesFor(node.id).length || 0)}</span>
                    </div>
                    <div class="mh-roadmap-admin-node-actions">
                      <button class="btn small" type="button" data-roadmap-node-move="up" data-roadmap-node-id="${escapeHtml(node.id)}" ${nodeIndex === 0 ? "disabled" : ""}>↑</button>
                      <button class="btn small" type="button" data-roadmap-node-move="down" data-roadmap-node-id="${escapeHtml(node.id)}" ${nodeIndex === nodes.length - 1 ? "disabled" : ""}>↓</button>
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
                `).join("") : `<div class="mh-roadmap-admin-empty">Trage aici un nod sau folosește „＋ Conținut”.</div>`}
              </div>
            </article>
          `;
        }).join("")}
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
            <h3>🧭 Roadmap Studio v2</h3>
            <p>Adaugi conținut din catalog, îl muți între etape și îl reordonezi fără ID-uri scrise manual.</p>
          </div>
          <div class="mh-roadmap-admin-head-actions">
            <button class="btn small" type="button" data-roadmap-admin-validate ${busy || !roadmap ? "disabled" : ""}>✓ Validează</button>
            <button class="btn small" type="button" data-roadmap-admin-refresh ${busy ? "disabled" : ""}>Refresh</button>
            <button class="btn small" type="button" data-roadmap-new-roadmap>＋ Roadmap</button>
          </div>
        </div>

        ${statusMessage ? `<div class="mh-roadmap-admin-status">${escapeHtml(statusMessage)}</div>` : ""}

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
              <label>Tip țintă<input name="target_type" value="${escapeHtml(roadmap?.target_type || "admission")}"></label>
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
        selectedRoadmapId = data.roadmaps[0]?.id || "";
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
      root.hidden = true;
      root.innerHTML = "";
      return;
    }
    render();
  }

  return { load, render, setAdmin };
}
