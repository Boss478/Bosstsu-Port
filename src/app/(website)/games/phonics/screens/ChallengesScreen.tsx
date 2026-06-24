'use client';

import { useState } from 'react';
import { useGame } from '../context';
import { CHALLENGE_TYPES } from '../constants';
import type { CefrLevel } from '../types';

interface ChallengesScreenProps {
  onLaunch: (
    type: 'phoneme-match' | 'sound-sort' | 'rhyme-time' | 'speed-spell' | 'syllable-smash',
    difficulty: 'easy' | 'medium' | 'hard',
    level: CefrLevel,
  ) => void;
}

export default function ChallengesScreen({ onLaunch }: ChallengesScreenProps) {
  const { save } = useGame();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const level: CefrLevel = save?.cefrLevel ?? 'a1';

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain bg-transparent min-h-full">
      <div className="max-w-md mx-auto px-6 py-8 pb-36 text-center">
        <div className="mb-6">
          <h1
            className="text-2xl font-extrabold text-slate-800 dark:text-[#F7E1A0] tracking-wide"
            style={{ fontFamily: 'var(--font-mali)' }}
          >
            Challenges
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
            Fun mini-games to sharpen your skills
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {CHALLENGE_TYPES.map((challenge) => {
            const stats = save?.challengeStats?.[challenge.id];
            const highScore = stats?.bestScore ?? 0;
            const isExpanded = expandedId === challenge.id;
            return (
              <div
                key={challenge.id}
                className="glass-panel p-5 rounded-3xl border border-white/30 dark:border-slate-800 shadow-xs text-left relative overflow-hidden transition-all group cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : challenge.id)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white shrink-0"
                    style={{ backgroundColor: challenge.color }}
                  >
                    <i className={challenge.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-black text-slate-800 dark:text-white"
                      style={{ fontFamily: 'var(--font-mali)' }}
                    >
                      {challenge.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      {challenge.subtitle}
                    </p>
                  </div>
                </div>

                {highScore > 0 && (
                  <div className="mt-3 flex items-center gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                    <span className="flex items-center gap-1">
                      <i className="fi fi-sr-trophy text-[#C8A44E]" /> Best: {highScore}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="fi fi-sr-refresh text-[#2EC4B6]" /> Played:{' '}
                      {stats?.roundsPlayed ?? 0}
                    </span>
                  </div>
                )}

                {(!stats || stats.roundsPlayed === 0) && (
                  <div className="mt-3 border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Not played yet
                    </span>
                  </div>
                )}

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-200/40 dark:border-slate-800/40 animate-fadeIn">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                      Select Difficulty
                    </p>
                    <div className="flex gap-2">
                      {(['easy', 'medium', 'hard'] as const).map((d) => (
                        <button
                          key={d}
                          onClick={(e) => {
                            e.stopPropagation();
                            onLaunch(
                              challenge.id as
                                | 'phoneme-match'
                                | 'sound-sort'
                                | 'rhyme-time'
                                | 'speed-spell'
                                | 'syllable-smash',
                              d,
                              level,
                            );
                          }}
                          className="flex-1 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-xs border"
                          style={{
                            backgroundColor:
                              d === 'easy' ? '#2EC4B6' : d === 'medium' ? '#FFBA08' : '#E74C3C',
                            borderColor:
                              d === 'easy' ? '#1a8a7e' : d === 'medium' ? '#d49a00' : '#c0392b',
                            color: '#fff',
                          }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
