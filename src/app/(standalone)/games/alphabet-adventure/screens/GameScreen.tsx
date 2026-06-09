'use client';

import { useEffect, useCallback, useRef } from 'react';
import type { GameState, RoundData, FeedbackState, LevelType, DataPool } from '../types';
import { LEVELS } from '../constants';
import MatchLevel from './MatchLevel';
import FillLevel from './FillLevel';
import TypingLevel from './TypingLevel';

interface Props {
  gameState: GameState;
  roundData: RoundData;
  feedback: FeedbackState;
  isTransitioning: boolean;
  isFullscreen: boolean;
  muted: boolean;
  onAnswer: (selected: string) => void;
  onCheckTyping: () => void;
  onBack: () => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  onShowCards?: () => void;
  onSelectCell?: (index: number) => void;
  onTypingInput?: (index: number, value: string) => void;
  onSpeak: (text: string, lang?: string) => void;
  dropPower?: number;
  effectiveStreak?: number;
}

export default function GameScreen({
  gameState,
  roundData,
  feedback,
  isTransitioning,
  isFullscreen,
  muted,
  onAnswer,
  onCheckTyping,
  onBack,
  onToggleFullscreen,
  onToggleMute,
  onSelectCell,
  onTypingInput,
  onSpeak,
  onShowCards,
  dropPower,
  effectiveStreak,
}: Props) {
  const choiceRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const didAutoSpeak = useRef(false);
  const isFeedbackVisible = feedback.text !== '';
  const levelConfig = LEVELS[gameState.level];
  const levelType = levelConfig?.type as LevelType;
  const dataPool = levelConfig?.dataPool as DataPool | undefined;
  const isThaiText = (dataPool === 'thai' || dataPool === 'phonics') && !roundData.revert;

  useEffect(() => {
    if (roundData.revert && roundData.targetLetter && !didAutoSpeak.current) {
      didAutoSpeak.current = true;
      const t = setTimeout(() => onSpeak(roundData.targetLetter!, 'th-TH'), 400);
      return () => clearTimeout(t);
    }
    if (!roundData.revert) didAutoSpeak.current = false;
  }, [roundData.targetLetter, roundData.revert, onSpeak]);

  const effectiveTarget = levelType === 'match' && gameState.easyMode ? 15 : levelConfig.target;
  const progress = levelType === 'match' ? gameState.levelCorrect : gameState.winsInLevel;
  const progressPct = Math.min(100, (progress / effectiveTarget) * 100);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isTransitioning || isFeedbackVisible) return;

      if (levelType === 'typing') {
        if (e.key === 'Enter') {
          e.preventDefault();
          onCheckTyping();
        }
      } else {
        const num = parseInt(e.key);
        const maxChoices = roundData.choices.length;
        if (num >= 1 && num <= maxChoices && roundData.choices[num - 1]) {
          e.preventDefault();
          onAnswer(roundData.choices[num - 1]);
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      }
    },
    [isTransitioning, isFeedbackVisible, levelType, roundData.choices, onAnswer, onCheckTyping, onBack],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (roundData.choices.length > 0) {
      const firstBtn = choiceRefs.current[0];
      if (firstBtn && !isTransitioning) {
        firstBtn.focus();
      }
    }
  }, [roundData, isTransitioning, levelType]);

  const renderChoiceButtons = (show: boolean) => {
    if (!show || roundData.choices.length === 0) return null;
    return (
      <div className="flex flex-wrap justify-center gap-4 pt-8">
        {roundData.choices.map((choice, i) => (
          <button
            ref={(el) => {
              choiceRefs.current[i] = el;
            }}
            key={i}
            onClick={() => !isTransitioning && !isFeedbackVisible && onAnswer(choice)}
            disabled={isTransitioning || isFeedbackVisible || roundData.wrongChoices?.includes(choice)}
            className={[
              'rounded-2xl font-black transition-all border-2 disabled:cursor-not-allowed w-16 h-16 md:w-20 md:h-20 active:shadow-none active:translate-y-1.5',
              roundData.wrongChoices?.includes(choice)
                ? 'bg-rose-500 text-white border-rose-500 shadow-[0_6px_0_0_#be123c] dark:shadow-[0_6px_0_0_#be123c] disabled:opacity-100'
                : 'bg-white dark:bg-zinc-800 text-3xl text-zinc-700 dark:text-zinc-200 shadow-[0_6px_0_0_#e4e4e7] dark:shadow-[0_6px_0_0_#27272a] hover:bg-violet-50 dark:hover:bg-violet-900/20 border-zinc-100 dark:border-zinc-800 disabled:opacity-50',
            ].join(' ')}
          >
            {choice}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border-2 border-zinc-100 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-zinc-500 hover:text-violet-500 transition-colors"
            >
              <i aria-hidden="true" className="fi fi-sr-angle-left text-xs"></i>
              <span className="text-xs font-black uppercase tracking-widest">Menu</span>
            </button>
            <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 text-xl font-black">
              {gameState.level}
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                LEVEL
              </p>
              <p className="text-lg font-black text-zinc-800 dark:text-zinc-100">
                {levelConfig?.name || ''}
              </p>
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                {levelConfig?.subtitle || ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {gameState.currentStreak >= 2 && (
              <div className="text-right">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  STREAK
                </p>
                <p className="text-2xl font-black text-amber-500 tracking-tighter whitespace-nowrap">
                  🔥 {gameState.currentStreak}
                </p>
              </div>
            )}
            <div className="text-right" aria-live="polite" aria-atomic="true">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                SCORE
              </p>
              <p className="text-3xl font-black text-fuchsia-500 tracking-tighter">
                {gameState.score}
              </p>
            </div>
            {onShowCards && (
              <button
                onClick={onShowCards}
                className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:scale-110 transition-all"
                title="Card Collection"
              >
                <i
                  aria-hidden="true"
                  className="fi fi-sr-template text-violet-600 dark:text-violet-400 text-lg"
                ></i>
              </button>
            )}
            <button
              onClick={onToggleMute}
              className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30 hover:scale-110 transition-all"
              title={muted ? 'Unmute' : 'Mute'}
            >
              <i
                className={`fi ${muted ? 'fi-sr-cross-circle' : 'fi-sr-volume'} text-fuchsia-600 dark:text-fuchsia-400 text-lg`}
              ></i>
            </button>
            <button
              onClick={onToggleFullscreen}
              className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:scale-110 transition-all"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              <i
                className={`fi ${isFullscreen ? 'fi-sr-exit' : 'fi-sr-expand'} text-violet-600 dark:text-violet-400 text-lg`}
              ></i>
            </button>
          </div>
        </div>

        <div className="space-y-2" aria-live="polite" aria-atomic="true">
          <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-1 shadow-inner">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500 ease-out relative shadow-sm"
              style={{ width: `${progressPct}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between text-[11px] font-black text-zinc-500 uppercase tracking-wider">
            <span>PROGRESS</span>
            <span>
              {Math.min(progress, effectiveTarget)} / {effectiveTarget}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/5 rounded-full -ml-16 -mb-16 blur-3xl"></div>

        {levelType === 'match' && (
          <MatchLevel
            roundData={roundData}
            isTransitioning={isTransitioning}
            isFeedbackVisible={isFeedbackVisible}
            onAnswer={onAnswer}
            onSpeak={onSpeak}
            isThaiText={isThaiText}
            choiceRefs={choiceRefs}
          />
        )}

        {(levelType === 'fill-upper' || levelType === 'fill-lower') && (
          <FillLevel
            roundData={roundData}
            isTransitioning={isTransitioning}
            isFeedbackVisible={isFeedbackVisible}
            onAnswer={onAnswer}
            onSelectCell={onSelectCell}
            dropPower={dropPower}
            effectiveStreak={effectiveStreak}
            choiceButtons={renderChoiceButtons(roundData.activeIndex >= 0)}
          />
        )}

        {levelType === 'typing' && (
          <TypingLevel
            roundData={roundData}
            isTransitioning={isTransitioning}
            isFeedbackVisible={isFeedbackVisible}
            onCheckTyping={onCheckTyping}
            onTypingInput={onTypingInput}
          />
        )}

        <p className="text-xs text-zinc-500 dark:text-zinc-500 font-bold mt-8 tracking-wider uppercase">
          {levelType === 'typing'
            ? 'Press Enter to check • Esc = Menu'
            : `Press 1-${roundData.choices.length || 3} to answer • Esc = Menu`}
        </p>
      </div>

      {feedback.text && (
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-in zoom-in slide-in-from-bottom-2 duration-300 pointer-events-none"
          role="alert"
        >
          <div
            className={`bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md px-10 py-6 rounded-[2rem] shadow-2xl border-4 transform -rotate-3 ${
              feedback.type === 'correct' ? 'border-emerald-500' : 'border-rose-500'
            }`}
          >
            <p
              className={`text-4xl md:text-6xl font-black ${
                feedback.type === 'correct' ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {feedback.text}
            </p>
            {feedback.showCorrect && (
              <p className="text-xl font-bold mt-2 text-zinc-600 dark:text-zinc-400">
                Correct: {feedback.showCorrect}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
