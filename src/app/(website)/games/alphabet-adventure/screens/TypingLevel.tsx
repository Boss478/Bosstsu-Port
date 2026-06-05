"use client";

import type { RoundData } from "../types";

interface Props {
  roundData: RoundData;
  isTransitioning: boolean;
  isFeedbackVisible: boolean;
  onCheckTyping: () => void;
  onTypingInput?: (index: number, value: string) => void;
}

export default function TypingLevel({
  roundData,
  isTransitioning,
  isFeedbackVisible,
  onCheckTyping,
  onTypingInput,
}: Props) {
  return (
    <div className="w-full space-y-8">
      <div className="grid grid-cols-7 md:grid-cols-13 gap-2 md:gap-3">
        {roundData.grid.map((item, index) => (
          <div
            key={index}
            className={`aspect-square flex items-center justify-center rounded-lg md:rounded-xl text-xl md:text-2xl font-black transition-all duration-300 ${
              item.isHidden
                ? item.isCorrect
                  ? "bg-emerald-500 text-white scale-105"
                  : item.isWrong
                  ? "bg-rose-500 text-white shadow-none translate-y-1"
                  : "bg-violet-100 dark:bg-violet-900/40 border-2 border-violet-300 dark:border-violet-600"
                : "bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-zinc-400"
            }`}
          >
            {item.isHidden ? (
              <input
                autoFocus={index === roundData.missingIndices[0]}
                className="w-full h-full bg-transparent text-center focus:outline-2 focus:outline-violet-500 rounded font-black text-xl"
                value={item.value || ""}
                onChange={(e) => {
                  const val = e.target.value.slice(-1).toUpperCase();
                  onTypingInput?.(index, val);
                }}
                disabled={isTransitioning}
              />
            ) : (
              item.char
            )}
          </div>
        ))}
      </div>

      <div className="text-center pt-4">
        <button
          onClick={() => !isFeedbackVisible && onCheckTyping()}
          disabled={isTransitioning || isFeedbackVisible}
          className="px-10 py-4 bg-fuchsia-600 text-white text-xl font-black rounded-2xl shadow-[0_8px_0_0_#9d174d] active:shadow-none active:translate-y-2 transition-all flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Answers <i className="fi fi-sr-checkbox"></i>
        </button>
      </div>
    </div>
  );
}
