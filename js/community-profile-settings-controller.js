import { supabase } from "./supabase-client.js";
import {
  COMMUNITY_PRIVACY_KEYS,
  communityProfileDraft,
  countryLabel,
  normalizeCommunityProfile,
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
  const preview = $("communityProfilePreview");
  const previewBanner = $("communityPreviewBanner");
  const previewAvatar = $("communityPreviewAvatar");
  const previewState = $("communityPreviewState");
  const previewName = $("communityPreviewName");
  const previewUsername = $("communityPreviewUsername");
  const previewBio = $("communityPreviewBio");
  const previewBadges = $("communityPreviewBadges");
  const previewDetails = $("communityPreviewDetails");

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
    const raw = Object.fromEntries(new FormData(form).entries());
    raw.is_public = Boolean(form.elements.is_public?.checked);
    raw.leaderboard_opt_in = Boolean(form.elements.leaderboard_opt_in?.checked);
    raw.favorite_topics = listFromInput("favorite_topics");
    raw.languages = listFromInput("languages");
    raw.privacy = Object.fromEntries(COMMUNITY_PRIVACY_KEYS.map((key) => [
      key,
      Boolean(form.elements[key]?.checked)
    ]));
    return raw;
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
    const profile = normalizeCommunityProfile({ profile: raw, badges: currentProfile?.badges || [] });
    preview.dataset.accent = profile.accent;
    preview.dataset.theme = profile.theme;
    previewBanner.style.backgroundImage = profile.bannerUrl ? `url("${profile.bannerUrl.replaceAll('"', '%22')}")` : "";
    setImage(previewAvatar, profile.avatarUrl, profile.displayName);
    previewName.textContent = profile.displayName || copy.defaultName;
    previewUsername.textContent = profile.username ? `@${profile.username}` : copy.defaultUsername;
    previewBio.textContent = profile.bio || copy.defaultBio;
    previewState.textContent = profile.isPublic ? copy.publicState : copy.privateState;
    previewState.classList.toggle("is-public", profile.isPublic);

    const visibleBadges = profile.badges.filter((badge) => badge.isPublic).slice(0, 4);
    previewBadges.replaceChildren(...visibleBadges.map((badge) => {
      const chip = document.createElement("span");
      chip.className = "community-preview-badge";
      chip.textContent = `${badge.icon} ${badge.titleRo || badge.title}`;
      return chip;
    }));

    const details = [];
    if (profile.currentFocus) details.push([copy.learningNow, profile.currentFocus]);
    if (profile.countryCode) details.push([copy.location, [selectedOptionText(countrySelect), regionSelect.value ? selectedOptionText(regionSelect) : ""].filter(Boolean).join(" · ")]);
    if (profile.academicGoal) details.push([copy.goal, profile.academicGoal]);
    previewDetails.replaceChildren(...details.map(([label, value]) => {
      const wrapper = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      wrapper.append(dt, dd);
      return wrapper;
    }));
  }

  function fillBadgeOptions(profile) {
    const badges = profile.badges.filter((badge) => badge.isPublic);
    featuredBadgeSelect.replaceChildren(new Option(copy.automatic, ""));
    badges.forEach((badge) => featuredBadgeSelect.add(new Option(`${badge.icon} ${badge.titleRo || badge.title}`, badge.id)));
    featuredBadgeSelect.value = profile.featuredBadgeId || "";
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
    setValue("country_code", profile.countryCode);
    setValue("education_level", profile.educationLevel);
    setValue("grade_level", profile.gradeLevel);
    setValue("study_track", profile.studyTrack);
    setValue("academic_goal", profile.academicGoal);
    setValue("current_focus", profile.currentFocus);
    setValue("favorite_topics", profile.favoriteTopics.join(", "));
    setValue("favorite_mathematician", profile.favoriteMathematician);
    setValue("favorite_theorem", profile.favoriteTheorem);
    setValue("quote", profile.quote);
    setValue("languages", profile.languages.join(", "));
    setValue("website_url", profile.websiteUrl);
    setValue("github_url", profile.githubUrl);
    setValue("portfolio_url", profile.portfolioUrl);
    setValue("profile_accent", profile.accent);
    setValue("profile_theme", profile.theme);
    setValue("is_public", profile.isPublic);
    setValue("leaderboard_opt_in", profile.leaderboardOptIn);
    COMMUNITY_PRIVACY_KEYS.forEach((key) => setValue(key, profile.privacy[key]));
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
    }
  }

  form.addEventListener("input", renderPreview);
  form.addEventListener("change", renderPreview);
  countrySelect.addEventListener("change", () => void fillRegions(countrySelect.value));
  usernameInput.addEventListener("input", () => {
    clearTimeout(usernameTimer);
    usernameTimer = setTimeout(() => void verifyUsername(), 420);
  });
  saveButton.addEventListener("click", () => void save());

  window.addEventListener("mh:profile-auth-user", (event) => void loadForUser(event.detail?.userId || ""));
  supabase.auth.getUser().then(({ data }) => loadForUser(data?.user?.id || "")).catch(() => loadForUser(""));
}
