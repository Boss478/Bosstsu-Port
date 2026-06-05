"use client";

import { useState, useEffect } from "react";
import type { CardTier } from "../../cards/cards";
import { CARD_EMOJIS, CARD_WORDS, TIER_LABELS } from "../../cards/cards";

interface Props {
  letter: string;
  tier: CardTier;
  isNew: boolean;
  onKeep: () => void;
  onPlaySound?: (frequencies: number[]) => void;
}

const TIER_CARD_BORDER: Record<CardTier, string> = {
  common: "border-zinc-400 dark:border-zinc-500",
  uncommon: "border-green-400 dark:border-green-500",
  rare: "border-blue-400 dark:border-blue-500",
  "ultra-rare": "border-purple-400 dark:border-purple-500",
  legendary: "border-amber-400 dark:border-amber-500",
};

const TIER_CARD_BG: Record<CardTier, string> = {
  common: "bg-zinc-50 dark:bg-zinc-800",
  uncommon: "bg-green-50 dark:bg-green-900/30",
  rare: "bg-blue-50 dark:bg-blue-900/30",
  "ultra-rare": "bg-purple-50 dark:bg-purple-900/30",
  legendary: "bg-amber-50 dark:bg-amber-900/30",
};

const TIER_RIBBON: Record<CardTier, string> = {
  common: "bg-zinc-300 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300",
  uncommon: "bg-green-300 dark:bg-green-700 text-green-700 dark:text-green-300",
  rare: "bg-blue-300 dark:bg-blue-700 text-blue-700 dark:text-blue-300",
  "ultra-rare": "bg-purple-300 dark:bg-purple-700 text-purple-700 dark:text-purple-300",
  legendary: "bg-amber-300 dark:bg-amber-700 text-amber-700 dark:text-amber-300",
};

const TIER_GLOW: Record<CardTier, string> = {
  common: "shadow-zinc-400/30",
  uncommon: "shadow-green-400/30",
  rare: "shadow-blue-400/30",
  "ultra-rare": "shadow-purple-400/30",
  legendary: "shadow-amber-400/40",
};

const TIER_BTN: Record<CardTier, string> = {
  common: "bg-zinc-600 hover:bg-zinc-500 shadow-zinc-800",
  uncommon: "bg-green-600 hover:bg-green-500 shadow-green-800",
  rare: "bg-blue-600 hover:bg-blue-500 shadow-blue-800",
  "ultra-rare": "bg-purple-600 hover:bg-purple-500 shadow-purple-800",
  legendary: "bg-amber-600 hover:bg-amber-500 shadow-amber-800",
};

const TIER_BACK: Record<CardTier, string> = {
  common: "border-zinc-400/40 dark:border-zinc-500/40 bg-zinc-200 dark:bg-zinc-800",
  uncommon: "border-green-400/40 dark:border-green-500/40 bg-green-100 dark:bg-green-900/30",
  rare: "border-blue-400/40 dark:border-blue-500/40 bg-blue-100 dark:bg-blue-900/30",
  "ultra-rare": "border-purple-400/40 dark:border-purple-500/40 bg-purple-100 dark:bg-purple-900/30",
  legendary: "border-amber-400/40 dark:border-amber-500/40 bg-amber-100 dark:bg-amber-900/30",
};

const TIER_RING: Record<CardTier, string> = {
  common: "border-zinc-400/40 dark:border-zinc-500/40",
  uncommon: "border-green-400/40 dark:border-green-500/40",
  rare: "border-blue-400/40 dark:border-blue-500/40",
  "ultra-rare": "border-purple-400/40 dark:border-purple-500/40",
  legendary: "border-amber-400/40 dark:border-amber-500/40",
};

export default function CardRevealModal({ letter, tier, isNew, onKeep, onPlaySound }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [showKeep, setShowKeep] = useState(false);

  useEffect(() => {
    if (flipped) {
      const t = setTimeout(() => setShowKeep(true), 1000);
      return () => clearTimeout(t);
    }
  }, [flipped]);

  useEffect(() => {
    if (flipped && onPlaySound) {
      const freqs =
        tier === "common" ? [500] :
        tier === "uncommon" ? [500, 700] :
        tier === "rare" ? [500, 700, 900] :
        tier === "ultra-rare" ? [500, 800, 1100, 1300] :
        [523, 659, 784, 1047];
      onPlaySound(freqs);
    }
  }, [flipped, tier, onPlaySound]);

  const emoji = CARD_EMOJIS[letter] || "🃏";
  const word = CARD_WORDS[letter] || "";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <p className="text-white/80 text-sm font-bold mb-6 tracking-wider uppercase">
        {flipped ? "Collected!" : "Tap the card to reveal"}
      </p>

      <div className="relative" style={{ perspective: "1200px" }}>
        <div
          className="relative transition-transform duration-600 cursor-pointer"
          style={{
            width: "18rem",
            height: "22.5rem",
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
          onClick={() => !flipped && setFlipped(true)}
        >
          {/* — Card Back — */}
          <div
            className={`absolute inset-0 rounded-3xl border-[5px] flex flex-col items-center justify-center gap-4 ${TIER_BACK[tier]}`}
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-7xl text-zinc-400 dark:text-zinc-500 select-none">
              ?
            </span>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              {TIER_LABELS[tier]}
            </span>
          </div>

          {/* — Card Face — */}
          <div
            className={`absolute inset-0 rounded-3xl border-[5px] flex flex-col items-center justify-center gap-2 p-5 shadow-2xl ${TIER_CARD_BORDER[tier]} ${TIER_CARD_BG[tier]} ${TIER_GLOW[tier]}`}
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            {isNew && (
              <span className="absolute top-4 right-4 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full animate-pulse">
                NEW!
              </span>
            )}
            <span className="text-5xl leading-none mb-1">{emoji}</span>
            <span className="text-7xl font-black leading-none text-zinc-800 dark:text-zinc-100">
              {letter}
            </span>
            {word && (
              <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                {word}
              </span>
            )}
            <div
              className={`absolute bottom-0 left-0 right-0 py-2 rounded-b-3xl text-xs font-black uppercase tracking-widest text-center ${TIER_RIBBON[tier]}`}
            >
              {TIER_LABELS[tier]}
            </div>
          </div>
        </div>

        {flipped && (
          <div
            className={`absolute -inset-4 rounded-[4rem] border-[5px] opacity-35 blur-[3px] animate-pulse pointer-events-none transition-opacity duration-500 ${TIER_RING[tier]}`}
            style={{ zIndex: -1 }}
          />
        )}
      </div>

      {showKeep && (
        <button
          onClick={onKeep}
          className={`mt-10 px-12 py-4 text-white text-lg font-black rounded-2xl shadow-[0_8px_0_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-2 transition-all animate-in zoom-in duration-300 ${TIER_BTN[tier]}`}
        >
          KEEP
        </button>
      )}
    </div>
  );
}
