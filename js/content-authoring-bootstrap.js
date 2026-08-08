import { createContentAuthoringController } from "./content-authoring-controller.js";
import { createContentTemplateController } from "./content-template-controller.js";
import { saveContentQualityReview } from "./content-quality-repository.js";

function editorialContentType(type) {
  const normalized = String(type || "lesson").trim().toLowerCase();
  return ["problem", "exam"].includes(normalized) ? normalized : "lesson";
}

function sourceUrls(type, payload) {
  const normalized = editorialContentType(type);
  if (normalized === "lesson") {
    return Array.isArray(payload?.sources)
      ? payload.sources.map((entry) => String(entry || "").trim()).filter(Boolean)
      : [];
  }
  const source = normalized === "problem" ? payload?.source : payload?.credit_html;
  return String(source || "").trim() ? [String(source).trim()] : [];
}

export function mountContentAuthoringPreflight({
  host,
  form,
  getLanguage = () => "ro",
  getType,
  getPayload,
  getConceptIds,
  getExamErrors
} = {}) {
  if (!host || !form) return null;
  try {
    const controller = createContentAuthoringController({
      host,
      form,
      getLanguage,
      getType,
      getPayload,
      getConceptIds,
      getExamErrors
    });
    host.dataset.authoringRuntime = "ready";
    return controller;
  } catch (error) {
    const language = String(getLanguage?.() || "ro").toLowerCase();
    host.dataset.authoringRuntime = "error";
    host.innerHTML = `<div class="mh-authoring-runtime-error"><strong>${language.startsWith("en") ? "Draft readiness could not load." : "Pregătirea draftului nu s-a putut încărca."}</strong><span>${String(error?.message || error)}</span></div>`;
    throw error;
  }
}


export function mountContentTemplates({
  host,
  form,
  getLanguage = () => "ro",
  getType = () => "lesson",
  onApplied = () => {}
} = {}) {
  if (!host || !form) return null;
  return createContentTemplateController({ host, form, getLanguage, getType, onApplied });
}

export async function saveEditorialDraft(supabase, { type, payload } = {}) {
  const contentId = String(payload?.id || "").trim();
  if (!contentId) throw new Error("Content ID is required to create the editorial draft record.");
  return saveContentQualityReview(supabase, {
    contentType: editorialContentType(type),
    contentId,
    payload: {
      status: "draft",
      bilingual_checked: false,
      math_checked: false,
      source_checked: false,
      reviewer_notes: "",
      source_urls: sourceUrls(type, payload)
    }
  });
}


export async function revealEditorialDraft({
  controller,
  studio,
  type,
  contentId,
  language = "ro",
  draftError = null
} = {}) {
  const english = String(language || "ro").toLowerCase().startsWith("en");
  if (draftError) {
    return {
      ok: false,
      message: `${english ? "The content was saved, but the Draft editorial state could not be persisted: " : "Conținutul a fost salvat, dar starea editorială Draft nu a putut fi persistată: "}${draftError?.message || draftError}`
    };
  }

  studio?.showPanel?.("quality");
  const message = english
    ? "Draft saved and opened as unpublished."
    : "Draft salvat și deschis ca nepublicat.";
  const selected = await controller?.selectContent?.(editorialContentType(type), contentId, {
    force: true,
    message
  });
  return selected
    ? { ok: true, message }
    : {
        ok: false,
        message: english
          ? "The content was saved, but it was not returned by the Publication catalogue. Refresh it and verify editorial migrations 050–052."
          : "Conținutul a fost salvat, dar nu a fost returnat de catalogul Publicare. Apasă Refresh și verifică migrațiile editoriale 050–052."
      };
}
