'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { QuizConfig, QuizDirection, QuizMode } from '../types';

const LS_KEY = 'phonics-challenge-quiz-types';

function getSavedDirections(): QuizDirection[] {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as QuizDirection[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }
  return ['word-to-ipa'];
}

const ALL_DIRECTIONS: { value: QuizDirection; label: string; desc: string }[] = [
  { value: 'word-to-ipa', label: 'Word → IPA', desc: 'Build IPA from a word' },
  { value: 'ipa-to-word', label: 'IPA → Word', desc: 'Find the word from IPA' },
  { value: 'word-to-def', label: 'Word → Def', desc: 'Match word to definition' },
  { value: 'def-to-word', label: 'Def → Word', desc: 'Match definition to word' },
  { value: 'synonyms', label: 'Synonyms', desc: 'Find the synonym' },
  { value: 'stress', label: 'Stress IPA', desc: 'Identify stress pattern' },
  { value: 'antonyms', label: 'Antonyms', desc: 'Find the antonym' },
];

const MODES: { value: QuizMode; label: string; desc: string; icon: string }[] = [
  { value: 'number', label: 'Number', desc: 'Fixed number of questions', icon: 'fi-sr-tally' },
  { value: 'timer', label: 'Timer', desc: 'Per-question countdown', icon: 'fi-sr-clock' },
  { value: 'hardcore', label: 'Hardcore', desc: 'One mistake ends it', icon: 'fi-sr-flame' },
  { value: 'life', label: 'Life', desc: 'Limited hearts', icon: 'fi-sr-heart' },
  { value: 'streak', label: 'Streak', desc: 'Endless, 3 lives', icon: 'fi-sr-infinity' },
  {
    value: 'speed-run',
    label: 'Speed Run',
    desc: 'Beat the global clock',
    icon: 'fi-sr-stopwatch',
  },
];

interface Props {
  onSubmit: (config: QuizConfig) => void;
  onClose: () => void;
}

export function ChallengeConfigModal({ onSubmit, onClose }: Props) {
  const trapRef = useFocusTrap(true);
  const [directions, setDirections] = useState<QuizDirection[]>(getSavedDirections);
  const [mode, setMode] = useState<QuizMode>('number');
  const [roundLength, setRoundLength] = useState(15);
  const [lives, setLives] = useState(3);
  const [timerPerQuestion, setTimerPerQuestion] = useState(30);
  const [speedRunDuration, setSpeedRunDuration] = useState(60);
  const [speedRunBonus, setSpeedRunBonus] = useState(2);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KEY, JSON.stringify(directions));
    }
  }, [directions]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const toggleDirection = (dir: QuizDirection) => {
    setDirections((prev) => (prev.includes(dir) ? prev.filter((d) => d !== dir) : [...prev, dir]));
  };

  const handleSubmit = () => {
    onSubmit({
      directions: directions.length > 0 ? directions : ['word-to-ipa'],
      mode,
      roundLength,
      lives,
      timeLimit: timerPerQuestion,
      timerPerQuestion,
      speedRunDuration,
      speedRunBonus,
    });
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-config-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3
            id="challenge-config-title"
            className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2"
          >
            <i className="fi fi-sr-gamepad text-[#6366F1] text-sm" aria-hidden="true" />
            Challenge Quiz Setup
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <i className="fi fi-sr-cross text-[10px]" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Question Types */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
              Question Types ({directions.length} selected)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_DIRECTIONS.map((d) => {
                const active = directions.includes(d.value);
                return (
                  <button
                    key={d.value}
                    onClick={() => toggleDirection(d.value)}
                    className={`px-3 py-2.5 rounded-xl text-center transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500'
                        : 'bg-white/50 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-700/80'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-extrabold block ${active ? 'text-indigo-500' : 'text-slate-700 dark:text-slate-200'}`}
                    >
                      {d.label}
                    </span>
                    <span className="text-[7px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                      {d.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Game Mode */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
              Game Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`px-2 py-3 rounded-xl text-center transition-all cursor-pointer ${
                    mode === m.value
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500'
                      : 'bg-white/50 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-700/80'
                  }`}
                >
                  <i
                    className={`fi ${m.icon} text-sm ${mode === m.value ? 'text-indigo-500' : 'text-slate-500 dark:text-slate-400'}`}
                  />
                  <span
                    className={`text-[9px] font-extrabold block mt-1 ${mode === m.value ? 'text-indigo-500' : 'text-slate-700 dark:text-slate-200'}`}
                  >
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode-specific config */}
          <div className="space-y-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 p-3.5">
            {mode === 'number' && (
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                  Questions: {roundLength}
                </label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={roundLength}
                  onChange={(e) => setRoundLength(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-[8px] text-slate-400 font-bold px-0.5">
                  <span>5</span>
                  <span>50</span>
                </div>
              </div>
            )}

            {mode === 'timer' && (
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                  Time per question: {timerPerQuestion}s
                </label>
                <input
                  type="range"
                  min={15}
                  max={300}
                  step={15}
                  value={timerPerQuestion}
                  onChange={(e) => setTimerPerQuestion(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-[8px] text-slate-400 font-bold px-0.5">
                  <span>15s</span>
                  <span>300s</span>
                </div>
              </div>
            )}

            {mode === 'hardcore' && (
              <p className="text-[10px] text-rose-500 font-bold text-center">
                One wrong answer ends the quiz. Are you ready?
              </p>
            )}

            {mode === 'life' && (
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                  Hearts: {lives}
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={lives}
                  onChange={(e) => setLives(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-[8px] text-slate-400 font-bold px-0.5">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
            )}

            {mode === 'streak' && (
              <p className="text-[10px] text-indigo-500 font-bold text-center">
                Endless mode — 3 wrong answers ends the quiz.
              </p>
            )}

            {mode === 'speed-run' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                    Duration: {speedRunDuration}s
                  </label>
                  <input
                    type="range"
                    min={30}
                    max={180}
                    step={15}
                    value={speedRunDuration}
                    onChange={(e) => setSpeedRunDuration(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold px-0.5">
                    <span>30s</span>
                    <span>180s</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                    Bonus per correct: +{speedRunBonus}s
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={5}
                    step={0.5}
                    value={speedRunBonus}
                    onChange={(e) => setSpeedRunBonus(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold px-0.5">
                    <span>+0.5s</span>
                    <span>+5s</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={directions.length === 0}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-extrabold tracking-wider uppercase shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-700 active:scale-[0.97] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Challenge
        </button>
      </div>
    </div>,
    document.body,
  );
}
