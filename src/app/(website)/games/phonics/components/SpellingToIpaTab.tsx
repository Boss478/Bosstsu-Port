'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { WORDS } from '../words';
import { PHONEMES, WB_PANEL_BASE } from '../constants';
import { useAudio } from '@/hooks/useAudio';
import { WordCard } from '../components/WordCard';
import WordPill from '../components/WordPill';
import { LetterTileKeyboard } from '../components/LetterTileKeyboard';
import { useAllWordEntries } from '../hooks/useAllWordEntries';
import { predictPhonemes, phonemeIdsToIpa } from '../utils/g2p';
import { findClosestWords } from '../utils/phonemeSearch';
import { PRONUNCIATION_DICT, type WordLookupResult } from '../word-builder-types';

interface Props {
  layoutMode: 'vertical' | 'horizontal';
  keyboardLayout: 'qwerty' | 'alphabetical';
  showSearchHistory: boolean;
  playTapSound: () => void;
  favorites: string[];
  onToggleFavorite: (word: string) => void;
}

export default function SpellingToIpaTab({
  layoutMode,
  keyboardLayout,
  showSearchHistory,
  playTapSound,
  favorites,
  onToggleFavorite,
}: Props) {
  const { playWordAudio } = useAudio();
  const [searchText, setSearchTextRaw] = useState('');
  const setSearchText = useCallback((val: string | ((prev: string) => string)) => {
    setSearchTextRaw((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      return next.toUpperCase();
    });
  }, []);

  const [apiResult, setApiResult] = useState<WordLookupResult | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('word-builder-search-history');
      if (stored) {
        try {
          const list = JSON.parse(stored);
          if (Array.isArray(list))
            return list.map((w) => (typeof w === 'string' ? w.toUpperCase() : ''));
        } catch {}
      }
    }
    return [];
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const apiCacheRef = useRef<Map<string, WordLookupResult | null>>(new Map());

  const addToHistory = useCallback((word: string) => {
    setSearchHistory((prev) => {
      const cleaned = word.trim().toUpperCase();
      const next = [
        cleaned,
        ...prev.filter((w) => w.toUpperCase() !== cleaned.toUpperCase()),
      ].slice(0, 10);
      if (typeof window !== 'undefined') {
        localStorage.setItem('word-builder-search-history', JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    playTapSound();
    setSearchHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('word-builder-search-history');
    }
  }, [playTapSound]);

  const appendLetter = useCallback(
    (letter: string) => {
      playTapSound();
      setSearchText((prev) => prev + letter);
      setNetworkError(false);
      inputRef.current?.focus();
    },
    [playTapSound, setSearchText],
  );

  const handleBackspaceKey = useCallback(() => {
    playTapSound();
    setSearchText((prev) => prev.slice(0, -1));
    inputRef.current?.focus();
  }, [playTapSound, setSearchText]);

  useEffect(() => {
    const q = searchText.trim().toUpperCase();
    if (!q) return;

    const cached = apiCacheRef.current.get(q);
    if (cached !== undefined) {
      if (cached) {
        setApiResult(cached);
        if (cached.word) addToHistory(cached.word);
      } else {
        setApiResult(null);
      }
      setNetworkError(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setApiLoading(true);
      setNetworkError(false);
      try {
        const res = await fetch(
          `/api/dictionary?word=${encodeURIComponent(q)}&fields=ipa,definition,word`,
        );
        if (cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        const result = data.ipa || data.definition ? (data as WordLookupResult) : null;
        apiCacheRef.current.set(q, result);
        if (result) {
          setApiResult(result);
          if (result.word) addToHistory(result.word);
        } else {
          setApiResult(null);
        }
      } catch {
        if (!cancelled) {
          setNetworkError(true);
          setApiResult(null);
        }
      }
      if (!cancelled) setApiLoading(false);
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchText, addToHistory]);

  const showEmpty = !searchText.trim();
  const showNotFound = searchText.trim() && !apiLoading && !apiResult && !networkError;
  const showNetworkErr = searchText.trim() && !apiLoading && networkError;

  const allWordEntriesForPrediction = useAllWordEntries();

  const predictedPhonemes = useMemo(() => {
    if (!searchText.trim()) return [];
    return predictPhonemes(searchText.trim());
  }, [searchText]);

  const predictedIpa = useMemo(() => {
    if (!predictedPhonemes.length) return null;
    return phonemeIdsToIpa(predictedPhonemes);
  }, [predictedPhonemes]);

  const dictSuggestions = useMemo(() => {
    if (!predictedPhonemes.length) return [];
    return findClosestWords(predictedPhonemes, allWordEntriesForPrediction, 6);
  }, [predictedPhonemes, allWordEntriesForPrediction]);

  const localWords = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return [];
    return WORDS.filter((w) => w.word.startsWith(q)).slice(0, 12);
  }, [searchText]);

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
          <div className="relative">
            <i className="fi fi-sr-search absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setNetworkError(false);
              }}
              placeholder="Type any English word..."
              autoFocus
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              className="w-full py-3.5 pl-10 pr-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#C8A44E] dark:focus:border-[#C8A44E] focus:ring-2 focus:ring-[#C8A44E]/20 transition-all uppercase"
            />
          </div>

          {localWords.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                Word Suggestions
              </span>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {localWords.map((w) => (
                  <WordPill
                    key={w.word}
                    size="lg"
                    className="shrink-0"
                    onClick={() => {
                      playTapSound();
                      setSearchText(w.word);
                      setNetworkError(false);
                      inputRef.current?.focus();
                    }}
                  >
                    {w.word.toUpperCase()}
                  </WordPill>
                ))}
              </div>
            </div>
          )}

          {showSearchHistory && searchHistory.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Recent Searches
                </span>
                <button
                  onClick={clearHistory}
                  className="text-[8px] font-extrabold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest cursor-pointer"
                >
                  Clear History
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {searchHistory.map((w) => (
                  <WordPill
                    key={w}
                    variant="muted"
                    size="lg"
                    className="shrink-0"
                    onClick={() => {
                      playTapSound();
                      setSearchText(w);
                      setNetworkError(false);
                      inputRef.current?.focus();
                    }}
                  >
                    {w}
                  </WordPill>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col justify-center">
            {apiLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#C8A44E] border-t-transparent rounded-full motion-safe:animate-spin" />
              </div>
            )}

            {showEmpty && !apiLoading && (
              <p className="text-center text-xs text-slate-400 dark:text-slate-500 font-bold py-8">
                Type a word to see its IPA transcription
              </p>
            )}

            {showNetworkErr && (
              <p className="text-center text-xs text-amber-500 font-bold py-8">
                Could not load &mdash; check your connection
              </p>
            )}

            {showNotFound && !predictedIpa && (
              <p className="text-center text-xs text-rose-500 font-bold py-8">
                Word not found &mdash; try another word
              </p>
            )}

            {showNotFound && predictedIpa && (
              <div className="rounded-2xl bg-amber-50/60 dark:bg-amber-900/20 border border-amber-300/40 dark:border-amber-700/40 p-4 space-y-3">
                <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  PREDICTED
                </span>
                <p className="text-lg font-black text-slate-800 dark:text-white">{searchText}</p>
                <p className="text-sm font-mono font-bold text-slate-600 dark:text-slate-300">
                  {predictedIpa}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Generated from English phonics rules
                </p>
                {dictSuggestions.length > 0 && (
                  <div className="pt-1 space-y-1.5">
                    <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Closest words
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {dictSuggestions.map((s) => (
                        <WordPill
                          key={s.word}
                          onClick={() => {
                            playTapSound();
                            setSearchText(s.word.toUpperCase());
                          }}
                        >
                          {s.word.toUpperCase()}
                        </WordPill>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {searchText.trim() && apiResult && !apiLoading && (
              <div className="space-y-3 w-full">
                {apiResult.entries && apiResult.entries.length > 0 ? (
                  apiResult.entries.map((ent, idx) => (
                    <WordCard
                      key={idx}
                      word={ent.word}
                      ipa={ent.ipa || ''}
                      wordClass={ent.wordClass || undefined}
                      definition={ent.definition || undefined}
                      example={ent.example || undefined}
                      onPlay={() => playWordAudio(ent.audioUrl || ent.word)}
                      expanded={idx === 0}
                      favorite={favorites.includes((ent.word || '').toUpperCase())}
                      onFavoriteToggle={() => onToggleFavorite(ent.word || ent.word)}
                    />
                  ))
                ) : (
                  <>
                    <WordCard
                      word={apiResult.word || searchText}
                      ipa={apiResult.ipa || ''}
                      definition={apiResult.definition || undefined}
                      example={apiResult.example || undefined}
                      onPlay={() => playWordAudio(apiResult.word || searchText)}
                      expanded={true}
                      favorite={favorites.includes((apiResult.word || searchText).toUpperCase())}
                      onFavoriteToggle={() => onToggleFavorite(apiResult.word || searchText)}
                    />
                    {(() => {
                      const wordLookup = (apiResult.word || searchText).toLowerCase();
                      const dictEntry = PRONUNCIATION_DICT.find(
                        (e) => e.word.toLowerCase() === wordLookup,
                      );
                      if (!dictEntry || !dictEntry.phonemeIds?.length) return null;
                      const phonemeChips = dictEntry.phonemeIds
                        .map((id) => PHONEMES.find((p) => p.id === id))
                        .filter(Boolean);
                      if (!phonemeChips.length) return null;
                      return (
                        <div className="rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/40 dark:border-slate-800/60 p-3.5 space-y-2">
                          <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Phoneme Breakdown
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {phonemeChips.map((p) => (
                              <span
                                key={p!.id}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 text-[10px] font-bold text-slate-700 dark:text-slate-200"
                              >
                                <span className="font-mono">{p!.ipa}</span>
                                <span className="text-slate-400">/</span>
                                <span className="text-slate-500">{p!.name}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}
          </div>

          {searchText.length > 0 && (
            <div className="flex items-center gap-1.5 min-h-[48px] p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/40 dark:border-slate-800/60 mt-auto">
              {searchText.split('').map((letter, i) => (
                <span
                  key={i}
                  className="w-8 h-8 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 text-sm font-extrabold text-slate-700 dark:text-slate-200 flex items-center justify-center"
                >
                  {letter}
                </span>
              ))}
              <span className="ml-auto text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                {searchText.length} letter{searchText.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div
          className={`${layoutMode === 'horizontal' ? 'lg:col-span-7 min-h-[380px]' : 'w-full min-h-0'} ${WB_PANEL_BASE} flex flex-col justify-start`}
        >
          <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 text-center lg:text-left">
            Virtual Input Keyboard ({keyboardLayout === 'qwerty' ? 'QWERTY' : 'A-Z'})
          </p>
          <div className="select-none my-auto">
            <LetterTileKeyboard
              layout={keyboardLayout}
              onChar={appendLetter}
              onBackspace={handleBackspaceKey}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
