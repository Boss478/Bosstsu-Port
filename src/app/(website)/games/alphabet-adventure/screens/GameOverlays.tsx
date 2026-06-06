"use client";

import type { CardTier } from "../cards/cards";
import { getDropRate, getNoneDropRate, loadCollection, TIER_ORDER, TIER_LABELS, CARD_WORDS, isHolographicTier } from "../cards/cards";
import { CardFrame } from "../cards/CardFrame";
import { CardIllustration } from "../cards/CardIllustrations";
import CardRevealModal from "../beta/screens/CardRevealModal";

interface Props {
  isBeta?: boolean;
  showDebug: boolean;
  showCollectionOverlay: boolean;
  streakToast: string;
  lastCardDropped: { letter: string; tier: CardTier; isNew: boolean } | null;
  cardReveal: { letter: string; tier: CardTier; isNew: boolean } | null;
  dropStreak: number;
  dropPower: number;
  effectiveStreak: number;
  onToggleCollection: () => void;
  onToggleDebug: () => void;
  onCloseCollection: () => void;
  onViewFullCollection: () => void;
  onCardKeep: () => void;
  playSequence: (frequencies: number[], noteDuration?: number, gainVal?: number) => void;
}

export default function GameOverlays({
  isBeta,
  showDebug,
  showCollectionOverlay,
  streakToast,
  lastCardDropped,
  cardReveal,
  dropStreak,
  dropPower,
  effectiveStreak,
  onToggleCollection,
  onToggleDebug,
  onCloseCollection,
  onViewFullCollection,
  onCardKeep,
  playSequence,
}: Props) {
  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {isBeta && (
          <>
            <span className="inline-block px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse">
              CARDS
            </span>
            <button
              onClick={onToggleCollection}
              className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all"
              title="Collection"
            >
              <i aria-hidden="true" className="fi fi-sr-template text-xs"></i>
            </button>
          </>
        )}
        <button
          onClick={onToggleDebug}
          className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all"
          title="Toggle debug panel"
        >
          <i aria-hidden="true" className="fi fi-sr-eye text-xs"></i>
        </button>
      </div>

      {showDebug && (
        <div className="fixed top-4 left-4 z-50 animate-in fade-in duration-300">
          <div className="bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl border border-zinc-700 shadow-2xl min-w-[140px]">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
              Eff {effectiveStreak} | Drop {dropStreak} | Pwr {dropPower}
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-zinc-500">None</span>
                <span className="text-zinc-500 tabular-nums">{getNoneDropRate(effectiveStreak).toFixed(0)}%</span>
              </div>
              {TIER_ORDER.map((tier) => {
                const rate = getDropRate(tier, effectiveStreak);
                return (
                  <div key={tier} className="flex justify-between text-[10px] font-bold">
                    <span className="text-zinc-400">{TIER_LABELS[tier]}</span>
                    <span className="text-amber-400 tabular-nums">{rate.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isBeta && showCollectionOverlay && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-black/85 backdrop-blur-xl px-5 py-4 rounded-2xl border border-zinc-700 shadow-2xl min-w-[260px]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Collection</p>
              <button
                onClick={onCloseCollection}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <i aria-hidden="true" className="fi fi-sr-cross text-xs"></i>
              </button>
            </div>
            {(() => {
              const col = loadCollection();
              const total = col.cards.length;
              const recent = [...col.cards].sort((a, b) => (b.lastCollected ?? 0) - (a.lastCollected ?? 0)).slice(0, 3);
              return (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-300">{total} / 26 cards</span>
                    <span className="text-xs font-bold text-amber-400">{col.totalPoints} pts</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-700 overflow-hidden">
                    <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${(total / 26) * 100}%` }} />
                  </div>
                  {recent.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Recent</p>
                      <div className="flex gap-2">
                        {recent.map(card => (
                          <div key={`${card.letter}-${card.tier}`} className="flex items-center gap-1.5 bg-zinc-800/60 px-2 py-1 rounded-lg">
                            <CardIllustration letter={card.letter} size={20} />
                            <span className="text-xs font-bold text-zinc-300">{card.letter}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => { onCloseCollection(); onViewFullCollection(); }}
                    className="w-full py-1.5 rounded-lg bg-violet-600/80 hover:bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    View Full Collection
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {streakToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="animate-in slide-in-from-top-2 duration-300">
            <div className="bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl border-2 border-orange-400 flex items-center gap-3">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-black text-orange-600 dark:text-orange-400 whitespace-nowrap">
                {streakToast}
              </span>
            </div>
          </div>
        </div>
      )}

      {lastCardDropped && (
        <>
          <div className="fixed inset-x-0 bottom-[15%] z-50 pointer-events-none flex justify-center">
            {(() => {
              const emojiKey = lastCardDropped.letter.toUpperCase();
              const word = CARD_WORDS[emojiKey] || "";
              const label = TIER_LABELS[lastCardDropped.tier] || lastCardDropped.tier;
              const tierSparkleColor: Record<string, string> = {
                common: "#a1a1aa",
                uncommon: "#4ade80",
                rare: "#60a5fa",
                "ultra-rare": "#c084fc",
                legendary: "#fbbf24",
              };
              const sparkleColor = tierSparkleColor[lastCardDropped.tier] || "#a1a1aa";
              return (
                <div className="animate-in zoom-in duration-300" style={{ width: "120px" }}>
                  <div className="absolute -top-1 -left-1 w-1.5 h-1.5 rounded-full pointer-events-none opacity-0" style={{ backgroundColor: sparkleColor, animation: "sparkle-pop 1s ease-out forwards", animationDelay: "0s" }} />
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full pointer-events-none opacity-0" style={{ backgroundColor: sparkleColor, animation: "sparkle-pop 1s ease-out forwards", animationDelay: "0.15s" }} />
                  <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full pointer-events-none opacity-0" style={{ backgroundColor: sparkleColor, animation: "sparkle-pop 1s ease-out forwards", animationDelay: "0.3s" }} />
                  <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 rounded-full pointer-events-none opacity-0" style={{ backgroundColor: sparkleColor, animation: "sparkle-pop 1s ease-out forwards", animationDelay: "0.45s" }} />
                  <CardFrame
                    tier={lastCardDropped.tier}
                    size="toast"
                    namePlate={`${word} · ${label}`}
                    holographic={isHolographicTier(lastCardDropped.tier)}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="-mt-7 -mb-4">
                        <CardIllustration letter={lastCardDropped.letter} size={60} />
                      </div>
                      <span className="text-base font-black leading-none text-zinc-800 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                        {lastCardDropped.letter}
                      </span>
                    </div>
                    {lastCardDropped.isNew && (
                      <span className="absolute top-1 right-1 text-[8px] font-black text-amber-600 bg-amber-100 px-1 rounded animate-pulse z-20">
                        NEW!
                      </span>
                    )}
                  </CardFrame>
                  <div className="text-center -mt-0.5">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest shadow-lg animate-in zoom-in duration-300">
                      +1 Drop Power
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
          <style>{`@keyframes sparkle-pop{0%{transform:scale(0);opacity:0}40%{transform:scale(1.2);opacity:1}100%{transform:scale(0.3);opacity:0}}`}</style>
        </>
      )}

      {isBeta && cardReveal && (
        <CardRevealModal
          letter={cardReveal.letter}
          tier={cardReveal.tier}
          isNew={cardReveal.isNew}
          onKeep={onCardKeep}
        />
      )}
    </>
  );
}
