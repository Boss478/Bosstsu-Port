"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Question, FeedbackState } from "../types";
import { INSTRUCTIONS, STAGE_NAMES, GAME_CONFIG } from "../constants";

interface Props {
  question: Question;
  feedback: FeedbackState;
  isTransitioning: boolean;
  score: number;
  stage: number;
  stageDone: number;
  stageMax: number;
  isEndless: boolean;
  isFullscreen: boolean;
  muted: boolean;
  onAnswer: (selected: string) => void;
  onBack: () => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  onSpeak: (text: string, lang?: string) => void;
}

function renderVisualData(vd: NonNullable<Question["visualData"]>) {
  const maxItems = GAME_CONFIG.MAX_VISUAL_ITEMS;
  if (vd.countA !== undefined && vd.countB !== undefined) {
    const showA = vd.countA > maxItems ? maxItems : vd.countA;
    const showB = vd.countB > maxItems ? maxItems : vd.countB;
    return (
      <div className="flex items-center gap-4 text-center">
        <div className="flex flex-wrap max-w-[150px] justify-center text-4xl gap-1">
          {Array.from({ length: showA }).map((_, i) => (
            <span key={i} className="animate-in zoom-in duration-300">{vd.emoji}</span>
          ))}
          {vd.countA > maxItems && <span className="text-lg font-black text-zinc-400">×{Math.ceil(vd.countA / maxItems)}</span>}
        </div>
        <span className="text-4xl font-black text-zinc-300">+</span>
        <div className="flex flex-wrap max-w-[150px] justify-center text-4xl gap-1">
          {Array.from({ length: showB }).map((_, i) => (
            <span key={i} className="animate-in zoom-in duration-300">{vd.emoji}</span>
          ))}
          {vd.countB > maxItems && <span className="text-lg font-black text-zinc-400">×{Math.ceil(vd.countB / maxItems)}</span>}
        </div>
      </div>
    );
  }
  const showCount = vd.count > maxItems ? maxItems : vd.count;
  return (
    <div className="flex flex-wrap max-w-[350px] justify-center text-5xl gap-2">
      {Array.from({ length: showCount }).map((_, i) => (
        <span key={i} className="animate-in zoom-in duration-300">{vd.emoji}</span>
      ))}
      {vd.count > maxItems && <span className="text-2xl font-black text-zinc-400">×{Math.ceil(vd.count / maxItems)}</span>}
    </div>
  );
}

export default function GameScreen({
  question, feedback, isTransitioning, score, stage, stageDone,
  stageMax, isEndless, isFullscreen, muted,
  onAnswer, onBack, onToggleFullscreen, onToggleMute, onSpeak,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isTransitioning || !question) return;
    const keyMap: Record<string, number> = { "1": 0, "2": 1, "3": 2 };
    const idx = keyMap[e.key];
    if (idx !== undefined && question.options[idx]) {
      onAnswer(question.options[idx]);
      e.preventDefault();
    }
    if (e.key === "Escape") {
      onBack();
      e.preventDefault();
    }
  }, [isTransitioning, question, onAnswer, onBack]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const firstBtn = btnRefs.current[0];
    if (firstBtn && !isTransitioning) firstBtn.focus();
  }, [question, isTransitioning]);

  const progressPct = stageMax === Infinity ? 0 : Math.min(100, (stageDone / stageMax) * 100);
  const stageNameTh = STAGE_NAMES[isEndless ? 6 : stage]?.th ?? "";
  const stageNameEn = STAGE_NAMES[isEndless ? 6 : stage]?.en ?? "";

  return (
    <div className="space-y-6 animate-in fade-in duration-500" ref={containerRef}>
      {/* HUD */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border-2 border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30 text-zinc-500 hover:text-fuchsia-500 transition-colors"
          >
            <i aria-hidden="true" className="fi fi-sr-angle-left text-xs"></i>
            <span className="text-xs font-black uppercase tracking-widest">Menu</span>
          </button>
          <div className="w-12 h-12 rounded-2xl bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 text-xl font-black">
            {isEndless ? "∞" : stage}
          </div>
          <div>
            <div className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest leading-none">
              {isEndless ? "ENDLESS MODE" : `STAGE ${stage}`}
            </div>
            <div className="text-[10px] font-bold text-fuchsia-500 dark:text-fuchsia-400 leading-none mt-0.5">
              {stageNameEn}
            </div>
            <div className="text-[9px] text-zinc-400 dark:text-zinc-500 leading-none mt-0.5">
              {stageNameTh}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleMute}
            className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30 hover:scale-110 transition-all"
            title={muted ? "Unmute" : "Mute"}
          >
            <i className={`fi ${muted ? "fi-sr-volume-off" : "fi-sr-volume"} text-fuchsia-600 dark:text-fuchsia-400 text-lg`}></i>
          </button>
          <div className="text-right">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">SCORE</p>
            <p className="text-4xl font-black text-fuchsia-500 tracking-tighter leading-none">{score}</p>
          </div>
          <button
            onClick={onToggleFullscreen}
            className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30 hover:scale-110 transition-all"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            <i className={`fi ${isFullscreen ? "fi-sr-exit" : "fi-sr-expand"} text-fuchsia-600 dark:text-fuchsia-400 text-lg`}></i>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {!isEndless && (
        <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-fuchsia-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Main play area */}
      <div
        className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl min-h-[450px] flex flex-col items-center justify-between relative overflow-hidden"
        role="application"
        aria-label="Number Game"
      >
        <div className="text-center w-full">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="text-center">
              <span className="text-lg font-black text-fuchsia-500 px-4 py-2 bg-fuchsia-50 dark:bg-fuchsia-900/10 rounded-2xl">
                {INSTRUCTIONS[question.stageType as keyof typeof INSTRUCTIONS].en}
              </span>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold mt-1">
                {INSTRUCTIONS[question.stageType as keyof typeof INSTRUCTIONS].th}
              </p>
            </div>
            <button
              onClick={() => onSpeak(question.text.replace(/[=+\d]/g, "").trim() || question.correct, "en-US")}
              className="p-2 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-900/10 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30 text-fuchsia-500 transition-colors"
              title="Listen"
            >
              <i aria-hidden="true" className="fi fi-sr-volume text-lg"></i>
            </button>
          </div>

          <div
            className="min-h-[160px] flex items-center justify-center"
            aria-live="polite"
            aria-atomic="true"
          >
            {question.visualData ? (
              renderVisualData(question.visualData)
            ) : (
              <h3 className="text-6xl md:text-8xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight animate-in zoom-in duration-300">
                {question.text}
              </h3>
            )}
          </div>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
          {question.options.map((opt, i) => (
            <button
              key={i}
              ref={(el) => { btnRefs.current[i] = el; }}
              onClick={() => onAnswer(opt)}
              disabled={isTransitioning}
              className={`py-5 bg-zinc-50 dark:bg-zinc-800 text-xl font-black text-zinc-700 dark:text-zinc-200 rounded-3xl border-4 border-zinc-100 dark:border-zinc-700 hover:border-fuchsia-500 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 active:translate-y-2 active:shadow-none shadow-[0_8px_0_0_#e4e4e7] dark:shadow-none transition-all ${isTransitioning ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
              aria-label={`Option ${i + 1}: ${opt}`}
            >
              <span className="text-xs font-black text-zinc-400 mr-2">[{i + 1}]</span>
              {opt}
            </button>
          ))}
        </div>

        {/* Keyboard hint */}
        <p className="text-[10px] text-zinc-300 dark:text-zinc-600 font-bold mt-4 tracking-wider uppercase">
          Press 1 2 3 to answer • Esc = Menu
        </p>
      </div>

      {/* Feedback overlay */}
      {feedback.text && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in zoom-in slide-in-from-bottom-2 duration-300" role="alert">
          <div className={`px-12 py-6 rounded-[2rem] border-4 shadow-2xl transform -rotate-2 ${
            feedback.type === "correct"
              ? "bg-emerald-500 border-emerald-600 text-white"
              : "bg-rose-500 border-rose-600 text-white"
          }`}>
            <p className="text-4xl md:text-6xl font-black tracking-tighter">{feedback.text}</p>
            {feedback.showCorrect && (
              <p className="text-xl font-bold mt-2 opacity-90">
                Correct answer: {feedback.showCorrect}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
