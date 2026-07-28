import { supabase } from "./supabase-client.js";
import {
  achievementProgress,
  levelRemaining,
  progressPercent
} from "./gamification-model.js";
import {
  claimWeeklyChallenge,
  loadGamificationDashboard,
  saveDailyGoal,
  saveLeaderboardPreference
} from "./gamification-repository.js";

const COPY = {
  ro: {
    loading: "Se încarcă progresul…",
    auth: "Autentifică-te pentru recompense și clasament.",
    retry: "Reîncearcă",
    refresh: "Actualizează",
    level: "Nivel",
    totalXp: "XP total",
    levelProgress: "Progres către nivelul următor",
    remaining: "XP rămași",
    dailyGoal: "Obiectiv zilnic",
    dailyGoalHint: "Lecții, probleme și examene finalizate azi.",
    actions: "activități",
    streak: "Streak",
    days: "zile",
    best: "Record",
    weekly: "Challenge săptămânal",
    reward: "Recompensă",
    claim: "Colectează XP",
    claimed: "Recompensă colectată",
    inProgress: "În progres",
    completed: "Finalizat",
    achievements: "Achievements",
    achievementsHint: "Deblocate exclusiv din progres validat server-side.",
    unlocked: "Deblocat",
    locked: "În progres",
    leaderboard: "Clasament",
    leaderboardHint: "Apar doar utilizatorii care aleg să participe.",
    leaderboardJoin: "Participă la clasament",
    rank: "Locul tău",
    noLeaderboard: "Clasamentul este încă gol.",
    solved: "probleme",
    saving: "Se salvează…",
    saved: "Salvat",
    error: "Operația nu a putut fi finalizată.",
    goalOptions: [1, 3, 5, 10, 15, 20]
  },
  en: {
    loading: "Loading progress…",
    auth: "Sign in to view rewards and the leaderboard.",
    retry: "Retry",
    refresh: "Refresh",
    level: "Level",
    totalXp: "Total XP",
    levelProgress: "Progress to the next level",
    remaining: "XP remaining",
    dailyGoal: "Daily goal",
    dailyGoalHint: "Lessons, problems and exams completed today.",
    actions: "activities",
    streak: "Streak",
    days: "days",
    best: "Best",
    weekly: "Weekly challenge",
    reward: "Reward",
    claim: "Claim XP",
    claimed: "Reward claimed",
    inProgress: "In progress",
    completed: "Completed",
    achievements: "Achievements",
    achievementsHint: "Unlocked only from server-validated progress.",
    unlocked: "Unlocked",
    locked: "In progress",
    leaderboard: "Leaderboard",
    leaderboardHint: "Only users who opt in are displayed.",
    leaderboardJoin: "Join leaderboard",
    rank: "Your rank",
    noLeaderboard: "The leaderboard is empty.",
    solved: "problems",
    saving: "Saving…",
    saved: "Saved",
    error: "The operation could not be completed.",
    goalOptions: [1, 3, 5, 10, 15, 20]
  }
};

function locale() {
  return document.documentElement.lang?.toLowerCase().startsWith("en") ? "en" : "ro";
}

function copy() {
  return COPY[locale()];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat(locale() === "en" ? "en-US" : "ro-RO", {
    maximumFractionDigits: digits
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale() === "en" ? "en-US" : "ro-RO", {
    day: "2-digit",
    month: "short"
  }).format(date);
}

function renderSummary(data) {
  const t = copy();
  const s = data.summary;
  const goalPercent = progressPercent(s.dailyProgress, s.dailyGoal);
  const remaining = levelRemaining(s);

  return `
    <section class="mh-game-level-card">
      <div class="mh-game-level-mark"><span>${t.level}</span><strong>${s.level}</strong></div>
      <div class="mh-game-level-main">
        <div class="mh-game-level-copy">
          <div><strong>${formatNumber(s.totalXp)} XP</strong><span>${t.totalXp}</span></div>
          <small>${formatNumber(remaining)} ${t.remaining}</small>
        </div>
        <div class="mh-game-progress-track" aria-label="${escapeHtml(t.levelProgress)}">
          <i style="width:${Math.max(0, Math.min(100, s.levelProgress))}%"></i>
        </div>
        <div class="mh-game-level-range"><span>${formatNumber(s.levelStartXp)}</span><span>${formatNumber(s.levelNextXp)} XP</span></div>
      </div>
    </section>

    <div class="mh-game-summary-grid">
      <section class="mh-game-card mh-game-daily-card">
        <div class="mh-game-card-head"><div><h3>${t.dailyGoal}</h3><p>${t.dailyGoalHint}</p></div></div>
        <div class="mh-game-daily-value"><strong>${s.dailyProgress}</strong><span>/ ${s.dailyGoal} ${t.actions}</span></div>
        <div class="mh-game-progress-track"><i style="width:${goalPercent}%"></i></div>
        <label class="mh-game-goal-select">
          <span>${t.dailyGoal}</span>
          <select data-game-daily-goal>
            ${t.goalOptions.map((value) => `<option value="${value}" ${value === s.dailyGoal ? "selected" : ""}>${value}</option>`).join("")}
          </select>
        </label>
      </section>

      <section class="mh-game-card mh-game-streak-card">
        <div class="mh-game-card-head"><div><h3>${t.streak}</h3></div></div>
        <div class="mh-game-streak-value"><strong>${s.currentStreak}</strong><span>${t.days}</span></div>
        <p>${t.best}: <strong>${s.longestStreak} ${t.days}</strong></p>
      </section>

      <section class="mh-game-card mh-game-achievement-summary">
        <div class="mh-game-card-head"><div><h3>${t.achievements}</h3></div></div>
        <div class="mh-game-achievement-count"><strong>${s.unlockedAchievements}</strong><span>/ ${s.totalAchievements}</span></div>
        <div class="mh-game-progress-track"><i style="width:${progressPercent(s.unlockedAchievements, s.totalAchievements)}%"></i></div>
      </section>
    </div>
  `;
}

function renderChallenge(data) {
  const t = copy();
  const challenge = data.weeklyChallenge;
  if (!challenge) return "";
  const percent = progressPercent(challenge.progress, challenge.target);
  const button = challenge.claimed
    ? `<button class="btn small" type="button" disabled>${t.claimed}</button>`
    : challenge.completed
      ? `<button class="btn small primary" type="button" data-game-claim>${t.claim}</button>`
      : `<span class="mh-game-status">${t.inProgress}</span>`;

  return `
    <section class="mh-game-card mh-game-weekly">
      <div class="mh-game-card-head">
        <div><span class="mh-game-kicker">${t.weekly}</span><h3>${escapeHtml(challenge.title)}</h3><p>${escapeHtml(challenge.description)}</p></div>
        <span class="mh-game-reward">+${challenge.rewardXp} XP</span>
      </div>
      <div class="mh-game-challenge-progress">
        <div><strong>${challenge.progress}/${challenge.target}</strong><span>${formatDate(challenge.startsOn)} – ${formatDate(challenge.endsOn)}</span></div>
        <div class="mh-game-progress-track"><i style="width:${percent}%"></i></div>
      </div>
      <div class="mh-game-challenge-actions">
        <span>${challenge.completed ? t.completed : t.inProgress}</span>
        ${button}
      </div>
    </section>
  `;
}

function renderAchievements(data) {
  const t = copy();
  return `
    <section class="mh-game-card mh-game-achievements-section">
      <div class="mh-game-card-head"><div><h3>${t.achievements}</h3><p>${t.achievementsHint}</p></div></div>
      <div class="mh-game-achievements-grid">
        ${data.achievements.map((achievement) => {
          const progress = achievementProgress(achievement, data.summary);
          return `
            <article class="mh-game-achievement ${achievement.unlocked ? "is-unlocked" : "is-locked"}" data-rarity="${escapeHtml(achievement.rarity)}">
              <div class="mh-game-achievement-icon" aria-hidden="true">${escapeHtml(achievement.icon)}</div>
              <div class="mh-game-achievement-copy">
                <div><strong>${escapeHtml(achievement.title)}</strong><span>${achievement.unlocked ? t.unlocked : t.locked}</span></div>
                <p>${escapeHtml(achievement.description)}</p>
                ${achievement.rewardXp > 0 ? `<small class="mh-game-achievement-reward">+${achievement.rewardXp} XP</small>` : ""}
                ${achievement.unlocked ? "" : `
                  <div class="mh-game-achievement-progress">
                    <div class="mh-game-progress-track"><i style="width:${progress.percent}%"></i></div>
                    <small>${formatNumber(progress.current, 1)} / ${formatNumber(progress.target, 1)}</small>
                  </div>
                `}
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderLeaderboard(data) {
  const t = copy();
  const optIn = data.summary.leaderboardOptIn;
  return `
    <section class="mh-game-card mh-game-leaderboard-card">
      <div class="mh-game-card-head">
        <div><h3>${t.leaderboard}</h3><p>${t.leaderboardHint}</p></div>
        <label class="mh-game-toggle">
          <input type="checkbox" data-game-leaderboard ${optIn ? "checked" : ""} />
          <span>${t.leaderboardJoin}</span>
        </label>
      </div>
      ${optIn && data.currentUserRank ? `<p class="mh-game-current-rank">${t.rank}: <strong>#${data.currentUserRank}</strong></p>` : ""}
      <div class="mh-game-leaderboard">
        ${data.leaderboard.map((row) => `
          <div class="mh-game-leaderboard-row ${row.isCurrentUser ? "is-current" : ""}">
            <span class="mh-game-rank">#${row.rank}</span>
            <div><strong>${escapeHtml(row.displayName)}</strong><small>${t.level} ${row.level} · ${row.solvedProblems} ${t.solved}</small></div>
            <b>${formatNumber(row.totalXp)} XP</b>
          </div>
        `).join("") || `<p class="mh-game-empty-copy">${t.noLeaderboard}</p>`}
      </div>
    </section>
  `;
}

function renderDashboard(data) {
  return `
    <div class="mh-game-shell">
      <div class="mh-game-toolbar"><button class="btn small" type="button" data-game-refresh>${copy().refresh}</button></div>
      ${renderSummary(data)}
      <div class="mh-game-main-grid">
        ${renderChallenge(data)}
        ${renderLeaderboard(data)}
      </div>
      ${renderAchievements(data)}
      <div class="mh-game-feedback" data-game-feedback aria-live="polite"></div>
    </div>
  `;
}

export function createGamificationController({ host }) {
  if (!host) return { activate() {}, deactivate() {}, refresh() {} };

  let active = false;
  let data = null;
  let epoch = 0;
  let busy = false;

  function feedback(message, kind = "") {
    const node = host.querySelector("[data-game-feedback]");
    if (!node) return;
    node.textContent = message || "";
    node.dataset.kind = kind;
  }

  function renderLoading() {
    host.innerHTML = `<div class="mh-game-state"><i></i><span>${copy().loading}</span></div>`;
  }

  function renderAuth() {
    host.innerHTML = `<div class="mh-game-state"><strong>${copy().auth}</strong></div>`;
  }

  function renderError(error) {
    host.innerHTML = `
      <div class="mh-game-state is-error">
        <strong>${escapeHtml(error?.message || copy().error)}</strong>
        <button class="btn small" type="button" data-game-retry>${copy().retry}</button>
      </div>
    `;
    host.querySelector("[data-game-retry]")?.addEventListener("click", () => void load(true));
  }

  function bindActions() {
    host.querySelector("[data-game-refresh]")?.addEventListener("click", () => void load(true));

    host.querySelector("[data-game-daily-goal]")?.addEventListener("change", async (event) => {
      if (busy) return;
      busy = true;
      feedback(copy().saving);
      try {
        await saveDailyGoal(supabase, event.target.value);
        await load(true);
        feedback(copy().saved, "success");
      } catch (error) {
        feedback(error?.message || copy().error, "error");
      } finally {
        busy = false;
      }
    });

    host.querySelector("[data-game-leaderboard]")?.addEventListener("change", async (event) => {
      if (busy) return;
      busy = true;
      feedback(copy().saving);
      try {
        await saveLeaderboardPreference(supabase, event.target.checked);
        await load(true);
        feedback(copy().saved, "success");
      } catch (error) {
        event.target.checked = !event.target.checked;
        feedback(error?.message || copy().error, "error");
      } finally {
        busy = false;
      }
    });

    host.querySelector("[data-game-claim]")?.addEventListener("click", async (event) => {
      if (busy) return;
      busy = true;
      event.currentTarget.disabled = true;
      feedback(copy().saving);
      try {
        await claimWeeklyChallenge(supabase);
        await load(true);
        feedback(copy().saved, "success");
      } catch (error) {
        event.currentTarget.disabled = false;
        feedback(error?.message || copy().error, "error");
      } finally {
        busy = false;
      }
    });
  }

  function renderData() {
    host.innerHTML = renderDashboard(data);
    bindActions();
  }

  async function load(force = false) {
    if (!active && !force) return;
    const request = ++epoch;
    if (!data || force) renderLoading();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (request !== epoch) return;
      if (!session?.user) {
        data = null;
        renderAuth();
        return;
      }

      const next = await loadGamificationDashboard(supabase, { locale: locale() });
      if (request !== epoch) return;
      data = next;
      renderData();
      window.dispatchEvent(new CustomEvent("mh:gamification-data", { detail: next.summary }));
    } catch (error) {
      if (request !== epoch) return;
      console.error("MathHard gamification could not be loaded:", error);
      renderError(error);
    }
  }

  function activate() {
    active = true;
    void load(false);
  }

  function deactivate() {
    active = false;
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    epoch += 1;
    data = null;
    if (!session?.user) renderAuth();
    else if (active) void load(true);
  });

  new MutationObserver(() => {
    if (data) void load(true);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  document.addEventListener("visibilitychange", () => {
    if (active && document.visibilityState === "visible") void load(true);
  });

  window.addEventListener("mh:gamification-admin-updated", () => {
    data = null;
    if (active) void load(true);
  });

  return { activate, deactivate, refresh: () => load(true) };
}

function initGamificationWorkspace() {
  const controller = createGamificationController({
    host: document.getElementById("mhShellPanelGamification")
  });
  window.addEventListener("mh:gamification-route", (event) => {
    if (event.detail?.active) controller.activate();
    else controller.deactivate();
  });
  if (location.hash === "#gamification") controller.activate();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGamificationWorkspace, { once: true });
  } else {
    initGamificationWorkspace();
  }
}
