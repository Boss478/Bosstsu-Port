"use client";

import { useCallback } from "react";
import type { DefinitionQuestion as DefQ, CompanionId } from "../types";
import { COMPANIONS } from "../constants";

interface Props {
  question: DefQ;
  onAnswer: (answer: string) => void;
  feedback: "correct" | "wrong" | null;
  companion: CompanionId | null;
  hintCount: number;
  onHint: () => void;
  speak: (text: string) => void;
}

export default function DefinitionQuestion({
  question, onAnswer, feedback, companion, hintCount, onHint, speak,
}: Props) {
  const isDefToWord = question.direction === "def-to-word";

  const handleSpeak = useCallback(() => {
    speak(question.word.word);
  }, [speak, question.word.word]);

  const companionData = companion ? COMPANIONS[companion] : null;
  const hintText = companionData
    ? companionData.hints.definitions[Math.min(hintCount + 1, 3) as 1 | 2 | 3]
    : null;

  return (
    <div className="flex flex-col items-center justify-center px-4 py-6">
      {isDefToWord ? (
        <div className="text-center mb-6">
          <p className="text-xs text-[#888888] dark:text-[#B0C4DE] tracking-widest mb-2">DEFINITION</p>
          <p className="text-lg font-bold text-[#1C1C1C] dark:text-[#F7E1A0] leading-relaxed">
            {question.word.definition}
          </p>
          <p className="text-sm italic text-[#888888] dark:text-[#B0C4DE] mt-2">
            &ldquo;{question.word.example}&rdquo;
          </p>
        </div>
      ) : (
        <div className="text-center mb-6">
          <p className="text-xs text-[#888888] dark:text-[#B0C4DE] tracking-widest mb-2">WORD</p>
          <p className="text-3xl font-bold text-[#1C1C1C] dark:text-[#F7E1A0]">
            {question.word.word}
          </p>
          <p className="text-sm text-[#888888] dark:text-[#B0C4DE] mt-1">
            ({question.word.ipa}) — <em>{question.word.wordClass}</em>
          </p>
        </div>
      )}

      <button
        className="mb-4 p-2 rounded-full bg-[#E8E0D0] dark:bg-[#2A3F6E] hover:opacity-80 active:scale-95 transition-transform"
        onClick={handleSpeak}
        aria-label="Speak word"
      >
        <i className="fi fi-sr-volume text-lg text-[#1C1C1C] dark:text-[#F7E1A0]" />
      </button>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {question.options.map((option, i) => {
          const isCorrect = option === question.correctAnswer;
          let btnFeedback = "";
          if (feedback === "correct" && isCorrect) btnFeedback = "ring-2 ring-[#2ECC40] bg-[#2ECC40]/10";
          else if (feedback === "wrong" && isCorrect) btnFeedback = "ring-2 ring-[#2ECC40] bg-[#2ECC40]/10";

          return (
            <button
              key={i}
              className={`retro-border p-3 text-sm font-bold tracking-wide text-[#1C1C1C] dark:text-[#F7E1A0] bg-[#FDFBF7] dark:bg-[#0A1128] hover:opacity-80 active:scale-95 transition-all ${btnFeedback}`}
              onClick={() => onAnswer(option)}
              disabled={!!feedback}
              style={{ minHeight: 64 }}
            >
              {option}
            </button>
          );
        })}
      </div>

      {companionData && feedback && hintCount < 3 && (
        <div className="mt-4 p-3 rounded-lg text-sm text-center max-w-xs border-l-4"
          style={{
            backgroundColor: `${companionData.color}15`,
            borderColor: companionData.color,
            color: companionData.color,
          }}
        >
          <span className="font-bold">{companionData.name}: </span>
          {hintText}
        </div>
      )}

      {companionData && !feedback && (
        <button
          className="mt-4 text-xs tracking-widest text-[#888888] dark:text-[#B0C4DE] underline hover:opacity-80"
          onClick={onHint}
        >
          ASK {companionData.name.toUpperCase()} FOR A HINT
        </button>
      )}
    </div>
  );
}
