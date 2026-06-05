export type CardTier = "common" | "uncommon" | "rare" | "ultra-rare" | "legendary";

export const TIER_ORDER: CardTier[] = [
  "common",
  "uncommon",
  "rare",
  "ultra-rare",
  "legendary",
];

export const TIER_LETTERS: Record<CardTier, string[]> = {
  common: ["E", "T", "A", "O", "I", "S"],
  uncommon: ["N", "H", "R", "D", "L", "C"],
  rare: ["U", "M", "W", "F", "G"],
  "ultra-rare": ["Y", "P", "B", "V", "K"],
  legendary: ["J", "X", "Q", "Z"],
};

export const TIER_POINTS: Record<CardTier, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  "ultra-rare": 5,
  legendary: 10,
};

export const TIER_LABELS: Record<CardTier, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  "ultra-rare": "Ultra Rare",
  legendary: "Legendary",
};

export const TIER_COLORS: Record<CardTier, string> = {
  common: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
  uncommon: "text-green-600 bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
  rare: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700",
  "ultra-rare": "text-purple-600 bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700",
  legendary: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700",
};

export const CARD_EMOJIS: Record<string, string> = {
  A: "🍎", B: "🐦", C: "🐱", D: "🐶", E: "🐘", F: "🐸",
  G: "🦒", H: "🏠", I: "🍦", J: "🧃", K: "🪁", L: "🍭",
  M: "🐭", N: "🪹", O: "🐙", P: "🐧", Q: "👑", R: "🌈",
  S: "⭐", T: "🐢", U: "☂️", V: "🎻", W: "🐋", X: "🩻",
  Y: "🪀", Z: "🦓",
};

export const CARD_WORDS: Record<string, string> = {
  A: "Apple", B: "Bird", C: "Cat", D: "Dog", E: "Elephant", F: "Frog",
  G: "Giraffe", H: "House", I: "Ice cream", J: "Juice", K: "Kite", L: "Lollipop",
  M: "Mouse", N: "Nest", O: "Octopus", P: "Penguin", Q: "Queen", R: "Rainbow",
  S: "Star", T: "Turtle", U: "Umbrella", V: "Violin", W: "Whale", X: "X-ray",
  Y: "Yo-yo", Z: "Zebra",
};

export const CARD_STORAGE_KEY = "alphabet-adventure-cards";

export interface CardEntry {
  letter: string;
  tier: CardTier;
  count: number;
  lastCollected?: number;
}

export interface CardCollection {
  cards: CardEntry[];
  totalPoints: number;
  dropPower: number;
}

export function emptyCollection(): CardCollection {
  return { cards: [], totalPoints: 0, dropPower: 0 };
}

export function loadCollection(): CardCollection {
  if (typeof window === "undefined") return emptyCollection();
  try {
    const raw = localStorage.getItem(CARD_STORAGE_KEY);
    if (!raw) return emptyCollection();
    return JSON.parse(raw);
  } catch {
    return emptyCollection();
  }
}

export function saveCollection(collection: CardCollection): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(collection));
}

export function addCard(letter: string, tier: CardTier): { collection: CardCollection; isNew: boolean } {
  const collection = loadCollection();
  const existing = collection.cards.find(
    (c) => c.letter === letter && c.tier === tier
  );
  const isNew = !existing;
  const now = Date.now();
  if (existing) {
    existing.count++;
    existing.lastCollected = now;
  } else {
    collection.cards.push({ letter, tier, count: 1, lastCollected: now });
  }
  collection.totalPoints += TIER_POINTS[tier];
  saveCollection(collection);
  return { collection, isNew };
}

const DROP_RATES: Array<{ tier: CardTier | null; base: number; max: number }> = [
  { tier: null, base: 90.9, max: 82 },
  { tier: "common", base: 5, max: 3 },
  { tier: "uncommon", base: 2.5, max: 6 },
  { tier: "rare", base: 1, max: 5.5 },
  { tier: "ultra-rare", base: 0.5, max: 2.5 },
  { tier: "legendary", base: 0.1, max: 1 },
];

function interpolateRate(base: number, max: number, streak: number): number {
  const t = Math.min(streak, 20) / 20;
  return base + (max - base) * t;
}

export function getDropRate(tier: CardTier, streak: number): number {
  const entry = DROP_RATES.find(r => r.tier === tier);
  if (!entry) return 0;
  return interpolateRate(entry.base, entry.max, streak);
}

export function getNoneDropRate(streak: number): number {
  return interpolateRate(90.9, 82, streak);
}

export function getEffectiveStreak(dropStreak: number, dropPower: number): number {
  return Math.min(20, dropStreak + dropPower);
}

export function rollCardDrop(dropStreak: number, dropPower: number): CardTier | null {
  const effective = getEffectiveStreak(dropStreak, dropPower);
  const clamped = Math.min(Math.max(effective, 0), 20);
  const roll = Math.random() * 100;
  let cumulative = 0;

  for (const { tier, base, max } of DROP_RATES) {
    cumulative += interpolateRate(base, max, clamped);
    if (roll < cumulative) return tier;
  }

  return null;
}

export function pickLetter(tier: CardTier): string {
  const letters = TIER_LETTERS[tier];
  return letters[Math.floor(Math.random() * letters.length)];
}
