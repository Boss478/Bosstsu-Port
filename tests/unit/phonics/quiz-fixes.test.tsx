// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import ChallengeQuizScreen from '@/app/(website)/games/phonics/screens/ChallengeQuizScreen';
import { generateQuestions } from '@/app/(website)/games/phonics/challenge-quiz-questions';
import { shuffleArray } from '@/lib/shuffle';
import type { QuizConfig } from '@/app/(website)/games/phonics/types';

// ─── Module-level mocks (hoisted by vitest) ──────────────────────────

vi.mock('@/app/(website)/games/phonics/hooks/useAllWordEntries', () => ({
  useAllWordEntries: () => [
    { word: 'cat', phonemeIds: ['k', 'æ', 't'], ipa: '/kæt/', dialect: 'us', wordClass: 'noun' },
    { word: 'dog', phonemeIds: ['d', 'ɒ', 'ɡ'], ipa: '/dɒɡ/', dialect: 'us', wordClass: 'verb' },
  ],
}));

vi.mock('@/hooks/useAudio', () => ({
  useAudio: () => ({ playWordAudio: vi.fn() }),
}));

vi.mock('@/app/(website)/games/phonics/components/PhonemeSoundboard', () => ({
  PhonemeSoundboard: () => <div data-testid="phoneme-soundboard" />,
}));

vi.mock('@/app/(website)/games/phonics/components/LetterTileKeyboard', () => ({
  LetterTileKeyboard: () => <div data-testid="letter-tile-keyboard" />,
}));

vi.mock('@/app/(website)/games/phonics/components/QuestionChoiceButton', () => ({
  default: ({ children }: { children: React.ReactNode; value: string }) => (
    <button data-testid="choice-btn">{children}</button>
  ),
}));

vi.mock('@/app/(website)/games/phonics/components/DialectBadge', () => ({
  DialectBadge: ({ dialect }: { dialect: string }) => (
    <span data-testid="dialect-badge">{dialect}</span>
  ),
}));

vi.mock('@/app/(website)/games/phonics/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/(website)/games/phonics/constants')>();
  return {
    ...actual,
    PHONEMES: [],
    WORD_CLASS_ABBREV: {},
  };
});

// ─── Helpers ─────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<QuizConfig> = {}): QuizConfig {
  return {
    directions: ['ipa-to-word'],
    mode: 'practice',
    roundLength: 10,
    lives: 3,
    timeLimit: 0,
    timerPerQuestion: 0,
    speedRunDuration: 0,
    speedRunBonus: 0,
    ...overrides,
  };
}

// ─── Fix A: Keydown preventDefault ──────────────────────────────────

describe('IPA→Word keydown handler (Fix A: prevents double letter)', () => {
  it('calls preventDefault on letter keydown and adds character once', async () => {
    render(
      <ChallengeQuizScreen
        config={makeConfig()}
        onComplete={vi.fn()}
        onBack={vi.fn()}
        onBackToBuilder={vi.fn()}
      />,
    );

    const input = await screen.findByPlaceholderText('Type the word...');

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
    await act(() => {
      document.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect((input as HTMLInputElement).value).toBe('A');
  });

  it('calls preventDefault on Backspace and removes last character', async () => {
    render(
      <ChallengeQuizScreen
        config={makeConfig()}
        onComplete={vi.fn()}
        onBack={vi.fn()}
        onBackToBuilder={vi.fn()}
      />,
    );

    const input = await screen.findByPlaceholderText('Type the word...');

    await act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'c', bubbles: true, cancelable: true }),
      );
    });
    expect((input as HTMLInputElement).value).toBe('C');

    const bs = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true });
    await act(() => {
      document.dispatchEvent(bs);
    });
    expect(bs.defaultPrevented).toBe(true);
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('consecutive letter keys each add one character (no doubling)', async () => {
    render(
      <ChallengeQuizScreen
        config={makeConfig()}
        onComplete={vi.fn()}
        onBack={vi.fn()}
        onBackToBuilder={vi.fn()}
      />,
    );

    const input = await screen.findByPlaceholderText('Type the word...');

    for (const ch of ['c', 'a', 't']) {
      await act(() => {
        document.dispatchEvent(
          new KeyboardEvent('keydown', { key: ch, bubbles: true, cancelable: true }),
        );
      });
    }

    expect((input as HTMLInputElement).value).toBe('CAT');
  });
});

// ─── Fix B: Questions stability with useState lazy init ─────────────

describe('generateQuestions stability (Fix B: no reshuffle on data-ref change)', () => {
  const pool = [
    { word: 'cat', phonemeIds: ['k', 'æ', 't'], ipa: '/kæt/' },
    { word: 'dog', phonemeIds: ['d', 'ɒ', 'ɡ'], ipa: '/dɒɡ/' },
    { word: 'sun', phonemeIds: ['s', 'ʌ', 'n'], ipa: '/sʌn/' },
  ];

  it('shuffleArray produces deterministic output with fixed Math.random', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const a = shuffleArray([1, 2, 3, 4, 5]);
    const b = shuffleArray([1, 2, 3, 4, 5]);
    expect(a).toEqual(b);
  });

  it('generateQuestions produces identical questions for same input', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const dirs: QuizConfig['directions'] = ['ipa-to-word'];
    const first = generateQuestions(pool, dirs, 10);
    const second = generateQuestions(pool, dirs, 10);

    expect(first).toHaveLength(10);
    expect(second).toHaveLength(10);

    for (let i = 0; i < first.length; i++) {
      expect(first[i]).toEqual(second[i]);
    }
  });

  it('generateQuestions with mixed directions is also deterministic', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const dirs: QuizConfig['directions'] = ['ipa-to-word', 'word-to-def', 'synonyms'];
    // With wordDirs non-empty, generateQuestions will also call generator
    // functions from question-generators — those also use Math.random.
    // The result is still deterministic with a fixed seed.
    const first = generateQuestions(pool, dirs, 5);
    const second = generateQuestions(pool, dirs, 5);

    expect(first).toEqual(second);
  });
});
