"use client";

import { useRouter } from "next/navigation";

interface Props {
  onStart: () => void;
}

export default function MenuScreen({ onStart }: Props) {
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      <button
        onClick={() => router.push("/games")}
        className="absolute top-6 right-6 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30 text-zinc-500 hover:text-fuchsia-500 transition-colors"
        title="Back to Games"
      >
        <i className="fi fi-sr-home text-lg"></i>
      </button>
      <div className="space-y-2">
        <h1 className="text-4xl md:text-6xl font-black text-fuchsia-600 dark:text-fuchsia-400 tracking-tight">
          Number Game
        </h1>
        <p className="text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 font-bold">
          ผจญภัยโลกตัวเลข 1-100
        </p>
      </div>

      <div className="text-8xl animate-bounce py-4 transform hover:scale-110 duration-500 cursor-default">
        <i className="fi fi-sr-calculator text-fuchsia-600 dark:text-fuchsia-400"></i>
      </div>

      <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
        มาเรียนรู้ตัวเลขภาษาอังกฤษแสนสนุก กับกิจกรรมท้าทายหลายรูปแบบ!
      </p>

      <button
        onClick={onStart}
        className="px-12 py-5 bg-fuchsia-600 text-white text-2xl font-black rounded-3xl shadow-[0_12px_0_0_rgba(192,38,211,1)] active:shadow-none active:translate-y-3 transition-all"
      >
        เริ่มผจญภัย
      </button>
    </div>
  );
}
