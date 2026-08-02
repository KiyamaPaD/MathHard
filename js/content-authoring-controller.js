import {
  contentTypeLabel,
  draftStatusLabel,
  evaluateContentDraft,
  localizedCheckText
} from "./content-authoring-model.js";
import { saveContentQualityReview } from "./content-quality-repository.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeMarkup(value) {
  const template = document.createElement("template");
  template.innerHTML = String(value || "");
  template.content.querySelectorAll("script,iframe,object,embed,link,meta,base,form").forEach((node) => node.remove());
  template.content.querySelectorAll("*").forEach((node) => {
    for (const attribute of [...node.attributes]) {
      const name = attribute.name.toLowerCase();
      const valueText = String(attribute.value || "").trim().toLowerCase();
      if (name.startsWith("on") || ((name === "href" || name === "src") && valueText.startsWith("javascript:"))) {
        node.removeAttribute(attribute.name);
      }
    }
  });
  return template.innerHTML;
}

function previewHtml(type, payload, locale) {
  const english = locale === "en";
  const title = english
    ? (payload?.title_en || payload?.title_ro || payload?.id || "Preview")
    : (payload?.title_ro || payload?.title_en || payload?.id || "Previzualizare");
  let body = "";

  if (["lesson", "research", "history"].includes(type)) {
    const learn = english ? (payload?.learn_en || payload?.learn_ro) : (payload?.learn_ro || payload?.learn_en);
    const why = english ? (payload?.why_en || payload?.why_ro) : (payload?.why_ro || payload?.why_en);
    const content = english ? (payload?.body_en || payload?.body_ro) : (payload?.body_ro || payload?.body_en);
    const examples = english ? (payload?.examples_en || payload?.examples_ro) : (payload?.examples_ro || payload?.examples_en);
    body = `
      ${learn ? `<section><h2>${english ? "What you learn" : "Ce înveți"}</h2><p>${escapeHtml(learn)}</p></section>` : ""}
      ${why ? `<section><h2>${english ? "Why it matters" : "De ce este util"}</h2><p>${escapeHtml(why)}</p></section>` : ""}
      <section>${sanitizeMarkup(content || `<p>${english ? "No content yet." : "Conținutul nu este completat."}</p>`)}</section>
      ${examples ? `<section><h2>${english ? "Examples" : "Exemple"}</h2>${sanitizeMarkup(examples)}</section>` : ""}
    `;
  } else if (type === "problem") {
    const statement = english ? (payload?.statement_en || payload?.statement_ro) : (payload?.statement_ro || payload?.statement_en);
    const solution = english ? (payload?.solution_en || payload?.solution_ro) : (payload?.solution_ro || payload?.solution_en);
    body = `
      <section><h2>${english ? "Statement" : "Enunț"}</h2>${sanitizeMarkup(statement || `<p>${english ? "No statement yet." : "Enunțul nu este completat."}</p>`)}</section>
      <section class="meta"><span>${english ? "Difficulty" : "Dificultate"}: <strong>${escapeHtml(payload?.difficulty ?? "—")}</strong></span><span>${english ? "Lesson" : "Lecție"}: <strong>${escapeHtml(payload?.lesson_id || "—")}</strong></span></section>
      ${solution ? `<section><h2>${english ? "Solution" : "Soluție"}</h2>${sanitizeMarkup(solution)}</section>` : ""}
    `;
  } else {
    const items = Array.isArray(payload?.items) ? payload.items : [];
    body = `
      <section class="meta"><span>${english ? "Year" : "An"}: <strong>${escapeHtml(payload?.year ?? "—")}</strong></span><span>${english ? "Duration" : "Durată"}: <strong>${escapeHtml(payload?.default_hours ?? "—")}h</strong></span></section>
      <section><h2>${english ? "Items" : "Itemi"} (${items.length})</h2>
        <ol>${items.map((item, index) => {
          const prompt = english ? (item.prompt_en || item.prompt_ro) : (item.prompt_ro || item.prompt_en);
          return `<li><strong>${escapeHtml(item.title_en || item.title_ro || `${english ? "Item" : "Item"} ${index + 1}`)}</strong><div>${sanitizeMarkup(prompt || "—")}</div><small>${escapeHtml(item.points ?? 0)} ${english ? "points" : "puncte"}</small></li>`;
        }).join("") || `<li>${english ? "No items yet." : "Nu există itemi încă."}</li>`}</ol>
      </section>
    `;
  }

  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: https:; font-src data:; connect-src 'none'; frame-src 'none'"><style>
    :root{color-scheme:light}*{box-sizing:border-box}body{margin:0;padding:28px;font:16px/1.65 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#172033;background:#f7f9fc}main{max-width:900px;margin:auto;background:#fff;border:1px solid #dce3ee;border-radius:18px;padding:28px;box-shadow:0 18px 45px rgba(25,38,67,.09)}h1{margin:0 0 24px;font-size:clamp(1.8rem,4vw,2.8rem);line-height:1.15}h2{margin:24px 0 8px;font-size:1.1rem}section+section{margin-top:22px}.meta{display:flex;gap:16px;flex-wrap:wrap;padding:12px 14px;border-radius:12px;background:#f2f5fa}img{max-width:100%;height:auto}table{width:100%;border-collapse:collapse}td,th{border:1px solid #dce3ee;padding:8px}code,pre{white-space:pre-wrap;overflow-wrap:anywhere}li+li{margin-top:16px}small{color:#64748b}</style></head><body><main><h1>${escapeHtml(title)}</h1>${body}</main></body></html>`;
}

function editorialContentType(type) {
  const normalized = String(type || "lesson").trim().toLowerCase();
  if (normalized === "problem" || normalized === "exam") return normalized;
  return "lesson";
}

function draftSourceUrls(type, payload) {
  const normalized = editorialContentType(type);
  if (normalized === "lesson") {
    return Array.isArray(payload?.sources)
      ? payload.sources.map((entry) => String(entry || "").trim()).filter(Boolean)
      : [];
  }
  const single = normalized === "problem" ? payload?.source : payload?.credit_html;
  return String(single || "").trim() ? [String(single).trim()] : [];
}

export function createContentAuthoringController({
  host,
  form,
  supabase = null,
  getLanguage = () => "ro",
  getType = () => "lesson",
  getPayload = () => ({}),
  getConceptIds = () => [],
  getExamErrors = () => []
} = {}) {
  if (!host) throw new Error("createContentAuthoringController requires a host element.");
  if (!form) throw new Error("createContentAuthoringController requires the editor form.");

  let currentResult = null;
  let refreshTimer = null;

  function language() {
    return String(getLanguage?.() || "ro").toLowerCase().startsWith("en") ? "en" : "ro";
  }

  function text(ro, en) {
    return language() === "en" ? en : ro;
  }

  function snapshot() {
    const type = String(getType?.() || "lesson").toLowerCase();
    const payload = {
      ...(getPayload?.(type) || {}),
      concept_ids: getConceptIds?.() || []
    };
    const examErrors = type === "exam" ? (getExamErrors?.(payload) || []) : [];
    return { type, payload, examErrors };
  }

  function checksHtml(checks) {
    return checks.map((check) => {
      const copy = localizedCheckText(check, language());
      return `<li class="${check.passed ? "is-pass" : "is-fail"}"><span aria-hidden="true">${check.passed ? "✓" : "×"}</span><div><strong>${escapeHtml(copy.label)}</strong>${copy.detail ? `<small>${escapeHtml(copy.detail)}</small>` : ""}</div></li>`;
    }).join("");
  }

  function render() {
    const { type, payload, examErrors } = snapshot();
    currentResult = evaluateContentDraft({ type, payload, examErrors });
    const status = draftStatusLabel(currentResult, language());
    const pending = currentResult.pendingRecommendations;

    host.innerHTML = `
      <div class="mh-authoring-head">
        <div>
          <span class="mh-authoring-eyebrow">${text("Flux editorial", "Editorial workflow")}</span>
          <h3>${text("Pregătirea draftului", "Draft readiness")}</h3>
          <p>${escapeHtml(contentTypeLabel(type, language()))} · ${text("salvarea păstrează materialul ca draft și nu îl publică", "saving keeps the content as a draft and does not publish it")}</p>
        </div>
        <span class="mh-authoring-status ${currentResult.readyForReview ? "is-ready" : ""}">${escapeHtml(status)}</span>
      </div>
      <div class="mh-authoring-score-row">
        <div class="mh-authoring-meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${currentResult.score}"><span style="width:${currentResult.score}%"></span></div>
        <strong>${currentResult.score}%</strong>
      </div>
      <div class="mh-authoring-summary">
        <span><strong>${currentResult.counts.passedRequired}/${currentResult.counts.required}</strong>${text("cerințe obligatorii", "required checks")}</span>
        <span><strong>${currentResult.counts.blockers}</strong>${text("blocaje", "blockers")}</span>
        <span><strong>${currentResult.counts.pendingRecommendations}</strong>${text("recomandări rămase", "recommendations left")}</span>
      </div>
      <div class="mh-authoring-grid">
        <section>
          <h4>${text("Obligatoriu pentru verificare", "Required for review")}</h4>
          <ul class="mh-authoring-checks">${checksHtml(currentResult.required)}</ul>
        </section>
        <section>
          <h4>${text("Recomandat pentru calitate", "Recommended for quality")}</h4>
          ${pending.length
            ? `<ul class="mh-authoring-checks is-recommendation">${checksHtml(currentResult.recommendations)}</ul>`
            : `<div class="mh-authoring-complete">✓ ${text("Toate recomandările sunt completate.", "All recommendations are complete.")}</div>`}
        </section>
      </div>
      <div class="mh-authoring-actions">
        <button class="btn small" type="button" data-authoring-preview="ro">${text("Previzualizare RO", "Romanian preview")}</button>
        <button class="btn small" type="button" data-authoring-preview="en">${text("Previzualizare EN", "English preview")}</button>
        <span>${currentResult.readyForReview
          ? text("După salvare, materialul poate fi trimis la verificare din secțiunea Publicare.", "After saving, the content can be sent for review from Publication.")
          : text("Completează blocajele înainte să trimiți materialul la verificare.", "Complete the blockers before sending the content for review.")}</span>
      </div>
      <div class="mh-authoring-modal" data-authoring-modal hidden>
        <div class="mh-authoring-modal-card" role="dialog" aria-modal="true" aria-labelledby="mhAuthoringPreviewTitle">
          <div class="mh-authoring-modal-head"><div><span>${text("Previzualizare draft", "Draft preview")}</span><strong id="mhAuthoringPreviewTitle"></strong></div><button class="btn small" type="button" data-authoring-close>${text("Închide", "Close")}</button></div>
          <iframe title="${text("Previzualizare conținut", "Content preview")}" sandbox=""></iframe>
        </div>
      </div>
    `;
  }

  function refresh() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(render, 30);
  }

  function closePreview() {
    const modal = host.querySelector("[data-authoring-modal]");
    if (modal) modal.hidden = true;
  }

  function openPreview(locale) {
    const { type, payload } = snapshot();
    const modal = host.querySelector("[data-authoring-modal]");
    const iframe = modal?.querySelector("iframe");
    const title = modal?.querySelector("#mhAuthoringPreviewTitle");
    if (!modal || !iframe || !title) return;
    title.textContent = `${contentTypeLabel(type, locale)} · ${locale.toUpperCase()}`;
    iframe.srcdoc = previewHtml(type, payload, locale);
    modal.hidden = false;
  }

  async function ensureEditorialDraft({ type = null, payload = null } = {}) {
    if (!supabase) throw new Error("Supabase is required to create the editorial draft record.");
    const snapshotType = String(type || getType?.() || "lesson").toLowerCase();
    const snapshotPayload = payload && typeof payload === "object"
      ? payload
      : (getPayload?.(snapshotType) || {});
    const contentId = String(snapshotPayload?.id || "").trim();
    if (!contentId) throw new Error("Content ID is required to create the editorial draft record.");

    return saveContentQualityReview(supabase, {
      contentType: editorialContentType(snapshotType),
      contentId,
      payload: {
        status: "draft",
        bilingual_checked: false,
        math_checked: false,
        source_checked: false,
        reviewer_notes: "",
        source_urls: draftSourceUrls(snapshotType, snapshotPayload)
      }
    });
  }

  const onInput = () => refresh();
  const onClick = (event) => {
    const previewButton = event.target.closest("[data-authoring-preview]");
    if (previewButton) {
      openPreview(previewButton.dataset.authoringPreview === "en" ? "en" : "ro");
      return;
    }
    if (event.target.closest("[data-authoring-close]") || event.target.matches("[data-authoring-modal]")) closePreview();
  };
  const onKeydown = (event) => {
    if (event.key === "Escape") closePreview();
  };

  form.addEventListener("input", onInput);
  form.addEventListener("change", onInput);
  host.addEventListener("click", onClick);
  document.addEventListener("keydown", onKeydown);
  render();

  return {
    refresh,
    render,
    ensureEditorialDraft,
    result: () => currentResult,
    destroy() {
      window.clearTimeout(refreshTimer);
      form.removeEventListener("input", onInput);
      form.removeEventListener("change", onInput);
      host.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeydown);
      host.innerHTML = "";
    }
  };
}
