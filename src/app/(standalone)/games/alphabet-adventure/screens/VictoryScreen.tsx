'use client';

import { useState, useEffect } from 'react';
import { HIGH_SCORE_KEY, PROGRESS_KEY, LEVELS } from '../constants';

interface Props {
  score: number;
  stageStars: number[];
  wrongLetters?: string[];
  onRestart: () => void;
  onBackToMenu: () => void;
}

function StarDisplay({ count }: { count: number }) {
  return (
    <div className="flex justify-center gap-2">
      {[1, 2, 3].map((star) => (
        <i
          key={star}
          className={`fi fi-sr-star text-3xl ${
            star <= count ? 'text-amber-400' : 'text-zinc-200 dark:text-zinc-700'
          } transition-all duration-500`}
        />
      ))}
    </div>
  );
}

function Confetti() {
  useEffect(() => {
    const container = document.getElementById('confetti-container');
    if (!container) return;

    const colors = ['#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#ef4444'];
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < 60; i++) {
      const el = document.createElement('div');
      el.className = 'absolute w-2 h-2 rounded-sm';
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      el.style.left = Math.random() * 100 + '%';
      el.style.top = '-10px';
      el.style.opacity = String(0.7 + Math.random() * 0.3);
      el.style.transform = `rotate(${Math.random() * 360}deg)`;
      el.style.animation = `confetti-fall ${2 + Math.random() * 3}s linear forwards`;
      el.style.animationDelay = `${Math.random() * 1.5}s`;
      container.appendChild(el);
      particles.push(el);
    }

    return () => particles.forEach((p) => p.remove());
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
  stageStars,
  wrongLetters,
  onRestart,
  onBackToMenu,
}: Props) {
  const [isNewBest] = useState(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PROGRESS_KEY);
      const key = HIGH_SCORE_KEY;
      const prev = Number(localStorage.getItem(key) ?? '0');
      if (score > prev) {
        localStorage.setItem(key, String(score));
        return true;
      }
    }
    return false;
  });

  const totalStars = stageStars.reduce((sum, s) => sum + s, 0);

  return (
    <>
      <Confetti />
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-3 sm:p-5 md:p-8 shadow-2xl text-center space-y-2 sm:space-y-3 md:space-y-5 animate-in zoom-in duration-500 relative">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-emerald-500 animate-pulse tracking-tight">
          Amazing!
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 font-bold">
          คุณพิชิตเกาะตัวอักษรสำเร็จแล้ว!
        </p>

        <div className="text-5xl sm:text-6xl md:text-7xl rotate-12 py-1 sm:py-2 drop-shadow-2xl">
          <i aria-hidden="true" className="fi fi-sr-trophy text-amber-500 dark:text-amber-400"></i>
        </div>

        {isNewBest && (
          <div className="inline-block bg-amber-100 dark:bg-amber-900/30 px-4 py-2 rounded-2xl border-4 border-amber-400 animate-in zoom-in">
            <p className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400">
              NEW HIGH SCORE!
            </p>
          </div>
        )}

        <div className="bg-violet-50 dark:bg-violet-900/10 p-4 sm:p-5 md:p-6 rounded-3xl inline-block border-2 border-violet-100 dark:border-violet-900/30">
          <p className="text-xs sm:text-sm font-bold text-violet-600/60 dark:text-violet-400/60 uppercase tracking-widest mb-1">
            Final Score
          </p>
          <p className="text-4xl sm:text-5xl md:text-6xl font-black text-violet-600 dark:text-violet-400 tracking-tighter">
            {score}
          </p>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <p className="text-xs sm:text-sm font-bold text-zinc-500 dark:text-zinc-400">
            Level Stars
          </p>
          <div className="flex flex-col gap-1 sm:gap-2">
            {stageStars.map((stars, index) => {
              const levelNum = index + 1;
              const levelConfig = LEVELS[levelNum];
              return (
                <div key={levelNum} className="flex items-center justify-center gap-2 sm:gap-3">
                  <span className="text-[10px] sm:text-xs font-bold text-zinc-500 dark:text-zinc-400 w-20 sm:w-24 md:w-32 text-right">
                    {levelConfig?.name || `Level ${levelNum}`}
                  </span>
                  <StarDisplay count={stars} />
                </div>
              );
            })}
          </div>
          <div className="pt-1 sm:pt-2 border-t-2 border-violet-200 dark:border-violet-800">
            <p className="text-[10px] sm:text-xs font-bold text-violet-500 dark:text-violet-400">
              Total: {totalStars} / {stageStars.length * 3} Stars
            </p>
          </div>
          {wrongLetters && wrongLetters.length > 0 && (
            <div className="pt-1 sm:pt-2">
              <p className="text-[10px] sm:text-xs font-bold text-rose-500 uppercase tracking-widest mb-1 sm:mb-2">
                Letters to Practice
              </p>
              <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                {[...new Set(wrongLetters)].sort().map((letter) => (
                  <span
                    key={letter}
                    className="inline-block w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm sm:text-base md:text-lg font-black flex items-center justify-center"
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-3 pt-2 sm:pt-3 md:pt-4">
          <button
            onClick={onRestart}
            className="px-6 py-2.5 sm:px-8 sm:py-3 md:px-10 md:py-4 bg-emerald-600 text-white text-base sm:text-lg md:text-xl font-black rounded-3xl shadow-[0_8px_0_0_#065f46] active:shadow-none active:translate-y-2 transition-all"
          >
            Play Again
          </button>
          <button
            onClick={onBackToMenu}
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-sm sm:text-base text-zinc-500 hover:text-violet-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold transition-all"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </>
  );
}
