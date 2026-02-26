"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { VocabularyData, VocabularyWord } from "./page";

type Language = "THAI" | "ENGLISH" | null;
type GameMode = "PRACTICE" | "ENDLESS" | "TEST" | "TIMER" | "HARDCORE" | null;
type GameState = "MENU" | "PLAYING" | "RESULT";

interface FlashcardClientProps {
  vocabData: VocabularyData;
}

export default function FlashcardClient({ vocabData }: FlashcardClientProps) {
  // Config state
  const [language, setLanguage] = useState<Language>(null);
  const [mode, setMode] = useState<GameMode>(null);
  const [timeLimit, setTimeLimit] = useState<number>(60);
  const [gameState, setGameState] = useState<GameState>("MENU");

  // Game state
  const [activeVocab, setActiveVocab] = useState<VocabularyWord[]>([]);
  const [currentWord, setCurrentWord] = useState<VocabularyWord | null>(null);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  // Analytics State
  const [wordStats, setWordStats] = useState<Record<string, { appearances: number; correct: number; wrong: number }>>({});
  
  // Test Mode State
  const [testPool, setTestPool] = useState<VocabularyWord[]>([]);
  const [testIndex, setTestIndex] = useState<number>(0);

  // Swipe Animation State
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);

  // Feedback State
  const [feedback, setFeedback] = useState<"CORRECT" | "WRONG" | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "PLAYING" || isAnimating) return;
      if (e.key === "ArrowLeft") handleAnswer(true);
      if (e.key === "ArrowRight") handleAnswer(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, isAnimating, currentWord]);

  // Timer logic
  useEffect(() => {
    if (gameState === "PLAYING" && mode === "TIMER" && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (gameState === "PLAYING" && mode === "TIMER" && timeLeft <= 0) {
      endGame();
    }
  }, [gameState, mode, timeLeft]);

  const startGame = (selectedMode: GameMode, selectedTime?: number) => {
    const vocab = language === "THAI" ? vocabData.thai : vocabData.english;
    if (!vocab || vocab.length === 0) {
      alert("No vocabulary words available!");
      return;
    }

    setActiveVocab(vocab);
    setMode(selectedMode);
    setGameState("PLAYING");
    setScore(0);
    setLives(3);
    setWordStats({});
    setSwipeOffset(0);
    setIsAnimating(false);
    setFeedback(null);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);

    if (selectedMode === "TIMER") {
      setTimeLeft(selectedTime || 60);
    } else if (selectedMode === "TEST") {
      // Shuffle array for test
      const shuffled = [...vocab].sort(() => Math.random() - 0.5);
      setTestPool(shuffled);
      setTestIndex(0);
      setCurrentWord(shuffled[0]);
      return; // Skip pickNextWord
    }

    pickNextWord(vocab, {});
  };

  const pickNextWord = (
    vocab: VocabularyWord[],
    currentStats: Record<string, { appearances: number; correct: number; wrong: number }>
  ) => {
    if (mode === "PRACTICE") {
      // Check win condition: all words >= 3 appearances and > 60% accuracy overall
      const allAppeared = vocab.every((w) => (currentStats[w.word]?.appearances || 0) >= 3);
      let totalCorrect = 0;
      let totalApps = 0;
      Object.values(currentStats).forEach(s => {
        totalCorrect += s.correct;
        totalApps += s.appearances;
      });
      const accuracy = totalApps > 0 ? totalCorrect / totalApps : 0;

      if (allAppeared && accuracy >= 0.6) {
        endGame();
        return;
      }

      // Spaced repetition heuristic: favor words with fewer appearances or lower accuracy
      const weightedWords = vocab.map(w => {
        const stat = currentStats[w.word] || { appearances: 0, correct: 0, wrong: 0 };
        const acc = stat.appearances > 0 ? stat.correct / stat.appearances : 0.5;
        // Weight goes up if appearances are low, or accuracy is low
        const weight = (10 / (stat.appearances + 1)) + ((1 - acc) * 5);
        return { word: w, weight };
      });

      const totalWeight = weightedWords.reduce((sum, w) => sum + w.weight, 0);
      let rand = Math.random() * totalWeight;
      for (const w of weightedWords) {
        if (rand < w.weight) {
          setCurrentWord(w.word);
          return;
        }
        rand -= w.weight;
      }
    }

    // Default random for ENDLESS, TIMER, HARDCORE
    const randomIndex = Math.floor(Math.random() * vocab.length);
    setCurrentWord(vocab[randomIndex]);
  };

  const handleAnswer = (userGuessedCorrect: boolean) => {
    if (!currentWord || isAnimating) return;

    const isActuallyCorrect = currentWord.isCorrect === userGuessedCorrect;

    if (mode !== "TEST") {
      setFeedback(isActuallyCorrect ? "CORRECT" : "WRONG");
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 800);
    }

    // Animate swipeout
    setIsAnimating(true);
    setSwipeOffset(userGuessedCorrect ? -500 : 500);

    setTimeout(() => {
      setWordStats(prev => {
        const stats = prev[currentWord.word] || { appearances: 0, correct: 0, wrong: 0 };
        const newStats = {
          ...prev,
          [currentWord.word]: {
            appearances: stats.appearances + 1,
            correct: stats.correct + (isActuallyCorrect ? 1 : 0),
            wrong: stats.wrong + (isActuallyCorrect ? 0 : 1),
          }
        };

        // Determine next steps based on mode
        let ending = false;
        if (mode === "TEST") {
          if (isActuallyCorrect) setScore(s => s + 1);
          const nextIdx = testIndex + 1;
          if (nextIdx >= testPool.length) {
            ending = true;
          } else {
            setTestIndex(nextIdx);
            setCurrentWord(testPool[nextIdx]);
          }
        } else {
          if (isActuallyCorrect) {
            setScore(s => s + 1);
          } else if (mode === "HARDCORE") {
            const nextLives = lives - 1;
            setLives(nextLives);
            if (nextLives <= 0) ending = true;
          }
          if (!ending) {
            pickNextWord(activeVocab, newStats);
          }
        }

        if (ending) {
          setTimeout(() => setGameState("RESULT"), 100);
        } else {
          // Reset animation state for next word
          setSwipeOffset(0);
          setIsAnimating(false);
        }

        return newStats;
      });
    }, 300); // 300ms animation duration
  };

  const endGame = () => {
    setGameState("RESULT");
  };

  const goHome = () => {
    setGameState("MENU");
    setLanguage(null);
    setMode(null);
    setFeedback(null);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
  };

  // Touch Handlers for Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    dragStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isAnimating || dragStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - dragStartX.current;
    setSwipeOffset(diffX);
  };

  const handleTouchEnd = () => {
    if (isAnimating || dragStartX.current === null) return;
    dragStartX.current = null;
    
    if (swipeOffset < -100) {
      handleAnswer(true); // Swiped left -> Guessed Correct spelling
    } else if (swipeOffset > 100) {
      handleAnswer(false); // Swiped right -> Guessed Incorrect spelling
    } else {
      setSwipeOffset(0); // Snap back
    }
  };

  if (gameState === "MENU") {
    if (!language) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-sky-100/50 dark:shadow-black/40 text-center space-y-8 animate-float">
          <div className="mb-6">
            <i className="fi fi-sr-graduation-cap text-6xl text-sky-500 mb-4 inline-block"></i>
            <h1 className="text-4xl font-bold text-sky-600 dark:text-sky-400 mb-2">
              Is it spelled correctly?
            </h1>
            <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-4">
              เขียนถูกหรือผิด?
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
              Test your spelling skills. Select a language to begin. <br />
              ฝึกทักษะการสะกดคำ เลือกภาษาเพื่อเริ่มต้น
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <button
              onClick={() => setLanguage("THAI")}
              className="card-hover bg-sky-500 hover:bg-sky-600 text-white rounded-2xl p-6 font-bold text-xl flex flex-col items-center gap-2 transition-colors"
            >
              <i className="fi fi-sr-flag text-3xl"></i>
              <span>ภาษาไทย</span>
            </button>
            <button
              onClick={() => setLanguage("ENGLISH")}
              className="card-hover bg-amber-500 hover:bg-amber-800 text-white rounded-2xl p-6 font-bold text-xl flex flex-col items-center gap-2 transition-colors"
            >
              <i className="fi fi-sr-world text-3xl"></i>
              <span>English (US)</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-sky-100/50 dark:shadow-black/40 text-center animate-float relative">
        <button onClick={() => setLanguage(null)} className="absolute top-6 left-6 text-zinc-400 hover:text-sky-500 transition-colors">
          <i className="fi fi-sr-arrow-left text-2xl"></i>
        </button>
        <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-8">Select Game Mode</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button onClick={() => startGame("PRACTICE")} className="card-hover bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 text-left border-2 border-transparent hover:border-sky-400 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <i className="fi fi-sr-book-alt text-2xl text-sky-500"></i>
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Practice</h3>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Master all words. Analyzes your weaknesses.</p>
          </button>
          
          <button onClick={() => startGame("ENDLESS")} className="card-hover bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 text-left border-2 border-transparent hover:border-blue-400 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <i className="fi fi-sr-infinity text-2xl text-blue-500"></i>
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Endless</h3>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Play continuously without stopping.</p>
          </button>
          
          <button onClick={() => startGame("TEST")} className="card-hover bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 text-left border-2 border-transparent hover:border-emerald-400 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <i className="fi fi-sr-clipboard-list-check text-2xl text-emerald-500"></i>
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Test</h3>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">1 pass through all words. Count your score.</p>
          </button>

          <button onClick={() => startGame("HARDCORE")} className="card-hover bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 text-left border-2 border-transparent hover:border-rose-400 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <i className="fi fi-sr-flame text-2xl text-rose-500"></i>
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Hardcore</h3>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">3 Lives. 1 mistake costs a life.</p>
          </button>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 text-left border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <i className="fi fi-sr-stopwatch text-2xl text-amber-500"></i>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Timer Mode</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {[30, 60, 90, 120, 150, 180].map(t => (
              <button 
                key={t}
                onClick={() => startGame("TIMER", t)} 
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-amber-500 hover:text-white rounded-lg transition-colors font-bold"
              >
                {t}s
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "PLAYING" && currentWord) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center">
        {/* Header HUD */}
        <div className="w-full flex justify-between items-center mb-8 px-4">
          <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 font-bold">
            <button onClick={endGame} className="text-zinc-400 hover:text-red-500 transition-colors">
              <i className="fi fi-sr-cross-circle text-2xl"></i>
            </button>
            <div className="flex items-center gap-2">
              <i className="fi fi-sr-star text-amber-500"></i> {score}
            </div>
            {mode === "TEST" && (
              <div className="text-sm font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-4 py-1.5 rounded-full shadow-sm">
                {testIndex + 1} / {testPool.length}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 font-bold">
            {mode === "TIMER" && (
              <div className={`flex items-center gap-2 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-zinc-800 dark:text-zinc-200'}`}>
                <i className="fi fi-sr-clock"></i> {timeLeft}s
              </div>
            )}
            {mode === "HARDCORE" && (
              <div className="flex gap-1 text-red-500">
                {Array.from({ length: 3 }).map((_, i) => (
                  <i key={i} className={`fi ${i < lives ? 'fi-sr-heart' : 'fi-rr-heart text-zinc-300 dark:text-zinc-700'}`}></i>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Flashcard */}
        <div className="relative w-full max-w-sm aspect-4/3 perspective-1000 mb-12 select-none touch-none group">
          {feedback && (
            <div className={`absolute top-0 left-1/2 z-50 text-xl sm:text-2xl font-normal pointer-events-none animate-float-up-fade drop-shadow-lg ${feedback === "CORRECT" ? "text-emerald-500" : "text-rose-500"}`}>
              {feedback === "CORRECT" ? (
                <span className="flex items-center gap-3"><i className="fi fi-sr-check-circle drop-shadow-sm"></i></span>
              ) : (
                <span className="flex items-center gap-3"><i className="fi fi-sr-cross-circle drop-shadow-sm"></i></span>
              )}
            </div>
          )}

          <div 
            ref={cardRef}
            className="w-full h-full bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center justify-center p-8 transition-transform cursor-grab active:cursor-grabbing border-4 border-transparent"
            style={{ 
              transform: `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.05}deg)`,
              transition: isAnimating || swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none',
              borderColor: swipeOffset < -50 ? '#10b981' : swipeOffset > 50 ? '#ef4444' : 'transparent',
              opacity: isAnimating ? 0 : 1
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={(e) => {
              if (isAnimating) return;
              dragStartX.current = e.clientX;
            }}
            onMouseMove={(e) => {
              if (isAnimating || dragStartX.current === null) return;
              setSwipeOffset(e.clientX - dragStartX.current);
            }}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            <h2 className="text-4xl sm:text-5xl font-bold tracking-wide text-zinc-800 dark:text-zinc-100 text-center pointer-events-none">
              {currentWord.word}
            </h2>
            
            {/* Visual feedback overlays */}
            <div className="absolute top-4 left-4 text-emerald-500 font-bold text-2xl pointer-events-none" style={{ opacity: swipeOffset < -50 ? (-swipeOffset - 50)/100 : 0 }}>
              CORRECT (L)
            </div>
            <div className="absolute top-4 right-4 text-rose-500 font-bold text-2xl pointer-events-none" style={{ opacity: swipeOffset > 50 ? (swipeOffset - 50)/100 : 0 }}>
              WRONG (R)
            </div>
          </div>
        </div>

        {/* Desktop Buttons */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <button 
            onClick={() => handleAnswer(true)}
            disabled={isAnimating}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all card-hover font-bold border-2 border-emerald-500 disabled:opacity-50"
          >
            <i className="fi fi-sr-arrow-left text-2xl"></i>
            <span>Correct Spelling</span>
          </button>
          
          <button 
            onClick={() => handleAnswer(false)}
            disabled={isAnimating}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all card-hover font-bold border-2 border-rose-500 disabled:opacity-50"
          >
            <i className="fi fi-sr-arrow-right text-2xl"></i>
            <span>Incorrect Spelling</span>
          </button>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 mt-6 text-sm flex items-center justify-center gap-4">
          <span><kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded mx-1">←</kbd> Correct</span>
          <span><kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded mx-1">→</kbd> Incorrect</span>
        </p>
      </div>
    );
  }

  // RESULT SCREEN
  if (gameState === "RESULT") {
    let totalApps = 0;
    let totalCorrects = 0;
    
    const mistakesObj: Record<string, { w: string, wrong: number, apps: number }> = {};
    
    Object.entries(wordStats).forEach(([word, stat]) => {
      totalApps += stat.appearances;
      totalCorrects += stat.correct;
      if (stat.wrong > 0) {
        mistakesObj[word] = { w: word, wrong: stat.wrong, apps: stat.appearances };
      }
    });

    const accuracy = totalApps > 0 ? Math.round((totalCorrects / totalApps) * 100) : 0;
    const frequentlyMissed = Object.values(mistakesObj).sort((a, b) => b.wrong - a.wrong).slice(0, 5);

    return (
      <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-sky-100/50 dark:shadow-black/40 max-w-2xl mx-auto space-y-8 animate-float">
        <div className="text-center">
          <i className="fi fi-sr-trophy text-6xl text-amber-500 mb-4 inline-block drop-shadow-md"></i>
          <h2 className="text-3xl font-bold text-sky-600 dark:text-sky-400 mb-2">
            Game Over!
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">Here&apos;s how you did</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 text-center border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400 mb-1">Score</p>
            <p className="text-4xl font-bold text-zinc-800 dark:text-zinc-100">{score}</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 text-center border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400 mb-1">Accuracy</p>
            <p className="text-4xl font-bold text-zinc-800 dark:text-zinc-100">{accuracy}%</p>
          </div>
        </div>

        {frequentlyMissed.length > 0 && (
          <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-6 border border-rose-200 dark:border-rose-900/50">
            <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 mb-4 flex items-center gap-2">
              <i className="fi fi-sr-exclamation"></i> Frequently Missed Words
            </h3>
            <ul className="space-y-3">
              {frequentlyMissed.map((item, i) => (
                <li key={i} className="flex justify-between items-center bg-white dark:bg-zinc-900 p-3 rounded-lg shadow-sm">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{item.w}</span>
                  <span className="text-sm font-bold text-rose-500">{item.wrong} mistakes</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {Object.keys(wordStats).length === 0 && (
          <p className="text-center text-zinc-500">No words registered.</p>
        )}

        <div className="flex gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button 
            onClick={() => startGame(mode as GameMode, timeLimit)}
            className="flex-1 bg-sky-500 text-white rounded-xl py-4 font-bold hover:bg-sky-600 transition-colors shadow-md hover:shadow-lg"
          >
            Play Again
          </button>
          <button 
            onClick={goHome}
            className="flex-1 bg-zinc-100 dark:bg-slate-800 text-zinc-700 dark:text-zinc-300 rounded-xl py-4 font-bold hover:bg-zinc-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            Menu
          </button>
        </div>
      </div>
    );
  }

  return null;
}
