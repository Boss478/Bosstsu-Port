'use client';

import { useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../context';
import { getActivitiesForPhoneme, PHONEMES } from '../constants';
import type { CefrLevel } from '../types';

const ACTIVITY_ICONS: Record<string, string> = {
  grapheme: 'fi fi-sr-letters',
  'ipa-word': 'fi fi-sr-symbols',
  'word-ipa': 'fi fi-sr-text',
  'minimal-pairs': 'fi fi-sr-code-compare',
  stress: 'fi fi-sr-waveform',
  exercise: 'fi fi-sr-dice-d6',
};

const ACTIVITY_COLORS: Record<string, string> = {
  grapheme: '#2EC4B6',
  'ipa-word': '#C8A44E',
  'word-ipa': '#9B59B6',
  'minimal-pairs': '#FF70A6',
  stress: '#FFBA08',
  exercise: '#66BB6A',
};

export default function ActivityPath() {
  const { save, selectedLesson, selectStage, selectLesson, selectActivity, startRound } = useGame();
  const activityProgress = useMemo(() => save?.activityProgress ?? {}, [save?.activityProgress]);
  const phonemeId = selectedLesson?.phonemeIds?.[0];

  const activities = useMemo(() => {
    if (!phonemeId) return [];
    return getActivitiesForPhoneme(phonemeId);
  }, [phonemeId]);

  const phoneme = useMemo(() => {
    if (!phonemeId) return null;
    return PHONEMES.find((p) => p.id === phonemeId) ?? null;
  }, [phonemeId]);

  const isActivityUnlocked = useCallback(
    (order: number): boolean => {
      if (order === 0) return true;
      const prev = activities[order - 1];
      if (!prev) return true;
      return !!activityProgress[prev.id]?.completed;
    },
    [activities, activityProgress],
  );

  const handleStartActivity = useCallback(
    (activity: (typeof activities)[number]) => {
      if (!isActivityUnlocked(activity.order)) return;
      selectActivity(activity);
      const targetLevel: CefrLevel = save?.cefrLevel ?? 'a1';
      startRound({
        category: activity.type as import('../types').GameCategory,
        level: targetLevel,
        length: activity.length,
      });
    },
    [isActivityUnlocked, selectActivity, startRound, save],
  );

  const handleBack = useCallback(() => {
    selectStage(null);
    selectLesson(null);
    selectActivity(null);
  }, [selectStage, selectLesson, selectActivity]);

  if (!phonemeId || !phoneme) return null;
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end justify-center animate-fade-in"
      onClick={handleBack}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-6 w-full max-w-md animate-slide-up-drawer shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-5">
          <div className="w-14 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Phoneme header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-850 font-mono font-black text-2xl"
            style={{ backgroundColor: '#C8A44E20', color: '#C8A44E' }}
          >
            {phoneme.ipa.replace(/[\/]/g, '')}
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className="text-xl font-bold text-slate-800 dark:text-white truncate"
              style={{ fontFamily: 'var(--font-mali)' }}
            >
              {phoneme.name}
            </h2>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              {phoneme.ttsText}
            </p>
            <p className="text-[10px] font-bold text-[#C8A44E] mt-0.5 capitalize">{phoneme.tier}</p>
          </div>
        </div>

        {/* Activity list */}
        <div className="space-y-3 mb-6">
          {activities.map((act) => {
            const done = !!activityProgress[act.id]?.completed;
            const unlocked = isActivityUnlocked(act.order);
            const color = ACTIVITY_COLORS[act.type] ?? '#2EC4B6';

            return (
              <button
                key={act.id}
                onClick={() => handleStartActivity(act)}
                disabled={!unlocked}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border-2 text-left ${
                  done
                    ? 'bg-emerald-500/10 dark:bg-emerald-950/10 border-emerald-400/30'
                    : unlocked
                      ? 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border-slate-100 dark:border-slate-800 hover:brightness-105 active:scale-[0.98]'
                      : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100/10 dark:border-slate-800/20 opacity-50'
                } ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-white/20 ${
                    done ? 'bg-emerald-500/20' : unlocked ? '' : 'bg-slate-300/30'
                  }`}
                  style={unlocked && !done ? { backgroundColor: color + '20' } : {}}
                >
                  {done ? (
                    <i className="fi fi-sr-check text-xl text-emerald-500" />
                  ) : (
                    <i
                      className={`${ACTIVITY_ICONS[act.type] ?? 'fi fi-sr-star'} text-lg`}
                      style={{ color: unlocked ? color : '#94a3b8' }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`text-sm font-bold truncate ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}
                    >
                      {act.title}
                    </h3>
                    {done && (
                      <span className="text-[10px] font-bold text-emerald-500 shrink-0">
                        ✓ Done
                      </span>
                    )}
                    {!unlocked && !done && (
                      <i className="fi fi-sr-lock text-xs text-slate-400 shrink-0" />
                    )}
                  </div>
                  <p
                    className={`text-[11px] mt-0.5 ${done ? 'text-emerald-500/70' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    {act.subtitle}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {activities.map((a, ai) => {
                      const aDone = !!activityProgress[a.id]?.completed;
                      const isActive = a.id === act.id;
                      return (
                        <span
                          key={a.id}
                          className={`w-2 h-2 rounded-full transition-all border border-black/5 ${
                            aDone
                              ? 'bg-gradient-to-br from-[#FFD700] to-[#C8A44E] shadow-sm'
                              : isActive
                                ? 'bg-[#C8A44E] scale-125'
                                : ai < act.order
                                  ? 'bg-[#C8A44E]/40'
                                  : 'bg-white/45 dark:bg-slate-700/40'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Close */}
        <button
          onClick={handleBack}
          className="w-full py-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 font-extrabold text-xs tracking-wider uppercase hover:bg-white/80 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer btn-3d"
          style={{ '--border-color': 'rgba(0,0,0,0.1)' } as React.CSSProperties}
        >
          BACK
        </button>
      </div>
    </div>,
    document.body,
  );
}
