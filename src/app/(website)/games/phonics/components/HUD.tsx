'use client';

interface HUDProps {
  current: number;
  total: number;
  score: number;
  streak: number;
  muted: boolean;
  onToggleMute: () => void;
  onSettings: () => void;
}

export default function HUD({
  current, total, score, streak,
  muted, onToggleMute, onSettings,
}: HUDProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 glass-light border-b border-white/20 dark:border-slate-800/80 shadow-xs relative z-20">
      <div className="flex items-center gap-3 md:gap-4">
        <span className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase bg-slate-300/30 dark:bg-slate-800/50 px-2 md:px-3 py-0.5 rounded-full">
          {current + 1} / {total}
        </span>
        <span className="text-sm md:text-base font-extrabold text-[#C8A44E] drop-shadow-3xs flex items-center gap-1">
          <i className="fi fi-sr-star text-amber-500" /> {score}
        </span>
        {streak >= 3 && (
          <span className="text-xs md:text-sm font-extrabold text-[#FFBA08] animate-bounce flex items-center gap-1">
            <i className="fi fi-sr-flame text-orange-500" /> {streak}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2.5 md:gap-3.5">
        <button
          id="game-mute-btn"
          className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 flex items-center justify-center hover:bg-white/80 dark:hover:bg-slate-700/80 active:scale-95 transition-all shadow-xs cursor-pointer btn-3d"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
          style={{ '--border-color': 'rgba(0,0,0,0.1)' } as React.CSSProperties}
        >
          <i className={`fi ${muted ? 'fi-sr-volume-mute' : 'fi-sr-volume'} text-sm md:text-base`} />
        </button>
        <button
          id="game-settings-btn"
          className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 flex items-center justify-center hover:bg-white/80 dark:hover:bg-slate-700/80 active:scale-95 transition-all shadow-xs cursor-pointer btn-3d"
          onClick={onSettings}
          style={{ '--border-color': 'rgba(0,0,0,0.1)' } as React.CSSProperties}
          aria-label="Settings"
        >
          <i className="fi fi-sr-settings text-sm md:text-base" />
        </button>
      </div>
    </div>
  );
}
