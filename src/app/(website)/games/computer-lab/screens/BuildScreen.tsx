"use client";

import { useState, useCallback } from "react";
import type { ScreenShellProps } from "../types";
import { useGame } from "../context";
import { t } from "../lang";
import { SPRITE_MAP } from "../sprites";
import PixelSprite from "../components/PixelSprite";
import SimDeskView from "../components/SimDeskView";
import SimBuildDesk from "../components/SimBuildDesk";

type Difficulty = "easy" | "medium" | "hard";

const PARTS_COUNT: Record<Difficulty, number> = { easy: 4, medium: 6, hard: 8 };

export default function BuildScreen({ onNavigate }: ScreenShellProps) {
  const { lang, mode, playSfx, onStageComplete } = useGame();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [stars, setStars] = useState(0);
  const [score, setScore] = useState(0);
  const [showVictory, setShowVictory] = useState(false);

  const handleDifficultySelect = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setStars(0);
    setScore(0);
    setShowVictory(false);
    playSfx("click");
  }, [playSfx]);

  const handleBuildComplete = useCallback((s: number, sc: number) => {
    setStars(s);
    setScore(sc);
    setShowVictory(true);
  }, []);

  const handleRestart = useCallback(() => {
    setDifficulty(null);
    setStars(0);
    setScore(0);
    setShowVictory(false);
  }, []);

  // Difficulty selection
  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-6 space-y-8">
        <div className="flex items-center gap-3 mb-2">
          <PixelSprite data={SPRITE_MAP.cpu} size={48} />
          <PixelSprite data={SPRITE_MAP.ram} size={48} />
          <PixelSprite data={SPRITE_MAP.hdd} size={48} />
        </div>
        <h2 className="text-2xl font-black text-green-400">{t("stage4.title", lang, mode)}</h2>
        <p className="text-zinc-500 text-sm text-center max-w-xs">{t("stage4.instruction", lang, mode)}</p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => handleDifficultySelect(d)}
              className="w-full px-5 py-4 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-green-500 hover:bg-zinc-800 transition-all text-left"
            >
              <span className="text-green-400 font-bold text-base">{t(`build.difficulty.${d}` as const, lang, mode)}</span>
              <span className="text-zinc-600 text-xs block mt-1">
                {PARTS_COUNT[d]} {lang === "th" ? "ชิ้นส่วน" : "components"}
              </span>
            </button>
          ))}
        </div>

        <button onClick={() => onNavigate("menu")} className="px-4 py-2 rounded bg-zinc-800 text-zinc-500 hover:text-green-400 text-sm transition-colors">
          ← {t("topbar.back", lang, mode)}
        </button>
      </div>
    );
  }

  // Victory screen
  if (showVictory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-6 space-y-6">
        <div className="mb-4 animate-pulse"><PixelSprite data={SPRITE_MAP.computer} size={96} /></div>
        <h2 className="text-3xl font-black text-green-400">{t("build.complete", lang, mode)}</h2>
        <p className="text-zinc-500 text-sm">{t("stage1.continue", lang, mode)}</p>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <PixelSprite key={i} data={i < stars ? SPRITE_MAP.star_filled : SPRITE_MAP.star_empty} size={64} />
          ))}
        </div>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => onStageComplete("build", stars, score)}
            className="px-6 py-3 rounded-xl bg-green-500 text-black font-bold hover:bg-green-400 transition-colors"
          >
            {t("victory.continue", lang, mode)}
          </button>
          <button onClick={handleRestart} className="px-6 py-3 rounded-xl bg-zinc-800 text-zinc-400 font-bold hover:text-green-400 transition-colors">
            {t("victory.replay", lang, mode)}
          </button>
        </div>
      </div>
    );
  }

  // Build game on desk
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-lg sm:text-xl font-black text-green-400">{t("stage4.title", lang, mode)}</h2>
        <button onClick={handleRestart} className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-red-400 text-[10px] font-bold transition-colors">
          {t("scenario.restart", lang, mode)}
        </button>
      </div>

      <div className="flex-1 px-3 pb-3 overflow-y-auto">
        {/* Desk view background */}
        <div className="mb-4">
          <SimDeskView />
        </div>

        {/* Build game */}
        <div className="max-w-md mx-auto">
          <SimBuildDesk
            difficulty={difficulty}
            onComplete={handleBuildComplete}
          />
        </div>
      </div>
    </div>
  );
}
