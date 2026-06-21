'use client';

import type { SaveData } from '../types';
import { SIMILAR_SOUND_GROUPS, PHONEMES } from '../constants';

interface Props {
  save: SaveData;
}

function accuracyColor(pct: number): string {
  if (pct >= 90) return 'bg-emerald-400 dark:bg-emerald-500';
  if (pct >= 70) return 'bg-green-300 dark:bg-green-400';
  if (pct >= 50) return 'bg-yellow-300 dark:bg-yellow-400';
  if (pct >= 25) return 'bg-orange-300 dark:bg-orange-400';
  return 'bg-rose-300 dark:bg-rose-400';
}

export default function PhonemeHeatmap({ save }: Props) {
  const totalSeen = Object.keys(save.phonemeStats).length;
  const total = PHONEMES.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Phoneme Accuracy
        </span>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
          {totalSeen}/{total} phonemes
        </span>
      </div>

      <div className="space-y-2">
        {SIMILAR_SOUND_GROUPS.map((group) => {
          const anyData = group.phonemeIds.some((pid) => save.phonemeStats[pid]);
          if (!anyData) return null;

          return (
            <div key={group.id}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{group.title}</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {group.phonemeIds.map((pid) => {
                  const stat = save.phonemeStats[pid];
                  const hasData = stat && stat.total > 0;
                  const pct = hasData ? Math.round((stat.correct / stat.total) * 100) : 0;

                  return (
                    <div
                      key={pid}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-extrabold border
                        ${hasData ? accuracyColor(pct) + ' border-white/30 dark:border-white/10 text-white' : 'bg-slate-200/30 dark:bg-slate-800/30 border-slate-300/20 dark:border-slate-700/30 text-slate-300 dark:text-slate-600'}
                        transition-colors duration-300`}
                      title={`${pid} — ${hasData ? `${pct}% (${stat.correct}/${stat.total})` : 'Not practiced'}`}
                    >
                      {pid}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400" /> 90%+</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-300" /> 70%+</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-300" /> 50%+</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-300" /> 25%+</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-300" /> {'<'}25%</span>
      </div>
    </div>
  );
}
