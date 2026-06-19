import type { PhonemeData, CompanionData, StageData, SimilarSoundGroup, ActivityData, CefrLevel } from './types';

// ─── Version ─────────────────────────────────────────────────────────────────
export const SAVE_VERSION = 2;

// ─── Game Config ─────────────────────────────────────────────────────────────
export const GAME_CONFIG = {
  SCORE_CORRECT: 10,
  SCORE_WRONG: 0,
  STREAK_BONUS_THRESHOLD: 3,
  COINS_CORRECT: 1,
  COINS_STREAK: 2,
  FEEDBACK_DURATION_MS: 800,
  MIN_OPTIONS: 3,
  MAX_OPTIONS: 4,
  DEFAULT_ROUND_LENGTH: { phonics: 10, spelling: 10, definitions: 10 } as Record<string, number>,
  SPEED_TIMER_MS: 3000,
  CARD_FLIP_PAIRS: 4,
  DEFINITION_MIX_ADAPTIVE: true,
  SAVE_INDICATOR_MS: 3000, // how long to show the save indicator
} as const;

export const CEFR_LEVEL_ORDER = ["a1", "a2", "b1", "b2", "c1", "c2"] as const;

export const CEFR_LEVEL_LABELS: Record<string, string> = {
  a1: "A1 (Beginner)",
  a2: "A2 (Elementary)",
  b1: "B1 (Intermediate)",
  b2: "B2 (Upper-Intermediate)",
  c1: "C1 (Advanced)",
  c2: "C2 (Mastery)",
  all: "All Levels",
};

// ─── Phoneme Inventory (44 phonemes, 4 tiers) ────────────────────────────────
// ttsText is the string passed to speechSynthesis — avoids IPA rendering issues
export const PHONEMES: PhonemeData[] = [
  // Basic Consonants
  {
    id: 'p', ipa: '/p/', ttsText: 'p as in pin', soundText: 'puh',
    name: 'voiceless bilabial stop', example: 'pin', tier: 'basic',
  },
  {
    id: 'b', ipa: '/b/', ttsText: 'b as in big', soundText: 'buh',
    name: 'voiced bilabial stop', example: 'big', tier: 'basic',
  },
  {
    id: 't', ipa: '/t/', ttsText: 't as in top', soundText: 'tuh',
    name: 'voiceless alveolar stop', example: 'top', tier: 'basic',
  },
  {
    id: 'd', ipa: '/d/', ttsText: 'd as in dog', soundText: 'duh',
    name: 'voiced alveolar stop', example: 'dog', tier: 'basic',
  },
  {
    id: 'k', ipa: '/k/', ttsText: 'k as in cat', soundText: 'kuh',
    name: 'voiceless velar stop', example: 'cat', tier: 'basic',
  },
  {
    id: 'g', ipa: '/ɡ/', ttsText: 'g as in go', soundText: 'guh',
    name: 'voiced velar stop', example: 'go', tier: 'basic',
  },
  {
    id: 'm', ipa: '/m/', ttsText: 'm as in man', soundText: 'mmm',
    name: 'bilabial nasal', example: 'man', tier: 'basic',
  },
  {
    id: 'n', ipa: '/n/', ttsText: 'n as in net', soundText: 'nnn',
    name: 'alveolar nasal', example: 'net', tier: 'basic',
  },
  {
    id: 'l', ipa: '/l/', ttsText: 'l as in leg', soundText: 'lll',
    name: 'alveolar lateral', example: 'leg', tier: 'basic',
  },
  {
    id: 'r', ipa: '/r/', ttsText: 'r as in run', soundText: 'rrr',
    name: 'alveolar approximant', example: 'run', tier: 'basic',
  },
  {
    id: 'w', ipa: '/w/', ttsText: 'w as in wet', soundText: 'wuh',
    name: 'labial-velar approximant', example: 'wet', tier: 'basic',
  },
  {
    id: 'j', ipa: '/j/', ttsText: 'y as in yes', soundText: 'yuh',
    name: 'palatal approximant', example: 'yes', tier: 'basic',
  },
  // Consonants
  {
    id: 'f', ipa: '/f/', ttsText: 'f as in fan', soundText: 'fff',
    name: 'voiceless labiodental fricative', example: 'fan', tier: 'consonants',
  },
  {
    id: 'v', ipa: '/v/', ttsText: 'v as in van', soundText: 'vvv',
    name: 'voiced labiodental fricative', example: 'van', tier: 'consonants',
  },
  {
    id: 's', ipa: '/s/', ttsText: 's as in sun', soundText: 'sss',
    name: 'voiceless alveolar fricative', example: 'sun', tier: 'consonants',
  },
  {
    id: 'z', ipa: '/z/', ttsText: 'z as in zoo', soundText: 'zzz',
    name: 'voiced alveolar fricative', example: 'zoo', tier: 'consonants',
  },
  {
    id: 'sh', ipa: '/ʃ/', ttsText: 'sh as in ship', soundText: 'shhh',
    name: 'voiceless postalveolar fricative', example: 'ship', tier: 'consonants',
  },
  {
    id: 'zh', ipa: '/ʒ/', ttsText: 'zh as in measure', soundText: 'zhhh',
    name: 'voiced postalveolar fricative', example: 'measure', tier: 'consonants',
  },
  {
    id: 'h', ipa: '/h/', ttsText: 'h as in hat', soundText: 'huh',
    name: 'voiceless glottal fricative', example: 'hat', tier: 'consonants',
  },
  {
    id: 'ch', ipa: '/tʃ/', ttsText: 'ch as in chin', soundText: 'chuh',
    name: 'voiceless postalveolar affricate', example: 'chin', tier: 'consonants',
  },
  {
    id: 'dz', ipa: '/dʒ/', ttsText: 'j as in jump', soundText: 'juh',
    name: 'voiced postalveolar affricate', example: 'jump', tier: 'consonants',
  },
  {
    id: 'ng', ipa: '/ŋ/', ttsText: 'ng as in sing', soundText: 'ng',
    name: 'velar nasal', example: 'sing', tier: 'consonants',
  },
  {
    id: 'th', ipa: '/θ/', ttsText: 'th as in thin', soundText: 'thhh',
    name: 'voiceless dental fricative', example: 'thin', tier: 'consonants',
  },
  {
    id: 'dh', ipa: '/ð/', ttsText: 'th as in this', soundText: 'dhuh',
    name: 'voiced dental fricative', example: 'this', tier: 'consonants',
  },
  // Vowels
  { id: 'ae', ipa: '/æ/', ttsText: 'a as in cat', soundText: 'aa', name: 'short a', example: 'cat', tier: 'vowels' },
  { id: 'e', ipa: '/e/', ttsText: 'e as in bed', soundText: 'eh', name: 'short e', example: 'bed', tier: 'vowels' },
  { id: 'i', ipa: '/ɪ/', ttsText: 'i as in sit', soundText: 'ih', name: 'short i', example: 'sit', tier: 'vowels' },
  { id: 'o', ipa: '/ɒ/', ttsText: 'o as in hot', soundText: 'ah', name: 'short o', example: 'hot', tier: 'vowels' },
  { id: 'u', ipa: '/ʌ/', ttsText: 'u as in cup', soundText: 'uh', name: 'short u', example: 'cup', tier: 'vowels' },
  {
    id: 'ee', ipa: '/iː/', ttsText: 'ee as in see', soundText: 'ee',
    name: 'long ee', example: 'see', tier: 'vowels',
  },
  {
    id: 'ar', ipa: '/ɑː/', ttsText: 'ar as in car', soundText: 'ahh',
    name: 'long ar', example: 'car', tier: 'vowels',
  },
  {
    id: 'aw', ipa: '/ɔː/', ttsText: 'aw as in law', soundText: 'aww',
    name: 'long aw', example: 'law', tier: 'vowels',
  },
  {
    id: 'oo', ipa: '/uː/', ttsText: 'oo as in moon', soundText: 'oo',
    name: 'long oo', example: 'moon', tier: 'vowels',
  },
  {
    id: 'er', ipa: '/ɜː/', ttsText: 'er as in bird', soundText: 'er',
    name: 'long er', example: 'bird', tier: 'vowels',
  },
  {
    id: 'ay', ipa: '/eɪ/', ttsText: 'ay as in day', soundText: 'ay',
    name: 'long a (diphthong)', example: 'day', tier: 'vowels',
  },
  {
    id: 'ie', ipa: '/aɪ/', ttsText: 'ie as in fly', soundText: 'eye',
    name: 'long i (diphthong)', example: 'fly', tier: 'vowels',
  },
  {
    id: 'oy', ipa: '/ɔɪ/', ttsText: 'oy as in boy', soundText: 'oy',
    name: 'oy diphthong', example: 'boy', tier: 'vowels',
  },
  {
    id: 'ow', ipa: '/aʊ/', ttsText: 'ow as in now', soundText: 'ow',
    name: 'ow diphthong', example: 'now', tier: 'vowels',
  },
  {
    id: 'oh', ipa: '/əʊ/', ttsText: 'oh as in go', soundText: 'oh',
    name: 'oh diphthong', example: 'go', tier: 'vowels',
  },
  // Blends
  {
    id: 'uh', ipa: '/ə/', ttsText: 'uh as in about', soundText: 'uh',
    name: 'schwa', example: 'about', tier: 'blends',
  },
  {
    id: 'eer', ipa: '/ɪə/', ttsText: 'ear as in near', soundText: 'eer',
    name: 'ear diphthong', example: 'near', tier: 'blends',
  },
  {
    id: 'air', ipa: '/eə/', ttsText: 'air as in care', soundText: 'air',
    name: 'air diphthong', example: 'care', tier: 'blends',
  },
  {
    id: 'oor', ipa: '/ʊə/', ttsText: 'oor as in tour', soundText: 'oor',
    name: 'oor diphthong', example: 'tour', tier: 'blends',
  },
  {
    id: 'uh2', ipa: '/ʊ/', ttsText: 'u as in book', soundText: 'uh',
    name: 'short oo', example: 'book', tier: 'blends',
  },
];

// ─── Similar Sound Groups ─────────────────────────────────────────────────
export const SIMILAR_SOUND_GROUPS: SimilarSoundGroup[] = [
  {
    id: 'short-vowels', title: 'Short Vowels', subtitle: 'æ, e, ɪ, ɒ, ʌ',
    icon: 'ae', color: '#2EC4B6',
    phonemeIds: ['ae', 'e', 'i', 'o', 'u'],
    order: 0,
  },
  {
    id: 'long-vowels', title: 'Long Vowels', subtitle: 'iː, ɑː, ɔː, uː, ɜː',
    icon: 'ee', color: '#C8A44E',
    phonemeIds: ['ee', 'ar', 'aw', 'oo', 'er'],
    order: 1,
  },
  {
    id: 'diphthongs', title: 'Diphthongs', subtitle: 'eɪ, aɪ, ɔɪ, aʊ, əʊ',
    icon: 'ay', color: '#9B59B6',
    phonemeIds: ['ay', 'ie', 'oy', 'ow', 'oh'],
    order: 2,
  },
  {
    id: 'complex-vowels', title: 'Complex Vowels', subtitle: 'ə, ɪə, eə, ʊə, ʊ',
    icon: 'uh', color: '#FFBA08',
    phonemeIds: ['uh', 'eer', 'air', 'oor', 'uh2'],
    order: 3,
  },
  {
    id: 'bilabial-stops', title: 'Bilabial Stops', subtitle: 'p, b',
    icon: 'p', color: '#E74C3C',
    phonemeIds: ['p', 'b'],
    order: 4,
  },
  {
    id: 'alveolar-stops', title: 'Alveolar Stops', subtitle: 't, d',
    icon: 't', color: '#3498DB',
    phonemeIds: ['t', 'd'],
    order: 5,
  },
  {
    id: 'velar-stops', title: 'Velar Stops', subtitle: 'k, g',
    icon: 'k', color: '#1ABC9C',
    phonemeIds: ['k', 'g'],
    order: 6,
  },
  {
    id: 'labiodental-fricatives', title: 'Labiodental Fricatives', subtitle: 'f, v',
    icon: 'f', color: '#E67E22',
    phonemeIds: ['f', 'v'],
    order: 7,
  },
  {
    id: 'alveolar-fricatives', title: 'Alveolar Fricatives', subtitle: 's, z',
    icon: 's', color: '#5DADE2',
    phonemeIds: ['s', 'z'],
    order: 8,
  },
  {
    id: 'postalveolar-fricatives', title: 'Postalveolar & Glottal', subtitle: 'ʃ, ʒ, h',
    icon: 'sh', color: '#1ABC9C',
    phonemeIds: ['sh', 'zh', 'h'],
    order: 9,
  },
  {
    id: 'dental-fricatives', title: 'Dental Fricatives', subtitle: 'θ, ð',
    icon: 'th', color: '#FF70A6',
    phonemeIds: ['th', 'dh'],
    order: 10,
  },
  {
    id: 'affricates', title: 'Affricates', subtitle: 'tʃ, dʒ',
    icon: 'ch', color: '#E74C3C',
    phonemeIds: ['ch', 'dz'],
    order: 11,
  },
  {
    id: 'nasals', title: 'Nasals', subtitle: 'm, n, ŋ',
    icon: 'm', color: '#66BB6A',
    phonemeIds: ['m', 'n', 'ng'],
    order: 12,
  },
  {
    id: 'approximants', title: 'Approximants', subtitle: 'l, r, w, j',
    icon: 'l', color: '#8D6E63',
    phonemeIds: ['l', 'r', 'w', 'j'],
    order: 13,
  },
];

// ─── Phoneme → Group lookup ───────────────────────────────────────────────
export const PHONEME_TO_GROUP = Object.fromEntries(
  SIMILAR_SOUND_GROUPS.flatMap((g) => g.phonemeIds.map((pid) => [pid, g.id]))
);

export function getPhonemeGroup(phonemeId: string): SimilarSoundGroup | undefined {
  const gid = PHONEME_TO_GROUP[phonemeId];
  return SIMILAR_SOUND_GROUPS.find((g) => g.id === gid);
}

// ─── Activity definitions per phoneme ──────────────────────────────────────
export function getActivitiesForPhoneme(phonemeId: string): ActivityData[] {
  const group = getPhonemeGroup(phonemeId);
  const gid = group?.id ?? 'ungrouped';
  return [
    {
      id: `${phonemeId}-practice`,
      type: 'practice',
      title: 'Listen & Pick',
      subtitle: 'Hear the sound, find the word',
      phonemeId,
      length: 10,
      groupId: gid,
      order: 0,
    },
    {
      id: `${phonemeId}-ipa-word`,
      type: 'ipa-word',
      title: 'IPA → Word',
      subtitle: 'See the symbol, pick the word',
      phonemeId,
      length: 10,
      groupId: gid,
      order: 1,
    },
    {
      id: `${phonemeId}-word-ipa`,
      type: 'word-ipa',
      title: 'Word → IPA',
      subtitle: 'See the word, pick the symbol',
      phonemeId,
      length: 10,
      groupId: gid,
      order: 2,
    },
    {
      id: `${phonemeId}-exercise`,
      type: 'exercise',
      title: 'Exercise',
      subtitle: 'Mixed challenge',
      phonemeId,
      length: 10,
      groupId: gid,
      order: 3,
    },
  ];
}

// ─── Vocab helpers ──────────────────────────────────────────────────────────
const VOCAB_GROUP_MAP: Record<string, string> = {
  'vocab-a1': 'a1', 'vocab-a2': 'a2', 'vocab-b1': 'b1',
  'vocab-b2': 'b2', 'vocab-c1': 'c1', 'vocab-c2': 'c2',
};

export function getVocabStagesForGroup(groupId: string): StageData[] {
  const level = VOCAB_GROUP_MAP[groupId];
  if (!level) return [];
  return VOCAB_STAGES.filter((s) => s.id.startsWith(`vocab-${level}`));
}

export function getVocabActivitiesForStage(stageId: string, groupId: string, _level: CefrLevel): ActivityData[] {
  return [
    {
      id: `${stageId}-def-word`,
      type: 'definitions',
      direction: 'def-to-word',
      title: 'Definition → Word',
      subtitle: 'Read the meaning, find the word',
      phonemeId: stageId,
      length: 10,
      groupId,
      order: 0,
    },
    {
      id: `${stageId}-word-def`,
      type: 'definitions',
      direction: 'word-to-def',
      title: 'Word → Definition',
      subtitle: 'Read the word, find the meaning',
      phonemeId: stageId,
      length: 10,
      groupId,
      order: 1,
    },
    {
      id: `${stageId}-synonyms`,
      type: 'synonyms',
      title: 'Synonyms',
      subtitle: 'Find the matching synonym',
      phonemeId: stageId,
      length: 10,
      groupId,
      order: 2,
    },
    {
      id: `${stageId}-vocab-exercise`,
      type: 'vocab-exercise',
      title: 'Mixed Exercise',
      subtitle: 'Mixed challenge',
      phonemeId: stageId,
      length: 10,
      groupId,
      order: 3,
    },
  ];
}

// ─── Vocab Groups ──────────────────────────────────────────────────────────
export const VOCAB_GROUPS: SimilarSoundGroup[] = [
  {
    id: 'vocab-a1', title: 'A1 Beginner', subtitle: 'Basic everyday words',
    icon: 'a', color: '#2EC4B6',
    phonemeIds: [],
    order: 0,
  },
  {
    id: 'vocab-a2', title: 'A2 Elementary', subtitle: 'Common phrases',
    icon: 'a', color: '#FF70A6',
    phonemeIds: [],
    order: 1,
  },
  {
    id: 'vocab-b1', title: 'B1 Intermediate', subtitle: 'Conversational',
    icon: 'b', color: '#C8A44E',
    phonemeIds: [],
    order: 2,
  },
  {
    id: 'vocab-b2', title: 'B2 Upper-Intermediate', subtitle: 'Abstract topics',
    icon: 'b', color: '#9B59B6',
    phonemeIds: [],
    order: 3,
  },
  {
    id: 'vocab-c1', title: 'C1 Advanced', subtitle: 'Demanding vocabulary',
    icon: 'c', color: '#E2B237',
    phonemeIds: [],
    order: 4,
  },
  {
    id: 'vocab-c2', title: 'C2 Mastery', subtitle: 'Fluent professional',
    icon: 'c', color: '#4A90E2',
    phonemeIds: [],
    order: 5,
  },
];

// ─── Path / Progression ──────────────────────────────────────────────────────
export const STAGES: StageData[] = [
  {
    id: 'stage-1',
    title: 'Short A & E',
    subtitle: 'Short vowel sounds',
    icon: 'ae',
    color: '#2EC4B6',
    category: 'vowel',
    lessons: [
      { id: 's1-1', title: 'The /æ/ Sound', phonemeIds: ['ae'] },
      { id: 's1-2', title: 'The /e/ Sound', phonemeIds: ['e'] },
      { id: 's1-3', title: 'A & E Mix', phonemeIds: ['ae', 'e'] },
    ],
  },
  {
    id: 'stage-2',
    title: 'Short I, O & U',
    subtitle: 'More short vowels',
    icon: 'i',
    color: '#FF70A6',
    category: 'vowel',
    lessons: [
      { id: 's2-1', title: 'The /ɪ/ Sound', phonemeIds: ['i'] },
      { id: 's2-2', title: 'The /ɒ/ Sound', phonemeIds: ['o'] },
      { id: 's2-3', title: 'The /ʌ/ Sound', phonemeIds: ['u'] },
      { id: 's2-4', title: 'Short Vowel Mix', phonemeIds: ['i', 'o', 'u'] },
    ],
  },
  {
    id: 'stage-3',
    title: 'Long A & E',
    subtitle: 'Long front vowels',
    icon: 'ay',
    color: '#C8A44E',
    category: 'vowel',
    lessons: [
      { id: 's3-1', title: 'The /eɪ/ Sound', phonemeIds: ['ay'] },
      { id: 's3-2', title: 'The /iː/ Sound', phonemeIds: ['ee'] },
      { id: 's3-3', title: 'Long A & E Mix', phonemeIds: ['ay', 'ee'] },
    ],
  },
  {
    id: 'stage-4',
    title: 'Long I & O',
    subtitle: 'Long diphthong vowels',
    icon: 'ie',
    color: '#9B59B6',
    category: 'vowel',
    lessons: [
      { id: 's4-1', title: 'The /aɪ/ Sound', phonemeIds: ['ie'] },
      { id: 's4-2', title: 'The /əʊ/ Sound', phonemeIds: ['oh'] },
      { id: 's4-3', title: 'Long I & O Mix', phonemeIds: ['ie', 'oh'] },
    ],
  },
  {
    id: 'stage-5',
    title: 'Long U & R-controlled',
    subtitle: 'Back vowels + R sounds',
    icon: 'oo',
    color: '#5DADE2',
    category: 'vowel',
    lessons: [
      { id: 's5-1', title: 'The /uː/ Sound', phonemeIds: ['oo'] },
      { id: 's5-2', title: 'The /ɜː/ Sound', phonemeIds: ['er'] },
      { id: 's5-3', title: 'AR & AW Sounds', phonemeIds: ['ar', 'aw'] },
      { id: 's5-4', title: 'Long Vowel Mix', phonemeIds: ['oo', 'er', 'ar', 'aw'] },
    ],
  },
  {
    id: 'stage-6',
    title: 'Diphthongs & Special',
    subtitle: 'Complex vowel sounds',
    icon: 'oy',
    color: '#FFBA08',
    category: 'vowel',
    lessons: [
      { id: 's6-1', title: 'OY & OW', phonemeIds: ['oy', 'ow'] },
      { id: 's6-2', title: 'Schwa & Short OO', phonemeIds: ['uh', 'uh2'] },
      { id: 's6-3', title: 'EAR, AIR & OOR', phonemeIds: ['eer', 'air', 'oor'] },
      { id: 's6-4', title: 'Diphthong Mix', phonemeIds: ['oy', 'ow', 'uh', 'uh2', 'eer', 'air', 'oor'] },
    ],
  },
  {
    id: 'stage-7',
    title: 'Stops',
    subtitle: 'Voiced & voiceless pairs',
    icon: 'p',
    color: '#E74C3C',
    category: 'consonant',
    lessons: [
      { id: 's7-1', title: 'P & B', phonemeIds: ['p', 'b'] },
      { id: 's7-2', title: 'T & D', phonemeIds: ['t', 'd'] },
      { id: 's7-3', title: 'K & G', phonemeIds: ['k', 'g'] },
      { id: 's7-4', title: 'Stop Sounds Mix', phonemeIds: ['p', 'b', 't', 'd', 'k', 'g'] },
    ],
  },
  {
    id: 'stage-8',
    title: 'Fricatives',
    subtitle: 'Continuous airflow sounds',
    icon: 's',
    color: '#3498DB',
    category: 'consonant',
    lessons: [
      { id: 's8-1', title: 'F & V', phonemeIds: ['f', 'v'] },
      { id: 's8-2', title: 'S & Z', phonemeIds: ['s', 'z'] },
      { id: 's8-3', title: 'The /h/ Sound', phonemeIds: ['h'] },
      { id: 's8-4', title: 'Fricative Mix', phonemeIds: ['f', 'v', 's', 'z', 'h'] },
    ],
  },
  {
    id: 'stage-9',
    title: 'Postalveolars & Affricates',
    subtitle: 'Sh, Zh, Th, Ch, J',
    icon: 'sh',
    color: '#1ABC9C',
    category: 'consonant',
    lessons: [
      { id: 's9-1', title: 'SH & ZH', phonemeIds: ['sh', 'zh'] },
      { id: 's9-2', title: 'TH Sounds', phonemeIds: ['th', 'dh'] },
      { id: 's9-3', title: 'CH & J', phonemeIds: ['ch', 'dz'] },
      { id: 's9-4', title: 'Complex Consonant Mix', phonemeIds: ['sh', 'zh', 'th', 'dh', 'ch', 'dz'] },
    ],
  },
  {
    id: 'stage-10',
    title: 'Nasals & Approximants',
    subtitle: 'Sonorant sounds',
    icon: 'm',
    color: '#E67E22',
    category: 'consonant',
    lessons: [
      { id: 's10-1', title: 'M & N', phonemeIds: ['m', 'n'] },
      { id: 's10-2', title: 'NG & L', phonemeIds: ['ng', 'l'] },
      { id: 's10-3', title: 'R, W & Y', phonemeIds: ['r', 'w', 'j'] },
      { id: 's10-4', title: 'Sonorant Mix', phonemeIds: ['m', 'n', 'ng', 'l', 'r', 'w', 'j'] },
    ],
  },
  {
    id: 'stage-11',
    title: 'Mastery Challenge',
    subtitle: 'Test all your skills',
    icon: 'ae',
    color: '#2C3E50',
    category: 'mastery',
    lessons: [
      { id: 's11-1', title: 'Vowel Review', phonemeIds: ['ae', 'e', 'i', 'o', 'u', 'ay', 'ee', 'ie', 'oh', 'oo', 'er', 'ar', 'aw', 'oy', 'ow'] },
      { id: 's11-2', title: 'Consonant Review', phonemeIds: ['p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'sh', 'zh', 'th', 'dh', 'ch', 'dz', 'm', 'n', 'ng', 'l', 'r', 'w', 'j'] },
      { id: 's11-3', title: 'Mixed Challenge', phonemeIds: ['ae', 'e', 'p', 'b', 'f', 'v', 'm', 'n', 'i', 'o', 'u', 't', 'd', 's', 'z'] },
      { id: 's11-4', title: 'Final Challenge', phonemeIds: ['sh', 'zh', 'th', 'dh', 'ch', 'dz', 'ng', 'l', 'r', 'w', 'j', 'ee', 'ar', 'aw', 'oo', 'er', 'ay', 'ie', 'oy', 'ow', 'oh', 'uh', 'eer', 'air', 'oor', 'uh2'] },
    ],
  },
];

export const VOCAB_STAGES: StageData[] = [
  {
    id: 'vocab-a1-1',
    title: 'A1.1 - Beginner',
    subtitle: 'High frequency everyday words',
    icon: 'A1.1',
    color: '#2EC4B6',
    category: 'vowel',
    lessons: [
      { id: 'v1-1', title: 'Beginner Words 1', phonemeIds: [] },
      { id: 'v1-2', title: 'Beginner Words 2', phonemeIds: [] },
      { id: 'v1-3', title: 'Beginner Mix 1', phonemeIds: [] },
    ],
  },
  {
    id: 'vocab-a1-2',
    title: 'A1.2 - Beginner',
    subtitle: 'Numbers, family & daily routines',
    icon: 'A1.2',
    color: '#2EC4B6',
    category: 'vowel',
    lessons: [
      { id: 'v1-4', title: 'Beginner Words 3', phonemeIds: [] },
      { id: 'v1-5', title: 'Beginner Words 4', phonemeIds: [] },
      { id: 'v1-6', title: 'Beginner Mix 2', phonemeIds: [] },
    ],
  },
  {
    id: 'vocab-a2-1',
    title: 'A2.1 - Elementary',
    subtitle: 'Simple phrases and expressions',
    icon: 'A2.1',
    color: '#FF70A6',
    category: 'vowel',
    lessons: [
      { id: 'v2-1', title: 'Elementary Words 1', phonemeIds: [] },
      { id: 'v2-2', title: 'Elementary Words 2', phonemeIds: [] },
      { id: 'v2-3', title: 'Elementary Mix 1', phonemeIds: [] },
    ],
  },
  {
    id: 'vocab-a2-2',
    title: 'A2.2 - Elementary',
    subtitle: 'Travel, work & basic descriptions',
    icon: 'A2.2',
    color: '#FF70A6',
    category: 'vowel',
    lessons: [
      { id: 'v2-4', title: 'Elementary Words 3', phonemeIds: [] },
      { id: 'v2-5', title: 'Elementary Words 4', phonemeIds: [] },
      { id: 'v2-6', title: 'Elementary Mix 2', phonemeIds: [] },
    ],
  },
  {
    id: 'vocab-b1-1',
    title: 'B1.1 - Intermediate',
    subtitle: 'Clear standard vocabulary',
    icon: 'B1.1',
    color: '#C8A44E',
    category: 'consonant',
    lessons: [
      { id: 'v3-1', title: 'Intermediate Words 1', phonemeIds: [] },
      { id: 'v3-2', title: 'Intermediate Words 2', phonemeIds: [] },
      { id: 'v3-3', title: 'Intermediate Mix 1', phonemeIds: [] },
    ],
  },
  {
    id: 'vocab-b1-2',
    title: 'B1.2 - Intermediate',
    subtitle: 'Abstract topics & detailed plans',
    icon: 'B1.2',
    color: '#C8A44E',
    category: 'consonant',
    lessons: [
      { id: 'v3-4', title: 'Intermediate Words 3', phonemeIds: [] },
      { id: 'v3-5', title: 'Intermediate Words 4', phonemeIds: [] },
      { id: 'v3-6', title: 'Intermediate Mix 2', phonemeIds: [] },
    ],
  },
  {
    id: 'vocab-b2-1',
    title: 'B2.1 - Upper-Int',
    subtitle: 'Complex abstract vocabulary',
    icon: 'B2.1',
    color: '#9B59B6',
    category: 'consonant',
    lessons: [
      { id: 'v4-1', title: 'Upper-Int Words 1', phonemeIds: [] },
      { id: 'v4-2', title: 'Upper-Int Words 2', phonemeIds: [] },
      { id: 'v4-3', title: 'Upper-Int Mix 1', phonemeIds: [] },
    ],
  },
  {
    id: 'vocab-b2-2',
    title: 'B2.2 - Upper-Int',
    subtitle: 'Fluency, idioms & technical discussions',
    icon: 'B2.2',
    color: '#9B59B6',
    category: 'consonant',
    lessons: [
      { id: 'v4-4', title: 'Upper-Int Words 3', phonemeIds: [] },
      { id: 'v4-5', title: 'Upper-Int Words 4', phonemeIds: [] },
      { id: 'v4-6', title: 'Upper-Int Mix 2', phonemeIds: [] },
    ],
  },
  {
    id: 'vocab-c1-1',
    title: 'C1.1 - Advanced',
    subtitle: 'Demanding vocabulary pool',
    icon: 'C1.1',
    color: '#E2B237',
    category: 'mastery',
    lessons: [
      { id: 'v5-1', title: 'Advanced Words 1', phonemeIds: [] },
      { id: 'v5-2', title: 'Advanced Words 2', phonemeIds: [] },
      { id: 'v5-3', title: 'Advanced Mix 1', phonemeIds: [] },
    ],
  },
  {
    id: 'vocab-c1-2',
    title: 'C1.2 - Advanced',
    subtitle: 'Nuanced expressions & shades of meaning',
    icon: 'C1.2',
    color: '#E2B237',
    category: 'mastery',
    lessons: [
      { id: 'v5-4', title: 'Advanced Words 3', phonemeIds: [] },
      { id: 'v5-5', title: 'Advanced Words 4', phonemeIds: [] },
      { id: 'v5-6', title: 'Advanced Mix 2', phonemeIds: [] },
    ],
  },
  {
    id: 'vocab-c2',
    title: 'C2 - Mastery',
    subtitle: 'Fluent professional vocabulary',
    icon: 'C2',
    color: '#4A90E2',
    category: 'mastery',
    lessons: [
      { id: 'v6-1', title: 'Mastery Words 1', phonemeIds: [] },
      { id: 'v6-2', title: 'Mastery Words 2', phonemeIds: [] },
      { id: 'v6-3', title: 'Mastery Mix', phonemeIds: [] },
    ],
  },
];

// ─── Companions ───────────────────────────────────────────────────────────────
export const COMPANIONS: Record<string, CompanionData> = {
  nox: {
    id: 'nox',
    name: 'Nox',
    type: 'owl',
    color: '#C8A44E',
    personality: 'wise and cryptic',
    cost: 0,
    animParams: { breatheHeight: 3, breatheSpeed: 3, blinkInterval: 4000, blinkDuration: 150 },
    hints: {
      phonics: {
        1: 'Listen carefully to the sound...',
        2: 'Feel where your mouth moves when you say it.',
        3: 'Repeat after me — the sound is at the start of the word.',
      },
      spelling: {
        1: 'Think about the letters one by one.',
        2: 'How many sounds does the word have?',
        3: 'The first letter is a clue — focus there.',
      },
      definitions: {
        1: 'What context does this word fit in?',
        2: 'Think of related words you already know.',
        3: 'The first letter of the answer is a good starting point.',
      },
    },
  },
  mira: {
    id: 'mira',
    name: 'Mira',
    type: 'witch',
    color: '#9B59B6',
    personality: 'energetic and encouraging',
    cost: 0,
    animParams: { breatheHeight: 5, breatheSpeed: 2, blinkInterval: 3500, blinkDuration: 150 },
    hints: {
      phonics: {
        1: 'You can do it! Listen to the sound one more time!',
        2: 'Think — which word has that sound at the beginning?',
        3: 'It rhymes with a word you already know!',
      },
      spelling: {
        1: 'Sound it out — one letter at a time!',
        2: 'You spelled something close — check the vowel!',
        3: 'Almost there! Look at the ending carefully.',
      },
      definitions: {
        1: 'Wow, tricky one! Think about what category it belongs to.',
        2: "You've seen this word before — trust yourself!",
        3: 'Eliminate the ones that feel totally wrong first.',
      },
    },
  },
  chip: {
    id: 'chip',
    name: 'Chip',
    type: 'robot',
    color: '#5DADE2',
    personality: 'literal and technical',
    cost: 0,
    animParams: { breatheHeight: 2, breatheSpeed: 1.5, blinkInterval: 2500, blinkDuration: 100 },
    hints: {
      phonics: {
        1: 'Scanning phoneme database... sound detected.',
        2: `Syllable count: ${1}. Primary stress: initial position.`,
        3: 'Processing: the target phoneme appears in position 1 of the word.',
      },
      spelling: {
        1: 'Letter count analysis: word has N characters.',
        2: 'Phoneme-to-grapheme mapping suggests a silent letter is present.',
        3: 'First character identified. Begin from there.',
      },
      definitions: {
        1: 'Cross-referencing semantic field: this word belongs to a specific domain.',
        2: 'Synonym detected in adjacent option — use process of elimination.',
        3: 'Word frequency: high — you have encountered this word before.',
      },
    },
  },
  fox: {
    id: 'fox',
    name: 'Fox',
    type: 'fox',
    color: '#E85D26',
    personality: 'cunning and clever',
    cost: 30,
    animParams: { breatheHeight: 4, breatheSpeed: 2.5, blinkInterval: 3500, blinkDuration: 150 },
    hints: {
      phonics: {
        1: 'Ah, a puzzle! Listen to the sound again.',
        2: 'Think like a fox — find the pattern in the sounds.',
        3: 'The target sound is hidden at the beginning of the correct word.',
      },
      spelling: {
        1: 'Tricky! Break down the letters sequentially.',
        2: 'Is there a silent letter trying to outsmart us?',
        3: 'The first letter is the start of the trail. Focus there.',
      },
      definitions: {
        1: 'Look at the clues. What category fits best?',
        2: 'Use process of elimination to narrow it down.',
        3: 'The correct definition is simpler than it looks.',
      },
    },
  },
  cat: {
    id: 'cat',
    name: 'Cat',
    type: 'cat',
    color: '#66BB6A',
    personality: 'curious and playful',
    cost: 30,
    animParams: { breatheHeight: 4, breatheSpeed: 3, blinkInterval: 4000, blinkDuration: 180 },
    hints: {
      phonics: {
        1: 'Meow! Hear that sound again?',
        2: 'Play with the options! Which one feels right?',
        3: 'The target sound is at the very front of the word!',
      },
      spelling: {
        1: 'Scratch out the wrong letters first!',
        2: "Let's check the vowels — cats love to be precise.",
        3: 'Start with the first letter and stretch the word.',
      },
      definitions: {
        1: 'What does it mean? Think of what it does.',
        2: "I think we've seen this word before. Try to remember!",
        3: 'Cats know best — ignore the odd choices.',
      },
    },
  },
  bear: {
    id: 'bear',
    name: 'Bear',
    type: 'bear',
    color: '#8D6E63',
    personality: 'gentle and patient',
    cost: 50,
    animParams: { breatheHeight: 3, breatheSpeed: 3.5, blinkInterval: 4000, blinkDuration: 200 },
    hints: {
      phonics: {
        1: 'Take a deep breath and listen to the sound once more.',
        2: 'No rush. Which word starts with that sound?',
        3: "I'll help you — it's the starting sound of the word.",
      },
      spelling: {
        1: "Let's write it down step-by-step.",
        2: "Check each letter slowly. You're doing fine.",
        3: 'The first letter is where our path begins.',
      },
      definitions: {
        1: 'Think about what this word describes.',
        2: "Take your time. Cross off the answers that don't match.",
        3: 'The correct definition is the most comforting one.',
      },
    },
  },
  bunny: {
    id: 'bunny',
    name: 'Bunny',
    type: 'bunny',
    color: '#F48FB1',
    personality: 'cheerful and quick',
    cost: 50,
    animParams: { breatheHeight: 6, breatheSpeed: 1.8, blinkInterval: 2500, blinkDuration: 120 },
    hints: {
      phonics: {
        1: 'Hop to it! Hear the sound one more time!',
        2: 'Quick! Which option starts with this sound?',
        3: 'The sound is right at the beginning of the word!',
      },
      spelling: {
        1: 'Hop from letter to letter! Sound them out!',
        2: 'Double check the spelling. You got this!',
        3: 'Start from the first character and build up.',
      },
      definitions: {
        1: 'What a fun word! What does it describe?',
        2: "Trust your first choice. You're doing great!",
        3: 'Pick the one that makes the most sense to you.',
      },
    },
  },
  penguin: {
    id: 'penguin',
    name: 'Penguin',
    type: 'penguin',
    color: '#37474F',
    personality: 'friendly and cool',
    cost: 50,
    animParams: { breatheHeight: 3, breatheSpeed: 2.5, blinkInterval: 3500, blinkDuration: 150 },
    hints: {
      phonics: {
        1: "Stay cool. Let's listen to the sound again.",
        2: 'Which word starts with this chilly sound?',
        3: 'The sound is at the very beginning of the word.',
      },
      spelling: {
        1: 'Slide through the spelling one letter at a time.',
        2: 'Watch out for silent letters or vowel traps.',
        3: 'The first character is our guide post.',
      },
      definitions: {
        1: 'What category does this word fall into?',
        2: 'Break it down coolly. Eliminate the distractors.',
        3: 'Choose the definition that describes it best.',
      },
    },
  },
  alien: {
    id: 'alien',
    name: 'Alien',
    type: 'alien',
    color: '#A5D6A7',
    personality: 'quirky and cosmic',
    cost: 80,
    animParams: { breatheHeight: 5, breatheSpeed: 2.5, blinkInterval: 3000, blinkDuration: 150 },
    hints: {
      phonics: {
        1: 'Beep bop! Sound frequency received. Listen again.',
        2: 'Cosmic scan: match the start sound to the word.',
        3: 'The sound is positioned at character index 0.',
      },
      spelling: {
        1: 'Construct the spelling node by node.',
        2: 'Check for anomalies in the vowel sector.',
        3: 'Transmitting the first character. Standby.',
      },
      definitions: {
        1: 'Analyzing semantic database... loading definition.',
        2: 'Cross-referencing synonyms in the quadrant.',
        3: 'Select the optimal option matching standard usage.',
      },
    },
  },
  ninja: {
    id: 'ninja',
    name: 'Ninja',
    type: 'ninja',
    color: '#222222',
    personality: 'silent and focused',
    cost: 80,
    animParams: { breatheHeight: 2, breatheSpeed: 2.5, blinkInterval: 4000, blinkDuration: 100 },
    hints: {
      phonics: {
        1: 'Focus. Listen to the sound in silence.',
        2: 'Observe the beginning of each word closely.',
        3: 'The target sound is at the start.',
      },
      spelling: {
        1: 'Trace the strokes of each letter carefully.',
        2: 'Avoid spelling traps. Check the center.',
        3: 'Begin with the first letter. Strike with precision.',
      },
      definitions: {
        1: 'Read the definitions. Seek the truth.',
        2: 'Eliminate the wrong options silently.',
        3: 'Trust your training. Choose the correct path.',
      },
    },
  },
  robot: {
    id: 'robot',
    name: 'Robot',
    type: 'robot',
    color: '#546E7A',
    personality: 'methodical and precise',
    cost: 30,
    animParams: { breatheHeight: 2, breatheSpeed: 1.5, blinkInterval: 3000, blinkDuration: 100 },
    hints: {
      phonics: {
        1: 'Analyzing sound wave... frequency pattern detected.',
        2: 'Cross-referencing word-initial phoneme database.',
        3: 'Target phoneme matches word at index position 0.',
      },
      spelling: {
        1: 'Running spelling algorithm: phonetic analysis active.',
        2: 'Vowel morphology suggests caution in mid-word position.',
        3: 'First character confirmed. Proceeding with sequential assembly.',
      },
      definitions: {
        1: 'Querying semantic database for contextual match.',
        2: 'Synonym proximity scan: eliminate non-matching entries.',
        3: 'Optimal definition identified by word frequency score.',
      },
    },
  },
};

// Map phoneme IDs to example words where the phoneme occurs word-initially.
// Used by playPhonemeAudio to trim the first ~120ms (the phoneme onset) from
// the FreeDictionary audio file. Phonemes without a word-initial example
// (zh, ng, oor, uh2) fall back to TTS.
export const PHONEME_EXAMPLE_WORDS: Record<string, string | undefined> = {
  p: 'pin',
  b: 'big',
  t: 'top',
  d: 'dog',
  k: 'cat',
  g: 'go',
  m: 'man',
  n: 'nut',
  l: 'leg',
  r: 'run',
  w: 'wet',
  j: 'yes',
  f: 'fan',
  v: 'van',
  s: 'sun',
  z: 'zoo',
  sh: 'ship',
  h: 'hat',
  ch: 'chin',
  dz: 'jump',
  th: 'thin',
  dh: 'this',
  ae: 'apple',
  e: 'egg',
  i: 'igloo',
  o: 'octopus',
  u: 'up',
  ee: 'eel',
  ar: 'arm',
  aw: 'awe',
  oo: 'ooze',
  er: 'earth',
  ay: 'ace',
  ie: 'ice',
  oy: 'oil',
  ow: 'owl',
  oh: 'open',
  uh: 'about',
  eer: 'ear',
  air: 'air',
};

// Trim duration in ms per phoneme for playPhonemeAudio.
// Based on phoneme type: plosive=50ms, fricative=150ms, nasal=120ms,
// approximant=100ms, affricate=80ms, vowel=100ms, diphthong=120ms.
export const PHONEME_TRIM_DURATIONS: Record<string, number> = {
  p: 50, b: 50, t: 50, d: 50, k: 50, g: 50,
  f: 150, v: 150, s: 150, z: 150, sh: 150, zh: 150, th: 150, dh: 150, h: 150,
  m: 120, n: 120, ng: 120,
  w: 100, y: 100, l: 100, r: 100,
  ch: 80, dz: 80,
  ae: 100, e: 100, i: 100, o: 100, u: 100,
  ee: 100, ar: 100, aw: 100, oo: 100, er: 100,
  ay: 120, ie: 120, oy: 120, ow: 120, oh: 120,
  uh: 120, eer: 120, air: 120, oor: 120,
  bl: 120, br: 120, cl: 120, cr: 120, sn: 120,
};


