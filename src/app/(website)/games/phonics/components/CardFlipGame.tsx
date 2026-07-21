"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { CardFlipCard, CardFlipState } from "../types";

interface Props {
  cards: CardFlipCard[];
  onComplete: () => void;
  speak: (text: string) => void;
  playWordAudio: (word: string) => Promise<void>;
}

export default function CardFlipGame({ cards: initialCards, onComplete, speak, playWordAudio }: Props) {
  const [state, setState] = useState<CardFlipState>(() => ({
    cards: initialCards.map((c) => ({ ...c, flipped: false, matched: false })),
    selected: [],
    matched: [],
    flips: 0,
    pairsRemaining: initialCards.length / 2,
  }));

  const checkingRef = useRef(false);
  const matchAnnounceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.pairsRemaining === 0 && state.matched.length > 0) {
      if (matchAnnounceRef.current) {
        matchAnnounceRef.current.textContent = "All pairs matched!";
      }
      const timer = setTimeout(onComplete, 800);
      return () => clearTimeout(timer);
    }
  }, [state.pairsRemaining, state.matched.length, onComplete]);

  const handleCardTap = useCallback((index: number) => {
    const card = state.cards[index];
    if (checkingRef.current || card.flipped || card.matched) return;

    const newCards = state.cards.map((c, i) => (i === index ? { ...c, flipped: true } : c));
    const newSelected = [...state.selected, index];
    const newFlips = state.flips + 1;

    if (newSelected.length === 2) {
      checkingRef.current = true;
      const first = newCards[newSelected[0]];
      const second = newCards[newSelected[1]];

      if (first.matchId === second.matchId) {
        const matchedCards = newCards.map((c) =>
          c.matchId === first.matchId ? { ...c, matched: true } : c
        );
        setState({
          cards: matchedCards,
          selected: [],
          matched: [...state.matched, newSelected[0], newSelected[1]],
          flips: newFlips,
          pairsRemaining: state.pairsRemaining - 1,
        });
        checkingRef.current = false;
        if (matchAnnounceRef.current) {
          matchAnnounceRef.current.textContent = `Match found: ${first.label} + ${second.label}`;
        }
        playWordAudio(first.ttsText);
      } else {
        setState((prev) => ({
          ...prev,
          cards: newCards,
          selected: newSelected,
          flips: newFlips,
        }));
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            cards: prev.cards.map((c, i) =>
              newSelected.includes(i) ? { ...c, flipped: false } : c
            ),
            selected: [],
          }));
          checkingRef.current = false;
          if (matchAnnounceRef.current) {
            matchAnnounceRef.current.textContent = "No match — try again";
          }
        }, 800);
      }
    } else {
      setState({
        ...state,
        cards: newCards,
        selected: newSelected,
        flips: newFlips,
      });
    }
  }, [state, playWordAudio]);

  return (
    <div className="flex flex-col items-center justify-center px-4 py-6">
      <p className="text-xs text-[#1C1C1C]/50 dark:text-[#F7E1A0]/60 tracking-widest mb-2">
        MATCH PHONEMES TO WORDS
      </p>
      <p className="text-sm text-[#1C1C1C]/50 dark:text-[#F7E1A0]/60 mb-4">
        Flips: {state.flips} &middot; Pairs left: {state.pairsRemaining}
      </p>

      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-5 w-full max-w-4xl"
        role="group"
        aria-label="Card flip game — match phonemes to words"
      >
        {state.cards.map((card, i) => (
          <div
            key={card.id}
            className="perspective-1000 w-full aspect-square"
          >
            <button
              onClick={() => handleCardTap(i)}
              disabled={card.matched}
              className={`relative w-full h-full preserve-3d transition-transform duration-500 rounded-2xl cursor-pointer ${
                card.flipped || card.matched ? "rotate-y-180" : ""
              } ${card.matched ? "ring-4 ring-emerald-400 dark:ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900" : ""}`}
              aria-label={card.flipped || card.matched ? `${card.label} — ${card.matched ? "matched" : "face up"}` : "Face-down card"}
              aria-pressed={card.flipped || card.matched}
            >
              {/* Front Face (revealed card content) */}
              <div className="absolute inset-0 flex items-center justify-center p-2 rounded-2xl glass-panel text-[#1C1C1C] dark:text-[#F7E1A0] backface-hidden rotate-y-180 border-2 border-[#2EC4B6]/20">
                <span className="text-sm md:text-base font-bold text-center break-words select-none leading-tight">
                  {card.label}
                </span>
              </div>

              {/* Back Face (hidden state) */}
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#2EC4B6] to-[#0f8a7e] dark:from-[#1a8a7f] dark:to-[#0d4f49] text-white backface-hidden border-2 border-white/20 shadow-md hover:brightness-110 active:scale-[0.97] transition-all">
                <span className="text-xl md:text-2xl font-bold font-mono text-white/90 drop-shadow-sm select-none">
                  ?
                </span>
              </div>
            </button>
          </div>
        ))}
      </div>
      <div
        ref={matchAnnounceRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
    </div>
  );
}
