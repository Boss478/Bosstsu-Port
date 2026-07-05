'use client';

import { useState } from 'react';
import { useGame } from '../context';
import { CHALLENGE_TYPES } from '../constants';
import { ChallengeConfigModal } from '../components/ChallengeConfigModal';
import type { QuizConfig, CefrLevel } from '../types';

interface Props {
  onLaunch: (
    type: 'phoneme-match' | 'sound-sort' | 'rhyme-time' | 'speed-spell' | 'syllable-smash',
    difficulty: 'easy' | 'medium' | 'hard',
    level: CefrLevel,
  ) => void;
  onStartQuiz: (config: QuizConfig) => void;
}

const QUIZ_ITEM = {
  id: 'quiz',
  title: 'Quiz',
  subtitle: 'Challenge yourself with questions',
  icon: 'fi fi-sr-brain',
  color: '#6366F1',
} as const;

export default function ChallengeSelectScreen({ onLaunch, onStartQuiz }: Props) {
  const { save, setScreen } = useGame();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const level: CefrLevel = save?.cefrLevel ?? 'a1';

  const getStats = (id: string) => {
    const stats = save?.challengeStats?.[id];
    return {
      bestScore: stats?.bestScore ?? 0,
      roundsPlayed: stats?.roundsPlayed ?? 0,
      totalCorrect: stats?.totalCorrect ?? 0,
    };
  };

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain bg-transparent min-h-full">
      <div className="max-w-md mx-auto px-6 py-8 pb-36 text-center">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setScreen('word-builder')}
            className="w-8 h-8 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer shrink-0"
            aria-label="Back to Word Builder"
          >
            <i className="fi fi-sr-arrow-left text-sm" aria-hidden="true" />
          </button>
          <div className="text-left">
            <h1
              className="text-2xl font-extrabold text-slate-800 dark:text-[#F7E1A0] tracking-wide"
              style={{ fontFamily: 'var(--font-mali)' }}
            >
              Challenges
            </h1>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
              Choose a challenge to test your skills
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Quiz item */}
          <div
            key={QUIZ_ITEM.id}
            className="glass-panel p-5 rounded-3xl border border-white/30 dark:border-slate-800 shadow-xs text-left relative overflow-hidden transition-all group"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white shrink-0"
                style={{ backgroundColor: QUIZ_ITEM.color }}
              >
                <i className={QUIZ_ITEM.icon} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="text-lg font-black text-slate-800 dark:text-white cursor-pointer"
                  style={{ fontFamily: 'var(--font-mali)' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedId(expandedId === QUIZ_ITEM.id ? null : QUIZ_ITEM.id);
                    }
                  }}
                  onClick={() => setExpandedId(expandedId === QUIZ_ITEM.id ? null : QUIZ_ITEM.id)}
                >
                  {QUIZ_ITEM.title}
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  {QUIZ_ITEM.subtitle}
                </p>
              </div>
            </div>

            {(() => {
              const stats = getStats('quiz');
              if (stats.roundsPlayed > 0) {
                return (
                  <div className="mt-3 flex items-center gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                    <span className="flex items-center gap-1">
                      <i className="fi fi-sr-trophy text-[#C8A44E]" aria-hidden="true" /> Best:{' '}
                      {stats.bestScore}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="fi fi-sr-refresh text-[#2EC4B6]" aria-hidden="true" /> Played:{' '}
                      {stats.roundsPlayed}
                    </span>
                  </div>
                );
              }
              return (
                <div className="mt-3 border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Not played yet
                  </span>
                </div>
              );
            })()}

            {expandedId === QUIZ_ITEM.id && (
              <div className="mt-4 pt-4 border-t border-slate-200/40 dark:border-slate-800/40 animate-fadeIn">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfig(true);
                  }}
                  className="w-full py-3 rounded-2xl text-sm font-extrabold uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-xs border"
                  style={{
                    backgroundColor: QUIZ_ITEM.color,
                    borderColor: '#4f46e5',
                    color: '#fff',
                  }}
                >
                  Start Quiz
                </button>
              </div>
            )}

            {showConfig && (
              <ChallengeConfigModal
                onSubmit={(config) => {
                  setShowConfig(false);
                  onStartQuiz(config);
                }}
                onClose={() => setShowConfig(false)}
              />
            )}
          </div>

          {/* Mini game items */}
          {CHALLENGE_TYPES.map((challenge) => {
            const stats = getStats(challenge.id);
            const isExpanded = expandedId === challenge.id;
            return (
              <div
                key={challenge.id}
                className="glass-panel p-5 rounded-3xl border border-white/30 dark:border-slate-800 shadow-xs text-left relative overflow-hidden transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white shrink-0"
                    style={{ backgroundColor: challenge.color }}
                  >
                    <i className={challenge.icon} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-black text-slate-800 dark:text-white cursor-pointer"
                      style={{ fontFamily: 'var(--font-mali)' }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedId(isExpanded ? null : challenge.id);
                        }
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : challenge.id)}
                    >
                      {challenge.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      {challenge.subtitle}
                    </p>
                  </div>
                </div>

                {stats.roundsPlayed > 0 && (
                  <div className="mt-3 flex items-center gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                    <span className="flex items-center gap-1">
                      <i className="fi fi-sr-trophy text-[#C8A44E]" aria-hidden="true" /> Best:{' '}
                      {stats.bestScore}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="fi fi-sr-refresh text-[#2EC4B6]" aria-hidden="true" /> Played:{' '}
                      {stats.roundsPlayed}
                    </span>
                  </div>
                )}

                {stats.roundsPlayed === 0 && (
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
