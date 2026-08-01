import { describe, it, expect } from 'vitest';
import { computeEntries, applyOverrides } from '@/lib/word-merge';
import type { WordData, DictEntry } from '@/app/(website)/games/phonics/types';
import type { OverrideDoc } from '@/lib/word-merge';

const mockWords: WordData[] = [
  {
    word: 'apple',
    wordClass: 'noun',
    level: 'a1',
    ipa: '/ˈæp.əl/',
    stress: [1],
    syllables: ['ap', 'ple'],
    phonemes: ['ae', 'p', 'uh', 'l'],
    definition: 'A fruit',
    example: 'I eat an apple',
    wordFamily: [],
    synonyms: [],
    collocations: [],
    spellingDistractors: [],
  },
  {
    word: 'banana',
    wordClass: 'noun',
    level: 'a1',
    ipa: '/bəˈnæn.ə/',
    stress: [0, 1],
    syllables: ['ba', 'na', 'na'],
    phonemes: ['b', 'uh', 'n', 'ae', 'n', 'uh'],
    definition: 'A yellow fruit',
    example: 'Monkeys like bananas',
    wordFamily: [],
    synonyms: [],
    collocations: [],
    spellingDistractors: [],
  },
  {
    word: 'cat',
    wordClass: 'noun',
    level: 'a1',
    ipa: '/kæt/',
    stress: [1],
    syllables: ['cat'],
    phonemes: ['k', 'ae', 't'],
    definition: 'An animal',
    example: 'The cat sleeps',
    wordFamily: [],
    synonyms: [],
    collocations: [],
    spellingDistractors: [],
  },
];

const mockDict: DictEntry[] = [
  { word: 'apple', phonemeIds: ['ae', 'p', 'uh', 'l'], ipa: '/ˈæp.əl/', dialect: 'us' },
  {
    word: 'banana',
    phonemeIds: ['b', 'uh', 'n', 'ae', 'n', 'uh'],
    ipa: '/bəˈnæn.ə/',
    dialect: 'us',
  },
];

describe('computeEntries', () => {
  it('returns entries from words when no overrides', () => {
    const result = computeEntries(mockWords, new Map(), mockDict);
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.some((e) => e.word === 'apple')).toBe(true);
    expect(result.some((e) => e.word === 'banana')).toBe(true);
    expect(result.some((e) => e.word === 'cat')).toBe(true);
  });

  it('override replaces word fields', () => {
    const overrideMap = new Map<string, OverrideDoc>();
    overrideMap.set('apple-a1', {
      _id: '1',
      slug: 'apple-a1',
      word: 'apple',
      level: 'a1',
      definition: 'A round fruit',
      phonemes: ['ae', 'p', 'l'],
    });

    const result = computeEntries(mockWords, overrideMap, mockDict);
    const apple = result.find((e) => e.word === 'apple');
    expect(apple).toBeDefined();
    expect(apple!.definition).toBe('A round fruit');
    expect(apple!.phonemeIds).toEqual(['ae', 'p', 'l']);
  });

  it('override with published: false excludes WORDS entry but dict entry still appears', () => {
    const overrideMap = new Map<string, OverrideDoc>();
    overrideMap.set('apple-a1', {
      _id: '1',
      slug: 'apple-a1',
      word: 'apple',
      level: 'a1',
      published: false,
    });

    const result = computeEntries(mockWords, overrideMap, mockDict);
    const apple = result.find((e) => e.word === 'apple');
    expect(apple).toBeDefined();
    expect(apple!.definition).toBeUndefined();
  });

  it('returns only dict entries when words array is empty', () => {
    const result = computeEntries([], new Map(), mockDict);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(mockDict.length);
  });

  it('deduplicates entries with same word and phonemes', () => {
    const wordsWithDup: WordData[] = [...mockWords, { ...mockWords[0] }];
    const result = computeEntries(wordsWithDup, new Map(), mockDict);
    const appleCount = result.filter((e) => e.word === 'apple').length;
    expect(appleCount).toBe(1);
  });

  describe('applyOverrides', () => {
    it('returns words unchanged when no overrides', () => {
      const result = applyOverrides(mockWords, new Map());
      expect(result).toHaveLength(mockWords.length);
      expect(result[0].definition).toBe('A fruit');
    });

    it('replaces definition when override exists', () => {
      const map = new Map<string, OverrideDoc>();
      map.set('apple-a1', {
        _id: '1',
        slug: 'apple-a1',
        word: 'apple',
        level: 'a1',
        definition: 'A round fruit',
      });
      const result = applyOverrides(mockWords, map);
      const apple = result.find((w) => w.word === 'apple');
      expect(apple!.definition).toBe('A round fruit');
    });

    it('replaces phonemes when override exists', () => {
      const map = new Map<string, OverrideDoc>();
      map.set('apple-a1', {
        _id: '1',
        slug: 'apple-a1',
        word: 'apple',
        level: 'a1',
        phonemes: ['ae', 'p', 'l'],
      });
      const result = applyOverrides(mockWords, map);
      const apple = result.find((w) => w.word === 'apple');
      expect(apple!.phonemes).toEqual(['ae', 'p', 'l']);
    });

    it('excludes word when override has published: false', () => {
      const map = new Map<string, OverrideDoc>();
      map.set('apple-a1', {
        _id: '1',
        slug: 'apple-a1',
        word: 'apple',
        level: 'a1',
        published: false,
      });
      const result = applyOverrides(mockWords, map);
      expect(result.find((w) => w.word === 'apple')).toBeUndefined();
    });

    it('deduplicates by slug', () => {
      const duped: WordData[] = [...mockWords, { ...mockWords[0] }];
      const result = applyOverrides(duped, new Map());
      const appleCount = result.filter((w) => w.word === 'apple').length;
      expect(appleCount).toBe(1);
    });

    it('keeps first occurrence when deduplicating', () => {
      const map = new Map<string, OverrideDoc>();
      map.set('apple-a1', {
        _id: '1',
        slug: 'apple-a1',
        word: 'apple',
        level: 'a1',
        definition: 'Override def',
      });
      const first: WordData = { ...mockWords[0] };
      const second: WordData = { ...mockWords[0], definition: 'Second def' };
      const result = applyOverrides([first, second], map);
      expect(result).toHaveLength(1);
      expect(result[0].definition).toBe('Override def');
    });

    it('replaces multiple overridable fields', () => {
      const map = new Map<string, OverrideDoc>();
      map.set('cat-a1', {
        _id: '1',
        slug: 'cat-a1',
        word: 'cat',
        level: 'a1',
        definition: 'A feline',
        example: 'The cat purrs',
        synonyms: ['feline', 'kitty'],
        spellingDistractors: ['kat', 'katt'],
        syllables: ['ca', 't'],
      });
      const result = applyOverrides(mockWords, map);
      const cat = result.find((w) => w.word === 'cat');
      expect(cat!.definition).toBe('A feline');
      expect(cat!.example).toBe('The cat purrs');
      expect(cat!.synonyms).toEqual(['feline', 'kitty']);
      expect(cat!.spellingDistractors).toEqual(['kat', 'katt']);
      expect(cat!.syllables).toEqual(['ca', 't']);
    });
  });

  it('adds dialect entries from pronunciation dict', () => {
    const dictEntry: DictEntry[] = [
      { word: 'zebra', phonemeIds: ['z', 'eh', 'b', 'r', 'uh'], ipa: '/ˈzɛb.rə/', dialect: 'us' },
    ];
    const result = computeEntries([], new Map(), dictEntry);
    expect(result.some((e) => e.word === 'zebra')).toBe(true);
  });
});

describe('integration: applyOverrides + question generators', () => {
  it('buildQuestions with merged words reflects overridden definition', async () => {
    const { applyOverrides } = await import('@/lib/word-merge');
    const { WORDS } = await import('@/app/(website)/games/phonics/words');
    const { buildQuestions } = await import('@/app/(website)/games/phonics/question-generators');

    const cat = WORDS.find((w) => w.word === 'cat' && w.level === 'a1')!;
    const slug = `${cat.word}-${cat.level}`;
    const overrideDoc = {
      _id: 'inttest',
      slug,
      word: cat.word,
      level: cat.level,
      definition: 'INTEGRATION TEST OVERRIDE',
    };

    const merged = applyOverrides(WORDS, new Map([[slug, overrideDoc]]));

    // Filter pool to only cat — guarantees questions use the overridden word
    const catOnly = merged.filter((w) => w.word === 'cat');
    expect(catOnly).toHaveLength(1);

    const config: RoundConfig = {
      category: 'phonics',
      phonicsFormat: 'tap',
      level: 'a1',
      length: 5,
    };

    const questions = buildQuestions(config, ['ae'], catOnly);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.word?.word === 'cat')).toBe(true);
    expect(questions[0].word.definition).toBe('INTEGRATION TEST OVERRIDE');
  });

  it('generated questions exclude words with published: false override', async () => {
    const { applyOverrides } = await import('@/lib/word-merge');
    const { WORDS } = await import('@/app/(website)/games/phonics/words');
    const { buildQuestions } = await import('@/app/(website)/games/phonics/question-generators');

    const cat = WORDS.find((w) => w.word === 'cat' && w.level === 'a1')!;
    const slug = `${cat.word}-${cat.level}`;
    const overrideDoc = {
      _id: 'inttest2',
      slug,
      word: cat.word,
      level: cat.level,
      published: false,
    };

    const merged = applyOverrides(WORDS, new Map([[slug, overrideDoc]]));

    const config: RoundConfig = {
      category: 'phonics',
      phonicsFormat: 'tap',
      level: 'a1',
      length: 5,
    };

    const questions = buildQuestions(config, ['ae'], merged);
    const hasCat = questions.some((q) => q.word?.word === 'cat');
    expect(hasCat).toBe(false);
  });
});
