"use client";

import type { ScreenShellProps, StageId } from "../types";
import { useGame } from "../context";
import { t } from "../lang";
import PixelSprite from "../components/PixelSprite";
import { SPRITE_MAP } from "../sprites";

const STAGE_ORDER: StageId[] = ["hardware", "software", "workflow", "build", "diagnosis"];

const STAGE_INFO: Record<StageId, { nameKey: string; sprite: keyof typeof SPRITE_MAP }> = {
  hardware: { nameKey: "stage1.title", sprite: "computer" },
  software: { nameKey: "stage2.title", sprite: "monitor" },
  workflow: { nameKey: "stage3.title", sprite: "gear" },
  build: { nameKey: "stage4.title", sprite: "pccase" },
  diagnosis: { nameKey: "stage5.title", sprite: "magnify" },
};

export default function VictoryScreen({ onNavigate }: ScreenShellProps) {
  const { lang, mode, save, playSfx } = useGame();

  const lastCompleted = [...STAGE_ORDER].reverse().find(
    (id) => save.progress[id]?.completed,
  );
  const stageId = lastCompleted ?? "hardware";
  const info = STAGE_INFO[stageId];
  const progress = save.progress[stageId];
  const stars = progress?.stars ?? 0;
  const score = progress?.bestScore ?? 0;

  const starLabel = stars >= 3 ? "victory.perfect" : stars >= 2 ? "victory.good" : "victory.ok";

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 text-center space-y-8">
      <PixelSprite data={SPRITE_MAP[info.sprite]} size={64} />

      <div className="space-y-2">
        <h2 className="text-3xl font-black text-green-400">
          {t(info.nameKey, lang, mode)}
        </h2>
        <p className="text-xl text-zinc-400">
          {t("victory.title", lang, mode)}
        </p>
      </div>

      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <PixelSprite
            key={i}
            data={i < stars ? SPRITE_MAP.star_filled : SPRITE_MAP.star_empty}
            size={64}
            className={i < stars ? "drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : ""}
          />
        ))}
      </div>

      <p className="text-sm text-zinc-500">
        {t(starLabel, lang, mode)}
      </p>

      <p className="text-lg text-zinc-400">
        {t("victory.stars", lang, mode)}: {stars}/3 · {score} pts
      </p>

      <div className="w-full max-w-xs py-10 rounded-xl bg-zinc-900 border border-dashed border-zinc-700 flex flex-col items-center justify-center space-y-2">
        <PixelSprite data={SPRITE_MAP.card} size={64} />
        <p className="text-zinc-600 text-sm">
          {t("victory.card", lang, mode)}
        </p>
        <p className="text-zinc-700 text-xs">
          Knowledge cards coming soon!
        </p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => { playSfx("click"); onNavigate("menu"); }}
          className="px-8 py-3 rounded-xl bg-green-500 text-black font-bold text-lg hover:bg-green-400 transition-colors"
        >
          {t("victory.continue", lang, mode)}
        </button>
        <button
          onClick={() => { playSfx("click"); onNavigate(stageId); }}
          className="px-8 py-3 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-lg hover:text-green-400 transition-colors"
        >
          {t("victory.replay", lang, mode)}
        </button>
      </div>
    </div>
  );
}
