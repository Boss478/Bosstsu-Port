import { shuffleArray } from '@/lib/shuffle';
import {
  CARD_DROP_RATES,
  WIN_DROP_RATES,
  interpolateRate,
  RAMP_DROP,
  rampRate,
} from '../constants';
import type { CardTier } from '../constants';
import { safeGetJSON, safeSetJSON } from '@/lib/storage';

export type { CardTier };

export const TIER_ORDER: CardTier[] = ['common', 'uncommon', 'rare', 'ultra-rare', 'legendary'];

export const TIER_LETTERS: Record<CardTier, string[]> = {
  common: [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'R',
    'S',
    'T',
    'U',
    'W',
  ],
  uncommon: [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'R',
    'S',
    'T',
    'U',
    'W',
  ],
  rare: [
    'A',
    'B',
    'C',
    'E',
    'F',
    'G',
    'I',
    'L',
    'M',
    'N',
    'O',
    'P',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'Y',
  ],
  'ultra-rare': [
    'A',
    'B',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'N',
    'O',
    'Q',
    'U',
    'V',
    'X',
    'Z',
  ],
  legendary: ['A', 'D', 'E', 'F', 'G', 'I', 'J', 'K', 'O', 'Q', 'S', 'U', 'V', 'W', 'X', 'Y', 'Z'],
};

export const TOTAL_CARD_SLOTS: number = TIER_ORDER.reduce(
  (sum, tier) => sum + TIER_LETTERS[tier].length,
  0,
);

const TIER_POINTS: Record<CardTier, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  'ultra-rare': 5,
  legendary: 10,
};

export const TIER_LABELS: Record<CardTier, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  'ultra-rare': 'Ultra Rare',
  legendary: 'Legendary',
};

const HOLOGRAPHIC_TIERS: CardTier[] = ['rare', 'ultra-rare', 'legendary'];

export function isHolographicTier(tier: CardTier): boolean {
  return HOLOGRAPHIC_TIERS.includes(tier);
}

// Word per (letter, tier) card — rev 3 approved list (U-UR "Unicycle", V-UR "Van" added).
export const CARD_WORDS: Record<string, Partial<Record<CardTier, string>>> = {
  A: {
    common: 'Apple',
    uncommon: 'Ant',
    rare: 'Axe',
    'ultra-rare': 'Alligator',
    legendary: 'Astronaut',
  },
  B: { common: 'Ball', uncommon: 'Bird', rare: 'Banana', 'ultra-rare': 'Bear' },
  C: { common: 'Cat', uncommon: 'Cow', rare: 'Car' },
  D: { common: 'Dog', uncommon: 'Duck', 'ultra-rare': 'Dolphin', legendary: 'Dragon' },
  E: { common: 'Ear', uncommon: 'Eye', rare: 'Egg', 'ultra-rare': 'Elephant', legendary: 'Elf' },
  F: {
    common: 'Fish',
    uncommon: 'Fox',
    rare: 'Flower',
    'ultra-rare': 'Fire',
    legendary: 'Flamingo',
  },
  G: {
    common: 'Girl',
    uncommon: 'Grapes',
    rare: 'Guitar',
    'ultra-rare': 'Giraffe',
    legendary: 'Ghost',
  },
  H: { common: 'Hen', uncommon: 'Horse', 'ultra-rare': 'House' },
  I: {
    common: 'Igloo',
    uncommon: 'Ice cream',
    rare: 'Ice',
    'ultra-rare': 'Island',
    legendary: 'Iron',
  },
  J: { common: 'Jam', uncommon: 'Juice', 'ultra-rare': 'Jar', legendary: 'Jellyfish' },
  K: { common: 'Key', uncommon: 'Kangaroo', 'ultra-rare': 'Kid', legendary: 'King' },
  L: { common: 'Leg', uncommon: 'Leaf', rare: 'Lion' },
  M: { common: 'Milk', uncommon: 'Mouse', rare: 'Monkey' },
  N: { common: 'Nose', uncommon: 'Nest', rare: 'Necklace', 'ultra-rare': 'Ninja' },
  O: {
    common: 'Orange',
    uncommon: 'Octopus',
    rare: 'Owl',
    'ultra-rare': 'Onion',
    legendary: 'Ostrich',
  },
  P: { common: 'Pig', uncommon: 'Panda', rare: 'Penguin' },
  Q: { 'ultra-rare': 'Quartz', legendary: 'Queen' },
  R: { common: 'Rabbit', uncommon: 'Rocket', rare: 'Robot' },
  S: { common: 'Snake', uncommon: 'Strawberry', rare: 'Star', legendary: 'Sun' },
  T: { common: 'Tree', uncommon: 'Turtle', rare: 'Tiger' },
  U: {
    common: 'Umbrella',
    uncommon: 'Unicorn',
    rare: 'Ukulele',
    'ultra-rare': 'Unicycle',
    legendary: 'UFO',
  },
  V: { rare: 'Violin', 'ultra-rare': 'Van', legendary: 'Volcano' },
  W: { common: 'Water', uncommon: 'Watermelon', rare: 'Whale', legendary: 'Wizard' },
  X: { 'ultra-rare': 'X-Ray', legendary: 'Xylophone' },
  Y: { rare: 'Yellow', legendary: 'Yoyo' },
  Z: { 'ultra-rare': 'Zebra', legendary: 'Zombie' },
};

export function getCardWord(letter: string, tier: CardTier): string {
  return CARD_WORDS[letter.toUpperCase()]?.[tier] ?? '';
}

export function getBaseWord(letter: string): string {
  const entry = CARD_WORDS[letter.toUpperCase()];
  if (!entry) return '';
  for (const tier of TIER_ORDER) {
    const word = entry[tier];
    if (word) return word;
  }
  return '';
}

export const CARD_STORAGE_KEY = 'alphabet-adventure-cards';

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

function emptyCollection(): CardCollection {
  return { cards: [], totalPoints: 0, dropPower: 0 };
}

export function loadCollection(): CardCollection {
  return safeGetJSON<CardCollection>(CARD_STORAGE_KEY) ?? emptyCollection();
}

export function saveCollection(collection: CardCollection): void {
  safeSetJSON(CARD_STORAGE_KEY, collection);
}

export function addCard(
  letter: string,
  tier: CardTier,
): { collection: CardCollection; isNew: boolean } {
  const collection = loadCollection();
  const existing = collection.cards.find((c) => c.letter === letter && c.tier === tier);
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

export function getEffectiveStreak(dropStreak: number, dropPower: number): number {
  return Math.min(10, dropStreak + dropPower);
}

export function rollRampDrop(dropStreak: number): CardTier | null {
  if (Math.random() * 100 >= rampRate(dropStreak)) return null;
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const { tier, weight } of RAMP_DROP.split) {
    cumulative += weight;
    if (roll < cumulative) return tier;
  }
  return null;
}

export function rollCardDrop(dropStreak: number, dropPower: number): CardTier | null {
  const rampTier = rollRampDrop(dropStreak);
  if (rampTier) return rampTier;

  const clamped = getEffectiveStreak(dropStreak, dropPower);
  const roll = Math.random() * 100;
  let cumulative = 0;

  for (const { tier, base, max } of CARD_DROP_RATES) {
    cumulative += interpolateRate(base, max, clamped);
    if (roll < cumulative) return tier;
  }

  return null;
}

export function rollWinDrop(): CardTier | null {
  const roll = Math.random() * 100;
  let cumulative = 0;

  for (const { tier, base } of WIN_DROP_RATES) {
    cumulative += base;
    if (roll < cumulative) return tier;
  }

  return null;
}

// Cascade: a drop on a full tier (all its letters collected) converts up to the
// next collectible tier. Falls back to the original tier once all 95 are owned.
export function resolveDropTier(
  tier: CardTier,
  collection: CardCollection = loadCollection(),
): CardTier {
  let t: CardTier = tier;
  while (t) {
    const owned = new Set(collection.cards.filter((c) => c.tier === t).map((c) => c.letter));
    if (TIER_LETTERS[t].some((l) => !owned.has(l))) return t;
    const ni = TIER_ORDER.indexOf(t) + 1;
    if (ni >= TIER_ORDER.length) break;
    t = TIER_ORDER[ni];
  }
  return tier;
}
const tierLetterPools = new Map<CardTier, string[]>();

// Picks an uncollected letter of the tier (skips already-owned letters) so
// cascade keeps its no-dupe promise until the full 95-card set is complete.
export function pickLetter(tier: CardTier, collection: CardCollection): string {
  let pool = tierLetterPools.get(tier);
  if (!pool || pool.length === 0) {
    pool = shuffleArray(TIER_LETTERS[tier]);
    tierLetterPools.set(tier, pool);
  }
  const owned = new Set(collection.cards.filter((c) => c.tier === tier).map((c) => c.letter));
  let letter = pool.pop()!;
  while (pool.length > 0 && owned.has(letter)) {
    letter = pool.pop()!;
  }
  return letter;
}
