'use client';

import type { SaveData, SlotPreview, CompanionId } from './types';
import { SAVE_VERSION } from './constants';

const PREFIX = 'phonics_save_';
const ACTIVE_KEY = 'phonics_active_slot';

export function getDefaultSave(name: string): SaveData {
  return {
    version: SAVE_VERSION,
    name,
    timestamp: Date.now(),
    companion: 'nox' as CompanionId,
    totalCorrects: 0,
    phonemeCoins: 0,
    phonemeStats: {},
    settings: { muted: false, glassLevel: 25 },
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
    cefrLevel: 'a1',
    cefrUpgradeStreak: 0,
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
    if (!data.cefrLevel) {
      data.cefrLevel = 'a1';
    }
    if (typeof data.cefrUpgradeStreak !== 'number') {
      data.cefrUpgradeStreak = 0;
    }
    if (typeof data.settings.glassLevel !== 'number') {
      data.settings.glassLevel = 25;
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
  return Object.keys(data.lessonProgress).some(k =>
    OLD_LESSON_PREFIXES.some(prefix => k.startsWith(prefix))
  );
}

function migrateSave(data: Partial<SaveData>): SaveData {
  const defaults = getDefaultSave(data.name ?? 'Slot');
  // Version 1→2: path redesign — clear old lesson progress
  if (hasOldLessonIds(data)) {
    data.lessonProgress = {};
  }
  return { ...defaults, ...data, version: SAVE_VERSION };
}

export function writeSave(slot: number, data: SaveData): void {
  if (typeof window === 'undefined') return;
  try {
    data.timestamp = Date.now();
    localStorage.setItem(`${PREFIX}${slot}`, JSON.stringify(data));
  } catch (e) {
    console.warn('[phonics] Save write error:', e);
  }
}

export function deleteSave(slot: number): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${PREFIX}${slot}`);
  try { localStorage.removeItem('phonics-companion-pos'); } catch {}
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
