export type GameState = {
  xp: number;
  completedChallenges: number;
  streak: number;
  lastCompletedDate: string | null;
  completedChallengeIds: string[];
};

const STORAGE_KEY = "grassquest-game";

export const LEVELS = [
  {
    name: "Touching Grass",
    minXP: 0,
    emoji: "🌱",
  },
  {
    name: "Grass Rookie",
    minXP: 50,
    emoji: "🌿",
  },
  {
    name: "Nature Spotter",
    minXP: 100,
    emoji: "🍃",
  },
  {
    name: "Outdoor Explorer",
    minXP: 250,
    emoji: "🌳",
  },
  {
    name: "Grass Veteran",
    minXP: 500,
    emoji: "🌲",
  },
  {
    name: "Certified Touch-Grasser",
    minXP: 1000,
    emoji: "🌎",
  },
];

export const MILESTONES = [
  {
    name: "Touched Grass",
    description: "Complete your first quest.",
    xp: 10,
    emoji: "🌱",
  },
  {
    name: "Grass Rookie",
    description: "Reach 50 XP.",
    xp: 50,
    emoji: "🌿",
  },
  {
    name: "Nature Spotter",
    description: "Reach 100 XP.",
    xp: 100,
    emoji: "🍃",
  },
  {
    name: "Outdoor Explorer",
    description: "Reach 250 XP.",
    xp: 250,
    emoji: "🌳",
  },
  {
    name: "Grass Veteran",
    description: "Reach 500 XP.",
    xp: 500,
    emoji: "🌲",
  },
  {
    name: "Certified Touch-Grasser",
    description: "Reach 1,000 XP.",
    xp: 1000,
    emoji: "🌎",
  },
];

export function getInitialGameState(): GameState {
  return {
    xp: 0,
    completedChallenges: 0,
    streak: 0,
    lastCompletedDate: null,
    completedChallengeIds: [],
  };
}

export function loadGame(): GameState {
  if (typeof window === "undefined") {
    return getInitialGameState();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return getInitialGameState();
    }

    return {
      ...getInitialGameState(),
      ...JSON.parse(stored),
    };
  } catch {
    return getInitialGameState();
  }
}

export function saveGame(state: GameState) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}

function getDateString(date: Date) {
  return date.toISOString().split("T")[0];
}

function getYesterdayString() {
  const yesterday = new Date();

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  return getDateString(yesterday);
}

export function completeChallenge(
  state: GameState,
  challengeId: string,
  xpEarned: number
): GameState {
  const today = getDateString(new Date());
  const yesterday = getYesterdayString();

  let streak = state.streak;

  // Don't increase the streak multiple times
  // on the same day.
  if (state.lastCompletedDate !== today) {
    if (state.lastCompletedDate === yesterday) {
      streak += 1;
    } else {
      streak = 1;
    }
  }

  const completedChallengeIds =
    state.completedChallengeIds.includes(challengeId)
      ? state.completedChallengeIds
      : [
          ...state.completedChallengeIds,
          challengeId,
        ];

  const newState: GameState = {
    xp: state.xp + xpEarned,
    completedChallenges:
      state.completedChallenges + 1,
    streak,
    lastCompletedDate: today,
    completedChallengeIds,
  };

  saveGame(newState);

  return newState;
}

export function getCurrentLevel(xp: number) {
  let current = LEVELS[0];

  for (const level of LEVELS) {
    if (xp >= level.minXP) {
      current = level;
    }
  }

  return current;
}

export function getNextLevel(xp: number) {
  return (
    LEVELS.find(
      (level) => level.minXP > xp
    ) ?? null
  );
}

export function getLevelProgress(xp: number) {
  const current = getCurrentLevel(xp);
  const next = getNextLevel(xp);

  if (!next) {
    return {
      current,
      next: null,
      progress: 100,
      xpIntoLevel: xp - current.minXP,
      xpNeeded: 0,
    };
  }

  const levelRange =
    next.minXP - current.minXP;

  const xpIntoLevel =
    xp - current.minXP;

  const progress = Math.min(
    100,
    Math.round(
      (xpIntoLevel / levelRange) * 100
    )
  );

  return {
    current,
    next,
    progress,
    xpIntoLevel,
    xpNeeded: levelRange,
  };
}

export function getNewlyUnlockedMilestone(
  oldXP: number,
  newXP: number
) {
  return MILESTONES.find(
    (milestone) =>
      oldXP < milestone.xp &&
      newXP >= milestone.xp
  );
}