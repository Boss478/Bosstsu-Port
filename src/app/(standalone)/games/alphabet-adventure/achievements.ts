'use client';

import { safeGetJSON, safeSetJSON } from '@/lib/storage';
import type { CardTier } from './cards/cards';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'secret';
}

export interface AchievementState {
  unlocked: boolean;
  unlockedAt?: number;
}

export interface PlayStats {
  days: string[];
  logoTaps: number;
  perfectCount: number;
}

const ACHIEVEMENTS_KEY = 'alphabet-adventure-achievements';
const PLAY_STATS_KEY = 'alphabet-adventure-play-stats';

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
    tier: 'gold',
  },
  {
    id: 'card_65',
    name: 'Card Wizard',
    description: 'Collected 65 cards',
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
    tier: 'silver',
  },
  {
    id: 'streak_10',
    name: 'Unstoppable',
    description: 'Reached a 10-answer streak',
    icon: '🔥',
    tier: 'gold',
  },
  {
    id: 'streak_20',
    name: 'Legendary Streak',
    description: 'Reached a 20-answer streak',
    icon: '🔥',
    tier: 'platinum',
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
    tier: 'platinum',
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
    id: 'score_2000',
    name: 'Score Supreme',
    description: 'Reached 2,000 total score',
    icon: '💯',
    tier: 'platinum',
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
  {
    id: 'letter_full',
    name: 'Letter Fanatic',
    description: 'Owned every tier of one letter',
    icon: '✨',
    tier: 'gold',
  },
  {
    id: 'tier_common',
    name: 'Common Ground',
    description: 'Collected all 21 common cards',
    icon: '🃏',
    tier: 'bronze',
  },
  {
    id: 'tier_uncommon',
    name: 'Uncommon Heroes',
    description: 'Collected all 21 uncommon cards',
    icon: '🎴',
    tier: 'bronze',
  },
  {
    id: 'tier_rare',
    name: 'Rare Bird',
    description: 'Collected all 19 rare cards',
    icon: '🦅',
    tier: 'gold',
  },
  {
    id: 'tier_ultra',
    name: 'Ultra Vision',
    description: 'Collected all 17 ultra-rare cards',
    icon: '🌌',
    tier: 'silver',
  },
  {
    id: 'tier_legendary',
    name: 'Legend',
    description: 'Collected all 17 legendary cards',
    icon: '💎',
    tier: 'platinum',
  },
  {
    id: 'first_rare',
    name: 'Shiny!',
    description: 'Collected your first rare card',
    icon: '✨',
    tier: 'bronze',
  },
  {
    id: 'first_ultra',
    name: 'Ultra!',
    description: 'Collected your first ultra-rare card',
    icon: '💫',
    tier: 'silver',
  },
  {
    id: 'first_legendary',
    name: 'Mythic',
    description: 'Collected your first legendary card',
    icon: '🌟',
    tier: 'gold',
  },
  {
    id: 'rare_10',
    name: 'Rare Collector',
    description: 'Collected 10 distinct rare+ cards',
    icon: '🎴',
    tier: 'silver',
  },
  {
    id: 'legendary_3',
    name: 'Triple Legend',
    description: 'Collected 3 distinct legendary cards',
    icon: '👑',
    tier: 'gold',
  },
  {
    id: 'power_10',
    name: 'Overdrive',
    description: 'Maxed out your drop power',
    icon: '⚡',
    tier: 'bronze',
  },
  {
    id: 'double_drop',
    name: 'Double Take',
    description: 'Got 2 cards in one sub-stage',
    icon: '🎁',
    tier: 'bronze',
  },
  {
    id: 'accuracy_90',
    name: 'Sharpshooter',
    description: 'Got 90% or more accuracy in a lesson',
    icon: '🎯',
    tier: 'silver',
  },
  {
    id: 'alphabet_scholar',
    name: 'Alphabet Scholar',
    description: 'Mastered all 26 letters at 80%+',
    icon: '📚',
    tier: 'platinum',
  },
  {
    id: 'perfect_3x',
    name: 'Perfect Trilogy',
    description: 'Got 3 perfect lessons',
    icon: '💯',
    tier: 'gold',
  },
  {
    id: 'speed_lesson',
    name: 'Speed Demon',
    description: 'Finished a lesson in under 30 seconds',
    icon: '⚡',
    tier: 'silver',
  },
  {
    id: 'quick_five',
    name: 'Quick Draw',
    description: 'Answered 5 in a row on the first try in under 3 seconds each',
    icon: '⚡',
    tier: 'gold',
  },
  {
    id: 'stage_sweep',
    name: 'Stage Sweeper',
    description: 'Completed all 5 sub-stages of a stage in one sitting',
    icon: '🗺️',
    tier: 'bronze',
  },
  {
    id: 'star_30',
    name: 'Star Collector',
    description: 'Collected 30 stars',
    icon: '⭐',
    tier: 'silver',
  },
  {
    id: 'star_60',
    name: 'Star Hunter',
    description: 'Collected 60 stars',
    icon: '⭐',
    tier: 'gold',
  },
  {
    id: 'map_perfect',
    name: 'Star Map',
    description: 'Collected 90 stars - 3 stars everywhere',
    icon: '🌍',
    tier: 'platinum',
  },
  {
    id: 'revisit',
    name: 'Familiar Ground',
    description: 'Replayed a completed sub-stage',
    icon: '🔁',
    tier: 'bronze',
  },
  {
    id: 'streak_30',
    name: 'Inferno',
    description: 'Reached a 30-answer streak',
    icon: '🔥',
    tier: 'platinum',
  },
  {
    id: 'streak_50',
    name: 'Supernova',
    description: 'Reached a 50-answer streak',
    icon: '☄️',
    tier: 'platinum',
  },
  {
    id: 'comeback',
    name: 'Comeback Kid',
    description: 'Rebuilt a 10-answer streak after a wrong',
    icon: '💪',
    tier: 'silver',
  },
  {
    id: 'no_trainer',
    name: 'No Training Wheels',
    description: 'Finished a sub-stage with easy mode off',
    icon: '🚲',
    tier: 'bronze',
  },
  {
    id: 'days_3',
    name: 'Three-Day Streak',
    description: 'Played on 3 different days',
    icon: '📅',
    tier: 'bronze',
  },
  {
    id: 'days_7',
    name: 'Week Warrior',
    description: 'Played on 7 different days',
    icon: '📅',
    tier: 'bronze',
  },
  {
    id: 'secret_logo',
    name: 'Sneaky',
    description: 'A secret...',
    icon: '🥚',
    tier: 'secret',
  },
  {
    id: 'lucky_13',
    name: 'Lucky Streak',
    description: 'Reached a 13-answer streak',
    icon: '🍀',
    tier: 'secret',
  },
  {
    id: 'hot_hand',
    name: 'Hot Hand',
    description: 'Got card drops on 2 answers in a row',
    icon: '🔥',
    tier: 'secret',
  },
  {
    id: 'perfect_man',
    name: 'Perfect Man',
    description: 'Got 100% on an All Letters sub-stage',
    icon: '🏅',
    tier: 'secret',
  },
  {
    id: 'tough_cookie',
    name: 'Tough Cookie',
    description: 'Got 9 wrong answers in a row and still finished',
    icon: '🍪',
    tier: 'secret',
  },
  {
    id: 'patient_one',
    name: 'Patient One',
    description: 'Answered 10 in a row with no card drop',
    icon: '🐢',
    tier: 'secret',
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Got a card on the first answer of a sub-stage',
    icon: '🐦',
    tier: 'secret',
  },
  {
    id: 'jackpot',
    name: 'Jackpot',
    description: 'Won a legendary card from a stage clear',
    icon: '🎰',
    tier: 'secret',
  },
  {
    id: 'card_party',
    name: 'Card Party',
    description: 'Got 3 cards in one sub-stage',
    icon: '🎉',
    tier: 'secret',
  },
  {
    id: 'first_try',
    name: 'First Try',
    description: 'Got 3 stars the first time you played a sub-stage',
    icon: '⭐',
    tier: 'secret',
  },
];

export function loadAchievements(): Record<string, AchievementState> {
  return safeGetJSON<Record<string, AchievementState>>(ACHIEVEMENTS_KEY) ?? {};
}

function saveAchievements(state: Record<string, AchievementState>) {
  safeSetJSON(ACHIEVEMENTS_KEY, state);
}

export function getPlayStats(): PlayStats {
  return safeGetJSON<PlayStats>(PLAY_STATS_KEY) ?? { days: [], logoTaps: 0, perfectCount: 0 };
}

function savePlayStats(stats: PlayStats) {
  safeSetJSON(PLAY_STATS_KEY, stats);
}

export function touchPlayDate() {
  const stats = getPlayStats();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  if (!stats.days.includes(today)) {
    stats.days.push(today);
    savePlayStats(stats);
  }
}

export function recordLogoTap() {
  const stats = getPlayStats();
  stats.logoTaps += 1;
  savePlayStats(stats);
}

export function recordPerfect() {
  const stats = getPlayStats();
  stats.perfectCount += 1;
  savePlayStats(stats);
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
  tierCounts?: Record<CardTier, number>;
  letterFull?: boolean;
  subStagesCompleted?: number;
  starCount?: number;
  perfectRun?: boolean;
  perfectCount?: number;
  singleSessionSweep?: boolean;
  easyModeOff?: boolean;
  lessonSeconds?: number;
  quickFastStreak?: number;
  rebuiltStreak?: boolean;
  revisit?: boolean;
  cardsInSubStage?: number;
  dropPower?: number;
  logoTaps?: number;
  consecutiveDrops?: number;
  maxConsecutiveWrongs?: number;
  perfectMan?: boolean;
  noDropStreak?: number;
  earlyBird?: boolean;
  jackpot?: boolean;
  firstTry?: boolean;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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
  if (sc >= 65) award('card_65');
  if (sc >= 95) award('card_95');

  const streak = ctx.currentStreak ?? 0;
  if (streak >= 3) award('streak_3');
  if (streak >= 5) award('streak_5');
  if (streak >= 10) award('streak_10');
  if (streak >= 13) award('lucky_13');
  if (streak >= 20) award('streak_20');
  if (streak >= 30) award('streak_30');
  if (streak >= 50) award('streak_50');

  const stages = ctx.stagesCompleted ?? 0;
  if (stages >= 1) award('first_stage');
  if (stages >= 3) award('stage_3');
  if (stages >= 6) award('stage_6');

  if (ctx.lessonPerfect || ctx.perfectRun) award('perfect_lesson');
  if (ctx.stagePerfect) award('perfect_stage');

  const score = ctx.totalScore ?? 0;
  if (score >= 100) award('score_100');
  if (score >= 500) award('score_500');
  if (score >= 1000) award('score_1000');
  if (score >= 2000) award('score_2000');

  if (ctx.isPractice) award('first_practice');

  const tracker = ctx.letterTracker;
  if (tracker) {
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    const vowelMastered = vowels.every((v) => {
      const t = tracker[v];
      return t && t.total >= 5 && t.correct / t.total >= 0.8;
    });
    if (vowelMastered) award('vowel_master');

    const scholar = ALPHABET.every((l) => {
      const t = tracker[l];
      return t && t.total >= 5 && t.correct / t.total >= 0.8;
    });
    if (scholar) award('alphabet_scholar');
  }

  const tiers = ctx.tierCounts;
  if (tiers) {
    if (tiers.common >= 21) award('tier_common');
    if (tiers.uncommon >= 21) award('tier_uncommon');
    if (tiers.rare >= 19) award('tier_rare');
    if (tiers['ultra-rare'] >= 17) award('tier_ultra');
    if (tiers.legendary >= 17) award('tier_legendary');
    if (tiers.rare >= 1) award('first_rare');
    if (tiers['ultra-rare'] >= 1) award('first_ultra');
    if (tiers.legendary >= 1) award('first_legendary');
    const rarePlus = tiers.rare + tiers['ultra-rare'] + tiers.legendary;
    if (rarePlus >= 10) award('rare_10');
    if (tiers.legendary >= 3) award('legendary_3');
  }
  if (ctx.letterFull) award('letter_full');

  if ((ctx.dropPower ?? 0) >= 10) award('power_10');

  const cardsInRun = ctx.cardsInSubStage ?? 0;
  if (cardsInRun >= 2) award('double_drop');
  if (cardsInRun >= 3) award('card_party');

  if ((ctx.accuracyPercent ?? 0) >= 90) award('accuracy_90');

  if ((ctx.perfectCount ?? 0) >= 3) award('perfect_3x');

  if (ctx.singleSessionSweep) award('stage_sweep');

  const stars = ctx.starCount ?? 0;
  if (stars >= 30) award('star_30');
  if (stars >= 60) award('star_60');
  if (stars >= 90) award('map_perfect');

  if (ctx.revisit) award('revisit');

  if (ctx.rebuiltStreak) award('comeback');

  if (ctx.easyModeOff) award('no_trainer');

  if (ctx.lessonSeconds !== undefined && ctx.lessonSeconds < 30) award('speed_lesson');
  if ((ctx.quickFastStreak ?? 0) >= 5) award('quick_five');

  const stats = getPlayStats();
  if (stats.days.length >= 3) award('days_3');
  if (stats.days.length >= 7) award('days_7');
  if ((ctx.logoTaps ?? stats.logoTaps) >= 10) award('secret_logo');

  if ((ctx.consecutiveDrops ?? 0) >= 2) award('hot_hand');
  if ((ctx.noDropStreak ?? 0) >= 10) award('patient_one');
  if (ctx.earlyBird) award('early_bird');
  if (ctx.perfectMan) award('perfect_man');
  if ((ctx.maxConsecutiveWrongs ?? 0) >= 9) award('tough_cookie');
  if (ctx.jackpot) award('jackpot');
  if (ctx.firstTry) award('first_try');

  if (unlocked.length > 0) {
    saveAchievements(current);
  }

  return unlocked;
}
