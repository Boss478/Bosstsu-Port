// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { FillBlankQuestion as FillBlankQ, WordAssocQuestion as WordAssocQ, CompanionId, WordData } from '@/app/(website)/games/phonics/types';

import { GameContext } from '@/app/(website)/games/phonics/context';
import type { GameContextValue } from '@/app/(website)/games/phonics/context';

const mockGameContext: GameContextValue = {
  gridColumns: 2,
  setGridColumns: () => {},
  screen: 'map',
  setScreen: () => {},
  tab: 'groups',
  setTab: () => {},
  mapView: 'groups',
  setMapView: () => {},
  selectedGroup: null,
  selectGroup: () => {},
  selectedActivity: null,
  selectActivity: () => {},
  activeSlot: 'guest',
  save: null,
  persistSave: () => {},
  deleteSaveSlot: () => {},
  selectedStage: null,
  selectStage: () => {},
  selectedLesson: null,
  selectLesson: () => {},
  round: null,
  startRound: () => {},
  answerQuestion: () => {},
  nextQuestion: () => {},
  companion: 'mira',
  setCompanion: () => {},
  muted: false,
  toggleMute: () => {},
  companionSnap: 'right',
  setCompanionSnap: () => {},
  voiceURI: '',
  setVoiceURI: () => {},
  voices: [],
  speechRate: 1,
  setSpeechRate: () => {},
  speechPitch: 1,
  setSpeechPitch: () => {},
  prefetchWords: async () => {},
};

function withCtx(ui: React.ReactElement) {
  return <GameContext.Provider value={mockGameContext}>{ui}</GameContext.Provider>;
}

vi.mock('@/app/(website)/games/phonics/components/QuestionChoiceButton', () => ({
  default: ({ value, onClick, children }: { value: string; onClick: () => void; children: React.ReactNode }) => (
    <button data-testid={`choice-${value}`} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/app/(website)/games/phonics/components/CompanionHint', () => ({
  default: ({ hint }: { hint: string }) => <div data-testid="companion-hint">{hint}</div>,
}));

vi.mock('@/app/(website)/games/phonics/components/MascotCanvas', () => ({
  default: () => <div data-testid="mascot-canvas" />,
}));

vi.mock('@/app/(website)/games/phonics/constants', () => ({
  COMPANIONS: {
    'mira': {
      hints: {
        definitions: { 1: 'definition hint 1', 2: 'definition hint 2', 3: 'definition hint 3' },
        phonics: { 1: 'phonics hint 1', 2: 'phonics hint 2', 3: 'phonics hint 3' },
      },
    },
  },
  QUESTION_CARD_CLASSES: '',
  WORD_CLASS_ABBREV: {},
}));

function makeWordData(overrides: Partial<WordData> = {}): WordData {
  return {
    word: '',
    wordClass: '',
    level: 'a1',
    ipa: '',
    stress: [],
    syllables: [],
    phonemes: [],
    definition: '',
    example: '',
    wordFamily: [],
    synonyms: [],
    collocations: [],
    antonyms: [],
    spellingDistractors: [],
    ...overrides,
  };
}

function makeFillBlankQuestion(overrides: Partial<FillBlankQ> = {}): FillBlankQ {
  return {
    category: 'fill-blank',
    word: makeWordData({ word: 'cat', definition: 'A pet', example: 'The black cat sat on the mat.', level: 'a1' }),
    correctAnswer: 'cat',
    options: ['cat', 'dog', 'fish', 'bird'],
    blankedSentence: 'The black ____ sat on the mat.',
    ...overrides,
  };
}

function makeWordAssocQuestion(overrides: Partial<WordAssocQ> = {}): WordAssocQ {
  return {
    category: 'word-assoc',
    word: makeWordData({ word: 'run', wordClass: 'verb', level: 'a1' }),
    correctAnswer: 'verb',
    options: ['noun', 'verb', 'adjective', 'adverb'],
    ...overrides,
  };
}

describe('FillBlankQuestion component', () => {
  let question: FillBlankQ;
  let speak: ReturnType<typeof vi.fn>;
  let playWordAudio: ReturnType<typeof vi.fn>;
  let setSelectedAnswer: ReturnType<typeof vi.fn>;
  let onHint: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    question = makeFillBlankQuestion();
    speak = vi.fn();
    playWordAudio = vi.fn();
    setSelectedAnswer = vi.fn();
    onHint = vi.fn();
  });

  async function renderComponent(feedback: 'correct' | 'wrong' | null = null, selectedAnswer: string | null = null) {
    const FillBlankQuestion = (await import('@/app/(website)/games/phonics/components/FillBlankQuestion')).default;
    return render(withCtx(
      <FillBlankQuestion
        question={question}
        feedback={feedback}
        companion={'mira' as CompanionId}
        hintCount={0}
        onHint={onHint}
        speak={speak}
        playWordAudio={playWordAudio}
        selectedAnswer={selectedAnswer}
        setSelectedAnswer={setSelectedAnswer}
      />,
    ));
  }

  it('renders blanked sentence', async () => {
    await renderComponent();
    expect(screen.getByText('The black ____ sat on the mat.')).toBeTruthy();
  });

  it('renders all option buttons', async () => {
    await renderComponent();
    expect(screen.getByTestId('choice-cat')).toBeTruthy();
    expect(screen.getByTestId('choice-dog')).toBeTruthy();
    expect(screen.getByTestId('choice-fish')).toBeTruthy();
    expect(screen.getByTestId('choice-bird')).toBeTruthy();
  });

  it('calls speak and setSelectedAnswer on correct selection', async () => {
    await renderComponent();
    fireEvent.click(screen.getByTestId('choice-cat'));
    expect(speak).toHaveBeenCalledWith('cat');
    expect(setSelectedAnswer).toHaveBeenCalledWith('cat');
  });

  it('calls speak and setSelectedAnswer on wrong selection', async () => {
    await renderComponent();
    fireEvent.click(screen.getByTestId('choice-dog'));
    expect(speak).toHaveBeenCalledWith('dog');
    expect(setSelectedAnswer).toHaveBeenCalledWith('dog');
  });

  it('does not show CompanionHint at hint level 0', async () => {
    await renderComponent();
    expect(screen.queryByTestId('companion-hint')).toBeNull();
  });

  it('shows CompanionHint after 2 wrong attempts (via render cycles)', async () => {
    await renderComponent();
    fireEvent.click(screen.getByTestId('choice-dog'));
    expect(screen.queryByTestId('companion-hint')).toBeNull();
    fireEvent.click(screen.getByTestId('choice-fish'));
    expect(screen.getByTestId('companion-hint')).toBeTruthy();
  });

  it('no hint after correct selection', async () => {
    await renderComponent();
    fireEvent.click(screen.getByTestId('choice-cat'));
    expect(screen.queryByTestId('companion-hint')).toBeNull();
  });

  it('shows "Fill in the blank" label', async () => {
    await renderComponent();
    expect(screen.getByText('Fill in the blank')).toBeTruthy();
  });

  it('feedback guard blocks further selections when feedback is set', async () => {
    await renderComponent('correct', 'cat');
    fireEvent.click(screen.getByTestId('choice-dog'));
    expect(speak).not.toHaveBeenCalled();
  });
});

describe('WordAssocQuestion component', () => {
  let question: WordAssocQ;
  let speak: ReturnType<typeof vi.fn>;
  let playWordAudio: ReturnType<typeof vi.fn>;
  let setSelectedAnswer: ReturnType<typeof vi.fn>;
  let onHint: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    question = makeWordAssocQuestion();
    speak = vi.fn();
    playWordAudio = vi.fn();
    setSelectedAnswer = vi.fn();
    onHint = vi.fn();
  });

  async function renderComponent(feedback: 'correct' | 'wrong' | null = null, selectedAnswer: string | null = null) {
    const WordAssocQuestion = (await import('@/app/(website)/games/phonics/components/WordAssocQuestion')).default;
    return render(withCtx(
      <WordAssocQuestion
        question={question}
        feedback={feedback}
        companion={'mira' as CompanionId}
        hintCount={0}
        onHint={onHint}
        speak={speak}
        playWordAudio={playWordAudio}
        selectedAnswer={selectedAnswer}
        setSelectedAnswer={setSelectedAnswer}
      />,
    ));
  }

  it('renders the word', async () => {
    await renderComponent();
    expect(screen.getByText('run')).toBeTruthy();
  });

  it('renders word class options with labels', async () => {
    await renderComponent();
    expect(screen.getByText('Noun')).toBeTruthy();
    expect(screen.getByText('Verb')).toBeTruthy();
    expect(screen.getByText('Adjective')).toBeTruthy();
    expect(screen.getByText('Adverb')).toBeTruthy();
  });

  it('shows "What word class is this?" label', async () => {
    await renderComponent();
    expect(screen.getByText('What word class is this?')).toBeTruthy();
  });

  it('calls playWordAudio when clicking the word', async () => {
    await renderComponent();
    fireEvent.click(screen.getByText('run'));
    expect(playWordAudio).toHaveBeenCalledWith('run');
  });

  it('calls speak and setSelectedAnswer on choosing an option', async () => {
    await renderComponent();
    fireEvent.click(screen.getByText('Verb'));
    expect(speak).toHaveBeenCalledWith('verb');
    expect(setSelectedAnswer).toHaveBeenCalledWith('verb');
  });

  it('does not show CompanionHint at hint level 0', async () => {
    await renderComponent();
    expect(screen.queryByTestId('companion-hint')).toBeNull();
  });

  it('shows CompanionHint after 2 wrong attempts', async () => {
    await renderComponent();
    fireEvent.click(screen.getByText('Noun'));
    expect(screen.queryByTestId('companion-hint')).toBeNull();
    fireEvent.click(screen.getByText('Adverb'));
    expect(screen.getByTestId('companion-hint')).toBeTruthy();
  });

  it('no hint after correct selection', async () => {
    await renderComponent();
    fireEvent.click(screen.getByText('Verb'));
    expect(screen.queryByTestId('companion-hint')).toBeNull();
  });

  it('feedback guard blocks further selections', async () => {
    await renderComponent('correct', 'verb');
    fireEvent.click(screen.getByText('Noun'));
    expect(speak).not.toHaveBeenCalled();
  });
});
