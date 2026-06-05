import type { LevelConfig } from "./types";
import { shuffleArray } from "@/lib/shuffle";

const ALPHABET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const ALPHABET_LOWER = "abcdefghijklmnopqrstuvwxyz".split("");

export const THAI_NAMES = [
  "เอ", "บี", "ซี", "ดี", "อี", "เอฟ", "จี", "เอช", "ไอ", "เจ",
  "เค", "แอล", "เอ็ม", "เอ็น", "โอ", "พี", "คิว", "อาร์", "เอส", "ที",
  "ยู", "วี", "ดับเบิลยู", "เอกซ์", "วาย", "แซด",
];

export const PHONICS_SOUNDS = [
  "แอะ /a/", "เบอะ /b/", "เคอะ /k/", "ดึ /d/", "เอะ /e/", "เฟอะ /f/",
  "เกอะ /g/", "เฮอะ /h/", "อิ /i/", "เจอะ /j/", "เคอะ /k/", "เลอะ /l/",
  "เมอะ /m/", "เนอะ /n/", "เอาะ /o/", "เพอะ /p/", "เควอะ /kw/", "เรอะ /r/",
  "เซอะ /s/", "เทอะ /t/", "อะ /u/", "เวอะ /v/", "เวอะ /w/", "ซ /ks/",
  "เยอะ /j/", "ซี /z/",
];

export const LEVELS: Record<number, LevelConfig> = {
  1: {
    name: "Thai Match",
    subtitle: "จับคู่ภาษาไทย",
    target: 34,
    type: "match",
    dataPool: "thai",
  },
  2: {
    name: "Phonics Match",
    subtitle: "จับคู่เสียงอ่าน",
    target: 34,
    type: "match",
    dataPool: "phonics",
  },
  3: {
    name: "Letter Match",
    subtitle: "จับคู่ตัวอักษร",
    target: 35,
    type: "match",
    dataPool: "lowercase",
  },
  4: {
    name: "Missing Capitals",
    subtitle: "เติมตัวพิมพ์ใหญ่ที่หายไป",
    target: 10,
    type: "fill-upper",
    hideCount: 2,
  },
  5: {
    name: "Missing Lowercase",
    subtitle: "เติมตัวพิมพ์เล็กที่หายไป",
    target: 10,
    type: "fill-lower",
    hideCount: 3,
  },
  6: {
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
  WRONG_LIMIT: 2,
} as const;

const STREAK_PRAISE = [
  "Keep going!",
  "On fire!",
  "Unstoppable!",
  "Legendary!",
  "Perfect streak!",
];

const PRAISE = {
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
export const PROGRESS_KEY = "alphabet-adventure-progress";

export function calcStars(accuracy: number): number {
  if (accuracy >= GAME_CONFIG.STAR_THREE) return 3;
  if (accuracy >= GAME_CONFIG.STAR_TWO) return 2;
  return 1;
}

export function randomPraise(type: "correct" | "wrong"): string {
  const pool = PRAISE[type];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function streakPraise(streak: number): string {
  if (streak < 3) return `${streak} in a row!`;
  const idx = Math.min(streak - 3, STREAK_PRAISE.length - 1);
  return `${streak} in a row! ${STREAK_PRAISE[idx]}`;
}

const fisherYatesShuffle = shuffleArray;

let roundSeed: number[] | null = null;

function getLetterIndex(round: number): number {
  if (round <= 26) return round - 1;
  if (!roundSeed) {
    roundSeed = fisherYatesShuffle([...Array(26).keys()]);
  }
  return roundSeed[(round - 27) % 26];
}

export function generateMatchRound(round: number, numChoices = 3) {
  const targetIndex = getLetterIndex(round);
  const upper = ALPHABET_UPPER[targetIndex];
  const correctLower = ALPHABET_LOWER[targetIndex];

  const choices = [correctLower];
  while (choices.length < numChoices) {
    const r = ALPHABET_LOWER[Math.floor(Math.random() * 26)];
    if (!choices.includes(r)) choices.push(r);
  }

  return {
    targetLetter: upper,
    correctChar: correctLower,
    choices: fisherYatesShuffle(choices),
  };
}

export function generateThaiRevertRound(round: number, numChoices = 3) {
  const targetIndex = getLetterIndex(round);
  const correctLetter = ALPHABET_UPPER[targetIndex];
  const thaiName = THAI_NAMES[targetIndex];

  const choices = [correctLetter];
  while (choices.length < numChoices) {
    const r = ALPHABET_UPPER[Math.floor(Math.random() * 26)];
    if (!choices.includes(r)) choices.push(r);
  }

  return {
    targetLetter: thaiName,
    correctChar: correctLetter,
    choices: fisherYatesShuffle(choices),
  };
}

export function generateThaiRound(round: number, numChoices = 3) {
  const targetIndex = getLetterIndex(round);
  const upper = ALPHABET_UPPER[targetIndex];
  const correct = THAI_NAMES[targetIndex];

  const choices = [correct];
  while (choices.length < numChoices) {
    const r = Math.floor(Math.random() * 26);
    if (!choices.includes(THAI_NAMES[r])) choices.push(THAI_NAMES[r]);
  }

  return {
    targetLetter: upper,
    correctChar: correct,
    choices: fisherYatesShuffle(choices),
  };
}

export function generatePhonicsRound(round: number, numChoices = 3) {
  const targetIndex = getLetterIndex(round);
  const upper = ALPHABET_UPPER[targetIndex];
  const correct = PHONICS_SOUNDS[targetIndex];

  const choices = [correct];
  while (choices.length < numChoices) {
    const r = Math.floor(Math.random() * 26);
    if (!choices.includes(PHONICS_SOUNDS[r])) choices.push(PHONICS_SOUNDS[r]);
  }

  return {
    targetLetter: upper,
    correctChar: correct,
    choices: fisherYatesShuffle(choices),
  };
}

export function generatePhonicsRevertRound(round: number, numChoices = 3) {
  const targetIndex = getLetterIndex(round);
  const correct = PHONICS_SOUNDS[targetIndex];
  const correctLetter = ALPHABET_UPPER[targetIndex];

  const choices = [correctLetter];
  while (choices.length < numChoices) {
    const r = ALPHABET_UPPER[Math.floor(Math.random() * 26)];
    if (!choices.includes(r)) choices.push(r);
  }

  return {
    targetLetter: correct,
    correctChar: correctLetter,
    choices: fisherYatesShuffle(choices),
  };
}

export function generateFillChoices(correctChar: string, numChoices: number, isUpper: boolean): string[] {
  const alphabet = isUpper ? ALPHABET_UPPER : ALPHABET_LOWER;
  const choices = [correctChar];
  while (choices.length < numChoices) {
    const r = alphabet[Math.floor(Math.random() * 26)];
    if (!choices.includes(r)) choices.push(r);
  }
  return fisherYatesShuffle(choices);
}

export function generateFillRound(type: "fill-upper" | "fill-lower", numChoices = 4) {
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
  const choices = generateFillChoices(correct, numChoices, isUpper);

  return {
    grid,
    missingIndices: missing,
    activeIndex: missing[0],
    choices,
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
