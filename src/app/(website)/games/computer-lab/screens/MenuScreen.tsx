"use client";

import { useMemo } from "react";
import type { ScreenShellProps, StageId, LabCoatColor } from "../types";
import { useGame } from "../context";
import { t } from "../lang";
import { saveSave } from "../save";
import PixelSprite from "../components/PixelSprite";
import ProfessorPixel from "../components/ProfessorPixel";
import Certificate from "../components/Certificate";
import DailyChallenge from "../components/DailyChallenge";
import CatEasterEgg from "../components/CatEasterEgg";
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

function getRoomBg(completedCount: number, totalStages: number): string {
  const ratio = completedCount / totalStages;
  if (ratio === 0) return "from-zinc-950 via-zinc-900 to-zinc-950";
  if (ratio <= 0.25) return "from-zinc-950 via-zinc-800 to-zinc-950";
  if (ratio <= 0.5) return "from-zinc-900 via-blue-950 to-zinc-900";
  if (ratio <= 0.75) return "from-zinc-900 via-slate-900 to-zinc-900";
  return "from-zinc-900 via-emerald-950 to-zinc-900";
}

function getWindowOverlay(): string | null {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "bg-gradient-to-b from-amber-900/10 to-transparent";
  if (hour >= 12 && hour < 18) return "bg-gradient-to-b from-sky-900/5 to-transparent";
  if (hour >= 18 && hour < 21) return "bg-gradient-to-b from-orange-900/20 to-purple-900/10";
  return "bg-gradient-to-b from-indigo-950/40 to-blue-950/20";
}

export default function MenuScreen({ onNavigate }: ScreenShellProps) {
  const { lang, mode, save, devMode, navigate } = useGame();

  useKonamiCode(() => {
    navigate("pong");
  });

  const completedCount = useMemo(() =>
    STAGES.filter((s) => save.progress[s.id]?.completed).length,
    [save.progress]
  );

  const totalStars = useMemo(() =>
    STAGES.reduce((sum, s) => sum + (save.progress[s.id]?.stars ?? 0), 0),
    [save.progress]
  );

  const roomBg = getRoomBg(completedCount, STAGES.length);
  const windowOverlay = getWindowOverlay();

  const handleCoatChange = (color: LabCoatColor) => {
    const next = { ...save, labCoatColor: color };
    saveSave(next);
    Object.assign(save, next);
  };

  return (
    <div className={`relative min-h-full bg-gradient-to-b ${roomBg} transition-all duration-700`}>
      <div className={`fixed inset-0 pointer-events-none ${windowOverlay} transition-all duration-1000`} />

      <CatEasterEgg />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-full p-6 text-center space-y-6">
        <div className="flex gap-3">
          <PixelSprite data={SPRITE_MAP.monitor} size={32} />
          <PixelSprite data={SPRITE_MAP.cpu} size={32} />
          <PixelSprite data={SPRITE_MAP.keyboard} size={32} />
        </div>

        <h1 className="text-4xl font-black text-green-400 tracking-tight">
          {t("menu.title", lang, mode)}
        </h1>
        <p className="text-zinc-400 text-lg">
          {t("menu.subtitle", lang, mode)}
        </p>

        <div className="text-zinc-500 text-xs space-x-4">
          <span>Stages: {completedCount}/{STAGES.length}</span>
          <span>Stars: {totalStars}/15</span>
        </div>

        <div className="flex items-center justify-center gap-2">
          {LAB_COLORS.map(({ color, className }) => (
            <button
              key={color}
              onClick={() => handleCoatChange(color)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                className} ${
                save.labCoatColor === color
                  ? "ring-2 ring-green-400 scale-110"
                  : "opacity-60 hover:opacity-100"
              }`}
              title={LAB_COLORS.find(c => c.color === color)?.label}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
          {STAGES.map((stage) => {
            const progress = save.progress[stage.id];
            const isUnlocked = progress?.unlocked ?? false;
            const isCompleted = progress?.completed ?? false;
            const stars = progress?.stars ?? 0;

            if (!isUnlocked && !devMode) {
              return (
                <div
                  key={stage.id}
                  className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-700 font-bold text-sm flex flex-col items-center gap-1 opacity-60"
                  title={t("menu.locked", lang, mode)}
                >
                  <PixelSprite data={SPRITE_MAP.lock} size={16} className="inline-block" />
                  <span>{t(stage.labelKey, lang, mode)}</span>
                </div>
              );
            }

            return (
              <button
                key={stage.id}
                onClick={() => onNavigate(stage.id)}
                className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-green-500 transition-all text-zinc-300 hover:text-green-400 font-bold text-sm flex flex-col items-center gap-1"
              >
                <span>{t(stage.labelKey, lang, mode)}</span>
                {isCompleted && (
                  <span className="inline-flex gap-0.5">
                    {[0,1,2].map((i) => (
                      <PixelSprite key={i} data={i < stars ? SPRITE_MAP.star_filled : SPRITE_MAP.star_empty} size={16} className="inline-block" />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {save.pongUnlocked && (
          <button
            onClick={() => navigate("pong")}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-purple-500 text-purple-400 hover:text-purple-300 font-bold text-sm transition-all"
          >
            Play Pong
          </button>
        )}

        {completedCount === STAGES.length && (
          <div className="w-full max-w-md mt-4">
            <DailyChallenge />
          </div>
        )}

        <div className="w-full max-w-lg mt-6">
          <Certificate />
        </div>
      </div>

      <ProfessorPixel />
    </div>
  );
}
