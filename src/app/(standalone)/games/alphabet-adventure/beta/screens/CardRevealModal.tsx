'use client';

import { useState, useEffect } from 'react';
import type { CardTier } from '../../cards/cards';
import { CARD_WORDS, TIER_LABELS, isHolographicTier } from '../../cards/cards';
import { CardIllustration } from '../../cards/CardIllustrations';
import { CardFrame } from '../../cards/CardFrame';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface Props {
  letter: string;
  tier: CardTier;
  isNew: boolean;
  onKeep: () => void;
}

const TIER_BTN: Record<CardTier, string> = {
  common: 'bg-zinc-600 hover:bg-zinc-500 shadow-zinc-800',
  uncommon: 'bg-green-600 hover:bg-green-500 shadow-green-800',
  rare: 'bg-blue-600 hover:bg-blue-500 shadow-blue-800',
  'ultra-rare': 'bg-purple-600 hover:bg-purple-500 shadow-purple-800',
  legendary: 'bg-amber-600 hover:bg-amber-500 shadow-amber-800',
};

const TIER_RING: Record<CardTier, string> = {
  common: 'border-zinc-400/40 dark:border-zinc-500/40',
  uncommon: 'border-green-400/40 dark:border-green-500/40',
  rare: 'border-blue-400/40 dark:border-blue-500/40',
  'ultra-rare': 'border-purple-400/40 dark:border-purple-500/40',
  legendary: 'border-amber-400/40 dark:border-amber-500/40',
};

export default function CardRevealModal({ letter, tier, isNew, onKeep }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [showKeep, setShowKeep] = useState(false);
  const focusTrapRef = useFocusTrap(true);

  useEffect(() => {
    if (flipped) {
      const t = setTimeout(() => setShowKeep(true), 1000);
      return () => clearTimeout(t);
    }
  }, [flipped]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onKeep();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKeep]);

  const word = CARD_WORDS[letter] || '';

  return (
    <div
      ref={focusTrapRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
    >
      <p className="text-white/80 text-sm font-bold mb-6 tracking-wider uppercase">
        {flipped ? (isNew ? 'New Card Collected!' : 'Collected!') : 'Tap the card to reveal'}
      </p>

      <div className="relative" style={{ perspective: '1200px' }}>
        <div
          className="relative transition-transform duration-[600ms] cursor-pointer"
          style={{
            width: '18rem',
            height: '25.2rem',
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
          onClick={() => {
            if (!flipped) setFlipped(true);
            else if (showKeep) onKeep();
          }}
          onKeyDown={(e) => {
            if (!flipped && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setFlipped(true);
            } else if (flipped && showKeep && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onKeep();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={flipped ? 'Card revealed' : 'Tap to reveal card'}
        >
          {/* — Card Back — */}
          <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
            <CardFrame tier={tier} showBack size="modal" />
          </div>

          {/* — Card Face — */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <CardFrame
              tier={tier}
              size="modal"
              namePlate={word ? `${word} · ${TIER_LABELS[tier]}` : TIER_LABELS[tier]}
              holographic={isHolographicTier(tier)}
            >
              {isNew && (
                <span className="absolute -top-2 -right-2 text-xs font-black text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full z-20 shadow-lg animate-in zoom-in duration-300">
                  NEW!
                </span>
              )}
              <div className="-mt-10 -mb-12">
                <CardIllustration letter={letter} size={200} />
              </div>
              <span className="text-6xl font-black leading-none text-zinc-800 drop-shadow-[0_3px_5px_rgba(255,255,255,0.9)]">
                {letter}
              </span>
              {word && <span className="text-sm font-bold text-zinc-500">{word}</span>}
            </CardFrame>
          </div>
        </div>

        {flipped && (
          <div
            className={`absolute -inset-4 rounded-[4rem] border-[5px] opacity-35 blur-[3px] animate-pulse pointer-events-none transition-opacity duration-500 ${TIER_RING[tier]}`}
            style={{ zIndex: -1 }}
          />
        )}

        {flipped && isNew && (
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: -1 }}>
            {[...Array(12)].map((_, i) => {
              const sparkleColor =
                tier === 'legendary'
                  ? '#fbbf24'
                  : tier === 'ultra-rare'
                    ? '#c084fc'
                    : tier === 'rare'
                      ? '#60a5fa'
                      : tier === 'uncommon'
                        ? '#4ade80'
                        : '#a1a1aa';
              return (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 30}deg)`,
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: sparkleColor,
                      animation: `particle-pop 0.8s ease-out ${i * 0.04}s forwards`,
                    }}
                  />
                </div>
              );
            })}
            <style>{`@keyframes particle-pop{0%{opacity:0;transform:translateY(-130px) scale(0)}30%{opacity:1;transform:translateY(-130px) scale(1.2)}100%{opacity:0;transform:translateY(-130px) scale(0.2)}`}</style>
          </div>
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
