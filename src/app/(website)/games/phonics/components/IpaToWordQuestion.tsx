"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IpaToWordQuestion as IpaToWordQuestionType, CompanionId } from "../types";
import { COMPANIONS } from "../constants";
import { WORDS } from "../words";
import CompanionHint from "./CompanionHint";

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
      <div className="relative glass-panel p-8 rounded-3xl border border-white/20 shadow-md text-center max-w-sm mx-auto w-full overflow-hidden">
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

      <div className="grid grid-cols-2 gap-3.5 max-w-md mx-auto w-full">
        {question.options.map((opt) => {
          const isSelected = selectedAnswer === opt;
          const isCorrect = opt === question.correctAnswer;
          const wordData = WORDS.find(
            (w) => w.word.toLowerCase() === opt.toLowerCase()
          );

          let btnClass =
            "w-full px-4 py-5 font-bold text-sm tracking-wide text-center rounded-2xl backdrop-blur-xs border-2 transition-all btn-3d shadow-sm cursor-pointer ";
          const borderStyle = { "--border-color": "rgba(0,0,0,0.12)" } as React.CSSProperties;

          if (feedback === "correct" && isCorrect) {
            btnClass += "bg-[#2EC4B6] text-white border-[#2EC4B6] hover:bg-[#2EC4B6] dark:border-[#2EC4B6] animate-correct-bounce";
          } else if (feedback === "wrong" && isCorrect) {
            btnClass += "bg-[#2EC4B6]/40 text-emerald-800 dark:text-emerald-200 border-[#2EC4B6]/40";
          } else if (feedback === "wrong" && isSelected && !isCorrect) {
            btnClass += "bg-[#FF70A6] text-white border-[#FF70A6] hover:bg-[#FF70A6] dark:border-[#FF70A6] animate-shake";
          } else if (isSelected && !feedback) {
            btnClass += "border-[#C8A44E] bg-[#C8A44E]/10 dark:bg-[#C8A44E]/20 text-[#C8A44E] dark:text-[#F7E1A0]";
          } else {
            btnClass += "bg-white/60 dark:bg-slate-800/60 border-white/60 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-700/80";
          }

          return (
            <button
              key={opt}
              className={btnClass}
              onClick={() => handleSelect(opt)}
              disabled={!!feedback}
              style={borderStyle}
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
            </button>
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
