'use client';

import { useMemo } from 'react';
import { useGame } from '../context';
import { SIMILAR_SOUND_GROUPS, PHONEMES } from '../constants';

const GROUP_ICONS: Record<string, string> = {
  'short-vowels': 'fi fi-sr-volume',
  'long-vowels': 'fi fi-sr-circle-v',
  'diphthongs': 'fi fi-sr-waveform',
  'complex-vowels': 'fi fi-sr-circle-w',
  'bilabial-stops': 'fi fi-sr-circle-p',
  'alveolar-stops': 'fi fi-sr-circle-t',
  'velar-stops': 'fi fi-sr-circle-k',
  'labiodental-fricatives': 'fi fi-sr-circle-f',
  'alveolar-fricatives': 'fi fi-sr-circle-s',
  'postalveolar-fricatives': 'fi fi-sr-circle-sh',
  'dental-fricatives': 'fi fi-sr-circle-th',
  'affricates': 'fi fi-sr-circle-ch',
  'nasals': 'fi fi-sr-circle-m',
  'approximants': 'fi fi-sr-circle-l',
};

export default function GroupMapView() {
  const { save, selectGroup } = useGame();
  const activityProgress = useMemo(() => save?.activityProgress ?? {}, [save?.activityProgress]);

  const groupsWithProgress = useMemo(() => {
    return SIMILAR_SOUND_GROUPS.map((g) => {
      const allActivities = g.phonemeIds.flatMap((pid) => [
        `${pid}-practice`,
        `${pid}-ipa-word`,
        `${pid}-word-ipa`,
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
      <div className="max-w-lg mx-auto px-4 py-8 pb-36">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-[#F7E1A0] tracking-wide" style={{ fontFamily: 'var(--font-mali)' }}>
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
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-white/20"
                  style={{ backgroundColor: g.color + '20' }}
                >
                  <i className={`${GROUP_ICONS[g.id] ?? 'fi fi-sr-volume'} text-xl`} style={{ color: g.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">{g.title}</h3>
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 shrink-0">
                      {g.phonemeIds.length} sounds
                    </span>
                  </div>
                  {g.firstPhoneme && (
                    <p className="text-[11px] font-mono font-bold text-[#C8A44E] mt-0.5">{g.firstPhoneme.ipa} {g.subtitle}</p>
                  )}
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
