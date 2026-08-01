import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  weightedRandomSelect,
  computeCorrectAnswer,
} from '@/app/(website)/games/phonics/question-generators';
import type { Question, ExerciseQuestion } from '@/app/(website)/games/phonics/types';

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── weightedRandomSelect ─────────────────────────────────────────────────────

describe('weightedRandomSelect', () => {
  const items = ['a', 'b', 'c'];

  it('selects item proportional to weight', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.4);
    const result = weightedRandomSelect(items, (x) => (x === 'a' ? 10 : x === 'b' ? 30 : 60));
    expect(result).toBe('b');
  });

  it('selects first item when random lands on it', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);
    const result = weightedRandomSelect(items, () => 3);
    expect(result).toBe('a');
  });

  it('selects last item when random is at totalWeight - epsilon', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = weightedRandomSelect(items, () => 3);
    expect(result).toBe('c');
  });

  it('returns last item as fallback when nothing selected (floating edge)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);
    const result = weightedRandomSelect(['x', 'y'], () => 10);
    expect(result).toBe('y');
  });

  it('falls back to uniform random when total weight is 0', () => {
    const r = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = weightedRandomSelect(['x', 'y', 'z'], () => 0);
    expect(r).toHaveBeenCalled();
    expect(['x', 'y', 'z']).toContain(result);
  });

  it('handles single-item array', () => {
    const result = weightedRandomSelect(['only'], () => 100);
    expect(result).toBe('only');
  });

  it('returns undefined for empty items', () => {
    expect(weightedRandomSelect([], () => 1)).toBeUndefined();
  });
});

// ─── computeCorrectAnswer ────────────────────────────────────────────────────

describe('computeCorrectAnswer', () => {
  it('returns correctAnswer for phonics category', () => {
    const q = { category: 'phonics', correctAnswer: 'cat' } as Question;
    expect(computeCorrectAnswer(q)).toBe('cat');
  });

  it('returns correctAnswer for definitions category', () => {
    const q = { category: 'definitions', correctAnswer: 'a small cat' } as Question;
    expect(computeCorrectAnswer(q)).toBe('a small cat');
  });

  it('returns correctAnswer for practice category', () => {
    const q = { category: 'practice', correctAnswer: 'dog' } as Question;
    expect(computeCorrectAnswer(q)).toBe('dog');
  });

  it('returns correctAnswer for ipa-word category', () => {
    const q = { category: 'ipa-word', correctAnswer: 'fish' } as Question;
    expect(computeCorrectAnswer(q)).toBe('fish');
  });

  it('returns correctAnswer for word-ipa category', () => {
    const q = { category: 'word-ipa', correctAnswer: '/fɪʃ/' } as Question;
    expect(computeCorrectAnswer(q)).toBe('/fɪʃ/');
  });

  it('returns correctAnswer for synonyms category', () => {
    const q = { category: 'synonyms', correctAnswer: 'quick' } as Question;
    expect(computeCorrectAnswer(q)).toBe('quick');
  });

  it('returns data.correctAnswer for exercise wrapping ipa-word', () => {
    const q = {
      category: 'exercise',
      data: { category: 'ipa-word', correctAnswer: 'moon' },
    } as ExerciseQuestion;
    expect(computeCorrectAnswer(q)).toBe('moon');
  });

  it('returns data.correctAnswer for exercise wrapping word-ipa', () => {
    const q = {
      category: 'exercise',
      data: { category: 'word-ipa', correctAnswer: '/muːn/' },
    } as ExerciseQuestion;
    expect(computeCorrectAnswer(q)).toBe('/muːn/');
  });

  it('returns data.correctAnswer for exercise wrapping synonyms', () => {
    const q = {
      category: 'exercise',
      data: { category: 'synonyms', correctAnswer: 'rapid' },
    } as ExerciseQuestion;
    expect(computeCorrectAnswer(q)).toBe('rapid');
  });

  it('returns phonemes joined for tile mode questions', () => {
    const q = {
      category: 'spelling',
      correctAnswer: 'cat',
      inputMode: 'tiles',
      word: { phonemes: ['k', 'æ', 't'] },
    } as unknown as Question;
    expect(computeCorrectAnswer(q)).toBe('kæt');
  });

  it('returns word.word as fallback', () => {
    const q = {
      category: 'spelling',
      correctAnswer: 'something',
      inputMode: 'choice',
      word: { word: 'bat' },
    } as unknown as Question;
    expect(computeCorrectAnswer(q)).toBe('bat');
  });
});
