const text = (value, max = 1000) => String(value ?? "").trim().slice(0, max);
const bool = (value, fallback = false) => typeof value === "boolean" ? value : fallback;
const number = (value) => Math.max(0, Number(value) || 0);

export const COMMUNITY_ACCOUNT_KINDS = Object.freeze(["member", "test", "internal"]);
export const COMMUNITY_REVIEW_STATUSES = Object.freeze(["clear", "needs_review", "blocked"]);
export const COMMUNITY_FLAG_STATUSES = Object.freeze(["new", "in_review", "confirmed", "dismissed"]);
export const COMMUNITY_FLAG_SEVERITIES = Object.freeze(["low", "medium", "high", "critical"]);

function allowed(value, options, fallback) {
  return options.includes(value) ? value : fallback;
}

export function normalizeCommunityIntegrityFlag(item = {}) {
  return {
    id: text(item.id, 80),
    userId: text(item.user_id ?? item.userId, 80),
    username: text(item.username, 24),
    displayName: text(item.display_name ?? item.displayName ?? item.username, 80),
    type: text(item.flag_type ?? item.type, 80),
    severity: allowed(item.severity, COMMUNITY_FLAG_SEVERITIES, "medium"),
    status: allowed(item.status, COMMUNITY_FLAG_STATUSES, "new"),
    title: text(item.title, 160),
    evidence: item.evidence && typeof item.evidence === "object" ? item.evidence : {},
    autoExclude: bool(item.auto_exclude ?? item.autoExclude),
    firstDetectedAt: item.first_detected_at ?? item.firstDetectedAt ?? "",
    lastDetectedAt: item.last_detected_at ?? item.lastDetectedAt ?? "",
    adminNote: text(item.admin_note ?? item.adminNote, 2000)
  };
}

export function normalizeCommunityIntegrityUser(item = {}) {
  return {
    userId: text(item.user_id ?? item.userId, 80),
    username: text(item.username, 24),
    displayName: text(item.display_name ?? item.displayName ?? item.username, 80),
    email: text(item.email, 254),
    role: text(item.role || "member", 24),
    profilePublic: bool(item.is_public ?? item.profilePublic),
    leaderboardOptIn: bool(item.leaderboard_opt_in ?? item.leaderboardOptIn),
    profileAllowed: item.profile_allowed !== false && item.profileAllowed !== false,
    leaderboardAllowed: item.leaderboard_allowed !== false && item.leaderboardAllowed !== false,
    bioAllowed: item.bio_allowed !== false && item.bioAllowed !== false,
    linksAllowed: item.links_allowed !== false && item.linksAllowed !== false,
    integrityHold: bool(item.integrity_hold ?? item.integrityHold),
    accountKind: allowed(item.account_kind ?? item.accountKind, COMMUNITY_ACCOUNT_KINDS, "member"),
    allowInternalLeaderboard: bool(item.allow_internal_leaderboard ?? item.allowInternalLeaderboard),
    note: text(item.moderation_note ?? item.note, 1000),
    contentReviewStatus: allowed(item.content_review_status ?? item.contentReviewStatus, COMMUNITY_REVIEW_STATUSES, "clear"),
    contentReviewReason: text(item.content_review_reason ?? item.contentReviewReason, 1000),
    safetyFlags: Array.isArray(item.safety_flags ?? item.safetyFlags) ? item.safety_flags ?? item.safetyFlags : [],
    usernameChangedAt: item.username_changed_at ?? item.usernameChangedAt ?? "",
    openReports: number(item.open_reports ?? item.openReports),
    openFlags: number(item.open_flags ?? item.openFlags),
    highestSeverity: number(item.highest_severity ?? item.highestSeverity),
    updatedAt: item.updated_at ?? item.updatedAt ?? ""
  };
}

export function normalizeCommunityBlockedDomain(item = {}) {
  return {
    domain: text(item.domain, 253).toLowerCase(),
    reason: text(item.reason, 500),
    active: item.active !== false,
    updatedAt: item.updated_at ?? item.updatedAt ?? ""
  };
}

export function normalizeCommunityIntegrityDashboard(payload = {}) {
  return {
    counts: {
      openFlags: number(payload.counts?.open_flags),
      criticalFlags: number(payload.counts?.critical_flags),
      heldUsers: number(payload.counts?.held_users),
      internalUsers: number(payload.counts?.internal_users)
    },
    users: Array.isArray(payload.users) ? payload.users.map(normalizeCommunityIntegrityUser) : [],
    flags: Array.isArray(payload.flags) ? payload.flags.map(normalizeCommunityIntegrityFlag) : [],
    domains: Array.isArray(payload.domains) ? payload.domains.map(normalizeCommunityBlockedDomain) : []
  };
}

export function communityIntegrityUserDraft(value = {}) {
  const user = normalizeCommunityIntegrityUser(value);
  return {
    user_id: user.userId,
    account_kind: user.accountKind,
    profile_allowed: user.profileAllowed,
    leaderboard_allowed: user.leaderboardAllowed,
    bio_allowed: user.bioAllowed,
    links_allowed: user.linksAllowed,
    integrity_hold: user.integrityHold,
    allow_internal_leaderboard: user.allowInternalLeaderboard,
    content_review_status: user.contentReviewStatus,
    note: user.note
  };
}
