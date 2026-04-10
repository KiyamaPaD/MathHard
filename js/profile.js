import { supabase } from "./supabase-client.js";

globalThis.supabase = supabase;
console.log("PROFILE.JS LOADED v4");

const $ = (id) => document.getElementById(id);

/* ========= LANGUAGE / I18N ========= */
let LANG =
  localStorage.getItem("mh_lang") === "en" ? "en" : "ro";

const PROFILE_TEXT = {
  ro: {
    page_title: "MathHard — Profilul tău",

    logo_slogan: "Profilul tău",
    back_home: "⬅️ Înapoi acasă",

    account_kicker: "MathHard Account",
    visitor: "Vizitator",
    not_logged_yet: "Nu ești logat încă.",

    badge_lessons: "📘 Lecții",
    badge_problems: "🧩 Probleme",
    badge_xp: "⚡ XP",
    badge_exams: "🏆 Examene",

    auth_title: "Contul tău",
    auth_text_guest: "Creează-ți cont sau intră în contul tău ca să-ți păstrezi progresul.",
    auth_text_connected: "Contul tău este conectat.",

    email_label: "Email",
    password_label: "Parolă",
    display_name_signup_label: "Nume afișat (doar pentru signup)",

    password_placeholder: "Parola ta",
    display_name_signup_placeholder: "ex: Cristi",

    login_btn: "🔑 Login",
    signup_btn: "✨ Sign up",
    logout_btn: "🚪 Logout",

    status_label: "Status:",
    status_guest: "Guest",
    status_logged_in: "Logat",

    solved_label: "✅ Probleme rezolvate",
    learned_label: "📘 Lecții învățate",
    passed_label: "🏆 Examene promovate",
    xp_total_label: "⚡ XP total",

    account_data_title: "👤 Date cont",
    info_display_name: "Nume afișat",
    info_email: "Email",
    info_confirmed: "Email confirmat",
    info_provider: "Provider",
    info_user_id: "User ID",

    progress_title: "📈 Rezumat progres",
    progress_lessons: "Lecții învățate",
    progress_problems: "Probleme rezolvate",
    progress_exams: "Examene promovate",
    avg_xp: "XP mediu / problemă rezolvată",

    detailed_title: "📊 Statistici detaliate",
    detail_solved: "Probleme rezolvate",
    detail_wrong: "Probleme greșite",
    detail_unsolved: "Probleme nerezolvate",
    detail_lessons_learned: "Lecții învățate",
    detail_lessons_unlearned: "Lecții neînvățate",
    detail_exams_passed: "Examene promovate",
    detail_exams_unpassed: "Examene încercate, dar nepromovate",
    detail_exams_unattempted: "Examene neîncercate",

    next_title: "🧭 Ce urmează",
    next_lesson: "Următoarea lecție",
    next_chapter: "Următorul capitol",
    next_exam: "Următorul examen recomandat",

    recent_title: "🕘 Activitate recentă",
    recent_lesson: "Ultima lecție",
    recent_problem: "Ultima problemă rezolvată",
    recent_exam: "Ultimul examen",

    extra_exam_title: "🧪 Extra stats examene",
    best_exam: "Cel mai bun examen",
    exam_attempts: "Încercări totale la examene",
    last_exam_score: "Ultimul scor de examen",

    settings_title: "🛠 Cont & setări profil",
    settings_text: "Aici îți poți modifica numele afișat, poza de profil și parola contului tău.",
    edit_display_name: "Nume afișat",
    edit_avatar_url: "Avatar URL (opțional)",
    edit_new_password: "Parolă nouă",

    edit_display_name_placeholder: "ex: Cristi",
    edit_avatar_url_placeholder: "https://...",
    edit_new_password_placeholder: "Noua parolă",

    save_profile_btn: "💾 Salvează profilul",
    reset_profile_btn: "♻️ Reset profil",
    change_password_btn: "🔒 Schimbă parola",
    delete_account_btn: "🗑 Șterge contul complet",

    yes: "Da",
    no: "Nu",
    fallback_user: "User",

    processing: "Se procesează...",
    must_login: "Trebuie să fii logat.",
    display_name_empty: "Numele afișat nu poate fi gol.",
    saving_profile: "Se salvează profilul...",
    profile_updated: "Profil actualizat.",
    save_profile_error: "Nu am putut salva profilul: {error}",

    new_password_short: "Parola nouă trebuie să aibă minim 6 caractere.",
    changing_password: "Se schimbă parola...",
    password_changed: "Parola a fost schimbată.",
    password_change_error: "Eroare la schimbarea parolei: {error}",

    reset_confirm: "Sigur vrei să resetezi datele profilului? Numele afișat va reveni la fallback-ul din email și avatarul va fi golit.",
    resetting_profile: "Se resetează profilul...",
    profile_reset: "Profil resetat.",
    profile_reset_error: "Nu am putut reseta profilul: {error}",

    delete_confirm: "Sigur vrei să ștergi contul complet? Această acțiune este ireversibilă.",
    deleting_account: "Se șterge contul...",
    delete_unconfirmed: "Funcția nu a confirmat ștergerea contului.",
    account_deleted: "Cont șters complet.",
    delete_error: "Eroare delete account: {error}",

    fill_email_password: "Completează emailul și parola.",
    signing_up: "Se creează contul...",
    already_same_email: "Ești deja logat cu acest email. Pentru cont nou, folosește alt email.",
    signup_error: "Eroare signup: {error}",
    signup_check_email: "Cont creat. Verifică emailul pentru confirmare, apoi fă login.",

    logging_in: "Se face login...",
    already_logged_this_account: "Ești deja logat cu acest cont.",
    login_error: "Eroare login: {error}",

    logging_out: "Se face logout...",
    logged_out: "Te-ai delogat.",
    logout_error: "Eroare logout: {error}",

    auth_success: "Autentificat cu succes.",
    progress_load_error: "Logat, dar progresul nu a putut fi încărcat: {error}",
    auth_refresh_error: "Eroare la refresh auth: {error}",
    initial_load_error: "Eroare la încărcarea profilului: {error}",

    all_lessons_done: "Ai terminat toate lecțiile 🎉",
    nothing_left: "Nimic restant",
    retry_exam: "Reîncearcă: {exam}",
    all_exams_done: "Ai terminat toate examenele 🎉",

    best_word: "scor maxim",
    last_word: "ultimul scor"
  },

  en: {
    page_title: "MathHard — Your profile",

    logo_slogan: "Your profile",
    back_home: "⬅️ Back home",

    account_kicker: "MathHard Account",
    visitor: "Visitor",
    not_logged_yet: "You are not logged in yet.",

    badge_lessons: "📘 Lessons",
    badge_problems: "🧩 Problems",
    badge_xp: "⚡ XP",
    badge_exams: "🏆 Exams",

    auth_title: "Your account",
    auth_text_guest: "Create an account or log into your account to keep your progress.",
    auth_text_connected: "Your account is connected.",

    email_label: "Email",
    password_label: "Password",
    display_name_signup_label: "Display name (signup only)",

    password_placeholder: "Your password",
    display_name_signup_placeholder: "e.g. Cristi",

    login_btn: "🔑 Login",
    signup_btn: "✨ Sign up",
    logout_btn: "🚪 Logout",

    status_label: "Status:",
    status_guest: "Guest",
    status_logged_in: "Logged in",

    solved_label: "✅ Problems solved",
    learned_label: "📘 Lessons learned",
    passed_label: "🏆 Exams passed",
    xp_total_label: "⚡ Total XP",

    account_data_title: "👤 Account details",
    info_display_name: "Display name",
    info_email: "Email",
    info_confirmed: "Email confirmed",
    info_provider: "Provider",
    info_user_id: "User ID",

    progress_title: "📈 Progress summary",
    progress_lessons: "Lessons learned",
    progress_problems: "Problems solved",
    progress_exams: "Exams passed",
    avg_xp: "Average XP / solved problem",

    detailed_title: "📊 Detailed stats",
    detail_solved: "Problems solved",
    detail_wrong: "Wrong problems",
    detail_unsolved: "Unsolved problems",
    detail_lessons_learned: "Lessons learned",
    detail_lessons_unlearned: "Lessons not learned",
    detail_exams_passed: "Exams passed",
    detail_exams_unpassed: "Exams attempted but not passed",
    detail_exams_unattempted: "Exams not attempted",

    next_title: "🧭 What's next",
    next_lesson: "Next lesson",
    next_chapter: "Next chapter",
    next_exam: "Next recommended exam",

    recent_title: "🕘 Recent activity",
    recent_lesson: "Latest lesson",
    recent_problem: "Latest solved problem",
    recent_exam: "Latest exam",

    extra_exam_title: "🧪 Extra exam stats",
    best_exam: "Best exam",
    exam_attempts: "Total exam attempts",
    last_exam_score: "Last exam score",

    settings_title: "🛠 Account & profile settings",
    settings_text: "Here you can change your display name, profile picture, and account password.",
    edit_display_name: "Display name",
    edit_avatar_url: "Avatar URL (optional)",
    edit_new_password: "New password",

    edit_display_name_placeholder: "e.g. Cristi",
    edit_avatar_url_placeholder: "https://...",
    edit_new_password_placeholder: "New password",

    save_profile_btn: "💾 Save profile",
    reset_profile_btn: "♻️ Reset profile",
    change_password_btn: "🔒 Change password",
    delete_account_btn: "🗑 Delete account completely",

    yes: "Yes",
    no: "No",
    fallback_user: "User",

    processing: "Processing...",
    must_login: "You must be logged in.",
    display_name_empty: "Display name cannot be empty.",
    saving_profile: "Saving profile...",
    profile_updated: "Profile updated.",
    save_profile_error: "Could not save profile: {error}",

    new_password_short: "The new password must be at least 6 characters long.",
    changing_password: "Changing password...",
    password_changed: "Password changed.",
    password_change_error: "Password change error: {error}",

    reset_confirm: "Are you sure you want to reset your profile data? Your display name will fall back to the email and the avatar will be cleared.",
    resetting_profile: "Resetting profile...",
    profile_reset: "Profile reset.",
    profile_reset_error: "Could not reset profile: {error}",

    delete_confirm: "Are you sure you want to delete the entire account? This action is irreversible.",
    deleting_account: "Deleting account...",
    delete_unconfirmed: "The function did not confirm account deletion.",
    account_deleted: "Account deleted completely.",
    delete_error: "Delete account error: {error}",

    fill_email_password: "Fill in email and password.",
    signing_up: "Creating account...",
    already_same_email: "You are already logged in with this email. Use another email for a new account.",
    signup_error: "Signup error: {error}",
    signup_check_email: "Account created. Check your email for confirmation, then log in.",

    logging_in: "Logging in...",
    already_logged_this_account: "You are already logged into this account.",
    login_error: "Login error: {error}",

    logging_out: "Logging out...",
    logged_out: "You have logged out.",
    logout_error: "Logout error: {error}",

    auth_success: "Authenticated successfully.",
    progress_load_error: "Logged in, but progress could not be loaded: {error}",
    auth_refresh_error: "Auth refresh error: {error}",
    initial_load_error: "Profile loading error: {error}",

    all_lessons_done: "You finished all lessons 🎉",
    nothing_left: "Nothing left",
    retry_exam: "Retry: {exam}",
    all_exams_done: "You finished all exams 🎉",

    best_word: "best",
    last_word: "last"
  }
};

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

function renderAvatar(displayName, avatarUrl = "") {
  if (!profileAvatar) return;

  const url = String(avatarUrl || "").trim();

  if (url) {
    profileAvatar.innerHTML = `<img src="${url}" alt="Avatar" class="profile-avatar-img">`;
    return;
  }

  profileAvatar.textContent = getInitialLetter(displayName);
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

  const backHomeBtn = document.querySelector('.header-actions a[href="/index.html"]');
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

  const payload = {
    id: user.id,
    display_name:
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "User"
  };

  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  if (upsertError) {
    console.error("ensureProfileRow upsert error:", upsertError);
    throw upsertError;
  }

  return loadProfileRow(user.id);
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
    const avatarUrl = editAvatarUrl?.value.trim() || null;

    if (!displayName) {
      setStatus(t("display_name_empty"), true);
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

/* ========= CATALOG TOTALS ========= */
async function loadJsonDataForTotals() {
  try {
    const resp = await fetch("/data/problems.json", {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!resp.ok) {
      return { lessons: [], problems: [], exams: [] };
    }

    const json = await resp.json();

    return {
      lessons: Array.isArray(json.lessons) ? json.lessons : [],
      problems: Array.isArray(json.problems) ? json.problems : [],
      exams: Array.isArray(json.exams) ? json.exams : []
    };
  } catch (err) {
    console.warn("Nu am putut încărca problems.json pentru totaluri:", err);
    return { lessons: [], problems: [], exams: [] };
  }
}

function uniqueIdCount(items) {
  return new Set(
    (items || [])
      .map((item) => item?.id)
      .filter(Boolean)
  ).size;
}

function getBaseCatalogData() {
  const source =
    (typeof DATA !== "undefined" && DATA) ||
    globalThis.DATA ||
    window.DATA ||
    {};

  return {
    lessons: Array.isArray(source.lessons) ? source.lessons : [],
    problems: Array.isArray(source.problems) ? source.problems : [],
    exams: Array.isArray(source.exams) ? source.exams : []
  };
}

async function loadContentTotals() {
  try {
    const {
      lessons: baseLessons,
      problems: baseProblems,
      exams: baseExams
    } = getBaseCatalogData();

    const jsonData = await loadJsonDataForTotals();

    const [
      { data: supaLessons, error: lessonsError },
      { data: supaProblems, error: problemsError },
      { data: supaExams, error: examsError }
    ] = await Promise.all([
      supabase.from("mh_lessons").select("id"),
      supabase.from("mh_problems").select("id"),
      supabase.from("mh_exams").select("id")
    ]);

    if (lessonsError) throw lessonsError;
    if (problemsError) throw problemsError;
    if (examsError) throw examsError;

    return {
      lessonsTotal: uniqueIdCount([
        ...baseLessons,
        ...jsonData.lessons,
        ...(supaLessons || [])
      ]),
      problemsTotal: uniqueIdCount([
        ...baseProblems,
        ...jsonData.problems,
        ...(supaProblems || [])
      ]),
      examsTotal: uniqueIdCount([
        ...baseExams,
        ...jsonData.exams,
        ...(supaExams || [])
      ])
    };
  } catch (err) {
    console.warn("Nu am putut încărca totalurile de conținut:", err);
    return {
      lessonsTotal: 0,
      problemsTotal: 0,
      examsTotal: 0
    };
  }
}

function mergeUniqueById(...groups) {
  const map = new Map();

  for (const group of groups) {
    for (const item of group || []) {
      if (!item?.id) continue;
      map.set(item.id, { ...(map.get(item.id) || {}), ...item });
    }
  }

  return [...map.values()];
}

const PROFILE_GRADE_ORDER = [
  "V", "VI", "VII", "VIII",
  "IX", "X", "XI", "XII",
  "OL-V", "OL-VI", "OL-VII", "OL-VIII",
  "OL-IX", "OL-X", "OL-XI", "OL-XII",
  "EN", "BAC", "ADM", "FAC", "RES"
];

function profileGradeIndex(grade) {
  const idx = PROFILE_GRADE_ORDER.indexOf(String(grade || "").trim());
  return idx === -1 ? 999 : idx;
}

function sortLessonsForProfile(lessons) {
  return [...(lessons || [])].sort((a, b) => {
    const g = profileGradeIndex(a.grade) - profileGradeIndex(b.grade);
    if (g !== 0) return g;

    const ch = String(a.chapter || "").localeCompare(String(b.chapter || ""), LANG === "ro" ? "ro" : "en");
    if (ch !== 0) return ch;

    const ta = String(a.title_ro || a.title_en || a.id || "");
    const tb = String(b.title_ro || b.title_en || b.id || "");
    return ta.localeCompare(tb, LANG === "ro" ? "ro" : "en");
  });
}

const PROFILE_EXAM_TYPE_ORDER = ["EN", "BAC", "ADM"];

function profileExamTypeIndex(type) {
  const idx = PROFILE_EXAM_TYPE_ORDER.indexOf(String(type || "").trim().toUpperCase());
  return idx === -1 ? 999 : idx;
}

function sortExamsForProfile(exams) {
  return [...(exams || [])].sort((a, b) => {
    const t = profileExamTypeIndex(a.type) - profileExamTypeIndex(b.type);
    if (t !== 0) return t;

    const y = Number(b.year || 0) - Number(a.year || 0);
    if (y !== 0) return y;

    const ta = String(a.title_ro || a.title_en || a.id || "");
    const tb = String(b.title_ro || b.title_en || b.id || "");
    return ta.localeCompare(tb, LANG === "ro" ? "ro" : "en");
  });
}

function formatExamLabel(exam) {
  if (!exam) return "—";

  const title =
    LANG === "ro"
      ? (exam.title_ro || exam.title_en || exam.id || "Examen")
      : (exam.title_en || exam.title_ro || exam.id || "Exam");

  const bits = [exam.type, exam.year].filter(Boolean);

  return bits.length ? `${title} (${bits.join(" • ")})` : title;
}

async function loadMergedCatalog() {
  const {
    lessons: baseLessons,
    problems: baseProblems,
    exams: baseExams
  } = getBaseCatalogData();

  const jsonData = await loadJsonDataForTotals();

  const [
    { data: supaLessons, error: lessonsError },
    { data: supaProblems, error: problemsError },
    { data: supaExams, error: examsError }
  ] = await Promise.all([
    supabase
      .from("mh_lessons")
      .select("id, grade, chapter, title_ro, title_en"),
    supabase
      .from("mh_problems")
      .select("id, lesson_id, title_ro, title_en"),
    supabase
      .from("mh_exams")
      .select("id, type, year, title_ro, title_en"),
  ]);

  if (lessonsError) throw lessonsError;
  if (problemsError) throw problemsError;
  if (examsError) throw examsError;

  const lessons = mergeUniqueById(
    baseLessons,
    jsonData.lessons,
    supaLessons || []
  );

  const problems = mergeUniqueById(
    baseProblems,
    jsonData.problems,
    (supaProblems || []).map((p) => ({
      ...p,
      lessonId: p.lesson_id || ""
    }))
  );

  const exams = mergeUniqueById(
    baseExams,
    jsonData.exams,
    supaExams || []
  );

  return {
    lessons: sortLessonsForProfile(lessons),
    problems,
    exams: sortExamsForProfile(exams)
  };
}

/* ========= PROFILE STATS ========= */
async function loadProfileStatsFromDb(userId) {
  try {
    const [
      { data: lessonRows, error: lessonError },
      { data: problemRows, error: problemError },
      { data: examRows, error: examError },
      catalog,
      totals
    ] = await Promise.all([
      supabase
        .from("user_lesson_progress")
        .select("lesson_id, learned, learned_at, updated_at")
        .eq("user_id", userId),

      supabase
        .from("user_problem_progress")
        .select("problem_id, solved, wrong_attempts, xp_earned, solved_at, updated_at")
        .eq("user_id", userId),

      supabase
        .from("user_exam_progress")
        .select("exam_id, passed, best_score, last_score, attempts_count, passed_at, started_at, updated_at")
        .eq("user_id", userId),

      loadMergedCatalog(),
      loadContentTotals()
    ]);

    if (lessonError) throw lessonError;
    if (problemError) throw problemError;
    if (examError) throw examError;

    const learnedRows = (lessonRows || []).filter((row) => row.learned);
    const solvedRows = (problemRows || []).filter((row) => row.solved);
    const wrongRows = (problemRows || []).filter(
      (row) => !row.solved && Number(row.wrong_attempts || 0) > 0
    );
    const passedRows = (examRows || []).filter((row) => row.passed);
    const failedRows = (examRows || []).filter(
      (row) => !row.passed
    );

    const learned = learnedRows.length;
    const solved = solvedRows.length;
    const wrong = wrongRows.length;
    const passed = passedRows.length;
    const failed = failedRows.length;

    const lessonsTotal = Number(totals.lessonsTotal || 0);
    const problemsTotal = Number(totals.problemsTotal || 0);
    const examsTotal = Number(totals.examsTotal || 0);

    const unresolved = Math.max(0, problemsTotal - solved - wrong);
    const unlearned = Math.max(0, lessonsTotal - learned);
    const unattempted = Math.max(0, examsTotal - passed - failed);

    const xpTotal = solvedRows.reduce((sum, row) => {
      return sum + Number(row.xp_earned || 0);
    }, 0);

    const avgXp = solved > 0 ? (xpTotal / solved).toFixed(2) : "0";

    safeText(profileSolved, String(solved));
    safeText(profileLearned, String(learned));
    safeText(profilePassed, String(passed));
    safeText(profileXP, String(xpTotal));
    safeText(profileAvgXpText, String(avgXp));

    setProgress(profileLessonsProgressBar, profileLessonsProgressText, learned, lessonsTotal);
    setProgress(profileProblemsProgressBar, profileProblemsProgressText, solved, problemsTotal);
    setProgress(profileExamsProgressBar, profileExamsProgressText, passed, examsTotal);

    safeText(detailProblemsSolved, String(solved));
    safeText(detailProblemsWrong, String(wrong));
    safeText(detailProblemsUnseen, String(unresolved));

    safeText(detailLessonsLearned, String(learned));
    safeText(detailLessonsUnlearned, String(unlearned));

    safeText(detailExamsPassed, String(passed));
    safeText(detailExamsUnpassed, String(failed));
    safeText(detailExamsUnattempted, String(unattempted));

    const learnedIds = new Set(
      learnedRows.map((row) => row.lesson_id).filter(Boolean)
    );

    const nextLesson =
      catalog.lessons.find((lesson) => !learnedIds.has(lesson.id)) || null;

    safeText(
      nextLessonText,
      nextLesson
        ? (LANG === "ro"
            ? (nextLesson.title_ro || nextLesson.title_en || nextLesson.id)
            : (nextLesson.title_en || nextLesson.title_ro || nextLesson.id))
        : t("all_lessons_done")
    );

    safeText(
      nextChapterText,
      nextLesson
        ? `${nextLesson.grade || "—"} • ${nextLesson.chapter || "—"}`
        : t("nothing_left")
    );

    const attemptedExamIds = new Set(
      (examRows || [])
        .map(row => row.exam_id)
        .filter(Boolean)
    );

  const failedExamRowsSorted = [...failedRows].sort((a, b) => {
    return Number(b.best_score || 0) - Number(a.best_score || 0);
  });

  const retryRecommendedExam =
    catalog.exams.find(ex => ex.id === failedExamRowsSorted[0]?.exam_id) || null;

  const newRecommendedExam =
    catalog.exams.find(ex => !attemptedExamIds.has(ex.id)) || null;

  const recommendedExam = retryRecommendedExam || newRecommendedExam || null;

  safeText(
    nextExamText,
    recommendedExam
      ? (
          retryRecommendedExam
            ? t("retry_exam", { exam: formatExamLabel(recommendedExam) })
            : formatExamLabel(recommendedExam)
        )
      : t("all_exams_done")
  );

    /* ===== RECENT ACTIVITY ===== */
    const lessonById = new Map(catalog.lessons.map((x) => [x.id, x]));
    const problemById = new Map(catalog.problems.map((x) => [x.id, x]));
    const examById = new Map(catalog.exams.map((x) => [x.id, x]));

    const sortedLearnedRows = [...learnedRows].sort((a, b) => {
      return new Date(b.learned_at || b.updated_at || 0) - new Date(a.learned_at || a.updated_at || 0);
    });

    const sortedSolvedRows = [...solvedRows].sort((a, b) => {
      return new Date(b.solved_at || b.updated_at || 0) - new Date(a.solved_at || a.updated_at || 0);
    });

    const sortedExamRows = [...(examRows || [])].sort((a, b) => {
      const ta = new Date(a.passed_at || a.updated_at || a.started_at || 0).getTime();
      const tb = new Date(b.passed_at || b.updated_at || b.started_at || 0).getTime();
      return tb - ta;
    });

    const recentLessonRow = sortedLearnedRows[0] || null;
    const recentProblemRow = sortedSolvedRows[0] || null;
    const recentExamRow = sortedExamRows[0] || null;

    const recentLesson = recentLessonRow ? lessonById.get(recentLessonRow.lesson_id) : null;
    const recentProblem = recentProblemRow ? problemById.get(recentProblemRow.problem_id) : null;
    const recentExam = recentExamRow ? examById.get(recentExamRow.exam_id) : null;

    safeText(
      profileRecentLesson,
      recentLesson
        ? `${LANG === "ro"
  ? (recentLesson.title_ro || recentLesson.title_en || recentLesson.id)
  : (recentLesson.title_en || recentLesson.title_ro || recentLesson.id)} • ${formatDateTime(recentLessonRow.learned_at || recentLessonRow.updated_at)}`
        : "—"
    );

    safeText(
      profileRecentProblem,
      recentProblem
        ? `${LANG === "ro"
  ? (recentProblem.title_ro || recentProblem.title_en || recentProblem.id)
  : (recentProblem.title_en || recentProblem.title_ro || recentProblem.id)} • ${formatDateTime(recentProblemRow.solved_at || recentProblemRow.updated_at)}`
        : "—"
    );

    safeText(
      profileRecentExam,
      recentExam
        ? `${LANG === "ro"
  ? (recentExam.title_ro || recentExam.title_en || recentExam.id)
  : (recentExam.title_en || recentExam.title_ro || recentExam.id)} • ${formatDateTime(recentExamRow.passed_at || recentExamRow.updated_at || recentExamRow.started_at)}`
        : "—"
    );

    /* ===== EXAM EXTRA STATS ===== */
    const bestExamRow = [...(examRows || [])].sort(
      (a, b) => Number(b.best_score || 0) - Number(a.best_score || 0)
    )[0] || null;

    const totalExamAttempts = (examRows || []).reduce(
      (sum, row) => sum + Number(row.attempts_count || 0),
      0
    );

    const lastExamScoreRow = sortedExamRows[0] || null;

    safeText(
      profileBestExam,
      bestExamRow
        ? `${LANG === "ro"
            ? (examById.get(bestExamRow.exam_id)?.title_ro || examById.get(bestExamRow.exam_id)?.title_en || bestExamRow.exam_id)
            : (examById.get(bestExamRow.exam_id)?.title_en || examById.get(bestExamRow.exam_id)?.title_ro || bestExamRow.exam_id)
          } • ${t("best_word")} ${formatScore(bestExamRow.best_score)}`
        : "—"
    );

    safeText(profileExamAttempts, String(totalExamAttempts));

    safeText(
      profileExamLastScore,
      lastExamScoreRow
        ? `${LANG === "ro"
            ? (examById.get(lastExamScoreRow.exam_id)?.title_ro || examById.get(lastExamScoreRow.exam_id)?.title_en || lastExamScoreRow.exam_id)
            : (examById.get(lastExamScoreRow.exam_id)?.title_en || examById.get(lastExamScoreRow.exam_id)?.title_ro || lastExamScoreRow.exam_id)
          } • ${t("last_word")} ${formatScore(lastExamScoreRow.last_score)}`
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
async function loadCurrentUser() {
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

  return data.user;
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
      await loadCurrentUser();
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