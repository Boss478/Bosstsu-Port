'use client';

import { useEffect, useState } from 'react';
import {
  TIER_ORDER,
  TIER_LABELS,
  getCardWord,
  loadCollection,
  TOTAL_CARD_SLOTS,
  isHolographicTier,
  TIER_LETTERS,
} from '../../cards/cards';
import type { CardTier } from '../../cards/cards';
import { CardFrame } from '../../cards/CardFrame';
import { CardWordIllustration } from '../../cards/CardWordArt';

const TIER_BG_FILL: Record<CardTier, string> = {
  common: 'bg-zinc-400',
  uncommon: 'bg-green-500',
  rare: 'bg-blue-500',
  'ultra-rare': 'bg-purple-500',
  legendary: 'bg-amber-500',
};

function AllCardsFace({
  letter,
  tier,
  collected,
  grayscale,
}: {
  letter: string;
  tier: CardTier;
  collected: boolean;
  grayscale: boolean;
}) {
  const word = getCardWord(letter, tier);
  return (
    <div
      className={`relative w-full aspect-[5/7] transition-all duration-300 ${
        grayscale
          ? `grayscale ${collected ? 'opacity-90' : 'opacity-50'}`
          : collected
            ? 'cursor-default'
            : 'hover:opacity-90'
      }`}
    >
      <CardFrame
        tier={tier}
        namePlate={`${word || letter} · ${TIER_LABELS[tier]}`}
        holographic={isHolographicTier(tier)}
      >
        <div className="-mt-8 -mb-8">
          <CardWordIllustration word={word} letter={letter} size={125} />
        </div>
        <span className="text-4xl font-black leading-none text-zinc-800 drop-shadow-[0_2px_3px_rgba(255,255,255,0.9)]">
          {letter}
        </span>
      </CardFrame>
      {!collected && (
        <span
          className="absolute -top-1.5 -left-1.5 text-lg z-10 drop-shadow-lg"
          aria-hidden="true"
        >
          🔒
        </span>
      )}
      {collected && (
        <span
          className="absolute -top-1.5 -right-1.5 text-sm z-10 drop-shadow-lg"
          aria-hidden="true"
        >
          ✅
        </span>
      )}
    </div>
  );
}

interface Props {
  onClose: () => void;
}

export default function AllCardsModal({ onClose }: Props) {
  const [collection] = useState(() => loadCollection());
  const [grayscale, setGrayscale] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const owned = new Set(collection.cards.map((c) => `${c.letter}-${c.tier}`));

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/10 animate-in fade-in duration-300 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="All Cards"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-zinc-100 dark:border-zinc-800 shrink-0">
          <div>
            <h2 className="text-xl font-black text-violet-600 dark:text-violet-400">
              ✨ All Cards
            </h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {collection.cards.length}/{TOTAL_CARD_SLOTS} collected
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setGrayscale(false)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  !grayscale
                    ? 'bg-white dark:bg-zinc-600 text-zinc-800 dark:text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
                aria-pressed={!grayscale}
              >
                🎨 Color
              </button>
              <button
                onClick={() => setGrayscale(true)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  grayscale
                    ? 'bg-white dark:bg-zinc-600 text-zinc-800 dark:text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
                aria-pressed={grayscale}
              >
                ⬛ B&W
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-black transition-colors"
              aria-label="Close All Cards"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-8">
          {TIER_ORDER.map((tier) => {
            const letters = TIER_LETTERS[tier];
            const collectedCount = letters.filter((l) => owned.has(`${l}-${tier}`)).length;
            return (
              <div key={tier}>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className={`h-5 w-1.5 rounded-full ${TIER_BG_FILL[tier]}`} />
                  <span className="text-lg font-black tracking-wider text-zinc-700 dark:text-zinc-200">
                    {TIER_LABELS[tier]}
                  </span>
                  <span className="text-sm font-bold text-zinc-400">
                    {collectedCount}/{letters.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-3xl mx-auto">
                  {letters.map((letter) => (
                    <AllCardsFace
                      key={`${letter}-${tier}`}
                      letter={letter}
                      tier={tier}
                      collected={owned.has(`${letter}-${tier}`)}
                      grayscale={grayscale}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
