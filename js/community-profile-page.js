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
  portfolio: "Portfolio"
} : {
  missingTitle: "Profil indisponibil",
  missingText: "Profilul este privat, indisponibil sau username-ul nu este valid.",
  progress: ["XP", "Nivel", "Lecții învățate", "Probleme rezolvate", "Examene promovate", "Streak"],
  sections: {
    progress: "Progres",
    education: "Educație",
    mathematics: "Matematică",
    badges: "Badge-uri",
    achievements: "Realizări",
    links: "Linkuri",
    activity: "Comunitate"
  },
  education: ["Nivel", "Clasă / an", "Profil / specializare", "Obiectiv"],
  mathematics: ["Învăț acum", "Matematician favorit", "Teoremă favorită", "Limbi"],
  activity: ["Membru din", "Ultima activitate"],
  locationSeparator: " · ",
  days: "zile",
  copied: "Link copiat",
  copyLink: "Copiază linkul",
  leaderboards: "Clasamente",
  portfolio: "Portofoliu"
};

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
  $("communityPublicName").textContent = profile.displayName;
  $("communityPublicUsername").textContent = `@${profile.username}`;
  $("communityPublicBio").textContent = profile.bio || "";
  $("communityPublicBio").hidden = !profile.bio;
  setImage($("communityPublicAvatar"), profile.avatarUrl, profile.displayName);
  $("communityPublicBanner").style.backgroundImage = profile.bannerUrl ? `url("${profile.bannerUrl.replaceAll('"', '%22')}")` : "";

  const featured = profile.badges.find((badge) => badge.id === profile.featuredBadgeId) || profile.badges.find((badge) => badge.featured) || profile.badges[0];
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
    const values = [
      profile.stats.xp,
      profile.stats.level,
      profile.stats.lessonsLearned,
      profile.stats.problemsSolved,
      profile.stats.examsPassed,
      profile.privacy.show_streak ? `${profile.stats.currentStreak} ${copy.days}` : null
    ];
    $("communityPublicStats").replaceChildren(...copy.progress.map((label, index) => values[index] === null ? null : (() => {
      const card = document.createElement("article");
      card.className = "community-public-stat";
      const span = document.createElement("span");
      const strong = document.createElement("strong");
      span.textContent = label;
      strong.textContent = String(values[index]);
      card.append(span, strong);
      return card;
    })()).filter(Boolean));
    $("communityStatsSection").hidden = false;
  }

  if (profile.privacy.show_education) {
    const educationRows = [
      [copy.education[0], profile.educationLevel],
      [copy.education[1], profile.gradeLevel],
      [copy.education[2], profile.studyTrack],
      [copy.education[3], profile.academicGoal]
    ];
    appendRows($("communityPublicEducation"), educationRows);
    $("communityEducationSection").hidden = !educationRows.some(([, value]) => value);
  }

  if (profile.privacy.show_personality) {
    const mathRows = [
      [copy.mathematics[0], profile.currentFocus],
      [copy.mathematics[1], profile.favoriteMathematician],
      [copy.mathematics[2], profile.favoriteTheorem],
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
    $("communityPublicBadges").replaceChildren(...profile.badges.map((badge) => {
      const chip = document.createElement("span");
      chip.className = "community-public-badge";
      chip.dataset.rarity = badge.rarity;
      chip.title = lang === "en" ? badge.descriptionEn : badge.descriptionRo;
      chip.textContent = `${badge.icon} ${lang === "en" ? (badge.titleEn || badge.title) : (badge.titleRo || badge.title)}`;
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
      ["Website", profile.websiteUrl],
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
