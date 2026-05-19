"use client";

import { useRouter } from "next/navigation";
import { HIGH_SCORE_KEY } from "../constants";
import { useState } from "react";

interface Props {
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  bestStreak: number;
  onPlayEndless: () => void;
  onChangeRange: () => void;
  currentRangeId: string;
  stageStars: number[];
}

function StarDisplay({ count }: { count: number }) {
  return (
    <div className="flex justify-center gap-3">
      {[1, 2, 3].map((star) => (
        <i
          key={star}
          className={`fi fi-sr-star text-5xl ${
            star <= count ? "text-amber-400" : "text-zinc-200 dark:text-zinc-700"
          } transition-all duration-500`}
        />
      ))}
    </div>
  );
}

export default function VictoryScreen({
  score, totalCorrect, totalQuestions, bestStreak,
  onPlayEndless, onChangeRange, currentRangeId, stageStars,
}: Props) {
  const router = useRouter();
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const totalStars = stageStars.reduce((a, b) => a + b, 0);
  const maxStars = stageStars.length * 3;
  const isNewBest = accuracy >= 90 && totalQuestions >= 5;

  const [showNewBest] = useState(() => {
    if (isNewBest && typeof window !== 'undefined') {
      const key = `${HIGH_SCORE_KEY}-${currentRangeId}`;
      const prev = Number(localStorage.getItem(key) ?? "0");
      if (score > prev) {
        localStorage.setItem(key, String(score));
        return true;
      }
    }
    return false;
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center space-y-6 animate-in zoom-in duration-500">
      <h1 className="text-5xl md:text-7xl font-black text-fuchsia-600 dark:text-fuchsia-400 tracking-tight underline decoration-zinc-100 dark:decoration-zinc-800 underline-offset-8">
        ยอดเยี่ยมไปเลย!
      </h1>

      {showNewBest && (
        <div className="inline-block px-6 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full font-black text-sm animate-in zoom-in duration-500">
          NEW HIGH SCORE!
        </div>
      )}

      <div className="text-[8rem] drop-shadow-2xl py-2">
        <i className="fi fi-sr-medal text-amber-500 dark:text-amber-400"></i>
      </div>

      <StarDisplay count={totalStars} />

      <p className="text-lg text-zinc-500 dark:text-zinc-400">
        คะแนนรวม: {totalStars}/{maxStars} ดาว
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto">
        <StatCard label="คะแนน" value={String(score)} />
        <StatCard label="ถูกต้อง" value={`${totalCorrect}/${totalQuestions}`} />
        <StatCard label="ความแม่นยำ" value={`${accuracy}%`} />
        <StatCard label="ทำต่อเนื่อง" value={`${bestStreak} ครั้ง`} />
      </div>

      <p className="text-lg font-bold text-zinc-500 dark:text-zinc-400 px-8">
        หนูผ่านครบทุกด่านแล้วคนเก่ง! พร้อมสำหรับโหมดท้าทายหรือยัง?
      </p>

      <div className="flex flex-col md:flex-row justify-center gap-4 pt-4">
        <button
          onClick={onPlayEndless}
          className="px-10 py-5 bg-fuchsia-600 text-white text-xl font-black rounded-3xl shadow-[0_12px_0_0_#9d174d] active:shadow-none active:translate-y-3 transition-all"
        >
          เล่นโหมดท้าทาย (∞)
        </button>
        <button
          onClick={() => router.push("/games")}
          className="px-10 py-5 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-xl font-black rounded-3xl hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 hover:text-fuchsia-500 transition-colors"
        >
          <i className="fi fi-sr-gamepad mr-2"></i>เกมอื่นๆ
        </button>
        <button
          onClick={onChangeRange}
          className="px-10 py-5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 text-xl font-black rounded-3xl shadow-[0_12px_0_0_#d4d4d8] dark:shadow-none active:shadow-none active:translate-y-3 transition-all"
        >
          เปลี่ยนระดับตัวเลข
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-700">
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mt-1">{value}</p>
    </div>
  );
}
