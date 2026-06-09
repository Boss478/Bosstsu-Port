'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { HIGH_SCORE_KEY, PROGRESS_KEY, LEVELS } from '../constants';
import { CARD_STORAGE_KEY, loadCollection } from '../cards/cards';

interface Props {
  onStart: () => void;
  onContinue?: () => void;
  hasProgress?: boolean;
  easyMode?: boolean;
  onToggleEasy?: () => void;
  isBeta?: boolean;
  onShowCards?: () => void;
  voiceURI?: string;
  onVoiceChange?: (uri: string) => void;
}

export default function MenuScreen({
  onStart,
  onContinue,
  hasProgress,
  easyMode,
  onToggleEasy,
  isBeta,
  onShowCards,
  voiceURI,
  onVoiceChange,
}: Props) {
  const router = useRouter();
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [highScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(HIGH_SCORE_KEY);
      return stored ? Number(stored) : 0;
    }
    return 0;
  });

  const savedProgress = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as { gameState: { level: number; round: number; winsInLevel: number; easyMode?: boolean }; stageStars: number[] };
    } catch {
      return null;
    }
  })[0];

  const cardCount = useState(() => {
    if (typeof window === 'undefined') return 0;
    return loadCollection().cards.length;
  })[0];

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-3 sm:p-5 md:p-8 shadow-2xl text-center space-y-2 sm:space-y-3 md:space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      <div className="absolute top-6 right-6 flex items-center gap-2">
        {isBeta && (
          <div className="relative">
            <button
              onClick={() => setShowVoicePicker((v) => !v)}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-zinc-500 hover:text-violet-500 transition-all"
              title="Voice Settings"
            >
              <i aria-hidden="true" className="fi fi-sr-volume text-sm"></i>
            </button>
            {showVoicePicker && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border-2 border-zinc-200 dark:border-zinc-700 p-3 z-50 max-h-64 overflow-y-auto">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                  TTS Voice (BETA)
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
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
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
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all hover:scale-105"
            title="Try BETA Features"
          >
            BETA
          </button>
        )}
        <button
          onClick={() => router.push('/games')}
          className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-zinc-500 hover:text-violet-500 transition-colors"
          title="Back to Games"
        >
          <i aria-hidden="true" className="fi fi-sr-home text-lg"></i>
        </button>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-violet-600 dark:text-violet-400 tracking-tight">
          Alphabet Adventure
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-zinc-500 dark:text-zinc-400 font-bold">
          ผจญภัยโลกตัวอักษร
        </p>
      </div>

      <div className="text-5xl sm:text-6xl md:text-7xl py-1 sm:py-2 transition-all hover:scale-125 duration-500 cursor-default">
        <i
          aria-hidden="true"
          className="fi fi-sr-island-tropical text-violet-600 dark:text-violet-400"
        ></i>
      </div>

      <p className="text-sm sm:text-sm md:text-base text-zinc-600 dark:text-zinc-400 max-w-sm sm:max-w-md mx-auto leading-snug">
        Prepare for an exciting journey through the A-Z islands! Learn and challenge yourself with 6
        fun levels designed for Grade 1 students.
      </p>
      <p className="text-xs sm:text-xs md:text-sm text-zinc-500 dark:text-zinc-500 max-w-sm sm:max-w-md mx-auto">
        เตรียมพร้อมสำหรับการเดินทางแสนสนุกผ่านเกาะตัวอักษร A-Z เรียนรู้และท้าทายตัวเองไปพร้อมกัน!
      </p>

      {highScore > 0 && (
        <div className="inline-block bg-violet-100 dark:bg-violet-900/30 px-6 py-3 rounded-2xl border-2 border-violet-200 dark:border-violet-800">
          <p className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">
            Best Score
          </p>
          <p className="text-3xl font-black text-violet-600 dark:text-violet-400">{highScore}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-4">
        {cardCount > 0 && (
          <div className="inline-block bg-amber-50 dark:bg-amber-900/20 px-5 py-2.5 rounded-2xl border-2 border-amber-200 dark:border-amber-800">
            <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              Cards
            </p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{cardCount}/26</p>
          </div>
        )}
        {savedProgress && (
          <div className="inline-block bg-emerald-50 dark:bg-emerald-900/20 px-5 py-2.5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800">
            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Progress
            </p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              Level {savedProgress.gameState.level}
              {(LEVELS[savedProgress.gameState.level]?.type === 'match'
                ? ` · ${savedProgress.gameState.round}/${LEVELS[savedProgress.gameState.level]?.target}`
                : ` · ${savedProgress.gameState.winsInLevel}/${LEVELS[savedProgress.gameState.level]?.target}`) || ''}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={onToggleEasy}
          role="switch"
          aria-checked={easyMode}
          className={`px-5 py-2 rounded-2xl text-sm font-black transition-all border-2 ${
            easyMode
              ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-400 text-emerald-700 dark:text-emerald-400'
              : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'
          }`}
        >
          {easyMode ? (
            <>
              <span aria-hidden="true">🐣</span> Easy Mode (KG)
            </>
          ) : (
            'Easy Mode (KG)'
          )}
        </button>
      </div>

      <div
        className={`${isBeta ? 'flex items-center justify-center gap-3' : 'space-y-2 sm:space-y-3'}`}
      >
        {hasProgress && onContinue && (
          <button
            onClick={onContinue}
            className="group relative px-5 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 text-white text-sm sm:text-base md:text-lg font-black rounded-3xl shadow-[0_8px_0_0_rgba(5,150,105,1)] active:shadow-none active:translate-y-2 transition-all duration-150 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Continue{' '}
              <i
                aria-hidden="true"
                className="fi fi-sr-play transition-transform group-hover:translate-x-1 text-xs sm:text-sm"
              ></i>
            </span>
            <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        )}
        <button
          onClick={onStart}
          className="group relative px-5 sm:px-6 py-2.5 sm:py-3 bg-violet-600 text-white text-sm sm:text-base md:text-lg font-black rounded-3xl shadow-[0_8px_0_0_rgba(109,40,217,1)] active:shadow-none active:translate-y-2 transition-all duration-150 overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            {hasProgress ? 'New Game' : 'Start Game'}{' '}
            <i
              aria-hidden="true"
              className="fi fi-sr-play transition-transform group-hover:translate-x-1 text-xs sm:text-sm"
            ></i>
          </span>
          <div className="absolute inset-0 bg-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>

      {onShowCards && (
        <div className="flex items-center justify-center">
          <button
            onClick={onShowCards}
            className="group relative px-5 sm:px-6 py-2.5 sm:py-3 bg-amber-500 text-white text-sm sm:text-base md:text-lg font-black rounded-3xl shadow-[0_8px_0_0_rgba(217,119,6,1)] active:shadow-none active:translate-y-2 transition-all duration-150 overflow-hidden"
            title="View Card Collection"
          >
            <span className="relative z-10 flex items-center gap-2">
              <i aria-hidden="true" className="fi fi-sr-template text-xs sm:text-sm"></i> Card
              Collection
            </span>
            <div className="absolute inset-0 bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>
      )}

      <div className="flex items-center justify-center">
        <button
          onClick={() => {
            if (
              window.confirm(
                'Reset all game progress? This will clear cards, scores, and settings.\nลบข้อมูลทั้งหมด? การดำเนินการนี้ไม่สามารถยกเลิกได้',
              )
            ) {
              localStorage.removeItem(CARD_STORAGE_KEY);
              localStorage.removeItem(PROGRESS_KEY);
              localStorage.removeItem(HIGH_SCORE_KEY);
              localStorage.removeItem('alphabet-adventure-voice');
              window.location.reload();
            }
          }}
          className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 border border-red-500/20"
        >
          <i aria-hidden="true" className="fi fi-sr-refresh mr-1.5 text-xs"></i>
          RESET PROGRESS
        </button>
      </div>

      <p className="text-sm font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-2">
        Grade 1 • {easyMode ? '5 Levels' : '6 Levels'}
        <span className="relative group cursor-help">
          <i
            aria-hidden="true"
            className="fi fi-sr-info text-[10px] text-zinc-300 dark:text-zinc-600"
          ></i>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 bg-zinc-900 dark:bg-zinc-700 text-white text-[10px] font-bold px-3 py-2 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-normal text-center leading-relaxed">
            Cards drop on correct answers! Longer streaks improve your chances of finding rare
            cards.
          </span>
        </span>
      </p>
    </div>
  );
}
