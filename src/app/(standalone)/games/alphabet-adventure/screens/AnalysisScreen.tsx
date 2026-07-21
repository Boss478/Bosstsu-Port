'use client';

import type { LetterTracker } from '../types';
import { generateAnalysis, type SessionLetterStats } from '../analysis';

interface Props {
  totalScore: number;
  stagesCompleted: number;
  totalStages: number;
  letterTracker: Record<string, LetterTracker>;
  onBack: () => void;
}

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function AnalysisScreen({
  totalScore,
  stagesCompleted,
  totalStages,
  letterTracker,
  onBack,
}: Props) {
  const allSessionStats: Record<string, SessionLetterStats> = {};
  let totalCorrect = 0;
  let totalAttempts = 0;
  for (const [letter, lt] of Object.entries(letterTracker)) {
    allSessionStats[letter] = { correct: lt.correct, wrong: lt.total - lt.correct };
    totalCorrect += lt.correct;
    totalAttempts += lt.total;
  }

  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const activeLetters = ALL_LETTERS.filter((l) => letterTracker[l] && letterTracker[l].total > 0);
  const analysis = generateAnalysis(overallAccuracy, allSessionStats, activeLetters);

  const letterAccuracies: Record<string, number> = {};
  const strengths: string[] = [];
  const toImprove: string[] = [];
  for (const letter of ALL_LETTERS) {
    const lt = letterTracker[letter];
    if (!lt || lt.total === 0) {
      letterAccuracies[letter] = -1;
      continue;
    }
    const pct = Math.round((lt.correct / lt.total) * 100);
    letterAccuracies[letter] = pct;
    if (pct > 80) strengths.push(letter);
    else if (pct < 60) toImprove.push(letter);
  }

  const accuracyColor =
    overallAccuracy >= 90
      ? 'text-emerald-500'
      : overallAccuracy >= 70
        ? 'text-amber-500'
        : 'text-rose-500';

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] p-5 md:p-8 shadow-2xl text-center space-y-4 md:space-y-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-center gap-2">
          <i className="fi fi-sr-chart-simple text-2xl text-violet-500" />
          <h1 className="text-2xl sm:text-3xl font-black text-violet-600 dark:text-violet-400">
            Analysis
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-violet-50 dark:bg-violet-900/10 p-3 rounded-2xl border border-violet-100 dark:border-violet-900/30">
            <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">Score</p>
            <p className="text-2xl font-black text-violet-600 dark:text-violet-400">{totalScore}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/30">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Progress</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {stagesCompleted}/{totalStages}
            </p>
          </div>
        </div>

        {totalAttempts > 0 && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 sm:p-4 rounded-3xl border border-zinc-200 dark:border-zinc-700">
            <p className={`text-3xl font-black ${accuracyColor}`}>{overallAccuracy}%</p>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
              Overall Accuracy
            </p>
          </div>
        )}

        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 sm:p-4 rounded-3xl border-2 border-emerald-100 dark:border-emerald-900/30">
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
            {ALL_LETTERS.map((letter) => {
              const acc = letterAccuracies[letter];
              if (acc < 0) {
                return (
                  <div
                    key={letter}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 text-[10px] font-black"
                  >
                    {letter}
                  </div>
                );
              }
              const color =
                acc > 80
                  ? 'bg-emerald-500 text-white'
                  : acc >= 60
                    ? 'bg-amber-400 text-white'
                    : 'bg-rose-500 text-white';
              return (
                <div
                  key={letter}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] font-black"
                >
                  <div className={`w-full h-full rounded-lg flex items-center justify-center ${color}`}>
                    {acc}%
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mt-2">
            Per-letter accuracy (ABCDEFGHIJKLMNOPQRSTUVWXYZ)
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {strengths.length > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 px-3 py-2 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">
                Strong
              </p>
              <div className="flex flex-wrap gap-1">
                {strengths.map((l) => (
                  <span
                    key={l}
                    className="text-sm font-black text-emerald-600 dark:text-emerald-400"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}
          {toImprove.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-900/10 px-3 py-2 rounded-2xl border border-rose-200 dark:border-rose-800">
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">
                To Improve
              </p>
              <div className="flex flex-wrap gap-1">
                {toImprove.map((l) => (
                  <span
                    key={l}
                    className="text-sm font-black text-rose-600 dark:text-rose-400"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {totalAttempts > 0 && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 sm:p-4 rounded-3xl border border-zinc-200 dark:border-zinc-700">
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              {analysis.english}
            </p>
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mt-1">
              {analysis.thai}
            </p>
          </div>
        )}

        {totalAttempts === 0 && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-700">
            <p className="text-sm font-bold text-zinc-400">No data yet. Play some stages first!</p>
            <p className="text-sm font-bold text-zinc-300 mt-1">ยังไม่มีข้อมูล ลองเล่นเกมก่อน!</p>
          </div>
        )}

        <button
          onClick={onBack}
          className="px-6 py-2.5 sm:px-8 sm:py-3 bg-violet-600 text-white text-sm sm:text-base font-black rounded-3xl shadow-[0_8px_0_0_#5b21b6] active:shadow-none active:translate-y-2 transition-all"
        >
          Back
        </button>
      </div>
    </div>
  );
}
