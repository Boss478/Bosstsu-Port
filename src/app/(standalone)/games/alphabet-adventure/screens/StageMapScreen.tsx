'use client';

import { useMemo } from 'react';
import type { StageConfig, StageProgress, LetterTracker } from '../types';
import LetterProgressGrid from './LetterProgressGrid';

interface Props {
  stage: StageConfig;
  stageProgress: StageProgress;
  letterTracker: Record<string, LetterTracker>;
  onSelectSubStage: (subStageId: number) => void;
  onBack: () => void;
}

export default function StageMapScreen({
  stage,
  stageProgress,
  letterTracker,
  onSelectSubStage,
  onBack,
}: Props) {
  const completedCount = stageProgress.subStages.filter((s) => s.completed).length;
  const totalStars = stageProgress.subStages.reduce((a, b) => a + b.stars, 0);

  const stageLetters = useMemo(() => {
    const set = new Set<string>();
    for (const sub of stage.subStages) {
      for (const letter of sub.letterPool || []) {
        set.add(letter.toUpperCase());
      }
    }
    return [...set].sort();
  }, [stage.subStages]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-2xl text-center animate-in fade-in slide-in-from-bottom-8 duration-700 relative min-h-[600px] max-h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-zinc-500 hover:text-violet-500 transition-colors"
          title="Back to Map"
        >
          <i aria-hidden="true" className="fi fi-sr-angle-left text-lg"></i>
        </button>
        <div className="text-right">
          <h2 className="text-lg font-black text-violet-600 dark:text-violet-400">{stage.name}</h2>
          <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">{stage.subtitle}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-400 dark:text-zinc-500 mb-1">
          <span>
            {completedCount}/{stage.subStages.length} Lessons
          </span>
          <span>
            {totalStars}/{stage.subStages.length * 3} Stars
          </span>
        </div>
        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400 transition-all duration-500"
            style={{
              width: `${(completedCount / stage.subStages.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <div className="relative flex flex-col items-center gap-0 py-4">
          {stage.subStages.map((sub, i) => {
            const progress = stageProgress.subStages[i];
            const unlocked = i === 0 || stageProgress.subStages[i - 1].completed;
            const completed = progress.completed;

            return (
              <div key={sub.id} className="flex flex-col items-center w-full">
                {i > 0 && (
                  <div
                    className={`w-1 h-8 sm:h-10 ${unlocked ? 'bg-violet-300 dark:bg-violet-700' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                  />
                )}
                <button
                  onClick={() => unlocked && onSelectSubStage(i)}
                  disabled={!unlocked}
                  className={`relative w-full max-w-sm p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 ${
                    unlocked
                      ? completed
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 hover:shadow-lg hover:scale-[1.02] cursor-pointer'
                        : 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700 hover:shadow-lg hover:scale-[1.02] cursor-pointer'
                      : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm border-2 ${
                        unlocked
                          ? completed
                            ? 'bg-emerald-100 dark:bg-emerald-800 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300'
                            : 'bg-violet-100 dark:bg-violet-800 border-violet-300 dark:border-violet-600 text-violet-700 dark:text-violet-300'
                          : 'bg-zinc-100 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-400 dark:text-zinc-500'
                      }`}
                    >
                      {unlocked ? (
                        completed ? (
                          <i className="fi fi-sr-check text-base" />
                        ) : (
                          sub.id
                        )
                      ) : (
                        <i className="fi fi-sr-lock text-sm" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <h3
                        className={`text-sm font-black truncate ${
                          unlocked
                            ? 'text-zinc-800 dark:text-white'
                            : 'text-zinc-400 dark:text-zinc-500'
                        }`}
                      >
                        {sub.name}
                      </h3>
                      <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {sub.subtitle}
                      </p>
                    </div>
                    {unlocked && (
                      <div className="flex gap-0.5 shrink-0">
                        {[1, 2, 3].map((s) => (
                          <i
                            key={s}
                            className={`text-[10px] ${
                              progress.stars >= s
                                ? 'text-amber-400 fi fi-sr-star'
                                : 'text-zinc-200 dark:text-zinc-700 fi fi-sr-star'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 mb-6 mx-2">
        <LetterProgressGrid letters={stageLetters} letterTracker={letterTracker} />
      </div>
    </div>
  );
}
