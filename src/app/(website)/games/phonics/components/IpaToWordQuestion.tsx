"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IpaToWordQuestion as IpaToWordQuestionType, CompanionId } from "../types";
import { COMPANIONS, QUESTION_CARD_CLASSES } from "../constants";
import { WORDS } from "../words";
import CompanionHint from "./CompanionHint";
import QuestionChoiceButton from "./QuestionChoiceButton";
import { useGame } from '../context';

interface Props {
  question: IpaToWordQuestionType;
  feedback: "correct" | "wrong" | null;
  companion: CompanionId;
  hintCount: number;
  onHint: () => void;
  speak: (text: string) => void;
  playWordAudio: (word: string) => Promise<void>;
  selectedAnswer: string | null;
  setSelectedAnswer: (ans: string | null) => void;
}

export default function IpaToWordQuestion({
  question,
  feedback,
  companion,
  speak,
  playWordAudio,
  selectedAnswer,
  setSelectedAnswer,
}: Props) {
  const gridColumns = useGame().gridColumns ?? 2;
  const feedbackRef = useRef(feedback);
  useEffect(() => { feedbackRef.current = feedback; }, [feedback]);

  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);

  const handleSelect = useCallback((opt: string) => {
    if (feedbackRef.current) return;
    playWordAudio(opt);
    setSelectedAnswer(opt);
    if (opt !== question.correctAnswer) {
      setWrongAttempts((n) => n + 1);
      if (wrongAttempts + 1 >= 2) setHintLevel((l) => Math.min(l + 1, 3));
    }
  }, [playWordAudio, setSelectedAnswer, question.correctAnswer, wrongAttempts]);

  const displayHint =
    hintLevel > 0
      ? COMPANIONS[companion]?.hints?.phonics?.[hintLevel] ?? COMPANIONS[companion]?.hints?.definitions?.[hintLevel] ?? null
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className={QUESTION_CARD_CLASSES}>
        <div
          className="text-7xl font-extrabold text-slate-800 dark:text-[#F7E1A0] tracking-widest relative z-10"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {question.ipa}
        </div>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-widest relative z-10">
          Which word matches this symbol?
        </p>
      </div>

      <div className="grid gap-5 max-w-4xl mx-auto w-full" style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>
        {question.options.map((opt) => {
          const wordData = WORDS.find(
            (w) => w.word.toLowerCase() === opt.toLowerCase()
          );

          return (
            <QuestionChoiceButton
              key={opt}
              feedback={feedback}
              selectedAnswer={selectedAnswer}
              correctAnswer={question.correctAnswer}
              value={opt}
              onClick={() => handleSelect(opt)}
            >
              <div className="flex flex-col items-center justify-center">
                <span>{opt}</span>
                {feedback && wordData && (
                  <span className="text-xs mt-1 font-semibold text-slate-500 dark:text-slate-400"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {wordData.ipa}
                  </span>
                )}
              </div>
            </QuestionChoiceButton>
          );
        })}
      </div>

      {displayHint && (
        <CompanionHint
          hint={displayHint}
          companion={companion}
          feedback={feedback}
        />
      )}
    </div>
  );
}
