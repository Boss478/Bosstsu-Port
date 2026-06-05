"use client";

import { useMemo, useState, useCallback } from "react";
import type { ScreenShellProps, StageId, LabCoatColor } from "../types";
import { useGame } from "../context";
import { t } from "../lang";
import { saveSave } from "../save";
import PixelSprite from "../components/PixelSprite";
import ProfessorPixel from "../components/ProfessorPixel";
import Certificate from "../components/Certificate";
import DailyChallenge from "../components/DailyChallenge";
import CatEasterEgg from "../components/CatEasterEgg";
import SimDeskView from "../components/SimDeskView";
import { useKonamiCode } from "../hooks/useKonamiCode";
import { SPRITE_MAP } from "../sprites";

const STAGES: { id: StageId; labelKey: string; sprite: keyof typeof SPRITE_MAP }[] = [
  { id: "hardware", labelKey: "stage1.title", sprite: "monitor" },
  { id: "software", labelKey: "stage2.title", sprite: "mouse" },
  { id: "workflow", labelKey: "stage3.title", sprite: "keyboard" },
  { id: "build", labelKey: "stage4.title", sprite: "hdd" },
  { id: "diagnosis", labelKey: "stage5.title", sprite: "ram" },
];

const LAB_COLORS: { color: LabCoatColor; label: string; className: string }[] = [
  { color: "white", label: "White", className: "bg-white border-zinc-300" },
  { color: "blue", label: "Blue", className: "bg-blue-500 border-blue-400" },
  { color: "green", label: "Green", className: "bg-green-500 border-green-400" },
  { color: "red", label: "Red", className: "bg-red-500 border-red-400" },
  { color: "purple", label: "Purple", className: "bg-purple-500 border-purple-400" },
  { color: "black", label: "Black", className: "bg-zinc-900 border-zinc-600" },
];

export default function MenuScreen({ onNavigate }: ScreenShellProps) {
  const { lang, mode, save, devMode, navigate, onStageComplete } = useGame();
  const [showSoftwareWarning, setShowSoftwareWarning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useKonamiCode(() => navigate("pong"));

  const completedCount = useMemo(() =>
    STAGES.filter((s) => save.progress[s.id]?.completed).length,
    [save.progress]
  );

  const totalStars = useMemo(() =>
    STAGES.reduce((sum, s) => sum + (save.progress[s.id]?.stars ?? 0), 0),
    [save.progress]
  );

  const [coatColor, setCoatColor] = useState(save.labCoatColor);

  const handleCoatChange = useCallback((color: LabCoatColor) => {
    setCoatColor(color);
    const next = { ...save, labCoatColor: color };
    saveSave(next);
  }, [save]);

  return (
    <div className="relative min-h-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      <CatEasterEgg />

      {/* Desktop background */}
      <div className="relative w-full h-full min-h-[80vh]">
        <SimDeskView
          monitorScreen={
            <div className="w-full h-full flex flex-col p-1.5 gap-1 font-mono">
              <div className="flex items-center justify-between text-[7px] text-green-600/70 mb-0.5">
                <span>{t("menu.title", lang, mode)}</span>
                <span>{completedCount}/{STAGES.length} {totalStars}/15 ★</span>
              </div>
              {STAGES.map((stage) => {
                const progress = save.progress[stage.id];
                const isUnlocked = progress?.unlocked ?? false;
                const isCompleted = progress?.completed ?? false;
                const stars = progress?.stars ?? 0;

                if (!isUnlocked && !devMode) {
                  return (
                    <div
                      key={stage.id}
                      className="flex items-center gap-1 px-1.5 py-1 rounded bg-green-950/30 border border-green-900/40 text-green-800 text-[8px] font-bold opacity-50 cursor-not-allowed"
                    >
                      <PixelSprite data={SPRITE_MAP.lock} size={16} className="shrink-0 w-3 h-3" />
                      <span className="truncate">{t(stage.labelKey, lang, mode)}</span>
                    </div>
                  );
                }

                return (
                  <button
                    key={stage.id}
                    onClick={() => stage.id === "software" ? setShowSoftwareWarning(true) : onNavigate(stage.id)}
                    className={`flex items-center gap-1 px-1.5 py-1 rounded text-[8px] font-bold text-left transition-all border ${
                      isCompleted ? "border-green-600/50 bg-green-950/20" : "border-green-900/40 hover:bg-green-950/30 hover:border-green-600/50"
                    }`}
                  >
                    <div className="w-4 h-4 flex items-center justify-center rounded bg-black/40">
                      <PixelSprite data={SPRITE_MAP[stage.sprite]} size={16} className="w-3 h-3" />
                    </div>
                    <span className="flex-1 text-green-400 truncate">{t(stage.labelKey, lang, mode)}</span>
                    {isCompleted && (
                      <span className="flex gap-px shrink-0">
                        {[0, 1, 2].map((si) => (
                          <PixelSprite key={si} data={si < stars ? SPRITE_MAP.star_filled : SPRITE_MAP.star_empty} size={16} className="w-2.5 h-2.5" />
                        ))}
                      </span>
                    )}
                    {stage.id === "software" && !isCompleted && (
                      <span className="text-amber-500/70 text-[6px]">DEV</span>
                    )}
                  </button>
                );
              })}
            </div>
          }
        />

        {/* Settings gear */}
        <button
          onClick={() => setShowSettings((s) => !s)}
          className="absolute top-2 right-2 z-30 px-2 py-1 rounded-lg bg-zinc-800/80 text-zinc-400 text-[10px] font-bold hover:text-white hover:bg-zinc-700 transition-all border border-zinc-700"
        >
          ⚙ {t("topbar.settings", lang, mode)}
        </button>

        {/* Bottom-left: progress info */}
        <div className="absolute bottom-2 left-2 z-20 flex items-center gap-3 px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800 text-[8px] text-zinc-500">
          <span>{completedCount}/{STAGES.length} {lang === "th" ? "ด่าน" : "stages"}</span>
          <span>★ {totalStars}/15</span>
        </div>
      </div>

      {/* Pong button */}
      {save.pongUnlocked && (
        <div className="absolute bottom-2 right-2 z-20">
          <button
            onClick={() => navigate("pong")}
            className="px-2 py-1 rounded-lg bg-purple-900/60 border border-purple-700/50 text-purple-400 text-[9px] font-bold hover:bg-purple-800/60 transition-all"
          >
            PONG
          </button>
        </div>
      )}

      {/* Professor on desk */}
      <div className="absolute left-[5%] bottom-[18%] z-20">
        <ProfessorPixel />
      </div>

      {/* Daily challenge (all stages complete) */}
      {completedCount === STAGES.length && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
          <DailyChallenge />
        </div>
      )}

      {/* Certificate */}
      {completedCount === STAGES.length && (
        <div className="px-4 py-2 mb-4">
          <Certificate />
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowSettings(false)}>
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-xs w-full mx-3 p-4 animate-popup-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-zinc-200">{t("topbar.settings", lang, mode)}</span>
              <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-zinc-300">✕</button>
            </div>

            {/* Coat colors */}
            <div className="mb-3">
              <div className="text-[10px] text-zinc-500 mb-1.5 font-bold uppercase tracking-wider">
                {lang === "th" ? "สีเสื้อคลุม" : "Lab Coat"}
              </div>
              <div className="flex gap-2">
                {LAB_COLORS.map(({ color, className }) => (
                  <button
                    key={color}
                    onClick={() => handleCoatChange(color)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${className} ${
                      coatColor === color ? "ring-2 ring-green-400 scale-110" : "opacity-60 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Software warning */}
      {showSoftwareWarning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-xs w-full mx-4 text-center space-y-4">
            <p className="text-amber-400 text-base font-bold">Software Stage Under Development</p>
            <p className="text-zinc-300 text-sm">
              Some icons in this stage may not be completed yet. You can still play, or skip to unlock the next stage.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setShowSoftwareWarning(false); onNavigate("software"); }}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-sm hover:bg-zinc-700 transition-colors"
              >
                Enter Stage
              </button>
              <button
                onClick={() => { setShowSoftwareWarning(false); onStageComplete("software", 0, 0); }}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-600 transition-colors"
              >
                Skip & Unlock Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
