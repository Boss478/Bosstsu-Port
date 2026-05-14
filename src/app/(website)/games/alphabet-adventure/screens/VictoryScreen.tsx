"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HIGH_SCORE_KEY } from "../constants";
import { LEVELS } from "../constants";

interface Props {
  score: number;
  stageStars: number[];
}

function StarDisplay({ count }: { count: number }) {
  return (
    <div className="flex justify-center gap-2">
      {[1, 2, 3].map((star) => (
        <i
          key={star}
          className={`fi fi-sr-star text-3xl ${
            star <= count ? "text-amber-400" : "text-zinc-200 dark:text-zinc-700"
          } transition-all duration-500`}
        />
      ))}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-violet-50 dark:bg-violet-900/10 rounded-2xl p-4 border-2 border-violet-100 dark:border-violet-900/30">
      <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
        {label}
      </p>
      <p className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">
        {value}
      </p>
    </div>
  );
}

export default function VictoryScreen({ score, stageStars }: Props) {
  const router = useRouter();
  const [isNewBest, setIsNewBest] = useState(false);

  const totalStars = stageStars.reduce((sum, s) => sum + s, 0);

  useEffect(() => {
    const key = HIGH_SCORE_KEY;
    const prev = Number(localStorage.getItem(key) ?? "0");
    if (score > prev) {
      localStorage.setItem(key, String(score));
      setIsNewBest(true);
    }
  }, [score]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-12 shadow-2xl text-center space-y-8 animate-in zoom-in duration-500">
      <h1 className="text-5xl md:text-7xl font-black text-emerald-500 animate-pulse tracking-tight">
        Amazing!
      </h1>
      <p className="text-2xl md:text-3xl text-zinc-600 dark:text-zinc-400 font-bold">
        คุณพิชิตเกาะตัวอักษรสำเร็จแล้ว!
      </p>

      <div className="text-9xl rotate-12 py-6 drop-shadow-2xl">
        <i className="fi fi-sr-trophy text-amber-500 dark:text-amber-400"></i>
      </div>

      {isNewBest && (
        <div className="inline-block bg-amber-100 dark:bg-amber-900/30 px-6 py-3 rounded-2xl border-4 border-amber-400 animate-in zoom-in">
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            NEW HIGH SCORE!
          </p>
        </div>
      )}

      <div className="bg-violet-50 dark:bg-violet-900/10 p-8 rounded-3xl inline-block border-2 border-violet-100 dark:border-violet-900/30">
        <p className="text-lg font-bold text-violet-600/60 dark:text-violet-400/60 uppercase tracking-widest mb-1">
          Final Score
        </p>
        <p className="text-7xl font-black text-violet-600 dark:text-violet-400 tracking-tighter">
          {score}
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-lg font-bold text-zinc-500 dark:text-zinc-400">
          Level Stars
        </p>
        <div className="flex flex-col gap-3">
          {stageStars.map((stars, index) => {
            const levelNum = index + 1;
            const levelConfig = LEVELS[levelNum];
            return (
              <div
                key={levelNum}
                className="flex items-center justify-center gap-4"
              >
                <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 w-32 text-right">
                  {levelConfig?.name || `Level ${levelNum}`}
                </span>
                <StarDisplay count={stars} />
              </div>
            );
          })}
        </div>
        <div className="pt-4 border-t-2 border-violet-200 dark:border-violet-800">
          <p className="text-sm font-bold text-violet-500 dark:text-violet-400">
            Total: {totalStars} / {stageStars.length * 3} Stars
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-8">
        <button
          onClick={() => router.reload()}
          className="px-12 py-5 bg-emerald-600 text-white text-2xl font-black rounded-3xl shadow-[0_12px_0_0_#065f46] active:shadow-none active:translate-y-3 transition-all"
        >
          Play Again
        </button>
        <button
          onClick={() => router.push("/games")}
          className="px-10 py-5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 text-xl font-black rounded-3xl shadow-[0_12px_0_0_#d4d4d8] dark:shadow-none active:shadow-none active:translate-y-3 transition-all"
        >
          <i className="fi fi-sr-gamepad mr-2"></i>More Games
        </button>
        <button
          onClick={() => router.reload()}
          className="text-zinc-400 hover:text-violet-500 font-bold transition-colors"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}