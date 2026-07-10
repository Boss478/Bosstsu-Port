'use client';

import { useState, useEffect } from 'react';
import { HIGH_SCORE_KEY } from '../constants';
import { generateAnalysis } from '../analysis';
import CaptainAlph from '../characters/CaptainAlph';
import Mermaid from '../characters/Mermaid';
import TreasureMonster from '../characters/TreasureMonster';

const MASCOTS = [CaptainAlph, Mermaid, TreasureMonster];
const MASCOT_MESSAGES = [
  'Amazing work!',
  "You're on fire!",
  'Keep it up!',
  'Brilliant!',
  'Fantastic!',
  'Super star!',
  'Incredible!',
  'Way to go!',
  'Awesome job!',
];
const STAGE_COMPLETE_MESSAGES = [
  'Stage Complete! You nailed it!',
  'One stage down! Keep going!',
  "You're unstoppable!",
  'Brilliant work!',
  'Stage conquered!',
  'Fantastic job!',
  'On to the next!',
];

interface SubStageSummary {
  name: string;
  stars: number;
  accuracy: number;
  sessionLetterStats: Record<string, { correct: number; wrong: number }>;
}

interface Props {
  score: number;
  stars: number;
  wrongLetters?: string[];
  stageName?: string;
  isLastSubStage: boolean;
  isLastStage: boolean;
  onRestart: () => void;
  onBackToMenu: () => void;
  onNextLesson?: () => void;
  onNextStage?: () => void;
  accuracyPercent: number;
  sessionLetterStats: Record<string, { correct: number; wrong: number }>;
  bestStreak: number;
  subStageLetters: string[];
  subStageSummaries?: SubStageSummary[];
}

function Confetti() {
  useEffect(() => {
    const container = document.getElementById('confetti-container');
    if (!container) return;

    const colors = ['#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#ef4444'];
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < 60; i++) {
      const el = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const size = Math.random() * 10 + 5;
      const duration = Math.random() * 2 + 2;
      const delay = Math.random() * 3;

      el.style.cssText = `
        position: absolute;
        top: -10px;
        left: ${left}%;
        width: ${size}px;
        height: ${size * 0.6}px;
        background: ${color};
        border-radius: 2px;
        animation: confetti-fall ${duration}s ease-out ${delay}s forwards;
        transform: rotate(${Math.random() * 360}deg);
      `;
      container.appendChild(el);
      particles.push(el);
    }

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, []);

  return (
    <div
      id="confetti-container"
      className="fixed inset-0 pointer-events-none overflow-hidden z-50"
    />
  );
}

export default function VictoryScreen({
  score,
  stars,
  wrongLetters,
  stageName,
  isLastSubStage,
  isLastStage,
  onRestart,
  onBackToMenu,
  onNextLesson,
  onNextStage,
  accuracyPercent,
  sessionLetterStats,
  bestStreak,
  subStageLetters,
  subStageSummaries,
}: Props) {
  const [MascotComponent] = useState(() => MASCOTS[Math.floor(Math.random() * MASCOTS.length)]);
  const messagePool = isLastSubStage ? STAGE_COMPLETE_MESSAGES : MASCOT_MESSAGES;
  const [mascotMessage] = useState(
    () => messagePool[Math.floor(Math.random() * messagePool.length)],
  );
  const [isNewBest] = useState(() => {
    if (typeof window !== 'undefined') {
      const key = HIGH_SCORE_KEY;
      const prev = Number(localStorage.getItem(key) ?? '0');
      if (score > prev) {
        localStorage.setItem(key, String(score));
        return true;
      }
    }
    return false;
  });

  const letterAccuracies: Record<string, number> = {};
  for (const letter of subStageLetters) {
    const stats = sessionLetterStats[letter];
    if (stats) {
      const total = stats.correct + stats.wrong;
      letterAccuracies[letter] = total > 0 ? Math.round((stats.correct / total) * 100) : -1;
    } else {
      letterAccuracies[letter] = -1;
    }
  }

  const strengths = subStageLetters.filter((l) => letterAccuracies[l] > 80);
  const toImprove = subStageLetters.filter(
    (l) => letterAccuracies[l] >= 0 && letterAccuracies[l] < 60,
  );

  const analysis = generateAnalysis(accuracyPercent, sessionLetterStats, subStageLetters);

  const stageTotalSubs = subStageSummaries?.length ?? 0;
  const stageTotalAccuracy =
    stageTotalSubs > 0
      ? Math.round(subStageSummaries!.reduce((s, ss) => s + ss.accuracy, 0) / stageTotalSubs)
      : 0;
  const stageTotalStars =
    stageTotalSubs > 0
      ? Math.round(subStageSummaries!.reduce((s, ss) => s + ss.stars, 0) / stageTotalSubs)
      : 0;

  const accuracyColor =
    accuracyPercent >= 90
      ? 'text-emerald-500'
      : accuracyPercent >= 70
        ? 'text-amber-500'
        : 'text-rose-500';
  const accuracyBg =
    accuracyPercent >= 90
      ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
      : accuracyPercent >= 70
        ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
        : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800';
  const gaugeConic = `conic-gradient(${
    accuracyPercent >= 90 ? '#10b981' : accuracyPercent >= 70 ? '#f59e0b' : '#f43f5e'
  } ${accuracyPercent}%, #e4e4e7 ${accuracyPercent}%)`;

  return (
    <>
      <Confetti />
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-3 sm:p-5 md:p-8 shadow-2xl text-center space-y-2 sm:space-y-3 md:space-y-5 animate-in zoom-in duration-500 relative max-h-[80vh] overflow-y-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-emerald-500 animate-pulse tracking-tight">
          {isLastSubStage && isLastStage ? 'Congratulations!' : 'Well Done!'}
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 font-bold">
          {isLastSubStage ? 'Stage Complete!' : 'Lesson Complete!'}
        </p>
        {isLastSubStage && stageName && (
          <p className="text-xs sm:text-sm font-bold text-violet-500 uppercase tracking-widest">
            {stageName}
          </p>
        )}

        <div
          className="flex justify-center gap-1 sm:gap-2 py-1 sm:py-2"
          aria-label={`${stars} out of 3 stars`}
        >
          {[1, 2, 3].map((s) => (
            <svg
              key={s}
              className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${s <= stars ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>

        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">
          ⭐ ≥70% · ⭐⭐ ≥90% · ⭐⭐⭐ Perfect
        </p>

        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-lg sm:text-xl md:text-2xl font-black shadow-inner"
            style={{ background: gaugeConic }}
          >
            <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center">
              <span className={`${accuracyColor}`}>{accuracyPercent}%</span>
            </div>
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Accuracy</p>
            <p className={`text-2xl sm:text-3xl font-black ${accuracyColor}`}>{accuracyPercent}%</p>
          </div>
        </div>

        <div className="bg-violet-50 dark:bg-violet-900/10 p-4 sm:p-5 md:p-6 rounded-3xl inline-block border-2 border-violet-100 dark:border-violet-900/30">
          <p className="text-xs sm:text-sm font-bold text-violet-600/60 dark:text-violet-400/60 uppercase tracking-widest mb-1">
            Score
          </p>
          <p className="text-4xl sm:text-5xl md:text-6xl font-black text-violet-600 dark:text-violet-400 tracking-tighter">
            {score}
          </p>
        </div>

        {bestStreak > 0 && (
          <div className="flex items-center justify-center gap-2">
            <i className="fi fi-sr-arrow-trend-up text-emerald-500 text-xl" />
            <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
              Best Streak: {bestStreak}
            </span>
          </div>
        )}

        <div className={`${accuracyBg} p-3 sm:p-4 rounded-3xl border-2 inline-block min-w-[200px]`}>
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
            {subStageLetters.map((letter) => {
              const acc = letterAccuracies[letter];
              if (acc < 0) {
                return (
                  <div
                    key={letter}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 text-xs font-black"
                  >
                    —
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
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs font-black relative group"
                >
                  <div
                    className={`w-full h-full rounded-lg flex items-center justify-center ${color}`}
                  >
                    {acc}%
                  </div>
                  <div className="absolute -top-1 -right-1 text-[9px] font-bold text-zinc-400 dark:text-zinc-500">
                    {letter}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {strengths.length > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 px-3 py-2 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">
                Strong
              </p>
              <div className="flex flex-wrap gap-1">
                {strengths.map((l) => (
                  <span
                    key={l}
                    className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400"
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
                    className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 sm:p-4 rounded-3xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{analysis.english}</p>
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mt-1">{analysis.thai}</p>
        </div>

        {isNewBest && (
          <div className="inline-block bg-amber-100 dark:bg-amber-900/30 px-4 py-2 rounded-2xl border-4 border-amber-400 animate-in zoom-in">
            <p className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400">
              NEW HIGH SCORE!
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 sm:gap-4 py-1 sm:py-2">
          <MascotComponent size={64} />
          <div className="relative bg-white dark:bg-zinc-800 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-lg border-2 border-violet-100 dark:border-violet-900/30 max-w-[200px]">
            <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-zinc-800 border-l-2 border-b-2 border-violet-100 dark:border-violet-900/30 -rotate-45" />
            <p className="text-sm sm:text-base font-black text-violet-600 dark:text-violet-400">
              {mascotMessage}
            </p>
          </div>
        </div>

        {wrongLetters && wrongLetters.length > 0 && (
          <div className="pt-1 sm:pt-2">
            <p className="text-[10px] sm:text-xs font-bold text-rose-500 uppercase tracking-widest mb-1 sm:mb-2">
              Letters to Practice
            </p>
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
              {Object.entries(
                wrongLetters.reduce(
                  (acc, l) => {
                    acc[l] = (acc[l] || 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>,
                ),
              )
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([letter, count]) => (
                  <span
                    key={letter}
                    className="inline-flex items-center gap-0.5 px-2 py-1 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm sm:text-base md:text-lg font-black"
                  >
                    {letter}
                    {count > 1 && (
                      <span className="text-[10px] text-rose-400 dark:text-rose-500 font-bold">
                        x{count}
                      </span>
                    )}
                  </span>
                ))}
            </div>
          </div>
        )}

        {isLastSubStage && subStageSummaries && subStageSummaries.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
              Stage Summary
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                    <th className="text-left py-1 pr-2">Sub-Stage</th>
                    <th className="text-center px-1">Stars</th>
                    <th className="text-center px-1">Accuracy</th>
                    <th className="text-right pl-2">Top Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {subStageSummaries.map((ss, i) => {
                    const errors = Object.entries(ss.sessionLetterStats)
                      .filter(([, st]) => st.wrong > 0)
                      .sort(([, a], [, b]) => b.wrong - a.wrong)
                      .slice(0, 3)
                      .map(([l]) => l)
                      .join(', ');
                    return (
                      <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="text-left py-1 pr-2 font-bold">{ss.name}</td>
                        <td className="text-center px-1">
                          {'★'.repeat(ss.stars)}
                          {'☆'.repeat(3 - ss.stars)}
                        </td>
                        <td className="text-center px-1">{ss.accuracy}%</td>
                        <td className="text-right pl-2 text-rose-500">{errors || '—'}</td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-zinc-300 dark:border-zinc-600 font-black text-zinc-700 dark:text-zinc-300">
                    <td className="text-left py-1 pr-2">Total</td>
                    <td className="text-center px-1">
                      {'★'.repeat(stageTotalStars)}
                      {'☆'.repeat(3 - stageTotalStars)}
                    </td>
                    <td className="text-center px-1">{stageTotalAccuracy}%</td>
                    <td className="text-right pl-2">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-3 pt-2 sm:pt-3 md:pt-4">
        {!isLastSubStage && onNextLesson && (
          <button
            onClick={onNextLesson}
            className="px-6 py-2.5 sm:px-8 sm:py-3 md:px-10 md:py-4 bg-emerald-500 text-white text-base sm:text-lg md:text-xl font-black rounded-3xl shadow-[0_8px_0_0_#059669] active:shadow-none active:translate-y-2 transition-all animate-in zoom-in"
          >
            Next Lesson
          </button>
        )}
        {isLastSubStage && !isLastStage && onNextStage && (
          <button
            onClick={onNextStage}
            className="px-6 py-2.5 sm:px-8 sm:py-3 md:px-10 md:py-4 bg-amber-500 text-white text-base sm:text-lg md:text-xl font-black rounded-3xl shadow-[0_8px_0_0_#d97706] active:shadow-none active:translate-y-2 transition-all animate-in zoom-in"
          >
            Next Stage
          </button>
        )}
        <button
          onClick={onRestart}
          className="px-6 py-2.5 sm:px-8 sm:py-3 md:px-10 md:py-4 bg-violet-600 text-white text-base sm:text-lg md:text-xl font-black rounded-3xl shadow-[0_8px_0_0_#5b21b6] active:shadow-none active:translate-y-2 transition-all"
        >
          Try Again
        </button>
        <button
          onClick={onBackToMenu}
          className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-sm sm:text-base text-zinc-500 hover:text-violet-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold transition-all"
        >
          Back to Map
        </button>
      </div>
    </>
  );
}
