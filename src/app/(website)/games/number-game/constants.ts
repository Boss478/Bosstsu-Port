export const EMOJIS = [
  "🍎", "🐶", "🚗", "🌟", "🎈", "⚽",
  "🐸", "🐻", "🍓", "🍉", "🚁", "🤖",
];

export const INSTRUCTIONS: Record<
  number,
  { th: string; en: string }
> = {
  1: {
    th: "เลือกคำศัพท์ให้ตรงกับตัวเลข",
    en: "Choose the correct English word for the number.",
  },
  2: {
    th: "ตัวเลขนี้อ่านว่า...",
    en: "Choose the correct Thai pronunciation.",
  },
  3: {
    th: "เติมตัวอักษรที่หายไปให้ถูกต้อง",
    en: "Fill in the missing letter.",
  },
  4: {
    th: "ช่วยกันนับจำนวน แล้วเลือกตัวเลขให้ตรงกันนะ",
    en: "Count the objects and choose the right number.",
  },
  5: {
    th: "บวกเลขแล้วเลือกคำตอบเลย",
    en: "Add the objects and choose the correct total.",
  },
  6: {
    th: "โหมดสุ่ม: ตอบคำถามทุกรูปแบบ",
    en: "Endless Mode: Answer all types of questions!",
  },
};

export const STAGE_NAMES: Record<number, { th: string; en: string }> = {
  1: { th: "จับคู่คำศัพท์", en: "Word Match" },
  2: { th: "ออกเสียงตาม", en: "Pronunciation" },
  3: { th: "เติมตัวอักษร", en: "Fill the Letter" },
  4: { th: "นับจำนวน", en: "Counting" },
  5: { th: "บวกเลข", en: "Addition" },
  6: { th: "โหมดท้าทาย", en: "Endless Mode" },
};

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
};

export const RANGES = [
  { id: "1-10", label: "1 - 10", min: 1, max: 10 },
  { id: "11-20", label: "11 - 20", min: 11, max: 20 },
  { id: "1-20", label: "1 - 20", min: 1, max: 20 },
  { id: "1-100", label: "1 - 100", min: 1, max: 100 },
];

export const GAME_CONFIG = {
  STAGE_1_COUNT: 5,
  STAGE_2_COUNT: 10,
  STAGE_3_COUNT: 15,
  STAGE_4_COUNT: 20,
  STAGE_5_COUNT: 25,
  SCORE_CORRECT: 3,
  SCORE_WRONG: 2,
  SEQUENTIAL_LIMIT: 20,
  REVIEW_COUNT: 5,
  FEEDBACK_DURATION: 1000,
  MAX_VISUAL_ITEMS: 12,
  STAR_THRESHOLDS: {
    THREE: 90,
    TWO: 70,
  },
} as const;

export function calcStars(accuracy: number): number {
  if (accuracy >= GAME_CONFIG.STAR_THRESHOLDS.THREE) return 3;
  if (accuracy >= GAME_CONFIG.STAR_THRESHOLDS.TWO) return 2;
  return 1;
}

export function randomPraise(type: "correct" | "wrong"): string {
  const pool = PRAISE[type];
  return pool[Math.floor(Math.random() * pool.length)];
}

export const HIGH_SCORE_KEY = "number-game-highscore";
