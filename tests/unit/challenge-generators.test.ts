import { describe, it, expect } from 'vitest';
import {
  generateDefinitionQuestions,
  generateSynonymQuestions,
  generateStressQuestions,
} from '../../src/app/(website)/games/phonics/question-generators';
import type { WordData } from '../../src/app/(website)/games/phonics/types';

const WORD_A: WordData = {
  word: 'happy',
  wordClass: 'adjective',
  level: 'a1',
  ipa: '/ˈhæpi/',
  stress: [1, 0],
  syllables: ['hap', 'py'],
  phonemes: ['h', 'ae', 'p', 'i'],
  definition: 'feeling or showing pleasure or contentment',
  example: 'She was happy with her gift.',
  wordFamily: ['happiness', 'unhappy'],
  synonyms: ['glad', 'cheerful', 'joyful', 'delighted'],
  collocations: ['happy about', 'happy with'],
  antonyms: ['sad', 'unhappy'],
  spellingDistractors: ['hapi', 'happi'],
};

const WORD_B: WordData = {
  word: 'sad',
  wordClass: 'adjective',
  level: 'a1',
  ipa: '/ˈsæd/',
  stress: [1],
  syllables: ['sad'],
  phonemes: ['s', 'ae', 'd'],
  definition: 'feeling unhappy or sorrowful',
  example: 'He was sad when his friend moved away.',
  wordFamily: ['sadness', 'sadly'],
  synonyms: ['unhappy', 'gloomy', 'mournful'],
  collocations: ['sad about', 'sad to'],
  antonyms: ['happy', 'glad', 'joyful'],
  spellingDistractors: ['sadd', 'sade'],
};

const WORD_C: WordData = {
  word: 'big',
  wordClass: 'adjective',
  level: 'a1',
  ipa: '/ˈbɪɡ/',
  stress: [1],
  syllables: ['big'],
  phonemes: ['b', 'ih', 'g'],
  definition: 'of considerable size or extent',
  example: 'The box was big.',
  wordFamily: ['bigger', 'biggest'],
  synonyms: ['large', 'huge', 'enormous'],
  collocations: ['big deal', 'big time'],
  antonyms: ['small', 'tiny'],
  spellingDistractors: ['bigg', 'bige'],
};

const WORD_D: WordData = {
  word: 'small',
  wordClass: 'adjective',
  level: 'a1',
  ipa: '/ˈsmɔːl/',
  stress: [1],
  syllables: ['small'],
  phonemes: ['s', 'm', 'aw', 'l'],
  definition: 'not large in size or amount',
  example: 'The kitten was small.',
  wordFamily: ['smaller', 'smallest'],
  synonyms: ['little', 'tiny', 'petite'],
  collocations: ['small size', 'small amount'],
  antonyms: ['big', 'large', 'huge'],
  spellingDistractors: ['smal', 'smoll'],
};

const WORD_E: WordData = {
  word: 'elephant',
  wordClass: 'noun',
  level: 'a2',
  ipa: '/ˈɛlɪfənt/',
  stress: [1, 0, 0],
  syllables: ['el', 'e', 'phant'],
  phonemes: ['eh', 'l', 'ih', 'f', 'ah', 'n', 't'],
  definition: 'a large animal with a trunk',
  example: 'The elephant ate peanuts.',
  wordFamily: [],
  synonyms: [],
  collocations: [],
  antonyms: [],
  spellingDistractors: ['elefant', 'elephnt'],
};

// ─── generateDefinitionQuestions ─────────────────────────────────────────────

describe('generateDefinitionQuestions', () => {
  it('returns empty array when count is 0', () => {
    const result = generateDefinitionQuestions('word-to-def', 0, 'a1', undefined, [WORD_A]);
    expect(result).toEqual([]);
  });

  it('returns definitions with correct structure for word-to-def', () => {
    const result = generateDefinitionQuestions('word-to-def', 1, 'a1', undefined, [
      WORD_A,
      WORD_B,
      WORD_C,
      WORD_D,
    ]);
    expect(result.length).toBeGreaterThan(0);
    const q = result[0];
    expect(q.category).toBe('definitions');
    expect(q.direction).toBe('word-to-def');
    expect(typeof q.correctAnswer).toBe('string');
    expect(q.correctAnswer).toBe(q.word.definition);
    expect(q.options.length).toBeGreaterThanOrEqual(2);
    expect(q.options).toContain(q.correctAnswer);
  });

  it('returns words with correct structure for def-to-word', () => {
    const result = generateDefinitionQuestions('def-to-word', 1, 'a1', undefined, [
      WORD_A,
      WORD_B,
      WORD_C,
      WORD_D,
    ]);
    expect(result.length).toBeGreaterThan(0);
    const q = result[0];
    expect(q.category).toBe('definitions');
    expect(q.direction).toBe('def-to-word');
    expect(typeof q.correctAnswer).toBe('string');
    expect(q.correctAnswer).toBe(q.word.word);
    expect(q.options.length).toBeGreaterThanOrEqual(2);
    expect(q.options).toContain(q.correctAnswer);
  });

  it('uses provided word pool instead of global WORDS', () => {
    const result = generateDefinitionQuestions('word-to-def', 5, 'a1', undefined, [WORD_A]);
    expect(result.length).toBeLessThanOrEqual(1);
  });

  it('includes definition as correct answer for word-to-def', () => {
    const result = generateDefinitionQuestions('word-to-def', 1, 'a1', undefined, [
      WORD_A,
      WORD_B,
      WORD_C,
      WORD_D,
    ]);
    const q = result[0];
    expect(q.correctAnswer).toBe(q.word.definition);
  });
});

// ─── generateSynonymQuestions ────────────────────────────────────────────────

describe('generateSynonymQuestions', () => {
  it('returns empty array when count is 0', () => {
    const result = generateSynonymQuestions(0, 'a1', undefined, [WORD_A]);
    expect(result).toEqual([]);
  });

  it('returns empty array when no words have synonyms', () => {
    const words = [WORD_E];
    const result = generateSynonymQuestions(5, 'a1', undefined, words);
    expect(result).toEqual([]);
  });

  it('returns questions with correct structure', () => {
    const result = generateSynonymQuestions(2, 'a1', undefined, [WORD_A, WORD_B, WORD_C, WORD_D]);
    expect(result.length).toBeGreaterThan(0);
    const q = result[0];
    expect(q.category).toBe('synonyms');
    expect(typeof q.correctAnswer).toBe('string');
    expect(q.options.length).toBeGreaterThanOrEqual(4);
    expect(q.options).toContain(q.correctAnswer);
  });

  it('selects correct answer from a word in the pool', () => {
    const result = generateSynonymQuestions(1, 'a1', undefined, [WORD_A, WORD_B, WORD_C, WORD_D]);
    const q = result[0];
    expect(q.word.synonyms).toContain(q.correctAnswer);
  });

  it('uses provided word pool', () => {
    const result = generateSynonymQuestions(5, 'a1', undefined, [WORD_A]);
    expect(result.length).toBeLessThanOrEqual(1);
  });
});

// ─── generateStressQuestions ─────────────────────────────────────────────────

describe('generateStressQuestions', () => {
  it('returns empty array when count is 0', () => {
    const result = generateStressQuestions(0, 'a1', undefined, [WORD_A]);
    expect(result).toEqual([]);
  });

  it('returns empty array when no words have sufficient stress data', () => {
    const words = [{ ...WORD_A, stress: [1], syllables: ['word'] }];
    const result = generateStressQuestions(5, 'a1', undefined, words);
    expect(result).toEqual([]);
  });

  it('returns questions with correct structure', () => {
    const result = generateStressQuestions(1, 'a1', undefined, [WORD_A, WORD_E]);
    expect(result.length).toBeGreaterThan(0);
    const q = result[0];
    expect(q.category).toBe('stress');
    expect(typeof q.correctAnswer).toBe('string');
    expect(q.options.length).toBeGreaterThanOrEqual(2);
    expect(q.options).toContain(q.correctAnswer);
    expect(typeof q.phonemeId).toBe('string');
  });

  it('generates stress patterns in /syllable ˈsyllable/ format', () => {
    const result = generateStressQuestions(1, 'a1', undefined, [WORD_A]);
    expect(result.length).toBeGreaterThan(0);
    const q = result[0];
    expect(q.correctAnswer).toMatch(/^\/.*ˈ.*\/$/);
    q.options.forEach((opt) => {
      expect(opt).toMatch(/^\/.+\/$/);
    });
  });

  it('marks the correct syllable with ˈ', () => {
    const result = generateStressQuestions(1, 'a1', undefined, [WORD_A]);
    expect(result.length).toBeGreaterThan(0);
    const q = result[0];
    const correctIdx = WORD_A.stress.indexOf(1);
    const parts = WORD_A.syllables.map((s, idx) => (idx === correctIdx ? `ˈ${s}` : s));
    const expected = `/${parts.join(' ')}/`;
    expect(q.correctAnswer).toBe(expected);
  });

  it('uses provided word pool', () => {
    const result = generateStressQuestions(5, 'a1', undefined, [WORD_A]);
    expect(result.length).toBeLessThanOrEqual(1);
  });
});
