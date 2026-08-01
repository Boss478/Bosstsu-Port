'use client';

import { useRef } from 'react';
import { ACHIEVEMENTS, loadAchievements, type AchievementState } from '../achievements';
import { useScrollHint } from '../hooks/useScrollHint';
import ScrollHint from './ScrollHint';
import BackButton from './BackButton';

interface Props {
  onBack: () => void;
}

const TIER_COLORS: Record<string, string> = {
  bronze: 'border-amber-600 bg-amber-50 dark:bg-amber-900/10',
  silver: 'border-zinc-400 bg-zinc-50 dark:bg-zinc-800',
  gold: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10',
  platinum: 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/10',
};

const TIER_LABELS: Record<string, string> = {
  bronze: '🥉 Bronze',
  silver: '🥈 Silver',
  gold: '🥇 Gold',
  platinum: '💎 Platinum',
};

export default function AchievementsScreen({ onBack }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { hasMore, atBottom, scrollDown } = useScrollHint(scrollRef);

  const state: Record<string, AchievementState> =
    typeof window !== 'undefined' ? loadAchievements() : {};

  const grouped = ACHIEVEMENTS.reduce<Record<string, typeof ACHIEVEMENTS>>(
    (acc, a) => {
      (acc[a.tier] ??= []).push(a);
      return acc;
    },
    { bronze: [], silver: [], gold: [], platinum: [] },
  );

  const unlockedCount = ACHIEVEMENTS.filter((a) => state[a.id]?.unlocked).length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-[2.5rem] p-4 sm:p-6 shadow-2xl text-center space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 max-h-[calc(100dvh-2rem)] flex flex-col">
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} title="Back" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-violet-600 dark:text-violet-400">
              🏆 Achievements
            </h1>
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
              {unlockedCount}/{totalCount} unlocked
            </p>
          </div>
          <div className="w-12" />
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4">
          {(['platinum', 'gold', 'silver', 'bronze'] as const).map((tier) => {
            const items = grouped[tier];
            if (items.length === 0) return null;
            return (
              <div key={tier}>
                <h2 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
                  {TIER_LABELS[tier]}
                </h2>
                <div className="grid gap-2">
                  {items.map((a) => {
                    const unlocked = state[a.id]?.unlocked;
                    const date = state[a.id]?.unlockedAt
                      ? new Date(state[a.id].unlockedAt!).toLocaleDateString()
                      : null;
                    return (
                      <div
                        key={a.id}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                          unlocked
                            ? TIER_COLORS[tier]
                            : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 opacity-50'
                        }`}
                      >
                        <span className={`text-2xl ${unlocked ? '' : 'grayscale'}`}>{a.icon}</span>
                        <div className="flex-1 text-left min-w-0">
                          <p
                            className={`text-sm font-black truncate ${
                              unlocked
                                ? 'text-zinc-800 dark:text-zinc-100'
                                : 'text-zinc-400 dark:text-zinc-500'
                            }`}
                          >
                            {a.name}
                          </p>
                          <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 truncate">
                            {a.description}
                          </p>
                        </div>
                        {unlocked && date && (
                          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 shrink-0">
                            {date}
                          </span>
                        )}
                        {!unlocked && <span className="text-lg shrink-0 opacity-30">🔒</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {hasMore && !atBottom && <ScrollHint onScrollDown={scrollDown} roundedBottom />}
      </div>
    </div>
  );
}
