import { describe, it, expect } from 'vitest';
import { checkAchievements } from '@/app/(website)/games/phonics/utils/achievement-checker';
import type { SaveData } from '@/app/(website)/games/phonics/types';
import { SAVE_VERSION } from '@/app/(website)/games/phonics/constants';

function makeSave(overrides: Partial<SaveData> = {}): SaveData {
  return {
    version: SAVE_VERSION,
    name: 'Test',
    timestamp: 1_700_000_000_000,
    companion: 'nox',
    totalCorrects: 0,
    phonemeCoins: 0,
    phonemeStats: {},
    settings: { muted: false, glassLevel: 25 },
    tutorialCompleted: false,
    totalRoundsPlayed: 0,
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
    challengeStats: {},
    companionInteractions: 0,
    lastCompanionHintLevel: 0,
    lastCompanionHintTime: 0,
    ...overrides,
  };
}

describe('checkAchievements', () => {
  // ── 3.1: companion_friend unconditional progress ─────────────────────────
  describe('companion_friend', () => {
    it('updates progress unconditionally based on save.companionInteractions', () => {
      const save = makeSave({ companionInteractions: 50 });
      checkAchievements(save);
      expect(save.achievements.companion_friend?.progress).toBe(50);
    });

    it('unlocks at 100 interactions without any context flags', () => {
      const save = makeSave({ companionInteractions: 100 });
      const unlocked = checkAchievements(save);
      expect(unlocked).toContain('companion_friend');
      expect(save.achievements.companion_friend?.unlocked).toBe(true);
    });

    it('progress cap at 100', () => {
      const save = makeSave({ companionInteractions: 999 });
      checkAchievements(save);
      expect(save.achievements.companion_friend?.progress).toBe(100);
    });
  });

  // ── 3.2 + 3.3: first_purchase without dead context flags ────────────────
  describe('first_purchase', () => {
    it('unlocks when companions exceed base 3 (save-data only)', () => {
      const save = makeSave({ unlockedCompanions: ['nox', 'mira', 'chip', 'shade'] });
      const unlocked = checkAchievements(save);
      expect(unlocked).toContain('first_purchase');
    });

    it('handles missing unlockedItems gracefully', () => {
      const save = makeSave({
        unlockedCompanions: ['nox', 'mira', 'chip', 'shade'],
        unlockedItems: undefined,
      });
      const unlocked = checkAchievements(save);
      expect(unlocked).toContain('first_purchase');
    });

    it('unlocks when items are purchased (unlockedItems has entries)', () => {
      const save = makeSave({ unlockedItems: ['skin_1'] });
      const unlocked = checkAchievements(save);
      expect(unlocked).toContain('first_purchase');
    });

    it('does not unlock with only default companions and no items', () => {
      const save = makeSave({ unlockedCompanions: ['nox', 'mira', 'chip'] });
      const unlocked = checkAchievements(save);
      expect(unlocked).not.toContain('first_purchase');
    });
  });

  // ── 3.4: Removed dead wordBuilderLookup / wordQuizComplete ──────────────
  describe('removed dead context flags', () => {
    it('word_builder progress is no longer updated via wordBuilderLookup', () => {
      const save = makeSave();
      checkAchievements(save);
      expect(save.achievements.word_builder?.progress ?? 0).toBe(0);
    });

    it('quiz_champ is no longer unlocked via wordQuizComplete', () => {
      const save = makeSave();
      const unlocked = checkAchievements(save);
      expect(unlocked).not.toContain('quiz_champ');
    });
  });
});
