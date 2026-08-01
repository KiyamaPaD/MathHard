import { supabase } from "./supabase-client.js";
import {
  COMMUNITY_PRIVACY_KEYS,
  communityProfileDraft,
  countryLabel,
  normalizeCommunityProfile,
  normalizeProfileUrl,
  normalizeUsername,
  publicProfileUrl,
  validateCommunityProfileDraft,
  validateUsername
} from "./community-profile-model.js";
import {
  checkCommunityUsername,
  loadCommunityCountries,
  loadCommunityRegions,
  loadOwnCommunityProfile,
  saveOwnCommunityProfile
} from "./community-profile-repository.js";


const language = localStorage.getItem("mh_lang") === "en" ? "en" : "ro";
const copy = language === "en" ? {
  loading: "Loading...",
  loadError: "The public profile could not be loaded. Try again.",
  regionsError: "Regions could not be loaded.",
  currentUsername: "Current username.",
  usernameAvailable: "Username available.",
  usernameUnavailable: "Username unavailable.",
  usernameDeferred: "Availability will be checked when saving.",
  saving: "Saving...",
  saved: "Profile saved.",
  duplicateUsername: "This username is already used.",
  saveError: "The profile could not be saved. Check the fields and try again.",
  publicState: "Public",
  privateState: "Private",
  defaultName: "Your profile",
  defaultUsername: "@username",
  defaultBio: "Add a short bio.",
  learningNow: "Currently learning",
  location: "Location",
  goal: "Goal",
  unspecified: "Not specified",
  automatic: "Automatic"
} : {
  loading: "Se încarcă...",
  loadError: "Profilul public nu a putut fi încărcat. Reîncearcă.",
  regionsError: "Regiunile nu au putut fi încărcate.",
  currentUsername: "Username-ul actual.",
  usernameAvailable: "Username disponibil.",
  usernameUnavailable: "Username indisponibil.",
  usernameDeferred: "Disponibilitatea va fi verificată la salvare.",
  saving: "Se salvează...",
  saved: "Profil salvat.",
  duplicateUsername: "Username-ul este deja folosit.",
  saveError: "Profilul nu a putut fi salvat. Verifică datele și reîncearcă.",
  publicState: "Public",
  privateState: "Privat",
  defaultName: "Profilul tău",
  defaultUsername: "@username",
  defaultBio: "Adaugă o bio scurtă.",
  learningNow: "Învăț acum",
  location: "Locație",
  goal: "Obiectiv",
  unspecified: "Nespecificată",
  automatic: "Automat"
};

const root = document.getElementById("communityProfileSettings");
const form = document.getElementById("communityProfileForm");

if (root && form) {
  const $ = (id) => document.getElementById(id);
  const status = $("communityProfileStatus");
  const saveButton = $("communitySaveProfile");
  const openButton = $("communityOpenProfile");
  const usernameInput = $("communityUsername");
  const usernameHint = $("communityUsernameHint");
  const countrySelect = $("communityCountry");
  const regionSelect = $("communityRegion");
  const featuredBadgeSelect = $("communityFeaturedBadge");
  const featuredBadgesSelect = $("communityFeaturedBadges");
  const badgeVisibility = $("communityBadgeVisibility");
  const preview = $("communityProfilePreview");
  const previewBanner = $("communityPreviewBanner");
  const previewAvatar = $("communityPreviewAvatar");
  const previewState = $("communityPreviewState");
  const previewName = $("communityPreviewName");
  const previewPronouns = $("communityPreviewPronouns");
  const previewHeadline = $("communityPreviewHeadline");
  const previewUsername = $("communityPreviewUsername");
  const previewBio = $("communityPreviewBio");
  const previewBadges = $("communityPreviewBadges");
  const previewDetails = $("communityPreviewDetails");
  const previewLinks = $("communityPreviewLinks");

  let currentUserId = "";
  let currentUsername = "";
  let currentProfile = null;
  let countries = [];
  let regions = [];
  let usernameTimer = null;
  let loadEpoch = 0;

  function setStatus(message = "", stateName = "") {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = stateName;
  }

  function setBusy(value) {
    if (saveButton) saveButton.disabled = value;
    form.querySelectorAll("input,select,textarea,button").forEach((element) => {
      if (element !== saveButton) element.disabled = value;
    });
  }

  function listFromInput(name) {
    return String(form.elements[name]?.value || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  function readDraft() {
    const raw = {};
    Array.from(form.elements).forEach((element) => {
      if (!element.name || element.type === "checkbox" || element.type === "button") return;
      raw[element.name] = element.value;
    });
    raw.is_public = Boolean(form.elements.is_public?.checked);
    raw.leaderboard_opt_in = Boolean(form.elements.leaderboard_opt_in?.checked);
    raw.favorite_topics = listFromInput("favorite_topics");
    raw.languages = listFromInput("languages");
    raw.featured_badge_ids = Array.from(featuredBadgesSelect?.selectedOptions || []).map((option) => option.value).filter(Boolean).slice(0, 6);
    raw.public_badge_ids = Array.from(badgeVisibility?.querySelectorAll('input[data-badge-visibility]:checked') || []).map((input) => input.value);
    if (raw.featured_badge_id && !raw.public_badge_ids.includes(raw.featured_badge_id)) raw.public_badge_ids.unshift(raw.featured_badge_id);
    raw.featured_stat_keys = Array.from(form.querySelectorAll('input[name="featured_stat_keys"]:checked')).map((input) => input.value).slice(0, 4);
    raw.privacy = Object.fromEntries(COMMUNITY_PRIVACY_KEYS.map((key) => [
      key,
      Boolean(form.elements[key]?.checked)
    ]));
    return raw;
  }

  function normalizeLinkInputs() {
    ["avatar_url", "banner_url", "website_url", "github_url", "portfolio_url"].forEach((name) => {
      const element = form.elements[name];
      if (!element || !element.value.trim()) return;
      const normalized = normalizeProfileUrl(element.value);
      if (normalized) element.value = normalized;
    });
  }

  function setValue(name, value = "") {
    const element = form.elements[name];
    if (!element) return;
    if (element.type === "checkbox") element.checked = Boolean(value);
    else element.value = value ?? "";
  }

  function setImage(container, url, fallbackText) {
    container.replaceChildren();
    if (!url) {
      container.textContent = String(fallbackText || "M").trim().charAt(0).toUpperCase() || "M";
      return;
    }
    const image = document.createElement("img");
    image.src = url;
    image.alt = "";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => {
      container.replaceChildren();
      container.textContent = String(fallbackText || "M").trim().charAt(0).toUpperCase() || "M";
    }, { once: true });
    container.append(image);
  }

  function selectedOptionText(select) {
    return select?.selectedOptions?.[0]?.textContent?.trim() || "";
  }

  function renderPreview() {
    const raw = readDraft();
    const publicIds = new Set(raw.public_badge_ids || []);
    const badges = (currentProfile?.badges || []).map((badge) => ({ ...badge, is_public: publicIds.has(badge.id) }));
    const profile = normalizeCommunityProfile({ profile: raw, badges });
    preview.dataset.accent = profile.accent;
    preview.dataset.theme = profile.theme;
    preview.dataset.frame = profile.frame;
    preview.dataset.badgeStyle = profile.badgeStyle;
    previewBanner.style.backgroundImage = profile.bannerUrl ? `url("${profile.bannerUrl.replaceAll('"', '%22')}")` : "";
    setImage(previewAvatar, profile.avatarUrl, profile.displayName);
    previewName.textContent = profile.displayName || copy.defaultName;
    previewUsername.textContent = profile.username ? `@${profile.username}` : copy.defaultUsername;
    previewPronouns.textContent = profile.pronouns;
    previewPronouns.hidden = !profile.pronouns;
    previewHeadline.textContent = profile.headline;
    previewHeadline.hidden = !profile.headline;
    previewBio.textContent = profile.bio;
    previewBio.hidden = !profile.bio;
    previewState.textContent = profile.isPublic ? copy.publicState : copy.privateState;
    previewState.classList.toggle("is-public", profile.isPublic);

    const publicBadges = profile.badges.filter((badge) => badge.isPublic);
    const preferredIds = profile.featuredBadgeIds.length ? profile.featuredBadgeIds : [profile.featuredBadgeId].filter(Boolean);
    const preferred = preferredIds.map((id) => publicBadges.find((badge) => badge.id === id)).filter(Boolean);
    const visibleBadges = profile.privacy.show_badges
      ? [...preferred, ...publicBadges.filter((badge) => !preferredIds.includes(badge.id))].slice(0, 6)
      : [];
    previewBadges.replaceChildren(...visibleBadges.map((badge) => {
      const chip = document.createElement("span");
      chip.className = "community-preview-badge";
      chip.textContent = `${badge.icon} ${badge.titleRo || badge.title}`;
      return chip;
    }));

    const details = [];
    if (profile.privacy.show_personality && profile.currentFocus) details.push([copy.learningNow, profile.currentFocus]);
    if (profile.privacy.show_personality && profile.weeklyGoal) details.push([language === "en" ? "Weekly goal" : "Obiectiv săptămânal", profile.weeklyGoal]);
    if (profile.privacy.show_personality && profile.collaborationStatus) details.push([language === "en" ? "Availability" : "Disponibilitate", selectedOptionText(form.elements.collaboration_status)]);
    if (profile.privacy.show_location && profile.countryCode) details.push([copy.location, [selectedOptionText(countrySelect), regionSelect.value ? selectedOptionText(regionSelect) : ""].filter(Boolean).join(" · ")]);
    if (profile.privacy.show_education && profile.academicGoal) details.push([copy.goal, profile.academicGoal]);
    previewDetails.replaceChildren(...details.map(([label, value]) => {
      const wrapper = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      wrapper.append(dt, dd);
      return wrapper;
    }));

    const links = profile.privacy.show_links ? [
      ["Website", profile.websiteUrl],
      ["GitHub", profile.githubUrl],
      ["Portfolio", profile.portfolioUrl]
    ].filter(([, url]) => url) : [];
    previewLinks?.replaceChildren(...links.map(([label, url]) => {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = label;
      return anchor;
    }));
    if (previewLinks) previewLinks.hidden = links.length === 0;
  }

  function fillBadgeOptions(profile) {
    const badges = profile.badges;
    featuredBadgeSelect.replaceChildren(new Option(copy.automatic, ""));
    featuredBadgesSelect?.replaceChildren();
    badges.forEach((badge) => {
      const label = `${badge.icon} ${badge.titleRo || badge.title}`;
      featuredBadgeSelect.add(new Option(label, badge.id));
      if (featuredBadgesSelect) {
        const option = new Option(label, badge.id);
        option.selected = profile.featuredBadgeIds.includes(badge.id);
        featuredBadgesSelect.add(option);
      }
    });
    featuredBadgeSelect.value = profile.featuredBadgeId || "";
    if (badgeVisibility) {
      badgeVisibility.replaceChildren(...badges.map((badge) => {
        const label = document.createElement("label");
        label.className = "community-badge-visibility-item";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = badge.id;
        input.checked = badge.isPublic;
        input.dataset.badgeVisibility = "1";
        const span = document.createElement("span");
        span.textContent = `${badge.icon} ${badge.titleRo || badge.title}`;
        label.append(input, span);
        return label;
      }));
    }
  }

  async function fillRegions(countryCode, selected = "") {
    regionSelect.disabled = true;
    regionSelect.replaceChildren(new Option(copy.unspecified, ""));
    regions = [];
    if (!countryCode) {
      renderPreview();
      return;
    }
    try {
      regions = await loadCommunityRegions(supabase, countryCode) || [];
      regions.forEach((region) => regionSelect.add(new Option(region.name, region.code)));
      regionSelect.value = selected || "";
    } catch (error) {
      console.error("Community regions load failed:", error);
      setStatus(copy.regionsError, "error");
    } finally {
      regionSelect.disabled = false;
      renderPreview();
    }
  }

  async function fillForm(profile) {
    currentProfile = profile;
    currentUsername = profile.username;
    setValue("username", profile.username);
    setValue("display_name", profile.displayName);
    setValue("avatar_url", profile.avatarUrl);
    setValue("banner_url", profile.bannerUrl);
    setValue("bio", profile.bio);
    setValue("headline", profile.headline);
    setValue("pronouns", profile.pronouns);
    setValue("country_code", profile.countryCode);
    setValue("education_level", profile.educationLevel);
    setValue("grade_level", profile.gradeLevel);
    setValue("study_track", profile.studyTrack);
    setValue("academic_goal", profile.academicGoal);
    setValue("current_focus", profile.currentFocus);
    setValue("favorite_topics", profile.favoriteTopics.join(", "));
    setValue("favorite_mathematician", profile.favoriteMathematician);
    setValue("favorite_theorem", profile.favoriteTheorem);
    setValue("dream_school", profile.dreamSchool);
    setValue("favorite_problem_type", profile.favoriteProblemType);
    setValue("learning_style", profile.learningStyle);
    setValue("collaboration_status", profile.collaborationStatus);
    setValue("weekly_goal", profile.weeklyGoal);
    setValue("quote", profile.quote);
    setValue("languages", profile.languages.join(", "));
    setValue("website_url", profile.websiteUrl);
    setValue("github_url", profile.githubUrl);
    setValue("portfolio_url", profile.portfolioUrl);
    setValue("profile_accent", profile.accent);
    setValue("profile_theme", profile.theme);
    setValue("profile_frame", profile.frame);
    setValue("badge_display_style", profile.badgeStyle);
    form.querySelectorAll('input[name="featured_stat_keys"]').forEach((input) => {
      input.checked = profile.featuredStatKeys.includes(input.value);
    });
    setValue("is_public", profile.isPublic);
    setValue("leaderboard_opt_in", profile.leaderboardOptIn);
    COMMUNITY_PRIVACY_KEYS.forEach((key) => setValue(key, profile.privacy[key]));
    if (!profile.featuredStatKeys.length) {
      ["xp", "level", "problemsSolved", "lessonsLearned"].forEach((key) => {
        const input = form.querySelector(`input[name="featured_stat_keys"][value="${key}"]`);
        if (input) input.checked = true;
      });
    }
    fillBadgeOptions(profile);
    await fillRegions(profile.countryCode, profile.regionCode);
    openButton.href = publicProfileUrl(profile.username, location.origin);
    openButton.hidden = !profile.isPublic;
    renderPreview();
  }

  async function loadCountries() {
    if (countries.length) return;
    countries = await loadCommunityCountries(supabase) || [];
    countries
      .map((country) => ({ ...country, label: countryLabel(country.code, document.documentElement.lang) }))
      .sort((a, b) => a.label.localeCompare(b.label, document.documentElement.lang))
      .forEach((country) => countrySelect.add(new Option(country.label, country.code)));
  }

  async function loadForUser(userId) {
    const epoch = ++loadEpoch;
    currentUserId = userId || "";
    if (!currentUserId) {
      root.hidden = true;
      return;
    }
    root.hidden = false;
    setBusy(true);
    setStatus(copy.loading, "loading");
    try {
      await loadCountries();
      const profile = normalizeCommunityProfile(await loadOwnCommunityProfile(supabase));
      if (epoch !== loadEpoch) return;
      await fillForm(profile);
      setStatus("", "");
    } catch (error) {
      console.error("Community profile load failed:", error);
      setStatus(copy.loadError, "error");
    } finally {
      if (epoch === loadEpoch) setBusy(false);
    }
  }

  async function verifyUsername() {
    const result = validateUsername(usernameInput.value, language);
    usernameInput.value = result.username;
    if (!result.valid) {
      usernameHint.textContent = result.reason;
      usernameHint.dataset.state = "error";
      return false;
    }
    if (result.username === currentUsername) {
      usernameHint.textContent = copy.currentUsername;
      usernameHint.dataset.state = "available";
      return true;
    }
    try {
      const availability = await checkCommunityUsername(supabase, result.username);
      const available = availability?.available === true;
      usernameHint.textContent = available ? copy.usernameAvailable : copy.usernameUnavailable;
      usernameHint.dataset.state = available ? "available" : "error";
      return available;
    } catch (error) {
      console.error("Username check failed:", error);
      usernameHint.textContent = copy.usernameDeferred;
      usernameHint.dataset.state = "";
      return true;
    }
  }

  async function save() {
    normalizeLinkInputs();
    const raw = readDraft();
    raw.username = normalizeUsername(raw.username);
    const validation = validateCommunityProfileDraft(raw, language);
    if (!validation.valid) {
      setStatus(validation.errors[0], "error");
      return;
    }
    setBusy(true);
    setStatus(copy.saving, "loading");
    try {
      const saved = normalizeCommunityProfile(await saveOwnCommunityProfile(supabase, communityProfileDraft(validation.profile)));
      await fillForm(saved);
      setStatus(copy.saved, "success");
      window.dispatchEvent(new CustomEvent("mh:community-profile-saved", { detail: saved }));
    } catch (error) {
      console.error("Community profile save failed:", error);
      const duplicate = error?.code === "23505" || /username/i.test(error?.message || "");
      setStatus(duplicate ? copy.duplicateUsername : copy.saveError, "error");
    } finally {
      setBusy(false);
      renderPreview();
    }
  }

  form.addEventListener("input", renderPreview);
  form.addEventListener("change", (event) => {
    if (event.target?.name === "featured_stat_keys") {
      const checked = Array.from(form.querySelectorAll('input[name="featured_stat_keys"]:checked'));
      if (checked.length > 4) {
        event.target.checked = false;
        setStatus(language === "en" ? "Choose up to four statistics." : "Alege maximum patru statistici.", "error");
      }
    }
    if (event.target === featuredBadgesSelect && featuredBadgesSelect.selectedOptions.length > 6) {
      event.target.selectedOptions[event.target.selectedOptions.length - 1].selected = false;
      setStatus(language === "en" ? "Choose up to six badges." : "Alege maximum șase badge-uri.", "error");
    }
    if (event.target === featuredBadgeSelect && featuredBadgeSelect.value) {
      const visibility = badgeVisibility?.querySelector(`input[data-badge-visibility][value="${CSS.escape(featuredBadgeSelect.value)}"]`);
      if (visibility) visibility.checked = true;
    }
    if (event.target?.matches?.('input[data-badge-visibility]') && !event.target.checked && event.target.value === featuredBadgeSelect.value) {
      event.target.checked = true;
      setStatus(language === "en" ? "The featured badge must remain public." : "Badge-ul principal trebuie să rămână public.", "error");
    }
    renderPreview();
  });
  ["avatar_url", "banner_url", "website_url", "github_url", "portfolio_url"].forEach((name) => {
    form.elements[name]?.addEventListener("blur", () => {
      normalizeLinkInputs();
      renderPreview();
    });
  });
  countrySelect.addEventListener("change", () => void fillRegions(countrySelect.value));
  form.elements.leaderboard_opt_in?.addEventListener("change", () => {
    if (!form.elements.leaderboard_opt_in.checked) return;
    form.elements.is_public.checked = true;
    form.elements.show_progress.checked = true;
    renderPreview();
  });
  usernameInput.addEventListener("input", () => {
    clearTimeout(usernameTimer);
    usernameTimer = setTimeout(() => void verifyUsername(), 420);
  });
  saveButton.addEventListener("click", () => void save());

  window.addEventListener("mh:profile-auth-user", (event) => void loadForUser(event.detail?.userId || ""));
  supabase.auth.getUser().then(({ data }) => loadForUser(data?.user?.id || "")).catch(() => loadForUser(""));
}
