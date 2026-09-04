import { supabase } from "./supabase-client.js";
import {
  achievementProgress,
  levelRemaining,
  progressPercent
} from "./gamification-model.js";
import {
  claimWeeklyChallenge,
  loadGamificationDashboard,
  saveDailyGoal
} from "./gamification-repository.js";
import { normalizeUiError, renderUiState, showToast } from "./ui-feedback.js";

const COPY = {
  ro: {
    loading: "Se încarcă progresul…",
    auth: "Autentifică-te pentru recompense.",
    retry: "Reîncearcă",
    refresh: "Actualizează",
    level: "Nivel",
    totalXp: "XP total",
    levelProgress: "Progres către nivelul următor",
    remaining: "XP rămași",
    dailyGoal: "Obiectiv zilnic",
    dailyGoalHint: "Lecții, probleme și examene finalizate azi.",
    actions: "activități",
    streak: "Serie",
    days: "zile",
    best: "Record",
    weekly: "Provocare săptămânală",
    reward: "Recompensă",
    claim: "Colectează XP",
    claimed: "Recompensă colectată",
    inProgress: "În progres",
    completed: "Finalizat",
    achievements: "Realizări",
    achievementsHint: "Deblocate automat pe baza progresului tău.",
    achievementSections: { lessons: "Lecții", problems: "Probleme", chapters: "Capitole", exploration: "Explorare", exams: "Examene", global: "Globale", secret: "Secrete" },
    secretProgress: "Secrete descoperite",
    secretHint: "Unele realizări nu își dezvăluie condiția până când le descoperi.",
    mysteryTitle: "???",
    progressDetails: "Vezi ce mai lipsește",
    unlocked: "Deblocat",
    locked: "În progres",
    saving: "Se salvează…",
    saved: "Salvat",
    error: "Operația nu a putut fi finalizată.",
    goalOptions: [1, 3, 5, 10, 15, 20]
  },
  en: {
    loading: "Loading progress…",
    auth: "Sign in to view rewards.",
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
    achievementsHint: "Unlocked automatically from your progress.",
    achievementSections: { lessons: "Lessons", problems: "Problems", chapters: "Chapters", exploration: "Exploration", exams: "Exams", global: "Global", secret: "Secrets" },
    secretProgress: "Secrets discovered",
    secretHint: "Some achievements keep their objective hidden until you discover them.",
    mysteryTitle: "???",
    progressDetails: "See what remains",
    unlocked: "Unlocked",
    locked: "In progress",
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

function achievementSection(category) {
  const value = String(category || "global").toLowerCase();
  const aliases = {
    progress: "global",
    consistency: "global",
    accuracy: "problems",
    exam: "exams",
    xp: "global"
  };
  return ["lessons", "problems", "chapters", "exploration", "exams", "global", "secret"].includes(value)
    ? value
    : (aliases[value] || "global");
}

function renderAchievementCard(achievement, data) {
  const t = copy();
  const progress = achievementProgress(achievement, data.summary);
  const secretLocked = achievement.hiddenUntilUnlocked && !achievement.unlocked;
  const detailItems = secretLocked ? [] : achievement.progressItems;
  return `
    <article class="mh-game-achievement ${achievement.unlocked ? "is-unlocked" : "is-locked"} ${secretLocked ? "is-secret" : ""}" data-rarity="${secretLocked ? "mystery" : escapeHtml(achievement.rarity)}">
      <div class="mh-game-achievement-icon" aria-hidden="true">${secretLocked ? "?" : escapeHtml(achievement.icon)}</div>
      <div class="mh-game-achievement-copy">
        <div><strong>${secretLocked ? t.mysteryTitle : escapeHtml(achievement.title)}</strong><span>${achievement.unlocked ? t.unlocked : t.locked}</span></div>
        <p>${secretLocked ? "••••••••••" : escapeHtml(achievement.description)}</p>
        ${!secretLocked && achievement.rewardXp > 0 ? `<small class="mh-game-achievement-reward">+${achievement.rewardXp} XP</small>` : ""}
        ${achievement.unlocked || secretLocked ? "" : `
          <div class="mh-game-achievement-progress">
            <div class="mh-game-progress-track"><i style="width:${progress.percent}%"></i></div>
            <small>${formatNumber(progress.current, 1)} / ${formatNumber(progress.target, 1)}</small>
          </div>
        `}
        ${detailItems.length ? `
          <details class="mh-game-achievement-details">
            <summary>${t.progressDetails}</summary>
            <div>${detailItems.map((item) => `<span class="${item.completed ? "is-done" : ""}"><i aria-hidden="true">${item.completed ? "✓" : "○"}</i>${escapeHtml(item.title)}</span>`).join("")}</div>
          </details>
        ` : ""}
      </div>
    </article>`;
}

function renderAchievements(data) {
  const t = copy();
  const order = ["lessons", "problems", "chapters", "exploration", "exams", "global", "secret"];
  const groups = new Map(order.map((key) => [key, []]));
  data.achievements.forEach((achievement) => groups.get(achievementSection(achievement.category))?.push(achievement));

  return `
    <section class="mh-game-card mh-game-achievements-section">
      <div class="mh-game-card-head"><div><h3>${t.achievements}</h3><p>${t.achievementsHint}</p></div></div>
      <div class="mh-game-achievement-groups">
        ${order.map((key) => {
          const items = groups.get(key) || [];
          if (!items.length) return "";
          const isSecret = key === "secret";
          return `
            <section class="mh-game-achievement-group" data-achievement-group="${key}">
              <div class="mh-game-achievement-group-head">
                <div><h4>${escapeHtml(t.achievementSections[key])}</h4>${isSecret ? `<p>${escapeHtml(t.secretHint)}</p>` : ""}</div>
                ${isSecret ? `<strong>${t.secretProgress}: ${data.summary.unlockedSecretAchievements} / ${data.summary.totalSecretAchievements}</strong>` : `<span>${items.filter((item) => item.unlocked).length} / ${items.length}</span>`}
              </div>
              <div class="mh-game-achievements-grid">${items.map((achievement) => renderAchievementCard(achievement, data)).join("")}</div>
            </section>`;
        }).join("")}
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
  let loadPromise = null;
  let reloadAfterCurrent = false;
  let knownLevel = null;
  let knownUnlockedAchievements = null;


  function announceProgressMilestones(next) {
    const nextLevel = Number(next?.summary?.level || 1);
    const unlocked = new Set(
      (Array.isArray(next?.achievements) ? next.achievements : [])
        .filter((item) => item?.unlocked)
        .map((item) => String(item.id || item.title || ""))
        .filter(Boolean)
    );

    if (knownLevel !== null && nextLevel > knownLevel) {
      window.dispatchEvent(new CustomEvent("mathhard:celebrate", {
        detail: {
          kind: "level",
          title: locale() === "en" ? `Level ${nextLevel}` : `Nivel ${nextLevel}`,
          subtitle: locale() === "en" ? "New level reached" : "Ai ajuns la un nivel nou"
        }
      }));
    }

    if (knownUnlockedAchievements instanceof Set) {
      const newAchievements = (Array.isArray(next?.achievements) ? next.achievements : [])
        .filter((item) => item?.unlocked && !knownUnlockedAchievements.has(String(item.id || item.title || "")));
      newAchievements.slice(0, 2).forEach((achievement) => {
        window.dispatchEvent(new CustomEvent("mathhard:celebrate", {
          detail: {
            kind: "achievement",
            title: locale() === "en" ? "Achievement unlocked" : "Achievement deblocat",
            subtitle: String(achievement.title || ""),
            xp: Number(achievement.rewardXp || achievement.reward_xp || 0)
          }
        }));
      });
    }

    knownLevel = nextLevel;
    knownUnlockedAchievements = unlocked;
  }

  function feedback(message, kind = "") {
    const node = host.querySelector("[data-game-feedback]");
    if (!node) return;
    node.textContent = message || "";
    node.dataset.kind = kind;
  }

  function renderLoading() {
    renderUiState(host, {
      kind: "loading",
      title: copy().loading,
      skeleton: { cards: 6, lines: 3 }
    });
  }

  function renderAuth() {
    renderUiState(host, {
      kind: "auth",
      title: copy().auth
    });
  }

  function renderError(error) {
    const friendly = normalizeUiError(error, { language: locale() });
    renderUiState(host, {
      kind: friendly.key === "offline" ? "offline" : "error",
      title: friendly.title,
      message: friendly.message,
      actionLabel: copy().retry,
      onAction: () => void load(true)
    });
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
        const friendly = normalizeUiError(error, { language: locale() });
        feedback(friendly.message, "error");
        showToast(friendly.message, { tone: "error" });
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
        const claimed = await claimWeeklyChallenge(supabase);
        await load(true);
        feedback(copy().saved, "success");
        window.dispatchEvent(new CustomEvent("mathhard:celebrate", {
          detail: {
            kind: "achievement",
            title: locale() === "en" ? "Weekly challenge completed" : "Provocare săptămânală finalizată",
            subtitle: locale() === "en" ? "Reward claimed" : "Recompensă colectată",
            xp: Number(claimed?.rewardXp || claimed?.reward_xp || 0)
          }
        }));
      } catch (error) {
        event.currentTarget.disabled = false;
        const friendly = normalizeUiError(error, { language: locale() });
        feedback(friendly.message, "error");
        showToast(friendly.message, { tone: "error" });
      } finally {
        busy = false;
      }
    });
  }

  function renderData() {
    host.innerHTML = renderDashboard(data);
    bindActions();
  }

  function load(force = false) {
    if (!active && !force) return Promise.resolve();
    if (loadPromise) {
      if (force) reloadAfterCurrent = true;
      return loadPromise;
    }

    const request = ++epoch;
    if (!data || force) renderLoading();

    const promise = (async () => {
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
        announceProgressMilestones(next);
        data = next;
        renderData();
        window.dispatchEvent(new CustomEvent("mh:gamification-data", { detail: next.summary }));
      } catch (error) {
        if (request !== epoch) return;
        console.error("MathHard gamification could not be loaded:", error);
        renderError(error);
      }
    })().finally(() => {
      if (loadPromise === promise) loadPromise = null;
      if (reloadAfterCurrent && active) {
        reloadAfterCurrent = false;
        queueMicrotask(() => void load(true));
      } else {
        reloadAfterCurrent = false;
      }
    });

    loadPromise = promise;
    return promise;
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
