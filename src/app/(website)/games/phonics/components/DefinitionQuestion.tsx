"use client";

import { useCallback } from "react";
import type { DefinitionQuestion as DefQ, CompanionId } from "../types";
import { COMPANIONS } from "../constants";

interface Props {
  question: DefQ;
  feedback: "correct" | "wrong" | null;
  companion: CompanionId | null;
  hintCount: number;
  onHint: () => void;
  speak: (text: string) => void;
  playWordAudio: (word: string) => Promise<void>;
  selectedAnswer: string | null;
  setSelectedAnswer: (ans: string | null) => void;
}

export default function DefinitionQuestion({
  question, feedback, companion, hintCount, onHint, speak, playWordAudio, selectedAnswer, setSelectedAnswer,
}: Props) {
  const isDefToWord = question.direction === "def-to-word";

  const handleSpeak = useCallback(() => {
    playWordAudio(question.word.word);
  }, [playWordAudio, question.word.word]);

  const companionData = companion ? COMPANIONS[companion] : null;
  const hintText: string | null = companionData
    ? companionData.hints.definitions?.[Math.min(hintCount + 1, 3) as 1 | 2 | 3] ?? null
    : null;

  return (
    <div className="flex flex-col items-center justify-center px-4 py-6 text-center">
      {isDefToWord ? (
        <div className="w-full max-w-4xl mb-6">
          <p className="text-xs font-bold text-[#1C1C1C]/40 dark:text-[#F7E1A0]/40 tracking-widest mb-3 uppercase">{question.blankedExample ? "GAP-FILL" : "DEFINITION"}</p>
          <div className="glass-panel p-6 rounded-3xl border border-white/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#9B59B6]" />
            {question.blankedExample ? (
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                &ldquo;{question.blankedExample}&rdquo;
              </p>
            ) : (
              <>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                  {question.word.definition}
                </p>
                <p className="text-sm italic text-slate-500 dark:text-slate-400 mt-2">
                  &ldquo;{question.word.example}&rdquo;
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl mb-6">
          <p className="text-xs font-bold text-[#1C1C1C]/40 dark:text-[#F7E1A0]/40 tracking-widest mb-3 uppercase">WORD</p>
          <div className="glass-panel p-6 rounded-3xl border border-white/20 shadow-sm relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#9B59B6]" />
            <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-wide">
              {question.word.word}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-mono">
              ({question.word.ipa}) — <span className="italic">{question.word.wordClass}</span>
            </p>
          </div>
        </div>
      )}

      <button
        className="mb-6 w-14 h-14 rounded-2xl flex items-center justify-center bg-[#9B59B6]/10 border border-[#9B59B6]/30 hover:bg-[#9B59B6]/20 text-[#9B59B6] active:scale-95 transition-all shadow-sm cursor-pointer"
        onClick={handleSpeak}
        aria-label="Speak word"
      >
        <i className="fi fi-sr-volume text-2xl" />
      </button>

      {/* Choice Grid */}
      <div className="grid grid-cols-1 gap-5 w-full max-w-4xl">
        {question.options.map((option, i) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === question.correctAnswer;

          let btnStyle = "w-full px-5 py-4 font-bold text-sm tracking-wide text-center rounded-2xl backdrop-blur-xs border-2 border-white/60 dark:border-slate-700/50 btn-3d shadow-sm cursor-pointer ";
          let borderStyle = { "--border-color": "rgba(0,0,0,0.12)" } as React.CSSProperties;

          if (feedback === "correct" && isCorrect) {
            btnStyle += "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-500 dark:border-emerald-500 animate-correct-bounce";
            borderStyle = { "--border-color": "#1b8a5a" } as React.CSSProperties;
          } else if (feedback === "wrong" && isCorrect) {
            btnStyle += "bg-emerald-500/40 text-emerald-800 dark:text-emerald-200 border-emerald-500/40";
            borderStyle = { "--border-color": "transparent" } as React.CSSProperties;
          } else if (feedback === "wrong" && isSelected && !isCorrect) {
            btnStyle += "bg-rose-500 text-white border-rose-500 hover:bg-rose-500 dark:border-rose-500 animate-shake";
            borderStyle = { "--border-color": "#b83f50" } as React.CSSProperties;
          } else if (isSelected && !feedback) {
            btnStyle += "border-[#9B59B6] bg-[#9B59B6]/10 dark:bg-[#9B59B6]/20 text-[#9B59B6] dark:text-[#F7E1A0]";
            borderStyle = { "--border-color": "#7e429c" } as React.CSSProperties;
          } else {
            btnStyle += "bg-white/60 dark:bg-slate-800/60 text-[#1C1C1C] dark:text-[#F7E1A0] hover:bg-white/80 dark:hover:bg-slate-700/80";
          }

          return (
            <button
              key={i}
              className={btnStyle}
              onClick={() => setSelectedAnswer(option)}
              disabled={!!feedback}
              style={{ minHeight: 64, ...borderStyle }}
            >
              {option}
            </button>
          );
        })}
      </div>

      {companionData && feedback && hintCount < 3 && (
        <div className="mt-4 p-4 rounded-2xl text-sm text-left max-w-sm glass-panel border-l-4"
          style={{ borderLeftColor: companionData.color }}
        >
          <span className="font-bold" style={{ color: companionData.color }}>{companionData.name}: </span>
          <span className="text-slate-700 dark:text-slate-200">{hintText}</span>
        </div>
      )}

      {companionData && !feedback && (
        <button
          className="mt-6 text-xs font-bold tracking-widest text-[#1C1C1C]/40 dark:text-[#F7E1A0]/40 hover:text-[#9B59B6] dark:hover:text-[#F7E1A0] transition-colors cursor-pointer uppercase"
          onClick={onHint}
        >
          💡 Ask {companionData.name} for a hint
        </button>
      )}
    </div>
  );
}
