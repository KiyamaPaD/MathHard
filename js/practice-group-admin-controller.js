import { normalizePracticeGroups } from "./practice-group-model.js";

function esc(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function canonical(groups) {
  return normalizePracticeGroups(groups).map((group) => ({
    id: group.key,
    title_ro: group.ro,
    title_en: group.en,
    hint_ro: group.roHint,
    hint_en: group.enHint,
    problem_ids: [...group.problemIds]
  }));
}
function uniqueKey(groups, base = "group") {
  const used = new Set(groups.map((group) => group.key));
  let key = base, index = 2;
  while (used.has(key)) key = `${base}-${index++}`;
  return key;
}
function problemTitle(problem, lang) {
  return (lang === "en" ? problem?.title_en || problem?.title_ro : problem?.title_ro || problem?.title_en) || problem?.id || "Problem";
}

export function createPracticeGroupAdminController({ host, getLanguage = () => "ro", getProblems = () => [], getValue = () => "[]", setValue = () => {} } = {}) {
  if (!host) throw new Error("Practice group admin host is required.");
  let context = { type: "lesson", lessonId: "", exists: false };
  let groups = [];
  const lang = () => String(getLanguage() || "ro").startsWith("en") ? "en" : "ro";
  const lessonProblems = () => (getProblems() || []).filter((problem) => String(problem?.lessonId ?? problem?.lesson_id ?? "") === context.lessonId);

  function read() {
    try { groups = normalizePracticeGroups(JSON.parse(getValue() || "[]")); }
    catch { groups = []; }
  }
  function write({ render = false } = {}) {
    const payload = canonical(groups);
    setValue(payload);
    groups = normalizePracticeGroups(payload);
    if (render) renderUi();
  }
  function assignedIds() { return new Set(groups.flatMap((group) => group.problemIds)); }
  function ungrouped() {
    const assigned = assignedIds();
    return lessonProblems().filter((problem) => !assigned.has(problem.id));
  }
  function groupOptions() {
    return groups.map((group) => `<option value="${esc(group.key)}">${esc(lang() === "en" ? group.en : group.ro)}</option>`).join("");
  }
  function problemRow(problemId, group, index) {
    const problem = lessonProblems().find((entry) => entry.id === problemId);
    if (!problem) return "";
    return `<div class="mh-practice-admin-problem" data-practice-problem="${esc(problem.id)}">
      <div><strong>${esc(problemTitle(problem, lang()))}</strong><span>${esc(problem.id)} · ${Number(problem.difficulty || 0)}★</span></div>
      <div class="mh-practice-admin-row-actions">
        <button class="btn small" type="button" data-practice-problem-up="${esc(group.key)}" data-problem-index="${index}" ${index === 0 ? "disabled" : ""}>↑</button>
        <button class="btn small" type="button" data-practice-problem-down="${esc(group.key)}" data-problem-index="${index}" ${index === group.problemIds.length - 1 ? "disabled" : ""}>↓</button>
        <button class="btn small" type="button" data-practice-problem-remove="${esc(group.key)}" data-problem-id="${esc(problem.id)}">Scoate</button>
      </div>
    </div>`;
  }
  function groupCard(group, index) {
    return `<article class="mh-practice-admin-group" data-practice-group="${esc(group.key)}">
      <header class="mh-practice-admin-group-head">
        <div><strong>${esc(lang() === "en" ? group.en : group.ro)}</strong><span>${group.problemIds.length} ${group.problemIds.length === 1 ? "problemă" : "probleme"}</span></div>
        <div class="mh-practice-admin-row-actions">
          <button class="btn small" type="button" data-practice-group-up="${esc(group.key)}" ${index === 0 ? "disabled" : ""}>↑</button>
          <button class="btn small" type="button" data-practice-group-down="${esc(group.key)}" ${index === groups.length - 1 ? "disabled" : ""}>↓</button>
          <button class="btn small" type="button" data-practice-group-delete="${esc(group.key)}">Șterge grupul</button>
        </div>
      </header>
      <div class="mh-admin-form-grid mh-practice-admin-fields">
        <label><span>Titlu RO</span><input data-practice-group-field="ro" data-group-key="${esc(group.key)}" value="${esc(group.ro)}"></label>
        <label><span>Titlu EN</span><input data-practice-group-field="en" data-group-key="${esc(group.key)}" value="${esc(group.en)}"></label>
        <label><span>Subtitlu RO</span><input data-practice-group-field="roHint" data-group-key="${esc(group.key)}" value="${esc(group.roHint)}"></label>
        <label><span>Subtitlu EN</span><input data-practice-group-field="enHint" data-group-key="${esc(group.key)}" value="${esc(group.enHint)}"></label>
      </div>
      <div class="mh-practice-admin-problems">${group.problemIds.map((problemId, itemIndex) => problemRow(problemId, group, itemIndex)).join("") || `<div class="mh-admin-empty-state"><span>Grup gol. Adaugă probleme din lista de jos.</span></div>`}</div>
    </article>`;
  }
  function renderUi() {
    read();
    if (context.type !== "lesson") { host.innerHTML = ""; return; }
    if (!context.lessonId || !context.exists) {
      host.innerHTML = `<div class="mh-admin-empty-state"><strong>Salvează lecția mai întâi</strong><span>Grupurile de practică pot fi configurate după ce lecția are un ID salvat și probleme asociate.</span></div>`;
      return;
    }
    const problems = lessonProblems(), loose = ungrouped();
    host.innerHTML = `<section class="mh-practice-admin-card">
      <header class="mh-practice-admin-toolbar">
        <div><strong>Grupuri de practică</strong><span>Controlează secțiunile și ordinea problemelor din tab-ul lecției.</span></div>
        <div class="mh-practice-admin-row-actions">
          <button class="btn small" type="button" data-practice-generate ${groups.length ? "disabled" : ""}>Generează 3 grupuri</button>
          <button class="btn small" type="button" data-practice-add-group>Adaugă grup</button>
        </div>
      </header>
      ${problems.length ? "" : `<div class="mh-admin-empty-state"><strong>Nicio problemă asociată</strong><span>Adaugă probleme cu lesson_id = ${esc(context.lessonId)}.</span></div>`}
      <div class="mh-practice-admin-groups">${groups.map(groupCard).join("")}</div>
      <section class="mh-practice-admin-ungrouped">
        <header><strong>Probleme negrupate</strong><span>${loose.length}</span></header>
        ${loose.map((problem) => `<div class="mh-practice-admin-problem">
          <div><strong>${esc(problemTitle(problem, lang()))}</strong><span>${esc(problem.id)} · ${Number(problem.difficulty || 0)}★</span></div>
          <div class="mh-practice-admin-add"><select data-practice-target="${esc(problem.id)}" ${groups.length ? "" : "disabled"}>${groupOptions()}</select><button class="btn small" type="button" data-practice-problem-add="${esc(problem.id)}" ${groups.length ? "" : "disabled"}>Adaugă</button></div>
        </div>`).join("") || `<div class="legend">Toate problemele sunt grupate.</div>`}
      </section>
    </section>`;
  }
  function moveGroup(key, delta) {
    const index = groups.findIndex((group) => group.key === key), next = index + delta;
    if (index < 0 || next < 0 || next >= groups.length) return;
    [groups[index], groups[next]] = [groups[next], groups[index]]; write({ render: true });
  }
  function moveProblem(key, index, delta) {
    const group = groups.find((entry) => entry.key === key), next = index + delta;
    if (!group || index < 0 || next < 0 || next >= group.problemIds.length) return;
    [group.problemIds[index], group.problemIds[next]] = [group.problemIds[next], group.problemIds[index]]; write({ render: true });
  }

  host.addEventListener("input", (event) => {
    const input = event.target.closest?.("[data-practice-group-field]");
    if (!input) return;
    const group = groups.find((entry) => entry.key === input.dataset.groupKey);
    if (!group) return;
    group[input.dataset.practiceGroupField] = input.value; write();
  });
  host.addEventListener("click", (event) => {
    const button = event.target.closest?.("button"); if (!button) return;
    if (button.matches("[data-practice-add-group]")) {
      const key = uniqueKey(groups, "group"); groups.push({ key, ro: "Grup nou", en: "New group", roHint: "", enHint: "", problemIds: [] }); write({ render: true }); return;
    }
    if (button.matches("[data-practice-generate]")) {
      const scaffold = [], transfer = [], capstone = [];
      lessonProblems().forEach((problem) => (Number(problem.difficulty || 0) >= 4 ? capstone : Number(problem.difficulty || 0) >= 3 ? transfer : scaffold).push(problem.id));
      groups = [
        { key: "practice-scaffold", ro: "Practică / Scaffolding", en: "Practice / Scaffolding", roHint: "consolidare ghidată", enHint: "guided consolidation", problemIds: scaffold },
        { key: "mixed-transfer", ro: "BAC / Mixed transfer", en: "Exam / Mixed transfer", roHint: "alegerea metodei în contexte mixte", enHint: "method selection in mixed contexts", problemIds: transfer },
        { key: "capstone", ro: "Capstone", en: "Capstone", roHint: "integrare finală", enHint: "final integration", problemIds: capstone }
      ]; write({ render: true }); return;
    }
    const up = button.dataset.practiceGroupUp, down = button.dataset.practiceGroupDown, del = button.dataset.practiceGroupDelete;
    if (up) { moveGroup(up, -1); return; } if (down) { moveGroup(down, 1); return; }
    if (del) { groups = groups.filter((group) => group.key !== del); write({ render: true }); return; }
    if (button.dataset.practiceProblemUp) { moveProblem(button.dataset.practiceProblemUp, Number(button.dataset.problemIndex), -1); return; }
    if (button.dataset.practiceProblemDown) { moveProblem(button.dataset.practiceProblemDown, Number(button.dataset.problemIndex), 1); return; }
    if (button.dataset.practiceProblemRemove) {
      const group = groups.find((entry) => entry.key === button.dataset.practiceProblemRemove);
      if (group) group.problemIds = group.problemIds.filter((id) => id !== button.dataset.problemId);
      write({ render: true }); return;
    }
    if (button.dataset.practiceProblemAdd) {
      const id = button.dataset.practiceProblemAdd;
      const target = host.querySelector(`[data-practice-target="${CSS.escape(id)}"]`)?.value;
      const group = groups.find((entry) => entry.key === target);
      if (group && !group.problemIds.includes(id)) group.problemIds.push(id);
      write({ render: true });
    }
  });

  return {
    setContext(type, lessonId, exists = false) { context = { type, lessonId: String(lessonId || ""), exists: Boolean(exists) }; renderUi(); },
    refresh() { renderUi(); }
  };
}
