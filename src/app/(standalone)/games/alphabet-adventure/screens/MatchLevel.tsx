'use client';

import { type MutableRefObject } from 'react';
import type { RoundData } from '../types';

interface Props {
  roundData: RoundData;
  isTransitioning: boolean;
  isFeedbackVisible: boolean;
  onAnswer: (selected: string) => void;
  onSpeak: (text: string, lang?: string) => void;
  isThaiText: boolean;
  choiceRefs: MutableRefObject<(HTMLButtonElement | null)[]>;
}

export default function MatchLevel({
  roundData,
  isTransitioning,
  isFeedbackVisible,
  onAnswer,
  onSpeak,
  isThaiText,
  choiceRefs,
}: Props) {
  return (
    <div className="flex flex-col items-center animate-in zoom-in duration-300">
      <div className="relative mb-12">
        {roundData.revert ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-[3rem] bg-amber-50 dark:bg-amber-900/10 border-8 border-amber-100 dark:border-amber-900/30 flex flex-col items-center justify-center gap-2 shadow-2xl px-4">
              <i
                aria-hidden="true"
                className="fi fi-sr-volume text-5xl text-amber-500 animate-pulse"
              ></i>
              <span className="text-xl md:text-2xl font-black text-amber-700 dark:text-amber-300 text-center leading-snug">
                {roundData.targetLetter}
              </span>
            </div>
            <button
              onClick={() => onSpeak(roundData.targetLetter || '', 'th-TH')}
              className="px-6 py-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-800/60 text-amber-700 dark:text-amber-400 text-sm font-black shadow-lg hover:scale-105 transition-all"
            >
              Listen again
            </button>
          </div>
        ) : (
          <>
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-[3rem] bg-violet-50 dark:bg-violet-900/10 border-8 border-violet-100 dark:border-violet-900/30 flex items-center justify-center text-9xl font-black leading-none text-violet-600 dark:text-violet-400 shadow-2xl transform hover:rotate-2 transition-transform">
              {roundData.targetLetter}
            </div>
            <button
              onClick={() => {
                const text = isThaiText
                  ? roundData.correctChar || roundData.targetLetter
                  : roundData.targetLetter;
                onSpeak(text || '', isThaiText ? 'th-TH' : 'en-US');
              }}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 p-3 rounded-xl bg-violet-100 dark:bg-violet-900/40 hover:bg-violet-200 dark:hover:bg-violet-800/60 text-violet-600 dark:text-violet-400 shadow-lg hover:scale-110 transition-all"
              title="Listen"
            >
              <i aria-hidden="true" className="fi fi-sr-volume text-xl"></i>
            </button>
          </>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        {roundData.choices.map((choice, i) => (
          <button
            ref={(el) => {
              choiceRefs.current[i] = el;
            }}
            key={i}
            onClick={() => !isTransitioning && !isFeedbackVisible && onAnswer(choice)}
            disabled={isTransitioning || isFeedbackVisible}
            className={`relative rounded-3xl bg-white dark:bg-zinc-800 font-black text-zinc-700 dark:text-zinc-200 shadow-[0_8px_0_0_#e4e4e7] dark:shadow-[0_8px_0_0_#27272a] active:shadow-none active:translate-y-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all duration-150 border-2 border-zinc-100 dark:border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed ${
              isThaiText
                ? 'min-w-[7rem] px-4 py-3 text-xl md:text-2xl'
                : 'w-24 h-24 md:w-28 md:h-28 text-5xl'
            }`}
          >
            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-violet-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
              {i + 1}
            </span>
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
