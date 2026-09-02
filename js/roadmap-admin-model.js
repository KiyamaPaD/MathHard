function asText(value) {
  return String(value ?? "").trim();
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function compareText(left, right) {
  return asText(left).localeCompare(asText(right), "ro", { sensitivity: "base" });
}

export function slugifyRoadmapValue(value, fallback = "item") {
  const normalized = asText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return normalized || fallback;
}

export function createRoadmapNodeId({
  roadmapId,
  sectionId,
  nodeType,
  contentId,
  existingIds = []
}) {
  const base = [roadmapId, sectionId, nodeType, contentId]
    .map((value) => slugifyRoadmapValue(value, "node"))
    .filter(Boolean)
    .join("-")
    .slice(0, 180) || "roadmap-node";

  const used = new Set(existingIds.map((value) => asText(value)));
  if (!used.has(base)) return base;

  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function normalizeOrderedPositions(items, step = 10) {
  const safeStep = Math.max(1, asNumber(step, 10));
  return [...(Array.isArray(items) ? items : [])]
    .map((item, index) => ({
      ...item,
      position: index * safeStep
    }));
}

export function moveOrderedItem(items, itemId, direction) {
  const list = [...(Array.isArray(items) ? items : [])];
  const index = list.findIndex((item) => asText(item?.id) === asText(itemId));
  if (index < 0) return list;

  const targetIndex = direction === "up"
    ? index - 1
    : direction === "down"
      ? index + 1
      : Number(direction);

  if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= list.length || targetIndex === index) {
    return list;
  }

  const [item] = list.splice(index, 1);
  list.splice(targetIndex, 0, item);
  return list;
}

export function roadmapCategoryLabel(value) {
  const category = asText(value || "custom").toLowerCase();
  const known = {
    mathhard_m1: "MathHard M1",
    admission: "Admitere",
    bac: "BAC",
    olympiad: "Olimpiadă",
    school: "Școală",
    custom: "Custom"
  };
  if (known[category]) return known[category];
  return category
    .replace(/[_-]+/g, " ")
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("ro"));
}

export function roadmapCategories(roadmaps = []) {
  return [...new Set(
    (Array.isArray(roadmaps) ? roadmaps : [])
      .map((roadmap) => asText(roadmap?.target_type || "custom").toLowerCase())
      .filter(Boolean)
  )].sort((left, right) => compareText(roadmapCategoryLabel(left), roadmapCategoryLabel(right)));
}

export function filterAndSortRoadmaps(roadmaps = [], {
  query = "",
  category = "all",
  status = "all",
  sort = "position"
} = {}) {
  const normalizedQuery = asText(query).toLocaleLowerCase("ro");
  const normalizedCategory = asText(category || "all").toLowerCase();
  const normalizedStatus = asText(status || "all").toLowerCase();
  const normalizedSort = asText(sort || "position").toLowerCase();

  const rows = (Array.isArray(roadmaps) ? roadmaps : []).filter((roadmap) => {
    const itemCategory = asText(roadmap?.target_type || "custom").toLowerCase();
    if (normalizedCategory !== "all" && itemCategory !== normalizedCategory) return false;
    if (normalizedStatus === "published" && roadmap?.published === false) return false;
    if (normalizedStatus === "draft" && roadmap?.published !== false) return false;

    if (!normalizedQuery) return true;
    const haystack = [
      roadmap?.id,
      roadmap?.slug,
      roadmap?.title_ro,
      roadmap?.title_en,
      roadmap?.description_ro,
      roadmap?.description_en,
      itemCategory,
      roadmapCategoryLabel(itemCategory)
    ].map(asText).join(" ").toLocaleLowerCase("ro");
    return haystack.includes(normalizedQuery);
  });

  return rows.sort((left, right) => {
    if (normalizedSort === "title") {
      return compareText(left?.title_ro || left?.title_en || left?.id, right?.title_ro || right?.title_en || right?.id);
    }
    if (normalizedSort === "category") {
      return compareText(
        roadmapCategoryLabel(left?.target_type),
        roadmapCategoryLabel(right?.target_type)
      ) || compareText(left?.title_ro || left?.id, right?.title_ro || right?.id);
    }
    if (normalizedSort === "status") {
      const publishedDelta = Number(right?.published !== false) - Number(left?.published !== false);
      return publishedDelta || compareText(left?.title_ro || left?.id, right?.title_ro || right?.id);
    }
    return asNumber(left?.position) - asNumber(right?.position)
      || compareText(left?.id, right?.id);
  });
}

export function filterRoadmapContent(catalog, {
  type = "all",
  query = "",
  limit = 30
} = {}) {
  const safeCatalog = catalog || {};
  const normalizedQuery = asText(query).toLocaleLowerCase("ro");
  const collections = [
    ["lesson", safeCatalog.lessons || []],
    ["problem", safeCatalog.problems || []],
    ["exam", safeCatalog.exams || []]
  ];

  const rows = [];
  for (const [nodeType, items] of collections) {
    if (type !== "all" && type !== nodeType) continue;
    for (const item of items) {
      const titleRo = asText(item?.title_ro || item?.title_en || item?.id);
      const titleEn = asText(item?.title_en || item?.title_ro || item?.id);
      const haystack = [
        item?.id,
        titleRo,
        titleEn,
        item?.chapter,
        item?.grade,
        item?.lessonId,
        item?.lesson_id,
        item?.type,
        item?.year
      ].map(asText).join(" ").toLocaleLowerCase("ro");

      if (normalizedQuery && !haystack.includes(normalizedQuery)) continue;
      rows.push({
        nodeType,
        contentId: asText(item?.id),
        titleRo,
        titleEn,
        subtitle: [
          asText(item?.grade),
          asText(item?.chapter),
          asText(item?.type),
          item?.year ? String(item.year) : ""
        ].filter(Boolean).join(" • "),
        item
      });
    }
  }

  return rows
    .sort((left, right) => left.titleRo.localeCompare(right.titleRo, "ro"))
    .slice(0, Math.max(1, asNumber(limit, 30)));
}

export function nextPosition(items, step = 10) {
  const positions = (Array.isArray(items) ? items : [])
    .map((item) => asNumber(item?.position, 0));
  return positions.length ? Math.max(...positions) + Math.max(1, asNumber(step, 10)) : 0;
}
