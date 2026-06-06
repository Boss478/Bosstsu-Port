"use client";

import { useState, useEffect, useRef } from "react";
import type { CardTier, CardCollection } from "../../cards/cards";
import {
  TIER_ORDER,
  TIER_LABELS,
  TIER_LETTERS,
  loadCollection,
  CARD_WORDS,
  isHolographicTier,
} from "../../cards/cards";
import { CardIllustration } from "../../cards/CardIllustrations";
import { CardFrame } from "../../cards/CardFrame";
import CaptainAlph from "../../characters/CaptainAlph";
import Mermaid from "../../characters/Mermaid";
import TreasureMonster from "../../characters/TreasureMonster";

interface Props {
  onBack: () => void;
  playSequence?: (frequencies: number[], noteDuration?: number, gainVal?: number) => void;
}

type SortMode = "tier" | "recent" | "all" | "stats";

const MASCOT_UNLOCK_POINTS = [0, 10, 20];

const LETTER_TIER: Record<string, CardTier> = {};
TIER_ORDER.forEach((t) => TIER_LETTERS[t].forEach((l) => (LETTER_TIER[l] = t)));
const ALL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const TIER_BG_FILL: Record<CardTier, string> = {
  common: "bg-zinc-400",
  uncommon: "bg-green-500",
  rare: "bg-blue-500",
  "ultra-rare": "bg-purple-500",
  legendary: "bg-amber-500",
};

function CollectedCardFace({ letter, tier, count, isRarest }: { letter: string; tier: CardTier; count: number; isRarest?: boolean }) {
  const isHolo = isHolographicTier(tier);
  return (
    <div className="relative w-full aspect-[5/7] cursor-default transition-all duration-200 hover:-translate-y-2 hover:scale-[1.04] hover:drop-shadow-2xl">
      <CardFrame
        tier={tier}
        namePlate={`${CARD_WORDS[letter] || ""} · ${TIER_LABELS[tier]}`}
        holographic={isHolo}
      >
        <div className="-mt-8 -mb-8">
          <CardIllustration letter={letter} size={125} />
        </div>
        <span className="text-4xl font-black leading-none text-zinc-800 drop-shadow-[0_2px_3px_rgba(255,255,255,0.9)]">
          {letter}
        </span>
      </CardFrame>
      {isRarest && (
        <span className="absolute -top-1.5 -right-1.5 text-lg z-10 animate-pulse drop-shadow-lg">👑</span>
      )}
      {count > 1 && (
        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-800 text-white text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-white">
          {count}
        </span>
      )}
    </div>
  );
}

function UncollectedCardBack({ tier }: { tier: CardTier }) {
  return (
    <div className="relative w-full aspect-[5/7]">
      <CardFrame tier={tier} showBack />
    </div>
  );
}

export default function CardScreen({ onBack, playSequence }: Props) {
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
    playSequence?.([523, 659, 784], 0.12, 0.08);
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
              <i aria-hidden="true" className="fi fi-sr-angle-left text-lg"></i>
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
                  onClick={() => {
                    if (mode !== sortMode) {
                      playSequence?.([600, 800], 0.08, 0.06);
                      setSortMode(mode);
                    }
                  }}
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
                      <div className={`h-5 w-1.5 rounded-full ${TIER_BG_FILL[tier]}`} />
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
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${TIER_BG_FILL[tier]}`} />
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
            <i aria-hidden="true" className="fi fi-sr-angle-up text-lg"></i>
          </button>
        )}
      </div>
    </>
  );
}
