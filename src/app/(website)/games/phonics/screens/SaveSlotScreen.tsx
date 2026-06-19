"use client";

import { useState, useEffect } from "react";
import { getSlotPreview, deleteSave } from "../save";
import type { SlotPreview, CompanionId, CefrLevel } from "../types";
import { COMPANIONS } from "../constants";
import MascotCanvas from "../components/MascotCanvas";

interface SaveSlotScreenProps {
  onSelectSlot: (slot: number | "guest", nameInput?: string, startLevel?: CefrLevel, startPlacement?: boolean) => void;
}

const SLOT_COUNT = 3;

function formatDate(ts: number | null): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function SlotMascot({ companion, size = 48 }: { companion: CompanionId; size?: number }) {
  return (
    <MascotCanvas
      companionId={companion}
      size={size}
      className="rounded-2xl bg-white/20 dark:bg-slate-900/30 p-1.5 border border-white/30 dark:border-slate-800 shadow-sm"
    />
  );
}

function CompanionBadge({ companion }: { companion: CompanionId | null }) {
  if (!companion) return null;
  const data = COMPANIONS[companion];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold rounded-full tracking-wider uppercase"
      style={{ background: data.color + "20", color: data.color, border: `1.5px solid ${data.color}` }}
    >
      {data.name}
    </span>
  );
}

export default function SaveSlotScreen({ onSelectSlot }: SaveSlotScreenProps) {
  const [slots, setSlots] = useState<SlotPreview[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [onboardingSlot, setOnboardingSlot] = useState<number | "guest" | null>(null);
  const [newName, setNewName] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>("b1");

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
    <div className="flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-[#E0F2FE] via-[#F0FDFA] to-[#FEF3C7] dark:from-[#0B132B] dark:via-[#1B254B] dark:to-[#3E1B5D] min-h-full flex flex-col justify-between">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-md mx-auto w-full">
        {/* Title */}
        <div className="mb-10 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-[#C8A44E]/10 border border-[#C8A44E]/30 text-xs font-bold text-[#C8A44E] dark:text-[#F7E1A0] mb-3 uppercase tracking-widest animate-pulse flex items-center gap-1.5 justify-center">
            <i className="fi fi-sr-island-tropical text-sm" /> Phonics Adventure
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-[#F7E1A0] tracking-wider uppercase drop-shadow-xs" style={{ fontFamily: "var(--font-mali)" }}>
            PHONICS ISLAND
          </h1>
          <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">SELECT SAVE FILE</p>
        </div>

        {/* Slot Grid */}
        <div className="w-full space-y-4">
          {slots.map((slot) => (
            <div
              key={slot.slot}
              className="relative group cursor-pointer"
            >
              <div
                className={`w-full text-left rounded-3xl glass-panel p-5 border shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md hover:border-white/70 active:scale-[0.99] flex items-center justify-between ${
                  slot.empty 
                    ? "border-dashed border-slate-300 dark:border-slate-700 bg-white/30 dark:bg-slate-900/10" 
                    : "border-white/40 dark:border-slate-800"
                }`}
                onClick={() => {
                  if (slot.empty) {
                    setOnboardingSlot(slot.slot);
                    setNewName(`Slot ${slot.slot}`);
                    setSelectedLevel("b1");
                  } else {
                    onSelectSlot(slot.slot);
                  }
                }}
                role="button"
                tabIndex={0}
                id={`save-slot-${slot.slot}`}
                aria-label={slot.empty ? `Empty slot ${slot.slot}` : `Load ${slot.name}`}
                onKeyDown={(e) => e.key === "Enter" && (slot.empty ? (setOnboardingSlot(slot.slot), setNewName(`Slot ${slot.slot}`), setSelectedLevel("b1")) : onSelectSlot(slot.slot))}
              >
                {slot.empty ? (
                  <div className="flex items-center gap-4 py-2">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/50 dark:bg-slate-800/50 border border-slate-300/50 dark:border-slate-700/50 text-[#2EC4B6] text-2xl font-light shadow-inner">
                      +
                    </div>
                    <div>
                      <span className="text-slate-700 dark:text-slate-200 font-bold tracking-wider text-sm block">NEW GAME</span>
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">SLOT {slot.slot}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 w-full">
                    {/* Render live Mascot Canvas */}
                    <div className="shrink-0">
                      <SlotMascot companion={slot.companion ?? "nox"} size={52} />
                    </div>

                    <div className="flex-1 space-y-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800 dark:text-[#F7E1A0] text-base truncate pr-2" style={{ fontFamily: "var(--font-mali)" }}>
                          {slot.name}
                        </span>
                        <CompanionBadge companion={slot.companion} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><i className="fi fi-sr-wallet text-amber-500 text-xs" /> {slot.coins}</span>
                        <span className="flex items-center gap-1"><i className="fi fi-sr-clipboard-list-check text-slate-400 text-xs" /> {slot.rounds} rounds</span>
                        <span className="flex items-center gap-1"><i className="fi fi-sr-flame text-rose-500 text-xs" /> Best: {slot.bestStreak}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(slot.timestamp)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Absolute Delete Button for existing save slots */}
              {!slot.empty && (
                <button
                  id={`delete-slot-${slot.slot}`}
                  className="absolute top-4 right-4 z-10 p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-90 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(slot.slot);
                  }}
                  title="Delete Save File"
                  aria-label="Delete save file"
                >
                  <i className="fi fi-sr-trash text-sm" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Play as Guest Button */}
        <button
          id="guest-mode-btn"
          className="mt-10 px-6 py-2.5 rounded-full text-xs font-extrabold tracking-widest text-slate-500 dark:text-slate-400 hover:text-[#C8A44E] dark:hover:text-[#F7E1A0] border border-slate-300 dark:border-slate-700 bg-white/20 dark:bg-slate-900/10 hover:bg-white/40 dark:hover:bg-slate-800/20 active:scale-95 transition-all cursor-pointer uppercase shadow-xs"
          onClick={() => {
            setOnboardingSlot("guest");
            setNewName("Guest");
            setSelectedLevel("b1");
          }}
        >
          Play as Guest (no save)
        </button>
      </div>

      {/* Modern Deletion Confirmation Overlay Dialog */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel max-w-sm w-full p-6 rounded-3xl border border-white/30 dark:border-slate-800 shadow-2xl animate-scale-up text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mx-auto mb-4 animate-bounce">
              <i className="fi fi-sr-exclamation" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white" style={{ fontFamily: "var(--font-mali)" }}>
              Delete Save Slot {confirmDelete}?
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              This action is permanent and cannot be undone. You will lose all coins, streaks, and progress!
            </p>
            <div className="mt-6 flex gap-3">
              <button
                id={`cancel-delete-slot-${confirmDelete}`}
                className="flex-1 px-4 py-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 font-bold text-xs tracking-wider uppercase hover:bg-white/90 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer btn-3d"
                onClick={() => setConfirmDelete(null)}
                style={{ "--border-color": "rgba(0,0,0,0.1)" } as React.CSSProperties}
              >
                CANCEL
              </button>
              <button
                id={`confirm-delete-slot-${confirmDelete}`}
                className="flex-1 px-4 py-3 rounded-2xl bg-rose-500 text-white font-bold text-xs tracking-wider uppercase hover:bg-rose-600 active:scale-95 transition-all cursor-pointer btn-3d"
                onClick={() => handleDelete(confirmDelete)}
                style={{ "--border-color": "#a83242" } as React.CSSProperties}
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Welcome Onboarding Modal */}
      {onboardingSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setOnboardingSlot(null)}>
          <div className="glass-panel max-w-sm w-full p-6 rounded-3xl border border-white/30 dark:border-slate-800 shadow-2xl animate-scale-up text-center bg-white/95 dark:bg-slate-900/95" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-[#C8A44E]/10 text-[#C8A44E] flex items-center justify-center text-xl mx-auto mb-3">
              <i className="fi fi-sr-island-tropical" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white" style={{ fontFamily: "var(--font-mali)" }}>
              Welcome to Phonics Island!
            </h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Configure your profile</p>

            <div className="mt-4 space-y-4 text-left">
              {/* Name Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="onboard-name" className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Adventurer Name
                </label>
                <input
                  id="onboard-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.slice(0, 16))}
                  placeholder="Enter name..."
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-100 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#C8A44E] shadow-inner"
                />
              </div>

              {/* CEFR Grid */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Select Starting English Level
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["a1", "a2", "b1", "b2", "c1", "c2"] as CefrLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className={`py-1.5 rounded-lg font-bold text-[10px] text-center tracking-wider uppercase transition-all active:scale-95 cursor-pointer ${
                        selectedLevel === lvl
                          ? "bg-[#C8A44E] text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-200/50 dark:hover:bg-slate-700"
                      }`}
                      onClick={() => setSelectedLevel(lvl)}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Focus: We will prioritize{" "}
                  {selectedLevel === "a1"
                    ? "A1 and A2"
                    : selectedLevel === "c2"
                    ? "C1 and C2"
                    : `${selectedLevel === "a2" ? "A1" : selectedLevel === "b1" ? "A2" : selectedLevel === "b2" ? "B1" : "B2"}, ${selectedLevel.toUpperCase()}, and ${selectedLevel === "a2" ? "B1" : selectedLevel === "b1" ? "B2" : selectedLevel === "b2" ? "C1" : selectedLevel === "c1" ? "C2" : "C2"}`}{" "}
                  words, with a few adjacent levels to adapt to your skills.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                id="onboard-placement"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#2EC4B6] to-[#0f8a7e] text-white font-extrabold text-xs tracking-wider uppercase hover:brightness-105 active:scale-95 transition-all cursor-pointer btn-3d shadow-md"
                onClick={() => {
                  onSelectSlot(onboardingSlot, newName, selectedLevel, true);
                  setOnboardingSlot(null);
                }}
                style={{ "--border-color": "#0d4f49" } as React.CSSProperties}
              >
                🚀 START PLACEMENT TEST
              </button>
              <button
                id="onboard-direct"
                className="w-full py-3 rounded-2xl bg-[#C8A44E] text-white font-extrabold text-xs tracking-wider uppercase hover:brightness-105 active:scale-95 transition-all cursor-pointer btn-3d"
                onClick={() => {
                  onSelectSlot(onboardingSlot, newName, selectedLevel, false);
                  setOnboardingSlot(null);
                }}
                style={{ "--border-color": "#91722e" } as React.CSSProperties}
              >
                💾 DIRECT START ({selectedLevel.toUpperCase()})
              </button>
              <button
                id="onboard-cancel"
                className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs tracking-wider uppercase hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer text-center"
                onClick={() => setOnboardingSlot(null)}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
