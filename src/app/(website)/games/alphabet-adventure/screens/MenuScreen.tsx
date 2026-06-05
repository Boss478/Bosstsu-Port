"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { HIGH_SCORE_KEY } from "../constants";
import { CARD_STORAGE_KEY } from "../cards/cards";

interface Props {
  onStart: () => void;
  onContinue?: () => void;
  hasProgress?: boolean;
  easyMode?: boolean;
  onToggleEasy?: () => void;
  isBeta?: boolean;
  onShowCards?: () => void;
  voiceURI?: string;
  onVoiceChange?: (uri: string) => void;
}

export default function MenuScreen({ onStart, onContinue, hasProgress, easyMode, onToggleEasy, isBeta, onShowCards, voiceURI, onVoiceChange }: Props) {
  const router = useRouter();
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [highScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(HIGH_SCORE_KEY);
      return stored ? Number(stored) : 0;
    }
    return 0;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      <div className="absolute top-6 right-6 flex items-center gap-2">
        {isBeta && onShowCards && (
          <button
            onClick={onShowCards}
            className="px-4 py-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-800/40 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-widest transition-all hover:scale-105"
            title="View Card Collection"
          >
            Cards
          </button>
        )}
        {isBeta && (
          <button
            onClick={() => {
              localStorage.removeItem(CARD_STORAGE_KEY);
            }}
            className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/40 text-red-500 hover:text-red-600 text-xs transition-all hover:scale-105"
            title="Reset Cards (Debug)"
          >
            <i className="fi fi-sr-refresh text-sm"></i>
          </button>
        )}
        {isBeta && (
          <div className="relative">
            <button
              onClick={() => setShowVoicePicker(v => !v)}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-zinc-500 hover:text-violet-500 transition-all"
              title="Voice Settings"
            >
              <i className="fi fi-sr-volume text-sm"></i>
            </button>
            {showVoicePicker && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border-2 border-zinc-200 dark:border-zinc-700 p-3 z-50 max-h-64 overflow-y-auto">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">TTS Voice (BETA)</p>
                {voices.filter(v => v.lang.startsWith("en") || v.lang.startsWith("th")).length === 0 && <p className="text-xs text-zinc-500">No English or Thai voices available</p>}
                {voices.filter(v => v.lang.startsWith("en") || v.lang.startsWith("th")).map((v) => (
                  <button
                    key={v.voiceURI}
                    onClick={() => onVoiceChange?.(v.voiceURI)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      voiceURI === v.voiceURI
                        ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <span>{v.name}</span>
                    <span className="text-[10px] text-zinc-400 ml-2">({v.lang})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {!isBeta && (
          <button
            onClick={() => router.push("/games/alphabet-adventure/beta")}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all hover:scale-105"
            title="Try BETA Features"
          >
            BETA
          </button>
        )}
        <button
          onClick={() => router.push("/games")}
          className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-zinc-500 hover:text-violet-500 transition-colors"
          title="Back to Games"
        >
          <i className="fi fi-sr-home text-lg"></i>
        </button>
      </div>

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
        Prepare for an exciting journey through the A-Z islands! Learn and challenge yourself with 6 fun levels designed for Grade 1 students.
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

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={onToggleEasy}
          className={`px-5 py-2 rounded-2xl text-sm font-black transition-all border-2 ${
            easyMode
              ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-400 text-emerald-700 dark:text-emerald-400"
              : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {easyMode ? "🐣 Easy Mode (KG)" : "Easy Mode (KG)"}
        </button>
      </div>

      <div className={`pt-4 ${isBeta ? "flex items-center justify-center gap-4" : "space-y-6"}`}>
        {hasProgress && onContinue && (
          <button
            onClick={onContinue}
            className="group relative px-8 py-4 bg-emerald-600 text-white text-xl font-black rounded-3xl shadow-[0_10px_0_0_rgba(5,150,105,1)] active:shadow-none active:translate-y-2 transition-all duration-150 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              Continue <i className="fi fi-sr-play mt-1 transition-transform group-hover:translate-x-1"></i>
            </span>
            <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        )}
        <button
          onClick={onStart}
          className="group relative px-8 py-4 bg-violet-600 text-white text-xl font-black rounded-3xl shadow-[0_10px_0_0_rgba(109,40,217,1)] active:shadow-none active:translate-y-2 transition-all duration-150 overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-3">
            {hasProgress ? "New Game" : "Start Game"} <i className="fi fi-sr-play mt-1 transition-transform group-hover:translate-x-1"></i>
          </span>
          <div className="absolute inset-0 bg-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>

      <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
        Grade 1 • {easyMode ? "5 Levels" : "6 Levels"}
      </p>
    </div>
  );
}