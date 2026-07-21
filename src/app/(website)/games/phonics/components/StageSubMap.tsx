'use client';

import { useMemo, useCallback } from 'react';
import { useGame } from '../context';
import { PHONEMES, getActivitiesForPhoneme } from '../constants';
import type { StageData, StageLesson, SimilarSoundGroup } from '../types';

const PHONEME_COLORS: Record<string, string> = {
  ae: '#2EC4B6',
  e: '#2EC4B6',
  i: '#2EC4B6',
  o: '#2EC4B6',
  u: '#2EC4B6',
  ee: '#C8A44E',
  ar: '#C8A44E',
  aw: '#C8A44E',
  oo: '#C8A44E',
  er: '#C8A44E',
  ay: '#9B59B6',
  ie: '#9B59B6',
  oy: '#9B59B6',
  ow: '#9B59B6',
  oh: '#9B59B6',
  uh: '#FFBA08',
  eer: '#FFBA08',
  air: '#FFBA08',
  oor: '#FFBA08',
  uh2: '#FFBA08',
  p: '#E74C3C',
  b: '#E74C3C',
  t: '#3498DB',
  d: '#3498DB',
  k: '#1ABC9C',
  g: '#1ABC9C',
  f: '#E67E22',
  v: '#E67E22',
  s: '#5DADE2',
  z: '#5DADE2',
  sh: '#1ABC9C',
  zh: '#1ABC9C',
  h: '#1ABC9C',
  th: '#FF70A6',
  dh: '#FF70A6',
  ch: '#E74C3C',
  dz: '#E74C3C',
  m: '#66BB6A',
  n: '#66BB6A',
  ng: '#66BB6A',
  l: '#8D6E63',
  r: '#8D6E63',
  w: '#8D6E63',
  j: '#8D6E63',
};

export default function StageSubMap() {
  const { save, selectedGroup, selectGroup, selectStage, selectLesson } = useGame();
  const activityProgress = useMemo(() => save?.activityProgress ?? {}, [save?.activityProgress]);

  const grp = selectedGroup && 'phonemeIds' in selectedGroup ? (selectedGroup as SimilarSoundGroup) : null;

  const phonemeNodes = useMemo(() => {
    if (!grp) return [];
    return grp.phonemeIds
      .map((pid) => {
        const phoneme = PHONEMES.find((p) => p.id === pid);
        const activities = getActivitiesForPhoneme(pid);
        const completedCount = activities.filter((a) => activityProgress[a.id]?.completed).length;
        const color = PHONEME_COLORS[pid] ?? '#2EC4B6';
        return { phoneme, activities, completedCount, color, pid };
      })
      .filter((n) => n.phoneme);
  }, [selectedGroup, activityProgress]);

  const handlePhonemeClick = useCallback(
    (pid: string) => {
      const phoneme = PHONEMES.find((p) => p.id === pid);
      if (!phoneme) return;
      const fakeStage: StageData = {
        id: `ph-stage-${pid}`,
        title: phoneme.name,
        subtitle: phoneme.ipa,
        icon: pid,
        color: PHONEME_COLORS[pid] ?? '#2EC4B6',
        category: 'vowel',
        lessons: [],
      };
      selectStage(fakeStage);
      const fakeLesson: StageLesson = {
        id: `${pid}-lesson`,
        title: phoneme.name,
        phonemeIds: [pid],
      };
      selectLesson(fakeLesson);
    },
    [selectStage, selectLesson],
  );

  if (!grp) return null;

  const allActivities = grp.phonemeIds.flatMap((pid) => getActivitiesForPhoneme(pid));
  const allCompleted = allActivities.filter((a) => activityProgress[a.id]?.completed).length;
  const allTotal = allActivities.length;
  const groupPct = allTotal > 0 ? Math.round((allCompleted / allTotal) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain bg-transparent min-h-full">
      <div className="w-full md:w-[85%] lg:w-4/5 xl:w-3/4 max-w-7xl mx-auto px-4 py-8 pb-36">
        {/* Back + Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => selectGroup(null)}
            className="w-10 h-10 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/80 flex items-center justify-center transition-all cursor-pointer btn-3d shrink-0"
            style={{ '--border-color': 'rgba(0,0,0,0.1)' } as React.CSSProperties}
            aria-label="Back to groups"
          >
            <i className="fi fi-sr-angle-left text-sm" />
          </button>
          <div className="flex-1 min-w-0">
            <h1
              className="text-2xl font-extrabold text-slate-800 dark:text-[#F7E1A0] truncate"
              style={{ fontFamily: 'var(--font-mali)' }}
            >
              {grp.title}
            </h1>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {grp.phonemeIds.length} phonemes &middot; {groupPct}% mastered
            </p>
          </div>
        </div>

        {/* Group progress */}
        <div className="glass-panel p-4 rounded-2xl border border-white/20 dark:border-slate-800/60 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Group Progress
            </span>
            <span className="text-[11px] font-bold" style={{ color: grp.color }}>
              {allCompleted}/{allTotal} activities
            </span>
          </div>
          <div className="h-3 bg-slate-300/30 dark:bg-slate-700/40 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${groupPct}%`,
                background: `linear-gradient(90deg, ${grp.color}, ${grp.color}cc)`,
              }}
            />
          </div>
        </div>

        {/* Phoneme nodes */}
        <div className="space-y-3">
          {phonemeNodes.map((node) => {
            if (!node.phoneme) return null;
            const activityDots = node.activities.map(
              (act) => activityProgress[act.id]?.completed ?? false,
            );

            return (
              <button
                key={node.pid}
                onClick={() => handlePhonemeClick(node.pid)}
                className="w-full glass-panel rounded-2xl border border-white/20 dark:border-slate-800/60 p-4 text-left hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-white/20 font-mono font-black text-lg"
                    style={{ backgroundColor: node.color + '20', color: node.color }}
                  >
                    {node.phoneme.ipa.replace(/[\/]/g, '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                        {node.phoneme.name}
                      </h3>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
                      {node.phoneme.tier}
                    </p>
                    <div className="flex gap-1.5 mt-2">
                      {activityDots.map((done, di) => (
                        <span
                          key={di}
                          className={`w-2.5 h-2.5 rounded-full transition-all border border-black/5 ${
                            done
                              ? 'bg-gradient-to-br from-[#FFD700] to-[#C8A44E] shadow-sm'
                              : 'bg-white/45 dark:bg-slate-700/40'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
