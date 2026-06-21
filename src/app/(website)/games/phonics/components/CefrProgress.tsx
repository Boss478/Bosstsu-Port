'use client';

import type { SaveData } from '../types';
import { CEFR_LEVEL_LABELS, CEFR_LEVEL_ORDER } from '../constants';



interface Props {
  save: SaveData;
}

export default function CefrProgress({ save }: Props) {
  const currentIdx = CEFR_LEVEL_ORDER.indexOf(save.cefrLevel as typeof CEFR_LEVEL_ORDER[number]);

  return (
    <div>
      <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">
        CEFR Progress
      </span>

      <div className="flex items-center gap-1">
        {CEFR_LEVEL_ORDER.map((level, idx) => {
          const filled = idx <= currentIdx;
          const isCurrent = level === save.cefrLevel;

          return (
            <div key={level} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-2 rounded-full transition-all duration-500 ${
                  filled
                    ? 'bg-gradient-to-r from-[#2EC4B6] to-[#C8A44E]'
                    : 'bg-slate-200/50 dark:bg-slate-800/50'
                } ${isCurrent ? 'ring-2 ring-[#C8A44E]/40 shadow-sm' : ''}`}
              />
              <span
                className={`text-[9px] font-extrabold uppercase ${
                  isCurrent
                    ? 'text-[#C8A44E]'
                    : filled
                      ? 'text-slate-600 dark:text-slate-300'
                      : 'text-slate-300 dark:text-slate-600'
                }`}
              >
                {CEFR_LEVEL_LABELS[level].split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-center">
        <span className="text-xs font-bold text-[#C8A44E]">
          {CEFR_LEVEL_LABELS[save.cefrLevel]}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-2">
          {currentIdx < CEFR_LEVEL_ORDER.length - 1
            ? `Next: ${CEFR_LEVEL_LABELS[CEFR_LEVEL_ORDER[currentIdx + 1]].split(' ')[0]}`
            : 'Maximum level!'}
        </span>
      </div>
    </div>
  );
}
