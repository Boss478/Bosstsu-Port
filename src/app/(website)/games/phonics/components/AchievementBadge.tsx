'use client';

import type { AchievementId, BadgeRecord } from '../types';
import { ACHIEVEMENTS } from '../constants';

interface Props {
  id: AchievementId;
  record: BadgeRecord;
  onClick?: () => void;
}

export default function AchievementBadge({ id, record, onClick }: Props) {
  const def = ACHIEVEMENTS[id];
  const unlocked = record.unlocked;
  const pct = record.progress ?? 0;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-300 cursor-pointer w-full text-center
        ${unlocked
          ? 'bg-white/40 dark:bg-slate-800/40 border-amber-300/50 dark:border-amber-500/30 shadow-md'
          : 'bg-white/15 dark:bg-slate-900/20 border-white/10 dark:border-slate-800/30 opacity-60 hover:opacity-80'
        }`}
    >
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="3"
            className="text-white/20 dark:text-slate-700/40"
          />
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={unlocked ? 0 : offset}
            className={`transition-all duration-700 ${unlocked ? 'text-amber-400' : 'text-indigo-400'}`}
          />
        </svg>
        <i className={`${def.icon} text-xl ${unlocked ? 'text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
      </div>
      <span className={`text-[11px] font-bold leading-tight ${unlocked ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
        {def.title}
      </span>
      {!unlocked && pct > 0 && pct < 100 && (
        <span className="text-[10px] font-semibold text-indigo-400">{pct}%</span>
      )}
    </button>
  );
}
