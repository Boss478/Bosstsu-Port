"use client";

import { useState } from "react";

interface WordCardProps {
  word: string;
  ipa: string;
  wordClass?: string;
  definition?: string | null;
  example?: string | null;
  onPlay: () => void;
  expanded?: boolean;
  onToggle?: () => void;
  favorite?: boolean;
  onFavoriteToggle?: () => void;
}

export function WordCard({
  word,
  ipa,
  wordClass,
  definition,
  example,
  onPlay,
  expanded: controlledExpanded,
  onToggle: controlledToggle,
  favorite,
  onFavoriteToggle,
}: WordCardProps) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : localExpanded;
  const toggle = controlledToggle !== undefined ? controlledToggle : () => setLocalExpanded((e) => !e);
  const hasExtra = !!(definition || example);

  return (
    <div className="rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 overflow-hidden transition-all">
      <div
        className="flex items-center gap-3 p-3.5 cursor-pointer select-none active:scale-[0.97] transition-transform"
        onClick={hasExtra ? toggle : undefined}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-slate-800 dark:text-white truncate" style={{ fontFamily: "var(--font-mali)" }}>
              {word}
            </span>
            {wordClass && (
              <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-white/40 dark:bg-slate-900/40 px-1.5 py-0.5 rounded shrink-0">
                {wordClass}
              </span>
            )}
          </div>
          {ipa && (
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
              {ipa}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onFavoriteToggle !== undefined && (
            <button
              onClick={(e) => { e.stopPropagation(); onFavoriteToggle(); }}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${favorite ? "text-rose-500" : "text-slate-300 hover:text-rose-400"}`}
              aria-label={favorite ? `Remove ${word} from favorites` : `Add ${word} to favorites`}
            >
              <i className="fi fi-sr-heart text-xs" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onPlay(); }}
            className="w-6 h-6 rounded-full bg-[#2EC4B6]/10 text-[#2EC4B6] hover:bg-[#2EC4B6]/20 flex items-center justify-center transition-colors cursor-pointer"
            aria-label={`Hear ${word}`}
          >
            <i className="fi fi-sr-volume text-xs" />
          </button>
          {hasExtra && (
            <i className={`fi fi-sr-angle-small-down text-sm text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          )}
        </div>
      </div>
      {isExpanded && hasExtra && (
        <div className="px-3.5 pb-3.5 space-y-1.5 motion-safe:animate-fade-in">
          {definition && (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {definition}
            </p>
          )}
          {example && (
            <p className="text-xs italic text-slate-400 dark:text-slate-400 leading-relaxed">
              &ldquo;{example}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
