"use client";

import { useEffect, useRef, useCallback } from "react";
import type { MapBuilding, RoundConfig, PhonicsFormat, SpellingFormat, DefinitionDirection, CefrLevel, RoundLength } from "../types";

interface ModeSelectModalProps {
  building: MapBuilding;
  onStart: (config: RoundConfig) => void;
  onClose: () => void;
}

export default function ModeSelectModal({ building, onStart, onClose }: ModeSelectModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Focus trap: cycle Tab between focusable children
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const modal = dialogRef.current;
    if (!modal) return;
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  function startPhonics(format: PhonicsFormat, level: CefrLevel, length: RoundLength) {
    onStart({ category: "phonics", phonicsFormat: format, level, length });
  }

  function startSpelling(format: SpellingFormat, level: CefrLevel, length: RoundLength) {
    onStart({ category: "spelling", spellingFormat: format, level, length });
  }

  function startDefinitions(direction: DefinitionDirection, level: CefrLevel, length: RoundLength) {
    onStart({ category: "definitions", definitionDirection: direction, level, length });
  }

  const category = building.category ?? "phonics";
  const accentColor = category === "spelling" ? "#FF5733" : category === "definitions" ? "#9B59B6" : "#2EC4B6";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
      aria-label="Mode Selection"
    >
      <div
        ref={dialogRef}
        className="retro-border bg-[#FDFBF7] dark:bg-[#101F42] w-full max-w-md animate-slide-up-modal outline-none"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b-2" style={{ borderColor: accentColor }}>
          <h2 className="font-bold text-lg tracking-widest" style={{ fontFamily: "var(--font-mali)", color: accentColor }}>
            {building.label}
          </h2>
          <button
            id="mode-select-close"
            className="text-xl transition-colors"
            style={{ color: "#888888" }}
            onClick={onClose}
            aria-label="Close"
            onMouseEnter={(e) => e.currentTarget.style.color = accentColor}
            onMouseLeave={(e) => e.currentTarget.style.color = "#888888"}
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-[#888888] dark:text-[#B0C4DE] tracking-widest mb-3">SELECT MODE</p>

          {category === "phonics" && (
            <>
              <ModeCard id="mode-tap" title="TAP THE SOUND" description="Hear a phoneme — tap the correct word" color="#C8A44E" onClick={() => startPhonics("tap", "a1", 10)} />
              <ModeCard id="mode-speed" title="SPEED ROUND" description="Same as Tap but with a 3-second timer" color="#FF70A6" onClick={() => startPhonics("speed", "a1", 10)} />
              <ModeCard id="mode-card-flip" title="CARD FLIP" description="Match phonemes to words in memory style" color="#9B59B6" onClick={() => startPhonics("card-flip", "a1", 10)} />
            </>
          )}

          {category === "spelling" && (
            <>
              <ModeCard id="mode-spelling-choice" title="SPELLING CHOICE" description="Pick the correct spelling from four options" color="#2EC4B6" onClick={() => startSpelling("choice", "a1", 10)} />
              <ModeCard id="mode-spelling-tiles" title="SPELLING TILES" description="Arrange letter tiles to spell the word" color="#C8A44E" onClick={() => startSpelling("tiles", "a1", 5)} />
              <ModeCard id="mode-spelling-mixed" title="MIXED SPELLING" description="Both choice and tiles, randomly mixed" color="#FF70A6" onClick={() => startSpelling("mixed", "a1", 10)} />
            </>
          )}

          {category === "definitions" && (
            <>
              <ModeCard id="mode-def-to-word" title="DEFINITION → WORD" description="See the definition — tap the correct word" color="#2EC4B6" onClick={() => startDefinitions("def-to-word", "a1", 10)} />
              <ModeCard id="mode-word-to-def" title="WORD → DEFINITION" description="See the word — tap the correct definition" color="#9B59B6" onClick={() => startDefinitions("word-to-def", "a1", 10)} />
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
      className="w-full retro-border p-4 text-left hover:opacity-90 active:scale-95 transition-transform bg-[#FDFBF7] dark:bg-[#0A1128]"
      onClick={onClick}
      style={{ borderLeftWidth: 6, borderLeftColor: color }}
    >
      <p className="font-bold text-sm tracking-widest text-[#1C1C1C] dark:text-[#F7E1A0]" style={{ color }}>{title}</p>
      <p className="text-xs text-[#888888] dark:text-[#B0C4DE] mt-0.5">{description}</p>
    </button>
  );
}
