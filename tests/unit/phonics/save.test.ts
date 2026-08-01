import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loadSave,
  writeSave,
  deleteSave,
  getActiveSlot,
  setActiveSlot,
  getSlotPreview,
  getDefaultSave,
  recordRound,
} from '@/app/(website)/games/phonics/save';
import type { SaveData } from '@/app/(website)/games/phonics/types';

function mockLocalStorage(store: Record<string, string> = {}) {
  const mock = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      for (const k of Object.keys(store)) delete store[k];
    }),
    length: 0,
    key: vi.fn(),
  };
  vi.stubGlobal('localStorage', mock);
  return { store, mock };
}

const NOW = 1_700_000_000_000;

function makeSave(overrides: Partial<SaveData> = {}): SaveData {
  return {
    ...getDefaultSave('Test'),
    timestamp: NOW,
    ...overrides,
  };
}

describe('save layer', () => {
  let ls: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    vi.stubGlobal('window', globalThis);
    ls = mockLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ─── writeSave non-mutating ─────────────────────────────────────────────────

  it('writeSave does not mutate the data object', () => {
    const data = makeSave({ name: 'Alice' });
    const originalTs = data.timestamp;

    writeSave(1, data);

    expect(data.timestamp).toBe(originalTs);
  });

  // ─── writeSave + loadSave roundtrip ─────────────────────────────────────────

  it('writes and loads data correctly', () => {
    const data = makeSave({ name: 'Bob', phonemeCoins: 500 });
    writeSave(1, data);

    const loaded = loadSave(1);
    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe('Bob');
    expect(loaded!.phonemeCoins).toBe(500);
    expect(loaded!.version).toBe(3);
    expect(loaded!.timestamp).toBeGreaterThan(0);
  });

  it('loadSave returns null for non-existent slot', () => {
    expect(loadSave(99)).toBeNull();
  });

  // ─── loadSave backfill guards ───────────────────────────────────────────────

  it('loadSave backfills settings.muted when missing', () => {
    const data = makeSave();
    const partial = JSON.parse(JSON.stringify(data));
    delete partial.settings;
    ls.store['phonics_save_1'] = JSON.stringify(partial);

    const loaded = loadSave(1);
    expect(loaded).not.toBeNull();
    expect(loaded!.settings.muted).toBe(false);
  });

  it('loadSave backfills tutorialCompleted when missing', () => {
    const data = makeSave();
    const partial = JSON.parse(JSON.stringify(data));
    delete partial.tutorialCompleted;
    ls.store['phonics_save_1'] = JSON.stringify(partial);

    const loaded = loadSave(1);
    expect(loaded).not.toBeNull();
    expect(loaded!.tutorialCompleted).toBe(false);
  });

  it('loadSave backfills totalCorrects when missing', () => {
    const data = makeSave();
    const partial = JSON.parse(JSON.stringify(data));
    delete partial.totalCorrects;
    ls.store['phonics_save_1'] = JSON.stringify(partial);

    const loaded = loadSave(1);
    expect(loaded).not.toBeNull();
    expect(loaded!.totalCorrects).toBe(0);
  });

  it('loadSave backfills phonemeCoins when missing', () => {
    const partial: Record<string, unknown> = {
      version: 3,
      name: 'Test',
      timestamp: Date.now(),
      companion: 'nox',
      phonemeStats: {},
      settings: { muted: false, glassLevel: 25 },
      totalRoundsPlayed: 0,
      totalCorrects: 0,
      bestStreak: 0,
      currentStreak: 0,
      definitionStats: { defToWord: { correct: 0, total: 0 }, wordToDef: { correct: 0, total: 0 } },
      lessonProgress: {},
      activityProgress: {},
      unlockedCompanions: ['nox', 'mira', 'chip'],
      unlockedGroupIds: ['animals', 'body-parts', 'colors-shapes', 'family-people'],
      groupProgress: {},
      placementTier: undefined,
      challengeDifficulty: 'b1',
      achievements: {},
    };
    // deliberately omit phonemeCoins
    ls.store['phonics_save_1'] = JSON.stringify(partial);

    const loaded = loadSave(1);
    expect(loaded).not.toBeNull();
    expect(loaded!.phonemeCoins).toBe(0);
  });

  // ─── deleteSave ─────────────────────────────────────────────────────────────

  it('deleteSave removes data from localStorage', () => {
    writeSave(1, makeSave());
    expect(loadSave(1)).not.toBeNull();

    deleteSave(1);
    expect(loadSave(1)).toBeNull();
  });

  // ─── getSlotPreview ─────────────────────────────────────────────────────────

  it('getSlotPreview returns empty for non-existent slot', () => {
    const preview = getSlotPreview(99);
    expect(preview.empty).toBe(true);
    expect(preview.slot).toBe(99);
  });

  // ─── getActiveSlot / setActiveSlot ──────────────────────────────────────────

  it('getActiveSlot returns guest when no active slot set', () => {
    expect(getActiveSlot()).toBe('guest');
  });

  it('setActiveSlot and getActiveSlot roundtrip', () => {
    setActiveSlot(2);
    expect(getActiveSlot()).toBe(2);
  });

  it('getActiveSlot returns guest for invalid stored value', () => {
    ls.store['phonics_active_slot'] = 'not-a-number';
    expect(getActiveSlot()).toBe('guest');
  });

  // ─── recordRound pure ───────────────────────────────────────────────────────

  it('recordRound returns a new object without mutating original', () => {
    const save = makeSave({ totalCorrects: 10, bestStreak: 5, phonemeCoins: 100 });
    const result = recordRound(save, 8, 12, 50);

    expect(result.totalCorrects).toBe(18);
    expect(result.bestStreak).toBe(12);
    expect(result.phonemeCoins).toBe(150);
    expect(result.totalRoundsPlayed).toBe(save.totalRoundsPlayed + 1);
    // original unchanged
    expect(save.totalCorrects).toBe(10);
    expect(save.bestStreak).toBe(5);
    expect(save.phonemeCoins).toBe(100);
  });
});
