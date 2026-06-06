"use client";

import { useState, useEffect } from "react";
import { getSlotPreview, deleteSave } from "../save";
import type { SlotPreview, CompanionId } from "../types";
import { COMPANIONS } from "../constants";

interface SaveSlotScreenProps {
  onSelectSlot: (slot: number | "guest") => void;
}

const SLOT_COUNT = 3;

function formatDate(ts: number | null): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function CompanionBadge({ companion }: { companion: CompanionId | null }) {
  if (!companion) return null;
  const data = COMPANIONS[companion];
  return (
    <span
      className="inline-block px-2 py-0.5 text-xs font-bold rounded"
      style={{ background: data.color + "33", color: data.color, border: `1.5px solid ${data.color}` }}
    >
      {data.name} ({data.type})
    </span>
  );
}

export default function SaveSlotScreen({ onSelectSlot }: SaveSlotScreenProps) {
  const [slots, setSlots] = useState<SlotPreview[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSlots(Array.from({ length: SLOT_COUNT }, (_, i) => getSlotPreview(i + 1)));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function handleDelete(slot: number) {
    deleteSave(slot);
    setSlots((prev) => prev.map((s) => s.slot === slot ? getSlotPreview(slot) : s));
    setConfirmDelete(null);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#A2D2FF] dark:bg-[#0A1128]">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-[#1C1C1C] dark:text-[#F7E1A0] tracking-widest uppercase" style={{ fontFamily: "var(--font-mali)" }}>
          PHONICS ISLAND
        </h1>
        <p className="mt-2 text-sm text-[#1C1C1C]/60 dark:text-[#F7E1A0]/50 tracking-wide">SELECT SAVE FILE</p>
      </div>

      {/* Save Slots */}
      <div className="w-full max-w-md space-y-4">
        {slots.map((slot) => (
          <div
            key={slot.slot}
            className="retro-border bg-[#FDFBF7] dark:bg-[#101F42] cursor-pointer transition-transform active:scale-95 hover:scale-[1.02]"
            onClick={() => !confirmDelete && onSelectSlot(slot.slot)}
            role="button"
            tabIndex={0}
            id={`save-slot-${slot.slot}`}
            aria-label={slot.empty ? `Empty slot ${slot.slot}` : `Load ${slot.name}`}
            onKeyDown={(e) => e.key === "Enter" && !confirmDelete && onSelectSlot(slot.slot)}
          >
            <div className="p-4">
              {slot.empty ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl text-[#888888]">+</span>
                  <span className="text-[#888888] dark:text-[#3D3B3C] font-bold tracking-widest text-sm">NEW GAME — SLOT {slot.slot}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1C1C1C] dark:text-[#F7E1A0] text-lg tracking-wide" style={{ fontFamily: "var(--font-mali)" }}>
                      {slot.name}
                    </span>
                    <CompanionBadge companion={slot.companion} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#888888] dark:text-[#B0C4DE]">
                    <span>🪙 {slot.coins}</span>
                    <span>📋 {slot.rounds} rounds</span>
                    <span>🔥 Best: {slot.bestStreak}</span>
                  </div>
                  <p className="text-xs text-[#888888] dark:text-[#3D3B3C]/80 mt-1">{formatDate(slot.timestamp)}</p>
                  {/* Delete confirm */}
                  {confirmDelete === slot.slot ? (
                    <div className="mt-2 flex gap-2">
                      <button
                        id={`confirm-delete-slot-${slot.slot}`}
                        className="px-3 py-1 text-xs font-bold bg-[#FF70A6] text-white retro-border hover:opacity-90"
                        onClick={(e) => { e.stopPropagation(); handleDelete(slot.slot); }}
                      >DELETE</button>
                      <button
                        id={`cancel-delete-slot-${slot.slot}`}
                        className="px-3 py-1 text-xs font-bold bg-[#F0F0F0] dark:bg-[#3D3B3C] text-[#1C1C1C] dark:text-white retro-border hover:opacity-90"
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                      >CANCEL</button>
                    </div>
                  ) : (
                    <button
                      id={`delete-slot-${slot.slot}`}
                      className="mt-1 text-xs text-[#FF70A6] hover:underline"
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(slot.slot); }}
                    >Delete save</button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Guest Mode */}
      <button
        id="guest-mode-btn"
        className="mt-8 text-sm text-[#1C1C1C]/50 dark:text-[#F7E1A0]/40 hover:text-[#1C1C1C] dark:hover:text-[#F7E1A0] underline tracking-wide"
        onClick={() => onSelectSlot("guest")}
      >
        Play as Guest (no save)
      </button>
    </div>
  );
}
