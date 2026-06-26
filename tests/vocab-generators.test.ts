import { describe, it, expect } from 'vitest';
import {
  generateAntonymQuestions,
  generateFillBlankQuestions,
  generateWordAssociationQuestions,
  generateCollocationQuestions,
  buildQuestions,
  buildRetryQuestions,
  generateCardFlipCards,
} from '../src/app/(website)/games/phonics/question-generators';
import { getVocabActivityLength, getVocabActivitiesForStage } from '../src/app/(website)/games/phonics/constants';
import type { RoundConfig, PhonicsQuestion, CardFlipCard } from '../src/app/(website)/games/phonics/types';

describe('generateAntonymQuestions', () => {
  it('returns empty array when no words have antonyms', () => {
    const words = [
      { word: 'test', antonyms: [], level: 'a1' } as any,
      { word: 'foo', antonyms: [], level: 'a1' } as any,
    ];
    const result = generateAntonymQuestions(5, 'a1', undefined, words);
    expect(result).toEqual([]);
  });

  it('returns questions with correct structure', () => {
    const result = generateAntonymQuestions(3, 'a1');
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const q = result[0];
      expect(q.category).toBe('antonyms');
      expect(typeof q.correctAnswer).toBe('string');
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBe(4);
      expect(q.options).toContain(q.correctAnswer);
    }
  });
});

describe('generateFillBlankQuestions', () => {
  it('returns questions with blanked sentence', () => {
    const words = [
      { word: 'cat', definition: 'A small pet', example: 'The black cat sat on the mat.', level: 'a1' } as any,
      { word: 'dog', definition: 'A pet that barks', example: 'The dog ran in the park.', level: 'a1' } as any,
      { word: 'fish', definition: 'Swims in water', example: 'The fish swam away.', level: 'a1' } as any,
      { word: 'bird', definition: 'Has wings', example: 'The bird flew high.', level: 'a1' } as any,
    ];
    const result = generateFillBlankQuestions(2, 'a1', undefined, words);
    expect(result.length).toBeGreaterThan(0);
    const q = result[0];
    expect(q.category).toBe('fill-blank');
    expect(q.blankedSentence).toContain('____');
    expect(q.blankedSentence).not.toContain(q.word.word);
    expect(q.options).toContain(q.correctAnswer);
    expect(q.options.length).toBe(4);
  });

  it('returns empty for words with no example', () => {
    const words = [{ word: 'test', definition: 'a test', example: '', level: 'a1' } as any];
    const result = generateFillBlankQuestions(5, 'a1', undefined, words);
    expect(result).toEqual([]);
  });
});

describe('generateWordAssociationQuestions', () => {
  it('returns questions with word class options', () => {
    const words = [
      { word: 'run', wordClass: 'verb', level: 'a1' } as any,
      { word: 'fast', wordClass: 'adverb', level: 'a1' } as any,
      { word: 'car', wordClass: 'noun', level: 'a1' } as any,
      { word: 'big', wordClass: 'adjective', level: 'a1' } as any,
      { word: 'happy', wordClass: 'adjective', level: 'a1' } as any,
      { word: 'they', wordClass: 'pronoun', level: 'a1' } as any,
    ];
    const result = generateWordAssociationQuestions(3, 'a1', undefined, words);
    expect(result.length).toBeGreaterThan(0);
    const q = result[0];
    expect(q.category).toBe('word-assoc');
    expect(q.word.wordClass).toBe(q.correctAnswer);
    expect(q.options).toContain(q.correctAnswer);
    expect(q.options.length).toBeGreaterThanOrEqual(2);
    expect(q.options.length).toBeLessThanOrEqual(6);
  });
});

describe('generateCollocationQuestions', () => {
  it('returns empty when no words have collocations', () => {
    const words = [
      { word: 'test', collocations: [], level: 'a1' } as any,
      { word: 'foo', collocations: [], level: 'a1' } as any,
    ];
    const result = generateCollocationQuestions(5, 'a1', undefined, words);
    expect(result).toEqual([]);
  });

  it('returns questions when enough words have collocations', () => {
    const words = [
      { word: 'cat', collocations: ['pet cat', 'domestic cat'], level: 'a1' } as any,
      { word: 'dog', collocations: ['guard dog', 'pet dog'], level: 'a1' } as any,
      { word: 'house', collocations: ['big house', 'house cat'], level: 'a1' } as any,
    ];
    const result = generateCollocationQuestions(2, 'a1', undefined, words);
    expect(result.length).toBeGreaterThan(0);
    const q = result[0];
    expect(q.category).toBe('collocations');
    expect(typeof q.correctAnswer).toBe('string');
    expect(q.options).toContain(q.correctAnswer);
    expect(q.options.length).toBe(4);
  });
});

describe('buildQuestions routing for new types', () => {
  const makeConfig = (category: string): RoundConfig =>
    ({ category, level: 'a1', length: 3 }) as RoundConfig;

  it('routes antonyms category', () => {
    const result = buildQuestions(makeConfig('antonyms'), [], undefined);
    expect(Array.isArray(result)).toBe(true);
  });

  it('routes fill-blank category', () => {
    const result = buildQuestions(makeConfig('fill-blank'), [], undefined);
    expect(Array.isArray(result)).toBe(true);
  });

  it('routes word-assoc category', () => {
    const result = buildQuestions(makeConfig('word-assoc'), [], undefined);
    expect(Array.isArray(result)).toBe(true);
  });

  it('routes collocations category', () => {
    const result = buildQuestions(makeConfig('collocations'), [], undefined);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('buildRetryQuestions routing for new types', () => {
  const makeConfig = (category: string): RoundConfig =>
    ({ category, level: 'a1', length: 3 }) as RoundConfig;

  it('routes antonyms category in retry', () => {
    const result = buildRetryQuestions(makeConfig('antonyms'), ['cat']);
    expect(Array.isArray(result)).toBe(true);
  });

  it('routes fill-blank category in retry', () => {
    const result = buildRetryQuestions(makeConfig('fill-blank'), ['cat']);
    expect(Array.isArray(result)).toBe(true);
  });

  it('routes word-assoc category in retry', () => {
    const result = buildRetryQuestions(makeConfig('word-assoc'), ['cat']);
    expect(Array.isArray(result)).toBe(true);
  });

  it('routes collocations category in retry', () => {
    const result = buildRetryQuestions(makeConfig('collocations'), ['cat']);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('buildQuestions card-flip format', () => {
  const wordData = { word: 'cat', phonemes: ['ae'], level: 'a1' };
  const config: RoundConfig = { category: 'phonics', phonicsFormat: 'card-flip', level: 'a1', length: 3 };

  it('returns a single question with correct structure', () => {
    const result = buildQuestions(config, ['ae'], [wordData] as any) as PhonicsQuestion[];
    expect(result).toHaveLength(1);
    const q = result[0];
    expect(q.category).toBe('phonics');
    expect(q.format).toBe('card-flip');
    expect(q.word.word).toBe('cat');
    expect(q.correctAnswer).toBe('cat');
    expect(q.options).toEqual(['cat']);
  });

  it('picks phoneme from provided phonemeIds (not PHONEMES[0])', () => {
    const result = buildQuestions(config, ['ae'], [wordData] as any) as PhonicsQuestion[];
    const q = result[0];
    expect(q.phoneme.id).toBe('ae');
    expect(q.phoneme.ipa).toBe('/æ/');
  });

  it('falls back to wordPool when no phonemeIds provided', () => {
    const qData = { ...wordData, phonemes: ['aa'] };
    const result = buildQuestions(config, undefined, [qData] as any) as PhonicsQuestion[];
    const q = result[0];
    expect(q.format).toBe('card-flip');
    expect(typeof q.word.word).toBe('string');
  });

  it('falls back to wordPool[0] when no word matches phoneme', () => {
    const qData = { word: 'dog', phonemes: ['aa'], level: 'a1' };
    const result = buildQuestions(config, 'ae' as any, [qData] as any) as PhonicsQuestion[];
    const q = result[0];
    expect(q.word.word).toBe('dog');
  });
});

describe('buildRetryQuestions card-flip format', () => {
  const wordData = { word: 'cat', phonemes: ['ae'], level: 'a1' };
  const config: RoundConfig = { category: 'phonics', phonicsFormat: 'card-flip', level: 'a1', length: 3 };

  it('returns a single question with correct structure', () => {
    const result = buildRetryQuestions(config, ['cat'], [wordData] as any, ['ae']) as PhonicsQuestion[];
    expect(result).toHaveLength(1);
    const q = result[0];
    expect(q.category).toBe('phonics');
    expect(q.format).toBe('card-flip');
    expect(q.word.word).toBe('cat');
    expect(q.correctAnswer).toBe('cat');
    expect(q.options).toEqual(['cat']);
  });

  it('picks phoneme from provided phonemeIds', () => {
    const result = buildRetryQuestions(config, ['cat'], [wordData] as any, ['ae']) as PhonicsQuestion[];
    expect(result[0].phoneme.id).toBe('ae');
  });

  it('falls back to PHONEMES[0] when no phonemeIds', () => {
    const qData = { word: 'test', phonemes: ['xx'], level: 'a1' };
    const result = buildRetryQuestions(config, ['test'], [qData] as any, []) as PhonicsQuestion[];
    const q = result[0];
    expect(q.format).toBe('card-flip');
    expect(typeof q.word.word).toBe('string');
  });

  it('falls back to wordPool[0] when no word matches phoneme', () => {
    const qData = { word: 'dog', phonemes: ['aa'], level: 'a1' };
    const result = buildRetryQuestions(config, ['dog'], [qData] as any, ['ae']) as PhonicsQuestion[];
    expect(result[0].word.word).toBe('dog');
  });
});

describe('generateCardFlipCards', () => {
  const wordData = [
    { word: 'cat', phonemes: ['ae'], level: 'a1' },
    { word: 'bee', phonemes: ['ee'], level: 'a1' },
  ];

  it('returns shuffled array of pairs', () => {
    const cards = generateCardFlipCards(1, 'a1', ['ae'], wordData as any);
    expect(cards.length).toBe(2);
    const types = cards.map(c => c.type).sort();
    expect(types).toEqual(['phoneme', 'word']);
  });

  it('creates phoneme card with IPA label and matching word card', () => {
    const cards = generateCardFlipCards(1, 'a1', ['ae'], wordData as any);
    const phonemeCard = cards.find(c => c.type === 'phoneme')!;
    const wordCard = cards.find(c => c.type === 'word')!;
    expect(phonemeCard.label).toBe('/æ/');
    expect(phonemeCard.matchId).toBe('ae');
    expect(wordCard.label).toBe('cat');
    expect(wordCard.matchId).toBe(phonemeCard.matchId);
    expect(phonemeCard.flipped).toBe(false);
    expect(phonemeCard.matched).toBe(false);
    expect(wordCard.flipped).toBe(false);
    expect(wordCard.matched).toBe(false);
  });

  it('generates numPairs pairs', () => {
    const cards = generateCardFlipCards(2, 'a1', ['ae', 'ee'], wordData as any);
    expect(cards.length).toBe(4);
  });

  it('fills from other phonemes when not enough match given phonemeIds', () => {
    const cards = generateCardFlipCards(3, 'a1', ['ae'], wordData as any);
    expect(cards.length).toBe(6);
  });

  it('truncates when more phonemeIds than numPairs', () => {
    const cards = generateCardFlipCards(1, 'a1', ['ae', 'ee'], wordData as any);
    expect(cards.length).toBe(2);
  });

  it('uses default WORDS when no word pool provided', () => {
    const cards = generateCardFlipCards(1, 'a1', ['ae']);
    expect(cards.length).toBe(2);
    const types = cards.map(c => c.type).sort();
    expect(types).toEqual(['phoneme', 'word']);
  });

  it('returns empty for numPairs=0', () => {
    const cards = generateCardFlipCards(0, 'a1');
    expect(cards.length).toBe(0);
  });

  it('all cards have unique ids', () => {
    const cards = generateCardFlipCards(5, 'a1', ['ae', 'ee', 'ii', 'oo', 'uu']);
    const ids = cards.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses phoneme.example when no matching word found', () => {
    const cards = generateCardFlipCards(1, 'a1', ['ae'], [] as any);
    const wordCard = cards.find(c => c.type === 'word')!;
    expect(wordCard.label).toBe('cat');
    expect(wordCard.ttsText).toBe('cat');
  });
});

describe('getVocabActivityLength', () => {
  it('returns A1=6, A2=8, B1=10, B2=10, C1=12, C2=12 as base values', () => {
    expect(getVocabActivityLength('a1')).toBe(6);
    expect(getVocabActivityLength('a2')).toBe(8);
    expect(getVocabActivityLength('b1')).toBe(10);
    expect(getVocabActivityLength('b2')).toBe(10);
    expect(getVocabActivityLength('c1')).toBe(12);
    expect(getVocabActivityLength('c2')).toBe(12);
  });

  it('defaults unknown level to 10', () => {
    expect(getVocabActivityLength('all')).toBe(10);
    expect(getVocabActivityLength('unknown')).toBe(10);
  });

  it('adjusts by +2 when accuracy < 0.4', () => {
    expect(getVocabActivityLength('a1', 0.3)).toBe(8);
    expect(getVocabActivityLength('c2', 0.2)).toBe(14);
  });

  it('adjusts by -2 when accuracy > 0.8', () => {
    expect(getVocabActivityLength('a1', 0.9)).toBe(4);
    expect(getVocabActivityLength('b1', 0.85)).toBe(8);
  });

  it('no adjustment when accuracy is between 0.4 and 0.8', () => {
    expect(getVocabActivityLength('a1', 0.6)).toBe(6);
    expect(getVocabActivityLength('c2', 0.5)).toBe(12);
  });

  it('clamps result to [4, 14]', () => {
    expect(getVocabActivityLength('a1', 0.1)).toBe(8);
    expect(getVocabActivityLength('a1', 0.95)).toBe(4);
    expect(getVocabActivityLength('c2', 0.95)).toBe(10);
  });

  it('no adjustment when accuracy is undefined', () => {
    expect(getVocabActivityLength('a1')).toBe(6);
    expect(getVocabActivityLength('c2')).toBe(12);
  });
});

describe('getVocabActivitiesForStage', () => {
  it('returns 8 activities', () => {
    const result = getVocabActivitiesForStage('vocab-a1', 'vocab-a1');
    expect(result.length).toBe(8);
  });

  it('includes all 6 new activity types', () => {
    const result = getVocabActivitiesForStage('vocab-a1', 'vocab-a1');
    const types = result.map((a) => a.type);
    expect(types).toContain('definitions');
    expect(types).toContain('synonyms');
    expect(types).toContain('antonyms');
    expect(types).toContain('collocations');
    expect(types).toContain('fill-blank');
    expect(types).toContain('word-assoc');
    expect(types).toContain('vocab-exercise');
  });

  it('respects accuracy parameter for length scaling', () => {
    const noAcc = getVocabActivitiesForStage('vocab-a1', 'vocab-a1');
    const lowAcc = getVocabActivitiesForStage('vocab-a1', 'vocab-a1', 0.3);
    expect(lowAcc[0].length).toBeGreaterThan(noAcc[0].length);
  });
});
