"use client";

import { useState, useEffect, useRef } from "react";
import type { CardTier, CardCollection } from "../../cards/cards";
import {
  TIER_ORDER,
  TIER_LABELS,
  TIER_LETTERS,
  loadCollection,
  CARD_EMOJIS,
  CARD_WORDS,
} from "../../cards/cards";
import CaptainAlph from "../../characters/CaptainAlph";
import Mermaid from "../../characters/Mermaid";
import TreasureMonster from "../../characters/TreasureMonster";

interface Props {
  onBack: () => void;
}

type SortMode = "tier" | "recent" | "all" | "stats";

const MASCOT_UNLOCK_POINTS = [0, 10, 20];

const LETTER_TIER: Record<string, CardTier> = {};
TIER_ORDER.forEach((t) => TIER_LETTERS[t].forEach((l) => (LETTER_TIER[l] = t)));
const ALL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const TIER_GLOW: Record<CardTier, string> = {
  common: "rgba(161,161,170,0.4)",
  uncommon: "rgba(34,197,94,0.4)",
  rare: "rgba(59,130,246,0.4)",
  "ultra-rare": "rgba(168,85,247,0.4)",
  legendary: "rgba(245,158,11,0.4)",
};

const TIER_BORDER: Record<CardTier, string> = {
  common: "border-zinc-300 dark:border-zinc-600",
  uncommon: "border-green-300 dark:border-green-700",
  rare: "border-blue-300 dark:border-blue-700",
  "ultra-rare": "border-purple-300 dark:border-purple-700",
  legendary: "border-amber-300 dark:border-amber-700",
};

const TIER_BG: Record<CardTier, string> = {
  common: "bg-white dark:bg-zinc-800",
  uncommon: "bg-green-50 dark:bg-green-900/20",
  rare: "bg-blue-50 dark:bg-blue-900/20",
  "ultra-rare": "bg-purple-50 dark:bg-purple-900/20",
  legendary: "bg-amber-50 dark:bg-amber-900/20",
};

const TIER_RIBBON: Record<CardTier, string> = {
  common: "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400",
  uncommon: "bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300",
  rare: "bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300",
  "ultra-rare": "bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300",
  legendary: "bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300",
};

const TIER_BACK_BORDER: Record<CardTier, string> = {
  common: "border-zinc-300 dark:border-zinc-500",
  uncommon: "border-green-300 dark:border-green-500",
  rare: "border-blue-300 dark:border-blue-500",
  "ultra-rare": "border-purple-300 dark:border-purple-500",
  legendary: "border-amber-300 dark:border-amber-500",
};

const TIER_BACK_BG: Record<CardTier, string> = {
  common: "bg-zinc-100 dark:bg-zinc-800",
  uncommon: "bg-green-50 dark:bg-green-900/20",
  rare: "bg-blue-50 dark:bg-blue-900/20",
  "ultra-rare": "bg-purple-50 dark:bg-purple-900/20",
  legendary: "bg-amber-50 dark:bg-amber-900/20",
};

const TIER_DOT: Record<CardTier, string> = {
  common: "bg-zinc-400",
  uncommon: "bg-green-500",
  rare: "bg-blue-500",
  "ultra-rare": "bg-purple-500",
  legendary: "bg-amber-500",
};

const TIER_BG_FILL: Record<CardTier, string> = {
  common: "bg-zinc-400",
  uncommon: "bg-green-500",
  rare: "bg-blue-500",
  "ultra-rare": "bg-purple-500",
  legendary: "bg-amber-500",
};

function CollectedCardFace({ letter, tier, count, isRarest }: { letter: string; tier: CardTier; count: number; isRarest?: boolean }) {
  return (
    <div
      className={`relative w-full aspect-[4/5] rounded-3xl border-[3px] flex flex-col items-center justify-center gap-1.5 p-3 shadow-lg hover:-translate-y-2 hover:scale-[1.04] hover:shadow-2xl transition-all duration-200 cursor-default ${TIER_BORDER[tier]} ${TIER_BG[tier]}`}
      style={{ boxShadow: `0 0 16px ${TIER_GLOW[tier]}` }}
    >
      {isRarest && (
        <span className="absolute -top-3 -left-3 text-2xl z-10 drop-shadow-lg animate-pulse" title="Rarest card!">
          👑
        </span>
      )}
      {isRarest && (
        <div className="absolute -inset-1 rounded-[1.3rem] border-2 border-amber-400/40 pointer-events-none" />
      )}
      <span className="text-3xl md:text-4xl leading-none">{CARD_EMOJIS[letter] || "\u{1F0CF}"}</span>
      <span className="text-4xl md:text-5xl font-black leading-none text-zinc-800 dark:text-zinc-100">
        {letter}
      </span>
      <span className="text-xs md:text-sm font-bold text-zinc-500 dark:text-zinc-400 leading-tight">
        {CARD_WORDS[letter] || ""}
      </span>
      <div className={`absolute bottom-0 left-0 right-0 py-1.5 rounded-b-3xl text-[10px] font-black uppercase tracking-widest ${TIER_RIBBON[tier]}`}>
        {TIER_LABELS[tier]}
      </div>
      {count > 1 && (
        <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-zinc-800 dark:bg-zinc-700 text-white text-xs font-black flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900">
          {count}
        </span>
      )}
    </div>
  );
}

const TIER_BACK_PATTERN: Record<CardTier, { bg: string; dot: string; pattern: string }> = {
  common: { bg: "#e4e4e7", dot: "#a1a1aa", pattern: "M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" },
  uncommon: { bg: "#bbf7d0", dot: "#22c55e", pattern: "M12 2L22 12L12 22L2 12Z" },
  rare: { bg: "#bfdbfe", dot: "#3b82f6", pattern: "M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21Z" },
  "ultra-rare": { bg: "#d8b4fe", dot: "#a855f7", pattern: "M12 1L14 8L21 8L15.5 12.5L17.5 19.5L12 15L6.5 19.5L8.5 12.5L3 8L10 8Z" },
  legendary: { bg: "#fde68a", dot: "#f59e0b", pattern: "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26Z" },
};

function UncollectedCardBack({ tier }: { tier: CardTier }) {
  const pat = TIER_BACK_PATTERN[tier];
  return (
    <div className={`relative w-full aspect-[4/5] rounded-3xl border-[3px] flex items-center justify-center shadow-lg overflow-hidden ${TIER_BACK_BORDER[tier]} ${TIER_BACK_BG[tier]}`}>
      <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {[...Array(3)].map((_, row) => (
          [...Array(3)].map((_, col) => (
            <g key={`${row}-${col}`} transform={`translate(${col * 8 + 2}, ${row * 8 + 2}) scale(0.18)`}>
              <path d={pat.pattern} fill={pat.dot} />
            </g>
          ))
        ))}
      </svg>
      <span className="text-5xl md:text-6xl text-zinc-300 dark:text-zinc-600 select-none relative z-10 drop-shadow-lg">?</span>
    </div>
  );
}

export default function CardScreen({ onBack }: Props) {
  const [collection, setCollection] = useState<CardCollection>({
    cards: [], totalPoints: 0, dropPower: 0,
  });
  const [mounted, setMounted] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("tier");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    setCollection(loadCollection());
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setShowTop(el.scrollTop > 400);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const cardsByTier = (tier: CardTier) =>
    collection.cards.filter((c) => c.tier === tier).sort((a, b) => a.letter.localeCompare(b.letter));

  const unlockedMascots = MASCOT_UNLOCK_POINTS.filter((t) => collection.totalPoints >= t).length;

  const totalPossible = TIER_ORDER.reduce((s, t) => s + TIER_LETTERS[t].length, 0);
  const totalCollected = collection.cards.length;
  const tierPercentages: Record<CardTier, number> = {} as Record<CardTier, number>;
  TIER_ORDER.forEach((t) => {
    tierPercentages[t] = (cardsByTier(t).length / TIER_LETTERS[t].length) * 100;
  });

  const totalWithDuplicates = collection.cards.reduce((s, c) => s + c.count, 0);
  const duplicateCount = totalWithDuplicates - totalCollected;
  const highestOwnedTier = (() => {
    for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
      if (cardsByTier(TIER_ORDER[i]).length > 0) return TIER_LABELS[TIER_ORDER[i]];
    }
    return "None";
  })();
  const completionPct = Math.round((totalCollected / totalPossible) * 100);

  const achievements = [
    { label: "First Card", icon: "🎴", done: totalCollected >= 1 },
    { label: "Tier Complete", icon: "🏆", done: TIER_ORDER.some(t => cardsByTier(t).length >= TIER_LETTERS[t].length) },
    { label: "Legendary Hunter", icon: "💎", done: cardsByTier("legendary").length >= 1 },
    { label: "Point Collector", icon: "⭐", done: collection.totalPoints >= 10 },
    { label: "Card Hoarder", icon: "📦", done: duplicateCount >= 5 },
    { label: "Perfectionist", icon: "🌟", done: TIER_ORDER.filter(t => cardsByTier(t).length >= TIER_LETTERS[t].length).length >= 3 },
    { label: "Full Collection", icon: "👑", done: totalCollected >= totalPossible },
  ];
  const completedAchievements = achievements.filter(a => a.done).length;

  let globalCardIndex = 0;

  const rarestOwnedTier = (() => {
    for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
      if (cardsByTier(TIER_ORDER[i]).length > 0) return TIER_ORDER[i];
    }
    return null;
  })();

  const renderCard = (letter: string, tier: CardTier, idx: number) => {
    const card = collection.cards.find((c) => c.letter === letter && c.tier === tier);
    return (
      <div
        key={`${letter}-${tier}`}
        className={`card-flip ${mounted ? "" : "opacity-0"}`}
        style={{ animationDelay: `${idx * 0.06}s` }}
      >
        {card ? (
          <CollectedCardFace letter={letter} tier={tier} count={card.count} isRarest={tier === rarestOwnedTier} />
        ) : (
          <UncollectedCardBack tier={tier} />
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
@keyframes cardFlip {
  0% { transform: rotateY(90deg) scale(0.8); opacity: 0; }
  60% { transform: rotateY(-10deg) scale(1.02); opacity: 1; }
  100% { transform: rotateY(0deg) scale(1); opacity: 1; }
}
.card-flip { perspective: 1000px; animation: cardFlip 0.5s ease-out both; }
`}</style>
      <div
        ref={scrollRef}
        className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-10 shadow-2xl text-center space-y-8 animate-in zoom-in duration-500 max-h-[90vh] overflow-y-auto relative"
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20Z' fill='%238b5cf6' fill-opacity='0.2'/%3E%3C/svg%3E")`,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-zinc-500 hover:text-violet-500 transition-colors"
            >
              <i className="fi fi-sr-angle-left text-lg"></i>
            </button>
            <h1 className="text-3xl md:text-4xl font-black text-violet-600 dark:text-violet-400">
              Card Collection
            </h1>
            <div className="w-12" />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-4">
            <div className="inline-block bg-violet-100 dark:bg-violet-900/30 px-6 py-3 rounded-2xl border-2 border-violet-200 dark:border-violet-800">
              <p className="text-[10px] font-black text-violet-600/60 dark:text-violet-400/60 uppercase tracking-widest">Cards</p>
              <p className="text-3xl font-black text-violet-600 dark:text-violet-400">{totalCollected}/{totalPossible}</p>
            </div>
            <div className="inline-block bg-amber-100 dark:bg-amber-900/30 px-6 py-3 rounded-2xl border-2 border-amber-200 dark:border-amber-800">
              <p className="text-[10px] font-black text-amber-600/60 dark:text-amber-400/60 uppercase tracking-widest">Points</p>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{collection.totalPoints}</p>
            </div>
          </div>

          {/* Progress bar */}
          {totalCollected > 0 && (
            <div className="h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
              {TIER_ORDER.map((tier) => {
                const total = TIER_LETTERS[tier].length;
                const collected = cardsByTier(tier).length;
                const pct = totalPossible > 0 ? (total / totalPossible) * 100 : 0;
                const fill = collected > 0 ? (collected / total) * 100 : 0;
                return (
                  <div
                    key={tier}
                    className="flex flex-col justify-end relative transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  >
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${TIER_BG_FILL[tier]}`}
                      style={{ width: `${fill}%`, opacity: 0.6 }}
                    />
                    <div
                      className={`h-full transition-all duration-700 ${TIER_BG_FILL[tier]}`}
                      style={{ width: `${fill}%`, opacity: 1, marginTop: "-100%" }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Mascots */}
          <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-3xl border-2 border-amber-200 dark:border-amber-800">
            <p className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4">Characters</p>
            <div className="flex items-center justify-center gap-8">
              <div className="flex flex-col items-center gap-1">
                <CaptainAlph size={70} />
                <p className="text-[10px] font-bold text-amber-500">Free</p>
              </div>
              <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${collection.totalPoints >= 10 ? "" : "opacity-40 saturate-0"}`}>
                <Mermaid size={70} />
                <p className="text-[10px] font-bold text-zinc-400">{collection.totalPoints >= 10 ? "Unlocked!" : "10 pts"}</p>
              </div>
              <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${collection.totalPoints >= 20 ? "" : "opacity-40 saturate-0"}`}>
                <TreasureMonster size={70} />
                <p className="text-[10px] font-bold text-zinc-400">{collection.totalPoints >= 20 ? "Unlocked!" : "20 pts"}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-2">
              {MASCOT_UNLOCK_POINTS.map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < unlockedMascots ? "bg-amber-500" : "bg-zinc-200 dark:bg-zinc-700"}`} />
              ))}
            </div>
          </div>

          {/* Sort tabs */}
          {totalCollected > 0 && (
            <div className="flex justify-center gap-2">
              {(["tier", "recent", "all", "stats"] as SortMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    sortMode === mode
                      ? "bg-violet-600 text-white shadow-lg"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                  }`}
                >
                  {mode === "tier" ? "By Tier" : mode === "recent" ? "Recent" : mode === "all" ? "All A-Z" : "Stats"}
                </button>
              ))}
            </div>
          )}

          {/* Tier sections */}
          {totalCollected > 0 && sortMode === "tier" && (
            <div className="space-y-10">
              {TIER_ORDER.map((tier) => {
                const letters = TIER_LETTERS[tier];
                const collected = cardsByTier(tier);
                const cardSlots = letters.map((letter) => {
                  const card = collected.find((c) => c.letter === letter);
                  return { letter, card, idx: globalCardIndex++ };
                });
                if (cardSlots.length === 0) return null;

                return (
                  <div key={tier}>
                    <div className="flex items-center justify-center gap-3 mb-5">
                      <div className={`h-5 w-1.5 rounded-full ${TIER_DOT[tier]}`} />
                      <span className="text-xl font-black tracking-wider text-zinc-700 dark:text-zinc-200">{TIER_LABELS[tier]}</span>
                      <span className="text-sm font-bold text-zinc-400">{collected.length}/{letters.length}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto" style={{ perspective: "1200px" }}>
                      {cardSlots.map(({ letter, card, idx }) => renderCard(letter, tier, idx))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Stats mode */}
          {totalCollected > 0 && sortMode === "stats" && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border-2 border-zinc-200 dark:border-zinc-700 space-y-5">
                <div className="flex items-center justify-center gap-4">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-zinc-200 dark:text-zinc-700" />
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-violet-500" strokeDasharray={`${completionPct} ${100 - completionPct}`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-violet-600 dark:text-violet-400">
                      {completionPct}%
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Collection</p>
                    <p className="text-3xl font-black text-zinc-700 dark:text-zinc-200">{totalCollected}/{totalPossible}</p>
                    <p className="text-xs font-bold text-zinc-400 mt-1">{totalWithDuplicates} total cards · {duplicateCount} duplicates</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">By Tier</p>
                  {TIER_ORDER.map((tier) => {
                    const collected = cardsByTier(tier).length;
                    const total = TIER_LETTERS[tier].length;
                    const pct = total > 0 ? (collected / total) * 100 : 0;
                    return (
                      <div key={tier} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${TIER_DOT[tier]}`} />
                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 w-20 text-left">{TIER_LABELS[tier]}</span>
                        <div className="flex-1 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${TIER_BG_FILL[tier]}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-zinc-400 w-14 text-right">{collected}/{total}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-around text-center pt-2 border-t-2 border-zinc-200 dark:border-zinc-700">
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Best Card</p>
                    <p className="text-lg font-black text-zinc-700 dark:text-zinc-200">{highestOwnedTier}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Drop Power</p>
                    <p className="text-lg font-black text-violet-600 dark:text-violet-400">+{collection.dropPower}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Points</p>
                    <p className="text-lg font-black text-amber-600 dark:text-amber-400">{collection.totalPoints}</p>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border-2 border-zinc-200 dark:border-zinc-700">
                <p className="text-sm font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3">
                  Achievements ({completedAchievements}/{achievements.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {achievements.map((ach) => (
                    <div
                      key={ach.label}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        ach.done
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 opacity-50"
                      }`}
                    >
                      <span className="text-base">{ach.icon}</span>
                      <span>{ach.label}</span>
                      {ach.done && <span className="ml-auto text-emerald-500">✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent mode */}
          {totalCollected > 0 && sortMode === "recent" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto" style={{ perspective: "1200px" }}>
              {[...collection.cards]
                .sort((a, b) => ((b.lastCollected ?? 0) - (a.lastCollected ?? 0)))
                .map((card, i) => {
                  const idx = globalCardIndex++;
                  return (
                    <div
                      key={`${card.letter}-${card.tier}-recent`}
                      className={`card-flip ${mounted ? "" : "opacity-0"}`}
                      style={{ animationDelay: `${idx * 0.06}s` }}
                    >
                      <CollectedCardFace letter={card.letter} tier={card.tier} count={card.count} />
                    </div>
                  );
                })}
            </div>
          )}

          {/* All A-Z mode */}
          {totalCollected > 0 && sortMode === "all" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto" style={{ perspective: "1200px" }}>
              {ALL_LETTERS.map((letter) => {
                const tier = LETTER_TIER[letter];
                const idx = globalCardIndex++;
                return renderCard(letter, tier, idx);
              })}
            </div>
          )}

          {/* Empty state */}
          {totalCollected === 0 && (
            <div className="py-12 space-y-4">
              <span className="text-7xl block opacity-30">{String.fromCodePoint(0x1F0CF)}</span>
              <p className="text-zinc-400 font-bold text-lg">No cards yet. Play the game to collect letters!</p>
            </div>
          )}

          {/* Back button */}
          <button
            onClick={onBack}
            className="px-10 py-4 bg-violet-600 text-white text-lg font-black rounded-2xl shadow-[0_8px_0_0_#5b21b6] active:shadow-none active:translate-y-2 transition-all hover:bg-violet-500"
          >
            Back to Game
          </button>
        </div>

        {/* Back to top */}
        {showTop && (
          <button
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-20 w-12 h-12 rounded-full bg-violet-600 text-white shadow-2xl flex items-center justify-center hover:bg-violet-500 transition-all animate-in slide-in-from-bottom-2 duration-300"
          >
            <i className="fi fi-sr-angle-up text-lg"></i>
          </button>
        )}
      </div>
    </>
  );
}
