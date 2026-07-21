'use client';

import type { MapSaveData, StageProgress } from '../types';
import { getStages } from '../constants';
import LetterProgressGrid from './LetterProgressGrid';

interface Props {
  mapData: MapSaveData;
  onSelectStage: (stageId: number) => void;
  onBack: () => void;
  onShowAnalysis?: () => void;
}

function avgStageStars(progress: StageProgress): number {
  const completed = progress.subStages.filter((s) => s.completed);
  if (completed.length === 0) return 0;
  const total = completed.reduce((a, b) => a + b.stars, 0);
  return Math.round(total / completed.length);
}

export default function LevelMapScreen({ mapData, onSelectStage, onBack, onShowAnalysis }: Props) {
  const stages = getStages();
  const stageIds = [1, 2, 3, 4, 5, 6];

  const totalStars = mapData.stages.reduce(
    (sum, s) => sum + s.subStages.reduce((a, b) => a + b.stars, 0),
    0,
  );
  const maxStars = 90;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-2xl text-center animate-in fade-in slide-in-from-bottom-8 duration-700 relative min-h-[600px] max-h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-zinc-500 hover:text-violet-500 transition-colors"
          title="Back"
        >
          <i aria-hidden="true" className="fi fi-sr-angle-left text-lg"></i>
        </button>
        <div className="flex items-center gap-2">
          {onShowAnalysis && (
            <button
              onClick={onShowAnalysis}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-zinc-400 hover:text-violet-500 transition-colors"
              title="View Analysis"
            >
              <i aria-hidden="true" className="fi fi-sr-chart-simple text-base"></i>
            </button>
          )}
          <div className="text-right">
            <h2 className="text-lg font-black text-violet-600 dark:text-violet-400">Alphabet Map</h2>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
              {mapData.stages.filter((s) => s.completed).length}/6 Stages
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-400 dark:text-zinc-500 mb-1">
          <span>Total Progress</span>
          <span>
            {totalStars}/{maxStars}
          </span>
        </div>
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400 transition-all duration-700"
            style={{ width: `${Math.min((totalStars / maxStars) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <div className="relative flex flex-col items-center gap-0 py-4">
          {stageIds.map((id, i) => {
            const stage = stages[id - 1];
            const progress = mapData.stages[id - 1];
            const unlocked = progress.unlocked;
            const completed = progress.completed;
            const pct = Math.round(
              (progress.subStages.filter((s) => s.completed).length / progress.subStages.length) *
                100,
            );
            const stars = avgStageStars(progress);

            return (
              <div key={id} className="flex flex-col items-center w-full">
                {i > 0 && (
                  <div
                    className={`w-1 h-8 sm:h-12 ${unlocked ? 'bg-violet-300 dark:bg-violet-700' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                  />
                )}
                <button
                  onClick={() => unlocked && onSelectStage(id)}
                  disabled={!unlocked}
                  className={`relative w-full max-w-sm p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 ${
                    unlocked
                      ? completed
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 hover:shadow-lg hover:scale-[1.02] cursor-pointer'
                        : 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700 hover:shadow-lg hover:scale-[1.02] cursor-pointer'
                      : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg border-2 ${
                        unlocked
                          ? completed
                            ? 'bg-emerald-100 dark:bg-emerald-800 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300'
                            : 'bg-violet-100 dark:bg-violet-800 border-violet-300 dark:border-violet-600 text-violet-700 dark:text-violet-300'
                          : 'bg-zinc-100 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-400 dark:text-zinc-500'
                      }`}
                    >
                      {unlocked ? (
                        completed ? (
                          <i className="fi fi-sr-check text-xl" />
                        ) : (
                          id
                        )
                      ) : (
                        <i className="fi fi-sr-lock text-lg" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-base sm:text-lg font-black truncate ${
                            unlocked
                              ? 'text-zinc-800 dark:text-white'
                              : 'text-zinc-400 dark:text-zinc-500'
                          }`}
                        >
                          {stage.name}
                        </h3>
                        {completed && (
                          <i className="fi fi-sr-badge-check text-emerald-500 text-sm shrink-0" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {stage.subtitle}
                      </p>
                      {unlocked && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                completed ? 'bg-emerald-400' : 'bg-violet-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-zinc-400 shrink-0">
                            {progress.subStages.filter((s) => s.completed).length}/
                            {progress.subStages.length}
                          </span>
                        </div>
                      )}
                    </div>
                    {unlocked && (
                      <div className="flex gap-0.5 shrink-0">
                        {[1, 2, 3].map((s) => (
                          <i
                            key={s}
                            className={`text-xs ${
                              stars >= s
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
        <LetterProgressGrid
          letters={'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')}
          letterTracker={mapData.letterTracker}
        />
      </div>
    </div>
  );
}
