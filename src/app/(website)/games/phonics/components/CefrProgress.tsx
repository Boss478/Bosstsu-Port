'use client';

import { useMemo } from 'react';
import type { SaveData } from '../types';
import { getGroupsInTier, TIER_ORDER } from '../vocab-group-defs';
import type { VocabTier } from '../types';

interface Props {
  save: SaveData;
}

const TIER_LABELS: Record<VocabTier, string> = {
  'easy': 'Easy',
  'easy-medium': 'E-Med',
  'medium': 'Medium',
  'medium-hard': 'M-Hard',
  'hard': 'Hard',
};

export default function CefrProgress({ save }: Props) {
  const tierData = useMemo(() => {
    return TIER_ORDER.map((tier) => {
      const groupIds = getGroupsInTier(tier);
      const completed = groupIds.filter((gid) => {
        const p = save.groupProgress?.[gid];
        return p && p.completedStages >= p.totalStages;
      }).length;
      return { tier, completed, total: groupIds.length, pct: groupIds.length > 0 ? Math.round((completed / groupIds.length) * 100) : 0 };
    });
  }, [save.groupProgress]);

  const currentTierIdx = TIER_ORDER.findIndex((t) => {
    const data = tierData[TIER_ORDER.indexOf(t)];
    return data ? data.completed < data.total : false;
  });

  return (
    <div>
      <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">
        Tier Progress
      </span>

      <div className="flex items-center gap-1">
        {tierData.map((td) => {
          const idx = TIER_ORDER.indexOf(td.tier);
          const filled = td.completed >= td.total;
          const isCurrent = idx === currentTierIdx || (!td.completed && currentTierIdx === -1);

          return (
            <div key={td.tier} className="flex-1 flex flex-col items-center gap-1">
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
                {TIER_LABELS[td.tier]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-center">
        <span className="text-xs font-bold text-[#C8A44E]">
          {TIER_LABELS[TIER_ORDER[currentTierIdx >= 0 ? currentTierIdx : TIER_ORDER.length - 1]]}
        </span>
        {currentTierIdx >= 0 && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-2">
            {tierData[currentTierIdx].completed}/{tierData[currentTierIdx].total} groups
          </span>
        )}
        {currentTierIdx < 0 && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-2">
            All groups complete!
          </span>
        )}
      </div>
    </div>
  );
}
