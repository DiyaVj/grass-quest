export type Difficulty = "easy" | "medium" | "hard";

export type Challenge = {
  id: string;
  text: string;
  object: string;
  count: number;
  xp: number;
  difficulty: Difficulty;
  emoji: string;
};

export const CHALLENGES: Challenge[] = [
  {
    id: "leaf",
    text: "Find a leaf.",
    object: "leaf",
    count: 1,
    xp: 10,
    difficulty: "easy",
    emoji: "🍃",
  },

  {
    id: "flower",
    text: "Find a flower.",
    object: "flower",
    count: 1,
    xp: 10,
    difficulty: "easy",
    emoji: "🌸",
  },

  {
    id: "rock",
    text: "Find a rock.",
    object: "rock",
    count: 1,
    xp: 10,
    difficulty: "easy",
    emoji: "🪨",
  },

  {
    id: "plant",
    text: "Find a plant.",
    object: "plant",
    count: 1,
    xp: 10,
    difficulty: "easy",
    emoji: "🌱",
  },

  {
    id: "tree",
    text: "Find a tree.",
    object: "tree",
    count: 1,
    xp: 10,
    difficulty: "easy",
    emoji: "🌳",
  },

  {
    id: "two-leaves",
    text: "Find two leaves.",
    object: "leaf",
    count: 2,
    xp: 15,
    difficulty: "medium",
    emoji: "🍃",
  },

  {
    id: "cloud",
    text: "Find a cloud.",
    object: "cloud",
    count: 1,
    xp: 15,
    difficulty: "medium",
    emoji: "☁️",
  },

  {
    id: "bird",
    text: "Find a bird.",
    object: "bird",
    count: 1,
    xp: 20,
    difficulty: "medium",
    emoji: "🐦",
  },

  {
    id: "dog",
    text: "Find a dog.",
    object: "dog",
    count: 1,
    xp: 15,
    difficulty: "medium",
    emoji: "🐕",
  },

  {
    id: "cat",
    text: "Find a cat.",
    object: "cat",
    count: 1,
    xp: 15,
    difficulty: "medium",
    emoji: "🐈",
  },

  {
    id: "butterfly",
    text: "Find a butterfly.",
    object: "butterfly",
    count: 1,
    xp: 25,
    difficulty: "hard",
    emoji: "🦋",
  },
];

export function getRandomChallenge(
  currentId?: string
): Challenge {
  const available = CHALLENGES.filter(
    (challenge) => challenge.id !== currentId
  );

  return available[
    Math.floor(Math.random() * available.length)
  ];
}