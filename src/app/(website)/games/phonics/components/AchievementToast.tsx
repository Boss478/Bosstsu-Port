'use client';

import { useEffect } from 'react';
import type { AchievementId } from '../types';
import { ACHIEVEMENTS } from '../constants';

interface Props {
  ids: AchievementId[];
  onDismiss: () => void;
}

export default function AchievementToast({ ids, onDismiss }: Props) {
  useEffect(() => {
    if (ids.length === 0) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [ids, onDismiss]);

  if (ids.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 animate-slide-down">
      {ids.map((id) => {
        const def = ACHIEVEMENTS[id];
        return (
          <div
            key={id}
            className="glass-panel px-5 py-3 rounded-2xl border border-amber-300/40 shadow-xl flex items-center gap-4 bg-gradient-to-r from-amber-50/90 to-yellow-50/90 dark:from-amber-900/40 dark:to-yellow-900/40 backdrop-blur-xl min-w-[280px]"
          >
            <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
              <i className={`${def.icon} text-lg text-amber-500`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                Achievement Unlocked!
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                {def.title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{def.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-black text-amber-500">+{def.reward}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">coins</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
