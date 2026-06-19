"use client";

import { useGame } from "../context";
import { useState, useMemo } from "react";
import { PHONEMES } from "../constants";
import { useAudio } from "@/hooks/useAudio";
import MascotCanvas from "../components/MascotCanvas";
import type { PhonemeData, CompanionId, StageLesson } from "../types";

function CompanionAvatar({ companion, size = 56 }: { companion: CompanionId; size?: number }) {
  return (
    <MascotCanvas
      companionId={companion}
      size={size}
      className="rounded-2xl bg-white/20 dark:bg-slate-900/30 p-1.5 border border-white/30 dark:border-slate-800 shadow-sm"
    />
  );
}

function getMascotPhonemeGreeting(companion: CompanionId, p: PhonemeData): string {
  if (companion === "nox") {
    return `The sound ${p.ipa} is heard in "${p.example}". Let's inspect its pronunciation together.`;
  }
  if (companion === "mira") {
    return `Yay! Let's practice the magic sound ${p.ipa} as in "${p.example}"! Ready?`;
  }
  if (companion === "fox") {
    return `Ah, the sound ${p.ipa} in "${p.example}". Let's analyze its pronunciation together.`;
  }
  if (companion === "cat") {
    return `Meow! Hear the sound ${p.ipa} as in "${p.example}"! Let's play!`;
  }
  if (companion === "bear") {
    return `Let's practice the sound ${p.ipa} in "${p.example}" slow and steady.`;
  }
  if (companion === "bunny") {
    return `Hooray! The sound ${p.ipa} is in "${p.example}"! Let's learn it!`;
  }
  if (companion === "penguin") {
    return `Let's review the cool sound ${p.ipa} in "${p.example}".`;
  }
  if (companion === "alien") {
    return `Scanning frequency for sound ${p.ipa} as in "${p.example}".`;
  }
  if (companion === "ninja") {
    return `Focus on the sound ${p.ipa} in "${p.example}".`;
  }
  return `Analyzing phoneme: ${p.ipa}. Core target sample: "${p.example}". Practice routine initialized.`;
}

export default function LibraryScreen() {
  const { save, selectLesson, startRound, companion, setScreen } = useGame();
  const { speak } = useAudio();
  const [activeFilter, setActiveFilter] = useState<"all" | "basic" | "vowels" | "consonants" | "blends">("all");
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [selectedPhoneme, setSelectedPhoneme] = useState<PhonemeData | null>(null);

  const phonemeStats = useMemo(() => save?.phonemeStats ?? {}, [save?.phonemeStats]);

  const filteredPhonemes = useMemo(() => {
    if (activeFilter === "all") return PHONEMES;
    return PHONEMES.filter((p) => p.tier === activeFilter);
  }, [activeFilter]);

  const statsSummary = useMemo(() => {
    let discovered = 0;
    PHONEMES.forEach((p) => {
      if (phonemeStats[p.id]) discovered++;
    });
    return {
      discovered,
      total: PHONEMES.length,
      percentage: Math.round((discovered / PHONEMES.length) * 100),
    };
  }, [phonemeStats]);

  const handlePlaySound = (p: PhonemeData) => {
    setActivePlayingId(p.id);
    speak(p.ttsText);
    setTimeout(() => setActivePlayingId(null), 1000);
  };

  const handleStartPractice = (p: PhonemeData) => {
    // Define a mock lesson specifically targeting this single phoneme
    const mockLesson: StageLesson = {
      id: `practice-${p.id}`,
      title: `Practice: ${p.ipa}`,
      phonemeIds: [p.id],
    };

    // Select the lesson context so question generator knows to filter
    selectLesson(mockLesson);

    // Start a 5-question round of type Phonics
    startRound({
      category: "phonics",
      phonicsFormat: "tap",
      level: "all",
      length: 5,
    });

    // Close the details modal
    setSelectedPhoneme(null);
  };

  const filters = [
    { id: "all", name: "All" },
    { id: "basic", name: "Basic" },
    { id: "vowels", name: "Vowels" },
    { id: "consonants", name: "Consonants" },
    { id: "blends", name: "Blends" },
  ] as const;

  const isPlaying = selectedPhoneme && activePlayingId === selectedPhoneme.id;

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain bg-transparent min-h-full">
      <div className="max-w-md lg:max-w-3xl mx-auto px-6 py-8 pb-36 text-center">
        {/* Title */}
        <div className="mb-6">
          <i className="fi fi-sr-book-open-cover text-[#C8A44E] text-3xl block mb-2 animate-breathe" />
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-[#F7E1A0] tracking-wide" style={{ fontFamily: "var(--font-mali)" }}>
            Soundbook
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Master Your English Sounds</p>
        </div>

        {/* Discovery Progress Card */}
        <div className="glass-panel p-5 rounded-3xl border border-white/30 dark:border-slate-800 shadow-xs mb-6 text-left relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Discovered Sounds</span>
              <span className="text-lg font-black text-slate-800 dark:text-white mt-0.5 inline-block">
                {statsSummary.discovered} / {statsSummary.total} Sounds
              </span>
            </div>
            <span className="text-sm font-black text-[#C8A44E]">{statsSummary.percentage}%</span>
          </div>
          {/* Progress Bar */}
          <div className="h-3 bg-slate-200/50 dark:bg-slate-900/35 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
            <div
              className="h-full rounded-full bg-[#2EC4B6] transition-all duration-500 relative"
              style={{ width: `${statsSummary.percentage}%` }}
            >
              <div className="absolute inset-0 bg-white/30 h-1" />
            </div>
          </div>
          <button
            onClick={() => {
              const mockLesson: StageLesson = {
                id: "practice-mixed",
                title: "Mixed Phoneme Practice",
                phonemeIds: PHONEMES.map((p) => p.id),
              };
              selectLesson(mockLesson);
              startRound({ category: "phonics", phonicsFormat: "tap", level: "all", length: 5 });
            }}
            className="mt-3 w-full py-2.5 rounded-xl bg-[#2EC4B6] text-white font-extrabold text-xs tracking-wider uppercase hover:brightness-105 active:scale-95 transition-all cursor-pointer"
          >
            <i className="fi fi-sr-play mr-1.5" /> Quick Practice (Mixed Sounds)
          </button>
        </div>

        {/* Word Builder Button */}
        <button
          onClick={() => { setSelectedPhoneme(null); setScreen("word-builder"); }}
          className="w-full py-3 rounded-xl bg-[#C8A44E] text-white font-extrabold text-xs tracking-wider uppercase hover:brightness-105 active:scale-95 transition-all cursor-pointer mb-5 flex items-center justify-center gap-2"
        >
          <i className="fi fi-sr-sparkles" /> CREATE YOUR WORD
        </button>

        {/* Category Filters selector chips */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {filters.map((f) => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer select-none active:scale-95 ${
                  active
                    ? "bg-[#C8A44E] text-white shadow-sm"
                    : "bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80"
                }`}
              >
                {f.name}
              </button>
            );
          })}
        </div>

        {/* Phoneme Grid Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredPhonemes.map((p) => {
            const stats = phonemeStats[p.id];
            const unlocked = !!stats;
            const accuracy = stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
            const gridPlaying = activePlayingId === p.id;

            return (
              <button
                key={p.id}
                onClick={unlocked ? () => setSelectedPhoneme(p) : undefined}
                className={`rounded-2xl p-3 border transition-all relative flex flex-col items-center justify-between min-h-[105px] group select-none ${
                  unlocked
                    ? "glass-panel border-white/30 dark:border-slate-800 hover:scale-[1.03] active:scale-98 cursor-pointer shadow-xs"
                    : "bg-slate-200/20 dark:bg-slate-950/20 border-dashed border-slate-300 dark:border-slate-800 opacity-45 cursor-not-allowed"
                }`}
                title={unlocked ? `Open ${p.ipa} details` : "Locked"}
                aria-label={unlocked ? `Open phoneme ${p.name} details` : `Locked phoneme ${p.name}`}
              >
                {unlocked ? (
                  <>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide truncate max-w-[65%]">
                        {p.example}
                      </span>
                      <div className="flex gap-1">
                        <i className={`fi fi-sr-volume text-[10px] transition-all ${gridPlaying ? "text-[#C8A44E] scale-125 animate-ping" : "text-slate-400 group-hover:text-[#C8A44E]"}`} />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartPractice(p); }}
                          className="text-[10px] text-slate-400 hover:text-[#2EC4B6] transition-colors cursor-pointer"
                          title="Practice this phoneme"
                          aria-label={`Practice phoneme ${p.name}`}
                        >
                          <i className="fi fi-sr-play" />
                        </button>
                      </div>
                    </div>

                    <span
                      className={`text-2xl font-black tracking-wide my-1 transition-all duration-300 ${gridPlaying ? "text-[#C8A44E] scale-110" : "text-slate-800 dark:text-[#F7E1A0]"}`}
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {p.ipa}
                    </span>

                    <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      {accuracy > 0 ? `${accuracy}% ACC` : `${stats?.total ?? 0} Seen`}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex justify-end w-full">
                      <i className="fi fi-sr-lock text-[10px] text-slate-400 dark:text-slate-500" />
                    </div>
                    <span
                      className="text-2xl font-black text-slate-300 dark:text-slate-800 my-1 filter blur-[1.5px] select-none"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {p.ipa}
                    </span>
                    <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      LOCKED
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Premium Details Drawer Modal for Selected Phoneme */}
      {selectedPhoneme && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end justify-center animate-fade-in"
          onClick={() => setSelectedPhoneme(null)}
        >
          <div
            className="glass-panel rounded-t-3xl border-t border-white/30 dark:border-slate-800 p-6 w-full max-w-md animate-slide-up-drawer shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Handle */}
            <div className="flex justify-center mb-5">
              <div className="w-14 h-1 rounded-full bg-slate-450/30" />
            </div>

            {/* Companion message container */}
            <div className="flex items-start gap-4 mb-6">
              <div className="shrink-0">
                <CompanionAvatar companion={companion} size={72} />
              </div>
              <div className="flex-1 bg-white/70 dark:bg-slate-900/50 border border-white/60 dark:border-slate-800 p-3.5 rounded-2xl relative shadow-sm">
                {/* Speech Bubble Arrow */}
                <div className="absolute top-4 -left-2.5 w-3 h-3 rotate-45 bg-white/70 dark:bg-slate-950 border-l border-b border-white/60 dark:border-slate-800" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed text-left" style={{ fontFamily: "var(--font-mali)" }}>
                  {getMascotPhonemeGreeting(companion, selectedPhoneme)}
                </p>
              </div>
            </div>

            {/* Phoneme Large Visual Card */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative">
                {isPlaying && (
                  <span className="absolute inset-[-8px] rounded-3xl bg-[#C8A44E]/15 animate-ping" />
                )}
                <button
                  onClick={() => handlePlaySound(selectedPhoneme)}
                  className="w-24 h-24 rounded-3xl bg-white/60 dark:bg-slate-800/50 border-2 border-white/50 dark:border-slate-700/50 shadow-md hover:bg-white/90 dark:hover:bg-slate-700/80 active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer group"
                  aria-label={`Hear sound ${selectedPhoneme.ipa}`}
                >
                  <span
                    className={`text-4xl font-black tracking-wide transition-all ${isPlaying ? "text-[#C8A44E] scale-105" : "text-slate-800 dark:text-[#F7E1A0] group-hover:text-[#C8A44E]"}`}
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {selectedPhoneme.ipa}
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                    <i className="fi fi-sr-volume text-xs" /> LISTEN
                  </span>
                </button>
              </div>

              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white mt-4" style={{ fontFamily: "var(--font-mali)" }}>
                {selectedPhoneme.name}
              </h2>
              
              <div className="mt-3.5 flex items-center gap-2 bg-white/40 dark:bg-slate-900/40 px-3.5 py-1.5 rounded-full border border-white/40 dark:border-slate-800/80 shadow-3xs">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Example:</span>
                <span className="text-xs font-extrabold text-[#C8A44E]" style={{ fontFamily: "var(--font-mali)" }}>
                  {selectedPhoneme.example}
                </span>
              </div>
            </div>

            {/* Performance/Exposure Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/40 dark:bg-slate-900/35 border border-white/40 dark:border-slate-800/60 rounded-2xl p-3.5 text-center">
                <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Accuracy</span>
                <span className="text-base font-black text-[#2EC4B6]">
                  {phonemeStats[selectedPhoneme.id] && phonemeStats[selectedPhoneme.id].total > 0
                    ? `${Math.round((phonemeStats[selectedPhoneme.id].correct / phonemeStats[selectedPhoneme.id].total) * 100)}%`
                    : "0%"}
                </span>
              </div>
              <div className="bg-white/40 dark:bg-slate-900/35 border border-white/40 dark:border-slate-800/60 rounded-2xl p-3.5 text-center">
                <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Times Seen</span>
                <span className="text-base font-black text-[#C8A44E]">
                  {phonemeStats[selectedPhoneme.id]?.total ?? 0} times
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-4">
              <button
                className="flex-1 px-5 py-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 font-extrabold text-xs tracking-wider uppercase hover:bg-white/80 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer btn-3d"
                onClick={() => setSelectedPhoneme(null)}
                style={{ "--border-color": "rgba(0,0,0,0.1)" } as React.CSSProperties}
              >
                CLOSE
              </button>
              <button
                className="flex-1 px-5 py-3.5 rounded-2xl bg-[#2EC4B6] text-white font-extrabold text-xs tracking-wider uppercase hover:brightness-105 active:scale-95 transition-all cursor-pointer btn-3d shadow-md shadow-[#2EC4B6]/20"
                onClick={() => handleStartPractice(selectedPhoneme)}
                style={{ "--border-color": "#1b8a7e" } as React.CSSProperties}
              >
                PRACTICE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
