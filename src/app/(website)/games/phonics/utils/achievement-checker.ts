'use client';

import type { SaveData, AchievementId, BadgeRecord } from '../types';
import { SIMILAR_SOUND_GROUPS, CEFR_LEVEL_ORDER } from '../constants';

export interface AchievementContext {
  roundResult?: {
    accuracy: number;
    streak: number;
    category: string;
    phonemeIds?: string[];
  };
  challengeResult?: {
    type: string;
    totalCorrect: number;
  };
  shopPurchase?: boolean;
  companionClick?: boolean;
  wordBuilderLookup?: boolean;
  wordQuizComplete?: boolean;
}

const CHALLENGE_TYPES = ['phoneme-match', 'sound-sort', 'rhyme-time', 'speed-spell', 'syllable-smash'] as const;

function phonemeMasteryCount(save: SaveData): number {
  return Object.values(save.phonemeStats).filter((s) => s.total >= 3 && s.correct / s.total >= 0.7).length;
}

function allPhonemeGold(save: SaveData): boolean {
  return Object.entries(save.phonemeStats).length >= 40 &&
    Object.values(save.phonemeStats).every((s) => s.total >= 1 && s.correct / s.total >= 0.95);
}

function allGroupsCompleted(save: SaveData): boolean {
  return SIMILAR_SOUND_GROUPS.every((g) =>
    g.phonemeIds.some((pid) => {
      const s = save.phonemeStats[pid];
      return s && s.total > 0;
    }),
  );
}

function allVocabLevelsCompleted(save: SaveData): boolean {
  return CEFR_LEVEL_ORDER.every((level) => {
    const lessons = Object.values(save.lessonProgress);
    return lessons.some((l) => l.completed && l.bestScore >= 60);
  });
}

function challengeTypeAllGold(save: SaveData): boolean {
  return CHALLENGE_TYPES.every((t) => {
    const s = save.challengeStats[t];
    return s && s.roundsPlayed >= 1 && s.totalAttempts > 0 && s.totalCorrect / s.totalAttempts >= 0.95;
  });
}

function challengeTypeAllCompleted(save: SaveData): boolean {
  return CHALLENGE_TYPES.every((t) => {
    const s = save.challengeStats[t];
    return s && s.roundsPlayed >= 1;
  });
}

export function checkAchievements(
  save: SaveData,
  context?: AchievementContext,
): AchievementId[] {
  const newlyUnlocked: AchievementId[] = [];
  const now = Date.now();

  function unlock(id: AchievementId) {
    if (save.achievements[id]?.unlocked) return;
    const record: BadgeRecord = { unlocked: true, unlockedAt: now, progress: 100 };
    save.achievements[id] = record;
    newlyUnlocked.push(id);
  }

  function updateProgress(id: AchievementId, progress: number) {
    const existing = save.achievements[id];
    if (!existing || existing.unlocked) return;
    save.achievements[id] = { ...existing, progress: Math.min(100, Math.max(existing.progress, progress)) };
  }

  const accuracy = context?.roundResult?.accuracy ?? 0;
  const streak = context?.roundResult?.streak ?? save.currentStreak;
  const masteredCount = phonemeMasteryCount(save);
  const totalCoins = save.phonemeCoins;

  // ── Progress ──
  if (save.totalRoundsPlayed >= 1) unlock('first_round');
  if (allGroupsCompleted(save)) unlock('sound_explorer');
  if (allVocabLevelsCompleted(save)) unlock('vocab_master');
  if (accuracy === 100 && save.totalRoundsPlayed >= 1) unlock('perfectionist');

  if (streak >= 10) unlock('streak_10');
  if (streak >= 30) unlock('streak_30');
  updateProgress('streak_10', Math.round((streak / 10) * 100));
  updateProgress('streak_30', Math.round((streak / 30) * 100));

  // ── Phoneme ──
  if (masteredCount >= 10) unlock('phoneme_10');
  if (masteredCount >= 25) unlock('phoneme_25');
  if (masteredCount >= 40) unlock('phoneme_40');

  const phonemeIds = context?.roundResult?.phonemeIds ?? [];
  if (phonemeIds.length > 0 && accuracy === 100) {
    const phoneme = phonemeIds[0];
    if (phoneme && save.phonemeStats[phoneme]?.total >= 3 && save.phonemeStats[phoneme]?.correct / save.phonemeStats[phoneme]?.total >= 0.95) {
      unlock('phoneme_gold');
    }
  }
  if (allPhonemeGold(save)) unlock('phoneme_allgold');

  const totalPhonemes = Object.keys(save.phonemeStats).length;
  updateProgress('phoneme_10', Math.round((Math.min(totalPhonemes, 10) / 10) * 100));
  updateProgress('phoneme_25', Math.round((Math.min(totalPhonemes, 25) / 25) * 100));
  updateProgress('phoneme_40', Math.round((Math.min(totalPhonemes, 40) / 40) * 100));

  // ── Economy ──
  if (context?.shopPurchase) {
    const itemCount = (save.unlockedItems?.length ?? 0) + save.unlockedCompanions.length - 3;
    if (itemCount >= 1 || save.unlockedCompanions.length > 3) unlock('first_purchase');
  }
  if (!save.achievements.first_purchase?.unlocked && save.unlockedCompanions.length > 3) {
    unlock('first_purchase');
  }
  if (save.unlockedCompanions.length >= 5) unlock('collector_5');
  updateProgress('collector_5', Math.round((Math.max(0, save.unlockedCompanions.length - 3) / 2) * 100));

  if (totalCoins >= 1000) unlock('millionaire');
  updateProgress('millionaire', Math.round((Math.min(totalCoins, 1000) / 1000) * 100));

  // ── Skill ──
  if (context?.roundResult?.category === 'spelling' && context?.roundResult?.accuracy === 100) {
    unlock('speed_demon');
  }
  if (context?.wordBuilderLookup) {
    updateProgress('word_builder', Math.round(Math.min(save.phonemeStats ? Object.keys(save.phonemeStats).length * 5 : 0, 100)));
  }
  if (context?.wordQuizComplete) {
    unlock('quiz_champ');
  }
  if (context?.companionClick || save.companionInteractions >= 100) {
    if (save.companionInteractions >= 100) unlock('companion_friend');
    updateProgress('companion_friend', Math.round((Math.min(save.companionInteractions, 100) / 100) * 100));
  }

  // ── Challenge ──
  if (context?.challengeResult) {
    const type = context.challengeResult.type;

    if (type === 'phoneme-match') {
      updateProgress('match_10', Math.round(Math.min(save.challengeStats['phoneme-match']?.roundsPlayed ?? 0, 10) / 10 * 100));
      if ((save.challengeStats['phoneme-match']?.roundsPlayed ?? 0) >= 10) unlock('match_10');
    }
    if (type === 'sound-sort') {
      updateProgress('sort_50', Math.round(Math.min(save.challengeStats['sound-sort']?.totalCorrect ?? 0, 50) / 50 * 100));
      if ((save.challengeStats['sound-sort']?.totalCorrect ?? 0) >= 50) unlock('sort_50');
    }
    if (type === 'rhyme-time') {
      updateProgress('rhyme_20', Math.round(Math.min(save.challengeStats['rhyme-time']?.totalCorrect ?? 0, 20) / 20 * 100));
      if ((save.challengeStats['rhyme-time']?.totalCorrect ?? 0) >= 20) unlock('rhyme_20');
    }
    if (type === 'speed-spell') {
      updateProgress('speed_spell_30', Math.round(Math.min(save.challengeStats['speed-spell']?.totalCorrect ?? 0, 30) / 30 * 100));
      if ((save.challengeStats['speed-spell']?.totalCorrect ?? 0) >= 30) unlock('speed_spell_30');
    }
    if (type === 'syllable-smash') {
      updateProgress('syllable_50', Math.round(Math.min(save.challengeStats['syllable-smash']?.totalCorrect ?? 0, 50) / 50 * 100));
      if ((save.challengeStats['syllable-smash']?.totalCorrect ?? 0) >= 50) unlock('syllable_50');
    }
  }

  if (challengeTypeAllCompleted(save)) unlock('challenge_all');
  if (challengeTypeAllGold(save)) unlock('challenge_allgold');

  return newlyUnlocked;
}
