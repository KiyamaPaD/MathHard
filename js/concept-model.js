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

function asBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  return fallback;
}

function uniqueTextValues(values) {
  return [...new Set(asArray(values).map(asText).filter(Boolean))];
}

function safeConceptType(value) {
  const type = asText(value).toLowerCase();
  return new Set(["concept", "skill", "theorem", "method"]).has(type)
    ? type
    : "concept";
}

function safeRelationType(value) {
  const type = asText(value).toLowerCase();
  return new Set(["primary", "supporting", "prerequisite", "assessed"]).has(type)
    ? type
    : "supporting";
}

function safeEdgeType(value) {
  const type = asText(value).toLowerCase();
  return new Set(["required", "recommended", "related"]).has(type)
    ? type
    : "required";
}

export function normalizeConceptCatalog(payload) {
  const candidate = Array.isArray(payload) && payload.length === 1 ? payload[0] : payload;
  const source = candidate?.catalog && typeof candidate.catalog === "object"
    ? candidate.catalog
    : candidate;

  const concepts = asArray(source?.concepts)
    .map((concept) => ({
      id: asText(concept?.id),
      slug: asText(concept?.slug || concept?.id),
      concept_type: safeConceptType(concept?.concept_type),
      domain: asText(concept?.domain),
      title_ro: asText(concept?.title_ro),
      title_en: asText(concept?.title_en),
      summary_ro: asText(concept?.summary_ro),
      summary_en: asText(concept?.summary_en),
      details_ro: asText(concept?.details_ro),
      details_en: asText(concept?.details_en),
      notation: asText(concept?.notation),
      tags: uniqueTextValues(concept?.tags),
      published: asBoolean(concept?.published, true),
      position: asNumber(concept?.position),
      created_at: concept?.created_at || null,
      updated_at: concept?.updated_at || null
    }))
    .filter((concept) => concept.id)
    .sort((left, right) => {
      const positionDiff = left.position - right.position;
      if (positionDiff !== 0) return positionDiff;
      return (left.title_ro || left.title_en || left.id)
        .localeCompare(right.title_ro || right.title_en || right.id, "ro");
    });

  const conceptIds = new Set(concepts.map((concept) => concept.id));

  const edges = asArray(source?.edges)
    .map((edge) => ({
      prerequisite_concept_id: asText(edge?.prerequisite_concept_id),
      dependent_concept_id: asText(edge?.dependent_concept_id),
      edge_type: safeEdgeType(edge?.edge_type)
    }))
    .filter((edge) => (
      conceptIds.has(edge.prerequisite_concept_id)
      && conceptIds.has(edge.dependent_concept_id)
      && edge.prerequisite_concept_id !== edge.dependent_concept_id
    ));

  const mappings = asArray(source?.mappings)
    .map((mapping) => ({
      concept_id: asText(mapping?.concept_id),
      content_type: asText(mapping?.content_type).toLowerCase(),
      content_id: asText(mapping?.content_id),
      relation_type: safeRelationType(mapping?.relation_type),
      position: asNumber(mapping?.position)
    }))
    .filter((mapping) => (
      conceptIds.has(mapping.concept_id)
      && new Set(["lesson", "problem", "exam"]).has(mapping.content_type)
      && mapping.content_id
    ))
    .sort((left, right) => left.position - right.position);

  return {
    concepts,
    edges,
    mappings,
    schemaVersion: asText(source?.schema_version || "concept-layer-v1")
  };
}

export function conceptLabel(concept, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  return asText(
    english
      ? (concept?.title_en || concept?.title_ro || concept?.id)
      : (concept?.title_ro || concept?.title_en || concept?.id)
  );
}

export function conceptSummary(concept, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  return asText(
    english
      ? (concept?.summary_en || concept?.summary_ro)
      : (concept?.summary_ro || concept?.summary_en)
  );
}

export function conceptDetails(concept, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  return asText(
    english
      ? (concept?.details_en || concept?.details_ro)
      : (concept?.details_ro || concept?.details_en)
  );
}

export function buildConceptIndex(catalog) {
  const normalized = normalizeConceptCatalog(catalog);
  const byId = new Map(normalized.concepts.map((concept) => [concept.id, concept]));
  const mappingsByContent = new Map();
  const prerequisitesByConcept = new Map();
  const dependentsByConcept = new Map();

  for (const mapping of normalized.mappings) {
    const key = `${mapping.content_type}:${mapping.content_id}`;
    if (!mappingsByContent.has(key)) mappingsByContent.set(key, []);
    mappingsByContent.get(key).push(mapping);
  }

  for (const edge of normalized.edges) {
    if (!prerequisitesByConcept.has(edge.dependent_concept_id)) {
      prerequisitesByConcept.set(edge.dependent_concept_id, []);
    }
    prerequisitesByConcept.get(edge.dependent_concept_id).push(edge);

    if (!dependentsByConcept.has(edge.prerequisite_concept_id)) {
      dependentsByConcept.set(edge.prerequisite_concept_id, []);
    }
    dependentsByConcept.get(edge.prerequisite_concept_id).push(edge);
  }

  return {
    ...normalized,
    byId,
    mappingsByContent,
    prerequisitesByConcept,
    dependentsByConcept
  };
}

export function conceptIdsForContent(catalog, contentType, contentId) {
  const index = catalog?.byId instanceof Map ? catalog : buildConceptIndex(catalog);
  const key = `${asText(contentType).toLowerCase()}:${asText(contentId)}`;
  return asArray(index.mappingsByContent.get(key))
    .sort((left, right) => left.position - right.position)
    .map((mapping) => mapping.concept_id);
}

export function conceptsForContent(catalog, contentType, contentId) {
  const index = catalog?.byId instanceof Map ? catalog : buildConceptIndex(catalog);
  return conceptIdsForContent(index, contentType, contentId)
    .map((id) => index.byId.get(id))
    .filter(Boolean);
}

export function prerequisitesForConcept(catalog, conceptId) {
  const index = catalog?.byId instanceof Map ? catalog : buildConceptIndex(catalog);
  return asArray(index.prerequisitesByConcept.get(asText(conceptId)))
    .map((edge) => ({
      ...edge,
      concept: index.byId.get(edge.prerequisite_concept_id) || null
    }))
    .filter((entry) => entry.concept);
}

export function filterConcepts(concepts, query = "") {
  const search = asText(query).toLocaleLowerCase("ro");
  if (!search) return asArray(concepts);

  return asArray(concepts).filter((concept) => [
    concept?.id,
    concept?.slug,
    concept?.concept_type,
    concept?.domain,
    concept?.title_ro,
    concept?.title_en,
    concept?.summary_ro,
    concept?.summary_en,
    concept?.notation,
    ...asArray(concept?.tags)
  ].filter(Boolean).join(" ").toLocaleLowerCase("ro").includes(search));
}

export function conceptTypeLabel(type, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  const labels = {
    concept: { ro: "Concept", en: "Concept" },
    skill: { ro: "Competență", en: "Skill" },
    theorem: { ro: "Teoremă", en: "Theorem" },
    method: { ro: "Metodă", en: "Method" }
  };
  const item = labels[safeConceptType(type)];
  return english ? item.en : item.ro;
}

export function renderContentConceptDetails({
  catalog,
  contentType,
  contentId,
  language = "ro",
  escapeHtml = (value) => String(value ?? "")
} = {}) {
  const index = catalog?.byId instanceof Map ? catalog : buildConceptIndex(catalog);
  const concepts = conceptsForContent(index, contentType, contentId);
  if (!concepts.length) return "";

  const english = String(language || "ro").toLowerCase().startsWith("en");
  const title = english ? "Concept details" : "Detalii concepte";
  const mappedLabel = english
    ? `${concepts.length} mapped`
    : `${concepts.length} asociate`;

  return `
    <details class="mh-concept-disclosure">
      <summary>
        <span>🧠 ${escapeHtml(title)}</span>
        <small>${escapeHtml(mappedLabel)}</small>
      </summary>
      <div class="mh-concept-detail-list">
        ${concepts.map((concept) => {
          const summary = conceptSummary(concept, language);
          const details = conceptDetails(concept, language);
          const prerequisites = prerequisitesForConcept(index, concept.id);
          return `
            <article class="mh-concept-detail-card">
              <div class="mh-concept-detail-head">
                <div>
                  <span class="mh-concept-type">${escapeHtml(conceptTypeLabel(concept.concept_type, language))}</span>
                  <strong>${escapeHtml(conceptLabel(concept, language))}</strong>
                </div>
                ${concept.notation ? `<code>${escapeHtml(concept.notation)}</code>` : ""}
              </div>
              ${summary ? `<p>${escapeHtml(summary)}</p>` : ""}
              ${details ? `<div class="mh-concept-detail-text">${escapeHtml(details).replaceAll("\n", "<br>")}</div>` : ""}
              ${prerequisites.length ? `
                <div class="mh-concept-prerequisites">
                  <span>${english ? "Prerequisites" : "Prerechizite"}</span>
                  ${prerequisites.map(({ concept: prerequisite }) => (
                    `<b>${escapeHtml(conceptLabel(prerequisite, language))}</b>`
                  )).join("")}
                </div>
              ` : ""}
            </article>
          `;
        }).join("")}
      </div>
    </details>
  `;
}
