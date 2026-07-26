import {
  deleteRoadmapEntity,
  loadRoadmapAdminData,
  replaceNodePrerequisites,
  saveRoadmap,
  saveRoadmapNode,
  saveRoadmapSection
} from "./roadmap-repository.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formValue(form, name) {
  return String(new FormData(form).get(name) ?? "").trim();
}

function formNumber(form, name, fallback = 0) {
  const value = Number(new FormData(form).get(name));
  return Number.isFinite(value) ? value : fallback;
}

function formChecked(form, name) {
  return Boolean(form.querySelector(`[name="${name}"]`)?.checked);
}

function commaList(value) {
  return [...new Set(String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean))];
}

export function createRoadmapAdminController({
  root,
  supabase,
  onChanged = async () => {}
}) {
  if (!root) throw new Error("createRoadmapAdminController requires a root element.");
  if (!supabase) throw new Error("createRoadmapAdminController requires Supabase.");

  let enabled = false;
  let data = { roadmaps: [], sections: [], nodes: [], edges: [] };
  let selectedRoadmapId = "";
  let statusMessage = "";
  let busy = false;

  function selectedRoadmap() {
    if (!selectedRoadmapId) return null;
    return data.roadmaps.find((item) => item.id === selectedRoadmapId) || null;
  }

  function sectionOptions() {
    return data.sections
      .filter((section) => section.roadmap_id === selectedRoadmapId)
      .map((section) => `<option value="${escapeHtml(section.id)}">${escapeHtml(section.title_ro || section.id)}</option>`)
      .join("");
  }

  function roadmapOptions() {
    return data.roadmaps
      .map((roadmap) => `<option value="${escapeHtml(roadmap.id)}" ${roadmap.id === selectedRoadmapId ? "selected" : ""}>${escapeHtml(roadmap.icon || "🗺️")} ${escapeHtml(roadmap.title_ro || roadmap.id)}</option>`)
      .join("");
  }

  function prerequisitesFor(nodeId) {
    return data.edges
      .filter((edge) => edge.dependent_node_id === nodeId && edge.edge_type === "required")
      .map((edge) => edge.prerequisite_node_id);
  }

  function renderLists() {
    const roadmap = selectedRoadmap();
    if (!roadmap) {
      return `<div class="legend">Niciun roadmap. Creează primul roadmap din formular.</div>`;
    }

    const sections = data.sections
      .filter((section) => section.roadmap_id === roadmap.id)
      .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));

    return sections.map((section) => {
      const nodes = data.nodes
        .filter((node) => node.section_id === section.id)
        .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));

      return `
        <article class="mh-roadmap-admin-section-card">
          <header>
            <div>
              <strong>${escapeHtml(section.title_ro || section.id)}</strong>
              <span>${escapeHtml(section.id)} • poziția ${Number(section.position || 0)}</span>
            </div>
            <div>
              <button class="btn small" type="button" data-roadmap-edit-section="${escapeHtml(section.id)}">✏️</button>
              <button class="btn small" type="button" data-roadmap-delete-section="${escapeHtml(section.id)}">🗑</button>
            </div>
          </header>
          <div class="mh-roadmap-admin-node-list">
            ${nodes.length ? nodes.map((node) => `
              <div class="mh-roadmap-admin-node-row">
                <div>
                  <strong>${escapeHtml(node.title_ro || node.content_id || node.id)}</strong>
                  <span>${escapeHtml(node.node_type)} • ${escapeHtml(node.content_id || "milestone")} • prerechizite: ${escapeHtml(prerequisitesFor(node.id).join(", ") || "—")}</span>
                </div>
                <div>
                  <button class="btn small" type="button" data-roadmap-edit-node="${escapeHtml(node.id)}">✏️</button>
                  <button class="btn small" type="button" data-roadmap-delete-node="${escapeHtml(node.id)}">🗑</button>
                </div>
              </div>
            `).join("") : `<div class="legend">Niciun nod în această etapă.</div>`}
          </div>
        </article>
      `;
    }).join("");
  }

  function render() {
    root.hidden = !enabled;
    if (!enabled) return;

    const roadmap = selectedRoadmap();
    root.innerHTML = `
      <div class="mh-roadmap-admin-head">
        <div>
          <h3>🧭 Roadmap Studio</h3>
          <p>Construiești grafuri curriculare fără să dublezi progresul lecțiilor și problemelor.</p>
        </div>
        <button class="btn small" type="button" data-roadmap-admin-refresh="1" ${busy ? "disabled" : ""}>🔄 Refresh</button>
      </div>

      ${statusMessage ? `<div class="mh-roadmap-admin-status">${escapeHtml(statusMessage)}</div>` : ""}

      <div class="mh-roadmap-admin-selector">
        <label>
          <span>Roadmap editat</span>
          <select class="select" data-roadmap-admin-select="1">
            ${roadmapOptions()}
          </select>
        </label>
        ${roadmap ? `<button class="btn small" type="button" data-roadmap-delete-roadmap="${escapeHtml(roadmap.id)}">🗑 Șterge roadmap</button>` : ""}
      </div>

      <details class="mh-roadmap-admin-form" open>
        <summary><strong>1. Roadmap</strong></summary>
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
          <div class="mh-roadmap-admin-actions">
            <button class="btn" type="submit" ${busy ? "disabled" : ""}>💾 Salvează roadmap</button>
            <button class="btn small" type="button" data-roadmap-new-roadmap="1">➕ Nou</button>
          </div>
        </form>
      </details>

      <details class="mh-roadmap-admin-form">
        <summary><strong>2. Etapă / secțiune</strong></summary>
        <form data-roadmap-form="section">
          <div class="mh-roadmap-admin-grid">
            <label>ID<input name="id" placeholder="ubb-algebra"></label>
            <label>Roadmap ID<input name="roadmap_id" value="${escapeHtml(selectedRoadmapId)}"></label>
            <label>Cheie secțiune<input name="section_key" placeholder="algebra"></label>
            <label>Poziție<input name="position" type="number" value="0"></label>
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

      <details class="mh-roadmap-admin-form">
        <summary><strong>3. Nod + prerechizite</strong></summary>
        <form data-roadmap-form="node">
          <div class="mh-roadmap-admin-grid">
            <label>ID<input name="id" placeholder="ubb-algebra-matrici"></label>
            <label>Roadmap ID<input name="roadmap_id" value="${escapeHtml(selectedRoadmapId)}"></label>
            <label>Etapă<select name="section_id" class="select">${sectionOptions()}</select></label>
            <label>Tip
              <select name="node_type" class="select">
                <option value="lesson">lesson</option>
                <option value="problem">problem</option>
                <option value="exam">exam</option>
                <option value="milestone">milestone</option>
              </select>
            </label>
            <label>Content ID<input name="content_id" placeholder="bac-alg"></label>
            <label>Minute<input name="estimated_minutes" type="number" min="0" value="20"></label>
            <label>Poziție<input name="position" type="number" value="0"></label>
          </div>
          <label>Titlu RO override<input name="title_ro"></label>
          <label>Titlu EN override<input name="title_en"></label>
          <label>Descriere RO<textarea name="description_ro" rows="2"></textarea></label>
          <label>Descriere EN<textarea name="description_en" rows="2"></textarea></label>
          <label>Prerechizite (ID-uri nod, virgulă)<input name="prerequisites" placeholder="ubb-core-equations, ubb-core-fractions"></label>
          <div class="mh-roadmap-admin-check-row">
            <label class="mh-roadmap-admin-check"><input name="required" type="checkbox" checked> Obligatoriu</label>
            <label class="mh-roadmap-admin-check"><input name="published" type="checkbox" checked> Publicat</label>
          </div>
          <div class="mh-roadmap-admin-actions">
            <button class="btn" type="submit" ${busy ? "disabled" : ""}>💾 Salvează nodul</button>
            <button class="btn small" type="reset">♻️ Reset</button>
          </div>
        </form>
      </details>

      <div class="mh-roadmap-admin-list">
        ${renderLists()}
      </div>
    `;

    bind();
  }

  function fillForm(formType, row) {
    const form = root.querySelector(`[data-roadmap-form="${formType}"]`);
    if (!form || !row) return;
    for (const [key, value] of Object.entries(row)) {
      const field = form.elements.namedItem(key);
      if (!field) continue;
      if (field.type === "checkbox") field.checked = Boolean(value);
      else field.value = value ?? "";
    }
    if (formType === "node") {
      form.elements.namedItem("prerequisites").value = prerequisitesFor(row.id).join(", ");
    }
    form.closest("details").open = true;
    form.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function runMutation(label, action) {
    busy = true;
    statusMessage = `${label}…`;
    render();
    try {
      await action();
      statusMessage = `${label}: gata.`;
      await load();
      await onChanged();
    } catch (error) {
      console.error(`${label} failed:`, error);
      statusMessage = `${label}: ${error?.message || error}`;
      busy = false;
      render();
    }
  }

  function bind() {
    root.querySelector("[data-roadmap-admin-refresh]")?.addEventListener("click", () => {
      void load().catch((error) => {
        statusMessage = error?.message || String(error);
        busy = false;
        render();
      });
    });

    root.querySelector("[data-roadmap-admin-select]")?.addEventListener("change", (event) => {
      selectedRoadmapId = String(event.target.value || "");
      render();
    });

    root.querySelector("[data-roadmap-new-roadmap]")?.addEventListener("click", () => {
      selectedRoadmapId = "";
      render();
    });

    root.querySelector('[data-roadmap-form="roadmap"]')?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      void runMutation("Salvare roadmap", async () => {
        const saved = await saveRoadmap(supabase, {
          id: formValue(form, "id"),
          slug: formValue(form, "slug"),
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
      void runMutation("Salvare etapă", () => saveRoadmapSection(supabase, {
        id: formValue(form, "id"),
        roadmap_id: formValue(form, "roadmap_id") || selectedRoadmapId,
        section_key: formValue(form, "section_key"),
        position: formNumber(form, "position"),
        title_ro: formValue(form, "title_ro"),
        title_en: formValue(form, "title_en"),
        description_ro: formValue(form, "description_ro"),
        description_en: formValue(form, "description_en")
      }));
    });

    root.querySelector('[data-roadmap-form="node"]')?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      void runMutation("Salvare nod", async () => {
        const saved = await saveRoadmapNode(supabase, {
          id: formValue(form, "id"),
          roadmap_id: formValue(form, "roadmap_id") || selectedRoadmapId,
          section_id: formValue(form, "section_id"),
          node_type: formValue(form, "node_type"),
          content_id: formValue(form, "content_id"),
          title_ro: formValue(form, "title_ro"),
          title_en: formValue(form, "title_en"),
          description_ro: formValue(form, "description_ro"),
          description_en: formValue(form, "description_en"),
          estimated_minutes: formNumber(form, "estimated_minutes"),
          position: formNumber(form, "position"),
          required: formChecked(form, "required"),
          published: formChecked(form, "published")
        });
        await replaceNodePrerequisites(supabase, {
          roadmapId: saved.roadmap_id,
          nodeId: saved.id,
          prerequisiteNodeIds: commaList(formValue(form, "prerequisites"))
        });
      });
    });

    for (const button of root.querySelectorAll("[data-roadmap-edit-section]")) {
      button.addEventListener("click", () => {
        fillForm("section", data.sections.find((item) => item.id === button.dataset.roadmapEditSection));
      });
    }
    for (const button of root.querySelectorAll("[data-roadmap-edit-node]")) {
      button.addEventListener("click", () => {
        fillForm("node", data.nodes.find((item) => item.id === button.dataset.roadmapEditNode));
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
      statusMessage = "";
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

  return {
    load,
    render,
    setAdmin
  };
}
