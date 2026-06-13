"use client";

import { useState, useCallback, useEffect } from "react";
import type { SpellingQuestion as SpQ, CompanionId } from "../types";
import { COMPANIONS } from "../constants";

interface Props {
  question: SpQ;
  onAnswer: (answer: string) => void;
  feedback: "correct" | "wrong" | null;
  companion: CompanionId | null;
  hintCount: number;
  onHint: () => void;
  speak: (text: string) => void;
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
  question, onAnswer, feedback, companion, hintCount, onHint, speak,
}: Props) {
  const isTiles = question.inputMode === "tiles";

  const companionData = companion ? COMPANIONS[companion] : null;
  const hintText = companionData
    ? companionData.hints.spelling[Math.min(hintCount + 1, 3) as 1 | 2 | 3]
    : null;

  const handleSpeak = useCallback(() => {
    speak(question.word.word);
  }, [speak, question.word.word]);

  if (isTiles) {
    return (
      <TilesSpelling
        question={question}
        onAnswer={onAnswer}
        feedback={feedback}
        companionData={companionData}
        hintText={hintText}
        hintCount={hintCount}
        onHint={onHint}
        handleSpeak={handleSpeak}
      />
    );
  }

  const choices = question.choices ?? [question.word.word, ...question.word.spellingDistractors].slice(0, 4);

  return (
    <div className="flex flex-col items-center justify-center px-4 py-6">
      <p className="text-xs text-[#888888] dark:text-[#B0C4DE] tracking-widest mb-2">SPELL THE WORD</p>
      <p className="text-lg text-[#1C1C1C] dark:text-[#F7E1A0] mb-1">
        {question.word.definition}
      </p>
      <p className="text-sm italic text-[#888888] dark:text-[#B0C4DE] mb-4">
        &ldquo;{question.word.example}&rdquo;
      </p>

      <button
        className="mb-4 p-2 rounded-full bg-[#E8E0D0] dark:bg-[#2A3F6E] hover:opacity-80 active:scale-95 transition-transform"
        onClick={handleSpeak}
        aria-label="Hear the word"
      >
        <i className="fi fi-sr-volume text-lg text-[#1C1C1C] dark:text-[#F7E1A0]" />
      </button>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {choices.map((option, i) => {
          const isCorrect = option === question.word.word;
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

function TilesSpelling({
  question, onAnswer, feedback, companionData, hintText, hintCount, onHint, handleSpeak,
}: {
  question: SpQ;
  onAnswer: (answer: string) => void;
  feedback: "correct" | "wrong" | null;
  companionData: { name: string; color: string } | null;
  hintText: string | null;
  hintCount: number;
  onHint: () => void;
  handleSpeak: () => void;
}) {
  const word = question.word;

  const [shuffledTiles] = useState(() => shuffleArray(word.phonemes));
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);

  useEffect(() => {
    setSelectedTiles([]);
  }, [word.word]);

  const handleTileTap = useCallback((phoneme: string) => {
    if (feedback) return;
    setSelectedTiles((prev) => [...prev, phoneme]);
  }, [feedback]);

  const handleUndo = useCallback(() => {
    if (feedback) return;
    setSelectedTiles((prev) => prev.slice(0, -1));
  }, [feedback]);

  const handleSubmit = useCallback(() => {
    if (feedback || selectedTiles.length === 0) return;
    onAnswer(selectedTiles.join(""));
  }, [feedback, selectedTiles, onAnswer]);

  const builtAnswer = selectedTiles.join(" ");
  const correctAnswer = word.phonemes.join(" ");

  let answerFeedback = "";
  if (feedback === "correct") answerFeedback = "text-[#2ECC40]";
  else if (feedback === "wrong") answerFeedback = "text-[#FF4136]";

  return (
    <div className="flex flex-col items-center justify-center px-4 py-6">
      <p className="text-xs text-[#888888] dark:text-[#B0C4DE] tracking-widest mb-2">SPELL THE WORD — TILES</p>
      <p className="text-lg text-[#1C1C1C] dark:text-[#F7E1A0] mb-1">{word.definition}</p>
      <p className="text-sm italic text-[#888888] dark:text-[#B0C4DE] mb-4">
        &ldquo;{word.example}&rdquo;
      </p>

      <button
        className="mb-4 p-2 rounded-full bg-[#E8E0D0] dark:bg-[#2A3F6E] hover:opacity-80 active:scale-95 transition-transform"
        onClick={handleSpeak}
        aria-label="Hear the word"
      >
        <i className="fi fi-sr-volume text-lg text-[#1C1C1C] dark:text-[#F7E1A0]" />
      </button>

      {/* Answer zone */}
      <div className={`w-full max-w-sm min-h-[48px] p-3 mb-4 rounded retro-border bg-[#FDFBF7] dark:bg-[#0A1128] text-center text-lg font-bold tracking-widest ${answerFeedback}`}>
        {builtAnswer || <span className="text-[#888888] dark:text-[#B0C4DE] text-sm tracking-normal">Tap tiles below</span>}
      </div>

      {feedback === "wrong" && (
        <p className="text-sm text-[#FF4136] mb-2">Correct: &ldquo;{correctAnswer}&rdquo;</p>
      )}

      {/* Tile grid */}
      <div className="flex flex-wrap justify-center gap-2 mb-4 max-w-sm">
        {shuffledTiles.map((phoneme, i) => {
          const used = selectedTiles.filter((t) => t === phoneme).length >
            shuffledTiles.slice(0, i).filter((t) => t === phoneme).length;

          return (
            <button
              key={`${phoneme}-${i}`}
              className={`retro-border px-4 py-2 text-lg font-bold tracking-wider
                ${used
                  ? "opacity-30 cursor-default bg-[#E8E0D0] dark:bg-[#1C2A4E] text-[#888888]"
                  : "bg-[#FDFBF7] dark:bg-[#0A1128] text-[#1C1C1C] dark:text-[#F7E1A0] hover:opacity-80 active:scale-95"
                } transition-all`}
              onClick={() => handleTileTap(phoneme)}
              disabled={!!feedback || used}
            >
              {phoneme}
            </button>
          );
        })}
      </div>

      {/* Undo / Submit */}
      <div className="flex gap-3 w-full max-w-sm">
        <button
          className="flex-1 retro-border p-2 text-sm tracking-widest text-[#888888] dark:text-[#B0C4DE] bg-[#FDFBF7] dark:bg-[#0A1128] hover:opacity-80 active:scale-95 transition-all"
          onClick={handleUndo}
          disabled={!!feedback || selectedTiles.length === 0}
        >
          UNDO
        </button>
        <button
          className="flex-1 retro-border p-2 text-sm font-bold tracking-widest text-[#1C1C1C] dark:text-[#F7E1A0] bg-[#C8A44E] hover:opacity-80 active:scale-95 transition-all"
          onClick={handleSubmit}
          disabled={!!feedback || selectedTiles.length === 0}
        >
          CHECK
        </button>
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
