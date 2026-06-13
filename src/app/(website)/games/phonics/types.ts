// ─── Screen & Navigation ────────────────────────────────────────────────────
export type Screen = "slots" | "map" | "game" | "victory" | "settings" | "tutorial";

// ─── Game Categories & Formats ──────────────────────────────────────────────
export type GameCategory = "phonics" | "spelling" | "definitions";
export type PhonicsFormat = "tap" | "speed" | "pick-word" | "card-flip";
export type SpellingFormat = "tiles" | "choice" | "mixed";
export type DefinitionDirection = "def-to-word" | "word-to-def";

// ─── Level & Session Config ──────────────────────────────────────────────────
export type CefrLevel = "a1" | "a2" | "b1" | "b2" | "c1" | "all";
export type RoundLength = 5 | 10 | 15;
export type CompanionId = "nox" | "mira" | "chip";
export type ThemeMode = "day" | "night";

// ─── Word Data ───────────────────────────────────────────────────────────────
export interface WordData {
  word: string;
  wordClass: string;
  level: CefrLevel;
  ipa: string;
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
}

export type Question = PhonicsQuestion | SpellingQuestion | DefinitionQuestion;

// ─── Round State ─────────────────────────────────────────────────────────────
export interface RoundConfig {
  category: GameCategory;
  phonicsFormat?: PhonicsFormat;
  spellingFormat?: SpellingFormat;
  level: CefrLevel;
  length: RoundLength;
  definitionDirection?: DefinitionDirection;
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
  settings: { muted: boolean; crtEffect: boolean };
  tutorialCompleted: boolean;
  totalRoundsPlayed: number;
  bestStreak: number;
  currentStreak: number;
  // Adaptive definitions tracking
  definitionStats: { defToWord: { correct: number; total: number }; wordToDef: { correct: number; total: number } };
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
}

export interface AnimatedSprite {
  frames: SpriteData[];
  fps: number;            // frames per second for cycling
}

export interface MapBuilding {
  id: string;
  x: number;              // tile column
  y: number;              // tile row
  interactive: boolean;
  label: string;
  category?: GameCategory;
}

// ─── Companion ───────────────────────────────────────────────────────────────
export interface CompanionData {
  id: CompanionId;
  name: string;
  type: string;
  color: string;
  personality: string;
  hints: Record<GameCategory, Record<number, string>>;
}
