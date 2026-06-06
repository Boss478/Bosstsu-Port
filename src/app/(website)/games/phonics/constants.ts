import type { PhonemeData, CompanionData, RoundLength, CefrLevel } from "./types";

// ─── Version ─────────────────────────────────────────────────────────────────
export const SAVE_VERSION = 1;

// ─── Game Config ─────────────────────────────────────────────────────────────
export const GAME_CONFIG = {
  SCORE_CORRECT: 10,
  SCORE_WRONG: 0,
  STREAK_BONUS_THRESHOLD: 3,
  COINS_CORRECT: 1,
  COINS_STREAK: 2,
  FEEDBACK_DURATION_MS: 800,
  HINT_PENALTY: 0,
  MIN_OPTIONS: 3,
  MAX_OPTIONS: 4,
  DEFAULT_ROUND_LENGTH: { phonics: 10, spelling: 5, definitions: 5 } as Record<string, number>,
  SPEED_TIMER_MS: 3000,
  CARD_FLIP_PAIRS: 4,
  DEFINITION_MIX_ADAPTIVE: true,
  MASCOT_TILE_MS: 300,        // ms per tile for walk animation
  SAVE_INDICATOR_MS: 3000,    // how long to show the save indicator
} as const;

// ─── CEFR Levels ─────────────────────────────────────────────────────────────
export const CEFR_LEVELS: CefrLevel[] = ["a1", "a2", "b1", "b2", "c1", "all"];
export const CEFR_LABELS: Record<CefrLevel, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", all: "ALL",
};

// ─── Round Lengths ────────────────────────────────────────────────────────────
export const ROUND_LENGTHS: RoundLength[] = [5, 10, 15];

// ─── Phoneme Inventory (44 phonemes, 4 tiers) ────────────────────────────────
// ttsText is the string passed to speechSynthesis — avoids IPA rendering issues
export const PHONEMES: PhonemeData[] = [
  // Basic Consonants
  { id: "p",  ipa: "/p/",  ttsText: "p as in pin",    name: "voiceless bilabial stop",  example: "pin",   tier: "basic" },
  { id: "b",  ipa: "/b/",  ttsText: "b as in big",    name: "voiced bilabial stop",     example: "big",   tier: "basic" },
  { id: "t",  ipa: "/t/",  ttsText: "t as in top",    name: "voiceless alveolar stop",  example: "top",   tier: "basic" },
  { id: "d",  ipa: "/d/",  ttsText: "d as in dog",    name: "voiced alveolar stop",     example: "dog",   tier: "basic" },
  { id: "k",  ipa: "/k/",  ttsText: "k as in cat",    name: "voiceless velar stop",     example: "cat",   tier: "basic" },
  { id: "g",  ipa: "/ɡ/",  ttsText: "g as in go",     name: "voiced velar stop",        example: "go",    tier: "basic" },
  { id: "m",  ipa: "/m/",  ttsText: "m as in man",    name: "bilabial nasal",           example: "man",   tier: "basic" },
  { id: "n",  ipa: "/n/",  ttsText: "n as in net",    name: "alveolar nasal",           example: "net",   tier: "basic" },
  { id: "l",  ipa: "/l/",  ttsText: "l as in leg",    name: "alveolar lateral",         example: "leg",   tier: "basic" },
  { id: "r",  ipa: "/r/",  ttsText: "r as in run",    name: "alveolar approximant",     example: "run",   tier: "basic" },
  { id: "w",  ipa: "/w/",  ttsText: "w as in wet",    name: "labial-velar approximant", example: "wet",   tier: "basic" },
  { id: "j",  ipa: "/j/",  ttsText: "y as in yes",    name: "palatal approximant",      example: "yes",   tier: "basic" },
  // Consonants
  { id: "f",  ipa: "/f/",  ttsText: "f as in fan",    name: "voiceless labiodental fricative", example: "fan",  tier: "consonants" },
  { id: "v",  ipa: "/v/",  ttsText: "v as in van",    name: "voiced labiodental fricative",   example: "van",  tier: "consonants" },
  { id: "s",  ipa: "/s/",  ttsText: "s as in sun",    name: "voiceless alveolar fricative",   example: "sun",  tier: "consonants" },
  { id: "z",  ipa: "/z/",  ttsText: "z as in zoo",    name: "voiced alveolar fricative",      example: "zoo",  tier: "consonants" },
  { id: "sh", ipa: "/ʃ/",  ttsText: "sh as in ship",  name: "voiceless postalveolar fricative", example: "ship", tier: "consonants" },
  { id: "zh", ipa: "/ʒ/",  ttsText: "zh as in measure", name: "voiced postalveolar fricative", example: "measure", tier: "consonants" },
  { id: "h",  ipa: "/h/",  ttsText: "h as in hat",    name: "voiceless glottal fricative",    example: "hat",  tier: "consonants" },
  { id: "ch", ipa: "/tʃ/", ttsText: "ch as in chin",  name: "voiceless postalveolar affricate", example: "chin", tier: "consonants" },
  { id: "dz", ipa: "/dʒ/", ttsText: "j as in jump",   name: "voiced postalveolar affricate",   example: "jump", tier: "consonants" },
  { id: "ng", ipa: "/ŋ/",  ttsText: "ng as in sing",  name: "velar nasal",              example: "sing",  tier: "consonants" },
  { id: "th", ipa: "/θ/",  ttsText: "th as in thin",  name: "voiceless dental fricative", example: "thin", tier: "consonants" },
  { id: "dh", ipa: "/ð/",  ttsText: "th as in this",  name: "voiced dental fricative",   example: "this",  tier: "consonants" },
  // Vowels
  { id: "ae", ipa: "/æ/",  ttsText: "a as in cat",    name: "short a",      example: "cat",   tier: "vowels" },
  { id: "e",  ipa: "/e/",  ttsText: "e as in bed",    name: "short e",      example: "bed",   tier: "vowels" },
  { id: "i",  ipa: "/ɪ/",  ttsText: "i as in sit",    name: "short i",      example: "sit",   tier: "vowels" },
  { id: "o",  ipa: "/ɒ/",  ttsText: "o as in hot",    name: "short o",      example: "hot",   tier: "vowels" },
  { id: "u",  ipa: "/ʌ/",  ttsText: "u as in cup",    name: "short u",      example: "cup",   tier: "vowels" },
  { id: "ee", ipa: "/iː/", ttsText: "ee as in see",   name: "long ee",      example: "see",   tier: "vowels" },
  { id: "ar", ipa: "/ɑː/", ttsText: "ar as in car",   name: "long ar",      example: "car",   tier: "vowels" },
  { id: "aw", ipa: "/ɔː/", ttsText: "aw as in law",   name: "long aw",      example: "law",   tier: "vowels" },
  { id: "oo", ipa: "/uː/", ttsText: "oo as in moon",  name: "long oo",      example: "moon",  tier: "vowels" },
  { id: "er", ipa: "/ɜː/", ttsText: "er as in bird",  name: "long er",      example: "bird",  tier: "vowels" },
  { id: "ay", ipa: "/eɪ/", ttsText: "ay as in day",   name: "long a (diphthong)", example: "day", tier: "vowels" },
  { id: "ie", ipa: "/aɪ/", ttsText: "ie as in fly",   name: "long i (diphthong)", example: "fly", tier: "vowels" },
  { id: "oy", ipa: "/ɔɪ/", ttsText: "oy as in boy",   name: "oy diphthong", example: "boy",   tier: "vowels" },
  { id: "ow", ipa: "/aʊ/", ttsText: "ow as in now",   name: "ow diphthong", example: "now",   tier: "vowels" },
  { id: "oh", ipa: "/əʊ/", ttsText: "oh as in go",    name: "oh diphthong", example: "go",    tier: "vowels" },
  // Blends
  { id: "uh", ipa: "/ə/",  ttsText: "uh as in about", name: "schwa",        example: "about", tier: "blends" },
  { id: "eer",ipa: "/ɪə/", ttsText: "ear as in near", name: "ear diphthong", example: "near",  tier: "blends" },
  { id: "air",ipa: "/eə/", ttsText: "air as in care", name: "air diphthong", example: "care",  tier: "blends" },
  { id: "oor",ipa: "/ʊə/", ttsText: "oor as in tour", name: "oor diphthong", example: "tour",  tier: "blends" },
  { id: "uh2",ipa: "/ʊ/",  ttsText: "u as in book",   name: "short oo",     example: "book",  tier: "blends" },
];

export const PHONEME_MAP: Record<string, PhonemeData> = Object.fromEntries(
  PHONEMES.map((p) => [p.id, p])
);

// ─── Companions ───────────────────────────────────────────────────────────────
export const COMPANIONS: Record<string, CompanionData> = {
  nox: {
    id: "nox",
    name: "Nox",
    type: "owl",
    color: "#C8A44E",
    personality: "wise and cryptic",
    hints: {
      phonics: {
        1: "Listen carefully to the sound...",
        2: "Feel where your mouth moves when you say it.",
        3: "Repeat after me — the sound is at the start of the word.",
      },
      spelling: {
        1: "Think about the letters one by one.",
        2: "How many sounds does the word have?",
        3: "The first letter is a clue — focus there.",
      },
      definitions: {
        1: "What context does this word fit in?",
        2: "Think of related words you already know.",
        3: "The first letter of the answer is a good starting point.",
      },
    },
  },
  mira: {
    id: "mira",
    name: "Mira",
    type: "witch",
    color: "#9B59B6",
    personality: "energetic and encouraging",
    hints: {
      phonics: {
        1: "You can do it! Listen to the sound one more time!",
        2: "Think — which word has that sound at the beginning?",
        3: "It rhymes with a word you already know!",
      },
      spelling: {
        1: "Sound it out — one letter at a time!",
        2: "You spelled something close — check the vowel!",
        3: "Almost there! Look at the ending carefully.",
      },
      definitions: {
        1: "Wow, tricky one! Think about what category it belongs to.",
        2: "You've seen this word before — trust yourself!",
        3: "Eliminate the ones that feel totally wrong first.",
      },
    },
  },
  chip: {
    id: "chip",
    name: "Chip",
    type: "robot",
    color: "#5DADE2",
    personality: "literal and technical",
    hints: {
      phonics: {
        1: "Scanning phoneme database... sound detected.",
        2: `Syllable count: ${1}. Primary stress: initial position.`,
        3: "Processing: the target phoneme appears in position 1 of the word.",
      },
      spelling: {
        1: "Letter count analysis: word has N characters.",
        2: "Phoneme-to-grapheme mapping suggests a silent letter is present.",
        3: "First character identified. Begin from there.",
      },
      definitions: {
        1: "Cross-referencing semantic field: this word belongs to a specific domain.",
        2: "Synonym detected in adjacent option — use process of elimination.",
        3: "Word frequency: high — you have encountered this word before.",
      },
    },
  },
};

// ─── Map Layout ───────────────────────────────────────────────────────────────
export const MAP_COLS = 20;
export const MAP_ROWS = 15;
export const TILE_PX = 32; // canvas pixels per map tile

// W=water, G=grass, S=sand, P=path, B1=Phonics(interactive), B2-B7=decorative
export const MAP_GRID: string[] = [
  "WWWWWWWWWWWWWWWWWWWW",
  "WGGGGGGGGGGGGGGGGGGW",
  "WGGGPPPGGGGPPPGGGGW",
  "WGGPB1PGGGPPB2PGGGW",
  "WGGGPPPGGGGPPPGGGGW",
  "WGGGGGSGGGGGSGGGGGW",
  "WSSSSSSSSSSSSSSSSSW",
  "WSPPPPSPPPPPSPPPPSW",
  "WSB3PPSPPPB4PPSB5PW",
  "WSPPPPSPPPPPSPPPPSW",
  "WSSSSSSSSSSSSSSSSSW",
  "WGGGPPPGGGGPPPGGGGW",
  "WGGPB6PGGGPPB7PGGGW",
  "WGGGPPPGGGGPPPGGGGW",
  "WWWWWWWWWWWWWWWWWWWW",
];
