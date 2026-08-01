'use client';

import { useState, useEffect } from 'react';
import { HIGH_SCORE_KEY } from '../constants';
import { safeGetString, safeSetString } from '@/lib/storage';
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

interface ReviewPrompt {
  weakLetters: string[];
  onStartReview: (letters: string[]) => void;
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
  reviewPrompt?: ReviewPrompt;
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
  reviewPrompt,
}: Props) {
  const [MascotComponent] = useState(() => MASCOTS[Math.floor(Math.random() * MASCOTS.length)]);
  const messagePool = isLastSubStage ? STAGE_COMPLETE_MESSAGES : MASCOT_MESSAGES;
  const [mascotMessage] = useState(
    () => messagePool[Math.floor(Math.random() * messagePool.length)],
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [isNewBest] = useState(() => {
    const prev = Number(safeGetString(HIGH_SCORE_KEY) ?? '0');
    if (score > prev) {
      safeSetString(HIGH_SCORE_KEY, String(score));
      return true;
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

  return (
    <>
      <Confetti />
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-[2.5rem] p-4 sm:p-6 shadow-2xl text-center space-y-3 sm:space-y-4 animate-in zoom-in duration-300 relative mx-auto">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-emerald-500 animate-pulse tracking-tight">
            {isLastSubStage && isLastStage ? 'Congratulations!' : 'Well Done!'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-bold">
            {isLastSubStage ? 'Stage Complete!' : 'Lesson Complete!'}
            {isLastSubStage && stageName && (
              <span className="text-violet-500 ml-2 font-black">({stageName})</span>
            )}
          </p>
        </div>

        {/* Stars */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex justify-center gap-1.5" aria-label={`${stars} out of 3 stars`}>
            {[1, 2, 3].map((s) => (
              <svg
                key={s}
                className={`w-7 h-7 sm:w-8 sm:h-8 ${s <= stars ? 'text-amber-400' : 'text-zinc-200 dark:text-zinc-700'}`}
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
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-2 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Accuracy
            </span>
            <span className={`text-xl sm:text-2xl font-black ${accuracyColor}`}>
              {accuracyPercent}%
            </span>
          </div>
          <div className="flex flex-col items-center justify-center border-x border-zinc-200 dark:border-zinc-700/60 px-1 relative">
            <span className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-wider">
              Score
            </span>
            <span className="text-xl sm:text-2xl font-black text-violet-600 dark:text-violet-400 tracking-tight">
              {score}
            </span>
            {isNewBest && (
              <span className="absolute -top-3 text-[9px] font-black bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full uppercase shadow-xs animate-bounce">
                New Best!
              </span>
            )}
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
              Best Streak
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              📈 {bestStreak}
            </span>
          </div>
        </div>

        {/* Letter Accuracy Grid (Fixed overlapping labels) */}
        <div className={`${accuracyBg} p-2.5 sm:p-3 rounded-2xl border-2 inline-block w-full`}>
          <div className="flex flex-wrap justify-center gap-2">
            {subStageLetters.map((letter) => {
              const acc = letterAccuracies[letter];
              const color =
                acc < 0
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                  : acc > 80
                    ? 'bg-emerald-500 text-white'
                    : acc >= 60
                      ? 'bg-amber-400 text-white'
                      : 'bg-rose-500 text-white';
              return (
                <div key={letter} className="flex flex-col items-center gap-0.5">
                  <span className="text-[11px] font-black text-zinc-600 dark:text-zinc-400 uppercase">
                    {letter}
                  </span>
                  <div
                    className={`w-9 h-8 sm:w-10 sm:h-9 rounded-xl flex items-center justify-center text-xs font-black shadow-xs ${color}`}
                  >
                    {acc < 0 ? '—' : `${acc}%`}
                  </div>
                </div>
              );
            })}
          </div>

          {(strengths.length > 0 || toImprove.length > 0) && (
            <div className="flex flex-wrap justify-center items-center gap-2 mt-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50 text-[11px] font-bold">
              {strengths.length > 0 && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Strong: {strengths.join(', ')}
                </span>
              )}
              {toImprove.length > 0 && (
                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Needs Practice: {toImprove.join(', ')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Mascot & Speech bubble */}
        <div className="flex items-center justify-center gap-3 py-0.5">
          <MascotComponent size={44} />
          <div className="relative bg-violet-50 dark:bg-zinc-800 px-3 py-1.5 rounded-2xl shadow-xs border border-violet-100 dark:border-violet-900/30 max-w-[220px]">
            <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-violet-50 dark:bg-zinc-800 border-l border-b border-violet-100 dark:border-violet-900/30 -rotate-45" />
            <p className="text-xs sm:text-sm font-black text-violet-600 dark:text-violet-400">
              {mascotMessage}
            </p>
          </div>
        </div>

        {reviewPrompt && reviewPrompt.weakLetters.length > 0 && (
          <div className="bg-rose-50 dark:bg-rose-900/10 p-3 sm:p-4 rounded-2xl border-2 border-rose-200 dark:border-rose-800 animate-in zoom-in duration-300">
            <p className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 mb-2">
              You missed: {reviewPrompt.weakLetters.join(', ')}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => reviewPrompt.onStartReview(reviewPrompt.weakLetters)}
                className="px-4 py-2 sm:px-5 sm:py-2.5 bg-rose-500 hover:bg-rose-400 text-white text-xs sm:text-sm font-black rounded-2xl shadow-[0_4px_0_0_#be123c] active:shadow-none active:translate-y-1 transition-all"
              >
                🎯 Practice Them
              </button>
              <span className="text-[10px] font-bold text-rose-400">or continue below</span>
            </div>
          </div>
        )}

        {/* Modal Trigger Button */}
        <div>
          <button
            onClick={() => setShowDetailsModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50 text-xs font-bold transition-all"
          >
            <span>📊 View Details & Analysis</span>
            {wrongLetters && wrongLetters.length > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] bg-rose-500 text-white rounded-full font-black">
                {wrongLetters.length}
              </span>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {!isLastSubStage && onNextLesson && (
            <button
              onClick={onNextLesson}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-base font-black rounded-2xl shadow-[0_4px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all"
            >
              Next Lesson
            </button>
          )}
          {isLastSubStage && !isLastStage && onNextStage && (
            <button
              onClick={onNextStage}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-base font-black rounded-2xl shadow-[0_4px_0_0_#d97706] active:shadow-none active:translate-y-1 transition-all"
            >
              Next Stage
            </button>
          )}
          <button
            onClick={onRestart}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-base font-black rounded-2xl shadow-[0_4px_0_0_#5b21b6] active:shadow-none active:translate-y-1 transition-all"
          >
            Try Again
          </button>
          <button
            onClick={onBackToMenu}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm text-zinc-500 hover:text-violet-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold transition-all"
          >
            Back to Map
          </button>
        </div>
      </div>

      {/* Details & Analysis Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/10 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 shadow-2xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800 space-y-4 max-h-[85vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-lg font-black text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                <span>📊</span> Lesson Analysis & Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-bold text-sm transition-colors"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            {/* Analysis text box */}
            <div className="bg-violet-50 dark:bg-violet-900/10 p-3.5 rounded-2xl border border-violet-100 dark:border-violet-900/30 space-y-1">
              <p className="text-xs sm:text-sm font-bold text-violet-900 dark:text-violet-200">
                {analysis.english}
              </p>
              <p className="text-xs sm:text-sm font-bold text-violet-600 dark:text-violet-400">
                {analysis.thai}
              </p>
            </div>

            {/* Letters to Practice */}
            {wrongLetters && wrongLetters.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                  Letters to Practice ({wrongLetters.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 text-sm font-black"
                      >
                        {letter}
                        {count > 1 && (
                          <span className="text-[10px] text-rose-400 font-bold">x{count}</span>
                        )}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Stage Summary Table */}
            {isLastSubStage && subStageSummaries && subStageSummaries.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Stage Summary
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                        <th className="text-left py-1.5 pr-2">Sub-Stage</th>
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
                          <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800/50">
                            <td className="text-left py-1.5 pr-2 font-bold">{ss.name}</td>
                            <td className="text-center px-1 text-amber-400">
                              {'★'.repeat(ss.stars)}
                              {'☆'.repeat(3 - ss.stars)}
                            </td>
                            <td className="text-center px-1 font-bold">{ss.accuracy}%</td>
                            <td className="text-right pl-2 text-rose-500 font-medium">
                              {errors || '—'}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="border-t-2 border-zinc-200 dark:border-zinc-700 font-black text-zinc-800 dark:text-zinc-200">
                        <td className="text-left py-1.5 pr-2">Total</td>
                        <td className="text-center px-1 text-amber-400">
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

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
