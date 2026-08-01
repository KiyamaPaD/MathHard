export const COMMUNITY_FEEDBACK_CATEGORIES = Object.freeze([
  "suggestion", "bug", "content", "account", "other"
]);

export const COMMUNITY_REPORT_REASONS = Object.freeze([
  "impersonation", "inappropriate", "spam", "unsafe_link", "other"
]);

export const COMMUNITY_CASE_STATUSES = Object.freeze([
  "new", "in_review", "resolved", "closed"
]);

export const COMMUNITY_CASE_PRIORITIES = Object.freeze([
  "low", "normal", "high", "urgent"
]);

const text = (value, max = 1000) => String(value ?? "").trim().slice(0, max);
const allowed = (value, options, fallback) => options.includes(value) ? value : fallback;
const bool = (value, fallback = false) => typeof value === "boolean" ? value : fallback;

export function normalizeCommunityFeedbackDraft(value = {}) {
  return {
    category: allowed(value.category, COMMUNITY_FEEDBACK_CATEGORIES, "suggestion"),
    subject: text(value.subject, 120),
    message: text(value.message, 3000),
    pageUrl: text(value.page_url ?? value.pageUrl, 500),
    contentType: text(value.content_type ?? value.contentType, 40),
    contentId: text(value.content_id ?? value.contentId, 160),
    contactEmail: text(value.contact_email ?? value.contactEmail, 254),
    language: text(value.language, 2).toLowerCase() === "en" ? "en" : "ro",
    clientToken: text(value.client_token ?? value.clientToken, 80),
    honeypot: text(value.website, 200)
  };
}

export function validateCommunityFeedbackDraft(value = {}, locale = "ro") {
  const draft = normalizeCommunityFeedbackDraft(value);
  const en = locale === "en";
  const errors = [];
  if (draft.subject.length < 5) errors.push(en ? "Add a short subject." : "Adaugă un subiect scurt.");
  if (draft.message.length < 20) errors.push(en ? "Describe the issue in at least 20 characters." : "Descrie situația în minimum 20 de caractere.");
  if (draft.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contactEmail)) {
    errors.push(en ? "The contact email is invalid." : "Emailul de contact nu este valid.");
  }
  return { valid: errors.length === 0, errors, draft };
}

export function normalizeCommunityProfileReportDraft(value = {}) {
  return {
    username: text(value.username, 24).toLowerCase(),
    reason: allowed(value.reason, COMMUNITY_REPORT_REASONS, "other"),
    details: text(value.details, 1500)
  };
}

export function validateCommunityProfileReportDraft(value = {}, locale = "ro") {
  const draft = normalizeCommunityProfileReportDraft(value);
  const en = locale === "en";
  const errors = [];
  if (!draft.username) errors.push(en ? "The reported profile is missing." : "Profilul raportat lipsește.");
  if (draft.details.length < 10) errors.push(en ? "Add a short explanation." : "Adaugă o explicație scurtă.");
  return { valid: errors.length === 0, errors, draft };
}

function normalizeCase(item = {}, kind = "feedback") {
  return {
    id: text(item.id, 80),
    kind,
    category: text(item.category, 40),
    reason: text(item.reason, 40),
    subject: text(item.subject, 120),
    message: text(item.message ?? item.details, 3000),
    pageUrl: text(item.page_url ?? item.pageUrl, 500),
    contentType: text(item.content_type ?? item.contentType, 40),
    contentId: text(item.content_id ?? item.contentId, 160),
    contactEmail: text(item.contact_email ?? item.contactEmail, 254),
    reporterUserId: text(item.reporter_user_id ?? item.reporterUserId, 80),
    reporterLabel: text(item.reporter_label ?? item.reporterLabel, 160),
    reportedUserId: text(item.reported_user_id ?? item.reportedUserId, 80),
    reportedUsername: text(item.reported_username ?? item.reportedUsername, 24),
    reportedDisplayName: text(item.reported_display_name ?? item.reportedDisplayName, 80),
    status: allowed(item.status, COMMUNITY_CASE_STATUSES, "new"),
    priority: allowed(item.priority, COMMUNITY_CASE_PRIORITIES, "normal"),
    adminNote: text(item.admin_note ?? item.adminNote, 2000),
    createdAt: item.created_at ?? item.createdAt ?? "",
    updatedAt: item.updated_at ?? item.updatedAt ?? "",
    resolvedAt: item.resolved_at ?? item.resolvedAt ?? ""
  };
}

export function normalizeCommunityIntegrityUser(item = {}) {
  return {
    userId: text(item.user_id ?? item.userId, 80),
    username: text(item.username, 24),
    displayName: text(item.display_name ?? item.displayName ?? item.username, 80),
    email: text(item.email, 254),
    profilePublic: bool(item.is_public ?? item.profilePublic),
    leaderboardOptIn: bool(item.leaderboard_opt_in ?? item.leaderboardOptIn),
    profileAllowed: item.profile_allowed !== false && item.profileAllowed !== false,
    leaderboardAllowed: item.leaderboard_allowed !== false && item.leaderboardAllowed !== false,
    note: text(item.moderation_note ?? item.note, 1000),
    openReports: Math.max(0, Number(item.open_reports ?? item.openReports) || 0),
    updatedAt: item.control_updated_at ?? item.updatedAt ?? ""
  };
}

export function normalizeCommunityModerationDashboard(payload = {}) {
  return {
    counts: {
      feedbackNew: Math.max(0, Number(payload.counts?.feedback_new) || 0),
      reportsNew: Math.max(0, Number(payload.counts?.reports_new) || 0),
      restrictedUsers: Math.max(0, Number(payload.counts?.restricted_users) || 0)
    },
    feedback: Array.isArray(payload.feedback) ? payload.feedback.map((item) => normalizeCase(item, "feedback")) : [],
    reports: Array.isArray(payload.reports) ? payload.reports.map((item) => normalizeCase(item, "profile_report")) : [],
    users: Array.isArray(payload.users) ? payload.users.map(normalizeCommunityIntegrityUser) : []
  };
}
