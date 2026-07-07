"use client";

import { useEffect, useState } from "react";
import type { RoundConfig, PhonicsFormat, SpellingFormat, DefinitionDirection, CefrLevel, RoundLength, GameCategory } from "../types";
import { useGame } from "../context";
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ModeSelectModalProps {
  label: string;
  category: GameCategory;
  onStart: (config: RoundConfig) => void;
  onClose: () => void;
}

export default function ModeSelectModal({ label, category: initialCategory, onStart, onClose }: ModeSelectModalProps) {
  const focusTrapRef = useFocusTrap(true);
  const { save } = useGame();
  const currentLevel: CefrLevel = save?.challengeDifficulty ?? 'b1';
  const [activeCategory, setActiveCategory] = useState<GameCategory>(initialCategory);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function startPhonics(format: PhonicsFormat, level: CefrLevel, length: RoundLength) {
    onStart({ category: "phonics", phonicsFormat: format, level, length });
  }

  function startSpelling(format: SpellingFormat, level: CefrLevel, length: RoundLength) {
    onStart({ category: "spelling", spellingFormat: format, level, length });
  }

  function startDefinitions(direction: DefinitionDirection, level: CefrLevel, length: RoundLength) {
    onStart({ category: "definitions", definitionDirection: direction, level, length });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
      aria-label="Mode Selection"
    >
      <div
        ref={focusTrapRef}
        className="glass-heavy border-t border-white/60 dark:border-slate-700/50 rounded-t-3xl w-full max-w-md animate-slide-up-modal outline-none shadow-xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/60 dark:border-slate-700/50">
          <div>
            <h2 className="font-bold text-lg tracking-widest text-[#1C1C1C] dark:text-[#F7E1A0]" style={{ fontFamily: "var(--font-mali)" }}>
              {label}
            </h2>
            <p className="text-[10px] font-extrabold text-[#C8A44E] uppercase tracking-wider mt-0.5">
              Free Practice
            </p>
          </div>
          <button
            id="mode-select-close"
            className="w-8 h-8 rounded-xl glass-elem border border-white/60 dark:border-slate-700/50 flex items-center justify-center text-sm text-[#1C1C1C]/50 dark:text-[#F7E1A0]/50 hover:bg-white/80 dark:hover:bg-slate-600/80 transition-all"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Category Tab Selector */}
        <div className="flex border-b border-white/30 dark:border-slate-800/80 bg-white/20 dark:bg-slate-900/10">
          {(["phonics", "spelling", "definitions"] as const).map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                className={`flex-1 py-3 text-xs font-extrabold tracking-widest uppercase transition-all relative cursor-pointer ${
                  active
                    ? "text-[#C8A44E]"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === "phonics" ? "🔊 Phonics" : cat === "spelling" ? "📝 Spelling" : "📖 Vocab"}
                {active && (
                  <span className="absolute bottom-0 left-6 right-6 h-0.5 bg-[#C8A44E]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6 space-y-3">
          <p className="text-xs text-[#1C1C1C]/50 dark:text-[#F7E1A0]/60 tracking-widest mb-1 uppercase">SELECT MODE</p>

          {activeCategory === "phonics" && (
            <>
              <ModeCard id="mode-tap" title="TAP THE SOUND" description="Hear a phoneme — tap the correct word" color="#C8A44E" onClick={() => startPhonics("tap", currentLevel, 10)} />
              <ModeCard id="mode-speed" title="SPEED ROUND" description="Same as Tap but with a 3-second timer" color="#FF70A6" onClick={() => startPhonics("speed", currentLevel, 10)} />
              <ModeCard id="mode-card-flip" title="CARD FLIP" description="Match phonemes to words in memory style" color="#9B59B6" onClick={() => startPhonics("card-flip", currentLevel, 10)} />
            </>
          )}

          {activeCategory === "spelling" && (
            <>
              <ModeCard id="mode-spelling-choice" title="SPELLING CHOICE" description="Pick the correct spelling from four options" color="#2EC4B6" onClick={() => startSpelling("choice", currentLevel, 10)} />
              <ModeCard id="mode-spelling-tiles" title="SPELLING TILES" description="Arrange letter tiles to spell the word" color="#C8A44E" onClick={() => startSpelling("tiles", currentLevel, 5)} />
              <ModeCard id="mode-spelling-mixed" title="MIXED SPELLING" description="Both choice and tiles, randomly mixed" color="#FF70A6" onClick={() => startSpelling("mixed", currentLevel, 10)} />
            </>
          )}

          {activeCategory === "definitions" && (
            <>
              <ModeCard id="mode-def-to-word" title="DEFINITION → WORD" description="See the definition — tap the correct word" color="#2EC4B6" onClick={() => startDefinitions("def-to-word", currentLevel, 10)} />
              <ModeCard id="mode-word-to-def" title="WORD → DEFINITION" description="See the word — tap the correct definition" color="#9B59B6" onClick={() => startDefinitions("word-to-def", currentLevel, 10)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeCard({
  id, title, description, color, onClick,
}: {
  id: string;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      id={id}
      className="w-full rounded-xl p-4 text-left glass-elem border border-white/60 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-700/80 active:scale-95 transition-all"
      onClick={onClick}
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <p className="font-bold text-sm tracking-widest" style={{ color }}>{title}</p>
      <p className="text-xs text-[#1C1C1C]/50 dark:text-[#F7E1A0]/60 mt-0.5">{description}</p>
    </button>
  );
}
