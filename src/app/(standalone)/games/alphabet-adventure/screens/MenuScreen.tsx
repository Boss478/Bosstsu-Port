'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { HIGH_SCORE_KEY, MAP_SAVE_KEY } from '../constants';
import { CARD_STORAGE_KEY, loadCollection, TOTAL_CARD_SLOTS } from '../cards/cards';
import { safeGetString, safeSetString, safeRemove } from '@/lib/storage';
import CaptainAlph from '../characters/CaptainAlph';
import ChunkyButton from './ChunkyButton';

interface Props {
  onStart: () => void;
  hasProgress?: boolean;
  isBeta?: boolean;
  onShowCards?: () => void;
  onShowAllCards?: () => void;
  onShowAnalysis?: () => void;
  onShowExplorer?: () => void;
  onShowAchievements?: () => void;
  onLogoTap?: () => void;
  voiceURI?: string;
  onVoiceChange?: (uri: string) => void;
}

/* ── Sparkle decorations ─────────────────────────────────────────────────── */
function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0l3.09 8.26L24 9.27l-6.91 5.52L19.18 24 12 18.9 4.82 24l2-9.21L0 9.27l8.91-1.01z" />
    </svg>
  );
}

export default function MenuScreen({
  onStart,
  hasProgress,
  isBeta,
  onShowCards,
  onShowAllCards,
  onShowAnalysis,
  onShowExplorer,
  onShowAchievements,
  onLogoTap,
  voiceURI,
  onVoiceChange,
}: Props) {
  const router = useRouter();
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [highScore] = useState<number>(() => {
    const stored = safeGetString(HIGH_SCORE_KEY);
    return stored ? Number(stored) : 0;
  });

  const cardCount = useState(() => {
    if (typeof window === 'undefined') return 0;
    return loadCollection().cards.length;
  })[0];

  const [easyMode, setEasyMode] = useState(() => {
    return safeGetString('alphabet-adventure-easyMode') === 'true';
  });

  const toggleEasyMode = () => {
    const next = !easyMode;
    setEasyMode(next);
    safeSetString('alphabet-adventure-easyMode', String(next));
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  return (
    <div className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] p-4 sm:p-5 md:p-6 shadow-2xl text-center space-y-3 animate-in fade-in slide-in-from-bottom-8 duration-700 overflow-hidden">
      {/* ── Sparkle decorations ───────────────────────────────────────────── */}
      <Sparkle className="absolute top-4 left-6 w-5 h-5 text-yellow-400 animate-sparkle" />
      <Sparkle className="absolute top-12 right-10 w-4 h-4 text-pink-400 animate-sparkle [animation-delay:0.5s]" />
      <Sparkle className="absolute bottom-16 left-10 w-3 h-3 text-cyan-400 animate-sparkle [animation-delay:1s]" />
      <Sparkle className="absolute bottom-8 right-6 w-5 h-5 text-emerald-400 animate-sparkle [animation-delay:1.5s]" />
      <Sparkle className="absolute top-1/2 left-3 w-3 h-3 text-violet-400 animate-sparkle [animation-delay:0.7s]" />

      {/* ── Title ──────────────────────────────────────────────────────── */}
      <div className="space-y-1 pt-2">
        <h1
          onClick={onLogoTap}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-violet-600 dark:text-violet-400 select-none"
        >
          Alphabet Adventure
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-violet-700/70 dark:text-violet-400/70 font-bold leading-relaxed">
          ผจญภัยโลกตัวอักษร
        </p>
      </div>

      {/* ── Controls row (BETA / Voice / Home) ─────────────────────────── */}
      <div className="flex items-center justify-center gap-2 z-10">
        {onShowExplorer && (
          <button
            onClick={onShowExplorer}
            className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-violet-500 hover:text-violet-600 shadow-md transition-all hover:scale-110"
            title="Letter Sounds"
          >
            <span className="text-base">🔤</span>
          </button>
        )}
        {onShowAchievements && (
          <button
            onClick={onShowAchievements}
            className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-violet-500 hover:text-violet-600 shadow-md transition-all hover:scale-110"
            title="Achievements"
          >
            <span className="text-base">🏆</span>
          </button>
        )}
        {isBeta && (
          <div className="relative">
            <button
              onClick={() => setShowVoicePicker((v) => !v)}
              className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-violet-500 hover:text-violet-600 shadow-md transition-all hover:scale-110"
              title="Voice Settings"
            >
              <span>🔊</span>
            </button>
            {showVoicePicker && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border-2 border-violet-200 dark:border-violet-700 p-3 z-50 max-h-64 overflow-y-auto">
                <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-2">
                  🔊 TTS Voice (BETA)
                </p>
                {voices.filter((v) => v.lang.startsWith('en') || v.lang.startsWith('th')).length ===
                  0 && <p className="text-xs text-zinc-500">No English or Thai voices available</p>}
                {voices
                  .filter((v) => v.lang.startsWith('en') || v.lang.startsWith('th'))
                  .map((v) => (
                    <button
                      key={v.voiceURI}
                      onClick={() => onVoiceChange?.(v.voiceURI)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                        voiceURI === v.voiceURI
                          ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-violet-50 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <span>{v.name}</span>
                      <span className="text-[10px] text-zinc-400 ml-2">({v.lang})</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
        {!isBeta && (
          <button
            onClick={() => {
              if (
                window.confirm(
                  'Open BETA test area with card collection and experimental features? Progress carries over.\nเปิดพื้นที่ทดสอบ BETA? ความคืบหน้าจะถูกบันทึก',
                )
              ) {
                router.push('/games/alphabet-adventure/beta');
              }
            }}
            className="px-3 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all hover:scale-110"
            title="Try BETA Features"
          >
            ✨ BETA
          </button>
        )}
        <button
          onClick={() => router.push('/games')}
          className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-violet-500 hover:text-violet-600 shadow-md transition-all hover:scale-110"
          title="Back to Games"
        >
          <span className="text-base">🏠</span>
        </button>
      </div>

      {/* ── Mascot + island icon ───────────────────────────────────────── */}
      <div className="flex items-center justify-center py-1 sm:py-2">
        <div className="animate-kid-float">
          <CaptainAlph size={80} />
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {highScore > 0 && (
          <div className="animate-kid-wiggle inline-flex flex-col items-center bg-white/80 dark:bg-zinc-800/80 px-4 py-2.5 rounded-2xl border-3 border-yellow-300 dark:border-yellow-600 shadow-lg [animation-delay:0s]">
            <span className="text-lg" aria-hidden="true">
              🏆
            </span>
            <p className="text-[9px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-widest">
              Best Score
            </p>
            <p className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{highScore}</p>
          </div>
        )}
        {cardCount > 0 && (
          <div className="animate-kid-wiggle inline-flex flex-col items-center bg-white/80 dark:bg-zinc-800/80 px-4 py-2.5 rounded-2xl border-3 border-pink-300 dark:border-pink-600 shadow-lg [animation-delay:0.3s]">
            <span className="text-lg" aria-hidden="true">
              🃏
            </span>
            <p className="text-[9px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest">
              Cards
            </p>
            <p className="text-2xl font-black text-pink-600 dark:text-pink-400">
              {cardCount}/{TOTAL_CARD_SLOTS}
            </p>
          </div>
        )}
        {hasProgress && (
          <div className="animate-kid-wiggle inline-flex flex-col items-center bg-white/80 dark:bg-zinc-800/80 px-4 py-2.5 rounded-2xl border-3 border-emerald-300 dark:border-emerald-600 shadow-lg [animation-delay:0.6s]">
            <span className="text-lg" aria-hidden="true">
              🗺️
            </span>
            <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Progress
            </p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">Map Active</p>
          </div>
        )}
      </div>

      {/* ── Start Game button (big, bouncy, kid-friendly) ──────────── */}
      <div className="flex items-center justify-center pt-1">
        <ChunkyButton
          onClick={onStart}
          variant="emerald"
          className="animate-kid-bounce-cta group relative px-8 sm:px-10 py-3.5 sm:py-4 text-lg sm:text-xl md:text-2xl rounded-full duration-150 overflow-hidden hover:brightness-110"
        >
          <span className="relative z-10 flex items-center gap-2">
            🚀 Let&apos;s Play!{' '}
            <span
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1 text-sm sm:text-base"
            >
              ▶
            </span>
          </span>
          <div className="absolute inset-0 bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </ChunkyButton>
      </div>

      {/* ── Practice mode toggle ───────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          onClick={toggleEasyMode}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none border-2 ${
            easyMode
              ? 'bg-emerald-400 border-emerald-500'
              : 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600'
          }`}
          role="switch"
          aria-checked={easyMode}
          aria-label="Practice Mode"
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform ${
              easyMode ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span className="text-xs sm:text-sm font-black text-violet-700/70 dark:text-violet-300/80">
          🐣 Practice Mode
          <span className="ml-1.5 text-[10px] text-violet-500/50 dark:text-violet-400/50 font-bold">
            (fewer choices)
          </span>
        </span>
      </div>

      {/* ── Cards + Analysis buttons ──────────────────────────────── */}
      {(onShowCards || onShowAnalysis) && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {onShowCards && (
            <button
              onClick={onShowCards}
              className="group relative px-3 py-3 sm:py-3.5 bg-amber-500 hover:bg-amber-400 text-white text-xs sm:text-sm font-black rounded-full shadow-[0_6px_0_0_rgba(194,65,12,1)] active:shadow-none active:translate-y-1.5 transition-all duration-150 overflow-hidden hover:brightness-110"
              title="View Card Collection"
            >
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                🃏 My Cards
              </span>
              <div className="absolute inset-0 bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          )}
          {onShowAnalysis && (
            <button
              onClick={onShowAnalysis}
              className="group relative px-3 py-3 sm:py-3.5 bg-violet-500 hover:bg-violet-400 text-white text-xs sm:text-sm font-black rounded-full shadow-[0_6px_0_0_rgba(109,40,217,1)] active:shadow-none active:translate-y-1.5 transition-all duration-150 overflow-hidden hover:brightness-110"
              title="View Progress Analysis"
            >
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                📊 Analysis
              </span>
              <div className="absolute inset-0 bg-violet-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          )}
        </div>
      )}

      {onShowAllCards && (
        <button
          onClick={onShowAllCards}
          className="group relative w-full px-3 py-3 sm:py-3.5 bg-orange-500 hover:bg-orange-400 text-white text-xs sm:text-sm font-black rounded-full shadow-[0_6px_0_0_rgba(194,65,12,1)] active:shadow-none active:translate-y-1.5 transition-all duration-150 overflow-hidden hover:brightness-110"
          title="Show All Cards"
        >
          <span className="relative z-10 flex items-center justify-center gap-1.5">
            ✨ SHOW ALL CARDS
          </span>
          <div className="absolute inset-0 bg-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      )}

      {/* ── Instructions + Reset ───────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => {
            if (
              window.confirm(
                'Reset all game progress? This will clear cards, scores, and settings.\nลบข้อมูลทั้งหมด? การดำเนินการนี้ไม่สามารถยกเลิกได้',
              )
            ) {
              safeRemove(CARD_STORAGE_KEY);
              safeRemove(MAP_SAVE_KEY);
              safeRemove(HIGH_SCORE_KEY);
              safeRemove('alphabet-adventure-voice');
              safeRemove('alphabet-adventure-checkpoint');
              window.location.reload();
            }
          }}
          className="px-3 py-1.5 rounded-full bg-red-400/20 hover:bg-red-400/40 text-red-600 dark:text-red-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 border border-red-300/50 dark:border-red-700/50 shadow-sm"
        >
          🔄 Start Over
        </button>
      </div>

      {/* ── Footer info ────────────────────────────────────────────── */}
      <p className="text-xs sm:text-sm font-black text-violet-700/50 dark:text-violet-300/50 uppercase tracking-widest flex items-center justify-center gap-2">
        ⭐ 6 Stages • 5 Levels Each ⭐
        <span className="relative group cursor-help">
          <span className="text-[10px] text-violet-400/60">ℹ️</span>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 bg-violet-900 text-white text-[10px] font-bold px-3 py-2 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-normal text-center leading-relaxed">
            Cards drop on correct answers! Longer streaks improve your chances of finding rare
            cards.
          </span>
        </span>
      </p>
    </div>
  );
}
