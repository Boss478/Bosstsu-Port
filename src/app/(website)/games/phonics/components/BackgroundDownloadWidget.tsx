'use client';

import { useState } from 'react';

export interface BackgroundDownloadState {
  isActive: boolean;
  stageTitle: string | null;
  pct: number;
  loaded: number;
  total: number;
  isDone: boolean;
}

interface BackgroundDownloadWidgetProps {
  state: BackgroundDownloadState | null;
  className?: string;
}

export default function BackgroundDownloadWidget({ state, className = "" }: BackgroundDownloadWidgetProps) {
  const [expanded, setExpanded] = useState(false);

  if (!state) return null;

  const { stageTitle, pct, loaded, total, isDone } = state;
  const hasTopClass = className.includes('top-') || className.includes('translate-y');

  return (
    <div className={`absolute left-5 z-30 flex flex-col items-start gap-1 font-sans ${hasTopClass ? '' : 'top-2.5'} ${className}`}>
      {/* Collapsed Capsule */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="glass-panel py-1.5 px-3 rounded-full flex items-center gap-2 border border-white/30 dark:border-slate-800 shadow-md cursor-pointer hover:bg-white/90 dark:hover:bg-slate-800/90 active:scale-95 transition-all text-left"
        aria-label="Toggle download details"
      >
        {isDone ? (
          <span className="w-4.5 h-4.5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            ✓
          </span>
        ) : (
          <span className="w-4.5 h-4.5 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-[#C8A44E] animate-spin shrink-0" />
        )}
        <span className="text-[11px] font-black text-slate-700 dark:text-slate-200" style={{ fontFamily: "var(--font-mali)" }}>
          {isDone ? "Audio Ready" : `Caching: ${pct}%`}
        </span>
        <span className="text-[9px] font-bold text-[#C8A44E] border border-[#C8A44E]/30 bg-[#C8A44E]/10 rounded-md px-1 select-none">
          {expanded ? "Hide" : "Details"}
        </span>
      </button>

      {/* Expanded Panel */}
      {expanded && (
        <div className="w-64 glass-panel p-4 rounded-2xl border border-white/30 dark:border-slate-800 shadow-xl space-y-3 mt-1.5 text-left animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex justify-between items-center border-b border-white/20 dark:border-slate-800 pb-1.5">
            <span className="text-xs font-black text-slate-800 dark:text-white" style={{ fontFamily: "var(--font-mali)" }}>
              Audio Cache Sync
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              {isDone ? "Done" : "Downloading"}
            </span>
          </div>

          <div className="space-y-1 text-xs font-bold">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Status:</span>
              <span className={isDone ? "text-emerald-500 font-extrabold" : "text-[#C8A44E] font-extrabold animate-pulse"}>
                {isDone ? "Done" : "Downloading..."}
              </span>
            </div>
            
            {stageTitle && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Loading Stage:</span>
                <span className="text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{stageTitle}</span>
              </div>
            )}

            {!isDone && total > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Cached Files:</span>
                <span className="text-slate-700 dark:text-slate-200 font-mono">{loaded} / {total}</span>
              </div>
            )}

            {isDone && (
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 italic pt-1">
                All audio has been downloaded.
              </div>
            )}
          </div>

          {!isDone && total > 0 && (
            <div className="w-full space-y-1">
              <div className="h-2 bg-slate-300/30 dark:bg-slate-900/40 rounded-full border border-white/20 overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2EC4B6] to-[#C8A44E] transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-end text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                {pct}% COMPLETE
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
