import { supabase } from "./supabase-client.js";
import { loadContentCatalog } from "./content-repository.js";
import { PROFILE_TEXT } from "./profile-text.js";
import {
  buildProfileStats,
  formatExamLabel,
  localizedTitle,
  sortExamsForProfile,
  sortLessonsForProfile
} from "./profile-model.js";

globalThis.supabase = supabase;
console.log("PROFILE.JS LOADED v5");

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
const profileInfoProvider = $("profileInfoProvider");
const profileInfoId = $("profileInfoId");

/* ========= PROGRESS SUMMARY ========= */
const profileLessonsProgressText = $("profileLessonsProgressText");
const profileProblemsProgressText = $("profileProblemsProgressText");
const profileExamsProgressText = $("profileExamsProgressText");

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
const detailProblemsWrong = $("detailProblemsWrong");
const detailProblemsUnseen = $("detailProblemsUnseen");

const detailLessonsLearned = $("detailLessonsLearned");
const detailLessonsUnlearned = $("detailLessonsUnlearned");

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
  safeText(profileLearned, "0");
  safeText(profilePassed, "0");
  safeText(profileXP, "0");
  safeText(profileAvgXpText, "0");
}

function setEmptyDetailedSummary() {
  safeText(detailProblemsSolved, "0");
  safeText(detailProblemsWrong, "0");
  safeText(detailProblemsUnseen, "0");

  safeText(detailLessonsLearned, "0");
  safeText(detailLessonsUnlearned, "0");

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
  safeText(profileInfoProvider, "—");
  safeText(profileInfoId, "—");

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
  safeText(profileInfoProvider, user.app_metadata?.provider || "email");
  safeText(profileInfoId, user.id || "—");
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

  const kicker = document.querySelector(".profile-kicker");
  if (kicker) kicker.textContent = t("account_kicker");

  const badges = document.querySelectorAll(".profile-badge");
  if (badges[0]) badges[0].textContent = t("badge_lessons");
  if (badges[1]) badges[1].textContent = t("badge_problems");
  if (badges[2]) badges[2].textContent = t("badge_xp");
  if (badges[3]) badges[3].textContent = t("badge_exams");

  const authTitle = document.querySelector(".profile-auth-title");
  if (authTitle) authTitle.textContent = t("auth_title");

  const authLabels = document.querySelectorAll("#authForm .profile-field span");
  if (authLabels[0]) authLabels[0].textContent = t("email_label");
  if (authLabels[1]) authLabels[1].textContent = t("password_label");
  if (authLabels[2]) authLabels[2].textContent = t("display_name_signup_label");

  if (authEmail) authEmail.placeholder = "email@example.com";
  if (authPassword) authPassword.placeholder = t("password_placeholder");
  if (authDisplayName) authDisplayName.placeholder = t("display_name_signup_placeholder");

  if (loginBtn) loginBtn.textContent = t("login_btn");
  if (signupBtn) signupBtn.textContent = t("signup_btn");
  if (logoutBtn) logoutBtn.textContent = t("logout_btn");

  const userStatusLabel = document.querySelector(".profile-user-label");
  if (userStatusLabel) userStatusLabel.textContent = t("status_label");

  const statLabels = document.querySelectorAll(".profile-stat-label");
  if (statLabels[0]) statLabels[0].textContent = t("solved_label");
  if (statLabels[1]) statLabels[1].textContent = t("learned_label");
  if (statLabels[2]) statLabels[2].textContent = t("passed_label");
  if (statLabels[3]) statLabels[3].textContent = t("xp_total_label");

  const panelTitles = document.querySelectorAll(".profile-panel h2");
  if (panelTitles[0]) panelTitles[0].textContent = t("account_data_title");
  if (panelTitles[1]) panelTitles[1].textContent = t("progress_title");
  if (panelTitles[2]) panelTitles[2].textContent = t("detailed_title");
  if (panelTitles[3]) panelTitles[3].textContent = t("next_title");
  if (panelTitles[4]) panelTitles[4].textContent = t("recent_title");
  if (panelTitles[5]) panelTitles[5].textContent = t("extra_exam_title");
  if (panelTitles[6]) panelTitles[6].textContent = t("settings_title");

  const infoLabels = document.querySelectorAll(".profile-info-label");
  if (infoLabels[0]) infoLabels[0].textContent = t("info_display_name");
  if (infoLabels[1]) infoLabels[1].textContent = t("info_email");
  if (infoLabels[2]) infoLabels[2].textContent = t("info_confirmed");
  if (infoLabels[3]) infoLabels[3].textContent = t("info_provider");
  if (infoLabels[4]) infoLabels[4].textContent = t("info_user_id");

  if (infoLabels[5]) infoLabels[5].textContent = t("avg_xp");

  if (infoLabels[6]) infoLabels[6].textContent = t("detail_solved");
  if (infoLabels[7]) infoLabels[7].textContent = t("detail_wrong");
  if (infoLabels[8]) infoLabels[8].textContent = t("detail_unsolved");
  if (infoLabels[9]) infoLabels[9].textContent = t("detail_lessons_learned");
  if (infoLabels[10]) infoLabels[10].textContent = t("detail_lessons_unlearned");
  if (infoLabels[11]) infoLabels[11].textContent = t("detail_exams_passed");
  if (infoLabels[12]) infoLabels[12].textContent = t("detail_exams_unpassed");
  if (infoLabels[13]) infoLabels[13].textContent = t("detail_exams_unattempted");

  if (infoLabels[14]) infoLabels[14].textContent = t("next_lesson");
  if (infoLabels[15]) infoLabels[15].textContent = t("next_chapter");
  if (infoLabels[16]) infoLabels[16].textContent = t("next_exam");

  if (infoLabels[17]) infoLabels[17].textContent = t("recent_lesson");
  if (infoLabels[18]) infoLabels[18].textContent = t("recent_problem");
  if (infoLabels[19]) infoLabels[19].textContent = t("recent_exam");

  if (infoLabels[20]) infoLabels[20].textContent = t("best_exam");
  if (infoLabels[21]) infoLabels[21].textContent = t("exam_attempts");
  if (infoLabels[22]) infoLabels[22].textContent = t("last_exam_score");

  const progressHeads = document.querySelectorAll(".profile-progress-head span");
  if (progressHeads[0]) progressHeads[0].textContent = t("progress_lessons");
  if (progressHeads[1]) progressHeads[1].textContent = t("progress_problems");
  if (progressHeads[2]) progressHeads[2].textContent = t("progress_exams");

  const profileMuted = document.querySelector(".profile-muted");
  if (profileMuted) profileMuted.textContent = t("settings_text");

  const editLabels = document.querySelectorAll(".profile-edit-form .profile-field span");
  if (editLabels[0]) editLabels[0].textContent = t("edit_display_name");
  if (editLabels[1]) editLabels[1].textContent = t("edit_avatar_url");
  if (editLabels[2]) editLabels[2].textContent = t("edit_new_password");

  if (editDisplayName) editDisplayName.placeholder = t("edit_display_name_placeholder");
  if (editAvatarUrl) editAvatarUrl.placeholder = t("edit_avatar_url_placeholder");
  if (newPassword) newPassword.placeholder = t("edit_new_password_placeholder");

  if (saveProfileBtn) saveProfileBtn.textContent = t("save_profile_btn");
  if (resetProfileBtn) resetProfileBtn.textContent = t("reset_profile_btn");
  if (changePasswordBtn) changePasswordBtn.textContent = t("change_password_btn");
  if (deleteAccountBtn) deleteAccountBtn.textContent = t("delete_account_btn");
}

/* ========= RENDER ========= */
function renderGuest() {
  CURRENT_USER = null;
  CURRENT_PROFILE_ROW = null;
  LAST_LOADED_USER_ID = null;

  applyProfileStaticTexts();

  safeText(profileName, t("visitor"));
  safeText(profileEmail, t("not_logged_yet"));
  safeText(profileUserStatus, t("status_guest"));
  renderAvatar("M", "");

  if (authForm) authForm.style.display = "flex";
  if (profileUserBox) profileUserBox.style.display = "none";

  if (authText) {
    authText.textContent = t("auth_text_guest");
  }

  clearProfileEditor();
  setZeroStats();
  setEmptyAccountInfo();
  setEmptyDetailedSummary();
  setStatus("");
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
  if (profileUserBox) profileUserBox.style.display = "block";

  fillAccountInfo(user, profileRow);
  fillProfileEditor(user, profileRow);

  if (authText) {
    authText.textContent = t("auth_text_connected");
  }
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

    console.log("DELETE FUNCTION RESULT:", { data, error });

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
      catalog
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
      loadMergedCatalog()
    ]);

    if (lessonError) console.warn("Could not load lesson progress for profile:", lessonError);
    if (problemError) console.warn("Could not load problem progress for profile:", problemError);
    if (examError) console.warn("Could not load exam progress for profile:", examError);

    const stats = buildProfileStats({
      lessonRows: lessonError ? [] : (lessonRows || []),
      problemRows: problemError ? [] : (problemRows || []),
      examRows: examError ? [] : (examRows || []),
      catalog,
      lang: LANG
    });

    const { counts, totals, recent, exams } = stats;

    safeText(profileSolved, String(counts.solved));
    safeText(profileLearned, String(counts.learned));
    safeText(profilePassed, String(counts.passed));
    safeText(profileXP, String(counts.xpTotal));
    safeText(profileAvgXpText, String(counts.avgXp));

    setProgress(profileLessonsProgressBar, profileLessonsProgressText, counts.learned, totals.lessons);
    setProgress(profileProblemsProgressBar, profileProblemsProgressText, counts.solved, totals.problems);
    setProgress(profileExamsProgressBar, profileExamsProgressText, counts.passed, totals.exams);

    safeText(detailProblemsSolved, String(counts.solved));
    safeText(detailProblemsWrong, String(counts.wrong));
    safeText(detailProblemsUnseen, String(counts.unresolved));
    safeText(detailLessonsLearned, String(counts.learned));
    safeText(detailLessonsUnlearned, String(counts.unlearned));
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
  } catch (err) {
    console.error("Eroare la încărcarea progresului:", err);
    setZeroStats();
    setEmptyDetailedSummary();
    setProgress(profileLessonsProgressBar, profileLessonsProgressText, 0, 0);
    setProgress(profileProblemsProgressBar, profileProblemsProgressText, 0, 0);
    setProgress(profileExamsProgressBar, profileExamsProgressText, 0, 0);
    throw err;
  }
}

/* ========= CURRENT USER LOADER ========= */
async function performCurrentUserLoad({ force = false } = {}) {
  const { data, error } = await supabase.auth.getUser();

  console.log("GET USER RESULT:", {
    email: data?.user?.email || null,
    id: data?.user?.id || null,
    error: error?.message || null
  });

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
    await loadProfileStatsFromDb(data.user.id);
    setStatus(t("auth_success"));
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

    console.log("SIGNUP RESULT:", {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: error?.message || null
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

    console.log("LOGIN RESULT:", {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: error?.message || null
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

/* ========= EVENT BINDING ========= */
loginBtn?.addEventListener("click", handleLogin);
signupBtn?.addEventListener("click", handleSignup);
logoutBtn?.addEventListener("click", handleLogout);

saveProfileBtn?.addEventListener("click", handleSaveProfile);
resetProfileBtn?.addEventListener("click", resetProfileData);
changePasswordBtn?.addEventListener("click", handleChangePassword);
deleteAccountBtn?.addEventListener("click", handleDeleteAccount);

supabase.auth.onAuthStateChange((event, session) => {
  console.log("AUTH EVENT:", event, session);

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
applyProfileStaticTexts();
loadCurrentUser().catch((err) => {
  console.error("Initial loadCurrentUser error:", err);
  renderGuest();
  setStatus(t("initial_load_error", { error: err.message || err }), true);
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