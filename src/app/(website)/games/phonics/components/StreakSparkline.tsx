'use client';

interface Props {
  bestStreak: number;
  currentStreak: number;
  totalRounds: number;
}

export default function StreakSparkline({ bestStreak, currentStreak, totalRounds }: Props) {
  const dots = 30;
  const streakRatio = totalRounds > 0 ? Math.min(currentStreak / totalRounds, 1) : 0;
  const greenCount = Math.round(dots * streakRatio);
  const barPct = totalRounds > 0 ? Math.round((currentStreak / totalRounds) * 100) : 0;

  return (
    <div>
      <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
        Streak Overview
      </span>

      <div className="flex items-center gap-1">
        {Array.from({ length: dots }, (_, i) => (
          <div
            key={i}
            className={`w-1.5 h-3 rounded-full transition-colors duration-300 ${
              i < greenCount
                ? 'bg-gradient-to-b from-[#2EC4B6] to-emerald-400'
                : 'bg-slate-200/40 dark:bg-slate-800/40'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1">
          <i className="fi fi-sr-flame text-orange-400 text-xs" />
          Current: <strong className="text-white">{currentStreak}</strong>
        </span>
        <span className="flex items-center gap-1">
          <i className="fi fi-sr-trophy text-amber-400 text-xs" />
          Best: <strong className="text-white">{bestStreak}</strong>
        </span>
        <span>
          {barPct}% streak rate
        </span>
      </div>
    </div>
  );
}
