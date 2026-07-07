'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../context';
import { WORDS } from '../words';
import { PHONEMES, WB_PANEL_BASE } from '../constants';
import { useAudio } from '@/hooks/useAudio';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { WordCard } from '../components/WordCard';
import { DialectBadge } from '../components/DialectBadge';
import WordPill from '../components/WordPill';
import { LetterTileKeyboard } from '../components/LetterTileKeyboard';
import { PhonemeSoundboard } from '../components/PhonemeSoundboard';
import { useAllWordEntries } from '../hooks/useAllWordEntries';
import { formatPhonemeIpa } from '../utils/ipaUtils';
import type { PhonemeData, DictEntry } from '../types';
import { predictPhonemes, phonemeIdsToIpa } from '../utils/g2p';
import { findClosestWords, generateSpellings } from '../utils/phonemeSearch';
import dictData from '@/data/pronunciation-dictionary.json';

const PRONUNCIATION_DICT = dictData as DictEntry[];

interface WordLookupResult {
  word?: string;
  ipa?: string | null;
  definition?: string | null;
  example?: string | null;
  entries?: {
    word: string;
    ipa: string | null;
    wordClass: string | null;
    definition: string | null;
    example: string | null;
    audioUrl: string | null;
  }[];
}

type BuilderTab = 'spelling' | 'ipa-to-word';

export default function WordBuilderScreen() {
  const { setScreen } = useGame();
  const [activeTab, setActiveTab] = useState<BuilderTab>('spelling');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [layoutMode, setLayoutMode] = useLocalStorage<'vertical' | 'horizontal'>(
    'word-builder-layout',
    'horizontal',
  );
  const [zoomLevel, setZoomLevel] = useLocalStorage<number>('word-builder-zoom', 100);
  const [keyboardLayout, setKeyboardLayout] = useLocalStorage<'qwerty' | 'alphabetical'>(
    'word-builder-keyboard-layout',
    'qwerty',
  );
  const [dialectPreference, setDialectPreference] = useLocalStorage<'both' | 'us' | 'uk'>(
    'word-builder-dialect',
    'both',
  );
  const [tapSoundsEnabled, setTapSoundsEnabled] = useLocalStorage<boolean>(
    'word-builder-tap-sounds',
    true,
  );
  const [phonemeLabelMode, setPhonemeLabelMode] = useLocalStorage<'both' | 'ipa' | 'example'>(
    'word-builder-phoneme-labels',
    'both',
  );
  const [showSearchHistory, setShowSearchHistory] = useLocalStorage<boolean>(
    'word-builder-show-search-history',
    true,
  );
  const [favorites, setFavorites] = useLocalStorage<string[]>('word-builder-favorites', []);
  const [soundboardSortMode, setSoundboardSortMode] = useLocalStorage<'grouped' | 'flat'>(
    'word-builder-sb-sort-mode',
    'grouped',
  );
  const [soundboardSortOrder, setSoundboardSortOrder] = useLocalStorage<'default' | 'asc' | 'desc'>(
    'word-builder-sb-sort-order',
    'default',
  );

  const toggleFavorite = useCallback(
    (word: string) => {
      setFavorites((prev) => {
        const normalized = word.toUpperCase();
        if (prev.includes(normalized)) {
          return prev.filter((w) => w !== normalized);
        }
        return [...prev, normalized];
      });
    },
    [setFavorites],
  );

  // Web Audio tap sound chime generator
  const playTapSound = useCallback(() => {
    if (!tapSoundsEnabled) return;
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
        ctx.close();
      };
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }, [tapSoundsEnabled]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div className="shrink-0 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen('path')}
            className="shrink-0 w-9 h-9 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all cursor-pointer active:scale-90"
            aria-label="Back to Soundbook"
          >
            <i className="fi fi-sr-arrow-left text-sm" />
          </button>
          <h1
            className="text-lg font-extrabold text-slate-800 dark:text-[#F7E1A0] tracking-wide"
            style={{ fontFamily: 'var(--font-mali)' }}
          >
            Word Builder
          </h1>
        </div>

        {/* Global Settings button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="shrink-0 w-9 h-9 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/80 active:scale-90 transition-all cursor-pointer"
          aria-label="Layout Settings"
          title="Layout Settings"
        >
          <i className="fi fi-sr-settings text-sm" />
        </button>
      </div>

      <div className="flex gap-1 bg-slate-200/40 dark:bg-slate-800/50 rounded-xl p-1 mx-5 mb-3 shrink-0">
        <TabButton active={activeTab === 'spelling'} onClick={() => setActiveTab('spelling')}>
          Spelling &rarr; IPA
        </TabButton>
        <TabButton active={activeTab === 'ipa-to-word'} onClick={() => setActiveTab('ipa-to-word')}>
          IPA &rarr; Word
        </TabButton>
        <button
          onClick={() => setScreen('challenge-list')}
          className="ml-auto px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#C8A44E] to-[#D4B06A] text-white text-[9px] font-extrabold tracking-wider uppercase shadow-sm hover:shadow-md hover:from-[#D4B06A] hover:to-[#C8A44E] active:scale-95 transition-all cursor-pointer flex items-center gap-1"
          aria-label="Challenge"
        >
          <i className="fi fi-sr-bolt text-[10px]" />
          Challenge
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8"
        style={{ zoom: zoomLevel / 100 } as React.CSSProperties}
      >
        {activeTab === 'spelling' ? (
          <SpellingToIpaTab
            layoutMode={layoutMode}
            keyboardLayout={keyboardLayout}
            showSearchHistory={showSearchHistory}
            playTapSound={playTapSound}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <IpaToWordTab
            layoutMode={layoutMode}
            dialectPreference={dialectPreference}
            phonemeLabelMode={phonemeLabelMode}
            playTapSound={playTapSound}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </div>

      {/* Global Settings Modal Popup */}
      {isSettingsOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4 animate-fade-in">
            <div
              className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 transform scale-100 transition-transform duration-200"
              style={{ fontFamily: 'var(--font-mali)' }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <i className="fi fi-sr-settings text-[#C8A44E] text-sm" />
                  Word Builder Settings
                </h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close settings"
                >
                  <i className="fi fi-sr-cross text-[10px]" />
                </button>
              </div>

              {/* Scrollable Settings Options */}
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                {/* Layout Options */}
                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Choose Screen Layout
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Horizontal Option (Side-by-side) */}
                    <button
                      onClick={() => setLayoutMode('horizontal')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                        layoutMode === 'horizontal'
                          ? 'bg-[#C8A44E]/10 dark:bg-[#C8A44E]/20 border-[#C8A44E] shadow-xs text-slate-800 dark:text-white'
                          : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-850 hover:border-slate-350'
                      }`}
                    >
                      {/* Side-by-side mini preview */}
                      <div className="w-12 h-8 flex gap-1 mb-3 justify-center items-center">
                        <div className="w-5 h-full rounded-sm bg-slate-300 dark:bg-slate-700" />
                        <div className="w-5 h-full rounded-sm bg-slate-350 dark:bg-slate-600" />
                      </div>
                      <span className="text-xs font-black">Side-by-Side</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                        Split columns on desktop
                      </span>
                    </button>

                    {/* Vertical Option (Stacked) */}
                    <button
                      onClick={() => setLayoutMode('vertical')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                        layoutMode === 'vertical'
                          ? 'bg-[#C8A44E]/10 dark:bg-[#C8A44E]/20 border-[#C8A44E] shadow-xs text-slate-800 dark:text-white'
                          : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-850 hover:border-slate-350'
                      }`}
                    >
                      {/* Stacked mini preview */}
                      <div className="w-12 h-8 flex flex-col gap-1 mb-3 justify-center">
                        <div className="h-3 w-full rounded-sm bg-slate-300 dark:bg-slate-700" />
                        <div className="h-3 w-full rounded-sm bg-slate-350 dark:bg-slate-600" />
                      </div>
                      <span className="text-xs font-black">Stacked Rows</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                        Stacked top-to-bottom
                      </span>
                    </button>
                  </div>
                </div>

                {/* Zoom Controls */}
                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Adjust Layout Zoom
                  </label>

                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                    <button
                      onClick={() => setZoomLevel(Math.max(70, zoomLevel - 10))}
                      disabled={zoomLevel <= 70}
                      className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Zoom out"
                    >
                      <i className="fi fi-sr-minus text-xs" />
                    </button>

                    <div className="flex-1 text-center select-none">
                      <span className="text-xs font-black text-slate-800 dark:text-white block">
                        {zoomLevel}%
                      </span>
                      <span className="text-[8px] text-slate-400 dark:text-slate-500 uppercase font-bold mt-0.5 block tracking-wider">
                        {zoomLevel === 100
                          ? 'Default size'
                          : zoomLevel < 100
                            ? 'Compact view'
                            : 'Enlarged view'}
                      </span>
                    </div>

                    <button
                      onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                      disabled={zoomLevel >= 200}
                      className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Zoom in"
                    >
                      <i className="fi fi-sr-plus text-xs" />
                    </button>

                    {zoomLevel !== 100 && (
                      <button
                        onClick={() => setZoomLevel(100)}
                        className="px-2.5 py-2 rounded-xl text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer tracking-wider"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Keyboard Layout Settings */}
                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Spelling Keyboard Layout
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setKeyboardLayout('qwerty')}
                      className={`py-2 px-3 rounded-2xl border text-center transition-all cursor-pointer text-xs font-black ${
                        keyboardLayout === 'qwerty'
                          ? 'bg-[#C8A44E]/10 dark:bg-[#C8A44E]/20 border-[#C8A44E] text-[#C8A44E]'
                          : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      QWERTY Style
                    </button>
                    <button
                      onClick={() => setKeyboardLayout('alphabetical')}
                      className={`py-2 px-3 rounded-2xl border text-center transition-all cursor-pointer text-xs font-black ${
                        keyboardLayout === 'alphabetical'
                          ? 'bg-[#C8A44E]/10 dark:bg-[#C8A44E]/20 border-[#C8A44E] text-[#C8A44E]'
                          : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      A-Z Alphabetical
                    </button>
                  </div>
                </div>

                {/* Dialect Settings */}
                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Pronunciation Dialect
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['both', 'us', 'uk'].map((mode) => {
                      const label = mode === 'both' ? 'All' : mode.toUpperCase();
                      const isActive = dialectPreference === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => setDialectPreference(mode as 'both' | 'us' | 'uk')}
                          className={`py-2 px-1 rounded-2xl border text-center transition-all cursor-pointer text-xs font-black ${
                            isActive
                              ? 'bg-[#C8A44E]/10 dark:bg-[#C8A44E]/20 border-[#C8A44E] text-[#C8A44E]'
                              : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Phoneme Button Labels Settings */}
                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Phoneme Button Labels
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['both', 'ipa', 'example'] as const).map((mode) => {
                      const label =
                        mode === 'both' ? 'Both' : mode === 'ipa' ? 'IPA Only' : 'Word Only';
                      const isActive = phonemeLabelMode === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => setPhonemeLabelMode(mode)}
                          className={`py-2 px-1 rounded-2xl border text-center transition-all cursor-pointer text-[10px] font-black ${
                            isActive
                              ? 'bg-[#C8A44E]/10 dark:bg-[#C8A44E]/20 border-[#C8A44E] text-[#C8A44E]'
                              : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Soundboard Sort Settings */}
                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Soundboard Sort
                  </label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSoundboardSortMode('grouped')}
                        className={`py-2 px-3 rounded-2xl border text-center transition-all cursor-pointer text-[10px] font-black ${
                          soundboardSortMode === 'grouped'
                            ? 'bg-[#C8A44E]/10 dark:bg-[#C8A44E]/20 border-[#C8A44E] text-[#C8A44E]'
                            : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <i className="fi fi-sr-layers text-xs mr-1" />
                        Grouped
                      </button>
                      <button
                        onClick={() => setSoundboardSortMode('flat')}
                        className={`py-2 px-3 rounded-2xl border text-center transition-all cursor-pointer text-[10px] font-black ${
                          soundboardSortMode === 'flat'
                            ? 'bg-[#C8A44E]/10 dark:bg-[#C8A44E]/20 border-[#C8A44E] text-[#C8A44E]'
                            : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <i className="fi fi-sr-grid text-xs mr-1" />
                        Flat
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['default', 'asc', 'desc'] as const).map((order) => {
                        const label =
                          order === 'default' ? 'Default' : order === 'asc' ? 'A→Z' : 'Z→A';
                        return (
                          <button
                            key={order}
                            onClick={() => setSoundboardSortOrder(order)}
                            className={`py-2 px-1 rounded-2xl border text-center transition-all cursor-pointer text-[9px] font-black ${
                              soundboardSortOrder === order
                                ? 'bg-[#C8A44E]/10 dark:bg-[#C8A44E]/20 border-[#C8A44E] text-[#C8A44E]'
                                : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sound Settings */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 select-none">
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-white block">
                      Keypad Sound Effects
                    </span>
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 uppercase font-bold mt-0.5 block tracking-wider">
                      Play chimes on key taps
                    </span>
                  </div>
                  <button
                    onClick={() => setTapSoundsEnabled(!tapSoundsEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer outline-none border border-slate-200 dark:border-slate-700 ${
                      tapSoundsEnabled ? 'bg-[#2EC4B6]' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                    aria-label="Toggle tap sounds"
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1/2 -translate-y-1/2 shadow-xs transition-all ${
                        tapSoundsEnabled ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Show Search History Settings */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 select-none">
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-white block">
                      Show Search History
                    </span>
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 uppercase font-bold mt-0.5 block tracking-wider">
                      Display recent spelling searches
                    </span>
                  </div>
                  <button
                    onClick={() => setShowSearchHistory(!showSearchHistory)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer outline-none border border-slate-200 dark:border-slate-700 ${
                      showSearchHistory ? 'bg-[#2EC4B6]' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                    aria-label="Toggle search history display"
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1/2 -translate-y-1/2 shadow-xs transition-all ${
                        showSearchHistory ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Confirm / Close Button */}
              <div className="pt-2">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 dark:bg-slate-200 hover:bg-slate-900 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-extrabold uppercase tracking-widest cursor-pointer transition-colors shadow-xs"
                >
                  Apply Layout
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
        active
          ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function SpellingToIpaTab({
  layoutMode,
  keyboardLayout,
  showSearchHistory,
  playTapSound,
  favorites,
  onToggleFavorite,
}: {
  layoutMode: 'vertical' | 'horizontal';
  keyboardLayout: 'qwerty' | 'alphabetical';
  showSearchHistory: boolean;
  playTapSound: () => void;
  favorites: string[];
  onToggleFavorite: (word: string) => void;
}) {
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
        {/* Left Column: Search & Result Panel */}
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

          {/* Search History */}
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

        {/* Right Column: Keyboard Panel */}
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

function IpaToWordTab({
  layoutMode,
  dialectPreference,
  phonemeLabelMode,
  playTapSound,
  favorites,
  onToggleFavorite,
}: {
  layoutMode: 'vertical' | 'horizontal';
  dialectPreference: 'both' | 'us' | 'uk';
  phonemeLabelMode: 'both' | 'ipa' | 'example';
  playTapSound: () => void;
  favorites: string[];
  onToggleFavorite: (word: string) => void;
}) {
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
        {/* Left Column: Active IPA Sequence & Matches */}
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
                          key={`${w.word}-${w.dialect || 'default'}`}
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

        {/* Right Column: Phoneme Soundboard Keyboard */}
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
