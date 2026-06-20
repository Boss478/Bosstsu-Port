// ─── Screen & Navigation ────────────────────────────────────────────────────
export type Screen = "slots" | "path" | "game" | "victory" | "settings" | "tutorial" | "word-builder" | "word-quiz";

export type StageCategory = "vowel" | "consonant" | "mastery";

export type MapView = "groups" | "stages" | "activities";

// ─── Game Categories & Formats ──────────────────────────────────────────────
export type GameCategory = "phonics" | "spelling" | "definitions" | "vocab" | "practice" | "ipa-word" | "word-ipa" | "synonyms" | "exercise" | "vocab-exercise";
export type PhonicsFormat = "tap" | "speed" | "pick-word" | "card-flip";
export type SpellingFormat = "tiles" | "choice" | "mixed";
export type DefinitionDirection = "def-to-word" | "word-to-def";

// ─── New Activity & Group Types ─────────────────────────────────────────────
export type ActivityType = "practice" | "ipa-word" | "word-ipa" | "exercise" | "synonyms" | "definitions" | "vocab-exercise";

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

export type Tab = "sound" | "vocab" | "library" | "shop" | "profile";

// ─── New Question Formats ────────────────────────────────────────────────────
export interface PracticeQuestion {
  category: "practice";
  phoneme: PhonemeData;
  word: WordData;
  correctAnswer: string;
  options: string[];
}

export interface IpaToWordQuestion {
  category: "ipa-word";
  ipa: string;
  correctAnswer: string;
  options: string[];
  phoneme: PhonemeData;
  word: WordData;
}

export interface WordToIpaQuestion {
  category: "word-ipa";
  word: WordData;
  correctAnswer: string;
  options: string[];
}

export interface ExerciseQuestion {
  category: "exercise";
  subType: "ipa-word" | "word-ipa" | "practice" | "synonyms";
  data: IpaToWordQuestion | WordToIpaQuestion | PracticeQuestion | SynonymQuestion;
}

export interface SynonymQuestion {
  category: "synonyms";
  word: WordData;
  correctAnswer: string;
  options: string[];
}

// ─── Level & Session Config ──────────────────────────────────────────────────
export type CefrLevel = "a1" | "a2" | "b1" | "b2" | "c1" | "c2" | "all";
export type RoundLength = number;
export type CompanionId = "nox" | "mira" | "chip" | "fox" | "cat" | "bear" | "bunny" | "penguin" | "alien" | "ninja" | "robot";
export type ThemeMode = "day" | "night";

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
  spellingDistractors: string[]; // auto-generated wrong spellings
}

// ─── Phoneme Data ────────────────────────────────────────────────────────────
export interface PhonemeData {
  id: string;         // e.g. "ae"
  ipa: string;        // e.g. "/æ/"
  ttsText: string;    // e.g. "a as in apple" — for speechSynthesis
  soundText: string;   // e.g. "aa" — isolated phoneme sound for TTS
  name: string;       // e.g. "short a"
  example: string;    // e.g. "cat"
  tier: "basic" | "vowels" | "consonants" | "blends";
}

// ─── Questions ───────────────────────────────────────────────────────────────
export interface PhonicsQuestion {
  category: "phonics";
  format: PhonicsFormat;
  phoneme: PhonemeData;
  word: WordData;
  correctAnswer: string;    // word.word
  options: string[];        // 3-4 word choices
}

export interface SpellingQuestion {
  category: "spelling";
  format: SpellingFormat;
  word: WordData;
  inputMode: "tiles" | "choice";
  choices?: string[];       // for choice mode: correct + distractors
}

export interface DefinitionQuestion {
  category: "definitions";
  direction: DefinitionDirection;
  word: WordData;
  options: string[];        // 4 definition strings or word strings
  correctAnswer: string;
  blankedExample?: string;  // for gap-fill placement questions
}

export type Question = PhonicsQuestion | SpellingQuestion | DefinitionQuestion | PracticeQuestion | IpaToWordQuestion | WordToIpaQuestion | SynonymQuestion | ExerciseQuestion;

// ─── Round State ─────────────────────────────────────────────────────────────
export interface RoundConfig {
  category: GameCategory;
  phonicsFormat?: PhonicsFormat;
  spellingFormat?: SpellingFormat;
  level: CefrLevel;
  length: RoundLength;
  definitionDirection?: DefinitionDirection;
  isPlacement?: boolean;
  retryWords?: string[];
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
  type: "phoneme" | "word";
  label: string;          // IPA symbol or word text
  ttsText: string;        // text to speak on flip
  matchId: string;        // phoneme.id — cards with same matchId are a pair
  flipped: boolean;
  matched: boolean;
}

export interface CardFlipState {
  cards: CardFlipCard[];
  selected: number[];     // indices of currently face-up unmatched cards
  matched: number[];      // indices of permanently matched cards
  flips: number;
  pairsRemaining: number;
}

// ─── Save / Persistence ──────────────────────────────────────────────────────
export interface SaveData {
  version: number;
  name: string;           // "Slot 1" — user renamable
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
  definitionStats: { defToWord: { correct: number; total: number }; wordToDef: { correct: number; total: number } };
  lessonProgress: Record<string, { completed: boolean; bestScore: number; lastAccuracy: number; questionsAnswered: number }>;
  activityProgress: Record<string, { completed: boolean; bestScore: number; lastAccuracy: number }>;
  unlockedItems?: string[];
  unlockedCompanions: CompanionId[];
  cefrLevel: CefrLevel;
  cefrUpgradeStreak: number;
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
  fps: number;            // frames per second for cycling
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
  icon: string;           // phoneme ID for the symbol shown in the circle
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
  if (q.category === 'exercise') return getWordFromQuestion((q as unknown as ExerciseQuestion).data as unknown as Question);
  if ('word' in q) return (q as unknown as { word: WordData }).word;
  return undefined;
}

export function getCorrectAnswerFromQuestion(q: Question): string {
  if (q.category === 'exercise') {
    const ex = q as ExerciseQuestion;
    if ('correctAnswer' in ex.data) return (ex.data as IpaToWordQuestion | WordToIpaQuestion | SynonymQuestion).correctAnswer;
    return '';
  }
  if (q.category === 'phonics' || q.category === 'definitions' || q.category === 'practice' || q.category === 'ipa-word' || q.category === 'word-ipa' || q.category === 'synonyms') {
    return (q as IpaToWordQuestion | WordToIpaQuestion | SynonymQuestion | PracticeQuestion | PhonicsQuestion | DefinitionQuestion).correctAnswer;
  }
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
