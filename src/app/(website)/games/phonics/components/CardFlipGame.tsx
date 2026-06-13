"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { CardFlipCard, CardFlipState } from "../types";

interface Props {
  cards: CardFlipCard[];
  onComplete: () => void;
  speak: (text: string) => void;
}

export default function CardFlipGame({ cards: initialCards, onComplete, speak }: Props) {
  const [state, setState] = useState<CardFlipState>(() => ({
    cards: initialCards.map((c) => ({ ...c, flipped: false, matched: false })),
    selected: [],
    matched: [],
    flips: 0,
    pairsRemaining: initialCards.length / 2,
  }));

  const checkingRef = useRef(false);

  useEffect(() => {
    if (state.pairsRemaining === 0 && state.matched.length > 0) {
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
        speak(first.ttsText);
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
  }, [state, speak, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center px-4 py-6">
      <p className="text-xs text-[#888888] dark:text-[#B0C4DE] tracking-widest mb-2">
        MATCH PHONEMES TO WORDS
      </p>
      <p className="text-sm text-[#888888] dark:text-[#B0C4DE] mb-4">
        Flips: {state.flips} &middot; Pairs left: {state.pairsRemaining}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-sm">
        {state.cards.map((card, i) => (
          <button
            key={card.id}
            className={`retro-border w-full aspect-square text-sm font-bold tracking-wide transition-all duration-500
              ${card.matched ? "ring-2 ring-[#2ECC40] opacity-70" : ""}
              ${card.flipped || card.matched
                ? "bg-[#FDFBF7] dark:bg-[#0A1128] text-[#1C1C1C] dark:text-[#F7E1A0]"
                : "bg-[#C8A44E] dark:bg-[#2A3F6E] text-transparent"
              }
              hover:opacity-80 active:scale-95`}
            onClick={() => handleCardTap(i)}
            disabled={card.matched}
            style={{ perspective: "1000px" }}
          >
            <span className={`block transition-opacity duration-300 ${card.flipped || card.matched ? "opacity-100" : "opacity-0"}`}>
              {card.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
