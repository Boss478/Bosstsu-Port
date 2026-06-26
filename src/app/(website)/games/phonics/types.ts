// ─── Screen & Navigation ────────────────────────────────────────────────────
export type Screen =
  | 'slots'
  | 'path'
  | 'game'
  | 'victory'
  | 'settings'
  | 'tutorial'
  | 'word-builder'
  | 'word-quiz'
  | 'challenges'
  | 'challenge-game';

export type StageCategory = 'vowel' | 'consonant' | 'mastery';

export type MapView = 'groups' | 'stages' | 'activities';

// ─── Game Categories & Formats ──────────────────────────────────────────────
export type GameCategory =
  | 'phonics'
  | 'spelling'
  | 'definitions'
  | 'vocab'
  | 'practice'
  | 'ipa-word'
  | 'word-ipa'
  | 'synonyms'
  | 'exercise'
  | 'vocab-exercise'
  | 'phoneme-match'
  | 'sound-sort'
  | 'rhyme-time'
  | 'speed-spell'
  | 'syllable-smash'
  | 'grapheme'
  | 'minimal-pairs'
  | 'stress'
  | 'antonyms'
  | 'fill-blank'
  | 'word-assoc'
  | 'collocations';
export type PhonicsFormat = 'tap' | 'speed' | 'pick-word' | 'card-flip';
export type SpellingFormat = 'tiles' | 'choice' | 'mixed';
export type DefinitionDirection = 'def-to-word' | 'word-to-def';

// ─── New Activity & Group Types ─────────────────────────────────────────────
export type ActivityType =
  | 'practice'
  | 'ipa-word'
  | 'word-ipa'
  | 'exercise'
  | 'synonyms'
  | 'definitions'
  | 'vocab-exercise'
  | 'grapheme'
  | 'minimal-pairs'
  | 'stress'
  | 'antonyms'
  | 'fill-blank'
  | 'word-assoc'
  | 'collocations';

export interface ActivityData {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  phonemeId: string;
  length: number;
  groupId: string;
  order: number;
  direction?: DefinitionDirection;
}

export interface SimilarSoundGroup {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  phonemeIds: string[];
  order: number;
}

export type Tab = 'sound' | 'vocab' | 'challenges' | 'library' | 'shop' | 'profile';

// ─── New Question Formats ────────────────────────────────────────────────────
export interface PracticeQuestion {
  category: 'practice';
  phoneme: PhonemeData;
  word: WordData;
  correctAnswer: string;
  options: string[];
}

export interface IpaToWordQuestion {
  category: 'ipa-word';
  ipa: string;
  correctAnswer: string;
  options: string[];
  phoneme: PhonemeData;
  word: WordData;
}

export interface WordToIpaQuestion {
  category: 'word-ipa';
  word: WordData;
  correctAnswer: string;
  options: string[];
}

export interface ExerciseQuestion {
  category: 'exercise';
  subType: 'ipa-word' | 'word-ipa' | 'synonyms' | 'grapheme' | 'minimal-pairs' | 'stress';
  data:
    | IpaToWordQuestion
    | WordToIpaQuestion
    | SynonymQuestion
    | GraphemePatternQuestion
    | MinimalPairsQuestion
    | StressQuestion;
}

export interface SynonymQuestion {
  category: 'synonyms';
  word: WordData;
  correctAnswer: string;
  options: string[];
}

export interface AntonymQuestion {
  category: 'antonyms';
  word: WordData;
  correctAnswer: string;
  options: string[];
}

export interface CollocationQuestion {
  category: 'collocations';
  word: WordData;
  correctAnswer: string;
  options: string[];
}

export interface FillBlankQuestion {
  category: 'fill-blank';
  word: WordData;
  correctAnswer: string;
  options: string[];
  blankedSentence: string;
}

export interface WordAssocQuestion {
  category: 'word-assoc';
  word: WordData;
  correctAnswer: string;
  options: string[];
}

export interface GraphemePatternQuestion {
  category: 'grapheme';
  direction: 'phoneme-to-grapheme' | 'grapheme-to-phoneme';
  promptLabel: string;
  correctAnswer: string;
  options: string[];
  phonemeId: string;
  word?: WordData;
}

export interface MinimalPairsQuestion {
  category: 'minimal-pairs';
  direction: 'word-to-ipa' | 'ipa-to-word';
  prompt: string;
  correctAnswer: string;
  options: string[];
  phonemeId: string;
  word: WordData;
}

export interface StressQuestion {
  category: 'stress';
  word: WordData;
  correctAnswer: string;
  options: string[];
  phonemeId: string;
}

// ─── Level & Session Config ──────────────────────────────────────────────────
export type CefrLevel = 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2' | 'all';
export type RoundLength = number;
export type CompanionId =
  | 'nox'
  | 'mira'
  | 'chip'
  | 'fox'
  | 'cat'
  | 'bear'
  | 'bunny'
  | 'penguin'
  | 'alien'
  | 'ninja'
  | 'robot';
export type ThemeMode = 'day' | 'night';

// ─── Word Data ───────────────────────────────────────────────────────────────
export interface WordData {
  word: string;
  wordClass: string;
  level: CefrLevel;
  ipa: string;
  ipaUs?: string;
  ipaUk?: string;
  stress: number[];
  syllables: string[];
  phonemes: string[];
  definition: string;
  example: string;
  wordFamily: string[];
  synonyms: string[];
  collocations: string[];
  antonyms: string[];
  spellingDistractors: string[]; // auto-generated wrong spellings
}

// ─── Phoneme Data ────────────────────────────────────────────────────────────
export interface PhonemeData {
  id: string; // e.g. "ae"
  ipa: string; // e.g. "/æ/"
  ttsText: string; // e.g. "a as in apple" — for speechSynthesis
  soundText: string; // e.g. "aa" — isolated phoneme sound for TTS
  name: string; // e.g. "short a"
  example: string; // e.g. "cat"
  tier: 'basic' | 'vowels' | 'consonants' | 'blends';
}

// ─── Questions ───────────────────────────────────────────────────────────────
export interface PhonicsQuestion {
  category: 'phonics';
  format: PhonicsFormat;
  phoneme: PhonemeData;
  word: WordData;
  correctAnswer: string; // word.word
  options: string[]; // 3-4 word choices
}

export interface SpellingQuestion {
  category: 'spelling';
  format: SpellingFormat;
  word: WordData;
  inputMode: 'tiles' | 'choice';
  choices?: string[]; // for choice mode: correct + distractors
}

export interface DefinitionQuestion {
  category: 'definitions';
  direction: DefinitionDirection;
  word: WordData;
  options: string[]; // 4 definition strings or word strings
  correctAnswer: string;
  blankedExample?: string; // for gap-fill placement questions
}

// ─── Challenge Question Types ─────────────────────────────────────────────
export interface PhonemeMatchQuestion {
  category: 'phoneme-match';
  pairs: { phonemeId: string; ipa: string; word: string }[];
  gridSize: number; // number of pairs
}

export interface SoundSortQuestion {
  category: 'sound-sort';
  targetPhonemeIds: string[];
  words: { word: string; correctGroup: string }[];
}

export interface RhymeQuestion {
  category: 'rhyme-time';
  targetWord: string;
  targetIpa: string;
  options: string[];
  correctAnswer: string;
}

export interface SpeedSpellQuestion {
  category: 'speed-spell';
  word: WordData;
  timeLimitMs: number;
}

export interface SyllableQuestion {
  category: 'syllable-smash';
  word: string;
  syllableCount: number;
  options: number[];
  correctAnswer: number;
}

// ─── Achievement System ────────────────────────────────────────────────────
export type AchievementId =
  | 'first_round'
  | 'sound_explorer'
  | 'vocab_master'
  | 'perfectionist'
  | 'streak_10'
  | 'streak_30'
  | 'phoneme_10'
  | 'phoneme_25'
  | 'phoneme_40'
  | 'phoneme_gold'
  | 'phoneme_allgold'
  | 'first_purchase'
  | 'collector_5'
  | 'millionaire'
  | 'speed_demon'
  | 'word_builder'
  | 'quiz_champ'
  | 'companion_friend'
  | 'match_10'
  | 'sort_50'
  | 'rhyme_20'
  | 'speed_spell_30'
  | 'syllable_50'
  | 'challenge_all'
  | 'challenge_allgold';

export interface BadgeRecord {
  unlocked: boolean;
  unlockedAt: number;
  progress: number;
}

export interface AchievementData {
  id: AchievementId;
  title: string;
  description: string;
  icon: string; // flaticon class
  category: 'progress' | 'phoneme' | 'economy' | 'skill' | 'challenge';
  reward: number; // phoneme coin reward
}

// ─── Challenge Round State ─────────────────────────────────────────────────
export interface ChallengeRoundConfig {
  type: 'phoneme-match' | 'sound-sort' | 'rhyme-time' | 'speed-spell' | 'syllable-smash';
  difficulty: 'easy' | 'medium' | 'hard';
  level: CefrLevel;
  isRetry?: boolean;
}

export type Question =
  | PhonicsQuestion
  | SpellingQuestion
  | DefinitionQuestion
  | PracticeQuestion
  | IpaToWordQuestion
  | WordToIpaQuestion
  | SynonymQuestion
  | AntonymQuestion
  | CollocationQuestion
  | FillBlankQuestion
  | WordAssocQuestion
  | ExerciseQuestion
  | PhonemeMatchQuestion
  | SoundSortQuestion
  | RhymeQuestion
  | SpeedSpellQuestion
  | SyllableQuestion
  | GraphemePatternQuestion
  | MinimalPairsQuestion
  | StressQuestion;

// ─── Round State ─────────────────────────────────────────────────────────────
export interface RoundConfig {
  category: GameCategory;
  phonicsFormat?: PhonicsFormat;
  spellingFormat?: SpellingFormat;
  level: CefrLevel;
  length: RoundLength;
  difficulty?: 'easy' | 'medium' | 'hard';
  definitionDirection?: DefinitionDirection;
  isPlacement?: boolean;
  retryWords?: string[];
  challengeTimeLimitMs?: number; // per-question time limit for speed-spell
}

export interface GameRound {
  config: RoundConfig;
  questions: Question[];
  currentIndex: number;
  score: number;
  corrects: number;
  streak: number;
  maxStreak: number;
  coinsEarned: number;
  // Per-question results for victory screen
  results: QuestionResult[];
}

export interface QuestionResult {
  question: Question;
  playerAnswer: string;
  correct: boolean;
  timeMs: number;
}

// ─── Card Flip ───────────────────────────────────────────────────────────────
export interface CardFlipCard {
  id: number;
  type: 'phoneme' | 'word';
  label: string; // IPA symbol or word text
  ttsText: string; // text to speak on flip
  matchId: string; // phoneme.id — cards with same matchId are a pair
  flipped: boolean;
  matched: boolean;
}

export interface CardFlipState {
  cards: CardFlipCard[];
  selected: number[]; // indices of currently face-up unmatched cards
  matched: number[]; // indices of permanently matched cards
  flips: number;
  pairsRemaining: number;
}

// ─── Save / Persistence ──────────────────────────────────────────────────────
export interface ChallengeStats {
  roundsPlayed: number;
  bestScore: number;
  totalCorrect: number;
  totalAttempts: number;
}

export interface SaveData {
  version: number;
  name: string; // "Slot 1" — user renamable
  timestamp: number;
  companion: CompanionId;
  totalCorrects: number;
  phonemeCoins: number;
  phonemeStats: Record<string, { correct: number; total: number; lastSeen: number }>;
  settings: { muted: boolean; glassLevel: number };
  tutorialCompleted: boolean;
  totalRoundsPlayed: number;
  bestStreak: number;
  currentStreak: number;
  // Adaptive definitions tracking
  definitionStats: {
    defToWord: { correct: number; total: number };
    wordToDef: { correct: number; total: number };
  };
  lessonProgress: Record<
    string,
    { completed: boolean; bestScore: number; lastAccuracy: number; questionsAnswered: number }
  >;
  activityProgress: Record<string, { completed: boolean; bestScore: number; lastAccuracy: number }>;
  unlockedItems?: string[];
  unlockedCompanions: CompanionId[];
  cefrLevel: CefrLevel;
  cefrUpgradeStreak: number;
  // v3 — Phonics Expansion
  achievements: Record<AchievementId, BadgeRecord>;
  challengeStats: Record<string, ChallengeStats>; // keyed by challenge type
  companionInteractions: number;
  lastCompanionHintLevel: number;
  lastCompanionHintTime: number;
}

export interface SlotPreview {
  slot: number;
  empty: boolean;
  name: string;
  companion: CompanionId | null;
  coins: number;
  rounds: number;
  bestStreak: number;
  timestamp: number | null;
}

// ─── Sprite System ───────────────────────────────────────────────────────────
export interface SpriteData {
  width: number;
  height: number;
  pixels: number[][];
  customPalette?: string[];
}

export interface AnimatedSprite {
  frames: SpriteData[];
  fps: number; // frames per second for cycling
}

// ─── Path / Progression ──────────────────────────────────────────────────────
export interface StageLesson {
  id: string;
  title: string;
  phonemeIds: string[];
}

export interface StageData {
  id: string;
  title: string;
  subtitle: string;
  icon: string; // phoneme ID for the symbol shown in the circle
  color: string;
  category: StageCategory;
  lessons: StageLesson[];
}

export interface LessonNode {
  id: string;
  unit: number;
  title: string;
  phonemeIds: string[];
  tier: string;
}

// ─── Companion ───────────────────────────────────────────────────────────────
export interface AnimParams {
  breatheHeight: number;
  breatheSpeed: number;
  blinkInterval: number;
  blinkDuration: number;
}

// ─── Utility helpers ──────────────────────────────────────────────────────────
export function getWordFromQuestion(q: Question): WordData | undefined {
  if (q.category === 'exercise')
    return getWordFromQuestion((q as unknown as ExerciseQuestion).data as unknown as Question);
  if (q.category === 'speed-spell') return (q as SpeedSpellQuestion).word;
  if ('word' in q) return (q as unknown as { word: WordData }).word;
  return undefined;
}

export function getCorrectAnswerFromQuestion(q: Question): string {
  if (q.category === 'exercise') {
    const ex = q as ExerciseQuestion;
    if ('correctAnswer' in ex.data)
      return (
        ex.data as
          | IpaToWordQuestion
          | WordToIpaQuestion
          | SynonymQuestion
          | GraphemePatternQuestion
          | MinimalPairsQuestion
          | StressQuestion
      ).correctAnswer;
    return '';
  }
  if (
    q.category === 'phonics' ||
    q.category === 'definitions' ||
    q.category === 'practice' ||
    q.category === 'ipa-word' ||
    q.category === 'word-ipa' ||
    q.category === 'synonyms' ||
    q.category === 'antonyms' ||
    q.category === 'collocations' ||
    q.category === 'fill-blank' ||
    q.category === 'word-assoc' ||
    q.category === 'grapheme' ||
    q.category === 'minimal-pairs' ||
    q.category === 'stress'
  ) {
    return (
      q as
        | IpaToWordQuestion
        | WordToIpaQuestion
        | SynonymQuestion
        | AntonymQuestion
        | CollocationQuestion
        | FillBlankQuestion
        | WordAssocQuestion
        | PracticeQuestion
        | PhonicsQuestion
        | DefinitionQuestion
        | GraphemePatternQuestion
        | MinimalPairsQuestion
        | StressQuestion
    ).correctAnswer;
  }
  if (q.category === 'rhyme-time') return (q as RhymeQuestion).correctAnswer;
  if (q.category === 'syllable-smash') return String((q as SyllableQuestion).correctAnswer);
  if (q.category === 'speed-spell') return (q as SpeedSpellQuestion).word.word;
  return '';
}

export interface DictEntry {
  word: string;
  phonemeIds: string[];
  dialect: string;
  ipa: string;
}

export interface CompanionData {
  id: CompanionId;
  name: string;
  type: string;
  color: string;
  personality: string;
  hints: Partial<Record<GameCategory, Record<number, string>>>;
  cost: number;
  animParams: AnimParams;
}

// ─── Companion Bubble Styles ─────────────────────────────────────────────────
export type EntranceAnimation =
  | 'glide-down'
  | 'scale-bounce'
  | 'scanline'
  | 'slide-left'
  | 'pounce'
  | 'fade-in'
  | 'bounce-in'
  | 'slide-up'
  | 'warp-in'
  | 'spin-in';

export type IdleAnimation =
  | 'gentle-turn'
  | 'bouncy-hover'
  | 'robotic-twitch'
  | 'tail-swish'
  | 'paw-stretch'
  | 'slow-rock'
  | 'ear-wiggle'
  | 'wobble'
  | 'float-wobble'
  | 'still';

export type TextRevealType =
  | 'word-by-word'
  | 'fast-character'
  | 'robotic-character'
  | 'slow-character'
  | 'character-by-character'
  | 'glitch-reveal'
  | 'instant';

export interface CompanionBubbleStyle {
  accentColor: string;
  accentColorDark: string;
  typographyClass: string;
  entranceAnimation: EntranceAnimation;
  idleAnimation: IdleAnimation;
  textReveal: TextRevealType;
  spriteAccessory?: string;
}

export interface CharacterVoice {
  prefix: string;
  suffix: string;
  format: 'plain' | 'spaced' | 'haiku';
}
