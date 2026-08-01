import { normalizeBadge } from "./community-profile-model.js";
import { normalizeCommunityModerationDashboard } from "./community-feedback-model.js";

const BADGE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,79}$/;
const MODES = new Set(["manual", "automatic", "subscription", "system"]);
const RARITIES = new Set(["common", "uncommon", "rare", "epic", "legendary"]);
const CATEGORIES = new Set(["community", "education", "support", "staff", "subscription", "partner"]);

function text(value, max = 300) {
  return String(value ?? "").trim().slice(0, max);
}

export function normalizeCommunityBadgeDraft(value = {}) {
  return {
    id: text(value.id, 80).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    title_ro: text(value.title_ro, 120),
    title_en: text(value.title_en, 120),
    description_ro: text(value.description_ro, 300),
    description_en: text(value.description_en, 300),
    icon: text(value.icon || "◆", 16),
    category: CATEGORIES.has(value.category) ? value.category : "community",
    rarity: RARITIES.has(value.rarity) ? value.rarity : "common",
    assignment_mode: MODES.has(value.assignment_mode) ? value.assignment_mode : "manual",
    color: text(value.color || "sky", 24),
    sort_order: Number.isFinite(Number(value.sort_order)) ? Number(value.sort_order) : 0,
    active: value.active !== false
  };
}

export function validateCommunityBadgeDraft(value = {}) {
  const badge = normalizeCommunityBadgeDraft(value);
  const errors = [];
  if (!BADGE_ID_PATTERN.test(badge.id)) errors.push("ID-ul trebuie să folosească litere mici, cifre și minus.");
  if (!badge.title_ro || !badge.title_en) errors.push("Titlurile RO și EN sunt obligatorii.");
  if (!badge.description_ro || !badge.description_en) errors.push("Descrierile RO și EN sunt obligatorii.");
  return { valid: errors.length === 0, errors, badge };
}

export function normalizeCommunityBadgeStudio(payload = {}) {
  return {
    badges: Array.isArray(payload.badges) ? payload.badges.map(normalizeBadge) : [],
    users: Array.isArray(payload.users) ? payload.users.map((user) => ({
      userId: String(user.user_id || ""),
      username: String(user.username || ""),
      displayName: String(user.display_name || user.username || "Utilizator"),
      email: String(user.email || ""),
      isPublic: Boolean(user.is_public),
      badges: Array.isArray(user.badges) ? user.badges.map(normalizeBadge) : []
    })) : []
  };
}

export { normalizeCommunityModerationDashboard };
