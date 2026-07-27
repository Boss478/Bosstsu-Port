'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { PHONEMES, WB_PANEL_BASE } from '../constants';
import { useAudio } from '@/hooks/useAudio';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { WordCard } from '../components/WordCard';
import WordPill from '../components/WordPill';
import { DialectBadge } from '../components/DialectBadge';
import { PhonemeSoundboard } from '../components/PhonemeSoundboard';
import { useAllWordEntries } from '../hooks/useAllWordEntries';
import { formatPhonemeIpa } from '../utils/ipaUtils';
import { findClosestWords, generateSpellings } from '../utils/phonemeSearch';
import type { PhonemeData } from '../types';

interface Props {
  layoutMode: 'vertical' | 'horizontal';
  dialectPreference: 'both' | 'us' | 'uk';
  phonemeLabelMode: 'both' | 'ipa' | 'example';
  playTapSound: () => void;
  favorites: string[];
  onToggleFavorite: (word: string) => void;
}

export default function IpaToWordTab({
  layoutMode,
  dialectPreference,
  phonemeLabelMode,
  playTapSound,
  favorites,
  onToggleFavorite,
}: Props) {
  const { playWordAudio } = useAudio();
  const [soundboardSortMode, setSoundboardSortMode] = useLocalStorage<'grouped' | 'flat'>(
    'word-builder-sb-sort-mode',
    'grouped',
  );
  const [soundboardSortOrder, setSoundboardSortOrder] = useLocalStorage<'default' | 'asc' | 'desc'>(
    'word-builder-sb-sort-order',
    'default',
  );
  const [selectedPhonemes, setSelectedPhonemes] = useState<PhonemeData[]>([]);
  const [selectedWordName, setSelectedWordName] = useState<string | null>(null);

  const selectedIds = useMemo(() => selectedPhonemes.map((p) => p.id), [selectedPhonemes]);
  const selectedStr = useMemo(() => selectedIds.join('|'), [selectedIds]);

  const combinedIpa = useMemo(() => {
    if (selectedPhonemes.length === 0) return '';
    return `/ ${formatPhonemeIpa(selectedPhonemes)} /`;
  }, [selectedPhonemes]);

  const allWordEntries = useAllWordEntries();

  const matchingWords = useMemo(() => {
    if (selectedIds.length === 0) return [];
    let list = allWordEntries.filter((w) => w.phonemeIds.join('|').includes(selectedStr));
    if (dialectPreference === 'us') {
      list = list.filter((w) => !w.dialect || w.dialect === 'us' || w.dialect === 'universal');
    } else if (dialectPreference === 'uk') {
      list = list.filter((w) => !w.dialect || w.dialect === 'uk' || w.dialect === 'universal');
    }
    return list;
  }, [selectedIds, selectedStr, allWordEntries, dialectPreference]);

  const sortedMatchingWords = useMemo(() => {
    return [...matchingWords].sort((a, b) => {
      const aFav = favorites.includes(a.word.toUpperCase()) ? -1 : 0;
      const bFav = favorites.includes(b.word.toUpperCase()) ? -1 : 0;
      return aFav - bFav;
    });
  }, [matchingWords, favorites]);

  const closestPredictions = useMemo(() => {
    if (selectedIds.length === 0 || matchingWords.length > 0) return [];
    return findClosestWords(selectedIds, allWordEntries, 6);
  }, [selectedIds, allWordEntries, matchingWords.length]);

  const possibleSpellings = useMemo(() => {
    if (selectedIds.length === 0 || matchingWords.length > 0) return [];
    return generateSpellings(selectedIds);
  }, [selectedIds, matchingWords.length]);

  const selectedWordData = useMemo(() => {
    if (!selectedWordName) return null;
    return (
      allWordEntries.find((w) => w.word.toLowerCase() === selectedWordName.toLowerCase()) || null
    );
  }, [selectedWordName, allWordEntries]);

  const appendPhoneme = useCallback(
    (p: PhonemeData) => {
      playTapSound();
      setSelectedPhonemes((prev) => [...prev, p]);
      setSelectedWordName(null);
    },
    [playTapSound],
  );

  const autoSelectPhonemes = useCallback(
    (w: (typeof allWordEntries)[number]) => {
      playTapSound();
      const data = w.phonemeIds
        .map((pid) => PHONEMES.find((p) => p.id === pid))
        .filter((p): p is PhonemeData => !!p);
      setSelectedPhonemes(data);
      setSelectedWordName(w.word);
    },
    [playTapSound],
  );

  const handleBackspace = useCallback(() => {
    playTapSound();
    setSelectedPhonemes((prev) => prev.slice(0, -1));
    setSelectedWordName(null);
  }, [playTapSound]);

  const clearSelection = useCallback(() => {
    playTapSound();
    setSelectedPhonemes([]);
    setSelectedWordName(null);
  }, [playTapSound]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && selectedPhonemes.length > 0) {
        e.preventDefault();
        handleBackspace();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleBackspace, selectedPhonemes.length]);

  return (
    <div className="max-w-6xl mx-auto pb-2">
      <div
        className={
          layoutMode === 'horizontal'
            ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'
            : 'flex flex-col gap-6'
        }
      >
        <div
          className={`${layoutMode === 'horizontal' ? 'lg:col-span-5 min-h-[380px]' : 'w-full min-h-0'} ${WB_PANEL_BASE} space-y-4 flex flex-col justify-start`}
        >
          <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            IPA Sequence Builder
          </p>

          <div className="flex items-center gap-2 min-h-[48px] p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/40 dark:border-slate-800/60">
            {selectedPhonemes.length === 0 ? (
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold px-2">
                Tap phonemes to build an IPA sequence...
              </span>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <span
                    className="text-sm font-black text-slate-800 dark:text-white"
                    style={{ fontFamily: 'var(--font-geist-mono)' }}
                  >
                    {combinedIpa}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleBackspace}
                    className="px-2.5 py-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 text-slate-500 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-700 transition-colors cursor-pointer"
                    title="Remove last phoneme (Backspace)"
                    aria-label="Remove last phoneme"
                  >
                    <span className="text-base leading-none">&#9003;</span>
                  </button>
                  <button
                    onClick={clearSelection}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    Clear
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {selectedIds.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Matching words ({matchingWords.length})
                </p>
                {sortedMatchingWords.length === 0 ? (
                  <div className="space-y-3">
                    {closestPredictions.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                          Did you mean? (PREDICTED)
                        </span>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                          {closestPredictions.map((w) => (
                            <WordPill
                              key={`${w.word}-${w.entry.dialect || 'default'}`}
                              size="sm"
                              onClick={() => autoSelectPhonemes(w.entry)}
                            >
                              <span className="truncate">{w.word}</span>
                              {w.entry.dialect && <DialectBadge dialect={w.entry.dialect} />}
                            </WordPill>
                          ))}
                        </div>
                      </div>
                    )}
                    {possibleSpellings.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          Possible spellings
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {possibleSpellings.map((s) => (
                            <WordPill key={s} variant="inert">
                              {s}
                            </WordPill>
                          ))}
                        </div>
                      </div>
                    )}
                    {closestPredictions.length === 0 && possibleSpellings.length === 0 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-bold text-center py-4">
                        No predictions available for this phoneme sequence
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {sortedMatchingWords.slice(0, 12).map((w) => {
                      const isActive = selectedIds.join('|') === w.phonemeIds.join('|');
                      const isFav = favorites.includes(w.word.toUpperCase());
                      return (
                        <WordPill
                          key={w.word}
                          size="sm"
                          active={isActive}
                          onClick={() => autoSelectPhonemes(w)}
                        >
                          {isFav && <i className="fi fi-sr-heart text-[8px] text-rose-400" />}
                          <span className="truncate">{w.word}</span>
                          {w.dialect && <DialectBadge dialect={w.dialect} />}
                        </WordPill>
                      );
                    })}
                    {sortedMatchingWords.length > 12 && (
                      <span className="col-span-full text-[9px] font-bold text-slate-400 dark:text-slate-500 text-center py-1">
                        +{sortedMatchingWords.length - 12} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-xs text-slate-400 dark:text-slate-500 font-bold py-8">
                Build a phonetic path to discover words
              </p>
            )}

            {selectedWordData && (
              <div className="mt-4">
                <WordCard
                  word={selectedWordData.word}
                  ipa={selectedWordData.ipa || ''}
                  definition={selectedWordData.definition}
                  example={selectedWordData.example}
                  onPlay={() => playWordAudio(selectedWordData.word)}
                  expanded={true}
                  favorite={favorites.includes(selectedWordData.word.toUpperCase())}
                  onFavoriteToggle={() => onToggleFavorite(selectedWordData.word)}
                />
              </div>
            )}
          </div>
        </div>

        <div
          className={`${layoutMode === 'horizontal' ? 'lg:col-span-7' : 'w-full'} ${WB_PANEL_BASE} space-y-5`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Phoneme Soundboard
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setSoundboardSortMode(soundboardSortMode === 'grouped' ? 'flat' : 'grouped')
                }
                className="text-[9px] font-extrabold text-[#C8A44E] hover:text-[#D4B06A] transition-colors cursor-pointer uppercase tracking-wider flex items-center gap-1"
                aria-label={
                  soundboardSortMode === 'grouped'
                    ? 'Switch to flat view'
                    : 'Switch to grouped view'
                }
              >
                <i
                  className={`fi ${soundboardSortMode === 'grouped' ? 'fi-sr-grid' : 'fi-sr-layers'} text-[10px]`}
                />
                {soundboardSortMode === 'grouped' ? 'Flat' : 'Group'}
              </button>
              <button
                onClick={() =>
                  setSoundboardSortOrder(
                    soundboardSortOrder === 'default'
                      ? 'asc'
                      : soundboardSortOrder === 'asc'
                        ? 'desc'
                        : 'default',
                  )
                }
                className="text-[9px] font-extrabold text-[#2EC4B6] hover:text-[#259f94] transition-colors cursor-pointer uppercase tracking-wider flex items-center gap-1"
                aria-label="Toggle sort order"
              >
                <i className="fi fi-sr-arrow-trend-up text-[10px]" />
                {soundboardSortOrder === 'default'
                  ? 'Default'
                  : soundboardSortOrder === 'asc'
                    ? 'A→Z'
                    : 'Z→A'}
              </button>
              <button
                onClick={() => {
                  const random = allWordEntries[Math.floor(Math.random() * allWordEntries.length)];
                  if (random) autoSelectPhonemes(random);
                }}
                className="text-[9px] font-extrabold text-[#2EC4B6] hover:text-[#259f94] transition-colors cursor-pointer uppercase tracking-wider flex items-center gap-1"
                aria-label="Surprise me with a random word"
              >
                <i className="fi fi-sr-shuffle text-[10px]" />
                Surprise Me
              </button>
            </div>
          </div>

          <PhonemeSoundboard
            layoutMode={layoutMode}
            phonemeLabelMode={phonemeLabelMode}
            selectedPhonemeIds={selectedIds}
            onPhonemeClick={appendPhoneme}
            sortMode={soundboardSortMode}
            sortOrder={soundboardSortOrder}
          />
        </div>
      </div>
    </div>
  );
}
