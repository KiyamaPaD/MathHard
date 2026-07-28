const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const text = (value, fallback = "") => String(value ?? fallback);

export function clampDailyGoal(value) {
  return Math.max(1, Math.min(50, Math.round(number(value, 5))));
}

export function progressPercent(value, target) {
  const safeTarget = number(target);
  if (safeTarget <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((number(value) / safeTarget) * 100)));
}

export function normalizeGamificationPayload(payload = {}) {
  const summary = payload?.summary && typeof payload.summary === "object"
    ? payload.summary
    : {};
  const challenge = payload?.weekly_challenge && typeof payload.weekly_challenge === "object"
    ? payload.weekly_challenge
    : null;

  return {
    generatedAt: text(payload.generated_at),
    summary: {
      level: Math.max(1, number(summary.level, 1)),
      totalXp: Math.max(0, number(summary.total_xp)),
      baseXp: Math.max(0, number(summary.base_xp)),
      bonusXp: Math.max(0, number(summary.bonus_xp)),
      levelStartXp: Math.max(0, number(summary.level_start_xp)),
      levelNextXp: Math.max(1, number(summary.level_next_xp, 25)),
      levelProgress: Math.max(0, Math.min(100, number(summary.level_progress))),
      dailyGoal: clampDailyGoal(summary.daily_goal),
      dailyProgress: Math.max(0, number(summary.daily_progress)),
      currentStreak: Math.max(0, number(summary.current_streak)),
      longestStreak: Math.max(0, number(summary.longest_streak)),
      learnedLessons: Math.max(0, number(summary.learned_lessons)),
      solvedProblems: Math.max(0, number(summary.solved_problems)),
      passedExams: Math.max(0, number(summary.passed_exams)),
      perfectSolutions: Math.max(0, number(summary.perfect_solutions)),
      answerAttempts: Math.max(0, number(summary.answer_attempts)),
      correctAnswers: Math.max(0, number(summary.correct_answers)),
      accuracy: Math.max(0, Math.min(100, number(summary.accuracy))),
      leaderboardOptIn: Boolean(summary.leaderboard_opt_in),
      unlockedAchievements: Math.max(0, number(summary.unlocked_achievements)),
      totalAchievements: Math.max(0, number(summary.total_achievements))
    },
    weeklyChallenge: challenge ? {
      id: text(challenge.id),
      title: text(challenge.title, "Weekly challenge"),
      description: text(challenge.description),
      metric: text(challenge.metric),
      target: Math.max(1, number(challenge.target, 1)),
      progress: Math.max(0, number(challenge.progress)),
      rewardXp: Math.max(0, number(challenge.reward_xp)),
      startsOn: text(challenge.starts_on),
      endsOn: text(challenge.ends_on),
      completed: Boolean(challenge.completed),
      claimed: Boolean(challenge.claimed),
      claimedAt: text(challenge.claimed_at)
    } : null,
    achievements: Array.isArray(payload.achievements)
      ? payload.achievements.map((item) => ({
        id: text(item.id),
        title: text(item.title, "Achievement"),
        description: text(item.description),
        icon: text(item.icon, "✦"),
        category: text(item.category, "progress"),
        criteria: item?.criteria && typeof item.criteria === "object" ? item.criteria : {},
        rewardXp: Math.max(0, number(item.reward_xp)),
        rarity: text(item.rarity, "common"),
        hiddenUntilUnlocked: Boolean(item.hidden_until_unlocked),
        unlocked: Boolean(item.unlocked),
        unlockedAt: text(item.unlocked_at)
      }))
      : [],
    leaderboard: Array.isArray(payload.leaderboard)
      ? payload.leaderboard.map((item) => ({
        rank: Math.max(1, number(item.rank, 1)),
        displayName: text(item.display_name, "MathHard User"),
        level: Math.max(1, number(item.level, 1)),
        totalXp: Math.max(0, number(item.total_xp)),
        solvedProblems: Math.max(0, number(item.solved_problems)),
        isCurrentUser: Boolean(item.is_current_user)
      }))
      : [],
    currentUserRank: payload.current_user_rank == null
      ? null
      : Math.max(1, number(payload.current_user_rank, 1))
  };
}

export function achievementProgress(achievement, summary) {
  const criteria = achievement?.criteria || {};
  const threshold = Math.max(1, number(criteria.threshold, 1));
  const metric = text(criteria.metric);
  const values = {
    learned_lessons: summary?.learnedLessons,
    solved_problems: summary?.solvedProblems,
    passed_exams: summary?.passedExams,
    total_xp: summary?.totalXp,
    perfect_solutions: summary?.perfectSolutions,
    current_streak: summary?.currentStreak,
    longest_streak: summary?.longestStreak,
    accuracy: summary?.accuracy
  };
  const current = Math.max(0, number(values[metric]));
  return {
    current,
    target: threshold,
    percent: achievement?.unlocked ? 100 : progressPercent(current, threshold)
  };
}

export function levelRemaining(summary = {}) {
  return Math.max(0, number(summary.levelNextXp) - number(summary.totalXp));
}
