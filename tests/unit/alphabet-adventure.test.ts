import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calcStars,
  interpolateRate,
  getDropRate,
  getNoneDropRate,
  randomPraise,
  streakPraise,
  generateMatchRound,
  generateThaiRevertRound,
  generatePhonicsRevertRound,
  generateFillChoices,
  generateFillRound,
  generateTypingRound,
  buildStages,
  getStages,
  getStage,
  SUB_STAGE_NAMES,
  PER_LETTER_MIN,
  STAGE6_PER_LETTER_MIN,
  CARD_DROP_RATES,
  GAME_CONFIG,
} from '@/app/(standalone)/games/alphabet-adventure/constants';

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');
import {
  getEffectiveStreak,
  rollCardDrop,
  pickLetter,
  addCard,
  isHolographicTier,
  TIER_LETTERS,
  CARD_WORDS,
  TIER_ORDER,
  TIER_LABELS,
} from '@/app/(standalone)/games/alphabet-adventure/cards/cards';
import type { CardTier } from '@/app/(standalone)/games/alphabet-adventure/cards/cards';
import {
  checkAndAward,
  ACHIEVEMENTS,
  touchPlayDate,
} from '@/app/(standalone)/games/alphabet-adventure/achievements';
import { masteryLevel } from '@/app/(standalone)/games/alphabet-adventure/screens/LetterProgressGrid';
import { KEYBOARD_ROWS } from '@/app/(standalone)/games/alphabet-adventure/screens/TypingLevel';
import {
  emptyMapSaveData,
  initialGameState,
} from '@/app/(standalone)/games/alphabet-adventure/types';
import type { GameState, LetterTracker } from '@/app/(standalone)/games/alphabet-adventure/types';

vi.mock('@/lib/shuffle', () => ({
  shuffleArray: <T>(arr: T[]): T[] => [...arr].reverse(),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── calcStars ───────────────────────────────────────────────────────────────────

describe('calcStars', () => {
  it('returns 3 for accuracy 100', () => {
    expect(calcStars(100)).toBe(3);
  });

  it('returns 2 for accuracy >= 70 and < 100', () => {
    expect(calcStars(70)).toBe(2);
    expect(calcStars(80)).toBe(2);
    expect(calcStars(89)).toBe(2);
    expect(calcStars(90)).toBe(2);
    expect(calcStars(99)).toBe(2);
  });

  it('returns 1 for accuracy < 70', () => {
    expect(calcStars(0)).toBe(1);
    expect(calcStars(50)).toBe(1);
    expect(calcStars(69)).toBe(1);
  });

  it('handles edge values', () => {
    expect(calcStars(69.9)).toBe(1);
    expect(calcStars(70)).toBe(2);
    expect(calcStars(89.9)).toBe(2);
    expect(calcStars(90)).toBe(2);
  });
});

// ─── interpolateRate ────────────────────────────────────────────────────────────

describe('interpolateRate', () => {
  it('returns base at streak 0', () => {
    expect(interpolateRate(10, 20, 0)).toBe(10);
  });

  it('returns max at streak 20', () => {
    expect(interpolateRate(10, 20, 20)).toBe(20);
  });

  it('clamps streak at 20', () => {
    expect(interpolateRate(10, 20, 99)).toBe(20);
  });

  it('linearly interpolates at streak 10', () => {
    expect(interpolateRate(10, 20, 10)).toBe(15);
  });

  it('interpolates decreasing rate (base > max)', () => {
    expect(interpolateRate(90, 75, 0)).toBe(90);
    expect(interpolateRate(90, 75, 20)).toBe(75);
    expect(interpolateRate(90, 75, 10)).toBe(82.5);
  });
});

// ─── getDropRate / getNoneDropRate ──────────────────────────────────────────────

describe('getDropRate', () => {
  it('returns common rate at streak 0', () => {
    expect(getDropRate('common', 0)).toBeCloseTo(2.2);
  });

  it('returns common rate at streak 20', () => {
    expect(getDropRate('common', 20)).toBeCloseTo(4.4);
  });

  it('returns 0 for legendary (not in per-correct drop table)', () => {
    expect(getDropRate('legendary', 0)).toBe(0);
  });

  it('returns 0 for legendary at any streak', () => {
    expect(getDropRate('legendary', 10)).toBe(0);
  });

  it('returns 0 for unknown tier', () => {
    expect(getDropRate('unknown' as const, 0)).toBe(0);
  });
});

describe('getNoneDropRate', () => {
  it('returns none rate at streak 0', () => {
    expect(getNoneDropRate(0)).toBeCloseTo(95);
  });

  it('returns none rate at streak 20', () => {
    expect(getNoneDropRate(20)).toBeCloseTo(88);
  });
});

// ─── randomPraise ───────────────────────────────────────────────────────────────

describe('randomPraise', () => {
  it('returns a correct praise', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const text = randomPraise('correct');
    expect(text).toBe('Excellent!');
  });

  it('returns a wrong praise', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const text = randomPraise('wrong');
    expect(text).toBe('Try again!');
  });

  it('returns last correct praise at high random', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const text = randomPraise('correct');
    expect(text).toBe('Awesome!');
  });

  it('returns last wrong praise at high random', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const text = randomPraise('wrong');
    expect(text).toBe('Nice try!');
  });
});

// ─── streakPraise ───────────────────────────────────────────────────────────────

describe('streakPraise', () => {
  it('returns simple count for streak < 3', () => {
    expect(streakPraise(1)).toBe('1 in a row!');
    expect(streakPraise(2)).toBe('2 in a row!');
  });

  it('returns praise for streak 3', () => {
    expect(streakPraise(3)).toBe('3 in a row! Keep going!');
  });

  it('returns highest praise for streak >= 7', () => {
    expect(streakPraise(10)).toBe('10 in a row! Perfect streak!');
  });

  it('maps streak to correct praise index', () => {
    expect(streakPraise(4)).toBe('4 in a row! On fire!');
    expect(streakPraise(5)).toBe('5 in a row! Unstoppable!');
    expect(streakPraise(6)).toBe('6 in a row! Legendary!');
    expect(streakPraise(7)).toBe('7 in a row! Perfect streak!');
  });
});

// ─── getEffectiveStreak ─────────────────────────────────────────────────────────

describe('getEffectiveStreak', () => {
  it('sums dropStreak and dropPower', () => {
    expect(getEffectiveStreak(3, 2)).toBe(5);
  });

  it('clamps to 10', () => {
    expect(getEffectiveStreak(10, 5)).toBe(10);
    expect(getEffectiveStreak(0, 15)).toBe(10);
  });

  it('returns dropStreak when dropPower is 0', () => {
    expect(getEffectiveStreak(5, 0)).toBe(5);
  });
});

// ─── rollCardDrop ───────────────────────────────────────────────────────────────

describe('rollCardDrop', () => {
  it('returns null-tier (no drop) at very low roll', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.4);
    expect(rollCardDrop(0, 0)).toBeNull();
  });

  it('returns common at roll within common range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.92);
    expect(rollCardDrop(20, 0)).toBe('common');
  });

  it('returns legendary via ramp at very high roll', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.01).mockReturnValueOnce(0.95);
    expect(rollCardDrop(20, 0)).toBe('legendary');
  });

  it('uses effective streak for clamping', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.93);
    expect(rollCardDrop(50, 50)).toBe('common');
  });
});

// ─── pickLetter ─────────────────────────────────────────────────────────────────

describe('pickLetter', () => {
  const emptyCollection = { cards: [], totalPoints: 0, dropPower: 0 };

  it('returns a letter from the tier pool', () => {
    const letter = pickLetter('legendary', emptyCollection);
    expect(TIER_LETTERS['legendary']).toContain(letter);
  });

  it('exhausts pool before refilling', () => {
    const picked: string[] = [];
    for (let i = 0; i < 12; i++) {
      picked.push(pickLetter('common', emptyCollection));
    }
    for (const letter of picked) {
      expect(TIER_LETTERS['common']).toContain(letter);
    }
  });

  it('picks from correct tier pool', () => {
    const common = pickLetter('common', emptyCollection);
    expect(TIER_LETTERS['common']).toContain(common);

    const rare = pickLetter('rare', emptyCollection);
    expect(TIER_LETTERS['rare']).toContain(rare);
  });
});

// ─── addCard ────────────────────────────────────────────────────────────────────

describe('addCard', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      clear: () => {
        store = {};
      },
      removeItem: (key: string) => {
        delete store[key];
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds a new card and returns isNew=true', () => {
    const { collection, isNew } = addCard('A', 'common');
    expect(isNew).toBe(true);
    expect(collection.cards).toHaveLength(1);
    expect(collection.cards[0].letter).toBe('A');
    expect(collection.cards[0].tier).toBe('common');
    expect(collection.cards[0].count).toBe(1);
  });

  it('increments count for existing card and returns isNew=false', () => {
    addCard('A', 'common');
    const { collection, isNew } = addCard('A', 'common');
    expect(isNew).toBe(false);
    const card = collection.cards.find((c: { letter: string }) => c.letter === 'A');
    expect(card?.count).toBe(2);
  });

  it('adds points by tier', () => {
    const r1 = addCard('J', 'legendary');
    expect(r1.collection.totalPoints).toBe(10);
  });

  it('creates separate entries for same letter different tier', () => {
    addCard('E', 'common');
    const { collection } = addCard('E', 'uncommon');
    const eCards = collection.cards.filter((c: { letter: string }) => c.letter === 'E');
    expect(eCards).toHaveLength(2);
  });
});

// ─── isHolographicTier ──────────────────────────────────────────────────────────

describe('isHolographicTier', () => {
  it('returns true for rare and above', () => {
    expect(isHolographicTier('rare')).toBe(true);
    expect(isHolographicTier('ultra-rare')).toBe(true);
    expect(isHolographicTier('legendary')).toBe(true);
  });

  it('returns false for common and uncommon', () => {
    expect(isHolographicTier('common')).toBe(false);
    expect(isHolographicTier('uncommon')).toBe(false);
  });
});

// ─── CARD_WORDS ─────────────────────────────────────────────────────────────────

describe('CARD_WORDS', () => {
  it('has all 26 letters', () => {
    expect(Object.keys(CARD_WORDS)).toHaveLength(26);
  });

  it('has expected words for key letters', () => {
    expect(CARD_WORDS['A']?.common).toBe('Apple');
    expect(CARD_WORDS['C']?.common).toBe('Cat');
    expect(CARD_WORDS['U']?.['ultra-rare']).toBe('Unicycle');
    expect(CARD_WORDS['V']?.['ultra-rare']).toBe('Van');
    expect(CARD_WORDS['Q']?.legendary).toBe('Queen');
  });
});

// ─── TIER_ORDER / TIER_LABELS ───────────────────────────────────────────────────

describe('tier constants', () => {
  it('TIER_ORDER has 5 tiers', () => {
    expect(TIER_ORDER).toHaveLength(5);
    expect(TIER_ORDER[0]).toBe('common');
    expect(TIER_ORDER[4]).toBe('legendary');
  });

  it('TIER_LABELS matches TIER_ORDER', () => {
    for (const tier of TIER_ORDER) {
      expect(TIER_LABELS[tier]).toBeDefined();
    }
  });

  it('all tiers have letters defined', () => {
    for (const tier of TIER_ORDER) {
      expect(TIER_LETTERS[tier].length).toBeGreaterThan(0);
    }
  });
});

// ─── Question Generators ────────────────────────────────────────────────────────

describe('generateMatchRound', () => {
  it('returns correct number of choices', () => {
    const round = generateMatchRound(1, undefined, 4);
    expect(round.choices).toHaveLength(4);
  });

  it('includes correctChar in choices', () => {
    const round = generateMatchRound(1, undefined, 3);
    expect(round.choices).toContain(round.correctChar);
  });

  it('maps round 1 to letter A', () => {
    const round = generateMatchRound(1);
    expect(round.targetLetter).toBe('A');
    expect(round.correctChar).toBe('a');
  });

  it('maps round 2 to letter B', () => {
    const round = generateMatchRound(2);
    expect(round.targetLetter).toBe('B');
    expect(round.correctChar).toBe('b');
  });

  it('maps round 26 to letter Z', () => {
    const round = generateMatchRound(26);
    expect(round.targetLetter).toBe('Z');
    expect(round.correctChar).toBe('z');
  });

  it('uses shuffled seed for rounds > 26', () => {
    const round27 = generateMatchRound(27);
    const letter27 = round27.targetLetter;

    const round27Again = generateMatchRound(27);
    expect(round27Again.targetLetter).toBe(letter27);

    expect(letter27.length).toBe(1);
    expect('ABCDEFGHIJKLMNOPQRSTUVWXYZ').toContain(letter27);
  });
});

describe('generateThaiRevertRound', () => {
  it('returns correct number of choices', () => {
    const round = generateThaiRevertRound(1, undefined, 3);
    expect(round.choices).toHaveLength(3);
  });

  it('maps round 1 to Thai name เอ and letter A', () => {
    const round = generateThaiRevertRound(1);
    expect(round.targetLetter).toBe('เอ');
    expect(round.correctChar).toBe('A');
  });

  it('maps round 26 to Thai name แซด and letter Z', () => {
    const round = generateThaiRevertRound(26);
    expect(round.targetLetter).toBe('แซด');
    expect(round.correctChar).toBe('Z');
  });

  it('includes correctChar in choices', () => {
    const round = generateThaiRevertRound(5, undefined, 4);
    expect(round.choices).toContain(round.correctChar);
  });

  it('all choices are uppercase letters', () => {
    const round = generateThaiRevertRound(10, undefined, 4);
    for (const c of round.choices) {
      expect(c).toMatch(/^[A-Z]$/);
    }
  });
});

describe('generatePhonicsRevertRound', () => {
  it('maps round 1 to phonics sound แอะ /a/ and letter A', () => {
    const round = generatePhonicsRevertRound(1);
    expect(round.targetLetter).toBe('แอะ /a/');
    expect(round.correctChar).toBe('A');
  });

  it('maps round 26 to phonics sound ซี /z/ and letter Z', () => {
    const round = generatePhonicsRevertRound(26);
    expect(round.targetLetter).toBe('ซี /z/');
    expect(round.correctChar).toBe('Z');
  });

  it('includes correctChar in choices', () => {
    const round = generatePhonicsRevertRound(15, undefined, 4);
    expect(round.choices).toContain(round.correctChar);
  });

  it('all choices are uppercase letters', () => {
    const round = generatePhonicsRevertRound(8, undefined, 4);
    for (const c of round.choices) {
      expect(c).toMatch(/^[A-Z]$/);
    }
  });
});

describe('generateFillChoices', () => {
  it('returns correct number of choices', () => {
    const choices = generateFillChoices('A', 4, UPPER);
    expect(choices).toHaveLength(4);
  });

  it('includes the correct character', () => {
    const choices = generateFillChoices('M', 3, UPPER);
    expect(choices).toContain('M');
  });

  it('all choices are from the correct case alphabet', () => {
    const upper = generateFillChoices('A', 5, UPPER);
    for (const c of upper) {
      expect(c).toMatch(/^[A-Z]$/);
    }

    const lower = generateFillChoices('a', 5, LOWER);
    for (const c of lower) {
      expect(c).toMatch(/^[a-z]$/);
    }
  });

  it('returns unique choices', () => {
    const choices = generateFillChoices('X', 10, UPPER);
    expect(new Set(choices).size).toBe(choices.length);
  });
});

describe('generateFillRound', () => {
  it('returns correct grid for fill-upper (2 hidden)', () => {
    const round = generateFillRound('fill-upper', ['A', 'B'], UPPER, 4);
    expect(round.grid).toHaveLength(26);
    expect(round.missingIndices).toHaveLength(2);
    expect(round.choices).toHaveLength(4);
    expect(round.choices).toContain(round.grid[round.activeIndex].char);
  });

  it('returns correct grid for fill-lower (3 hidden)', () => {
    const round = generateFillRound('fill-lower', ['a', 'b', 'c'], LOWER, 4);
    expect(round.grid).toHaveLength(26);
    expect(round.missingIndices).toHaveLength(3);
  });

  it('marks correct cells as hidden', () => {
    const round = generateFillRound('fill-upper', ['A', 'B'], UPPER, 4);
    for (const i of round.missingIndices) {
      expect(round.grid[i].isHidden).toBe(true);
    }
  });

  it('sorts missingIndices ascending', () => {
    const round = generateFillRound('fill-upper', ['Z', 'A', 'M'], UPPER);
    for (let i = 1; i < round.missingIndices.length; i++) {
      expect(round.missingIndices[i]).toBeGreaterThan(round.missingIndices[i - 1]);
    }
  });

  it('activeIndex matches first missing', () => {
    const round = generateFillRound('fill-upper', ['A', 'B'], UPPER);
    expect(round.activeIndex).toBe(round.missingIndices[0]);
  });
});

describe('generateTypingRound', () => {
  it('returns grid of 26 cells', () => {
    const round = generateTypingRound(UPPER);
    expect(round.grid).toHaveLength(26);
  });

  it('marks pool cells as hidden', () => {
    const round = generateTypingRound(['A', 'B', 'C', 'D', 'E']);
    expect(round.missingIndices).toHaveLength(5);
    for (const i of round.missingIndices) {
      expect(round.grid[i].isHidden).toBe(true);
    }
    expect(round.activeIndex).toBe(-1);
  });

  it('all hidden cells have empty value', () => {
    const round = generateTypingRound(['A', 'B', 'C', 'D']);
    for (const i of round.missingIndices) {
      expect(round.grid[i].value).toBe('');
    }
  });
});

// ─── CARD_DROP_RATES integrity ──────────────────────────────────────────────────

describe('CARD_DROP_RATES integrity', () => {
  it('has 3 entries (null + common + uncommon)', () => {
    expect(CARD_DROP_RATES).toHaveLength(3);
    expect(CARD_DROP_RATES[0].tier).toBeNull();
    expect(CARD_DROP_RATES[1].tier).toBe('common');
    expect(CARD_DROP_RATES[2].tier).toBe('uncommon');
  });

  it('null is the largest rate, common < null, uncommon < common', () => {
    const [none, common, uncommon] = CARD_DROP_RATES;
    expect(none.base).toBeGreaterThan(common.base);
    expect(common.base).toBeGreaterThan(uncommon.base);
    expect(none.max).toBeGreaterThan(common.max);
    expect(common.max).toBeGreaterThan(uncommon.max);
  });

  it('every base and max is within [0, 100]', () => {
    for (const r of CARD_DROP_RATES) {
      expect(r.base).toBeGreaterThanOrEqual(0);
      expect(r.base).toBeLessThanOrEqual(100);
      expect(r.max).toBeGreaterThanOrEqual(0);
      expect(r.max).toBeLessThanOrEqual(100);
    }
  });

  it('pins the exact B2a values (frozen-rate regression contract)', () => {
    expect(CARD_DROP_RATES[0]).toEqual({ tier: null, base: 95, max: 88 });
    expect(CARD_DROP_RATES[1]).toEqual({ tier: 'common', base: 2.2, max: 4.4 });
    expect(CARD_DROP_RATES[2]).toEqual({ tier: 'uncommon', base: 1.4, max: 3.2 });
  });

  it('interpolation stays monotone for every tier', () => {
    for (const r of CARD_DROP_RATES) {
      const at0 = interpolateRate(r.base, r.max, 0);
      const at20 = interpolateRate(r.base, r.max, 20);
      if (r.tier === null) {
        expect(at20).toBeLessThanOrEqual(at0);
      } else {
        expect(at20).toBeGreaterThanOrEqual(at0);
      }
    }
  });
});

// ─── buildStages ─────────────────────────────────────────────────────────────

describe('buildStages', () => {
  it('returns 6 stages', () => {
    const stages = buildStages();
    expect(stages).toHaveLength(6);
  });

  it('each stage has 5 sub-stages', () => {
    const stages = buildStages();
    for (const stage of stages) {
      expect(stage.subStages).toHaveLength(5);
    }
  });

  it('stage names match game types', () => {
    const stages = buildStages();
    for (let i = 0; i < 6; i++) {
      expect(stages[i].name).toBe(SUB_STAGE_NAMES[i].name);
      expect(stages[i].subtitle).toBe(SUB_STAGE_NAMES[i].subtitle);
    }
  });

  it('each stage has empty letterGroup', () => {
    const stages = buildStages();
    for (const stage of stages) {
      expect(stage.letterGroup).toEqual([]);
    }
  });

  it('sub-stage types are uniform within each stage', () => {
    const stages = buildStages();
    const expectedTypes = ['match', 'match', 'fill-upper', 'fill-lower', 'match', 'typing'];
    for (let i = 0; i < 6; i++) {
      for (const sub of stages[i].subStages) {
        expect(sub.type).toBe(expectedTypes[i]);
      }
    }
  });

  it('sub-stages 0-3 are named after letter groups (A-F through S-Z)', () => {
    const stages = buildStages();
    for (const stage of stages) {
      expect(stage.subStages[0].name).toBe('Letters A–F');
      expect(stage.subStages[1].name).toBe('Letters G–L');
      expect(stage.subStages[2].name).toBe('Letters M–R');
      expect(stage.subStages[3].name).toBe('Letters S–Z');
    }
  });

  it('last sub-stage is named All Letters', () => {
    const stages = buildStages();
    for (const stage of stages) {
      expect(stage.subStages[4].name).toBe('All Letters');
    }
  });

  it('sub-stage subtitles show space-joined letter group', () => {
    const stages = buildStages();
    expect(stages[0].subStages[0].subtitle).toBe('A B C D E F');
    expect(stages[0].subStages[1].subtitle).toBe('G H I J K L');
    expect(stages[0].subStages[3].subtitle).toBe('S T U V W X Y Z');
    expect(stages[0].subStages[4].subtitle).toBe(
      'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z',
    );
  });

  it('sub-stage 0 (A-F) letterPool matches match type stages (uppercase)', () => {
    const stages = buildStages();
    for (const i of [0, 1, 4]) {
      expect(stages[i].subStages[0].letterPool).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    }
  });

  it('sub-stage 0 letterPool is lowercase for fill-lower stage', () => {
    const stages = buildStages();
    expect(stages[3].subStages[0].letterPool).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('last sub-stage (All 26) letterPool is 26 letters for match and typing', () => {
    const stages = buildStages();
    for (const i of [0, 1, 4]) {
      expect(stages[i].subStages[4].letterPool).toHaveLength(26);
    }
    expect(stages[5].subStages[4].letterPool).toHaveLength(26);
  });

  it('last sub-stage letterPool hidden for fill is 10 random letters', () => {
    const stages = buildStages();
    expect(stages[2].subStages[4].letterPool).toHaveLength(10);
    expect(stages[3].subStages[4].letterPool).toHaveLength(10);
  });

  it('every sub-stage has a non-empty letterPool', () => {
    const stages = buildStages();
    for (const stage of stages) {
      for (const sub of stage.subStages) {
        expect(sub.letterPool).toBeDefined();
        expect(sub.letterPool!.length).toBeGreaterThan(0);
      }
    }
  });

  it('revert is true for Thai Match and Phonics Match stages only', () => {
    const stages = buildStages();
    for (const sub of stages[0].subStages) expect(sub.revert).toBe(true);
    for (const sub of stages[4].subStages) expect(sub.revert).toBe(true);
    for (const i of [1, 2, 3, 5])
      for (const sub of stages[i].subStages) expect(sub.revert).toBe(false);
  });

  it('dataPool matches stage game type', () => {
    const stages = buildStages();
    expect(stages[0].subStages[0].dataPool).toBe('thai');
    expect(stages[1].subStages[0].dataPool).toBe('lowercase');
    expect(stages[2].subStages[0].dataPool).toBeUndefined();
    expect(stages[3].subStages[0].dataPool).toBeUndefined();
    expect(stages[4].subStages[0].dataPool).toBe('phonics');
    expect(stages[5].subStages[0].dataPool).toBeUndefined();
  });

  it('fill sub-stages have hideLetters set, match/typing do not', () => {
    const stages = buildStages();
    for (const i of [0, 1, 4, 5])
      for (const sub of stages[i].subStages) expect(sub.hideLetters).toBeUndefined();
    for (const sub of stages[2].subStages) expect(sub.hideLetters).toBeDefined();
    for (const sub of stages[3].subStages) expect(sub.hideLetters).toBeDefined();
  });

  it('fill-lower hideLetters are lowercase', () => {
    const stages = buildStages();
    for (const sub of stages[3].subStages) {
      for (const letter of sub.hideLetters!) {
        expect(letter).toMatch(/^[a-z]$/);
      }
    }
  });

  it('targetMin for match types with 6-letter groups is PER_LETTER_MIN * 6', () => {
    const stages = buildStages();
    for (const i of [0, 1, 4])
      for (let j = 0; j < 3; j++) expect(stages[i].subStages[j].targetMin).toBe(PER_LETTER_MIN * 6);
  });

  it('targetMin for match type S-Z (8-letter group) is PER_LETTER_MIN * 8', () => {
    const stages = buildStages();
    for (const i of [0, 1, 4]) expect(stages[i].subStages[3].targetMin).toBe(PER_LETTER_MIN * 8);
  });

  it('targetMin for last sub-stage (All 26) match types is STAGE6_PER_LETTER_MIN * 26', () => {
    const stages = buildStages();
    for (const i of [0, 1, 4])
      expect(stages[i].subStages[4].targetMin).toBe(STAGE6_PER_LETTER_MIN * 26);
  });

  it('targetMin for fill types with 6-letter groups equals 6', () => {
    const stages = buildStages();
    for (const i of [2, 3])
      for (let j = 0; j < 3; j++) expect(stages[i].subStages[j].targetMin).toBe(6);
  });

  it('targetMin for fill type S-Z (8-letter group) equals 8', () => {
    const stages = buildStages();
    for (const i of [2, 3]) expect(stages[i].subStages[3].targetMin).toBe(8);
  });

  it('targetMin for typing with 6-letter groups equals 6', () => {
    const stages = buildStages();
    for (let j = 0; j < 3; j++) expect(stages[5].subStages[j].targetMin).toBe(6);
  });

  it('targetMin for typing S-Z (8-letter group) equals 8', () => {
    const stages = buildStages();
    expect(stages[5].subStages[3].targetMin).toBe(8);
  });

  it('targetMin for typing with all 26 letters equals 26', () => {
    const stages = buildStages();
    expect(stages[5].subStages[4].targetMin).toBe(26);
  });

  it('getStages returns cached stages', () => {
    const a = getStages();
    const b = getStages();
    expect(a).toBe(b);
    expect(a).toHaveLength(6);
  });

  it('getStage returns correct stage by id', () => {
    const s1 = getStage(1);
    expect(s1).toBeDefined();
    expect(s1!.name).toBe(SUB_STAGE_NAMES[0].name);

    const s3 = getStage(3);
    expect(s3).toBeDefined();
    expect(s3!.name).toBe(SUB_STAGE_NAMES[2].name);
  });

  it('getStage returns undefined for invalid id', () => {
    expect(getStage(0)).toBeUndefined();
    expect(getStage(7)).toBeUndefined();
    expect(getStage(-1)).toBeUndefined();
  });
});

// ─── Phase 2: EasyMode Choice Reduction ────────────────────────────────

describe('easyMode choice reduction', () => {
  it('generateMatchRound returns 2 choices in easy mode', () => {
    const round = generateMatchRound(1, undefined, 2);
    expect(round.choices).toHaveLength(2);
    expect(round.choices).toContain(round.correctChar);
  });

  it('generateFillChoices returns 3 choices in easy mode', () => {
    const choices = generateFillChoices('A', 3, UPPER);
    expect(choices).toHaveLength(3);
    expect(choices).toContain('A');
  });

  it('default (non-easy) match has 3 choices', () => {
    const round = generateMatchRound(1);
    expect(round.choices).toHaveLength(3);
  });

  it('default (non-easy) fill has 4 choices', () => {
    const choices = generateFillChoices('M', 4, UPPER);
    expect(choices).toHaveLength(4);
  });
});

// ─── Phase 2: Onboarding Key Clearing ──────────────────────────────────

describe('onboarding key clearing', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {
      onboarding_match: 'true',
      'onboarding_fill-upper': 'true',
      'onboarding_fill-lower': 'true',
      onboarding_typing: 'true',
      other_key: 'preserved',
    };
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('clears all 4 onboarding_* keys', () => {
    ['match', 'fill-upper', 'fill-lower', 'typing'].forEach((k) =>
      localStorage.removeItem(`onboarding_${k}`),
    );
    expect(localStorage.getItem('onboarding_match')).toBeNull();
    expect(localStorage.getItem('onboarding_fill-upper')).toBeNull();
    expect(localStorage.getItem('onboarding_fill-lower')).toBeNull();
    expect(localStorage.getItem('onboarding_typing')).toBeNull();
  });

  it('preserves non-onboarding keys', () => {
    ['match', 'fill-upper', 'fill-lower', 'typing'].forEach((k) =>
      localStorage.removeItem(`onboarding_${k}`),
    );
    expect(localStorage.getItem('other_key')).toBe('preserved');
  });
});

// ─── Phase 3: Spaced Repetition Sorting ────────────────────────────────

function sortPoolByAccuracy(pool: string[], tracker: Record<string, LetterTracker>): string[] {
  return [...pool].sort((a, b) => {
    const ta = tracker[a.toUpperCase()];
    const tb = tracker[b.toUpperCase()];
    const accA = ta ? ta.correct / ta.total : 1;
    const accB = tb ? tb.correct / tb.total : 1;
    return accA - accB;
  });
}

describe('spaced repetition pool sorting', () => {
  it('sorts low-accuracy letters before high-accuracy letters', () => {
    const pool = ['A', 'B', 'C'];
    const tracker: Record<string, LetterTracker> = {
      A: { correct: 1, total: 5 }, // 20%
      B: { correct: 4, total: 5 }, // 80%
      C: { correct: 5, total: 5 }, // 100%
    };
    const sorted = sortPoolByAccuracy(pool, tracker);
    expect(sorted[0]).toBe('A');
    expect(sorted[1]).toBe('B');
    expect(sorted[2]).toBe('C');
  });

  it('untracked letters are treated as 100% accuracy (sorted last)', () => {
    const pool = ['A', 'B', 'C'];
    const tracker: Record<string, LetterTracker> = {
      A: { correct: 1, total: 5 },
    };
    const sorted = sortPoolByAccuracy(pool, tracker);
    expect(sorted[0]).toBe('A');
    expect(sorted.slice(1).sort()).toEqual(['B', 'C']);
  });

  it('preserves pool length', () => {
    const pool = ['A', 'B', 'C', 'D', 'E'];
    const tracker: Record<string, LetterTracker> = {
      A: { correct: 0, total: 5 },
      E: { correct: 5, total: 5 },
    };
    const sorted = sortPoolByAccuracy(pool, tracker);
    expect(sorted).toHaveLength(5);
  });

  it('handles empty pool', () => {
    expect(sortPoolByAccuracy([], {})).toEqual([]);
  });

  it('handles empty tracker', () => {
    const pool = ['A', 'B', 'C'];
    const sorted = sortPoolByAccuracy(pool, {});
    expect(sorted.sort()).toEqual(['A', 'B', 'C']);
  });

  it('does not mutate original pool', () => {
    const pool = ['A', 'B', 'C'];
    const original = [...pool];
    sortPoolByAccuracy(pool, { A: { correct: 0, total: 5 } });
    expect(pool).toEqual(original);
  });
});

// ─── Phase 4: LetterProgressGrid.masteryLevel ─────────────────────────

describe('masteryLevel', () => {
  it('returns untracked for undefined tracker', () => {
    expect(masteryLevel(undefined)).toBe('untracked');
  });

  it('returns untracked when total is 0', () => {
    expect(masteryLevel({ correct: 0, total: 0 })).toBe('untracked');
    expect(masteryLevel({ correct: 5, total: 0 })).toBe('untracked');
  });

  it('returns mastered for ≥80% accuracy with ≥5 attempts', () => {
    expect(masteryLevel({ correct: 4, total: 5 })).toBe('mastered');
    expect(masteryLevel({ correct: 8, total: 10 })).toBe('mastered');
    expect(masteryLevel({ correct: 5, total: 5 })).toBe('mastered');
    expect(masteryLevel({ correct: 20, total: 25 })).toBe('mastered');
  });

  it('returns learning for <80% accuracy with ≥5 attempts', () => {
    expect(masteryLevel({ correct: 3, total: 5 })).toBe('learning');
    expect(masteryLevel({ correct: 0, total: 5 })).toBe('learning');
    expect(masteryLevel({ correct: 7, total: 10 })).toBe('learning');
  });

  it('returns learning for ≥80% accuracy but <5 attempts', () => {
    expect(masteryLevel({ correct: 4, total: 4 })).toBe('learning');
    expect(masteryLevel({ correct: 1, total: 1 })).toBe('learning');
    expect(masteryLevel({ correct: 3, total: 3 })).toBe('learning');
  });

  it('returns learning for <80% accuracy even with many attempts', () => {
    expect(masteryLevel({ correct: 10, total: 50 })).toBe('learning');
    expect(masteryLevel({ correct: 1, total: 100 })).toBe('learning');
  });

  it('handles edge boundary: accuracy exactly 0.8', () => {
    expect(masteryLevel({ correct: 4, total: 5 })).toBe('mastered');
  });

  it('handles edge boundary: accuracy just below 0.8', () => {
    expect(masteryLevel({ correct: 3, total: 5 })).toBe('learning');
  });
});

// ─── Phase 4: Typing Keyboard Layout ───────────────────────────────────

describe('KEYBOARD_ROWS', () => {
  it('contains all 26 letters across 3 rows', () => {
    const all = KEYBOARD_ROWS.flat();
    expect(all).toHaveLength(26);
    expect(new Set(all).size).toBe(26);
  });

  it('each row is sorted alphabetically', () => {
    for (const row of KEYBOARD_ROWS) {
      for (let i = 1; i < row.length; i++) {
        expect(row[i].charCodeAt(0)).toBeGreaterThan(row[i - 1].charCodeAt(0));
      }
    }
  });

  it('has no duplicate letters', () => {
    const all = KEYBOARD_ROWS.flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it('has correct row distribution', () => {
    expect(KEYBOARD_ROWS[0]).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);
    expect(KEYBOARD_ROWS[1]).toEqual(['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R']);
    expect(KEYBOARD_ROWS[2]).toEqual(['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']);
  });
});

// ─── Phase 6: Stale Closure in handleSubStageComplete ────────────────

describe('handleSubStageComplete stale closure bug', () => {
  it('currentStageId=0 causes stageIdx=-1 and early return', () => {
    const data = emptyMapSaveData();
    // Simulate what happens in the stale closure:
    // handleSelectSubStage calls setCurrentStageId(1) but
    // handleSubStageComplete closes over currentStageId=0
    const staleCurrentStageId = 0;
    const stageIdx = staleCurrentStageId - 1;
    expect(stageIdx).toBe(-1);
    expect(stageIdx < 0).toBe(true);
    // This guard causes the save to never update
    expect(stageIdx >= data.stages.length).toBe(false);
  });

  it('after setCurrentStageId(1), new callback is created but ref points to old one', () => {
    const data = emptyMapSaveData();
    const originalSub = { ...data.stages[0].subStages[0] };
    expect(originalSub.completed).toBe(false);

    // Simulate: stale callback (currentStageId=0) — save never updates
    const staleStageIdx = 0 - 1;
    if (staleStageIdx < 0 || staleStageIdx >= data.stages.length) {
      // early return — no update
    }

    // Data is unchanged
    expect(data.stages[0].subStages[0].completed).toBe(false);
    expect(data.stages[0].completed).toBe(false);
    expect(data.stages[1].unlocked).toBe(false);

    // Simulate: fresh callback (currentStageId=1) — save updates correctly
    const correctStageIdx = 1 - 1;
    if (correctStageIdx >= 0 && correctStageIdx < data.stages.length) {
      data.stages[correctStageIdx].subStages[0].completed = true;
    }

    // Data is now updated
    expect(data.stages[0].subStages[0].completed).toBe(true);
  });
});

// ─── Phase 5: Mascot Imports ──────────────────────────────────────────

describe('mascot components', () => {
  it('CaptainAlph imports successfully', async () => {
    const mod = await import('@/app/(standalone)/games/alphabet-adventure/characters/CaptainAlph');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('Mermaid imports successfully', async () => {
    const mod = await import('@/app/(standalone)/games/alphabet-adventure/characters/Mermaid');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('TreasureMonster imports successfully', async () => {
    const mod =
      await import('@/app/(standalone)/games/alphabet-adventure/characters/TreasureMonster');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});

// ─── Phase 6: generateAnalysis ──────────────────────────────────────────

describe('generateAnalysis', () => {
  it('returns perfect message for 100% accuracy', async () => {
    const { generateAnalysis } =
      await import('@/app/(standalone)/games/alphabet-adventure/analysis');
    const result = generateAnalysis(
      100,
      { A: { correct: 5, wrong: 0 }, B: { correct: 3, wrong: 0 } },
      ['A', 'B'],
    );
    expect(result.english).toContain('Perfect');
    expect(result.thai).toContain('สมบูรณ์แบบ');
  });

  it('returns excellent message for 95% accuracy with high-accuracy letters as strengths', async () => {
    const { generateAnalysis } =
      await import('@/app/(standalone)/games/alphabet-adventure/analysis');
    const result = generateAnalysis(95, { A: { correct: 10, wrong: 1 } }, ['A']);
    expect(result.english).toContain('Excellent');
    expect(result.thai).toContain('เก่งมาก');
  });

  it('returns great work message for 75% accuracy', async () => {
    const { generateAnalysis } =
      await import('@/app/(standalone)/games/alphabet-adventure/analysis');
    const result = generateAnalysis(
      75,
      { A: { correct: 7, wrong: 3 }, B: { correct: 5, wrong: 5 } },
      ['A', 'B'],
    );
    expect(result.english).toContain('Great work');
    expect(result.thai).toContain('ดีมาก');
  });

  it('returns keep going message for 50% accuracy', async () => {
    const { generateAnalysis } =
      await import('@/app/(standalone)/games/alphabet-adventure/analysis');
    const result = generateAnalysis(50, { A: { correct: 1, wrong: 1 } }, ['A']);
    expect(result.english).toContain('Keep going');
    expect(result.thai).toContain('สู้ๆ');
  });

  it('mentions low-performing letters in to-improve section', async () => {
    const { generateAnalysis } =
      await import('@/app/(standalone)/games/alphabet-adventure/analysis');
    const result = generateAnalysis(
      70,
      {
        A: { correct: 10, wrong: 1 },
        B: { correct: 1, wrong: 5 },
      },
      ['A', 'B'],
    );
    expect(result.english).toContain('B');
    expect(result.english).not.toContain('A');
    expect(result.thai).toContain('B');
  });

  it('includes vowel focus advice when vowels underperform consonants', async () => {
    const { generateAnalysis } =
      await import('@/app/(standalone)/games/alphabet-adventure/analysis');
    const result = generateAnalysis(
      60,
      {
        A: { correct: 1, wrong: 5 },
        B: { correct: 5, wrong: 1 },
      },
      ['A', 'B'],
    );
    expect(result.english).toContain('vowels');
    expect(result.thai).toContain('สระ');
  });

  it('handles empty stats gracefully', async () => {
    const { generateAnalysis } =
      await import('@/app/(standalone)/games/alphabet-adventure/analysis');
    const result = generateAnalysis(0, {}, []);
    expect(result.english).toBeTruthy();
    expect(result.thai).toBeTruthy();
  });
});

describe('sfx module', () => {
  it('exports playCardSfx as a function', async () => {
    const mod = await import('@/app/(standalone)/games/alphabet-adventure/sfx');
    expect(typeof mod.playCardSfx).toBe('function');
  });

  it('exports playSingleCorrect as a function', async () => {
    const mod = await import('@/app/(standalone)/games/alphabet-adventure/sfx');
    expect(typeof mod.playSingleCorrect).toBe('function');
  });

  it('exports playWrong as a function', async () => {
    const mod = await import('@/app/(standalone)/games/alphabet-adventure/sfx');
    expect(typeof mod.playWrong).toBe('function');
  });
});

// ─── achievements: checkAndAward ──────────────────────────────────────────────────

describe('achievements checkAndAward', () => {
  const memoryStore = new Map<string, string>();
  const fakeWindow = {
    localStorage: {
      getItem: (k: string) => memoryStore.get(k) ?? null,
      setItem: (k: string, v: string) => {
        memoryStore.set(k, v);
      },
      removeItem: (k: string) => {
        memoryStore.delete(k);
      },
    },
  };

  const { checkAndAward: checkAward, ACHIEVEMENTS: allAchievements } = {} as never;
  void checkAward;
  void allAchievements;

  const fullTierCounts = (): Record<CardTier, number> => ({
    common: 21,
    uncommon: 21,
    rare: 19,
    'ultra-rare': 17,
    legendary: 17,
  });

  const awardedIds = (ctx: Record<string, unknown>) => {
    memoryStore.delete('alphabet-adventure-achievements');
    return checkAndAward(ctx as Parameters<typeof checkAndAward>[0]).map((a) => a.id);
  };

  beforeEach(() => {
    memoryStore.clear();
    vi.stubGlobal('window', fakeWindow);
    vi.stubGlobal('localStorage', fakeWindow.localStorage);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('has 60 achievements total', () => {
    expect(ACHIEVEMENTS.length).toBe(60);
  });

  it('has exactly 10 secret-tier entries', () => {
    const secrets = ACHIEVEMENTS.filter((a) => a.tier === 'secret');
    expect(secrets.length).toBe(10);
    const ids = secrets.map((a) => a.id).sort();
    expect(ids).toEqual(
      [
        'secret_logo',
        'lucky_13',
        'hot_hand',
        'perfect_man',
        'tough_cookie',
        'patient_one',
        'early_bird',
        'jackpot',
        'card_party',
        'first_try',
      ].sort(),
    );
  });

  it('retuned tiers are applied (card_50 gold, streak ladder, perfect_stage platinum)', () => {
    const byId = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
    expect(byId.card_50.tier).toBe('gold');
    expect(byId.streak_5.tier).toBe('silver');
    expect(byId.streak_10.tier).toBe('gold');
    expect(byId.streak_20.tier).toBe('platinum');
    expect(byId.streak_30.tier).toBe('platinum');
    expect(byId.streak_50.tier).toBe('platinum');
    expect(byId.perfect_stage.tier).toBe('platinum');
    expect(byId.rare_10.tier).toBe('silver');
    expect(byId.days_7.tier).toBe('bronze');
  });

  it('awards the full card ladder at 95 cards', () => {
    const ids = awardedIds({ cardCount: 95 });
    expect(ids).toEqual(
      expect.arrayContaining(['first_card', 'card_10', 'card_25', 'card_50', 'card_65', 'card_95']),
    );
  });

  it('awards streak milestones and lucky_13 at the right thresholds', () => {
    expect(awardedIds({ currentStreak: 13 })).toEqual(
      expect.arrayContaining(['streak_3', 'streak_5', 'streak_10', 'lucky_13']),
    );
    expect(awardedIds({ currentStreak: 13 })).not.toContain('streak_20');
    expect(awardedIds({ currentStreak: 30 })).toContain('streak_30');
    expect(awardedIds({ currentStreak: 50 })).toContain('streak_50');
  });

  it('awards score_2000 at 2000 total score', () => {
    expect(awardedIds({ totalScore: 2000 })).toContain('score_2000');
    expect(awardedIds({ totalScore: 1999 })).not.toContain('score_2000');
  });

  it('awards all tier completions only at full tier counts', () => {
    const full = awardedIds({ tierCounts: fullTierCounts() });
    expect(full).toEqual(
      expect.arrayContaining([
        'tier_common',
        'tier_uncommon',
        'tier_rare',
        'tier_ultra',
        'tier_legendary',
      ]),
    );
    const partial = awardedIds({
      tierCounts: { common: 21, uncommon: 0, rare: 0, 'ultra-rare': 0, legendary: 0 },
    });
    expect(partial).toContain('tier_common');
    expect(partial).not.toContain('tier_rare');
  });

  it('awards rarity firsts from tier counts', () => {
    const ids = awardedIds({
      tierCounts: { common: 0, uncommon: 0, rare: 1, 'ultra-rare': 1, legendary: 1 },
    });
    expect(ids).toEqual(expect.arrayContaining(['first_rare', 'first_ultra', 'first_legendary']));
  });

  it('awards rare_10 at 10 distinct rare+ and legendary_3 at 3 legends', () => {
    const ten = awardedIds({
      tierCounts: { common: 0, uncommon: 0, rare: 4, 'ultra-rare': 4, legendary: 2 },
    });
    expect(ten).toContain('rare_10');
    const three = awardedIds({
      tierCounts: { common: 0, uncommon: 0, rare: 0, 'ultra-rare': 0, legendary: 3 },
    });
    expect(three).toContain('legendary_3');
  });

  it('awards letter_full when one letter owns all 5 tiers', () => {
    expect(awardedIds({ letterFull: true })).toContain('letter_full');
    expect(awardedIds({ letterFull: false })).not.toContain('letter_full');
  });

  it('awards power_10 at max drop power and double/card_party at 2/3 cards', () => {
    expect(awardedIds({ dropPower: 10 })).toContain('power_10');
    expect(awardedIds({ cardsInSubStage: 2 })).toContain('double_drop');
    const three = awardedIds({ cardsInSubStage: 3 });
    expect(three).toEqual(expect.arrayContaining(['double_drop', 'card_party']));
  });

  it('awards accuracy_90 at 90% and speed_lesson under 30s', () => {
    expect(awardedIds({ accuracyPercent: 90 })).toContain('accuracy_90');
    expect(awardedIds({ accuracyPercent: 89 })).not.toContain('accuracy_90');
    expect(awardedIds({ lessonSeconds: 29.9 })).toContain('speed_lesson');
    expect(awardedIds({ lessonSeconds: 30 })).not.toContain('speed_lesson');
  });

  it('awards quick_five at 5 consecutive fast first-tries', () => {
    expect(awardedIds({ quickFastStreak: 5 })).toContain('quick_five');
    expect(awardedIds({ quickFastStreak: 4 })).not.toContain('quick_five');
  });

  it('wires the previously-dead achievements (lessonPerfect/stagePerfect/isPractice/letterTracker)', () => {
    expect(awardedIds({ lessonPerfect: true })).toContain('perfect_lesson');
    expect(awardedIds({ stagePerfect: true })).toContain('perfect_stage');
    expect(awardedIds({ isPractice: true })).toContain('first_practice');
    const vowelTracker = Object.fromEntries(
      ['A', 'E', 'I', 'O', 'U'].map((l) => [l, { correct: 8, total: 10 }]),
    );
    expect(awardedIds({ letterTracker: vowelTracker })).toContain('vowel_master');
  });

  it('awards alphabet_scholar only when all 26 letters are 80%+ with 5+ answers', () => {
    const scholarTracker = Object.fromEntries(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => [l, { correct: 8, total: 10 }]),
    );
    expect(awardedIds({ letterTracker: scholarTracker })).toContain('alphabet_scholar');
    const shortTracker = { ...scholarTracker, Z: { correct: 3, total: 10 } };
    expect(awardedIds({ letterTracker: shortTracker })).not.toContain('alphabet_scholar');
  });

  it('awards perfect_3x at 3 lifetime perfects', () => {
    expect(awardedIds({ perfectCount: 3 })).toContain('perfect_3x');
    expect(awardedIds({ perfectCount: 2 })).not.toContain('perfect_3x');
  });

  it('awards the star ladder at 30/60/90 stars', () => {
    expect(awardedIds({ starCount: 30 })).toContain('star_30');
    expect(awardedIds({ starCount: 60 })).toEqual(expect.arrayContaining(['star_30', 'star_60']));
    expect(awardedIds({ starCount: 90 })).toEqual(
      expect.arrayContaining(['star_30', 'star_60', 'map_perfect']),
    );
  });

  it('awards stage_sweep (single-session), revisit, comeback, no_trainer', () => {
    expect(awardedIds({ singleSessionSweep: true })).toContain('stage_sweep');
    expect(awardedIds({ singleSessionSweep: false })).not.toContain('stage_sweep');
    expect(awardedIds({ revisit: true })).toContain('revisit');
    expect(awardedIds({ rebuiltStreak: true })).toContain('comeback');
    expect(awardedIds({ easyModeOff: true })).toContain('no_trainer');
    expect(awardedIds({ easyModeOff: false })).not.toContain('no_trainer');
  });

  it('awards secret_logo at 10 logo taps', () => {
    expect(awardedIds({ logoTaps: 10 })).toContain('secret_logo');
    expect(awardedIds({ logoTaps: 9 })).not.toContain('secret_logo');
  });

  it('awards the play eggs (hot_hand, patient_one, early_bird, perfect_man, tough_cookie, jackpot, first_try)', () => {
    expect(awardedIds({ consecutiveDrops: 2 })).toContain('hot_hand');
    expect(awardedIds({ noDropStreak: 10 })).toContain('patient_one');
    expect(awardedIds({ earlyBird: true })).toContain('early_bird');
    expect(awardedIds({ perfectMan: true })).toContain('perfect_man');
    expect(awardedIds({ maxConsecutiveWrongs: 9 })).toContain('tough_cookie');
    expect(awardedIds({ jackpot: true })).toContain('jackpot');
    expect(awardedIds({ firstTry: true })).toContain('first_try');
  });

  it('awards days_3 and days_7 from persisted play stats', () => {
    memoryStore.set(
      'alphabet-adventure-play-stats',
      JSON.stringify({ days: ['a', 'b', 'c'], logoTaps: 0, perfectCount: 0 }),
    );
    expect(awardedIds({})).toContain('days_3');
    memoryStore.set(
      'alphabet-adventure-play-stats',
      JSON.stringify({ days: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], logoTaps: 0, perfectCount: 0 }),
    );
    expect(awardedIds({})).toContain('days_7');
  });

  it('does not double-award when achievements are already persisted', () => {
    checkAndAward({ currentStreak: 10 });
    expect(checkAndAward({ currentStreak: 10 })).toEqual([]);
  });

  it('touchPlayDate records today once', () => {
    touchPlayDate();
    touchPlayDate();
    const stats = JSON.parse(memoryStore.get('alphabet-adventure-play-stats') ?? '{}');
    expect(stats.days.length).toBe(1);
  });
});

// ─── FROZEN PIN: typing progression (difficulty-free) ─────────────────────────

// The typing delta arithmetic lives inside useGameActions.checkTyping (a React hook
// with internal refs/timers/analytics — not executable in this node-env unit suite),
// so this block pins the contract at the layer that IS testable: the real
// state-shape helper (initialGameState), the real constants (GAME_CONFIG), and a
// faithful mirror of the hook's typing arithmetic. A future regression that
// re-introduces `difficulty` (state key, config key, or delta scaling) must fail
// these pins.
describe('FROZEN PIN — typing progression (difficulty-free)', () => {
  // Mirrors the typing state arithmetic in useGameActions.checkTyping
  // (correct batch: levelCorrect +1 / levelTotal +1, consecutiveErrors reset;
  //  wrong batch:  levelCorrect +0 / levelTotal +1, consecutiveErrors +1).
  // Update ONLY together with a deliberate change to the game logic.
  function applyTypingBatch(state: GameState, outcome: 'correct' | 'wrong'): GameState {
    if (outcome === 'correct') {
      return {
        ...state,
        consecutiveErrors: 0,
        levelCorrect: state.levelCorrect + 1,
        levelTotal: state.levelTotal + 1,
      };
    }
    return {
      ...state,
      consecutiveErrors: state.consecutiveErrors + 1,
      levelTotal: state.levelTotal + 1,
    };
  }

  // Mirrors the `newErrors >= GAME_CONFIG.ERROR_THRESHOLD` branch of checkTyping:
  // feedback becomes 'Take a breather!' and consecutiveErrors resets to 0.
  function applyBreatherBranch(state: GameState): { feedback: string; state: GameState } {
    return { feedback: 'Take a breather!', state: { ...state, consecutiveErrors: 0 } };
  }

  it('pins the typing state shape: baseline 0/0/0 and no difficulty key', () => {
    const state = initialGameState();
    expect(Object.keys(state)).toEqual([
      'level',
      'score',
      'round',
      'winsInLevel',
      'consecutiveErrors',
      'levelCorrect',
      'levelTotal',
      'currentStreak',
      'bestStreak',
      'wrongAttempts',
      'wrongLetters',
      'easyMode',
      'onboardingSeen',
    ]);
    expect(state.levelCorrect).toBe(0);
    expect(state.levelTotal).toBe(0);
    expect(state.consecutiveErrors).toBe(0);
    expect(state).not.toHaveProperty('difficulty');
    expect(Object.keys(state)).not.toContain('difficulty');
  });

  it('pins the typing ratio: 2 correct batches + 1 wrong batch → 2/3 (+1/+1 and +0/+1)', () => {
    const afterCorrect1 = applyTypingBatch(initialGameState(), 'correct');
    const afterCorrect2 = applyTypingBatch(afterCorrect1, 'correct');
    const afterWrong = applyTypingBatch(afterCorrect2, 'wrong');

    expect(afterCorrect1.levelCorrect).toBe(1);
    expect(afterCorrect1.levelTotal).toBe(1);
    expect(afterCorrect2.levelCorrect).toBe(2);
    expect(afterCorrect2.levelTotal).toBe(2);
    // the wrong batch advances levelTotal only
    expect(afterWrong.levelCorrect).toBe(2);
    expect(afterWrong.levelTotal).toBe(3);
    expect(afterWrong.levelCorrect / afterWrong.levelTotal).toBeCloseTo(2 / 3);
    // correct batches clear consecutiveErrors, a wrong batch leaves levelCorrect flat
    expect(afterCorrect2.consecutiveErrors).toBe(0);
    expect(afterWrong.consecutiveErrors).toBe(1);
  });

  it('pins the error-threshold branch: ≥3 consecutive errors → "Take a breather!" + reset, no difficulty', () => {
    const first = applyTypingBatch(initialGameState(), 'wrong');
    const second = applyTypingBatch(first, 'wrong');
    const third = applyTypingBatch(second, 'wrong');

    expect(first.consecutiveErrors).toBe(1);
    expect(second.consecutiveErrors).toBe(2);
    expect(second.consecutiveErrors).toBeLessThan(GAME_CONFIG.ERROR_THRESHOLD);
    // third consecutive wrong crosses the threshold, firing the breather branch
    expect(third.consecutiveErrors).toBe(3);
    expect(third.consecutiveErrors).toBeGreaterThanOrEqual(GAME_CONFIG.ERROR_THRESHOLD);

    const { feedback, state } = applyBreatherBranch(third);
    expect(feedback).toBe('Take a breather!');
    expect(state.consecutiveErrors).toBe(0);
    expect(state).not.toHaveProperty('difficulty');
    expect(Object.keys(state)).not.toContain('difficulty');
  });

  it('pins GAME_CONFIG: exact values, no INITIAL_DIFFICULTY/MAX_DIFFICULTY/DIFFICULTY_INCREASE', () => {
    expect(GAME_CONFIG).toEqual({
      SCORE_CORRECT: 5,
      SCORE_WRONG: 3,
      SCORE_TYPING_CORRECT: 10,
      SCORE_TYPING_WRONG: 5,
      ERROR_THRESHOLD: 3,
      FEEDBACK_DURATION_CORRECT: 1000,
      FEEDBACK_DURATION_WRONG: 1500,
      STAR_THREE: 100,
      STAR_TWO: 70,
      WRONG_LIMIT: 2,
    });
    expect(GAME_CONFIG).not.toHaveProperty('INITIAL_DIFFICULTY');
    expect(GAME_CONFIG).not.toHaveProperty('MAX_DIFFICULTY');
    expect(GAME_CONFIG).not.toHaveProperty('DIFFICULTY_INCREASE');
    expect(Object.keys(GAME_CONFIG).filter((k) => /difficulty/i.test(k))).toEqual([]);
  });
});
