"use client";

import type { LangCode, GameMode, SpriteQuality } from "../types";
import { t } from "../lang";

interface TopBarProps {
  onFullscreen: () => void;
  onBack: () => void;
  lang: LangCode;
  mode: GameMode;
  quality: SpriteQuality;
  muted: boolean;
  onLangChange: (lang: LangCode) => void;
  onModeChange: (mode: GameMode) => void;
  onQualityChange: (q: SpriteQuality) => void;
  onMuteToggle: () => void;
}

export default function TopBar({
  onFullscreen,
  onBack,
  lang,
  mode,
  quality,
  muted,
  onLangChange,
  onModeChange,
  onQualityChange,
  onMuteToggle,
}: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/90 text-white text-xs font-bold z-20">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 transition-colors"
        >
          <i aria-hidden="true" className="fi fi-sr-angle-left text-sm" />
          <span className="hidden sm:inline">
            {t("topbar.back", lang, mode)}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onLangChange(lang === "th" ? "en" : "th")}
          className="px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 transition-colors"
          title={t("topbar.lang", lang, mode)}
        >
          {lang === "th" ? "TH" : "EN"}
        </button>

        <button
          onClick={() => onModeChange(mode === "student" ? "advanced" : "student")}
          className="px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 transition-colors"
          title={t("topbar.mode", lang, mode)}
        >
          <i aria-hidden="true" className="fi fi-sr-graduation-cap" />
        </button>

        <button
          onClick={onMuteToggle}
          className="px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 transition-colors"
          title={t("topbar.mute", lang, mode)}
        >
          <i className={`fi ${muted ? "fi-sr-volume-mute" : "fi-sr-volume"}`} />
        </button>

        <button
          onClick={() => onQualityChange(quality === "16" ? "32" : "16")}
          className="hidden sm:flex px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 transition-colors"
          title={t("topbar.quality", lang, mode)}
        >
          {quality}px
        </button>

        <button
          onClick={onFullscreen}
          className="hidden sm:flex px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 transition-colors"
          title={t("topbar.fullscreen", lang, mode)}
        >
          <i aria-hidden="true" className="fi fi-sr-expand" />
        </button>
      </div>
    </div>
  );
}
