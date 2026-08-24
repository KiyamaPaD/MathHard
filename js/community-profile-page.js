import { supabase } from "./supabase-client.js";
import {
  countryLabel,
  normalizeCommunityProfile,
  normalizeUsername
} from "./community-profile-model.js";
import { loadPublicCommunityProfile } from "./community-profile-repository.js";

const $ = (id) => document.getElementById(id);
const username = normalizeUsername(new URLSearchParams(location.search).get("u") || "");
const lang = localStorage.getItem("mh_lang") === "en" ? "en" : "ro";
const copy = lang === "en" ? {
  pageTitle: "MathHard — Public profile",
  metaDescription: "Public MathHard profile.",
  slogan: "Community",
  back: "Back",
  missingTitle: "Profile unavailable",
  missingText: "This profile is private, unavailable or the username is invalid.",
  progress: ["XP", "Level", "Lessons learned", "Problems solved", "Exams passed", "Streak"],
  sections: {
    progress: "Progress",
    education: "Education",
    mathematics: "Mathematics",
    badges: "Badges",
    achievements: "Achievements",
    links: "Links",
    activity: "Community"
  },
  education: ["Level", "Grade / year", "Study track", "Goal"],
  mathematics: ["Currently learning", "Favorite mathematician", "Favorite theorem", "Languages"],
  activity: ["Member since", "Last active"],
  locationSeparator: " · ",
  days: "days",
  copied: "Link copied",
  copyLink: "Copy link",
  leaderboards: "Leaderboards",
  portfolio: "Portfolio",
  report: "Report"
} : {
  pageTitle: "MathHard — Profil public",
  metaDescription: "Profil public MathHard.",
  slogan: "Comunitate",
  back: "Înapoi",
  missingTitle: "Profil indisponibil",
  missingText: "Profilul este privat, indisponibil sau numele de utilizator nu este valid.",
  progress: ["XP", "Nivel", "Lecții învățate", "Probleme rezolvate", "Examene promovate", "Serie"],
  sections: {
    progress: "Progres",
    education: "Educație",
    mathematics: "Matematică",
    badges: "Insigne",
    achievements: "Realizări",
    links: "Adrese",
    activity: "Comunitate"
  },
  education: ["Nivel", "Clasă / an", "Profil / specializare", "Obiectiv"],
  mathematics: ["Învăț acum", "Matematician favorit", "Teoremă favorită", "Limbi"],
  activity: ["Membru din", "Ultima activitate"],
  locationSeparator: " · ",
  days: "zile",
  copied: "Adresă copiată",
  copyLink: "Copiază adresa",
  leaderboards: "Clasamente",
  portfolio: "Portofoliu",
  report: "Raportează"
};

const LEARNING_STYLE_LABELS = lang === "en"
  ? { visual: "Visual", practice: "Practice-first", theory: "Theory-first", mixed: "Mixed" }
  : { visual: "Vizual", practice: "Prin exerciții", theory: "Teorie întâi", mixed: "Mixt" };
const COLLABORATION_LABELS = lang === "en"
  ? { studying: "Looking for study partners", helping: "Available to help", projects: "Open to projects", private: "Prefers individual work" }
  : { studying: "Caut colegi de studiu", helping: "Pot ajuta alți membri", projects: "Deschis la proiecte", private: "Prefer să lucrez individual" };

function applyStaticText() {
  document.documentElement.lang = lang;
  document.title = copy.pageTitle;
  if ($("communityPublicMeta")) $("communityPublicMeta").content = copy.metaDescription;
  const slogan = document.querySelector(".community-public-topbar .logo-slogan");
  if (slogan) slogan.textContent = copy.slogan;
  const back = document.querySelector('.community-public-topbar a.btn[href="/index.html"]');
  if (back) back.textContent = copy.back;
}

applyStaticText();

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

function showEmpty(title = copy.missingTitle, text = copy.missingText) {
  $("communityPublicContent").hidden = true;
  const host = $("communityPublicEmpty");
  host.hidden = false;
  host.innerHTML = `<div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(text)}</p><a class="btn" href="/index.html">MathHard</a></div>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

function appendRows(host, rows) {
  host.replaceChildren(...rows.filter(([, value]) => value).map(([label, value]) => {
    const wrapper = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    wrapper.append(dt, dd);
    return wrapper;
  }));
}

function render(profile) {
  document.documentElement.lang = lang;
  document.body.dataset.accent = profile.accent;
  document.body.dataset.theme = profile.theme;
  document.body.dataset.frame = profile.frame;
  document.body.dataset.badgeStyle = profile.badgeStyle;
  document.title = `${profile.displayName} (@${profile.username}) — MathHard`;
  $("communityPublicMeta").content = profile.bio || (lang === "en" ? `${profile.displayName}'s MathHard profile.` : `Profilul MathHard al lui ${profile.displayName}.`);
  $("communityStatsTitle").textContent = copy.sections.progress;
  $("communityEducationTitle").textContent = copy.sections.education;
  $("communityMathTitle").textContent = copy.sections.mathematics;
  $("communityBadgesTitle").textContent = copy.sections.badges;
  $("communityAchievementsTitle").textContent = copy.sections.achievements;
  $("communityLinksTitle").textContent = copy.sections.links;
  $("communityActivityTitle").textContent = copy.sections.activity;
  if ($("communityLeaderboardLink")) $("communityLeaderboardLink").textContent = copy.leaderboards;

  $("communityPublicEmpty").hidden = true;
  $("communityPublicContent").hidden = false;
  const reportButton = $("communityReportProfile");
  if (reportButton) {
    reportButton.textContent = copy.report;
    reportButton.hidden = profile.isOwner;
    reportButton.dataset.communityReportUsername = profile.username;
  }

  $("communityPublicName").textContent = profile.displayName;
  $("communityPublicUsername").textContent = `@${profile.username}`;
  $("communityPublicPronouns").textContent = profile.pronouns;
  $("communityPublicPronouns").hidden = !profile.pronouns;
  $("communityPublicHeadline").textContent = profile.headline;
  $("communityPublicHeadline").hidden = !profile.headline;
  $("communityPublicBio").textContent = profile.bio || "";
  $("communityPublicBio").hidden = !profile.bio;
  setImage($("communityPublicAvatar"), profile.avatarUrl, profile.displayName);
  $("communityPublicBanner").style.backgroundImage = profile.bannerUrl ? `url("${profile.bannerUrl.replaceAll('"', '%22')}")` : "";

  const featured = profile.badges.find((badge) => badge.id === profile.featuredBadgeId)
    || profile.featuredBadgeIds.map((id) => profile.badges.find((badge) => badge.id === id)).find(Boolean)
    || profile.badges.find((badge) => badge.featured)
    || profile.badges[0];
  if (featured) {
    $("communityFeaturedBadge").hidden = false;
    $("communityFeaturedBadge").textContent = `${featured.icon} ${lang === "en" ? (featured.titleEn || featured.title) : (featured.titleRo || featured.title)}`;
  }

  if (profile.privacy.show_location && profile.countryCode) {
    const locationText = [profile.regionName, countryLabel(profile.countryCode, lang)].filter(Boolean).join(" · ");
    $("communityPublicLocation").textContent = locationText;
    $("communityPublicLocation").hidden = !locationText;
  }

  if (profile.privacy.show_progress) {
    const statMap = {
      xp: [copy.progress[0], profile.stats.xp],
      level: [copy.progress[1], profile.stats.level],
      lessonsLearned: [copy.progress[2], profile.stats.lessonsLearned],
      problemsSolved: [copy.progress[3], profile.stats.problemsSolved],
      examsPassed: [copy.progress[4], profile.stats.examsPassed],
      currentStreak: [copy.progress[5], profile.privacy.show_streak ? `${profile.stats.currentStreak} ${copy.days}` : null]
    };
    const keys = profile.featuredStatKeys.length
      ? profile.featuredStatKeys
      : ["xp", "level", "lessonsLearned", "problemsSolved"];
    $("communityPublicStats").replaceChildren(...keys.map((key) => {
      const [label, value] = statMap[key] || [];
      if (value === null || value === undefined) return null;
      const card = document.createElement("article");
      card.className = "community-public-stat";
      const span = document.createElement("span");
      const strong = document.createElement("strong");
      span.textContent = label;
      strong.textContent = String(value);
      card.append(span, strong);
      return card;
    }).filter(Boolean));
    $("communityStatsSection").hidden = $("communityPublicStats").children.length === 0;
  }

  if (profile.privacy.show_education) {
    const educationRows = [
      [copy.education[0], profile.educationLevel],
      [copy.education[1], profile.gradeLevel],
      [copy.education[2], profile.studyTrack],
      [copy.education[3], profile.academicGoal],
      [lang === "en" ? "Dream school" : "Facultate / obiectiv de vis", profile.dreamSchool]
    ];
    appendRows($("communityPublicEducation"), educationRows);
    $("communityEducationSection").hidden = !educationRows.some(([, value]) => value);
  }

  if (profile.privacy.show_personality) {
    const mathRows = [
      [copy.mathematics[0], profile.currentFocus],
      [copy.mathematics[1], profile.favoriteMathematician],
      [copy.mathematics[2], profile.favoriteTheorem],
      [lang === "en" ? "Favorite problem type" : "Tip de probleme preferat", profile.favoriteProblemType],
      [lang === "en" ? "Learning style" : "Stil de învățare", LEARNING_STYLE_LABELS[profile.learningStyle] || profile.learningStyle],
      [lang === "en" ? "Availability" : "Disponibilitate", COLLABORATION_LABELS[profile.collaborationStatus] || profile.collaborationStatus],
      [lang === "en" ? "Weekly goal" : "Obiectiv săptămânal", profile.weeklyGoal],
      [copy.mathematics[3], profile.languages.join(", ")]
    ];
    appendRows($("communityPublicMath"), mathRows);
    $("communityPublicTopics").replaceChildren(...profile.favoriteTopics.map((topic) => {
      const chip = document.createElement("span");
      chip.className = "community-public-tag";
      chip.textContent = topic;
      return chip;
    }));
    $("communityMathSection").hidden = !mathRows.some(([, value]) => value) && profile.favoriteTopics.length === 0;
  }

  if (profile.privacy.show_badges && profile.badges.length) {
    const preferredIds = profile.featuredBadgeIds.length ? profile.featuredBadgeIds : [profile.featuredBadgeId].filter(Boolean);
    const ordered = [
      ...preferredIds.map((id) => profile.badges.find((badge) => badge.id === id)).filter(Boolean),
      ...profile.badges.filter((badge) => !preferredIds.includes(badge.id))
    ];
    $("communityPublicBadges").replaceChildren(...ordered.map((badge) => {
      const chip = document.createElement("span");
      chip.className = "community-public-badge";
      chip.dataset.rarity = badge.rarity;
      chip.dataset.category = badge.category;
      chip.title = lang === "en" ? badge.descriptionEn : badge.descriptionRo;
      const icon = document.createElement("b");
      const content = document.createElement("span");
      icon.textContent = badge.icon;
      content.textContent = lang === "en" ? (badge.titleEn || badge.title) : (badge.titleRo || badge.title);
      chip.append(icon, content);
      return chip;
    }));
    $("communityBadgesSection").hidden = false;
  }

  if (profile.privacy.show_achievements && profile.achievements.length) {
    $("communityPublicAchievements").replaceChildren(...profile.achievements.slice(0, 12).map((achievement) => {
      const chip = document.createElement("span");
      chip.className = "community-public-badge";
      chip.textContent = `${achievement.icon || "✦"} ${lang === "en" ? (achievement.title_en || achievement.title || achievement.id) : (achievement.title_ro || achievement.title || achievement.id)}`;
      return chip;
    }));
    $("communityAchievementsSection").hidden = false;
  }

  if (profile.privacy.show_links) {
    const links = [
      [lang === "en" ? "Website" : "Site web", profile.websiteUrl],
      ["GitHub", profile.githubUrl],
      [copy.portfolio, profile.portfolioUrl]
    ].filter(([, url]) => url);
    $("communityPublicLinks").replaceChildren(...links.map(([label, url]) => {
      const link = document.createElement("a");
      link.className = "community-public-link";
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = label;
      return link;
    }));
    $("communityLinksSection").hidden = links.length === 0;
  }

  if (profile.privacy.show_activity) {
    const activityRows = [
      [copy.activity[0], formatDate(profile.joinedAt)],
      [copy.activity[1], formatDate(profile.lastActiveAt)]
    ];
    appendRows($("communityPublicActivity"), activityRows);
    $("communityActivitySection").hidden = !activityRows.some(([, value]) => value);
  }

  if (profile.privacy.show_personality && profile.quote) {
    $("communityPublicQuote").textContent = `„${profile.quote}”`;
    $("communityQuoteSection").hidden = false;
  }
}

$("communityCopyProfile").textContent = copy.copyLink;
$("communityCopyProfile").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    $("communityCopyProfile").textContent = copy.copied;
    setTimeout(() => { $("communityCopyProfile").textContent = copy.copyLink; }, 1600);
  } catch {
    $("communityCopyProfile").textContent = copy.copyLink;
  }
});

(async () => {
  try {
    if (!username) return showEmpty();
    const payload = await loadPublicCommunityProfile(supabase, username);
    if (!payload?.available) return showEmpty();
    render(normalizeCommunityProfile(payload));
  } catch (error) {
    console.error("Public community profile load failed:", error);
    showEmpty();
  } finally {
    window.MathHardLoading?.ready();
  }
})();
