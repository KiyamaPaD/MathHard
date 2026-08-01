export const COMMUNITY_PROFILE_LIMITS = Object.freeze({
  usernameMin: 3,
  usernameMax: 24,
  displayNameMax: 60,
  bioMax: 280,
  shortTextMax: 120,
  quoteMax: 180,
  linkMax: 500,
  topicsMax: 8,
  topicLengthMax: 40,
  featuredBadgesMax: 6,
  featuredStatsMax: 4
});

export const COMMUNITY_PROFILE_ACCENTS = Object.freeze([
  "sky", "indigo", "violet", "emerald", "amber", "rose", "slate"
]);

export const COMMUNITY_PROFILE_THEMES = Object.freeze([
  "aurora", "minimal", "grid", "cosmos"
]);

export const COMMUNITY_PROFILE_FRAMES = Object.freeze([
  "none", "soft", "neon", "gold", "cosmos"
]);

export const COMMUNITY_BADGE_STYLES = Object.freeze([
  "chips", "cards", "compact"
]);

export const COMMUNITY_STAT_KEYS = Object.freeze([
  "xp", "level", "lessonsLearned", "problemsSolved", "examsPassed", "currentStreak"
]);

export const COMMUNITY_PRIVACY_KEYS = Object.freeze([
  "show_location",
  "show_education",
  "show_personality",
  "show_progress",
  "show_badges",
  "show_achievements",
  "show_streak",
  "show_links",
  "show_activity"
]);

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,23}$/;
const RESERVED_USERNAMES = new Set([
  "admin", "api", "app", "auth", "help", "about", "login", "logout",
  "mathhard", "profile", "root", "signup", "support", "system", "user", "users"
]);

function asText(value, maxLength = 1000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export function normalizeProfileUrl(value) {
  const raw = asText(value, COMMUNITY_PROFILE_LIMITS.linkMax);
  if (!raw) return "";
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) return "";
    return parsed.href;
  } catch {
    return "";
  }
}

function asUrl(value) {
  return normalizeProfileUrl(value);
}

function asArray(value, maxItems = COMMUNITY_PROFILE_LIMITS.topicsMax, maxLength = COMMUNITY_PROFILE_LIMITS.topicLengthMax) {
  const source = Array.isArray(value)
    ? value
    : String(value ?? "").split(",");
  return [...new Set(source
    .map((item) => asText(item, maxLength))
    .filter(Boolean))]
    .slice(0, maxItems);
}

function asBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeUsername(value) {
  return asText(value, COMMUNITY_PROFILE_LIMITS.usernameMax)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+/, "")
    .slice(0, COMMUNITY_PROFILE_LIMITS.usernameMax);
}

export function validateUsername(value, locale = "ro") {
  const username = normalizeUsername(value);
  const en = locale === "en";
  if (username.length < COMMUNITY_PROFILE_LIMITS.usernameMin) {
    return { valid: false, username, reason: en ? "The username must have at least 3 characters." : "Username-ul trebuie să aibă minimum 3 caractere." };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return { valid: false, username, reason: en ? "Use lowercase letters, numbers, dot, hyphen or underscore." : "Folosește litere mici, cifre, punct, minus sau underscore." };
  }
  if (RESERVED_USERNAMES.has(username)) {
    return { valid: false, username, reason: en ? "This username is reserved." : "Acest username este rezervat." };
  }
  return { valid: true, username, reason: "" };
}

export function normalizeCommunityProfile(payload = {}) {
  const profile = payload.profile || payload;
  const privacy = profile.privacy || {};
  const geography = profile.geography || {};

  return {
    available: payload.available !== false,
    isOwner: Boolean(payload.is_owner ?? payload.isOwner),
    isPublic: asBoolean(profile.is_public ?? profile.isPublic, false),
    leaderboardOptIn: asBoolean(profile.leaderboard_opt_in ?? profile.leaderboardOptIn, false),
    username: normalizeUsername(profile.username),
    displayName: asText(profile.display_name ?? profile.displayName, COMMUNITY_PROFILE_LIMITS.displayNameMax),
    avatarUrl: asUrl(profile.avatar_url ?? profile.avatarUrl),
    bannerUrl: asUrl(profile.banner_url ?? profile.bannerUrl),
    bio: asText(profile.bio, COMMUNITY_PROFILE_LIMITS.bioMax),
    headline: asText(profile.headline, 100),
    pronouns: asText(profile.pronouns, 40),
    dreamSchool: asText(profile.dream_school ?? profile.dreamSchool, COMMUNITY_PROFILE_LIMITS.shortTextMax),
    favoriteProblemType: asText(profile.favorite_problem_type ?? profile.favoriteProblemType, COMMUNITY_PROFILE_LIMITS.shortTextMax),
    learningStyle: asText(profile.learning_style ?? profile.learningStyle, 40),
    collaborationStatus: asText(profile.collaboration_status ?? profile.collaborationStatus, 40),
    weeklyGoal: asText(profile.weekly_goal ?? profile.weeklyGoal, COMMUNITY_PROFILE_LIMITS.shortTextMax),
    countryCode: asText(profile.country_code ?? profile.countryCode ?? geography.country_code, 2).toUpperCase(),
    regionCode: asText(profile.region_code ?? profile.regionCode ?? geography.region_code, 16).toUpperCase(),
    countryName: asText(profile.country_name ?? profile.countryName ?? geography.country_name, 100),
    regionName: asText(profile.region_name ?? profile.regionName ?? geography.region_name, 140),
    continentCode: asText(profile.continent_code ?? profile.continentCode ?? geography.continent_code, 2).toUpperCase(),
    euMember: Boolean(profile.eu_member ?? profile.euMember ?? geography.eu_member),
    educationLevel: asText(profile.education_level ?? profile.educationLevel, 40),
    gradeLevel: asText(profile.grade_level ?? profile.gradeLevel, 24),
    studyTrack: asText(profile.study_track ?? profile.studyTrack, COMMUNITY_PROFILE_LIMITS.shortTextMax),
    academicGoal: asText(profile.academic_goal ?? profile.academicGoal, COMMUNITY_PROFILE_LIMITS.shortTextMax),
    currentFocus: asText(profile.current_focus ?? profile.currentFocus, COMMUNITY_PROFILE_LIMITS.shortTextMax),
    favoriteTopics: asArray(profile.favorite_topics ?? profile.favoriteTopics),
    favoriteMathematician: asText(profile.favorite_mathematician ?? profile.favoriteMathematician, COMMUNITY_PROFILE_LIMITS.shortTextMax),
    favoriteTheorem: asText(profile.favorite_theorem ?? profile.favoriteTheorem, COMMUNITY_PROFILE_LIMITS.shortTextMax),
    quote: asText(profile.quote, COMMUNITY_PROFILE_LIMITS.quoteMax),
    languages: asArray(profile.languages, 6),
    websiteUrl: asUrl(profile.website_url ?? profile.websiteUrl),
    githubUrl: asUrl(profile.github_url ?? profile.githubUrl),
    portfolioUrl: asUrl(profile.portfolio_url ?? profile.portfolioUrl),
    accent: COMMUNITY_PROFILE_ACCENTS.includes(profile.profile_accent ?? profile.accent) ? profile.profile_accent ?? profile.accent : "sky",
    theme: COMMUNITY_PROFILE_THEMES.includes(profile.profile_theme ?? profile.theme) ? profile.profile_theme ?? profile.theme : "aurora",
    frame: COMMUNITY_PROFILE_FRAMES.includes(profile.profile_frame ?? profile.frame) ? profile.profile_frame ?? profile.frame : "none",
    badgeStyle: COMMUNITY_BADGE_STYLES.includes(profile.badge_display_style ?? profile.badgeStyle) ? profile.badge_display_style ?? profile.badgeStyle : "chips",
    featuredBadgeId: asText(profile.featured_badge_id ?? profile.featuredBadgeId, 80),
    featuredBadgeIds: asArray(profile.featured_badge_ids ?? profile.featuredBadgeIds, COMMUNITY_PROFILE_LIMITS.featuredBadgesMax, 80),
    publicBadgeIds: asArray(profile.public_badge_ids ?? profile.publicBadgeIds, 100, 80),
    featuredStatKeys: asArray(profile.featured_stat_keys ?? profile.featuredStatKeys, COMMUNITY_PROFILE_LIMITS.featuredStatsMax)
      .filter((key) => COMMUNITY_STAT_KEYS.includes(key)),
    privacy: Object.fromEntries(COMMUNITY_PRIVACY_KEYS.map((key) => [
      key,
      asBoolean(privacy[key] ?? profile[key], key === "show_badges")
    ])),
    badges: Array.isArray(payload.badges) ? payload.badges.map(normalizeBadge) : [],
    achievements: Array.isArray(payload.achievements) ? payload.achievements : [],
    stats: normalizePublicStats(payload.stats || {}),
    joinedAt: profile.joined_at || profile.joinedAt || profile.created_at || "",
    lastActiveAt: profile.last_active_at || profile.lastActiveAt || "",
    updatedAt: profile.updated_at || profile.updatedAt || "",
    safety: {
      usernameChangedAt: payload.safety?.username_changed_at || payload.safety?.usernameChangedAt || "",
      usernameCooldownUntil: payload.safety?.username_cooldown_until || payload.safety?.usernameCooldownUntil || "",
      contentReviewStatus: asText(payload.safety?.content_review_status ?? payload.safety?.contentReviewStatus ?? "clear", 24),
      contentReviewReason: asText(payload.safety?.content_review_reason ?? payload.safety?.contentReviewReason, 1000),
      flags: Array.isArray(payload.safety?.flags) ? payload.safety.flags : []
    }
  };
}

export function normalizePublicStats(stats = {}) {
  return {
    xp: Math.max(0, Number(stats.xp || stats.total_xp || 0)),
    level: Math.max(1, Number(stats.level || 1)),
    currentStreak: Math.max(0, Number(stats.current_streak || 0)),
    longestStreak: Math.max(0, Number(stats.longest_streak || 0)),
    lessonsRead: Math.max(0, Number(stats.lessons_read || 0)),
    lessonsLearned: Math.max(0, Number(stats.lessons_learned || 0)),
    problemsSolved: Math.max(0, Number(stats.problems_solved || 0)),
    examsPassed: Math.max(0, Number(stats.exams_passed || 0))
  };
}

export function normalizeBadge(item = {}) {
  return {
    id: asText(item.id, 80),
    title: asText(item.title ?? item.title_ro ?? item.id, 120),
    titleRo: asText(item.title_ro ?? item.title, 120),
    titleEn: asText(item.title_en ?? item.title, 120),
    description: asText(item.description ?? item.description_ro, 300),
    descriptionRo: asText(item.description_ro ?? item.description, 300),
    descriptionEn: asText(item.description_en ?? item.description, 300),
    icon: asText(item.icon || "◆", 16),
    category: asText(item.category || "community", 32),
    rarity: asText(item.rarity || "common", 24),
    assignmentMode: asText(item.assignment_mode || "manual", 24),
    color: asText(item.color || "sky", 24),
    active: item.active !== false,
    featured: Boolean(item.featured),
    isPublic: item.is_public !== false,
    awardedAt: item.awarded_at || "",
    expiresAt: item.expires_at || "",
    userCount: Math.max(0, Number(item.user_count || 0)),
    source: asText(item.source ?? item.metadata?.source, 80),
    awardReason: asText(item.award_reason ?? item.reason ?? item.admin_note, 300)
  };
}

export function communityProfileDraft(profile = {}) {
  const normalized = normalizeCommunityProfile(profile);
  return {
    username: normalized.username,
    display_name: normalized.displayName,
    avatar_url: normalized.avatarUrl || null,
    banner_url: normalized.bannerUrl || null,
    bio: normalized.bio || null,
    headline: normalized.headline || null,
    pronouns: normalized.pronouns || null,
    dream_school: normalized.dreamSchool || null,
    favorite_problem_type: normalized.favoriteProblemType || null,
    learning_style: normalized.learningStyle || null,
    collaboration_status: normalized.collaborationStatus || null,
    weekly_goal: normalized.weeklyGoal || null,
    country_code: normalized.countryCode || null,
    region_code: normalized.regionCode || null,
    education_level: normalized.educationLevel || null,
    grade_level: normalized.gradeLevel || null,
    study_track: normalized.studyTrack || null,
    academic_goal: normalized.academicGoal || null,
    current_focus: normalized.currentFocus || null,
    favorite_topics: normalized.favoriteTopics,
    favorite_mathematician: normalized.favoriteMathematician || null,
    favorite_theorem: normalized.favoriteTheorem || null,
    quote: normalized.quote || null,
    languages: normalized.languages,
    website_url: normalized.websiteUrl || null,
    github_url: normalized.githubUrl || null,
    portfolio_url: normalized.portfolioUrl || null,
    profile_accent: normalized.accent,
    profile_theme: normalized.theme,
    profile_frame: normalized.frame,
    badge_display_style: normalized.badgeStyle,
    featured_badge_id: normalized.featuredBadgeId || null,
    featured_badge_ids: normalized.featuredBadgeIds,
    public_badge_ids: normalized.publicBadgeIds.length ? normalized.publicBadgeIds : normalized.badges.filter((badge) => badge.isPublic).map((badge) => badge.id),
    featured_stat_keys: normalized.featuredStatKeys,
    is_public: normalized.isPublic,
    leaderboard_opt_in: normalized.leaderboardOptIn,
    privacy: normalized.privacy
  };
}

export function validateCommunityProfileDraft(profile = {}, locale = "ro") {
  const normalized = normalizeCommunityProfile(profile);
  const usernameResult = validateUsername(normalized.username, locale);
  const errors = [];
  const en = locale === "en";

  if (!usernameResult.valid) errors.push(usernameResult.reason);
  if (normalized.displayName.length < 2) errors.push(en ? "The display name must have at least 2 characters." : "Numele afișat trebuie să aibă minimum 2 caractere.");
  if (profile.avatar_url && !normalized.avatarUrl) errors.push(en ? "The avatar must use a valid http(s) URL." : "Avatarul trebuie să fie un URL http(s) valid.");
  if (profile.banner_url && !normalized.bannerUrl) errors.push(en ? "The banner must use a valid http(s) URL." : "Bannerul trebuie să fie un URL http(s) valid.");
  if ((profile.website_url ?? profile.websiteUrl) && !normalized.websiteUrl) errors.push(en ? "The website URL is invalid." : "Website-ul trebuie să fie un URL valid.");
  if ((profile.github_url ?? profile.githubUrl) && !normalized.githubUrl) errors.push(en ? "The GitHub URL is invalid." : "Linkul GitHub trebuie să fie valid.");
  if ((profile.portfolio_url ?? profile.portfolioUrl) && !normalized.portfolioUrl) errors.push(en ? "The portfolio URL is invalid." : "Linkul de portofoliu trebuie să fie valid.");
  if (normalized.regionCode && !normalized.countryCode) errors.push(en ? "Choose the country before the region." : "Alege țara înaintea regiunii.");
  if (normalized.leaderboardOptIn && !normalized.isPublic) errors.push(en ? "The profile must be public to join leaderboards." : "Profilul trebuie să fie public pentru a participa în clasamente.");
  if (normalized.leaderboardOptIn && !normalized.privacy.show_progress) errors.push(en ? "Public progress is required to join leaderboards." : "Progresul public este necesar pentru a participa în clasamente.");

  return { valid: errors.length === 0, errors, profile: normalized };
}

export function publicProfileUrl(username, origin = "") {
  const normalized = normalizeUsername(username);
  const base = String(origin || "").replace(/\/$/, "");
  return `${base}/u.html?u=${encodeURIComponent(normalized)}`;
}

export function countryLabel(code, locale = "ro") {
  const normalized = asText(code, 2).toUpperCase();
  if (!normalized) return "";
  try {
    return new Intl.DisplayNames([locale === "en" ? "en" : "ro"], { type: "region" }).of(normalized) || normalized;
  } catch {
    return normalized;
  }
}
