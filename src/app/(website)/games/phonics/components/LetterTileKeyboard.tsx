"use client";

import { useCallback } from "react";

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const ALPHABETICAL_ROWS = [
  ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
  ["J", "K", "L", "M", "N", "O", "P", "Q", "R"],
  ["S", "T", "U", "V", "W", "X", "Y", "Z"],
];

interface LetterTileKeyboardProps {
  layout: "qwerty" | "alphabetical";
  onChar: (char: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}

export function LetterTileKeyboard({
  layout,
  onChar,
  onBackspace,
  disabled = false,
}: LetterTileKeyboardProps) {
  const rows = layout === "qwerty" ? KEYBOARD_ROWS : ALPHABETICAL_ROWS;

  const handleKey = useCallback(
    (letter: string) => {
      if (!disabled) onChar(letter);
    },
    [disabled, onChar]
  );

  const handleBack = useCallback(() => {
    if (!disabled) onBackspace();
  }, [disabled, onBackspace]);

  return (
    <div className="select-none">
      {rows.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1 sm:gap-1.5 mb-1.5">
          {ri === 2 && (
            <button
              disabled
              className="w-12 h-12 sm:w-16 sm:h-14 md:w-20 md:h-16 rounded-lg bg-slate-200/30 dark:bg-slate-800/30 border border-white/30 dark:border-slate-700/30 text-slate-400 dark:text-slate-600 flex items-center justify-center cursor-not-allowed select-none opacity-60"
              aria-hidden="true"
            >
              <i className="fi fi-sr-arrow-up text-xs sm:text-sm" />
            </button>
          )}
          {row.map((letter) => (
            <button
              key={letter}
              onClick={() => handleKey(letter)}
              disabled={disabled}
              className="w-9 h-12 xs:w-11 xs:h-13 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 text-xs sm:text-sm md:text-base font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-700/80 hover:border-[#C8A44E]/50 active:scale-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {letter}
            </button>
          ))}
          {ri === 2 && (
            <button
              onClick={handleBack}
              disabled={disabled}
              className="w-12 h-12 sm:w-16 sm:h-14 md:w-20 md:h-16 rounded-lg bg-rose-50/50 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700/50 text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Backspace"
            >
              <span className="text-sm sm:text-lg leading-none">&#9003;</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
