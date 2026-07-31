const PUBLICATION_STATES = new Set(["published", "unpublished"]);
const PUBLICATION_MODES = new Set(["legacy", "verified"]);

function asBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function asInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : fallback;
}

function safeState(value, published = false) {
  const state = String(value || "").trim().toLowerCase();
  if (PUBLICATION_STATES.has(state)) return state;
  return published ? "published" : "unpublished";
}

function safeMode(value) {
  const mode = String(value || "verified").trim().toLowerCase();
  return PUBLICATION_MODES.has(mode) ? mode : "verified";
}

export function normalizePublication(value = {}, fallback = {}) {
  const published = asBoolean(value?.published ?? fallback?.published);
  return {
    state: safeState(value?.state ?? fallback?.publication_state, published),
    published,
    publication_mode: safeMode(value?.publication_mode ?? fallback?.publication_mode),
    publication_version: asInteger(value?.publication_version ?? fallback?.publication_version),
    verified_review_version: value?.verified_review_version == null
      ? null
      : asInteger(value.verified_review_version),
    reason: String(value?.reason || ""),
    published_by: value?.published_by || null,
    published_at: value?.published_at || fallback?.published_at || null,
    unpublished_at: value?.unpublished_at || null,
    updated_at: value?.updated_at || null
  };
}

export function publicationStateLabel(publication, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  if (publication?.published) {
    return publication?.publication_mode === "legacy"
      ? (english ? "Published · previous" : "Publicat · anterior")
      : (english ? "Published · verified" : "Publicat · verificat");
  }
  return english ? "Unpublished" : "Nepublicat";
}

export function publicationModeLabel(mode, language = "ro") {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  return safeMode(mode) === "legacy"
    ? (english ? "Published before review" : "Publicat înainte de review")
    : (english ? "Reviewed and published" : "Verificat și publicat");
}

export function normalizeEditorialPreview(value = {}) {
  return {
    content_type: String(value?.content_type || "").trim().toLowerCase(),
    content_id: String(value?.content_id || "").trim(),
    locale: String(value?.locale || "ro").toLowerCase().startsWith("en") ? "en" : "ro",
    content: value?.content && typeof value.content === "object" ? value.content : {},
    concepts: Array.isArray(value?.concepts) ? value.concepts : [],
    quality: value?.quality && typeof value.quality === "object" ? value.quality : {},
    student_visible: asBoolean(value?.student_visible),
    generated_at: value?.generated_at || null
  };
}

export function publicationBatchItems(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      content_type: String(item?.content_type || "").trim().toLowerCase(),
      content_id: String(item?.content_id || "").trim(),
      review_version: Math.max(1, asInteger(item?.review_version, 1))
    }))
    .filter((item) => item.content_type && item.content_id);
}
