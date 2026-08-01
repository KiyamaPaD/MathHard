import { supabase } from "./supabase-client.js";
import {
  COMMUNITY_FEEDBACK_CATEGORIES,
  COMMUNITY_REPORT_REASONS,
  validateCommunityFeedbackDraft,
  validateCommunityProfileReportDraft
} from "./community-feedback-model.js";
import {
  submitCommunityFeedback,
  submitCommunityProfileReport
} from "./community-feedback-repository.js";

const STORAGE_KEY = "mh_community_feedback_client_v1";
const CATEGORY_COPY = {
  ro: { suggestion: "Sugestie", bug: "Problemă tehnică", content: "Conținut", account: "Cont", other: "Altceva" },
  en: { suggestion: "Suggestion", bug: "Technical issue", content: "Content", account: "Account", other: "Other" }
};
const REASON_COPY = {
  ro: { impersonation: "Identitate falsă", inappropriate: "Conținut nepotrivit", spam: "Spam", unsafe_link: "Link nesigur", other: "Alt motiv" },
  en: { impersonation: "Impersonation", inappropriate: "Inappropriate content", spam: "Spam", unsafe_link: "Unsafe link", other: "Other" }
};
const COPY = {
  ro: {
    feedbackTitle: "Trimite feedback",
    feedbackIntro: "Spune-ne ce ar trebui îmbunătățit.",
    reportTitle: "Raportează profilul",
    reportIntro: "Raportarea ajunge doar la administratori.",
    category: "Categorie",
    subject: "Subiect",
    subjectPlaceholder: "Pe scurt",
    message: "Detalii",
    messagePlaceholder: "Descrie ce ai observat și ce te-ai așteptat să se întâmple.",
    email: "Email de contact (opțional)",
    reason: "Motiv",
    details: "Explicație",
    detailsPlaceholder: "Descrie clar problema.",
    cancel: "Renunță",
    send: "Trimite",
    sending: "Se trimite…",
    sent: "Mulțumim. Feedbackul a fost trimis.",
    reported: "Raportarea a fost trimisă.",
    error: "Nu s-a putut trimite. Încearcă din nou.",
    auth: "Autentifică-te pentru a raporta un profil.",
    authTitle: "Autentificare necesară",
    authIntro: "Raportările de profil sunt disponibile utilizatorilor autentificați.",
    authAction: "Mergi la autentificare"
  },
  en: {
    feedbackTitle: "Send feedback",
    feedbackIntro: "Tell us what should be improved.",
    reportTitle: "Report profile",
    reportIntro: "The report is visible only to administrators.",
    category: "Category",
    subject: "Subject",
    subjectPlaceholder: "In a few words",
    message: "Details",
    messagePlaceholder: "Describe what you noticed and what you expected to happen.",
    email: "Contact email (optional)",
    reason: "Reason",
    details: "Explanation",
    detailsPlaceholder: "Describe the issue clearly.",
    cancel: "Cancel",
    send: "Send",
    sending: "Sending…",
    sent: "Thank you. Your feedback was sent.",
    reported: "The report was sent.",
    error: "Unable to send. Try again.",
    auth: "Sign in to report a profile.",
    authTitle: "Sign in required",
    authIntro: "Profile reports are available to signed-in users.",
    authAction: "Go to sign in"
  }
};

let modal = null;
let activeTrigger = null;
let mode = "feedback";

function language() {
  return document.documentElement.lang?.toLowerCase().startsWith("en") ? "en" : "ro";
}

function copy() {
  return COPY[language()];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clientToken() {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const token = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(STORAGE_KEY, token);
    return token;
  } catch {
    return "";
  }
}

function ensureModal() {
  if (modal) return modal;
  modal = document.createElement("div");
  modal.className = "mh-community-feedback-modal";
  modal.id = "mhCommunityFeedbackModal";
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "mhCommunityFeedbackTitle");
  modal.innerHTML = `<div class="mh-community-feedback-backdrop" data-community-feedback-close></div><section class="mh-community-feedback-dialog" tabindex="-1"><header><div><h2 id="mhCommunityFeedbackTitle"></h2><p id="mhCommunityFeedbackIntro"></p></div><button type="button" class="mh-community-feedback-close" data-community-feedback-close aria-label="Închide">×</button></header><div id="mhCommunityFeedbackBody"></div><p class="mh-community-feedback-status" id="mhCommunityFeedbackStatus" role="status"></p></section>`;
  document.body.append(modal);
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-community-feedback-close]")) closeModal();
  });
  modal.addEventListener("submit", (event) => void handleSubmit(event));
  return modal;
}

function optionMarkup(values, labels) {
  return values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(labels[value])}</option>`).join("");
}

function feedbackForm() {
  const c = copy();
  return `<form id="mhCommunityFeedbackForm" class="mh-community-feedback-form"><label><span>${escapeHtml(c.category)}</span><select name="category">${optionMarkup(COMMUNITY_FEEDBACK_CATEGORIES, CATEGORY_COPY[language()])}</select></label><label><span>${escapeHtml(c.subject)}</span><input name="subject" maxlength="120" required placeholder="${escapeHtml(c.subjectPlaceholder)}"></label><label><span>${escapeHtml(c.message)}</span><textarea name="message" maxlength="3000" required placeholder="${escapeHtml(c.messagePlaceholder)}"></textarea></label><label><span>${escapeHtml(c.email)}</span><input name="contact_email" type="email" maxlength="254" autocomplete="email"></label><label class="mh-community-feedback-honeypot" aria-hidden="true"><span>Website</span><input name="website" tabindex="-1" autocomplete="off"></label><div class="mh-community-feedback-actions"><button type="button" class="btn small" data-community-feedback-close>${escapeHtml(c.cancel)}</button><button type="submit" class="btn">${escapeHtml(c.send)}</button></div></form>`;
}

function reportForm(username) {
  const c = copy();
  return `<form id="mhCommunityReportForm" class="mh-community-feedback-form"><input type="hidden" name="username" value="${escapeHtml(username)}"><label><span>${escapeHtml(c.reason)}</span><select name="reason">${optionMarkup(COMMUNITY_REPORT_REASONS, REASON_COPY[language()])}</select></label><label><span>${escapeHtml(c.details)}</span><textarea name="details" maxlength="1500" required placeholder="${escapeHtml(c.detailsPlaceholder)}"></textarea></label><div class="mh-community-feedback-actions"><button type="button" class="btn small" data-community-feedback-close>${escapeHtml(c.cancel)}</button><button type="submit" class="btn">${escapeHtml(c.send)}</button></div></form>`;
}

function authenticationPrompt() {
  const c = copy();
  return `<div class="mh-community-feedback-auth"><p>${escapeHtml(c.auth)}</p><a class="btn" href="/profile.html">${escapeHtml(c.authAction)}</a></div>`;
}

async function openModal(trigger) {
  const root = ensureModal();
  activeTrigger = trigger;
  mode = trigger.dataset.communityFeedbackOpen === "profile-report" ? "profile-report" : "feedback";
  const username = trigger.dataset.communityReportUsername || new URLSearchParams(location.search).get("u") || "";
  const c = copy();
  let authenticated = true;
  if (mode === "profile-report") {
    try {
      const { data } = await supabase.auth.getSession();
      authenticated = Boolean(data?.session?.user);
    } catch {
      authenticated = false;
    }
  }
  root.querySelector("#mhCommunityFeedbackTitle").textContent = mode === "profile-report" && !authenticated ? c.authTitle : mode === "profile-report" ? c.reportTitle : c.feedbackTitle;
  root.querySelector("#mhCommunityFeedbackIntro").textContent = mode === "profile-report" && !authenticated ? c.authIntro : mode === "profile-report" ? c.reportIntro : c.feedbackIntro;
  root.querySelector("#mhCommunityFeedbackBody").innerHTML = mode === "profile-report" ? (authenticated ? reportForm(username) : authenticationPrompt()) : feedbackForm();
  root.querySelector("#mhCommunityFeedbackStatus").textContent = "";
  root.hidden = false;
  document.documentElement.classList.add("mh-community-modal-open");
  requestAnimationFrame(() => root.querySelector("input:not([type=hidden]), select, textarea")?.focus());
}

function closeModal() {
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  document.documentElement.classList.remove("mh-community-modal-open");
  activeTrigger?.focus?.();
  activeTrigger = null;
}

function setBusy(form, busy) {
  form.querySelectorAll("button,input,select,textarea").forEach((element) => { element.disabled = busy; });
  const submit = form.querySelector('button[type="submit"]');
  if (submit) submit.textContent = busy ? copy().sending : copy().send;
}

async function handleSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  const status = modal.querySelector("#mhCommunityFeedbackStatus");
  const values = Object.fromEntries(new FormData(form).entries());
  status.dataset.state = "";

  if (form.id === "mhCommunityFeedbackForm") {
    const validation = validateCommunityFeedbackDraft({
      ...values,
      page_url: location.href,
      language: language(),
      client_token: clientToken()
    }, language());
    if (!validation.valid) {
      status.textContent = validation.errors[0];
      status.dataset.state = "error";
      return;
    }
    setBusy(form, true);
    try {
      await submitCommunityFeedback(supabase, validation.draft);
      status.textContent = copy().sent;
      status.dataset.state = "success";
      form.reset();
      window.setTimeout(closeModal, 1100);
    } catch (error) {
      console.error("Community feedback submit failed:", error);
      status.textContent = copy().error;
      status.dataset.state = "error";
    } finally {
      setBusy(form, false);
    }
    return;
  }

  const validation = validateCommunityProfileReportDraft(values, language());
  if (!validation.valid) {
    status.textContent = validation.errors[0];
    status.dataset.state = "error";
    return;
  }
  setBusy(form, true);
  try {
    await submitCommunityProfileReport(supabase, validation.draft);
    status.textContent = copy().reported;
    status.dataset.state = "success";
    form.reset();
    window.setTimeout(closeModal, 1100);
  } catch (error) {
    console.error("Community profile report failed:", error);
    const message = String(error?.message || "").toLowerCase();
    status.textContent = message.includes("authentication") || message.includes("jwt") ? copy().auth : copy().error;
    status.dataset.state = "error";
  } finally {
    setBusy(form, false);
  }
}

function init() {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-community-feedback-open]");
    if (trigger) void openModal(trigger);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal && !modal.hidden) closeModal();
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
else init();
