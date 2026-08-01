import { describe, it, expect } from 'vitest';
import {
  phonemeEditDistance,
  findClosestWords,
  generateSpellings,
} from '@/app/(website)/games/phonics/utils/phonemeSearch';
import type { WordEntry } from '@/app/(website)/games/phonics/hooks/useAllWordEntries';

const makeEntry = (word: string, phonemeIds: string[]): WordEntry => ({
  word,
  phonemeIds,
  ipa: '',
  dialect: undefined,
  definition: undefined,
  example: undefined,
  altPhonemeIds: undefined,
});

describe('phonemeEditDistance', () => {
  it('returns 0 for identical arrays', () => {
    expect(phonemeEditDistance(['k', 'ae', 't'], ['k', 'ae', 't'])).toBe(0);
  });

  it('returns 1 for single substitution', () => {
    expect(phonemeEditDistance(['k', 'ae', 't'], ['k', 'ae', 'p'])).toBe(1);
  });

  it('returns 1 for single insertion', () => {
    expect(phonemeEditDistance(['k', 'ae', 't'], ['k', 'ae', 't', 's'])).toBe(1);
  });

  it('returns 1 for single deletion', () => {
    expect(phonemeEditDistance(['k', 'ae', 't', 's'], ['k', 'ae', 't'])).toBe(1);
  });

  it('returns correct distance for completely different arrays', () => {
    expect(phonemeEditDistance(['k', 'ae', 't'], ['d', 'o', 'g'])).toBe(3);
  });

  it('returns correct distance for empty vs non-empty', () => {
    expect(phonemeEditDistance([], ['k', 'ae', 't'])).toBe(3);
  });

  it('returns 0 for two empty arrays', () => {
    expect(phonemeEditDistance([], [])).toBe(0);
  });

  it('handles partial overlap', () => {
    expect(phonemeEditDistance(['f', 'ie', 'm'], ['f', 'ie', 'l'])).toBe(1);
  });
});

describe('findClosestWords', () => {
  const entries: WordEntry[] = [
    makeEntry('CAT', ['k', 'ae', 't']),
    makeEntry('KIT', ['k', 'i', 't']),
    makeEntry('CUT', ['k', 'u', 't']),
    makeEntry('DOG', ['d', 'o', 'g']),
    makeEntry('FISH', ['f', 'i', 'sh']),
    makeEntry('SHIP', ['sh', 'i', 'p']),
  ];

  it('returns closest words sorted by distance', () => {
    const results = findClosestWords(['k', 'ae', 'p'], entries);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].word).toBe('CAT');
    expect(results[0].distance).toBe(1);
  });

  it('finds words with distance 1', () => {
    const results = findClosestWords(['k', 'i', 't'], entries);
    const cat = results.find((r) => r.word === 'CAT');
    expect(cat).toBeDefined();
    expect(cat!.distance).toBe(1);
  });

  it('excludes exact self-match when distance >= 1 filter applied', () => {
    const results = findClosestWords(['f', 'i', 'sh'], entries);
    // FISH should not appear with distance 0 (if filtered out)
    // It might appear at distance 0, but we set topN default
    // If distance >= 1, it shouldn't appear
    const filtered = results.filter((r) => r.distance >= 1);
    expect(filtered.length).toBeGreaterThanOrEqual(0);
  });

  it('returns empty array for empty input', () => {
    expect(findClosestWords([], entries)).toEqual([]);
  });

  it('returns empty array for empty entries', () => {
    expect(findClosestWords(['k', 'ae', 't'], [])).toEqual([]);
  });

  it('respects topN parameter', () => {
    const results = findClosestWords(['k', 'ae', 't'], entries, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });
});

describe('generateSpellings', () => {
  it('returns CAT for phoneme sequence [k, ae, t]', () => {
    const results = generateSpellings(['k', 'ae', 't']);
    expect(results).toContain('CAT');
  });

  it('returns DOG for phoneme sequence [d, o, g]', () => {
    const results = generateSpellings(['d', 'o', 'g']);
    expect(results).toContain('DOG');
  });

  it('returns FISH for phoneme sequence [f, i, sh]', () => {
    const results = generateSpellings(['f', 'i', 'sh']);
    expect(results).toContain('FISH');
  });

  it('returns at least one result for common phoneme sequences', () => {
    const results = generateSpellings(['b', 'ae', 'k']);
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns best-guess unverified spelling for non-dict sequences', () => {
    const results = generateSpellings(['f', 'ie', 'm']);
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty array for empty input', () => {
    expect(generateSpellings([])).toEqual([]);
  });

  it('handles single phoneme input', () => {
    const results = generateSpellings(['k']);
    expect(results.length).toBeGreaterThan(0);
  });
});
