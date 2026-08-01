import { supabase } from "./supabase-client.js";
import {
  invalidateContentCatalogCache,
  loadContentCatalog
} from "./content-repository.js";
import { PROFILE_TEXT } from "./profile-text.js";
import {
  buildProfileStats,
  formatExamLabel,
  localizedTitle,
  sortExamsForProfile,
  sortLessonsForProfile
} from "./profile-model.js";
import { loadProgressTaxonomy } from "./progress-taxonomy-repository.js";
import {
  initializeProfileExperience,
  renderProfileExperience,
  renderProfileIdentity,
  resetProfileExperience,
  setProfileExperienceLanguage
} from "./profile-experience-controller.js";


const $ = (id) => document.getElementById(id);

/* ========= LANGUAGE / I18N ========= */
let LANG =
  localStorage.getItem("mh_lang") === "en" ? "en" : "ro";

function t(key, vars = {}) {
  let text = PROFILE_TEXT[LANG]?.[key] ?? PROFILE_TEXT.ro[key] ?? key;

  for (const [k, v] of Object.entries(vars)) {
    text = text.replaceAll(`{${k}}`, String(v));
  }

  return text;
}

/* ========= HEADER / AUTH ========= */
const profileSolved = $("profileSolved");
const profileRead = $("profileRead");
const profileLearned = $("profileLearned");
const profilePassed = $("profilePassed");
const profileXP = $("profileXP");

const profileAvatar = $("profileAvatar");
const profileName = $("profileName");
const profileEmail = $("profileEmail");

const authForm = $("authForm");
const profileUserBox = $("profileUserBox");
const profileUserStatus = $("profileUserStatus");
const authStatus = $("authStatus");
const authText = $("authText");

const authEmail = $("authEmail");
const authPassword = $("authPassword");
const authDisplayName = $("authDisplayName");

const loginBtn = $("loginBtn");
const signupBtn = $("signupBtn");
const logoutBtn = $("logoutBtn");

/* ========= ACCOUNT INFO ========= */
const profileInfoName = $("profileInfoName");
const profileInfoEmail = $("profileInfoEmail");
const profileInfoConfirmed = $("profileInfoConfirmed");

/* ========= PROGRESS SUMMARY ========= */
const profileLessonsReadProgressText = $("profileLessonsReadProgressText");
const profileLessonsProgressText = $("profileLessonsProgressText");
const profileProblemsProgressText = $("profileProblemsProgressText");
const profileExamsProgressText = $("profileExamsProgressText");

const profileLessonsReadProgressBar = $("profileLessonsReadProgressBar");
const profileLessonsProgressBar = $("profileLessonsProgressBar");
const profileProblemsProgressBar = $("profileProblemsProgressBar");
const profileExamsProgressBar = $("profileExamsProgressBar");

const profileAvgXpText = $("profileAvgXpText");

/* ========= PROFILE EDIT ========= */
const editDisplayName = $("editDisplayName");
const editAvatarUrl = $("editAvatarUrl");
const newPassword = $("newPassword");

const saveProfileBtn = $("saveProfileBtn");
const resetProfileBtn = $("resetProfileBtn");
const deleteAccountBtn = $("deleteAccountBtn");
const changePasswordBtn = $("changePasswordBtn");

/* ========= DETAILED SUMMARY ========= */
const detailProblemsSolved = $("detailProblemsSolved");
const detailProblemsAttempted = $("detailProblemsAttempted");
const detailProblemsOpened = $("detailProblemsOpened");
const detailProblemsUnopened = $("detailProblemsUnopened");

const detailLessonsLearned = $("detailLessonsLearned");
const detailLessonsReadOnly = $("detailLessonsReadOnly");
const detailLessonsUnread = $("detailLessonsUnread");

const detailExamsPassed = $("detailExamsPassed");
const detailExamsUnpassed = $("detailExamsUnpassed");
const detailExamsUnattempted = $("detailExamsUnattempted");

const nextLessonText = $("nextLessonText");
const nextChapterText = $("nextChapterText");

/* ========= OPTIONAL EXTRA STATS ========= */
const profileRecentLesson = $("profileRecentLesson");
const profileRecentProblem = $("profileRecentProblem");
const profileRecentExam = $("profileRecentExam");
const profileBestExam = $("profileBestExam");
const profileExamAttempts = $("profileExamAttempts");
const profileExamLastScore = $("profileExamLastScore");

const nextExamText = $("nextExamText");

let CURRENT_USER = null;
let CURRENT_PROFILE_ROW = null;
let CURRENT_USER_LOAD_PROMISE = null;
let LAST_LOADED_USER_ID = null;

/* ========= HELPERS ========= */
function safeText(el, value) {
  if (!el) return;
  el.textContent = value ?? "—";
}

function setStatus(message, isError = false) {
  if (!authStatus) return;
  authStatus.textContent = message || "";
  authStatus.style.color = isError ? "var(--bad)" : "var(--muted)";
}

function getInitialLetter(text) {
  return (text || "M").trim().charAt(0).toUpperCase() || "M";
}

function normalizeAvatarUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) return "";
    return parsed.href;
  } catch (_) {
    return "";
  }
}

function renderAvatar(displayName, avatarUrl = "") {
  if (!profileAvatar) return;

  const fallback = () => {
    profileAvatar.replaceChildren();
    profileAvatar.textContent = getInitialLetter(displayName);
  };

  const url = normalizeAvatarUrl(avatarUrl);
  if (!url) {
    fallback();
    return;
  }

  const img = document.createElement("img");
  img.src = url;
  img.alt = "Avatar";
  img.className = "profile-avatar-img";
  img.loading = "lazy";
  img.referrerPolicy = "no-referrer";
  img.addEventListener("error", fallback, { once: true });

  profileAvatar.replaceChildren(img);
}

function setAuthLoading(isLoading, message = "") {
  if (loginBtn) loginBtn.disabled = isLoading;
  if (signupBtn) signupBtn.disabled = isLoading;
  if (logoutBtn) logoutBtn.disabled = isLoading;
  if (saveProfileBtn) saveProfileBtn.disabled = isLoading;
  if (resetProfileBtn) resetProfileBtn.disabled = isLoading;
  if (deleteAccountBtn) deleteAccountBtn.disabled = isLoading;
  if (changePasswordBtn) changePasswordBtn.disabled = isLoading;

  if (isLoading) {
    setStatus(message || t("processing"));
  }
}

function setProgress(elBar, elText, value, total) {
  const safeValue = Number(value || 0);
  const safeTotal = Number(total || 0);
  const pct = safeTotal > 0 ? Math.min(100, (safeValue / safeTotal) * 100) : 0;

  if (elBar) elBar.style.width = pct + "%";
  if (elText) elText.textContent = `${safeValue} / ${safeTotal}`;
}

function setZeroStats() {
  safeText(profileSolved, "0");
  safeText(profileRead, "0");
  safeText(profileLearned, "0");
  safeText(profilePassed, "0");
  safeText(profileXP, "0");
  safeText(profileAvgXpText, "0");
}

function setEmptyDetailedSummary() {
  safeText(detailProblemsSolved, "0");
  safeText(detailProblemsAttempted, "0");
  safeText(detailProblemsOpened, "0");
  safeText(detailProblemsUnopened, "0");

  safeText(detailLessonsLearned, "0");
  safeText(detailLessonsReadOnly, "0");
  safeText(detailLessonsUnread, "0");

  safeText(detailExamsPassed, "0");
  safeText(detailExamsUnpassed, "0");
  safeText(detailExamsUnattempted, "0");

  safeText(nextLessonText, "—");
  safeText(nextChapterText, "—");
  safeText(nextExamText, "—");

  safeText(profileRecentLesson, "—");
  safeText(profileRecentProblem, "—");
  safeText(profileRecentExam, "—");
  safeText(profileBestExam, "—");
  safeText(profileExamAttempts, "0");
  safeText(profileExamLastScore, "—");
}

function setEmptyAccountInfo() {
  safeText(profileInfoName, "—");
  safeText(profileInfoEmail, "—");
  safeText(profileInfoConfirmed, "—");

  setProgress(profileLessonsReadProgressBar, profileLessonsReadProgressText, 0, 0);
  setProgress(profileLessonsProgressBar, profileLessonsProgressText, 0, 0);
  setProgress(profileProblemsProgressBar, profileProblemsProgressText, 0, 0);
  setProgress(profileExamsProgressBar, profileExamsProgressText, 0, 0);
}

function fillProfileEditor(user, profileRow = null) {
  const displayName =
    profileRow?.display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "";

  const avatarUrl = profileRow?.avatar_url || "";

  if (editDisplayName) editDisplayName.value = displayName;
  if (editAvatarUrl) editAvatarUrl.value = avatarUrl;
}

function clearProfileEditor() {
  if (editDisplayName) editDisplayName.value = "";
  if (editAvatarUrl) editAvatarUrl.value = "";
  if (newPassword) newPassword.value = "";
}

function fillAccountInfo(user, profileRow = null) {
  if (!user) {
    setEmptyAccountInfo();
    return;
  }

  const displayName =
    profileRow?.display_name ||
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    t("fallback_user");

  safeText(profileInfoName, displayName);
  safeText(profileInfoEmail, user.email || "—");
  safeText(profileInfoConfirmed, user.email_confirmed_at ? t("yes") : t("no"));
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleString(LANG === "ro" ? "ro-RO" : "en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function applyProfileStaticTexts() {
  document.documentElement.lang = LANG;
  document.title = t("page_title");

  const logoSlogan = document.querySelector(".logo-slogan");
  if (logoSlogan) logoSlogan.textContent = t("logo_slogan");

  const backHomeBtn = $("backHomeBtn");
  if (backHomeBtn) backHomeBtn.textContent = t("back_home");

  document.querySelectorAll("[data-profile-text-key]").forEach((element) => {
    const key = element.dataset.profileTextKey;
    if (key) element.textContent = t(key);
  });

  if (authEmail) authEmail.placeholder = "email@example.com";
  if (authPassword) authPassword.placeholder = t("password_placeholder");
  if (authDisplayName) authDisplayName.placeholder = t("display_name_signup_placeholder");

  if (loginBtn) loginBtn.textContent = t("login_btn");
  if (signupBtn) signupBtn.textContent = t("signup_btn");
  if (logoutBtn) logoutBtn.textContent = t("logout_btn");

  if (editDisplayName) editDisplayName.placeholder = t("edit_display_name_placeholder");
  if (editAvatarUrl) editAvatarUrl.placeholder = t("edit_avatar_url_placeholder");
  if (newPassword) newPassword.placeholder = t("edit_new_password_placeholder");

  if (saveProfileBtn) saveProfileBtn.textContent = t("save_profile_btn");
  if (resetProfileBtn) resetProfileBtn.textContent = t("reset_profile_btn");
  if (changePasswordBtn) changePasswordBtn.textContent = t("change_password_btn");
  if (deleteAccountBtn) deleteAccountBtn.textContent = t("delete_account_btn");

  setProfileExperienceLanguage(LANG);
}


/* ========= RENDER ========= */
function clearSensitiveBrowserState() {
  invalidateContentCatalogCache();

  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (
        key === "mh_active_exam_lock_v1" ||
        key === "mh_active_exam_lock_v2" ||
        key?.startsWith("mh_exam_")
      ) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn("Could not clear sensitive browser state:", error);
  }
}

function renderGuest() {
  clearSensitiveBrowserState();
  CURRENT_USER = null;
  CURRENT_PROFILE_ROW = null;
  LAST_LOADED_USER_ID = null;

  applyProfileStaticTexts();

  safeText(profileName, t("visitor"));
  safeText(profileEmail, t("not_logged_yet"));
  safeText(profileUserStatus, t("status_guest"));
  renderAvatar("M", "");

  if (authForm) authForm.style.display = "grid";
  if (profileUserBox) {
    profileUserBox.hidden = true;
    profileUserBox.style.display = "none";
  }

  if (authText) {
    authText.textContent = t("auth_text_guest");
  }

  clearProfileEditor();
  setZeroStats();
  setEmptyAccountInfo();
  setEmptyDetailedSummary();
  resetProfileExperience();
  renderProfileIdentity({ userId: "guest" });
  setStatus("");
  window.dispatchEvent(new CustomEvent("mh:profile-auth-user", { detail: { userId: "" } }));
}

function renderUser(user, profileRow = null) {
  CURRENT_USER = user;
  CURRENT_PROFILE_ROW = profileRow;

  applyProfileStaticTexts();

  const displayName =
    profileRow?.display_name ||
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    t("fallback_user");

  safeText(profileName, displayName);
  safeText(profileEmail, user.email || "");
  safeText(profileUserStatus, t("status_logged_in"));
  renderAvatar(displayName, profileRow?.avatar_url || "");

  if (authForm) authForm.style.display = "none";
  if (profileUserBox) {
    profileUserBox.hidden = false;
    profileUserBox.style.display = "grid";
  }

  renderProfileIdentity({ userId: user.id });
  fillAccountInfo(user, profileRow);
  fillProfileEditor(user, profileRow);

  if (authText) {
    authText.textContent = t("auth_text_connected");
  }

  window.dispatchEvent(new CustomEvent("mh:profile-auth-user", { detail: { userId: user.id } }));
}

/* ========= AUTH / PROFILE DATA ========= */
async function getActiveUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.warn("getActiveUser error:", error);
    return null;
  }
  return data?.user || null;
}

async function loadProfileRow(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("loadProfileRow error:", error);
    throw error;
  }

  return data || null;
}

async function ensureProfileRow(user) {
  if (!user) return null;

  // The auth trigger normally creates this row. Read first so a normal page
  // load never overwrites a display name previously chosen by the user.
  const existing = await loadProfileRow(user.id);
  if (existing) return existing;

  const payload = {
    id: user.id,
    display_name:
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "User"
  };

  const { data, error } = await supabase
    .from("profiles")
    .insert(payload)
    .select("id, display_name, avatar_url")
    .single();

  // A concurrent trigger/request may have inserted the row after our initial
  // read. In that case, simply read the existing row instead of failing login.
  if (error?.code === "23505") {
    return loadProfileRow(user.id);
  }

  if (error) {
    console.error("ensureProfileRow insert error:", error);
    throw error;
  }

  return data || null;
}

/* ========= PROFILE ACTIONS ========= */
async function handleSaveProfile() {
  try {
    const activeUser = await getActiveUser();
    if (!activeUser) {
      setStatus(t("must_login"), true);
      return;
    }

    const displayName = editDisplayName?.value.trim() || "";
    const avatarInput = editAvatarUrl?.value.trim() || "";
    const avatarUrl = normalizeAvatarUrl(avatarInput) || null;

    if (!displayName) {
      setStatus(t("display_name_empty"), true);
      return;
    }

    if (avatarInput && !avatarUrl) {
      setStatus(t("avatar_url_invalid"), true);
      return;
    }

    setAuthLoading(true, t("saving_profile"));

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: activeUser.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      );

    if (profileError) throw profileError;

    const { data: updatedAuth, error: authError } = await supabase.auth.updateUser({
      data: {
        display_name: displayName
      }
    });

    if (authError) throw authError;

    const freshUser = updatedAuth?.user || activeUser;
    const freshProfile = await loadProfileRow(activeUser.id);

    renderUser(freshUser, freshProfile);
    await loadProfileStatsFromDb(activeUser.id);

    setStatus(t("profile_updated"));
  } catch (err) {
    console.error("handleSaveProfile error:", err);
    setStatus(t("save_profile_error", { error: err.message || err }), true);
  } finally {
    setAuthLoading(false);
  }
}

async function handleChangePassword() {
  try {
    const user = await getActiveUser();

    if (!user) {
      setStatus(t("must_login"), true);
      return;
    }

    const password = newPassword?.value.trim() || "";

    if (!password || password.length < 6) {
      setStatus(t("new_password_short"), true);
      return;
    }

    setAuthLoading(true, t("changing_password"));

    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;

    if (newPassword) newPassword.value = "";
    setStatus(t("password_changed"));
  } catch (err) {
    console.error("handleChangePassword error:", err);
    setStatus(t("password_change_error", { error: err.message || err }), true);
  } finally {
    setAuthLoading(false);
  }
}

async function resetProfileData() {
  try {
    const activeUser = await getActiveUser();
    if (!activeUser) {
      setStatus(t("must_login"), true);
      return;
    }

    const ok = confirm(t("reset_confirm"));
    if (!ok) return;

    setAuthLoading(true, t("resetting_profile"));

    const fallbackName = activeUser.email?.split("@")[0] || "User";

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: activeUser.id,
          display_name: fallbackName,
          avatar_url: null,
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      );

    if (profileError) throw profileError;

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        display_name: fallbackName
      }
    });

    if (authError) throw authError;

    const freshProfile = await loadProfileRow(activeUser.id);
    renderUser(activeUser, freshProfile);
    await loadProfileStatsFromDb(activeUser.id);

    setStatus(t("profile_reset"));
  } catch (err) {
    console.error("resetProfileData error:", err);
    setStatus(t("profile_reset_error", { error: err.message || err }), true);
  } finally {
    setAuthLoading(false);
  }
}

async function handleDeleteAccount() {
  const activeUser = await getActiveUser();
  if (!activeUser) {
    setStatus(t("must_login"), true);
    return;
  }

  const ok = confirm(t("delete_confirm"));
  if (!ok) return;

  setAuthLoading(true, t("deleting_account"));

  try {
    const { data, error } = await supabase.functions.invoke("swift-responder", {
      body: {}
    });

    if (error) throw error;
    if (!data?.ok) {
      throw new Error(data?.error || t("delete_unconfirmed"));
    }

    await supabase.auth.signOut();
    renderGuest();
    setStatus(t("account_deleted"));
  } catch (err) {
    console.error("handleDeleteAccount error:", err);
    setStatus(t("delete_error", { error: err.message || err }), true);
  } finally {
    setAuthLoading(false);
  }
}

/* ========= CONTENT CATALOG / PROFILE MODEL ========= */
async function loadMergedCatalog() {
  const catalog = await loadContentCatalog({ supabase });

  return {
    lessons: sortLessonsForProfile(catalog.lessons, LANG),
    problems: (catalog.problems || []).map((problem) => ({
      ...problem,
      lessonId: problem.lessonId || problem.lesson_id || ""
    })),
    exams: sortExamsForProfile(catalog.exams, LANG)
  };
}

function renderRecentActivity(item, row, dateFields) {
  if (!item || !row) return "—";
  const dateValue = dateFields.map((field) => row[field]).find(Boolean);
  return `${localizedTitle(item, LANG)} • ${formatDateTime(dateValue)}`;
}

/* ========= PROFILE STATS ========= */
async function loadProfileStatsFromDb(userId) {
  try {
    const [
      { data: lessonRows, error: lessonError },
      { data: problemRows, error: problemError },
      { data: examRows, error: examError },
      catalog,
      taxonomy
    ] = await Promise.all([
      supabase
        .from("user_lesson_progress")
        .select("*")
        .eq("user_id", userId),
      supabase
        .from("user_problem_progress")
        .select("*")
        .eq("user_id", userId),
      supabase
        .from("user_exam_progress")
        .select("*")
        .eq("user_id", userId),
      loadMergedCatalog(),
      loadProgressTaxonomy(supabase).catch((error) => {
        console.warn("Could not load detailed progress taxonomy for profile:", error);
        return null;
      })
    ]);

    if (lessonError) console.warn("Could not load lesson progress for profile:", lessonError);
    if (problemError) console.warn("Could not load problem progress for profile:", problemError);
    if (examError) console.warn("Could not load exam progress for profile:", examError);

    const stats = buildProfileStats({
      lessonRows: lessonError ? [] : (lessonRows || []),
      problemRows: problemError ? [] : (problemRows || []),
      examRows: examError ? [] : (examRows || []),
      catalog,
      taxonomy: taxonomy?.available ? taxonomy : null,
      lang: LANG
    });

    const { counts, totals, recent, exams } = stats;

    safeText(profileSolved, String(counts.solved));
    safeText(profileRead, String(counts.read));
    safeText(profileLearned, String(counts.learned));
    safeText(profilePassed, String(counts.passed));
    safeText(profileXP, String(counts.xpTotal));
    safeText(profileAvgXpText, String(counts.avgXp));

    setProgress(profileLessonsReadProgressBar, profileLessonsReadProgressText, counts.read, totals.lessons);
    setProgress(profileLessonsProgressBar, profileLessonsProgressText, counts.learned, totals.lessons);
    setProgress(profileProblemsProgressBar, profileProblemsProgressText, counts.solved, totals.problems);
    setProgress(profileExamsProgressBar, profileExamsProgressText, counts.passed, totals.exams);

    safeText(detailProblemsSolved, String(counts.solved));
    safeText(detailProblemsAttempted, String(counts.attempted));
    safeText(detailProblemsOpened, String(counts.opened));
    safeText(detailProblemsUnopened, String(counts.unopened));
    safeText(detailLessonsLearned, String(counts.learned));
    safeText(detailLessonsReadOnly, String(counts.readOnly));
    safeText(detailLessonsUnread, String(counts.unread));
    safeText(detailExamsPassed, String(counts.passed));
    safeText(detailExamsUnpassed, String(counts.failed));
    safeText(detailExamsUnattempted, String(counts.unattempted));

    safeText(
      nextLessonText,
      stats.nextLesson
        ? localizedTitle(stats.nextLesson, LANG)
        : t("all_lessons_done")
    );
    safeText(
      nextChapterText,
      stats.nextLesson
        ? `${stats.nextLesson.grade || "—"} • ${stats.nextLesson.chapter || "—"}`
        : t("nothing_left")
    );
    safeText(
      nextExamText,
      stats.recommendedExam
        ? (stats.retryRecommended
            ? t("retry_exam", { exam: formatExamLabel(stats.recommendedExam, LANG) })
            : formatExamLabel(stats.recommendedExam, LANG))
        : t("all_exams_done")
    );

    safeText(
      profileRecentLesson,
      renderRecentActivity(recent.lesson, recent.lessonRow, ["learned_at", "updated_at"])
    );
    safeText(
      profileRecentProblem,
      renderRecentActivity(recent.problem, recent.problemRow, ["solved_at", "updated_at"])
    );
    safeText(
      profileRecentExam,
      renderRecentActivity(recent.exam, recent.examRow, ["passed_at", "updated_at", "started_at"])
    );

    safeText(
      profileBestExam,
      exams.bestRow
        ? `${localizedTitle(exams.best, LANG, exams.bestRow.exam_id)} • ${t("best_word")} ${formatScore(exams.bestRow.best_score)}`
        : "—"
    );
    safeText(profileExamAttempts, String(counts.totalExamAttempts));
    safeText(
      profileExamLastScore,
      exams.lastRow
        ? `${localizedTitle(exams.last, LANG, exams.lastRow.exam_id)} • ${t("last_word")} ${formatScore(exams.lastRow.last_score)}`
        : "—"
    );

    const nextLessonLabel = stats.nextLesson
      ? localizedTitle(stats.nextLesson, LANG)
      : "";
    const nextExamLabel = stats.recommendedExam
      ? (stats.retryRecommended
          ? t("retry_exam", { exam: formatExamLabel(stats.recommendedExam, LANG) })
          : formatExamLabel(stats.recommendedExam, LANG))
      : "";

    renderProfileExperience({
      counts,
      totals,
      nextLessonLabel,
      nextExamLabel
    });

    const partialErrors = [
      lessonError ? "lessons" : null,
      problemError ? "problems" : null,
      examError ? "exams" : null
    ].filter(Boolean);

    function markProgressUnavailable(bar, text) {
      if (bar) bar.style.width = "0%";
      safeText(text, "—");
    }

    if (lessonError) {
      safeText(profileRead, "—");
      safeText(profileLearned, "—");
      safeText(detailLessonsLearned, "—");
      safeText(detailLessonsReadOnly, "—");
      safeText(detailLessonsUnread, "—");
      safeText(nextLessonText, "—");
      safeText(nextChapterText, "—");
      safeText(profileRecentLesson, "—");
      markProgressUnavailable(profileLessonsReadProgressBar, profileLessonsReadProgressText);
      markProgressUnavailable(profileLessonsProgressBar, profileLessonsProgressText);
    }

    if (problemError) {
      safeText(profileSolved, "—");
      safeText(profileXP, "—");
      safeText(profileAvgXpText, "—");
      safeText(detailProblemsSolved, "—");
      safeText(detailProblemsAttempted, "—");
      safeText(detailProblemsOpened, "—");
      safeText(detailProblemsUnopened, "—");
      safeText(profileRecentProblem, "—");
      markProgressUnavailable(profileProblemsProgressBar, profileProblemsProgressText);
    }

    if (examError) {
      safeText(profilePassed, "—");
      safeText(detailExamsPassed, "—");
      safeText(detailExamsUnpassed, "—");
      safeText(detailExamsUnattempted, "—");
      safeText(nextExamText, "—");
      safeText(profileRecentExam, "—");
      safeText(profileBestExam, "—");
      safeText(profileExamAttempts, "—");
      safeText(profileExamLastScore, "—");
      markProgressUnavailable(profileExamsProgressBar, profileExamsProgressText);
    }

    return { partialErrors };
  } catch (err) {
    console.error("Eroare la încărcarea progresului:", err);
    setZeroStats();
    setEmptyDetailedSummary();
    setProgress(profileLessonsReadProgressBar, profileLessonsReadProgressText, 0, 0);
    setProgress(profileLessonsProgressBar, profileLessonsProgressText, 0, 0);
    setProgress(profileProblemsProgressBar, profileProblemsProgressText, 0, 0);
    setProgress(profileExamsProgressBar, profileExamsProgressText, 0, 0);
    throw err;
  }
}

/* ========= CURRENT USER LOADER ========= */
async function performCurrentUserLoad({ force = false } = {}) {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    renderGuest();
    return null;
  }

  if (!force && LAST_LOADED_USER_ID === data.user.id && CURRENT_USER?.id === data.user.id) {
    return CURRENT_USER;
  }

  let profileRow = null;

  try {
    profileRow = await ensureProfileRow(data.user);
  } catch (err) {
    console.warn("ensureProfileRow failed, continui fără el:", err);
  }

  renderUser(data.user, profileRow);

  try {
    const statsResult = await loadProfileStatsFromDb(data.user.id);
    if (statsResult?.partialErrors?.length) {
      setStatus(
        LANG === "ro"
          ? `Unele statistici nu au putut fi încărcate (${statsResult.partialErrors.join(", ")}). Valorile necunoscute sunt marcate cu „—”.`
          : `Some statistics could not be loaded (${statsResult.partialErrors.join(", ")}). Unknown values are marked with “—”.`,
        true
      );
    } else {
      setStatus(t("auth_success"));
    }
  } catch (err) {
    setStatus(
      t("progress_load_error", { error: err.message || err }),
      true
    );
  }

  LAST_LOADED_USER_ID = data.user.id;
  return data.user;
}

function loadCurrentUser(options = {}) {
  // signInWithPassword triggers onAuthStateChange while the login handler also
  // continues. Reuse the same load so profile/stat queries are not executed
  // twice in parallel. The same guard handles INITIAL_SESSION during boot.
  if (CURRENT_USER_LOAD_PROMISE) return CURRENT_USER_LOAD_PROMISE;

  CURRENT_USER_LOAD_PROMISE = performCurrentUserLoad(options).finally(() => {
    CURRENT_USER_LOAD_PROMISE = null;
  });

  return CURRENT_USER_LOAD_PROMISE;
}

/* ========= AUTH ACTIONS ========= */
async function handleSignup() {
  const email = authEmail?.value.trim().toLowerCase() || "";
  const password = authPassword?.value.trim() || "";
  const displayName = authDisplayName?.value.trim() || "";

  if (!email || !password) {
    setStatus(t("fill_email_password"), true);
    return;
  }

  setAuthLoading(true, t("signing_up"));

  try {
    const currentUser = await getActiveUser();

    if (currentUser?.email?.toLowerCase() === email) {
      setStatus(t("already_same_email"), true);
      return;
    }

    if (currentUser && currentUser.email?.toLowerCase() !== email) {
      await supabase.auth.signOut();
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split("@")[0]
        }
      }
    });

    if (error) {
      setStatus(t("signup_error", { error: error.message }), true);
      return;
    }

    if (!data?.session) {
      renderGuest();
      setStatus(t("signup_check_email"));
      return;
    }

    await loadCurrentUser();
  } catch (err) {
    console.error("handleSignup error:", err);
    setStatus(t("signup_error", { error: err.message || err }), true);
  } finally {
    setAuthLoading(false);
  }
}

async function handleLogin() {
  const email = authEmail?.value.trim().toLowerCase() || "";
  const password = authPassword?.value.trim() || "";

  if (!email || !password) {
    setStatus(t("fill_email_password"), true);
    return;
  }

  setAuthLoading(true, t("logging_in"));

  try {
    const currentUser = await getActiveUser();

    if (currentUser?.email?.toLowerCase() === email) {
      await loadCurrentUser({ force: true });
      setStatus(t("already_logged_this_account"));
      return;
    }

    if (currentUser && currentUser.email?.toLowerCase() !== email) {
      await supabase.auth.signOut();
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setStatus(t("login_error", { error: error.message }), true);
      return;
    }

    await loadCurrentUser();
  } catch (err) {
    console.error("handleLogin error:", err);
    setStatus(t("login_error", { error: err.message || err }), true);
  } finally {
    setAuthLoading(false);
  }
}

async function handleLogout() {
  setAuthLoading(true, t("logging_out"));

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setStatus(t("logout_error", { error: error.message }), true);
      return;
    }

    renderGuest();
    setStatus(t("logged_out"));
  } catch (err) {
    console.error("handleLogout error:", err);
    setStatus(t("logout_error", { error: err.message || err }), true);
  } finally {
    setAuthLoading(false);
  }
}


window.addEventListener("mh:community-profile-saved", () => {
  loadCurrentUser({ force: true }).catch((error) => {
    console.error("Profile refresh after community save failed:", error);
  });
});

/* ========= EVENT BINDING ========= */
loginBtn?.addEventListener("click", handleLogin);
signupBtn?.addEventListener("click", handleSignup);
logoutBtn?.addEventListener("click", handleLogout);

saveProfileBtn?.addEventListener("click", handleSaveProfile);
resetProfileBtn?.addEventListener("click", resetProfileData);
changePasswordBtn?.addEventListener("click", handleChangePassword);
deleteAccountBtn?.addEventListener("click", handleDeleteAccount);

supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    setTimeout(() => {
      loadCurrentUser().catch((err) => {
        console.error("loadCurrentUser after auth event error:", err);
        renderGuest();
        setStatus(t("auth_refresh_error", { error: err.message || err }), true);
      });
    }, 0);
  } else {
    renderGuest();
  }
});

/* ========= BOOT IMPORTANT ========= */
initializeProfileExperience({ lang: LANG });
applyProfileStaticTexts();
loadCurrentUser()
  .catch((err) => {
    console.error("Initial loadCurrentUser error:", err);
    renderGuest();
    setStatus(t("initial_load_error", { error: err.message || err }), true);
  })
  .finally(() => {
    window.MathHardLoading?.ready();
  });

window.addEventListener("storage", (e) => {
  if (e.key === "mh_lang") {
    LANG = localStorage.getItem("mh_lang") === "en" ? "en" : "ro";
    applyProfileStaticTexts();

    if (CURRENT_USER) {
      renderUser(CURRENT_USER, CURRENT_PROFILE_ROW);
      loadProfileStatsFromDb(CURRENT_USER.id).catch(console.error);
    } else {
      renderGuest();
    }
  }
}); 
// Return to the last MathHard workspace instead of always forcing Home.
try {
  const savedWorkspace = String(localStorage.getItem("mh_active_workspace_v1") || "dashboard")
    .replace(/^#/, "")
    .trim()
    .toLowerCase();
  const allowedWorkspaces = new Set([
    "dashboard", "roadmap", "lessons", "problems", "exams",
    "research", "history", "xp", "analytics", "gamification"
  ]);
  const route = allowedWorkspaces.has(savedWorkspace) ? savedWorkspace : "dashboard";
  const backHome = document.getElementById("backHomeBtn");
  const logo = document.querySelector('a.logo[href="/index.html"]');
  if (backHome) backHome.href = `/index.html#${route}`;
  if (logo) logo.href = `/index.html#${route}`;
} catch {
  // Navigation falls back to /index.html when storage is unavailable.
}
