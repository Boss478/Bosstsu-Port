'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGame } from '../context';
import { CHALLENGE_TYPES, CEFR_LEVEL_ORDER } from '../constants';
import { ChallengeConfigModal } from '../components/ChallengeConfigModal';
import { getWordsForGroup, VOCAB_GROUP_DEFS, TIER_ORDER } from '../vocab-group-defs';
import type { QuizConfig, QuizDirection, CefrLevel, WordData, VocabTier } from '../types';
import { WORDS } from '../words';

interface Props {
  onLaunch: (
    type: 'phoneme-match' | 'sound-sort' | 'rhyme-time' | 'speed-spell' | 'syllable-smash',
    difficulty: 'easy' | 'medium' | 'hard',
    level: CefrLevel,
    words?: WordData[],
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
  const level: CefrLevel = save?.challengeDifficulty ?? 'b1';
  const [selectedLevels, setSelectedLevels] = useState<Set<CefrLevel>>(
    () => new Set<CefrLevel>([level === 'all' ? 'b1' : level]),
  );
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [expandedTier, setExpandedTier] = useState<VocabTier | null>(null);

  const toggleLevel = useCallback((l: CefrLevel) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  }, []);

  const toggleAllLevels = useCallback(() => {
    setSelectedLevels((prev) => {
      if (prev.size > 0) return new Set();
      return new Set([...CEFR_LEVEL_ORDER]);
    });
  }, []);

  const toggleGroup = useCallback((gid: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid);
      else next.add(gid);
      return next;
    });
  }, []);

  const selectAllInTier = useCallback((ids: string[]) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
  }, []);

  const clearAllInTier = useCallback((ids: string[]) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  }, []);

  const wordPool = useMemo(() => {
    const hasLevels = selectedLevels.size > 0;
    const hasGroups = selectedGroupIds.size > 0;
    if (!hasLevels && !hasGroups) return undefined;
    if (hasLevels && !hasGroups) return WORDS.filter((w) => selectedLevels.has(w.level));
    if (!hasLevels && hasGroups) return Array.from(selectedGroupIds).flatMap((id) => getWordsForGroup(id));
    const groupWords = Array.from(selectedGroupIds).flatMap((id) => getWordsForGroup(id));
    const groupSet = new Set(groupWords.map((w) => w.word));
    return WORDS.filter((w) => selectedLevels.has(w.level) && groupSet.has(w.word));
  }, [selectedLevels, selectedGroupIds]);

  const activeLevel: CefrLevel = level;
  const isEmptyPool = wordPool !== undefined && wordPool.length === 0;
  const poolSize = wordPool !== undefined ? wordPool.length : WORDS.length;

  const poolCompatibility = useMemo((): Record<QuizDirection, 'compatible' | 'incompatible'> => {
    if (!wordPool) {
      return {
        'word-to-ipa': 'compatible',
        'ipa-to-word': 'compatible',
        'word-to-def': 'compatible',
        'def-to-word': 'compatible',
        synonyms: 'compatible',
        stress: 'compatible',
        antonyms: 'compatible',
      };
    }
    return {
      'word-to-ipa': 'compatible',
      'ipa-to-word': 'compatible',
      'word-to-def': 'compatible',
      'def-to-word': 'compatible',
      synonyms: wordPool.some((w) => w.synonyms.length >= 1) ? 'compatible' : 'incompatible',
      stress: wordPool.some((w) => (w.stress?.length ?? 0) >= 2) ? 'compatible' : 'incompatible',
      antonyms: wordPool.some((w) => w.antonyms.length >= 1) ? 'compatible' : 'incompatible',
    };
  }, [wordPool]);

  const tierGroupIds = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const g of VOCAB_GROUP_DEFS) {
      if (!map[g.tier]) map[g.tier] = [];
      map[g.tier].push(g.id);
    }
    return map;
  }, []);

  const getStats = (id: string) => {
    const stats = save?.challengeStats?.[id];
    return {
      bestScore: stats?.bestScore ?? 0,
      roundsPlayed: stats?.roundsPlayed ?? 0,
      totalCorrect: stats?.totalCorrect ?? 0,
    };
  };

  const LEVEL_OPTIONS = [...CEFR_LEVEL_ORDER];

  const TIER_LABELS: Record<VocabTier, string> = {
    easy: 'Easy',
    'easy-medium': 'Easy-Med',
    medium: 'Medium',
    'medium-hard': 'Medium-Hard',
    hard: 'Hard',
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

        {/* ── Filter Bar ── */}
        <div className="mb-4 p-4 rounded-2xl bg-white/20 dark:bg-slate-800/20 border border-white/20 dark:border-slate-700/20">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            CEFR Level
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              onClick={toggleAllLevels}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
                selectedLevels.size === 0
                  ? 'bg-indigo-500 text-white shadow-xs'
                  : 'bg-white/40 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-600/60'
              }`}
            >
              All
            </button>
            {LEVEL_OPTIONS.map((l) => (
              <button
                key={l}
                onClick={() => toggleLevel(l)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
                  selectedLevels.has(l)
                    ? 'bg-indigo-500 text-white shadow-xs'
                    : 'bg-white/40 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-600/60'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Word Group
            </p>
          </div>
          {TIER_ORDER.map((tier) => {
            const ids = tierGroupIds[tier];
            if (!ids?.length) return null;
            const isOpen = expandedTier === tier;
            const tierSelectedCount = ids.filter((id) => selectedGroupIds.has(id)).length;
            const allSelected = tierSelectedCount === ids.length;
            const noneSelected = tierSelectedCount === 0;
            return (
              <div key={tier} className="mb-1">
                <button
                  onClick={() => setExpandedTier(isOpen ? null : tier)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:bg-white/20 dark:hover:bg-slate-700/20 cursor-pointer transition-all"
                >
                  <i className={`fi fi-sr-angle-small-${isOpen ? 'down' : 'right'} text-xs transition-transform`} aria-hidden="true" />
                  {TIER_LABELS[tier]}
                  {tierSelectedCount > 0 && (
                    <span className="ml-auto text-[10px] text-indigo-500 dark:text-indigo-300">
                      {tierSelectedCount}/{ids.length}
                    </span>
                  )}
                </button>
                {isOpen && (
                  <div className="pl-4 pb-1.5">
                    <div className="flex gap-2 mb-1.5">
                      {!allSelected && (
                        <button
                          onClick={() => selectAllInTier(ids)}
                          className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400 cursor-pointer uppercase tracking-wider"
                        >
                          Select All
                        </button>
                      )}
                      {!noneSelected && (
                        <button
                          onClick={() => clearAllInTier(ids)}
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-400 cursor-pointer uppercase tracking-wider"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {ids.map((gid) => {
                        const isSelected = selectedGroupIds.has(gid);
                        return (
                          <button
                            key={gid}
                            onClick={() => toggleGroup(gid)}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all text-left ${
                              isSelected
                                ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-300/50'
                                : 'bg-white/30 dark:bg-slate-700/30 text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600/50 border border-transparent'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[8px] transition-all ${
                              isSelected
                                ? 'bg-indigo-500 border-indigo-500 text-white'
                                : 'border-slate-400 dark:border-slate-500'
                            }`}>
                              {isSelected && <i className="fi fi-sr-check text-[8px]" aria-hidden="true" />}
                            </span>
                            {gid.replace(/-/g, ' ')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div className="mt-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 text-center">
            {poolSize} words
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
                {isEmptyPool && (
                  <div className="mb-3 p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 text-center">
                    <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      Select at least one level or group to start
                    </p>
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfig(true);
                  }}
                  disabled={isEmptyPool}
                  className={`w-full py-3 rounded-2xl text-sm font-extrabold uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-xs border ${
                    isEmptyPool ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{
                    backgroundColor: isEmptyPool ? '#94a3b8' : QUIZ_ITEM.color,
                    borderColor: isEmptyPool ? '#64748b' : '#4f46e5',
                    color: '#fff',
                  }}
                >
                  Start Quiz
                </button>
              </div>
            )}

            {showConfig && (
              <ChallengeConfigModal
                compatibility={poolCompatibility}
                onSubmit={(config) => {
                  setShowConfig(false);
                  onStartQuiz({ ...config, cefrLevel: activeLevel, wordPool: wordPool ?? undefined });
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
                    {isEmptyPool && (
                      <div className="mb-3 p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 text-center">
                        <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          Select at least one level or group to start
                        </p>
                      </div>
                    )}
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                      Select Difficulty
                    </p>
                    <div className="flex gap-2">
                      {(['easy', 'medium', 'hard'] as const).map((d) => (
                        <button
                          key={d}
                          disabled={isEmptyPool}
                          onClick={(e) => {
                            if (isEmptyPool) return;
                            e.stopPropagation();
                            onLaunch(
                              challenge.id as
                                | 'phoneme-match'
                                | 'sound-sort'
                                | 'rhyme-time'
                                | 'speed-spell'
                                | 'syllable-smash',
                              d,
                              activeLevel,
                              wordPool,
                            );
                          }}
                          className={`flex-1 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-xs border ${
                            isEmptyPool ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          style={{
                            backgroundColor:
                              isEmptyPool
                                ? '#94a3b8'
                                : d === 'easy'
                                  ? '#2EC4B6'
                                  : d === 'medium'
                                    ? '#FFBA08'
                                    : '#E74C3C',
                            borderColor:
                              isEmptyPool
                                ? '#64748b'
                                : d === 'easy'
                                  ? '#1a8a7e'
                                  : d === 'medium'
                                    ? '#d49a00'
                                    : '#c0392b',
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
