"use client";

import { useState, useRef } from "react";
import { useGame } from "../context";
import { CEFR_LEVEL_ORDER, CEFR_LEVEL_LABELS } from "../constants";
import { useAudio } from "@/hooks/useAudio";
import { deleteSave } from "../save";
import { useTheme } from "@/components/ThemeProvider";

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const { save, persistSave, muted, toggleMute, setScreen, voiceURI, setVoiceURI, voices, speechRate, setSpeechRate, speechPitch, setSpeechPitch, activeSlot, startRound } = useGame();
  const [saved, setSaved] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [renameInput, setRenameInput] = useState(save?.name ?? "");
  const [glassLevel, setGlassLevel] = useState(save?.settings.glassLevel ?? 25);
  const glassTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const { playSound, speechUnavailable } = useAudio();

  const handleGlassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const level = Number(e.target.value);
    setGlassLevel(level);
    if (glassTimerRef.current) clearTimeout(glassTimerRef.current);
    glassTimerRef.current = setTimeout(() => {
      if (save) {
        persistSave({ ...save, settings: { ...save.settings, glassLevel: level } });
      }
    }, 100);
  };

  const resetGlass = () => {
    setGlassLevel(25);
    if (glassTimerRef.current) clearTimeout(glassTimerRef.current);
    if (save) {
      persistSave({ ...save, settings: { ...save.settings, glassLevel: 25 } });
    }
  };

  function saveSettings() {
    setSaved(true);
    playSound("correct");
    setTimeout(() => setSaved(false), 2000);
  }

  const handleClearAudioCache = () => {
    playSound("correct");
    localStorage.removeItem("phonics-stage-1-loaded");
    for (let i = 1; i <= 11; i++) {
      localStorage.removeItem(`phonics-stage-${i}-loaded`);
      localStorage.removeItem(`phonics-stage-${i}-loading`);
    }
    localStorage.removeItem("phonics-dict-cache");
    alert("Audio cache cleared! The page will now reload to redownload Stage 1 sounds.");
    window.location.reload();
  };

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain bg-transparent">
      
      <div className="flex flex-col items-center justify-start px-4 pt-10 pb-36">
        <div className="w-full max-w-md flex items-center gap-4 mb-8">
          <button
            id="settings-back"
            className="px-3 py-1.5 rounded-xl glass-elem border border-white/60 dark:border-slate-700/50 text-[#1C1C1C] dark:text-[#F7E1A0] font-bold text-sm hover:bg-white/80 dark:hover:bg-slate-700/80 active:scale-95 transition-all"
            onClick={() => setScreen("path")}
          >
            ← BACK
          </button>
          <h1 className="text-2xl font-bold text-[#1C1C1C] dark:text-[#F7E1A0] tracking-widest" style={{ fontFamily: "var(--font-mali)" }}>
            SETTINGS
          </h1>
        </div>

        <div className="w-full max-w-md space-y-5">
          <Section title="AUDIO">
            <div className="space-y-4">
              {speechUnavailable && (
                <div className="text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2 text-center">
                  ⚠ Speech synthesis unavailable on this browser. Audio features may not work.
                </div>
              )}
              <ToggleRow
                id="setting-mute"
                label="Mute All Sound"
                value={muted}
                onToggle={toggleMute}
              />
              <div className="flex flex-col gap-2 pt-3 border-t border-white/40 dark:border-slate-700/40">
                <label htmlFor="voice-select" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-left">
                  Speech Voice
                </label>
                <select
                  id="voice-select"
                  value={voiceURI}
                  onChange={(e) => setVoiceURI(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#C8A44E] transition-all cursor-pointer"
                >
                  <option value="">Default (Auto English)</option>
                  {voices
                    .filter((v) => v.lang.toLowerCase().startsWith("en") || v.lang.toLowerCase().startsWith("th"))
                    .map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                </select>
              </div>

              {/* Speech Rate 5-stage */}
              <div className="flex flex-col gap-2 pt-3 border-t border-white/40 dark:border-slate-700/40 text-left">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Speech Rate</label>
                <div className="flex gap-1.5">
                  {[
                    { label: "Very Slow", val: 0.5 },
                    { label: "Slow", val: 0.75 },
                    { label: "Normal", val: 1.0 },
                    { label: "Fast", val: 1.25 },
                    { label: "Very Fast", val: 1.5 },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold tracking-wider transition-all active:scale-95 cursor-pointer ${
                        speechRate === opt.val
                          ? "bg-[#C8A44E] text-white shadow-sm"
                          : "bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/80"
                      }`}
                      onClick={() => setSpeechRate(opt.val)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speech Pitch 5-stage */}
              <div className="flex flex-col gap-2 pt-3 border-t border-white/40 dark:border-slate-700/40 text-left">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">TTS Pitch</label>
                <div className="flex gap-1.5">
                  {[
                    { label: "Very Low", val: 0.5 },
                    { label: "Low", val: 0.75 },
                    { label: "Normal", val: 1.0 },
                    { label: "High", val: 1.25 },
                    { label: "Very High", val: 1.5 },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold tracking-wider transition-all active:scale-95 cursor-pointer ${
                        speechPitch === opt.val
                          ? "bg-[#C8A44E] text-white shadow-sm"
                          : "bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/80"
                      }`}
                      onClick={() => setSpeechPitch(opt.val)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-white/40 dark:border-slate-700/40 text-center">
                <button
                  onClick={handleClearAudioCache}
                  className="px-4 py-2 text-xs font-black text-white bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all rounded-xl btn-3d cursor-pointer shadow-sm"
                  style={{ "--border-color": "#b91c1c" } as React.CSSProperties}
                >
                  <i className="fi fi-sr-trash-restore text-xs mr-1.5" />
                  Clear & Redownload Audio Cache
                </button>
              </div>
            </div>
          </Section>

          <Section title="VISUAL">
            <div className="space-y-4">
              <ToggleRow
                id="setting-theme"
                label="Dark Theme"
                value={theme === "dark"}
                onToggle={toggleTheme}
              />
              <div className="pt-3 border-t border-white/40 dark:border-slate-700/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Glass Effect
                  </label>
                  <button
                    onClick={resetGlass}
                    className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-[#C8A44E] dark:hover:text-[#C8A44E] transition-colors cursor-pointer"
                  >
                    ↺ RESET
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 min-w-[36px] text-right">
                    Clear
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={glassLevel}
                    onChange={handleGlassChange}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-300 dark:bg-slate-700 accent-[#C8A44E] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C8A44E] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#C8A44E] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
                  />
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 min-w-[40px]">
                    Opaque
                  </span>
                </div>
              </div>
            </div>
          </Section>

          {save && (
            <Section title="ENGLISH LEVEL (CEFR)">
              <div className="grid grid-cols-2 gap-2">
                {CEFR_LEVEL_ORDER.map((lvl) => (
                  <button
                    key={lvl}
                    className={`py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                      save.cefrLevel === lvl
                        ? "bg-[#C8A44E] text-white shadow-sm"
                        : "bg-white/60 dark:bg-slate-800/60 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 text-[#1C1C1C] dark:text-[#F7E1A0] hover:bg-white/80 dark:hover:bg-slate-700/80"
                    }`}
                    onClick={() => {
                      persistSave({
                        ...save,
                        cefrLevel: lvl,
                        cefrUpgradeStreak: 0,
                      });
                      playSound("correct");
                    }}
                  >
                    {CEFR_LEVEL_LABELS[lvl]}
                  </button>
                ))}
              </div>
              <button
                className="mt-4 w-full py-2.5 rounded-xl bg-[#2EC4B6] text-white font-extrabold text-xs tracking-wider uppercase hover:brightness-105 active:scale-95 transition-all cursor-pointer btn-3d shadow-md flex items-center justify-center gap-2"
                onClick={() => {
                  startRound({
                    category: 'definitions',
                    level: 'a1',
                    length: 30,
                    isPlacement: true,
                  });
                }}
                style={{ "--border-color": "#0d4f49" } as React.CSSProperties}
              >
                <i className="fi fi-sr-graduation-cap text-sm" />
                TAKE CEFR PLACEMENT TEST
              </button>
            </Section>
          )}

          {save && (
            <Section title="SAVE DATA">
              <div className="space-y-1">
                <InfoRow label="File Name" value={save.name} />
                <InfoRow label="Total Rounds" value={String(save.totalRoundsPlayed)} />
                <InfoRow label="Total Correct" value={String(save.totalCorrects)} />
                <InfoRow label="Best Streak" value={String(save.bestStreak)} />
                <InfoRow label="Coins" value={String(save.phonemeCoins)} />
              </div>
              {typeof activeSlot === "number" && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-white/40 dark:border-slate-700/40">
                  <button
                    className="flex-1 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 font-extrabold text-xs tracking-wider uppercase hover:bg-white/80 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                    onClick={() => { setRenameInput(save.name); setShowRename(true); }}
                  >
                    RENAME
                  </button>
                  <button
                    className="flex-1 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-500 font-extrabold text-xs tracking-wider uppercase hover:bg-rose-500/30 active:scale-95 transition-all cursor-pointer"
                    onClick={() => setShowDelete(true)}
                  >
                    DELETE
                  </button>
                </div>
              )}
            </Section>
          )}

          {/* Rename Modal */}
          {showRename && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowRename(false)}>
              <div className="w-full max-w-sm rounded-3xl glass-heavy border border-white/60 dark:border-slate-800 p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-black text-slate-800 dark:text-white" style={{ fontFamily: "var(--font-mali)" }}>RENAME SAVE</h3>
                <input
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A44E]"
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  placeholder="Enter new name"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs tracking-wider uppercase hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                    onClick={() => setShowRename(false)}
                  >
                    CANCEL
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-xl bg-[#C8A44E] text-white font-extrabold text-xs tracking-wider uppercase hover:brightness-105 active:scale-95 transition-all cursor-pointer btn-3d"
                    onClick={() => {
                      if (renameInput.trim() && save) {
                        persistSave({ ...save, name: renameInput.trim() });
                        playSound("correct");
                      }
                      setShowRename(false);
                    }}
                    style={{ "--border-color": "#91722e" } as React.CSSProperties}
                  >
                    SAVE
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowDelete(false)}>
              <div className="w-full max-w-sm rounded-3xl glass-heavy border border-white/60 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-center" onClick={(e) => e.stopPropagation()}>
                <span className="text-4xl">⚠️</span>
                <h3 className="text-lg font-black text-slate-800 dark:text-white" style={{ fontFamily: "var(--font-mali)" }}>DELETE SAVE?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">This will permanently delete &quot;{save?.name}&quot; and all progress. This cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs tracking-wider uppercase hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                    onClick={() => setShowDelete(false)}
                  >
                    CANCEL
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-extrabold text-xs tracking-wider uppercase hover:bg-rose-600 active:scale-95 transition-all cursor-pointer btn-3d"
                    onClick={() => {
                      if (typeof activeSlot === "number") {
                        deleteSave(activeSlot);
                        playSound("correct");
                        setScreen("slots");
                      }
                    }}
                    style={{ "--border-color": "#b91c1c" } as React.CSSProperties}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            id="settings-save-btn"
            className="w-full rounded-xl py-3 font-bold text-sm tracking-widest bg-[#2EC4B6] text-white hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#2EC4B6]/30"
            onClick={saveSettings}
          >
            {saved ? "SAVED! ✓" : "SAVE SETTINGS"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/60 dark:border-slate-700/50">
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
        className={`w-12 h-6 rounded-full transition-colors relative border ${
          value 
            ? "bg-[#2EC4B6] border-[#2EC4B6]" 
            : "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
        }`}
        onClick={onToggle}
        aria-checked={value}
        role="switch"
        aria-label={label}
      >
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-[3px] transition-transform ${value ? "translate-x-6" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[#1C1C1C]/50 dark:text-[#F7E1A0]/60">{label}</span>
      <span className="font-bold text-[#1C1C1C] dark:text-[#F7E1A0]">{value}</span>
    </div>
  );
}
