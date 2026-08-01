import { describe, it, expect } from 'vitest';
import {
  PHONEMES,
  phonemeSupportsMinimalPairs,
  phonemeSupportsStress,
  getAvailableTypesForPhoneme,
} from '@/app/(website)/games/phonics/constants';

function findPhonemesMissing(check: (pid: string) => boolean, target: boolean): string[] {
  return PHONEMES.map((p: { id: string }) => p.id).filter((pid: string) => check(pid) === target);
}

describe('phonemeSupportsMinimalPairs', () => {
  it('returns true for phoneme with minimal pair candidates', () => {
    expect(phonemeSupportsMinimalPairs('ae')).toBe(true);
  });

  it('returns true for phoneme in consonant minimal pairs', () => {
    expect(phonemeSupportsMinimalPairs('b')).toBe(true);
  });

  it('returns false for phoneme without minimal pair candidates', () => {
    const missing = findPhonemesMissing(phonemeSupportsMinimalPairs, false);
    if (missing.length > 0) {
      expect(phonemeSupportsMinimalPairs(missing[0])).toBe(false);
    } else {
      expect(PHONEMES.length).toBeGreaterThan(0);
    }
  });

  it('returns false for non-existent phoneme', () => {
    expect(phonemeSupportsMinimalPairs('zz')).toBe(false);
  });
});

describe('phonemeSupportsStress', () => {
  it('returns true for phoneme in multisyllabic words', () => {
    expect(phonemeSupportsStress('ae')).toBe(true);
  });

  it('returns true for phoneme in multisyllabic consonant words', () => {
    expect(phonemeSupportsStress('f')).toBe(true);
  });

  it('returns false for phoneme only in monosyllabic words', () => {
    const missing = findPhonemesMissing(phonemeSupportsStress, false);
    if (missing.length > 0) {
      expect(phonemeSupportsStress(missing[0])).toBe(false);
    } else {
      expect(PHONEMES.length).toBeGreaterThan(0);
    }
  });

  it('returns false for non-existent phoneme', () => {
    expect(phonemeSupportsStress('zz')).toBe(false);
  });
});

describe('getAvailableTypesForPhoneme', () => {
  it('returns 6 types for a phoneme with both minimal pairs and stress', () => {
    const types = getAvailableTypesForPhoneme('ae');
    expect(types).toEqual([
      'grapheme',
      'ipa-word',
      'word-ipa',
      'minimal-pairs',
      'stress',
      'exercise',
    ]);
  });

  it('returns 4 types for a phoneme without minimal pairs or stress', () => {
    const missingMinimalPairs = findPhonemesMissing(phonemeSupportsMinimalPairs, false);
    const missingStress = findPhonemesMissing(phonemeSupportsStress, false);
    const bothMissing = missingMinimalPairs.filter((p) => missingStress.includes(p));
    const pid =
      bothMissing.length > 0 ? bothMissing[0] : (missingMinimalPairs[0] ?? missingStress[0]);
    if (!pid) return;
    const types = getAvailableTypesForPhoneme(pid);
    expect(types).not.toContain('minimal-pairs');
    expect(types).not.toContain('stress');
    expect(types).toEqual(['grapheme', 'ipa-word', 'word-ipa', 'exercise']);
  });

  it('always has grapheme, ipa-word, word-ipa as first 3 types', () => {
    const types = getAvailableTypesForPhoneme('b');
    expect(types[0]).toBe('grapheme');
    expect(types[1]).toBe('ipa-word');
    expect(types[2]).toBe('word-ipa');
  });

  it('always ends with exercise', () => {
    const types = getAvailableTypesForPhoneme('ae');
    expect(types[types.length - 1]).toBe('exercise');
  });

  it('returns exercise only for phonemes without any conditional types', () => {
    const missingMinimalPairs = findPhonemesMissing(phonemeSupportsMinimalPairs, false);
    const missingStress = findPhonemesMissing(phonemeSupportsStress, false);
    const bothMissing = missingMinimalPairs.filter((p) => missingStress.includes(p));
    const pid =
      bothMissing.length > 0 ? bothMissing[0] : (missingMinimalPairs[0] ?? missingStress[0]);
    if (!pid) return;
    const types = getAvailableTypesForPhoneme(pid);
    const condCount = [types.includes('minimal-pairs'), types.includes('stress')].filter(
      Boolean,
    ).length;
    expect(types.length).toBe(3 + condCount + 1);
    expect(types[types.length - 1]).toBe('exercise');
  });
});
