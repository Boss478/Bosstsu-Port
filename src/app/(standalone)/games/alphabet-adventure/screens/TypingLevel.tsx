'use client';

import type { RoundData } from '../types';

interface Props {
  roundData: RoundData;
  isTransitioning: boolean;
  isFeedbackVisible: boolean;
  onCheckTyping: () => void;
  onTypingInput?: (index: number, value: string) => void;
}

export const KEYBOARD_ROWS = ['ABCDEFGHI'.split(''), 'JKLMNOPQR'.split(''), 'STUVWXYZ'.split('')];

export default function TypingLevel({
  roundData,
  isTransitioning,
  isFeedbackVisible,
  onCheckTyping,
  onTypingInput,
}: Props) {
  const firstEmptyIdx = roundData.missingIndices.find((i) => !roundData.grid[i]?.value);

  return (
    <div className="w-full space-y-8">
      <div className="grid grid-cols-7 md:grid-cols-13 gap-2 md:gap-3">
        {roundData.grid.map((item, index) => (
          <div
            key={index}
            className={`min-w-[48px] min-h-[48px] aspect-square flex items-center justify-center rounded-lg md:rounded-xl text-xl md:text-2xl font-black transition-all duration-300 ${
              item.isHidden
                ? item.isCorrect
                  ? 'bg-emerald-500 text-white scale-105'
                  : item.isWrong
                    ? 'bg-rose-500 text-white shadow-none translate-y-1'
                    : 'bg-violet-100 dark:bg-violet-900/40 border-2 border-violet-300 dark:border-violet-600'
                : 'bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-zinc-400'
            }`}
          >
            {item.isHidden ? (
              <input
                autoFocus={index === roundData.missingIndices[0]}
                className="w-full h-full bg-transparent text-center focus:outline-2 focus:outline-violet-500 rounded font-black text-xl placeholder:text-zinc-400 placeholder:font-bold"
                placeholder="?"
                value={item.value || ''}
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

      <div className="grid gap-1.5 justify-center">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1.5 justify-center">
            {row.map((letter) => (
              <button
                key={letter}
                onClick={() => {
                  if (firstEmptyIdx !== undefined && !isTransitioning && !isFeedbackVisible) {
                    onTypingInput?.(firstEmptyIdx, letter);
                  }
                }}
                className="min-w-[32px] h-[42px] sm:min-w-[38px] sm:h-[48px] rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-zinc-700 dark:text-zinc-300 font-black text-sm sm:text-base transition-all active:scale-90 border border-zinc-200 dark:border-zinc-700 disabled:opacity-30"
              >
                {letter}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="text-center pt-2">
        <button
          onClick={() => !isFeedbackVisible && onCheckTyping()}
          disabled={isTransitioning || isFeedbackVisible}
          className="px-10 py-4 bg-fuchsia-600 text-white text-xl font-black rounded-2xl shadow-[0_8px_0_0_#9d174d] active:shadow-none active:translate-y-2 transition-all flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Answers <i aria-hidden="true" className="fi fi-sr-checkbox"></i>
        </button>
      </div>
    </div>
  );
}
