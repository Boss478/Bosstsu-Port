'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GraphemePatternQuestion as GraphemePatternQuestionType, CompanionId } from '../types';
import { COMPANIONS, QUESTION_CARD_CLASSES } from '../constants';
import CompanionHint from './CompanionHint';
import QuestionChoiceButton from './QuestionChoiceButton';

interface Props {
  question: GraphemePatternQuestionType;
  feedback: 'correct' | 'wrong' | null;
  companion: CompanionId;
  hintCount: number;
  onHint: () => void;
  speak: (text: string) => void;
  playWordAudio: (word: string) => Promise<void>;
  selectedAnswer: string | null;
  setSelectedAnswer: (ans: string | null) => void;
}

export default function GraphemePatternQuestion({
  question,
  feedback,
  companion,
  speak,
  selectedAnswer,
  setSelectedAnswer,
}: Props) {
  const feedbackRef = useRef(feedback);
  useEffect(() => {
    feedbackRef.current = feedback;
  }, [feedback]);

  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);

  const handleSelect = useCallback(
    (opt: string) => {
      if (feedbackRef.current) return;
      speak(opt);
      setSelectedAnswer(opt);
      if (opt !== question.correctAnswer) {
        setWrongAttempts((n) => n + 1);
        if (wrongAttempts + 1 >= 2) setHintLevel((l) => Math.min(l + 1, 3));
      }
    },
    [speak, setSelectedAnswer, question.correctAnswer, wrongAttempts],
  );

  const displayHint =
    hintLevel > 0
      ? (COMPANIONS[companion]?.hints?.phonics?.[hintLevel] ??
        COMPANIONS[companion]?.hints?.definitions?.[hintLevel] ??
        null)
      : null;

  const isPhonemeToGrapheme = question.direction === 'phoneme-to-grapheme';

  return (
    <div className="flex flex-col gap-6">
      <div className={QUESTION_CARD_CLASSES}>
        <div
          className="text-4xl font-extrabold text-slate-800 dark:text-[#F7E1A0] tracking-wide relative z-10"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          {question.promptLabel}
        </div>
        {question.word && (
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-3 relative z-10">
            {isPhonemeToGrapheme
              ? `In the word "${question.word.word}"`
              : `For the spelling in "${question.word.word}"`}
          </p>
        )}
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-widest relative z-10">
          {isPhonemeToGrapheme
            ? 'Which spelling matches this sound?'
            : 'Which sound does this spelling make?'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3.5 max-w-md mx-auto w-full">
        {question.options.map((opt) => (
          <QuestionChoiceButton
            key={opt}
            feedback={feedback}
            selectedAnswer={selectedAnswer}
            correctAnswer={question.correctAnswer}
            value={opt}
            onClick={() => handleSelect(opt)}
          >
            <span className="font-mono text-lg" style={{ fontFamily: 'var(--font-geist-mono)' }}>
              {opt}
            </span>
          </QuestionChoiceButton>
        ))}
      </div>

      {displayHint && (
        <CompanionHint hint={displayHint} companion={companion} feedback={feedback} />
      )}
    </div>
  );
}
