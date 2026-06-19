'use client';

import type { StageData } from '../types';
import { PHONEMES } from '../constants';

type NodeStatus = 'locked' | 'available' | 'current' | 'completed';

interface PathNodeProps {
  stage: StageData;
  status: NodeStatus;
  onClick: () => void;
}

export default function PathNode({ stage, status, onClick }: PathNodeProps) {
  const phoneme = PHONEMES.find((p) => p.id === stage.icon);
  const iconLabel = phoneme?.ipa ?? stage.icon ?? stage.lessons[0]?.id?.charAt(0)?.toUpperCase() ?? '?';

  // Base style categories for the 3D buttons
  let statusClasses = "relative rounded-full flex items-center justify-center border-2 border-b-6 transition-all duration-200 select-none ";
  let borderStyle = {} as React.CSSProperties;

  if (status === 'locked') {
    statusClasses += "w-20 h-20 md:w-22 md:h-22 bg-slate-300/40 dark:bg-slate-800/40 border-slate-400/20 dark:border-slate-800 text-slate-400/60 dark:text-slate-600 cursor-not-allowed";
    borderStyle = { "--border-color": "transparent" } as React.CSSProperties;
  } else if (status === 'available') {
    statusClasses += "w-20 h-20 md:w-22 md:h-22 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-white/60 dark:border-slate-700 btn-3d shadow-md hover:brightness-105 active:scale-95 cursor-pointer";
    borderStyle = { borderColor: stage.color, "--border-color": `${stage.color}aa` } as React.CSSProperties;
  } else if (status === 'current') {
    statusClasses = "relative w-24 h-24 md:w-26 md:h-26 rounded-full flex items-center justify-center border-3 border-b-8 transition-all duration-200 select-none " + 
                     "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 btn-3d shadow-lg animate-float-island cursor-pointer active:scale-95 animate-pulse-ring";
    borderStyle = { borderColor: '#2EC4B6', "--border-color": '#158a7e' } as React.CSSProperties;
  } else if (status === 'completed') {
    statusClasses += "w-20 h-20 md:w-22 md:h-22 bg-gradient-to-br from-[#FFD700]/10 to-[#C8A44E]/10 dark:from-[#C8A44E]/5 dark:to-[#FFD700]/5 text-[#C8A44E] dark:text-[#F7E1A0] border-[#C8A44E] btn-3d shadow-md hover:brightness-105 active:scale-95 cursor-pointer";
    borderStyle = { borderColor: '#C8A44E', "--border-color": '#91722e' } as React.CSSProperties;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={status !== 'locked' ? onClick : undefined}
        role="button"
        tabIndex={status !== 'locked' ? 0 : -1}
        onKeyDown={(e) => { 
          if (e.key === 'Enter' || e.key === ' ') { 
            e.preventDefault(); 
            if (status !== 'locked') onClick(); 
          } 
        }}
        className={statusClasses}
        style={borderStyle}
      >
        {/* Node Center Character */}
        <span className="text-xl md:text-2xl font-mono font-extrabold leading-none drop-shadow-2xs">
          {iconLabel}
        </span>

        {/* Status badges */}
        {status === 'completed' && (
          <span className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center text-xs bg-gradient-to-r from-[#FFD700] to-[#C8A44E] text-white rounded-full shadow-md animate-bounce">
            <i className="fi fi-sr-star text-[10px]" />
          </span>
        )}

        {status === 'locked' && (
          <span className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center text-[10px] bg-slate-400 text-white rounded-full shadow-sm">
            <i className="fi fi-sr-lock text-[9px]" />
          </span>
        )}

        {status === 'current' && (
          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[9px] font-extrabold bg-[#2EC4B6] text-white rounded-full shadow-md uppercase tracking-wider animate-pulse">
            PLAY
          </span>
        )}
      </div>

      <span className="text-[11px] md:text-xs font-bold text-slate-700 dark:text-slate-300 text-center leading-tight max-w-[96px] md:max-w-[112px] truncate drop-shadow-3xs">
        {stage.title}
      </span>
    </div>
  );
}
