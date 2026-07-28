function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return String(value ?? "").trim();
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sortByPosition(items) {
  return [...asArray(items)].sort((left, right) => {
    const positionDiff = asNumber(left?.position) - asNumber(right?.position);
    if (positionDiff !== 0) return positionDiff;
    return asText(left?.id).localeCompare(asText(right?.id), "ro");
  });
}

export function normalizeRoadmapCatalog(payload) {
  const candidate = Array.isArray(payload) && payload.length === 1 ? payload[0] : payload;
  const source = candidate?.catalog && typeof candidate.catalog === "object"
    ? candidate.catalog
    : candidate;

  const roadmaps = sortByPosition(source?.roadmaps).map((roadmap) => ({
    id: asText(roadmap?.id),
    slug: asText(roadmap?.slug || roadmap?.id),
    icon: asText(roadmap?.icon || "🗺️"),
    title_ro: asText(roadmap?.title_ro),
    title_en: asText(roadmap?.title_en),
    description_ro: asText(roadmap?.description_ro),
    description_en: asText(roadmap?.description_en),
    target_type: asText(roadmap?.target_type || "custom"),
    published: roadmap?.published !== false,
    position: asNumber(roadmap?.position),
    sections: sortByPosition(roadmap?.sections).map((section) => ({
      id: asText(section?.id),
      roadmap_id: asText(section?.roadmap_id || roadmap?.id),
      section_key: asText(section?.section_key || section?.id),
      title_ro: asText(section?.title_ro),
      title_en: asText(section?.title_en),
      description_ro: asText(section?.description_ro),
      description_en: asText(section?.description_en),
      position: asNumber(section?.position)
    })),
    nodes: sortByPosition(roadmap?.nodes).map((node) => ({
      id: asText(node?.id),
      roadmap_id: asText(node?.roadmap_id || roadmap?.id),
      section_id: asText(node?.section_id),
      node_type: asText(node?.node_type || "lesson").toLowerCase(),
      content_id: asText(node?.content_id),
      title_ro: asText(node?.title_ro),
      title_en: asText(node?.title_en),
      description_ro: asText(node?.description_ro),
      description_en: asText(node?.description_en),
      estimated_minutes: Math.max(0, asNumber(node?.estimated_minutes)),
      required: node?.required !== false,
      published: node?.published !== false,
      position: asNumber(node?.position),
      content_exists: node?.content_exists !== false
    })),
    edges: asArray(roadmap?.edges).map((edge) => ({
      roadmap_id: asText(edge?.roadmap_id || roadmap?.id),
      prerequisite_node_id: asText(edge?.prerequisite_node_id),
      dependent_node_id: asText(edge?.dependent_node_id),
      edge_type: asText(edge?.edge_type || "required").toLowerCase()
    }))
  })).filter((roadmap) => roadmap.id);

  return {
    roadmaps,
    selectedRoadmapId: asText(source?.selected_roadmap_id),
    schemaVersion: asText(source?.schema_version || "phase-12")
  };
}

function contentLookup(catalog) {
  const safeCatalog = catalog || {};
  return {
    lesson: new Map(asArray(safeCatalog.lessons).map((item) => [asText(item?.id), item])),
    problem: new Map(asArray(safeCatalog.problems).map((item) => [asText(item?.id), item])),
    exam: new Map(asArray(safeCatalog.exams).map((item) => [asText(item?.id), item]))
  };
}

function isContentDone(node, progress) {
  if (node.node_type === "lesson") return progress.learnedSet?.has(node.content_id) || false;
  if (node.node_type === "problem") return progress.solvedSet?.has(node.content_id) || false;
  if (node.node_type === "exam") return progress.examsPassedSet?.has(node.content_id) || false;
  return false;
}

function isContentRead(node, progress) {
  return node.node_type === "lesson" && Boolean(
    progress.readSet?.has(node.content_id) || progress.learnedSet?.has(node.content_id)
  );
}

function translated(primary, fallback) {
  return asText(primary || fallback);
}

function attachContent(node, lookups, language) {
  const content = lookups[node.node_type]?.get(node.content_id) || null;
  const isRomanian = language !== "en";
  const contentTitle = content
    ? translated(
        isRomanian ? content.title_ro : content.title_en,
        isRomanian ? content.title_en : content.title_ro
      )
    : "";

  return {
    ...node,
    content,
    title: translated(
      isRomanian ? node.title_ro : node.title_en,
      translated(isRomanian ? node.title_en : node.title_ro, contentTitle || node.content_id || node.id)
    ),
    description: translated(
      isRomanian ? node.description_ro : node.description_en,
      isRomanian ? node.description_en : node.description_ro
    )
  };
}

function requiredPrerequisiteMap(roadmap) {
  const map = new Map();
  for (const node of roadmap.nodes) map.set(node.id, []);

  for (const edge of roadmap.edges) {
    if (edge.edge_type !== "required") continue;
    if (!map.has(edge.dependent_node_id)) map.set(edge.dependent_node_id, []);
    map.get(edge.dependent_node_id).push(edge.prerequisite_node_id);
  }
  return map;
}

function computeNodeStates(roadmap, progress, catalog, language) {
  const lookups = contentLookup(catalog);
  const prerequisiteMap = requiredPrerequisiteMap(roadmap);
  const nodes = roadmap.nodes.map((node) => attachContent(node, lookups, language));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const states = new Map();

  for (const node of nodes) {
    const exists = node.node_type === "milestone"
      ? true
      : Boolean(node.content_exists && node.content);

    states.set(node.id, {
      node,
      exists,
      done: exists && isContentDone(node, progress),
      read: exists && isContentRead(node, progress),
      status: exists ? "pending" : "planned",
      unmetPrerequisites: []
    });
  }

  // Milestones are derived from their required prerequisites. A few passes are
  // enough for nested milestones while the cycle guard keeps bad Admin data safe.
  const maxPasses = Math.max(1, nodes.length + 1);
  for (let pass = 0; pass < maxPasses; pass += 1) {
    let changed = false;
    for (const node of nodes) {
      if (node.node_type !== "milestone") continue;
      const prereqIds = prerequisiteMap.get(node.id) || [];
      const nextDone = prereqIds.length > 0 && prereqIds.every((id) => states.get(id)?.done);
      const current = states.get(node.id);
      if (current && current.done !== nextDone) {
        current.done = nextDone;
        changed = true;
      }
    }
    if (!changed) break;
  }

  for (const node of nodes) {
    const state = states.get(node.id);
    if (!state || state.status === "planned") continue;

    const prereqIds = prerequisiteMap.get(node.id) || [];
    const unmet = prereqIds.filter((id) => !states.get(id)?.done);
    state.unmetPrerequisites = unmet
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((item) => item.title);

    if (state.done) state.status = "done";
    else if (node.node_type === "milestone") state.status = "locked";
    else if (unmet.length > 0) state.status = "locked";
    else state.status = "available";
  }

  return { nodes, states, prerequisiteMap };
}

function progressStats(nodeStates) {
  const countable = [...nodeStates.values()].filter(({ node, exists }) => (
    node.required && node.node_type !== "milestone" && exists
  ));
  const done = countable.filter((state) => state.done).length;
  const total = countable.length;
  return {
    done,
    total,
    percent: total > 0 ? Math.round((done / total) * 100) : 0
  };
}

export function buildRoadmapView({
  roadmap,
  catalog,
  learnedSet = new Set(),
  readSet = new Set(),
  solvedSet = new Set(),
  examsPassedSet = new Set(),
  language = "ro"
}) {
  if (!roadmap) {
    return {
      roadmap: null,
      sections: [],
      nodeStates: new Map(),
      progress: { done: 0, total: 0, percent: 0 },
      nextNode: null
    };
  }

  const progress = { learnedSet, readSet, solvedSet, examsPassedSet };
  const { states } = computeNodeStates(roadmap, progress, catalog, language);
  const sections = roadmap.sections.map((section) => {
    const nodeStates = roadmap.nodes
      .filter((node) => node.section_id === section.id)
      .map((node) => states.get(node.id))
      .filter(Boolean);

    return {
      ...section,
      title: translated(
        language === "en" ? section.title_en : section.title_ro,
        language === "en" ? section.title_ro : section.title_en
      ),
      description: translated(
        language === "en" ? section.description_en : section.description_ro,
        language === "en" ? section.description_ro : section.description_en
      ),
      nodes: nodeStates,
      progress: progressStats(new Map(nodeStates.map((state) => [state.node.id, state])))
    };
  });

  const overall = progressStats(states);
  const orderedStates = sections.flatMap((section) => section.nodes);
  const nextNode = orderedStates.find((state) => (
    state.status === "available" && state.node.required
  )) || orderedStates.find((state) => state.status === "available") || null;

  return {
    roadmap,
    title: translated(
      language === "en" ? roadmap.title_en : roadmap.title_ro,
      language === "en" ? roadmap.title_ro : roadmap.title_en
    ),
    description: translated(
      language === "en" ? roadmap.description_en : roadmap.description_ro,
      language === "en" ? roadmap.description_ro : roadmap.description_en
    ),
    sections,
    nodeStates: states,
    progress: overall,
    nextNode
  };
}

export function getRoadmapStatusLabel(status, language = "ro") {
  const labels = language === "en"
    ? {
        done: "Completed",
        available: "Available now",
        locked: "Locked",
        planned: "Content coming soon"
      }
    : {
        done: "Finalizat",
        available: "Disponibil acum",
        locked: "Blocat",
        planned: "Conținut în pregătire"
      };
  return labels[status] || labels.locked;
}

export function getRoadmapNodeIcon(node) {
  if (node?.node_type === "lesson") return "📘";
  if (node?.node_type === "problem") return "🧩";
  if (node?.node_type === "exam") return "📑";
  return "🏁";
}
