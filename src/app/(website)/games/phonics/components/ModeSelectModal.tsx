"use client";

import { useEffect, useRef } from "react";
import type { MapBuilding, RoundConfig, PhonicsFormat, CefrLevel, RoundLength } from "../types";

interface ModeSelectModalProps {
  building: MapBuilding;
  onStart: (config: RoundConfig) => void;
  onClose: () => void;
}

export default function ModeSelectModal({ building, onStart, onClose }: ModeSelectModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap on open
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (building.category !== "phonics") return null; // only phonics unlocked in MVP

  function startPhonics(format: PhonicsFormat, level: CefrLevel, length: RoundLength) {
    onStart({
      category: "phonics",
      phonicsFormat: format,
      level,
      length,
    });
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
        ref={dialogRef}
        className="retro-border bg-[#FDFBF7] dark:bg-[#101F42] w-full max-w-md animate-slide-up-modal outline-none"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-[#1C1C1C] dark:border-[#D4AF37]">
          <h2 className="font-bold text-lg text-[#1C1C1C] dark:text-[#F7E1A0] tracking-widest" style={{ fontFamily: "var(--font-mali)" }}>
            {building.label}
          </h2>
          <button
            id="mode-select-close"
            className="text-[#888888] hover:text-[#1C1C1C] dark:hover:text-[#F7E1A0] text-xl"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Phonics Modes */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-[#888888] dark:text-[#B0C4DE] tracking-widest mb-3">SELECT MODE</p>

          <ModeCard
            id="mode-tap"
            title="TAP THE SOUND"
            description="Hear a phoneme — tap the correct word"
            color="#C8A44E"
            onClick={() => startPhonics("tap", "a1", 10)}
          />
          <ModeCard
            id="mode-speed"
            title="SPEED ROUND"
            description="Same as Tap but with a 3-second timer"
            color="#FF70A6"
            onClick={() => startPhonics("speed", "a1", 10)}
          />
          <ModeCard
            id="mode-pick-word"
            title="PICK THE WORD"
            description="See a phoneme — find the matching word"
            color="#2EC4B6"
            onClick={() => startPhonics("pick-word", "a1", 10)}
          />
          <ModeCard
            id="mode-card-flip"
            title="CARD FLIP"
            description="Match phonemes to words in memory style"
            color="#9B59B6"
            onClick={() => startPhonics("card-flip", "a1", 10)}
          />
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
