"use client";

import { useState } from "react";
import { useGame } from "../context";
import { COMPANIONS } from "../constants";
import type { CompanionId } from "../types";

export default function SettingsScreen() {
  const { save, companion, setCompanion, muted, toggleMute, crtEffect, toggleCrt, setScreen } = useGame();
  const [saved, setSaved] = useState(false);

  function saveSettings() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-10 bg-[#A2D2FF] dark:bg-[#0A1128]">
      {/* Header */}
      <div className="w-full max-w-md flex items-center gap-4 mb-8">
        <button
          id="settings-back"
          className="retro-border px-3 py-1 text-sm font-bold bg-[#FDFBF7] dark:bg-[#101F42] text-[#1C1C1C] dark:text-[#F7E1A0] hover:opacity-90 active:scale-95"
          onClick={() => setScreen("map")}
        >
          ← BACK
        </button>
        <h1 className="text-2xl font-bold text-[#1C1C1C] dark:text-[#F7E1A0] tracking-widest" style={{ fontFamily: "var(--font-mali)" }}>
          SETTINGS
        </h1>
      </div>

      <div className="w-full max-w-md space-y-5">
        {/* Audio */}
        <Section title="AUDIO">
          <ToggleRow
            id="setting-mute"
            label="Mute All Sound"
            value={muted}
            onToggle={toggleMute}
          />
        </Section>

        {/* Display */}
        <Section title="DISPLAY">
          <ToggleRow
            id="setting-crt"
            label="CRT Scanline Effect"
            value={crtEffect}
            onToggle={toggleCrt}
          />
        </Section>

        {/* Companion */}
        <Section title="COMPANION">
          <div className="grid grid-cols-3 gap-3">
            {Object.values(COMPANIONS).map((c) => (
              <button
                key={c.id}
                id={`companion-select-${c.id}`}
                className={`retro-border p-3 text-center transition-transform active:scale-95 ${
                  companion === c.id
                    ? "bg-[#C8A44E] text-[#1C1C1C]"
                    : "bg-[#FDFBF7] dark:bg-[#101F42] text-[#1C1C1C] dark:text-[#F7E1A0] hover:opacity-90"
                }`}
                onClick={() => setCompanion(c.id as CompanionId)}
              >
                <div className="text-lg font-bold" style={{ fontFamily: "var(--font-mali)" }}>{c.name}</div>
                <div className="text-xs opacity-70">{c.type}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-[#888888] dark:text-[#B0C4DE] mt-2">
            {COMPANIONS[companion]?.personality}
          </p>
        </Section>

        {/* Save info */}
        {save && (
          <Section title="SAVE DATA">
            <div className="space-y-1">
              <InfoRow label="File Name" value={save.name} />
              <InfoRow label="Total Rounds" value={String(save.totalRoundsPlayed)} />
              <InfoRow label="Total Correct" value={String(save.totalCorrects)} />
              <InfoRow label="Best Streak" value={String(save.bestStreak)} />
              <InfoRow label="Coins" value={String(save.phonemeCoins)} />
            </div>
          </Section>
        )}

        {/* Save button */}
        <button
          id="settings-save-btn"
          className="w-full retro-border py-3 font-bold text-sm tracking-widest bg-[#2EC4B6] text-[#1C1C1C] hover:opacity-90 active:scale-95 transition-all"
          onClick={saveSettings}
        >
          {saved ? "SAVED! ✓" : "SAVE SETTINGS"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="retro-border bg-[#FDFBF7] dark:bg-[#101F42] overflow-hidden">
      <div className="px-4 py-2 border-b-2 border-[#1C1C1C] dark:border-[#D4AF37] bg-[#C8A44E]/20">
        <p className="text-xs font-bold tracking-widest text-[#1C1C1C] dark:text-[#F7E1A0]">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ToggleRow({ id, label, value, onToggle }: { id: string; label: string; value: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#1C1C1C] dark:text-[#F7E1A0]">{label}</span>
      <button
        id={id}
        className={`w-12 h-6 retro-border transition-colors ${
          value ? "bg-[#2EC4B6]" : "bg-[#888888]"
        }`}
        onClick={onToggle}
        aria-checked={value}
        role="switch"
        aria-label={label}
      >
        <div className={`w-4 h-4 mx-auto bg-white transition-transform ${value ? "translate-x-3" : "-translate-x-3"}`} />
      </button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[#888888] dark:text-[#B0C4DE]">{label}</span>
      <span className="font-bold text-[#1C1C1C] dark:text-[#F7E1A0]">{value}</span>
    </div>
  );
}
