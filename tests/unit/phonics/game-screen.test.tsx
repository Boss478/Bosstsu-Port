// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { PhonicsQuestion, CompanionId } from '@/app/(website)/games/phonics/types';

const mockPlayWordAudio = vi.fn();
const mockSpeak = vi.fn();
const mockPlayPhonemeAudio = vi.fn();
const mockSetSelectedAnswer = vi.fn();
const mockUseGame = vi.fn(() => ({ companion: 'mira' as CompanionId }));
const mockUseAnalytics = vi.fn(() => ({ trackCustomEvent: vi.fn() }));

vi.mock('@/app/(website)/games/phonics/components/QuestionChoiceButton', () => ({
  default: ({
    value,
    onClick,
    children,
  }: {
    value: string;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button data-testid={`choice-${value}`} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/app/(website)/games/phonics/components/CompanionHint', () => ({
  default: ({ hint }: { hint: string }) => <div data-testid="companion-hint">{hint}</div>,
}));

vi.mock('@/app/(website)/games/phonics/context', () => ({
  useGame: () => mockUseGame(),
}));

vi.mock('@/lib/analytics', () => ({
  useAnalytics: () => mockUseAnalytics(),
}));

const TEST_PHONEME = { id: 'æ', name: 'short a', soundText: 'a', exampleWord: 'cat' };

function makeQuestion(overrides: Partial<PhonicsQuestion> = {}): PhonicsQuestion {
  return {
    id: 'q1',
    type: 'phonics',
    phoneme: TEST_PHONEME,
    word: 'cat',
    correctAnswer: 'cat',
    options: ['cat', 'dog', 'bat', 'rat'],
    ...overrides,
  };
}

describe('TapQuestion hint behavior', () => {
  let TapQuestion: typeof import('../screens/GameScreen').TapQuestion;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseGame.mockReturnValue({ companion: 'mira' as CompanionId });
    TapQuestion = (await import('@/app/(website)/games/phonics/screens/GameScreen')).TapQuestion;
  });

  function renderTapQuestion(
    question = makeQuestion(),
    feedback: 'correct' | 'wrong' | null = null,
  ) {
    return render(
      <TapQuestion
        question={question}
        feedback={feedback}
        speak={mockSpeak}
        playWordAudio={mockPlayWordAudio}
        playPhonemeAudio={mockPlayPhonemeAudio}
        selectedAnswer={null}
        setSelectedAnswer={mockSetSelectedAnswer}
      />,
    );
  }

  it('shows hint after 2 wrong answers', () => {
    renderTapQuestion();

    fireEvent.click(screen.getByTestId('choice-dog'));
    fireEvent.click(screen.getByTestId('choice-rat'));

    expect(screen.getByTestId('companion-hint')).toBeDefined();
  });

  it('does not show hint after correct answer', () => {
    renderTapQuestion();

    fireEvent.click(screen.getByTestId('choice-cat'));

    expect(screen.queryByTestId('companion-hint')).toBeNull();
  });

  it('does not show hint after only 1 wrong answer', () => {
    renderTapQuestion();

    fireEvent.click(screen.getByTestId('choice-dog'));

    expect(screen.queryByTestId('companion-hint')).toBeNull();
  });
});
