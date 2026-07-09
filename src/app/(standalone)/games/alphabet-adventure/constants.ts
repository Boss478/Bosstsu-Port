import type { StageConfig } from './types';
import { shuffleArray } from '@/lib/shuffle';

const ALPHABET_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ALPHABET_LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');

export const PER_LETTER_MIN = 5;
export const STAGE6_PER_LETTER_MIN = 3;
export const MAP_SAVE_KEY = 'alphabet-adventure-map-v2';

export const LETTER_GROUPS: string[][] = [
  'ABCDEF'.split(''),
  'GHIJKL'.split(''),
  'MNOPQR'.split(''),
  'STUVWXYZ'.split(''),
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
];

export const SUB_STAGE_NAMES: Array<{ name: string; subtitle: string }> = [
  { name: 'Thai Match', subtitle: 'จับคู่ภาษาไทย' },
  { name: 'Phonics Match', subtitle: 'จับคู่เสียงอ่าน' },
  { name: 'Letter Match', subtitle: 'จับคู่ตัวอักษร' },
  { name: 'Missing Capitals', subtitle: 'เติมตัวพิมพ์ใหญ่ที่หายไป' },
  { name: 'Missing Lowercase', subtitle: 'เติมตัวพิมพ์เล็กที่หายไป' },
  { name: 'Typing Challenge', subtitle: 'พิมพ์ตัวอักษร' },
];

const STAGE_SUB_TYPE: Array<{
  type: StageConfig['subStages'][number]['type'];
  dataPool?: StageConfig['subStages'][number]['dataPool'];
  revert?: boolean;
}> = [
  { type: 'match', dataPool: 'thai', revert: true },
  { type: 'match', dataPool: 'phonics', revert: true },
  { type: 'match', dataPool: 'lowercase' },
  { type: 'fill-upper' },
  { type: 'fill-lower' },
  { type: 'typing' },
];

export function buildStages(): StageConfig[] {
  return STAGE_SUB_TYPE.map((sub, stageIdx) => {
    return {
      id: stageIdx + 1,
      name: SUB_STAGE_NAMES[stageIdx].name,
      subtitle: SUB_STAGE_NAMES[stageIdx].subtitle,
      letterGroup: [],
      perLetterMin: PER_LETTER_MIN,
      subStages: LETTER_GROUPS.map((group, subIdx) => {
        const isLastSub = subIdx === 4;
        const letterPool = group;
        const hideLetters = isLastSub
          ? [...group].sort(() => Math.random() - 0.5).slice(0, 10)
          : group;
        const subLetterPool = sub.type.startsWith('fill')
          ? sub.type === 'fill-lower'
            ? hideLetters.map((l) => l.toLowerCase())
            : hideLetters
          : letterPool;
        const subHideLetters = sub.type.startsWith('fill') ? subLetterPool : undefined;

        const rangeStart = group[0];
        const rangeEnd = group[group.length - 1];
        const groupName = isLastSub ? 'All Letters' : `Letters ${rangeStart}–${rangeEnd}`;

        return {
          id: subIdx + 1,
          name: groupName,
          subtitle: group.join(' '),
          type: sub.type,
          dataPool: sub.dataPool,
          letterPool: subLetterPool,
          hideLetters: subHideLetters,
          revert: sub.revert ?? false,
          targetMin: sub.type.startsWith('fill')
            ? hideLetters.length
            : sub.type === 'typing'
              ? letterPool.length
              : letterPool.length * (isLastSub ? STAGE6_PER_LETTER_MIN : PER_LETTER_MIN),
        };
      }),
    };
  });
}

const STAGES_CACHE = buildStages();
export function getStages(): StageConfig[] {
  return STAGES_CACHE;
}
export function getStage(id: number): StageConfig | undefined {
  return STAGES_CACHE.find((s) => s.id === id);
}

const THAI_NAMES = [
  'เอ',
  'บี',
  'ซี',
  'ดี',
  'อี',
  'เอฟ',
  'จี',
  'เอช',
  'ไอ',
  'เจ',
  'เค',
  'แอล',
  'เอ็ม',
  'เอ็น',
  'โอ',
  'พี',
  'คิว',
  'อาร์',
  'เอส',
  'ที',
  'ยู',
  'วี',
  'ดับเบิลยู',
  'เอกซ์',
  'วาย',
  'แซด',
];

const PHONICS_SOUNDS = [
  'แอะ /a/',
  'เบอะ /b/',
  'เคอะ /k/',
  'ดึ /d/',
  'เอะ /e/',
  'เฟอะ /f/',
  'เกอะ /g/',
  'เฮอะ /h/',
  'อิ /i/',
  'เจอะ /j/',
  'เคอะ /k/',
  'เลอะ /l/',
  'เมอะ /m/',
  'เนอะ /n/',
  'เอาะ /o/',
  'เพอะ /p/',
  'เควอะ /kw/',
  'เรอะ /r/',
  'เซอะ /s/',
  'เทอะ /t/',
  'อะ /u/',
  'เวอะ /v/',
  'เวอะ /w/',
  'ซ /ks/',
  'เยอะ /j/',
  'ซี /z/',
];

export const GAME_CONFIG = {
  SCORE_CORRECT: 5,
  SCORE_WRONG: 3,
  SCORE_TYPING_CORRECT: 10,
  SCORE_TYPING_WRONG: 5,
  INITIAL_DIFFICULTY: 3,
  MAX_DIFFICULTY: 24,
  DIFFICULTY_INCREASE: 2,
  ERROR_THRESHOLD: 3,
  FEEDBACK_DURATION_CORRECT: 1000,
  FEEDBACK_DURATION_WRONG: 1500,
  STAR_THREE: 90,
  STAR_TWO: 70,
  WRONG_LIMIT: 2,
} as const;

const STREAK_PRAISE = ['Keep going!', 'On fire!', 'Unstoppable!', 'Legendary!', 'Perfect streak!'];

const PRAISE = {
  correct: [
    'Excellent!',
    'Great job!',
    'Perfect!',
    'Correct!',
    'Well done!',
    'Amazing!',
    'Super!',
    'Awesome!',
  ],
  wrong: ['Try again!', 'Keep going!', 'Almost!', "Don't give up!", 'Nice try!'],
} as const;

export const HIGH_SCORE_KEY = 'alphabet-adventure-highscore';
export const PROGRESS_KEY = 'alphabet-adventure-progress';

export function calcStars(accuracy: number): number {
  if (accuracy >= GAME_CONFIG.STAR_THREE) return 3;
  if (accuracy >= GAME_CONFIG.STAR_TWO) return 2;
  return 1;
}

export function randomPraise(type: 'correct' | 'wrong'): string {
  const pool = PRAISE[type];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function streakPraise(streak: number): string {
  if (streak < 3) return `${streak} in a row!`;
  const idx = Math.min(streak - 3, STREAK_PRAISE.length - 1);
  return `${streak} in a row! ${STREAK_PRAISE[idx]}`;
}

function getLetterIndex(round: number, pool: string[] = ALPHABET_UPPER): number {
  return (round - 1) % pool.length;
}

export function generateMatchRound(round: number, pool: string[] = ALPHABET_UPPER, numChoices = 3) {
  const targetIndex = getLetterIndex(round, pool);
  const upper = pool[targetIndex];
  const correctLower = upper.toLowerCase();

  const choices = [correctLower];
  const poolLower = pool.map((l) => l.toLowerCase());
  while (choices.length < numChoices) {
    const r = poolLower[Math.floor(Math.random() * poolLower.length)];
    if (!choices.includes(r)) choices.push(r);
  }

  return {
    targetLetter: upper,
    correctChar: correctLower,
    choices: shuffleArray(choices),
  };
}

export function generateThaiRevertRound(
  round: number,
  pool: string[] = ALPHABET_UPPER,
  numChoices = 3,
) {
  const targetIndex = getLetterIndex(round, pool);
  const correctLetter = pool[targetIndex];
  const letterIndexInFull = ALPHABET_UPPER.indexOf(correctLetter);
  const thaiName = THAI_NAMES[letterIndexInFull];

  const choices = [correctLetter];
  while (choices.length < numChoices) {
    const r = pool[Math.floor(Math.random() * pool.length)];
    if (!choices.includes(r)) choices.push(r);
  }

  return {
    targetLetter: thaiName,
    correctChar: correctLetter,
    choices: shuffleArray(choices),
  };
}

export function generatePhonicsRevertRound(
  round: number,
  pool: string[] = ALPHABET_UPPER,
  numChoices = 3,
) {
  const targetIndex = getLetterIndex(round, pool);
  const correctLetter = pool[targetIndex];
  const letterIndexInFull = ALPHABET_UPPER.indexOf(correctLetter);
  const correct = PHONICS_SOUNDS[letterIndexInFull];

  const choices = [correctLetter];
  while (choices.length < numChoices) {
    const r = pool[Math.floor(Math.random() * pool.length)];
    if (!choices.includes(r)) choices.push(r);
  }

  return {
    targetLetter: correct,
    correctChar: correctLetter,
    choices: shuffleArray(choices),
  };
}

export function generateFillChoices(
  correctChar: string,
  numChoices: number,
  pool: string[],
): string[] {
  const choices = [correctChar];
  while (choices.length < numChoices) {
    const r = pool[Math.floor(Math.random() * pool.length)];
    if (!choices.includes(r)) choices.push(r);
  }
  return shuffleArray(choices);
}

export function generateFillRound(
  type: 'fill-upper' | 'fill-lower',
  hiddenLetters: string[],
  pool: string[],
  numChoices = 4,
) {
  const isUpper = type === 'fill-upper';
  const alphabet = isUpper ? ALPHABET_UPPER : ALPHABET_LOWER;

  const missing = hiddenLetters
    .map((c) => alphabet.indexOf(c))
    .filter((idx) => idx !== -1)
    .sort((a, b) => a - b);

  const grid = alphabet.map((char, index) => ({
    char,
    isHidden: missing.includes(index),
  }));

  const correct = alphabet[missing[0]];
  const choices = generateFillChoices(correct, numChoices, pool);

  return {
    grid,
    missingIndices: missing,
    activeIndex: missing[0],
    choices,
  };
}

export type CardTier = 'common' | 'uncommon' | 'rare' | 'ultra-rare' | 'legendary';

export const CARD_DROP_RATES: Array<{ tier: CardTier | null; base: number; max: number }> = [
  { tier: null, base: 90, max: 75 },
  { tier: 'common', base: 5.5, max: 7.0 },
  { tier: 'uncommon', base: 2.7, max: 8.0 },
  { tier: 'rare', base: 1.2, max: 6.0 },
  { tier: 'ultra-rare', base: 0.5, max: 2.5 },
  { tier: 'legendary', base: 0.1, max: 1.5 },
];

export function interpolateRate(base: number, max: number, streak: number): number {
  const t = Math.min(streak, 20) / 20;
  return base + (max - base) * t;
}

export function getDropRate(tier: CardTier, streak: number): number {
  const entry = CARD_DROP_RATES.find((r) => r.tier === tier);
  if (!entry) return 0;
  return interpolateRate(entry.base, entry.max, streak);
}

export function getNoneDropRate(streak: number): number {
  const entry = CARD_DROP_RATES.find((r) => r.tier === null);
  return interpolateRate(entry!.base, entry!.max, streak);
}

export function generateTypingRound(pool: string[] = ALPHABET_UPPER) {
  const isUpper = Math.random() > 0.5;
  const alphabet = isUpper ? ALPHABET_UPPER : ALPHABET_LOWER;

  const poolInCase = pool.map((l) => (isUpper ? l : l.toLowerCase()));
  const missing = poolInCase.map((c) => alphabet.indexOf(c)).filter((idx) => idx !== -1);

  const grid = alphabet.map((char, index) => ({
    char,
    isHidden: missing.includes(index),
    value: '',
  }));

  return {
    grid,
    missingIndices: missing,
    activeIndex: -1,
  };
}
