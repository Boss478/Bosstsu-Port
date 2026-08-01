'use client';

import { useState } from 'react';
import type { LetterTracker } from '../types';

interface Props {
  letters: string[];
  letterTracker: Record<string, LetterTracker>;
}

export function masteryLevel(
  tracker: LetterTracker | undefined,
): 'untracked' | 'learning' | 'mastered' {
  if (!tracker || tracker.total === 0) return 'untracked';
  const accuracy = tracker.correct / tracker.total;
  if (accuracy >= 0.8 && tracker.total >= 5) return 'mastered';
  return 'learning';
}

export default function LetterProgressGrid({ letters, letterTracker }: Props) {
  const [expanded, setExpanded] = useState(false);

  const label: Record<string, string> = {
    untracked: 'Not yet practiced',
    learning: 'Needs practice (<80%)',
    mastered: 'Mastered (≥80%)',
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3 mb-3">
        <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">
          Letter Progress
        </h4>
        <div className="flex gap-2 ml-auto text-[10px] font-bold">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            New
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            Learning
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Done
          </span>
        </div>
        {letters.length > 7 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Show less' : 'Show more'}
            className="shrink-0 md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-violet-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <span
              className={`block transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            >
              <svg
                className="w-4 h-4 animate-bounce motion-reduce:animate-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </span>
          </button>
        )}
      </div>
      <div
        className={`grid grid-cols-7 md:grid-cols-13 gap-1.5 ${
          !expanded ? 'max-md:[&>*:nth-child(n+8)]:hidden' : ''
        }`}
      >
        {letters.map((letter) => {
          const level = masteryLevel(letterTracker[letter.toUpperCase()]);
          return (
            <div
              key={letter}
              style={{
                backgroundColor:
                  level === 'mastered' ? '#10b981' : level === 'learning' ? '#f59e0b' : undefined,
                color: level === 'untracked' ? undefined : '#fff',
              }}
              className={`relative group aspect-square flex items-center justify-center rounded-lg text-sm font-black transition-colors ${
                level === 'untracked'
                  ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                  : ''
              }`}
            >
              {letter.toUpperCase()}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 rounded bg-black/80 text-white text-[9px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {letter.toUpperCase()} — {label[level]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
