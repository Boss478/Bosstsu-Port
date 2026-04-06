"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFlashcardContext } from "./FlashcardContext";

export default function FlashcardPlayingScreen() {
  const router = useRouter();
  const {
    endGame,
    mode,
    timeLeft,
    sessionStartTime,
    lives,
    showStreakToast,
    feedback,
    feedbackHint,
    currentWord,
    cardRef,
    swipeOffset,
    isAnimating,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    dragStartXRef,
    setSwipeOffset,
    proceedAfterAnswer,
    handleAnswer,
  } = useFlashcardContext();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!sessionStartTime) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!currentWord) return null;

  return (
    <div className="fixed inset-0 z-50 bg-sky-50 dark:bg-slate-950 py-8 sm:py-12 px-4 flex flex-col items-center overflow-hidden overscroll-none touch-none">
      <div className="w-full max-w-2xl h-full flex flex-col items-center justify-between relative">
        {/* Header HUD */}
        <div className="w-full flex justify-between items-center mb-4 px-4 h-10 shrink-0">
          <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 font-bold">
            <button onClick={endGame} className="text-zinc-400 hover:text-red-500 transition-colors">
              <i className="fi fi-sr-cross-circle text-2xl"></i>
            </button>
            <button onClick={() => router.push('/games')} className="text-zinc-400 hover:text-zinc-500 transition-colors" title="Back to Games">
              <i className="fi fi-sr-home text-2xl"></i>
            </button>
          </div>
          <div className="flex items-center gap-4 font-bold">
            {mode === "TIMER" && (
              <div className={`flex items-center gap-2 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-zinc-800 dark:text-zinc-200'}`}>
                <i className="fi fi-sr-clock"></i> {timeLeft}s
              </div>
            )}
            {mode !== "TIMER" && (
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                <i className="fi fi-sr-stopwatch"></i> {formatTime(elapsedSeconds)}
              </div>
            )}
            {mode === "LIFE" && (
              <div className="flex gap-1 text-red-500">
                {Array.from({ length: 3 }).map((_, i) => (
                  <i key={i} className={`fi ${i < lives ? 'fi-sr-heart' : 'fi-rr-heart text-zinc-300 dark:text-zinc-700'}`}></i>
                ))}
              </div>
            )}
            {mode === "HARDCORE" && (
              <div className="flex gap-1 text-red-500">
                <i className="fi fi-sr-heart"></i>
              </div>
            )}
          </div>
        </div>

        {/* Streak Toast Overlay */}
        {showStreakToast !== null && (
          <div className="absolute top-16 z-50 animate-in slide-in-from-top fade-in duration-300">
            <div className="bg-amber-500 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 border-2 border-amber-400">
              <i className="fi fi-sr-flame animate-pulse"></i> 
              {showStreakToast} IN A ROW!
            </div>
          </div>
        )}

        {/* Flashcard Wrapper (Takes remaining space) */}
        <div className="flex-1 w-full flex items-center justify-center min-h-0 relative z-10 sm:mb-6">
          {feedback && !feedbackHint && (
            <div className="fixed inset-x-0 top-1/2 -translate-y-1/2 z-200 flex justify-center pointer-events-none">
              <div className={`text-3xl sm:text-4xl font-bold font-sans tracking-wide animate-float-up-fade drop-shadow-lg flex items-center gap-2 whitespace-nowrap ${feedback === "CORRECT" ? "text-emerald-500" : "text-rose-500"}`}>
                {feedback === "CORRECT" ? (
                  <>
                    <i className="fi fi-sr-check-circle drop-shadow-sm"></i>
                    <span>Correct</span>
                  </>
                ) : (
                  <>
                    <i className="fi fi-sr-cross-circle drop-shadow-sm"></i>
                    <span>Wrong</span>
                  </>
                )}
              </div>
            </div>
          )}
          <div className="relative w-full max-w-sm aspect-4/3 perspective-1000 select-none group focus:outline-none">

            <div 
              ref={cardRef}
              className="w-full h-full bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center p-8 transition-transform cursor-grab active:cursor-grabbing border-4 border-transparent relative"
              style={{ 
                transform: `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.05}deg)`,
                transition: isAnimating || swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none',
                borderColor: swipeOffset < -50 ? '#10b981' : swipeOffset > 50 ? '#ef4444' : 'transparent',
                opacity: isAnimating ? 0 : 1
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={(e: React.MouseEvent) => {
                if (isAnimating || feedbackHint) return;
                dragStartXRef.current = e.clientX;
              }}
              onMouseMove={(e: React.MouseEvent) => {
                if (isAnimating || dragStartXRef.current === null || feedbackHint) return;
                setSwipeOffset(e.clientX - dragStartXRef.current);
              }}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
              <h2 className={`text-4xl sm:text-5xl font-bold tracking-wide text-zinc-800 dark:text-zinc-100 text-center pointer-events-none ${feedbackHint ? 'opacity-30' : ''}`}>
                {currentWord.word}
              </h2>

              {/* Word metadata */}
              {currentWord && (currentWord.wordClass || currentWord.level) && currentWord.isCorrect && (
                <div className={`flex items-center gap-2 mt-4 pointer-events-none transition-opacity ${feedbackHint ? 'opacity-30' : 'opacity-100'}`}>
                  {currentWord.wordClass && (
                    <span className="px-3 py-1 bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 font-bold text-xs rounded-full uppercase tracking-wider">
                      {currentWord.wordClass}
                    </span>
                  )}
                  {currentWord.level && (
                    <span className="px-3 py-1 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 font-bold text-xs rounded-full uppercase tracking-wider">
                      CEFR {currentWord.level.toUpperCase()}
                    </span>
                  )}
                </div>
              )}
              
              {/* Visual feedback overlays during drag */}
              <div className="absolute top-4 left-4 text-emerald-500 font-bold text-2xl pointer-events-none" style={{ opacity: swipeOffset < -50 ? (-swipeOffset - 50)/100 : 0 }}>
                CORRECT
              </div>
              <div className="absolute top-4 right-4 text-rose-500 font-bold text-2xl pointer-events-none" style={{ opacity: swipeOffset > 50 ? (swipeOffset - 50)/100 : 0 }}>
                WRONG
              </div>

              {/* Hint Modal Overlay (Practice mode only) */}
              {feedbackHint && (
                <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/95 rounded-2xl flex flex-col items-center justify-center p-6 animate-in fade-in">
                  <i className="fi fi-sr-cross-circle text-5xl text-rose-500 mb-4 drop-shadow-sm"></i>
                  <p className="text-zinc-500 dark:text-zinc-400 font-bold mb-2">Incorrect. The answer is:</p>
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-lg">
                      {feedbackHint.replace('The answer was: ', '')}
                    </p>
                    {currentWord && currentWord.definition && currentWord.isCorrect && (
                       <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 px-4 text-center max-w-sm">
                          <span className="font-bold text-sky-500">Def: </span>{currentWord.definition}
                       </p>
                    )}
                  </div>
                  <button 
                    onClick={(e: React.MouseEvent) => {
                       e.stopPropagation();
                       // Actually process the wrong answer now
                       if (currentWord) {
                         proceedAfterAnswer(false, !currentWord.isCorrect);
                       }
                    }}
                    className="mt-6 bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-xl font-bold transition-colors pointer-events-auto"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="w-full shrink-0 flex flex-col items-center">
          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            <button 
              onClick={() => handleAnswer(true)}
              disabled={isAnimating || feedbackHint !== null}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all card-hover font-bold border-2 border-emerald-500 disabled:opacity-50"
            >
              <i className="fi fi-sr-arrow-left text-2xl"></i>
              <span>Correct Spelling</span>
            </button>
            
            <button 
              onClick={() => handleAnswer(false)}
              disabled={isAnimating || feedbackHint !== null}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all card-hover font-bold border-2 border-rose-500 disabled:opacity-50"
            >
              <i className="fi fi-sr-arrow-right text-2xl"></i>
              <span>Incorrect Spelling</span>
            </button>
          </div>
          <div className="text-zinc-400 mt-4 text-sm flex gap-6">
            <span className="flex items-center"><kbd className="mr-2 hidden sm:inline-block">←</kbd> Correct</span>
            <span className="flex items-center"><kbd className="mr-2 hidden sm:inline-block">→</kbd> Incorrect</span>
          </div>
        </div>
      </div>
    </div>
  );
}
