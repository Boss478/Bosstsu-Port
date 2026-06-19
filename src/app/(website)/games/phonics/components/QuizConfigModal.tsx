"use client";

import { useState } from "react";

export type QuizDirection = "word-to-ipa" | "ipa-to-word" | "mixed";
export type QuizMode = "practice" | "endless" | "timer" | "hardcore";
export type QuizDifficulty = "normal" | "difficult";

export interface QuizConfig {
  direction: QuizDirection;
  mode: QuizMode;
  difficulty: QuizDifficulty;
  roundLength: number;
  lives: number;
  timeLimit: number;
}

interface QuizConfigModalProps {
  onStart: (config: QuizConfig) => void;
  onClose: () => void;
}

const DIRECTIONS: { value: QuizDirection; label: string; desc: string }[] = [
  { value: "word-to-ipa", label: "WORD → IPA", desc: "See a word, build its IPA" },
  { value: "ipa-to-word", label: "IPA → WORD", desc: "See IPA, build the word" },
  { value: "mixed", label: "Mixed", desc: "Both types randomly" },
];

const MODES: { value: QuizMode; label: string; desc: string; icon: string }[] = [
  { value: "practice", label: "Practice", desc: "No pressure, learn at your pace", icon: "fi-sr-book-open-cover" },
  { value: "endless", label: "Endless", desc: "Keep going until you run out of lives", icon: "fi-sr-infinity" },
  { value: "timer", label: "Timed", desc: "Race against the clock", icon: "fi-sr-clock" },
  { value: "hardcore", label: "Hardcore", desc: "One mistake and it's over", icon: "fi-sr-flame" },
];

export function QuizConfigModal({ onStart, onClose }: QuizConfigModalProps) {
  const [direction, setDirection] = useState<QuizDirection>("mixed");
  const [mode, setMode] = useState<QuizMode>("practice");
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("normal");
  const [roundLength, setRoundLength] = useState(10);
  const [lives, setLives] = useState(3);
  const [timeLimit, setTimeLimit] = useState(60);

  const handleStart = () => {
    onStart({ direction, mode, difficulty, roundLength, lives, timeLimit });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 border border-white/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-2xl space-y-5 transform scale-100 transition-transform duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <i className="fi fi-sr-gamepad text-[#C8A44E] text-sm" />
            Quiz Setup
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <i className="fi fi-sr-cross text-[10px]" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
              Question Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DIRECTIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDirection(d.value)}
                  className={`px-3 py-2.5 rounded-xl text-center transition-all cursor-pointer ${
                    direction === d.value
                      ? "bg-[#C8A44E]/10 dark:bg-[#C8A44E]/20 border border-[#C8A44E]"
                      : "bg-white/50 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-700/80"
                  }`}
                >
                  <span className={`text-[10px] font-extrabold block ${direction === d.value ? "text-[#C8A44E]" : "text-slate-700 dark:text-slate-200"}`}>
                    {d.label}
                  </span>
                  <span className="text-[7px] text-slate-400 dark:text-slate-500 mt-0.5 block">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
              Game Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`px-3 py-3 rounded-xl text-center transition-all cursor-pointer ${
                    mode === m.value
                      ? "bg-[#C8A44E]/10 dark:bg-[#C8A44E]/20 border border-[#C8A44E]"
                      : "bg-white/50 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-700/80"
                  }`}
                >
                  <i className={`fi ${m.icon} text-sm ${mode === m.value ? "text-[#C8A44E]" : "text-slate-500 dark:text-slate-400"}`} />
                  <span className={`text-[10px] font-extrabold block mt-1 ${mode === m.value ? "text-[#C8A44E]" : "text-slate-700 dark:text-slate-200"}`}>
                    {m.label}
                  </span>
                  <span className="text-[7px] text-slate-400 dark:text-slate-500 mt-0.5 block">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
              Difficulty
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDifficulty("normal")}
                className={`px-3 py-2.5 rounded-xl text-center transition-all cursor-pointer ${
                  difficulty === "normal"
                    ? "bg-[#C8A44E]/10 dark:bg-[#C8A44E]/20 border border-[#C8A44E]"
                    : "bg-white/50 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-700/80"
                }`}
              >
                <span className={`text-[10px] font-extrabold block ${difficulty === "normal" ? "text-[#C8A44E]" : "text-slate-700 dark:text-slate-200"}`}>
                  Normal
                </span>
                <span className="text-[7px] text-slate-400 dark:text-slate-500 mt-0.5 block">Show word hints</span>
              </button>
              <button
                onClick={() => setDifficulty("difficult")}
                className={`px-3 py-2.5 rounded-xl text-center transition-all cursor-pointer ${
                  difficulty === "difficult"
                    ? "bg-[#C8A44E]/10 dark:bg-[#C8A44E]/20 border border-[#C8A44E]"
                    : "bg-white/50 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-700/80"
                }`}
              >
                <span className={`text-[10px] font-extrabold block ${difficulty === "difficult" ? "text-[#C8A44E]" : "text-slate-700 dark:text-slate-200"}`}>
                  Difficult
                </span>
                <span className="text-[7px] text-slate-400 dark:text-slate-500 mt-0.5 block">IPA only, no hints</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 p-3.5">
            {mode === "practice" && (
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                  Round Length: {roundLength} questions
                </label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={roundLength}
                  onChange={(e) => setRoundLength(Number(e.target.value))}
                  className="w-full accent-[#C8A44E]"
                />
                <div className="flex justify-between text-[8px] text-slate-400 font-bold px-0.5">
                  <span>5</span>
                  <span>50</span>
                </div>
              </div>
            )}
            {mode === "endless" && (
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                  Lives: {lives}
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={lives}
                  onChange={(e) => setLives(Number(e.target.value))}
                  className="w-full accent-[#C8A44E]"
                />
                <div className="flex justify-between text-[8px] text-slate-400 font-bold px-0.5">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
            )}
            {mode === "timer" && (
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                  Time Limit: {timeLimit}s
                </label>
                <input
                  type="range"
                  min={30}
                  max={300}
                  step={15}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="w-full accent-[#C8A44E]"
                />
                <div className="flex justify-between text-[8px] text-slate-400 font-bold px-0.5">
                  <span>30s</span>
                  <span>300s</span>
                </div>
              </div>
            )}
            {mode === "hardcore" && (
              <p className="text-[10px] text-rose-500 font-bold text-center">
                One wrong answer ends the quiz. Are you ready?
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#C8A44E] to-[#D4B06A] text-white text-xs font-extrabold tracking-wider uppercase shadow-lg hover:shadow-xl hover:from-[#D4B06A] hover:to-[#C8A44E] active:scale-[0.97] transition-all cursor-pointer"
        >
          Start Quiz
        </button>
      </div>
    </div>
  );
}
