'use client';

import { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../context';
import { VOCAB_GROUPS, getVocabStagesForGroup, getVocabActivitiesForStage } from '../constants';
import GroupMapView from '../components/GroupMapView';
import StageSubMap from '../components/StageSubMap';
import ActivityPath from '../components/ActivityPath';
import ModeSelectModal from '../components/ModeSelectModal';
import type { StageData, CefrLevel } from '../types';

interface StageListScreenProps {
  mode?: 'sound' | 'vocab';
}

export default function StageListScreen({ mode = 'sound' }: StageListScreenProps) {
  const { mapView } = useGame();

  if (mode === 'sound') {
    if (mapView === 'groups') {
      return (
        <>
          <GroupMapView />
          <FreePracticeFAB mode="sound" />
        </>
      );
    }
    return (
      <>
        <StageSubMap />
        <ActivityPath />
        <FreePracticeFAB mode="sound" />
      </>
    );
  }

  if (mapView === 'groups') {
    return <VocabGroupMapView />;
  }
  return (
    <>
      <VocabStageSubMap />
      <VocabActivityPath />
    </>
  );
}

// ── Free Practice FAB ──

function FreePracticeFAB({ mode }: { mode: 'sound' | 'vocab' }) {
  const { startRound } = useGame();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-28 left-6 z-40 w-14 h-14 rounded-2xl bg-[#C8A44E] hover:brightness-105 text-white shadow-lg active:scale-95 transition-all flex items-center justify-center btn-3d cursor-pointer"
        aria-label="Free practice"
        style={{ '--border-color': '#91722e' } as React.CSSProperties}
      >
        <span className="text-2xl font-bold font-mono">+</span>
      </button>

      {open && (
        <ModeSelectModal
          label="Free Practice"
          category={mode === 'sound' ? 'phonics' : 'definitions'}
          onStart={(config) => {
            setOpen(false);
            startRound(config);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ── Vocab Group Map View ──

// Vocab level texts will be dynamically generated from their group IDs (e.g. 'A1', 'B2')

function VocabGroupMapView() {
  const { save, selectGroup } = useGame();
  const activityProgress = useMemo(() => save?.activityProgress ?? {}, [save?.activityProgress]);

  const groups = useMemo(() => {
    return VOCAB_GROUPS.map((g) => {
      const stages = getVocabStagesForGroup(g.id);
      const allActivities = stages.flatMap((s) => getVocabActivitiesForStage(s.id, g.id));
      const completed = allActivities.filter((a) => activityProgress[a.id]?.completed).length;
      const total = allActivities.length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { ...g, stages, completed, total, pct };
    });
  }, [activityProgress]);

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain bg-transparent min-h-full">
      <div className="max-w-lg mx-auto px-4 py-8 pb-36">
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-extrabold text-slate-800 dark:text-[#F7E1A0] tracking-wide"
            style={{ fontFamily: 'var(--font-mali)' }}
          >
            Vocabulary Levels
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-widest">
            Pick a level to practice
          </p>
        </div>
        <div className="space-y-4">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => selectGroup(g)}
              className="w-full glass-panel rounded-2xl border border-white/20 dark:border-slate-800/60 p-4 text-left hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-white/20 font-black text-lg select-none"
                  style={{
                    backgroundColor: g.color + '20',
                    color: g.color,
                    fontFamily: 'var(--font-mali)',
                  }}
                >
                  {g.id.replace('vocab-', '').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                      {g.title}
                    </h3>
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 shrink-0">
                      {g.stages.length} units
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                    {g.subtitle}
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

// ── Vocab Stage Sub-Map ──

function VocabStageSubMap() {
  const { save, selectedGroup, selectGroup, selectStage, selectLesson } = useGame();
  const activityProgress = useMemo(() => save?.activityProgress ?? {}, [save?.activityProgress]);

  const stageNodes = useMemo(() => {
    if (!selectedGroup) return [];
    const stages = getVocabStagesForGroup(selectedGroup.id);
    return stages.map((s) => {
      const activities = getVocabActivitiesForStage(s.id, selectedGroup.id);
      const completedCount = activities.filter((a) => activityProgress[a.id]?.completed).length;
      return { stage: s, activities, completedCount };
    });
  }, [selectedGroup, activityProgress]);

  const handleStageClick = useCallback(
    (s: StageData) => {
      selectStage(s);
      selectLesson(s.lessons[0]!);
    },
    [selectStage, selectLesson],
  );

  if (!selectedGroup) return null;

  const allActivities = stageNodes.flatMap((n) => n.activities);
  const groupPct =
    allActivities.length > 0
      ? Math.round(
          (allActivities.filter((a) => activityProgress[a.id]?.completed).length /
            allActivities.length) *
            100,
        )
      : 0;

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain bg-transparent min-h-full">
      <div className="max-w-lg mx-auto px-4 py-8 pb-36">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => selectGroup(null)}
            className="w-10 h-10 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/80 flex items-center justify-center transition-all cursor-pointer btn-3d shrink-0"
            style={{ '--border-color': 'rgba(0,0,0,0.1)' } as React.CSSProperties}
            aria-label="Back to levels"
          >
            <i className="fi fi-sr-angle-left text-sm" />
          </button>
          <div className="flex-1 min-w-0">
            <h1
              className="text-2xl font-extrabold text-slate-800 dark:text-[#F7E1A0] truncate"
              style={{ fontFamily: 'var(--font-mali)' }}
            >
              {selectedGroup.title}
            </h1>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {selectedGroup.subtitle} &middot; {groupPct}% mastered
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {stageNodes.map((n) => (
            <button
              key={n.stage.id}
              onClick={() => handleStageClick(n.stage)}
              className="w-full glass-panel rounded-2xl border border-white/20 dark:border-slate-800/60 p-4 text-left hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-white/20 font-bold text-lg"
                  style={{
                    backgroundColor: selectedGroup.color + '20',
                    color: selectedGroup.color,
                  }}
                >
                  <i className="fi fi-sr-book-open-cover text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                      {n.stage.title}
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400">
                      {n.completedCount}/4
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                    {n.stage.subtitle}
                  </p>
                  <div className="flex gap-1.5 mt-2">
                    {n.activities.map((a) => {
                      const done = !!activityProgress[a.id]?.completed;
                      return (
                        <span
                          key={a.id}
                          className={`w-2.5 h-2.5 rounded-full transition-all border border-black/5 ${done ? 'bg-gradient-to-br from-[#FFD700] to-[#C8A44E] shadow-sm' : 'bg-white/45 dark:bg-slate-700/40'}`}
                        />
                      );
                    })}
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

// ── Vocab Activity Path ──

const VOCAB_ACTIVITY_COLORS: Record<string, string> = {
  definitions: '#2EC4B6',
  synonyms: '#9B59B6',
  'vocab-exercise': '#FF70A6',
};

const VOCAB_ACTIVITY_ICONS: Record<string, string> = {
  definitions: 'fi fi-sr-book-open-cover',
  synonyms: 'fi fi-sr-copy',
  'vocab-exercise': 'fi fi-sr-gamepad',
};

function VocabActivityPath() {
  const {
    save,
    selectedGroup,
    selectedStage,
    selectStage,
    selectLesson,
    selectActivity,
    startRound,
  } = useGame();
  const activityProgress = useMemo(() => save?.activityProgress ?? {}, [save?.activityProgress]);

  const activities = useMemo(() => {
    if (!selectedStage) return [];

    const gId = selectedGroup?.id ?? 'vocab-all';
    return getVocabActivitiesForStage(selectedStage.id, gId);
  }, [selectedStage, selectedGroup]);

  const isUnlocked = useCallback(
    (order: number): boolean => {
      if (order === 0) return true;
      const prev = activities[order - 1];
      if (!prev) return true;
      return !!activityProgress[prev.id]?.completed;
    },
    [activities, activityProgress],
  );

  const handleStart = useCallback(
    (act: (typeof activities)[number]) => {
      if (!isUnlocked(act.order)) return;
      selectActivity(act);
      const targetLevel: CefrLevel = save?.cefrLevel ?? 'a1';
      if (act.type === 'definitions') {
        startRound({
          category: 'definitions',
          definitionDirection: act.direction ?? 'def-to-word',
          level: targetLevel,
          length: act.length,
        });
      } else {
        startRound({
          category: act.type as import('../types').GameCategory,
          level: targetLevel,
          length: act.length,
        });
      }
    },
    [isUnlocked, selectActivity, startRound, save],
  );

  const handleBack = useCallback(() => {
    selectStage(null);
    selectLesson(null);
    selectActivity(null);
  }, [selectStage, selectLesson, selectActivity]);

  if (!selectedStage) return null;
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

        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-800"
            style={{ backgroundColor: '#C8A44E20', color: '#C8A44E' }}
          >
            <i className="fi fi-sr-book-open-cover text-2xl" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className="text-xl font-bold text-slate-800 dark:text-white truncate"
              style={{ fontFamily: 'var(--font-mali)' }}
            >
              {selectedStage.title}
            </h2>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedStage.subtitle}
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {activities.map((act) => {
            const done = !!activityProgress[act.id]?.completed;
            const unlocked = isUnlocked(act.order);
            const color = VOCAB_ACTIVITY_COLORS[act.type] ?? '#2EC4B6';

            return (
              <button
                key={act.id}
                onClick={() => handleStart(act)}
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
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-white/20 ${done ? 'bg-emerald-500/20' : unlocked ? '' : 'bg-slate-300/30'}`}
                  style={unlocked && !done ? { backgroundColor: color + '20' } : {}}
                >
                  {done ? (
                    <i className="fi fi-sr-check text-xl text-emerald-500" />
                  ) : (
                    <i
                      className={`${VOCAB_ACTIVITY_ICONS[act.type] ?? 'fi fi-sr-star'} text-lg`}
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
                          className={`w-2 h-2 rounded-full transition-all border border-black/5 ${aDone ? 'bg-gradient-to-br from-[#FFD700] to-[#C8A44E] shadow-sm' : isActive ? 'bg-[#C8A44E] scale-125' : ai < act.order ? 'bg-[#C8A44E]/40' : 'bg-white/45 dark:bg-slate-700/40'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

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
