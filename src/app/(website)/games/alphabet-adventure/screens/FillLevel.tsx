"use client";

import type { ReactNode } from "react";
import type { RoundData } from "../types";

interface Props {
  roundData: RoundData;
  isTransitioning: boolean;
  isFeedbackVisible: boolean;
  onAnswer: (selected: string) => void;
  onSelectCell?: (index: number) => void;
  dropPower?: number;
  effectiveStreak?: number;
  choiceButtons: ReactNode;
}

export default function FillLevel({
  roundData,
  isTransitioning,
  isFeedbackVisible,
  onAnswer,
  onSelectCell,
  dropPower,
  effectiveStreak,
  choiceButtons,
}: Props) {
  return (
    <div className="w-full space-y-8">
      <div className="grid grid-cols-7 md:grid-cols-13 gap-2 md:gap-3">
        {roundData.grid.map((item, index) => {
          const isActive = roundData.activeIndex === index;
          return (
            <div
              key={index}
              className={`aspect-square flex items-center justify-center rounded-lg md:rounded-xl text-xl md:text-2xl font-black transition-all duration-300 cursor-pointer ${
                item.isHidden
                  ? isActive
                    ? "bg-violet-100 dark:bg-violet-900/40 border-4 border-violet-500 animate-pulse"
                    : item.isWrong
                    ? "bg-rose-500 text-white shadow-none translate-y-1"
                    : item.isCorrect
                    ? "bg-emerald-500 text-white scale-105"
                    : "bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  : item.isCorrect
                  ? "bg-emerald-500 text-white scale-105"
                  : "bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-zinc-400"
              }`}
              onClick={() =>
                !isTransitioning &&
                !isFeedbackVisible &&
                !item.isCorrect &&
                item.isHidden &&
                onSelectCell?.(index)
              }
            >
              {item.isHidden ? (
                item.isCorrect ? (
                  item.char
                ) : isActive ? (
                  <span className="relative group cursor-help">
                    <span className="text-violet-500">?</span>
                    {dropPower !== undefined && effectiveStreak !== undefined && (
                      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[8px] font-bold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                        Power +{dropPower} · Eff {effectiveStreak}
                      </span>
                    )}
                  </span>
                ) : (
                  "?"
                )
              ) : (
                item.char
              )}
            </div>
          );
        })}
      </div>
      {choiceButtons}
    </div>
  );
}
