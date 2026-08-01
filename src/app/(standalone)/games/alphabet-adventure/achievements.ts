'use client';

import { safeGetJSON, safeSetJSON } from '@/lib/storage';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface AchievementState {
  unlocked: boolean;
  unlockedAt?: number;
}

const ACHIEVEMENTS_KEY = 'alphabet-adventure-achievements';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_card',
    name: 'First Card',
    description: 'Collected your first card',
    icon: '🃏',
    tier: 'bronze',
  },
  {
    id: 'card_10',
    name: 'Collector',
    description: 'Collected 10 cards',
    icon: '🃏',
    tier: 'bronze',
  },
  {
    id: 'card_25',
    name: 'Card Hunter',
    description: 'Collected 25 cards',
    icon: '🃏',
    tier: 'silver',
  },
  {
    id: 'card_50',
    name: 'Card Master',
    description: 'Collected 50 cards',
    icon: '🃏',
    tier: 'silver',
  },
  {
    id: 'card_75',
    name: 'Card Wizard',
    description: 'Collected 75 cards',
    icon: '🃏',
    tier: 'gold',
  },
  {
    id: 'card_95',
    name: 'Full Deck',
    description: 'Collected all 95 cards',
    icon: '🃏',
    tier: 'platinum',
  },
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Reached a 3-answer streak',
    icon: '🔥',
    tier: 'bronze',
  },
  {
    id: 'streak_5',
    name: 'On Fire',
    description: 'Reached a 5-answer streak',
    icon: '🔥',
    tier: 'bronze',
  },
  {
    id: 'streak_10',
    name: 'Unstoppable',
    description: 'Reached a 10-answer streak',
    icon: '🔥',
    tier: 'silver',
  },
  {
    id: 'streak_20',
    name: 'Legendary Streak',
    description: 'Reached a 20-answer streak',
    icon: '🔥',
    tier: 'gold',
  },
  {
    id: 'first_stage',
    name: 'First Stage',
    description: 'Completed your first stage',
    icon: '🏆',
    tier: 'bronze',
  },
  {
    id: 'stage_3',
    name: 'Halfway There',
    description: 'Completed 3 stages',
    icon: '🏆',
    tier: 'silver',
  },
  {
    id: 'stage_6',
    name: 'Grand Champion',
    description: 'Completed all 6 stages',
    icon: '🏆',
    tier: 'platinum',
  },
  {
    id: 'perfect_lesson',
    name: 'Perfect Lesson',
    description: 'Got 100% on a lesson',
    icon: '⭐',
    tier: 'silver',
  },
  {
    id: 'perfect_stage',
    name: 'Perfect Stage',
    description: 'Got 3 stars on every lesson in a stage',
    icon: '⭐',
    tier: 'gold',
  },
  {
    id: 'score_100',
    name: 'Century',
    description: 'Reached 100 total score',
    icon: '💯',
    tier: 'bronze',
  },
  {
    id: 'score_500',
    name: 'High Scorer',
    description: 'Reached 500 total score',
    icon: '💯',
    tier: 'silver',
  },
  {
    id: 'score_1000',
    name: 'Score Legend',
    description: 'Reached 1,000 total score',
    icon: '💯',
    tier: 'gold',
  },
  {
    id: 'first_practice',
    name: 'Practice Makes Perfect',
    description: 'Completed a practice session',
    icon: '🎯',
    tier: 'bronze',
  },
  {
    id: 'vowel_master',
    name: 'Vowel Master',
    description: 'Mastered all vowels (A,E,I,O,U) at 80%+',
    icon: '🔤',
    tier: 'gold',
  },
];

export function loadAchievements(): Record<string, AchievementState> {
  return safeGetJSON<Record<string, AchievementState>>(ACHIEVEMENTS_KEY) ?? {};
}

function saveAchievements(state: Record<string, AchievementState>) {
  safeSetJSON(ACHIEVEMENTS_KEY, state);
}

export interface AchievementContext {
  cardCount?: number;
  currentStreak?: number;
  bestStreak?: number;
  stagesCompleted?: number;
  totalScore?: number;
  accuracyPercent?: number;
  isStageComplete?: boolean;
  lessonPerfect?: boolean;
  stagePerfect?: boolean;
  letterTracker?: Record<string, { correct: number; total: number }>;
  isPractice?: boolean;
}

export function checkAndAward(ctx: AchievementContext): Achievement[] {
  const current = loadAchievements();
  const unlocked: Achievement[] = [];
  const now = Date.now();

  const award = (id: string) => {
    if (!current[id]?.unlocked) {
      current[id] = { unlocked: true, unlockedAt: now };
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (def) unlocked.push(def);
    }
  };

  const sc = ctx.cardCount ?? 0;
  if (sc >= 1) award('first_card');
  if (sc >= 10) award('card_10');
  if (sc >= 25) award('card_25');
  if (sc >= 50) award('card_50');
  if (sc >= 75) award('card_75');
  if (sc >= 95) award('card_95');

  const streak = ctx.currentStreak ?? 0;
  if (streak >= 3) award('streak_3');
  if (streak >= 5) award('streak_5');
  if (streak >= 10) award('streak_10');
  if (streak >= 20) award('streak_20');

  const stages = ctx.stagesCompleted ?? 0;
  if (stages >= 1) award('first_stage');
  if (stages >= 3) award('stage_3');
  if (stages >= 6) award('stage_6');

  if (ctx.lessonPerfect) award('perfect_lesson');
  if (ctx.stagePerfect) award('perfect_stage');

  const score = ctx.totalScore ?? 0;
  if (score >= 100) award('score_100');
  if (score >= 500) award('score_500');
  if (score >= 1000) award('score_1000');

  if (ctx.isPractice) award('first_practice');

  const tracker = ctx.letterTracker;
  if (tracker) {
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    const vowelMastered = vowels.every((v) => {
      const t = tracker[v];
      return t && t.total >= 5 && t.correct / t.total >= 0.8;
    });
    if (vowelMastered) award('vowel_master');
  }

  if (unlocked.length > 0) {
    saveAchievements(current);
  }

  return unlocked;
}
