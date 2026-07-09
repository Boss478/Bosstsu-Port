'use client';

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
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
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
      </div>
      <div className="grid grid-cols-7 md:grid-cols-13 gap-1.5">
        {letters.map((letter) => {
          const level = masteryLevel(letterTracker[letter.toUpperCase()]);
          return (
            <div
              key={letter}
              className="relative group aspect-square flex items-center justify-center rounded-lg text-sm font-black transition-colors"
              style={{
                backgroundColor:
                  level === 'mastered'
                    ? '#10b981'
                    : level === 'learning'
                      ? '#f59e0b'
                      : 'var(--sk-base, #e2e8f0)',
                color: level === 'untracked' ? 'var(--foreground, #171717)' : '#fff',
              }}
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
