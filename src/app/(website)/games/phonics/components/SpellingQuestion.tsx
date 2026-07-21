"use client";

import { useState, useCallback, useEffect } from "react";
import type { SpellingQuestion as SpQ, CompanionId } from "../types";
import { COMPANIONS } from "../constants";

interface Props {
  question: SpQ;
  feedback: "correct" | "wrong" | null;
  companion: CompanionId | null;
  hintCount: number;
  onHint: () => void;
  speak: (text: string) => void;
  playWordAudio: (word: string) => Promise<void>;
  selectedAnswer: string | null;
  setSelectedAnswer: (ans: string | null) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SpellingQuestion({
  question, feedback, companion, hintCount, onHint, speak, playWordAudio, selectedAnswer, setSelectedAnswer,
}: Props) {
  const isTiles = question.inputMode === "tiles";

  const companionData = companion ? COMPANIONS[companion] : null;
  const hintText: string | null = companionData
    ? companionData.hints.spelling?.[Math.min(hintCount + 1, 3) as 1 | 2 | 3] ?? null
    : null;

  const handleSpeak = useCallback(() => {
    playWordAudio(question.word.word);
  }, [playWordAudio, question.word.word]);

  if (isTiles) {
    return (
      <TilesSpelling
        question={question}
        feedback={feedback}
        companionData={companionData}
        hintText={hintText}
        hintCount={hintCount}
        onHint={onHint}
        handleSpeak={handleSpeak}
        setSelectedAnswer={setSelectedAnswer}
      />
    );
  }

  const choices = question.choices ?? [question.word.word, ...question.word.spellingDistractors].slice(0, 4);

  return (
    <div className="flex flex-col items-center justify-center px-4 py-6 text-center">
      <p className="text-xs font-bold text-[#1C1C1C]/40 dark:text-[#F7E1A0]/40 tracking-widest mb-3 uppercase">SPELL THE WORD</p>
      
      {/* Definition card */}
      <div className="glass-panel p-6 rounded-3xl w-full max-w-4xl mb-6 border border-white/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-[#C8A44E]" />
        <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
          {question.word.definition}
        </p>
        <p className="text-sm italic text-slate-500 dark:text-slate-400 mt-2">
          &ldquo;{question.word.example}&rdquo;
        </p>
      </div>

      <button
        className="mb-6 w-14 h-14 rounded-2xl flex items-center justify-center bg-[#C8A44E]/10 border border-[#C8A44E]/30 hover:bg-[#C8A44E]/20 text-[#C8A44E] active:scale-95 transition-all shadow-sm cursor-pointer"
        onClick={handleSpeak}
        aria-label="Hear the word"
      >
        <i className="fi fi-sr-volume text-2xl" />
      </button>

      {/* Choice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-4xl">
        {choices.map((option, i) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === question.word.word;

          let btnStyle = "w-full px-5 py-4 font-bold text-sm tracking-wide text-center rounded-2xl glass-elem border-2 border-white/60 dark:border-slate-700/50 text-[#1C1C1C] dark:text-[#F7E1A0] hover:bg-white/80 dark:hover:bg-slate-700/80 btn-3d shadow-sm cursor-pointer ";
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
            btnStyle += "border-[#C8A44E] bg-[#C8A44E]/10 dark:bg-[#C8A44E]/20 text-[#C8A44E] dark:text-[#F7E1A0]";
            borderStyle = { "--border-color": "#a8853b" } as React.CSSProperties;
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
        <div className="mt-6 p-4 rounded-2xl text-sm text-left max-w-sm glass-panel border-l-4"
          style={{ borderLeftColor: companionData.color }}
        >
          <span className="font-bold" style={{ color: companionData.color }}>{companionData.name}: </span>
          <span className="text-slate-700 dark:text-slate-200">{hintText}</span>
        </div>
      )}

      {companionData && !feedback && (
        <button
          className="mt-6 text-xs font-bold tracking-widest text-[#1C1C1C]/40 dark:text-[#F7E1A0]/40 hover:text-[#C8A44E] dark:hover:text-[#F7E1A0] transition-colors cursor-pointer uppercase"
          onClick={onHint}
        >
          💡 Ask {companionData.name} for a hint
        </button>
      )}
    </div>
  );
}

function TilesSpelling({
  question, feedback, companionData, hintText, hintCount, onHint, handleSpeak, setSelectedAnswer,
}: {
  question: SpQ;
  feedback: "correct" | "wrong" | null;
  companionData: { name: string; color: string } | null;
  hintText: string | null;
  hintCount: number;
  onHint: () => void;
  handleSpeak: () => void;
  setSelectedAnswer: (ans: string | null) => void;
}) {
  const word = question.word;

  const [shuffledTiles] = useState(() => shuffleArray(word.phonemes));
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);

  // Propagate built selection back to parent GameScreen
  useEffect(() => {
    setSelectedAnswer(selectedTiles.length > 0 ? selectedTiles.join("") : null);
  }, [selectedTiles, setSelectedAnswer]);

  const handleTileTap = useCallback((phoneme: string) => {
    if (feedback) return;
    setSelectedTiles((prev) => [...prev, phoneme]);
  }, [feedback]);

  const handleRemoveTile = useCallback((index: number) => {
    if (feedback) return;
    setSelectedTiles((prev) => prev.filter((_, i) => i !== index));
  }, [feedback]);

  const handleClear = useCallback(() => {
    if (feedback) return;
    setSelectedTiles([]);
  }, [feedback]);

  const correctAnswer = word.phonemes.join(" ");

  return (
    <div className="flex flex-col items-center justify-center px-4 py-6 text-center">
      <p className="text-xs font-bold text-[#1C1C1C]/40 dark:text-[#F7E1A0]/40 tracking-widest mb-3 uppercase">SPELL THE WORD — TILES</p>
      
      {/* Definition card */}
      <div className="glass-panel p-6 rounded-3xl w-full max-w-4xl mb-6 border border-white/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-[#2EC4B6]" />
        <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
          {word.definition}
        </p>
        <p className="text-sm italic text-slate-500 dark:text-slate-400 mt-2">
          &ldquo;{word.example}&rdquo;
        </p>
      </div>

      <button
        className="mb-6 w-14 h-14 rounded-2xl flex items-center justify-center bg-[#2EC4B6]/10 border border-[#2EC4B6]/30 hover:bg-[#2EC4B6]/20 text-[#2EC4B6] active:scale-95 transition-all shadow-sm cursor-pointer"
        onClick={handleSpeak}
        aria-label="Hear the word"
      >
        <i className="fi fi-sr-volume text-2xl" />
      </button>

      {/* Answer zone: Interactive Keycaps */}
      <div className={`w-full max-w-4xl min-h-[72px] p-4 mb-4 rounded-3xl glass-panel flex flex-wrap justify-center items-center gap-2 border-2 transition-colors duration-300 ${
        feedback === "correct" ? "border-emerald-400 bg-emerald-500/10" : 
        feedback === "wrong" ? "border-rose-400 bg-rose-500/10" : "border-white/20"
      }`}>
        {selectedTiles.length > 0 ? (
          selectedTiles.map((tile, i) => (
            <button
              key={i}
              className="px-3.5 py-2 font-bold text-sm bg-white dark:bg-slate-800 text-[#1C1C1C] dark:text-[#F7E1A0] rounded-xl btn-3d shadow-sm cursor-pointer border-b-4 border-slate-300 dark:border-slate-900 active:translate-y-0.5 active:border-b-2"
              onClick={() => handleRemoveTile(i)}
              disabled={!!feedback}
              style={{ "--border-color": "rgba(0,0,0,0.15)" } as React.CSSProperties}
            >
              {tile}
            </button>
          ))
        ) : (
          <span className="text-[#1C1C1C]/40 dark:text-[#F7E1A0]/40 text-sm font-medium tracking-normal select-none">
            Tap tiles below to spell
          </span>
        )}
      </div>

      {feedback === "wrong" && (
        <p className="text-sm font-bold text-rose-500 mb-4 animate-shake">
          Correct sounds: &ldquo;{correctAnswer}&rdquo;
        </p>
      )}

      {/* Tile grid */}
      <div className="flex flex-wrap justify-center gap-2.5 mb-6 max-w-4xl">
        {shuffledTiles.map((phoneme, i) => {
          // Track usage correctly to allow duplicates
          const used = selectedTiles.filter((t) => t === phoneme).length >
            shuffledTiles.slice(0, i).filter((t) => t === phoneme).length;

          return (
            <button
              key={`${phoneme}-${i}`}
              className={`rounded-2xl px-4 py-2.5 text-base font-bold tracking-wider transition-all shadow-sm
                ${used
                  ? "opacity-20 cursor-default bg-white/20 dark:bg-slate-800/10 border-2 border-dashed border-white/20 text-transparent"
                  : "bg-white/70 dark:bg-slate-800/70 border-b-4 border-slate-300 dark:border-slate-900 text-[#1C1C1C] dark:text-[#F7E1A0] hover:bg-white/95 dark:hover:bg-slate-700 btn-3d cursor-pointer"
                }`}
              onClick={() => handleTileTap(phoneme)}
              disabled={!!feedback || used}
              style={{ "--border-color": "rgba(0,0,0,0.15)" } as React.CSSProperties}
            >
              {phoneme}
            </button>
          );
        })}
      </div>

      {/* Clear/Reset button for tiles spelling */}
      {selectedTiles.length > 0 && !feedback && (
        <button
          className="text-xs text-[#1C1C1C]/40 dark:text-[#F7E1A0]/40 hover:text-[#FF70A6] font-bold tracking-widest uppercase transition-colors mb-4 cursor-pointer"
          onClick={handleClear}
        >
          🗑️ Clear all
        </button>
      )}

      {companionData && feedback && hintCount < 3 && (
        <div className="mt-2 p-4 rounded-2xl text-sm text-left max-w-sm glass-panel border-l-4"
          style={{ borderLeftColor: companionData.color }}
        >
          <span className="font-bold" style={{ color: companionData.color }}>{companionData.name}: </span>
          <span className="text-slate-700 dark:text-slate-200">{hintText}</span>
        </div>
      )}

      {companionData && !feedback && (
        <button
          className="text-xs font-bold tracking-widest text-[#1C1C1C]/40 dark:text-[#F7E1A0]/40 hover:text-[#2EC4B6] dark:hover:text-[#F7E1A0] transition-colors cursor-pointer uppercase"
          onClick={onHint}
        >
          💡 Ask {companionData.name} for a hint
        </button>
      )}
    </div>
  );
}
