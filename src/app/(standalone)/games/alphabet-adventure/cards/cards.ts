import { shuffleArray } from '@/lib/shuffle';
import { CARD_DROP_RATES, interpolateRate } from '../constants';
import type { CardTier } from '../constants';

export type { CardTier };

export const TIER_ORDER: CardTier[] = ['common', 'uncommon', 'rare', 'ultra-rare', 'legendary'];

export const TIER_LETTERS: Record<CardTier, string[]> = {
  common: ['E', 'T', 'A', 'O', 'I', 'S'],
  uncommon: ['N', 'H', 'R', 'D', 'L', 'C'],
  rare: ['U', 'M', 'W', 'F', 'G'],
  'ultra-rare': ['Y', 'P', 'B', 'V', 'K'],
  legendary: ['J', 'X', 'Q', 'Z'],
};

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

export const CARD_WORDS: Record<string, string> = {
  A: 'Apple',
  B: 'Bird',
  C: 'Cat',
  D: 'Dog',
  E: 'Elephant',
  F: 'Frog',
  G: 'Giraffe',
  H: 'House',
  I: 'Ice cream',
  J: 'Juice',
  K: 'Kite',
  L: 'Lollipop',
  M: 'Mouse',
  N: 'Nest',
  O: 'Octopus',
  P: 'Penguin',
  Q: 'Queen',
  R: 'Rainbow',
  S: 'Star',
  T: 'Turtle',
  U: 'Umbrella',
  V: 'Violin',
  W: 'Whale',
  X: 'X-ray',
  Y: 'Yo-yo',
  Z: 'Zebra',
};

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
  if (typeof window === 'undefined') return emptyCollection();
  try {
    const raw = localStorage.getItem(CARD_STORAGE_KEY);
    if (!raw) return emptyCollection();
    return JSON.parse(raw);
  } catch {
    return emptyCollection();
  }
}

export function saveCollection(collection: CardCollection): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(collection));
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

export function rollCardDrop(dropStreak: number, dropPower: number): CardTier | null {
  const clamped = getEffectiveStreak(dropStreak, dropPower);
  const roll = Math.random() * 100;
  let cumulative = 0;

  for (const { tier, base, max } of CARD_DROP_RATES) {
    cumulative += interpolateRate(base, max, clamped);
    if (roll < cumulative) return tier;
  }

  return null;
}
const tierLetterPools = new Map<CardTier, string[]>();

export function pickLetter(tier: CardTier): string {
  let pool = tierLetterPools.get(tier);
  if (!pool || pool.length === 0) {
    pool = shuffleArray(TIER_LETTERS[tier]);
    tierLetterPools.set(tier, pool);
  }
  return pool.pop()!;
}
