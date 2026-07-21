'use client';

import { useMemo } from 'react';
import { useGame } from '../context';
import { SIMILAR_SOUND_GROUPS, PHONEMES } from '../constants';

const GROUP_TEXTS: Record<string, string> = {
  'long-vowels': 'Vː',
  'complex-vowels': 'V*',
  'bilabial-stops': 'P',
  'alveolar-stops': 'T',
  'velar-stops': 'K',
  'labiodental-fricatives': 'F',
  'alveolar-fricatives': 'S',
  'postalveolar-fricatives': 'SH',
  'dental-fricatives': 'TH',
  affricates: 'CH',
  nasals: 'M',
  approximants: 'L',
};

export default function GroupMapView() {
  const { save, selectGroup } = useGame();
  const activityProgress = useMemo(() => save?.activityProgress ?? {}, [save?.activityProgress]);

  const groupsWithProgress = useMemo(() => {
    return SIMILAR_SOUND_GROUPS.map((g) => {
      const allActivities = g.phonemeIds.flatMap((pid) => [
        `${pid}-grapheme`,
        `${pid}-ipa-word`,
        `${pid}-word-ipa`,
        `${pid}-minimal-pairs`,
        `${pid}-stress`,
        `${pid}-exercise`,
      ]);
      const completed = allActivities.filter((aid) => activityProgress[aid]?.completed).length;
      const total = allActivities.length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      const firstPhoneme = PHONEMES.find((p) => p.id === g.phonemeIds[0]);
      return { ...g, completed, total, pct, firstPhoneme };
    });
  }, [activityProgress]);

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain bg-transparent min-h-full">
      <div className="w-full md:w-[85%] lg:w-4/5 xl:w-3/4 max-w-7xl mx-auto px-4 py-8 pb-36">
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-extrabold text-slate-800 dark:text-[#F7E1A0] tracking-wide"
            style={{ fontFamily: 'var(--font-mali)' }}
          >
            Sound Groups
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-widest">
            Pick a group to practice
          </p>
        </div>

        <div className="space-y-4">
          {groupsWithProgress.map((g) => (
            <button
              key={g.id}
              onClick={() => selectGroup(g)}
              className="w-full glass-panel rounded-2xl border border-white/20 dark:border-slate-800/60 p-4 text-left hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-white/20 font-black text-lg select-none"
                  style={{ backgroundColor: g.color + '20', color: g.color }}
                >
                  {g.id === 'short-vowels' ? (
                    <i className="fi fi-sr-volume text-xl" />
                  ) : g.id === 'diphthongs' ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={g.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M4 12h1M7 9v6M10 5v14M13 8v8M16 10v4M19 12h1" />
                    </svg>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mali)' }}>
                      {GROUP_TEXTS[g.id] ?? 'V'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                      {g.title}
                    </h3>
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 shrink-0">
                      {g.phonemeIds.length} sounds
                    </span>
                  </div>
                  <p className="text-[11px] font-mono font-bold text-[#C8A44E] mt-0.5">
                    {g.phonemeIds
                      .map((pid) => PHONEMES.find((p) => p.id === pid)?.ipa)
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-300/30 dark:bg-slate-700/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${g.pct}%`,
                          background: `linear-gradient(90deg, ${g.color}, ${g.color}cc)`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                      {g.completed}/{g.total}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
