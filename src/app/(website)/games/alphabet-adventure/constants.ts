import type { LevelConfig, LevelType } from "./types";

export const ALPHABET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const ALPHABET_LOWER = "abcdefghijklmnopqrstuvwxyz".split("");

export const LEVELS: Record<number, LevelConfig> = {
  1: {
    name: "Letter Match",
    subtitle: "จับคู่ตัวอักษร",
    target: 35,
    type: "match",
  },
  2: {
    name: "Missing Capitals",
    subtitle: "เติมตัวพิมพ์ใหญ่ที่หายไป",
    target: 10,
    type: "fill-upper",
    hideCount: 2,
  },
  3: {
    name: "Missing Lowercase",
    subtitle: "เติมตัวพิมพ์เล็กที่หายไป",
    target: 10,
    type: "fill-lower",
    hideCount: 3,
  },
  4: {
    name: "Typing Challenge",
    subtitle: "พิมพ์ตัวอักษร (ท้าทาย)",
    target: 10,
    type: "typing",
  },
};

export const GAME_CONFIG = {
  SCORE_CORRECT: 5,
  SCORE_WRONG: 3,
  SCORE_TYPING_CORRECT: 10,
  SCORE_TYPING_WRONG: 5,
  INITIAL_DIFFICULTY: 3,
  MAX_DIFFICULTY: 24,
  DIFFICULTY_INCREASE: 2,
  ERROR_THRESHOLD: 3,
  FEEDBACK_DURATION: 1000,
  STAR_THREE: 90,
  STAR_TWO: 70,
} as const;

export const PRAISE = {
  correct: [
    "Excellent!",
    "Great job!",
    "Perfect!",
    "Correct!",
    "Well done!",
    "Amazing!",
    "Super!",
    "Awesome!",
  ],
  wrong: [
    "Try again!",
    "Keep going!",
    "Almost!",
    "Don't give up!",
    "Nice try!",
  ],
} as const;

export const HIGH_SCORE_KEY = "alphabet-adventure-highscore";

export function calcStars(accuracy: number): number {
  if (accuracy >= GAME_CONFIG.STAR_THREE) return 3;
  if (accuracy >= GAME_CONFIG.STAR_TWO) return 2;
  return 1;
}

export function randomPraise(type: "correct" | "wrong"): string {
  const pool = PRAISE[type];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateMatchRound(round: number) {
  const letterIndex = round <= 26 ? round - 1 : -1;
  const usePool = round > 26;
  const pool = usePool ? fisherYatesShuffle([...Array(26).keys()]) : [];
  let poolIndex = 0;

  const getLetterIndex = () => {
    if (round <= 26) return round - 1;
    if (poolIndex < pool.length) return pool[poolIndex++];
    return Math.floor(Math.random() * 26);
  };

  const targetIndex = getLetterIndex();
  const upper = ALPHABET_UPPER[targetIndex];
  const correctLower = ALPHABET_LOWER[targetIndex];

  const choices = [correctLower];
  while (choices.length < 3) {
    const r = ALPHABET_LOWER[Math.floor(Math.random() * 26)];
    if (!choices.includes(r)) choices.push(r);
  }

  return {
    targetLetter: upper,
    correctChar: correctLower,
    choices: fisherYatesShuffle(choices),
  };
}

export function generateFillRound(type: "fill-upper" | "fill-lower") {
  const isUpper = type === "fill-upper";
  const alphabet = isUpper ? ALPHABET_UPPER : ALPHABET_LOWER;
  const hideCount = isUpper ? 2 : 3;

  const missing: number[] = [];
  while (missing.length < hideCount) {
    const r = Math.floor(Math.random() * 26);
    if (!missing.includes(r)) missing.push(r);
  }
  missing.sort((a, b) => a - b);

  const grid = alphabet.map((char, index) => ({
    char,
    isHidden: missing.includes(index),
  }));

  const correct = alphabet[missing[0]];
  const choices = [correct];
  while (choices.length < 4) {
    const r = alphabet[Math.floor(Math.random() * 26)];
    if (!choices.includes(r)) choices.push(r);
  }

  return {
    grid,
    missingIndices: missing,
    activeIndex: missing[0],
    choices: fisherYatesShuffle(choices),
  };
}

export function generateTypingRound(difficulty: number) {
  const isUpper = Math.random() > 0.5;
  const alphabet = isUpper ? ALPHABET_UPPER : ALPHABET_LOWER;

  const missing: number[] = [];
  while (missing.length < difficulty) {
    const r = Math.floor(Math.random() * 26);
    if (!missing.includes(r)) missing.push(r);
  }

  const grid = alphabet.map((char, index) => ({
    char,
    isHidden: missing.includes(index),
    value: "",
  }));

  return {
    grid,
    missingIndices: missing,
    activeIndex: -1,
  };
}

export function getLevelName(level: number): string {
  const config = LEVELS[level];
  return config ? `${config.name} — ${config.subtitle}` : "";
}

export function getLevelNameShort(level: number): string {
  const config = LEVELS[level];
  return config ? config.name : "";
}