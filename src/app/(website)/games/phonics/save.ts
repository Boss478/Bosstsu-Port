'use client';

import type { SaveData, SlotPreview, CompanionId, AchievementId, VocabTier } from './types';
import { SAVE_VERSION } from './constants';
import { getGroupsByTier } from './vocab-group-defs';

const PREFIX = 'phonics_save_';
const ACTIVE_KEY = 'phonics_active_slot';

const ALL_ACHIEVEMENT_IDS: AchievementId[] = [
  'first_round',
  'sound_explorer',
  'vocab_master',
  'perfectionist',
  'streak_10',
  'streak_30',
  'phoneme_10',
  'phoneme_25',
  'phoneme_40',
  'phoneme_gold',
  'phoneme_allgold',
  'first_purchase',
  'collector_5',
  'millionaire',
  'speed_demon',
  'word_builder',
  'quiz_champ',
  'companion_friend',
  'match_10',
  'sort_50',
  'rhyme_20',
  'speed_spell_30',
  'syllable_50',
  'challenge_all',
  'challenge_allgold',
];

function getDefaultAchievements(): Record<
  string,
  { unlocked: boolean; unlockedAt: number; progress: number }
> {
  return Object.fromEntries(
    ALL_ACHIEVEMENT_IDS.map((id) => [id, { unlocked: false, unlockedAt: 0, progress: 0 }]),
  );
}

export function getDefaultSave(name: string): SaveData {
  return {
    version: SAVE_VERSION,
    name,
    timestamp: Date.now(),
    companion: 'nox' as CompanionId,
    totalCorrects: 0,
    phonemeCoins: 0,
    phonemeStats: {},
    settings: { muted: false, glassLevel: 25, gridColumns: 2, companionSnap: 'free' },
    tutorialCompleted: false,
    totalRoundsPlayed: 0,
    bestStreak: 0,
    currentStreak: 0,
    definitionStats: {
      defToWord: { correct: 0, total: 0 },
      wordToDef: { correct: 0, total: 0 },
    },
    lessonProgress: {},
    activityProgress: {},
    unlockedCompanions: ['nox', 'mira', 'chip'],
    // v4 — Vocab Groups
    unlockedGroupIds: getGroupsByTier('easy').slice(0, 4).map(g => g.id),
    groupProgress: {},
    placementTier: undefined,
    challengeDifficulty: 'b1',
    // v3 fields
    achievements: getDefaultAchievements(),
    challengeStats: {},
    companionInteractions: 0,
    lastCompanionHintLevel: 0,
    lastCompanionHintTime: 0,
  };
}

export function loadSave(slot: number): SaveData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${PREFIX}${slot}`);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (typeof data.version !== 'number') throw new Error('Invalid version');
    if (data.version < SAVE_VERSION) return migrateSave(data);
    if (data.version > SAVE_VERSION) throw new Error('Future version');
    if (!data.companion || !data.phonemeStats) throw new Error('Corrupted');
    // Backfill optional fields added in later versions
    if (!data.definitionStats) {
      data.definitionStats = {
        defToWord: { correct: 0, total: 0 },
        wordToDef: { correct: 0, total: 0 },
      };
    }
    if (!data.lessonProgress) {
      data.lessonProgress = {};
    }
    if (!data.activityProgress) {
      data.activityProgress = {};
    }
    if (!data.unlockedCompanions) {
      data.unlockedCompanions = ['nox', 'mira', 'chip'];
    }
    // v4 backfill
    if (!data.unlockedGroupIds || data.unlockedGroupIds.length === 0) {
      data.unlockedGroupIds = getGroupsByTier('easy').slice(0, 4).map(g => g.id);
    }
    if (!data.groupProgress) {
      data.groupProgress = {};
    }
    if (typeof data.challengeDifficulty !== 'string') {
      data.challengeDifficulty = 'b1';
    }
    if (!data.settings || typeof data.settings.muted !== 'boolean') {
      data.settings = { ...data.settings, muted: false };
    }
    if (typeof data.settings.glassLevel !== 'number') {
      data.settings = { ...data.settings, glassLevel: 25 };
    }
    if (data.settings.gridColumns !== 2 && data.settings.gridColumns !== 3) {
      data.settings = { ...data.settings, gridColumns: 2 };
    }
    if (data.settings.companionSnap !== 'left' && data.settings.companionSnap !== 'right') {
      data.settings = { ...data.settings, companionSnap: 'free' };
    }
    if (typeof data.tutorialCompleted !== 'boolean') {
      data.tutorialCompleted = false;
    }
    if (typeof data.totalCorrects !== 'number') {
      data.totalCorrects = 0;
    }
    if (typeof data.phonemeCoins !== 'number') {
      data.phonemeCoins = 0;
    }
    if (typeof data.name !== 'string') {
      data.name = 'Slot';
    }
    // v3 backfill
    if (!data.achievements) {
      data.achievements = getDefaultAchievements();
    }
    if (!data.challengeStats) {
      data.challengeStats = {};
    }
    if (typeof data.companionInteractions !== 'number') {
      data.companionInteractions = 0;
    }
    if (typeof data.lastCompanionHintLevel !== 'number') {
      data.lastCompanionHintLevel = 0;
    }
    if (typeof data.lastCompanionHintTime !== 'number') {
      data.lastCompanionHintTime = 0;
    }
    return data;
  } catch (e) {
    console.warn('[phonics] Save load error:', e);
    return null;
  }
}

const OLD_LESSON_PREFIXES = ['basic-', 'cons-', 'vowel-', 'long-', 'diph-', 'master-'];

function hasOldLessonIds(data: Partial<SaveData>): boolean {
  if (!data.lessonProgress) return false;
  return Object.keys(data.lessonProgress).some((k) =>
    OLD_LESSON_PREFIXES.some((prefix) => k.startsWith(prefix)),
  );
}

const CEFR_TO_TIERS: Record<string, VocabTier[]> = {
  a1: ['easy'],
  a2: ['easy', 'easy-medium'],
  b1: ['easy', 'easy-medium', 'medium'],
  b2: ['easy', 'easy-medium', 'medium', 'medium-hard'],
  c1: ['easy', 'easy-medium', 'medium', 'medium-hard', 'hard'],
  c2: ['easy', 'easy-medium', 'medium', 'medium-hard', 'hard'],
};

function migrateSave(data: Partial<SaveData>): SaveData {
  const defaults = getDefaultSave(data.name ?? 'Slot');
  // Version 1→2: path redesign — clear old lesson progress
  if (hasOldLessonIds(data)) {
    data.lessonProgress = {};
  }
  // Version 3→4: CEFR level → group-based progression
  if ((data.version ?? 0) < 4) {
    const oldData = data as Record<string, unknown>;
    const oldCefr = (oldData.cefrLevel as string) ?? 'a1';
    const tiers = CEFR_TO_TIERS[oldCefr] ?? ['easy'];
    const groupIds: string[] = [];
    for (const tier of tiers) {
      const groups = getGroupsByTier(tier);
      for (const g of groups) {
        groupIds.push(g.id);
      }
    }
    data.unlockedGroupIds = groupIds;
    data.groupProgress = {};
    data.challengeDifficulty = 'b1';
    // Strip old CEFR fields
    delete (oldData as any).cefrLevel;
    delete (oldData as any).cefrUpgradeStreak;
  }
  return { ...defaults, ...data, version: SAVE_VERSION };
}

export function writeSave(slot: number, data: SaveData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${PREFIX}${slot}`, JSON.stringify({ ...data, timestamp: Date.now() }));
  } catch (e) {
    console.warn('[phonics] Save write error:', e);
  }
}

export function deleteSave(slot: number): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${PREFIX}${slot}`);
  try {
    localStorage.removeItem('phonics-companion-pos');
  } catch {}
}

export function getActiveSlot(): number | 'guest' {
  if (typeof window === 'undefined') return 'guest';
  const v = localStorage.getItem(ACTIVE_KEY);
  if (!v) return 'guest';
  if (v === 'guest') return 'guest';
  const n = parseInt(v, 10);
  return isNaN(n) ? 'guest' : n;
}

export function setActiveSlot(slot: number | 'guest'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_KEY, String(slot));
}

export function getSlotPreview(slot: number): SlotPreview {
  const data = loadSave(slot);
  if (!data) {
    return {
      slot,
      empty: true,
      name: `Slot ${slot}`,
      companion: null,
      coins: 0,
      rounds: 0,
      bestStreak: 0,
      timestamp: null,
    };
  }
  return {
    slot,
    empty: false,
    name: data.name,
    companion: data.companion,
    coins: data.phonemeCoins,
    rounds: data.totalRoundsPlayed,
    bestStreak: data.bestStreak,
    timestamp: data.timestamp,
  };
}

export function recordRound(
  save: SaveData,
  corrects: number,
  streak: number,
  coins: number,
): SaveData {
  return {
    ...save,
    totalCorrects: save.totalCorrects + corrects,
    totalRoundsPlayed: save.totalRoundsPlayed + 1,
    bestStreak: Math.max(save.bestStreak, streak),
    currentStreak: streak,
    phonemeCoins: save.phonemeCoins + coins,
  };
}
