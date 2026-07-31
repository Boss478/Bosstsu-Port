'use client';

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../context';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import SpellingToIpaTab from '../components/SpellingToIpaTab';
import IpaToWordTab from '../components/IpaToWordTab';

type BuilderTab = 'spelling' | 'ipa-to-word';

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

  const playTapSound = useCallback(() => {
    if (!tapSoundsEnabled) return;
    if (typeof window === 'undefined') return;
    const AudioContextClass =
      ((window as unknown as Record<string, unknown>).AudioContext as
        typeof AudioContext | undefined) ||
      ((window as unknown as Record<string, unknown>).webkitAudioContext as
        typeof AudioContext | undefined);
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
            onClick={() => setScreen('slots')}
            className="w-8 h-8 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
            aria-label="Back to Home"
          >
            <i className="fi fi-sr-arrow-left text-sm" aria-hidden="true" />
          </button>
          <h2
            className="text-lg font-extrabold text-slate-800 dark:text-[#F7E1A0]"
            style={{ fontFamily: 'var(--font-mali)' }}
          >
            Word Builder
          </h2>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-8 h-8 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#C8A44E] transition-all cursor-pointer"
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

      {isSettingsOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
            <div className="bg-white/95 dark:bg-slate-900/95 border border-white/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-2xl max-w-md w-full mx-4 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Settings</h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <i className="fi fi-sr-cross text-[10px]" />
                </button>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Layout
                  </span>
                  <select
                    value={layoutMode}
                    onChange={(e) => setLayoutMode(e.target.value as 'vertical' | 'horizontal')}
                    className="text-xs font-bold rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 px-3 py-1.5 outline-none"
                  >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                  </select>
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Zoom</span>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(Number(e.target.value))}
                    className="w-32"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Keyboard Layout
                  </span>
                  <select
                    value={keyboardLayout}
                    onChange={(e) => setKeyboardLayout(e.target.value as 'qwerty' | 'alphabetical')}
                    className="text-xs font-bold rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 px-3 py-1.5 outline-none"
                  >
                    <option value="qwerty">QWERTY</option>
                    <option value="alphabetical">A-Z</option>
                  </select>
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Dialect
                  </span>
                  <select
                    value={dialectPreference}
                    onChange={(e) => setDialectPreference(e.target.value as 'both' | 'us' | 'uk')}
                    className="text-xs font-bold rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 px-3 py-1.5 outline-none"
                  >
                    <option value="both">Both</option>
                    <option value="us">US</option>
                    <option value="uk">UK</option>
                  </select>
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Phoneme Labels
                  </span>
                  <select
                    value={phonemeLabelMode}
                    onChange={(e) =>
                      setPhonemeLabelMode(e.target.value as 'both' | 'ipa' | 'example')
                    }
                    className="text-xs font-bold rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 px-3 py-1.5 outline-none"
                  >
                    <option value="both">Both</option>
                    <option value="ipa">IPA Only</option>
                    <option value="example">Example Only</option>
                  </select>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Tap Sounds
                  </span>
                  <input
                    type="checkbox"
                    checked={tapSoundsEnabled}
                    onChange={(e) => setTapSoundsEnabled(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#C8A44E]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Search History
                  </span>
                  <input
                    type="checkbox"
                    checked={showSearchHistory}
                    onChange={(e) => setShowSearchHistory(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#C8A44E]"
                  />
                </label>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
