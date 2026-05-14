"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HIGH_SCORE_KEY } from "../constants";

interface Props {
  onStart: () => void;
}

export default function MenuScreen({ onStart }: Props) {
  const router = useRouter();
  const [highScore, setHighScore] = useState<number>(0);

  useEffect(() => {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    if (stored) setHighScore(Number(stored));
  }, []);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      <button
        onClick={() => router.push("/games")}
        className="absolute top-6 right-6 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-zinc-500 hover:text-violet-500 transition-colors"
        title="Back to Games"
      >
        <i className="fi fi-sr-home text-lg"></i>
      </button>

      <div className="space-y-2">
        <h1 className="text-4xl md:text-6xl font-black text-violet-600 dark:text-violet-400 tracking-tight">
          Alphabet Adventure
        </h1>
        <p className="text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 font-bold">
          ผจญภัยโลกตัวอักษร
        </p>
      </div>

      <div className="text-8xl animate-bounce py-4 transition-all hover:scale-125 duration-500 cursor-default">
        <i className="fi fi-sr-island-tropical text-violet-600 dark:text-violet-400"></i>
      </div>

      <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
        Prepare for an exciting journey through the A-Z islands! Learn and challenge yourself with 4 fun levels designed for Grade 1 students.
      </p>
      <p className="text-base text-zinc-500 dark:text-zinc-500 max-w-md mx-auto">
        เตรียมพร้อมสำหรับการเดินทางแสนสนุกผ่านเกาะตัวอักษร A-Z เรียนรู้และท้าทายตัวเองไปพร้อมกัน!
      </p>

      {highScore > 0 && (
        <div className="inline-block bg-violet-100 dark:bg-violet-900/30 px-6 py-3 rounded-2xl border-2 border-violet-200 dark:border-violet-800">
          <p className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">
            Best Score
          </p>
          <p className="text-3xl font-black text-violet-600 dark:text-violet-400">
            {highScore}
          </p>
        </div>
      )}

      <div className="pt-4">
        <button
          onClick={onStart}
          className="group relative px-12 py-5 bg-violet-600 text-white text-2xl font-black rounded-3xl shadow-[0_12px_0_0_rgba(109,40,217,1)] active:shadow-none active:translate-y-3 transition-all duration-150 overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-3">
            Start Game <i className="fi fi-sr-play mt-1 transition-transform group-hover:translate-x-1"></i>
          </span>
          <div className="absolute inset-0 bg-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>

      <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
        Grade 1 • 4 Levels
      </p>
    </div>
  );
}