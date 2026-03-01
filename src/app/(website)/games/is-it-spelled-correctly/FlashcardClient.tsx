"use client";

import { useState, useEffect, useRef } from "react";
import type { VocabularyData, VocabularyWord } from "./page";

type Language = "THAI" | "ENGLISH" | null;
type GameMode = "PRACTICE" | "ENDLESS" | "TEST" | "TIMER" | "LIFE" | "HARDCORE" | null;
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

  // Modals
  const [showHelp, setShowHelp] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  // Game state
  const [activeVocab, setActiveVocab] = useState<VocabularyWord[]>([]);
  const [currentWord, setCurrentWord] = useState<VocabularyWord | null>(null);
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  // Analytics & Streaks
  const [wordStats, setWordStats] = useState<Record<string, { appearances: number; correct: number; wrong: number }>>({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [showStreakToast, setShowStreakToast] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [sessionEndTime, setSessionEndTime] = useState<number>(0);
  
  // Test Mode State
  const [testWordCounts, setTestWordCounts] = useState<Record<string, number>>({});

  // Swipe Animation State
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);

  // Feedback State
  const [feedback, setFeedback] = useState<"CORRECT" | "WRONG" | null>(null);
  const [feedbackHint, setFeedbackHint] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [failedHardcoreWord, setFailedHardcoreWord] = useState<VocabularyWord | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "PLAYING" || isAnimating || feedbackHint) return;
      if (e.key === "ArrowLeft") handleAnswer(true);
      if (e.key === "ArrowRight") handleAnswer(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, isAnimating, currentWord, feedbackHint]);

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
    setLives(selectedMode === "LIFE" ? 3 : selectedMode === "HARDCORE" ? 1 : 0);
    setWordStats({});
    setCurrentStreak(0);
    setMaxStreak(0);
    setSessionStartTime(Date.now());
    setSwipeOffset(0);
    setIsAnimating(false);
    setFeedback(null);
    setFeedbackHint(null);
    setFailedHardcoreWord(null);
    setTestWordCounts({});
    
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);

    if (selectedMode === "TIMER") {
      setTimeLeft(selectedTime || 60);
    }
    
    // Pick the first word using the shared logic
    pickNextWord(vocab, {}, selectedMode, {});
  };

  const pickNextWord = (
    vocab: VocabularyWord[],
    currentStats: Record<string, { appearances: number; correct: number; wrong: number }>,
    currentMode: GameMode,
    currentTestCounts: Record<string, number>
  ) => {
    if (currentMode === "PRACTICE" || currentMode === "TEST") {
      let candidateWords = vocab;
      
      if (currentMode === "TEST") {
        // Only consider words that haven't been answered 2 times yet
        candidateWords = vocab.filter(w => (currentTestCounts[w.word] || 0) < 2);
        if (candidateWords.length === 0) {
          endGame();
          return;
        }
      } else {
        // PRACTICE mode end condition
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
      }

      // Weighted random selection based on past performance
      const weightedWords = candidateWords.map(w => {
        const stat = currentStats[w.word] || { appearances: 0, correct: 0, wrong: 0 };
        const acc = stat.appearances > 0 ? stat.correct / stat.appearances : 0.5;
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

    // Default uniform random for ENDLESS, TIMER, LIFE, HARDCORE
    const randomIndex = Math.floor(Math.random() * vocab.length);
    setCurrentWord(vocab[randomIndex]);
  };

  const handleAnswer = (userGuessedCorrect: boolean) => {
    if (!currentWord || isAnimating || feedbackHint) return;

    const isActuallyCorrect = currentWord.isCorrect === userGuessedCorrect;

    // Streak logic
    if (isActuallyCorrect) {
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      setMaxStreak(prev => Math.max(prev, newStreak));
      
      if (newStreak > 0 && newStreak % 5 === 0) {
        setShowStreakToast(newStreak);
        setTimeout(() => setShowStreakToast(null), 2500);
      }
    } else {
      setCurrentStreak(0);
    }

    // Visual feedback for ALL modes
    if (isActuallyCorrect) {
      setFeedback("CORRECT");
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 800);
    } else {
      setFeedback("WRONG");
      if (mode === "PRACTICE") {
        // Show the hint, block next word until they acknowledge
        const correctForm = currentWord.isCorrect ? "Correct spelling" : "Incorrect spelling";
        setFeedbackHint(`The answer was: ${correctForm}`);
        setSwipeOffset(userGuessedCorrect ? -50 : 50); // slight nudge
        return; // Don't proceed to next word yet
      } else {
        // Clear floating text after a delay for non-practice modes
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 800);
      }
    }

    proceedAfterAnswer(isActuallyCorrect, userGuessedCorrect);
  };

  const proceedAfterAnswer = (isActuallyCorrect: boolean, userGuessedCorrect: boolean) => {
    setIsAnimating(true);
    setSwipeOffset(userGuessedCorrect ? -500 : 500);

    setTimeout(() => {
      setWordStats(prev => {
        const stats = prev[currentWord!.word] || { appearances: 0, correct: 0, wrong: 0 };
        const newStats = {
          ...prev,
          [currentWord!.word]: {
            appearances: stats.appearances + 1,
            correct: stats.correct + (isActuallyCorrect ? 1 : 0),
            wrong: stats.wrong + (isActuallyCorrect ? 0 : 1),
          }
        };

        const newTestCounts = { ...testWordCounts };
        if (mode === "TEST") {
            newTestCounts[currentWord!.word] = (newTestCounts[currentWord!.word] || 0) + 1;
            setTestWordCounts(newTestCounts);
        }

        let ending = false;

        if (!isActuallyCorrect) {
          if (mode === "LIFE") {
            const nextLives = lives - 1;
            setLives(nextLives);
            if (nextLives <= 0) ending = true;
          } else if (mode === "HARDCORE") {
            setLives(0);
            setFailedHardcoreWord(currentWord);
            ending = true;
          }
        }

        if (ending) {
          endGame();
        } else {
          pickNextWord(activeVocab, newStats, mode, newTestCounts);
          // Reset animation state for next word
          setSwipeOffset(0);
          setIsAnimating(false);
          setFeedback(null);
          setFeedbackHint(null);
        }

        return newStats;
      });
    }, 300);
  };

  const endGame = () => {
    setSessionEndTime(Date.now());
    setTimeout(() => setGameState("RESULT"), 100);
  };

  const goHome = () => {
    setGameState("MENU");
    setLanguage(null);
    setMode(null);
    setFeedback(null);
    setFeedbackHint(null);
    setTestWordCounts({});
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
  };

  // Touch Handlers for Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating || feedbackHint) return;
    dragStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isAnimating || dragStartX.current === null || feedbackHint) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - dragStartX.current;
    setSwipeOffset(diffX);
  };

  const handleTouchEnd = () => {
    if (isAnimating || dragStartX.current === null || feedbackHint) return;
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
        <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-sky-100/50 dark:shadow-black/40 text-center space-y-8 animate-float relative overflow-hidden">
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={() => setShowChangelog(true)} className="p-2 text-zinc-400 hover:text-sky-500 transition-colors" title="Changelog">
              <i className="fi fi-sr-time-past text-xl"></i>
            </button>
            <button onClick={() => setShowHelp(true)} className="p-2 text-zinc-400 hover:text-amber-500 transition-colors" title="How to play">
              <i className="fi fi-sr-interrogation text-xl"></i>
            </button>
          </div>

          <div className="mb-6 pt-4">
            <i className="fi fi-sr-graduation-cap text-6xl text-sky-500 mb-4 inline-block"></i>
            <h1 className="text-4xl font-bold text-sky-600 dark:text-sky-400 mb-2">
              SpellCheck
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
              className="card-hover bg-sky-500 hover:bg-sky-600 text-white rounded-2xl p-6 font-bold text-xl flex flex-col items-center gap-2 transition-colors relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
              <i className="fi fi-sr-flag text-3xl z-10"></i>
              <span className="z-10">ภาษาไทย</span>
            </button>
            <button
              onClick={() => setLanguage("ENGLISH")}
              className="card-hover bg-gray-500 hover:bg-gray-600 text-white rounded-2xl p-6 font-bold text-xl flex flex-col items-center gap-2 transition-colors relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
              <i className="fi fi-sr-world text-3xl z-10"></i>
              <span className="z-10">English (US)</span>
              <span className="text-xs">(In Progress)</span>
            </button>
          </div>

          {showHelp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl text-left relative overflow-y-auto max-h-[90vh]">
                <button onClick={() => setShowHelp(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-rose-500">
                  <i className="fi fi-sr-cross-circle text-2xl"></i>
                </button>
                <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-6 flex items-center gap-3">
                  <i className="fi fi-sr-interrogation text-amber-500"></i> How to Play
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-2">Controls</h4>
                    <ul className="text-zinc-600 dark:text-zinc-400 space-y-2 text-sm">
                      <li>• <b>PC:</b> Use <kbd className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">Left Arrow</kbd> for Correct Spelling, <kbd className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">Right Arrow</kbd> for Incorrect.</li>
                      <li>• <b>Mobile:</b> Swipe the card Left for Correct, Swipe Right for Incorrect.</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-2">Game Modes</h4>
                    <ul className="text-zinc-600 dark:text-zinc-400 space-y-3 text-sm">
                      <li><b className="text-sky-500">Practice:</b> Shows answer when wrong. Focuses on words you miss.</li>
                      <li><b className="text-emerald-500">Test:</b> Must answer each word 2 times. Blind feedback.</li>
                      <li><b className="text-amber-500">Life:</b> 3 mistakes allowed. Blind feedback.</li>
                      <li><b className="text-rose-500">Hardcore:</b> 1 mistake ends the game. Blind feedback.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showChangelog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl text-left relative overflow-y-auto max-h-[90vh]">
                <button onClick={() => setShowChangelog(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-rose-500">
                  <i className="fi fi-sr-cross-circle text-2xl"></i>
                </button>
                <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-6 flex items-center gap-3">
                  <i className="fi fi-sr-time-past text-sky-500"></i> Update History
                </h3>
                
                <div className="space-y-6">
                  <div className="border-l-2 border-sky-500 pl-4 py-1">
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200 flex justify-between">
                      v1.1.1 
                      <span className="text-xs font-normal text-sky-500 bg-sky-100 dark:bg-sky-900/40 px-2 py-1 rounded-full">New Update</span>
                    </h4>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-2 leading-relaxed">
                      - <b>"Blind" learning:</b> Removed score HUD during play.<br/>
                      - <b>Revamped Modes:</b> Hardcore is now 1 life. Life mode has 3 lives. Test mode requires 2 passes.<br/>
                      - <b>Analytics:</b> Added detailed run histories, streaks, and advanced timing.<br/>
                      - <b>Security:</b> Hidden word datasets.
                    </p>
                  </div>
                  <div className="border-l-2 border-zinc-300 dark:border-zinc-700 pl-4 py-1 opacity-70">
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200">v1.1.0</h4>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-2">
                      Initial release with Practice, Endless, Test, and Hardcore modes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
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
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Shows answer on mistake. Adapts to weaknesses.</p>
          </button>
          
          <button onClick={() => startGame("ENDLESS")} className="card-hover bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 text-left border-2 border-transparent hover:border-blue-400 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <i className="fi fi-sr-infinity text-2xl text-blue-500"></i>
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Endless</h3>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Play continuously. Blind feedback.</p>
          </button>
          
          <button onClick={() => startGame("TEST")} className="card-hover bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 text-left border-2 border-transparent hover:border-emerald-400 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <i className="fi fi-sr-clipboard-list-check text-2xl text-emerald-500"></i>
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Test</h3>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Must answer each word 2x. Blind feedback.</p>
          </button>

          <button onClick={() => startGame("LIFE")} className="card-hover bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 text-left border-2 border-transparent hover:border-amber-400 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <i className="fi fi-sr-heart text-2xl text-amber-500"></i>
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Life Mode</h3>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">3 Lives. Blind feedback.</p>
          </button>

          <button onClick={() => startGame("HARDCORE")} className="card-hover bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 text-left border-2 border-transparent hover:border-rose-400 transition-colors sm:col-span-2">
            <div className="flex items-center gap-3 mb-2">
              <i className="fi fi-sr-flame text-2xl text-rose-500"></i>
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Hardcore</h3>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">1 Life. No room for error. Blind feedback.</p>
          </button>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 text-left border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <i className="fi fi-sr-stopwatch text-2xl text-violet-500"></i>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Timer Mode</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {[30, 60, 90, 120, 150, 180].map(t => (
              <button 
                key={t}
                onClick={() => startGame("TIMER", t)} 
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-violet-500 hover:text-white rounded-lg transition-colors font-bold"
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
      <div className="max-w-2xl mx-auto flex flex-col items-center relative">
        {/* Header HUD */}
        <div className="w-full flex justify-between items-center mb-8 px-4 h-10">
          <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 font-bold">
            <button onClick={endGame} className="text-zinc-400 hover:text-red-500 transition-colors">
              <i className="fi fi-sr-cross-circle text-2xl"></i>
            </button>
            {/* Score removed to focus on learning */}
          </div>
          <div className="flex items-center gap-4 font-bold">
            {mode === "TIMER" && (
              <div className={`flex items-center gap-2 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-zinc-800 dark:text-zinc-200'}`}>
                <i className="fi fi-sr-clock"></i> {timeLeft}s
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

        {/* Flashcard */}
        <div className="relative w-full max-w-sm aspect-4/3 perspective-1000 mb-12 select-none touch-none group">
          {feedback && !feedbackHint && (
            <div className={`absolute top-0 left-1/2 z-50 text-2xl sm:text-3xl font-bold font-sans tracking-wide pointer-events-none animate-float-up-fade drop-shadow-lg flex items-center gap-2 whitespace-nowrap ${feedback === "CORRECT" ? "text-emerald-500" : "text-rose-500"}`}>
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
          )}

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
            onMouseDown={(e) => {
              if (isAnimating || feedbackHint) return;
              dragStartX.current = e.clientX;
            }}
            onMouseMove={(e) => {
              if (isAnimating || dragStartX.current === null || feedbackHint) return;
              setSwipeOffset(e.clientX - dragStartX.current);
            }}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            <h2 className={`text-4xl sm:text-5xl font-bold tracking-wide text-zinc-800 dark:text-zinc-100 text-center pointer-events-none ${feedbackHint ? 'opacity-30' : ''}`}>
              {currentWord.word}
            </h2>

            {/* Word metadata */}
            {(currentWord.wordClass || currentWord.level) && (
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
                <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-lg">
                  {feedbackHint.replace('The answer was: ', '')}
                </p>
                <button 
                  onClick={(e) => {
                     e.stopPropagation();
                     // Actually process the wrong answer now
                     proceedAfterAnswer(false, !currentWord.isCorrect);
                  }}
                  className="mt-6 bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-xl font-bold transition-colors"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Buttons */}
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
        <div className="text-zinc-400 mt-6 text-sm flex gap-6">
          <span className="flex items-center"><kbd className="mr-2">←</kbd> Correct</span>
          <span className="flex items-center"><kbd className="mr-2">→</kbd> Incorrect</span>
        </div>
      </div>
    );
  }

  // RESULT SCREEN
  if (gameState === "RESULT") {
    let totalApps = 0;
    let totalCorrects = 0;
    
    const wordList = Object.entries(wordStats).map(([word, stat]) => {
      totalApps += stat.appearances;
      totalCorrects += stat.correct;
      return { word, ...stat };
    }).sort((a, b) => b.wrong - a.wrong); // Sort by most mistakes first

    const accuracy = totalApps > 0 ? Math.round((totalCorrects / totalApps) * 100) : 0;
    const durationSeconds = Math.max(1, Math.floor((sessionEndTime - sessionStartTime) / 1000));
    const isPerfect = accuracy === 100 && totalApps > 0;
    const isHardcoreFail = mode === "HARDCORE" && failedHardcoreWord !== null;

    return (
      <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-sky-100/50 dark:shadow-black/40 max-w-3xl mx-auto space-y-8 animate-float">
        <div className="text-center relative">
          {isPerfect && !isHardcoreFail ? (
             <div className="absolute top-0 right-0 rotate-12 bg-amber-200 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-2 border-amber-400 px-4 py-1 rounded-full font-bold shadow-sm">
                Perfect!
             </div>
          ) : null}
          <i className={`fi ${isHardcoreFail ? 'fi-sr-skull-crossbones text-rose-500' : 'fi-sr-trophy text-amber-500'} text-6xl mb-4 inline-block drop-shadow-md`}></i>
          <h2 className={`text-3xl font-bold ${isHardcoreFail ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400'} mb-2`}>
            {isHardcoreFail ? 'Game Over!' : 'Session Complete!'}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">Here's your learning breakdown</p>
        </div>

        {isHardcoreFail && (
          <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-6 border border-rose-200 dark:border-rose-900/50 text-center animate-in zoom-in duration-300">
             <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mb-2">You missed the word:</h3>
             <p className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-4">{failedHardcoreWord.word}</p>
             <div className="inline-block bg-white dark:bg-zinc-800 px-6 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm">
               The spelling was <strong className="text-sky-500">{failedHardcoreWord.isCorrect ? "Correct" : "Incorrect"}</strong>
             </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 text-center border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold mb-1">Total Words</p>
            <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{totalApps}</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 text-center border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold mb-1">Accuracy</p>
            <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{accuracy}%</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 text-center border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold mb-1">Best Streak</p>
            <p className="text-2xl font-bold text-amber-500">{maxStreak}</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 text-center border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold mb-1">Avg Speed</p>
            <p className="text-2xl font-bold text-sky-500">{(durationSeconds / Math.max(1, totalApps)).toFixed(1)}s</p>
          </div>
        </div>

        {wordList.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="bg-zinc-50 dark:bg-zinc-800 px-6 py-3 border-b border-zinc-200 dark:border-zinc-700 font-bold text-zinc-700 dark:text-zinc-300">
              All Word Analysis
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900/80 sticky top-0 shadow-sm text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-6 py-3">Word</th>
                    <th className="px-6 py-3 text-center">Seen</th>
                    <th className="px-6 py-3 text-center">Correct</th>
                    <th className="px-6 py-3 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {wordList.map((item, i) => {
                    const wordAcc = Math.round((item.correct / item.appearances) * 100);
                    return (
                      <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-3 font-bold text-zinc-800 dark:text-zinc-200">{item.word}</td>
                        <td className="px-6 py-3 text-center text-zinc-500">{item.appearances}</td>
                        <td className="px-6 py-3 text-center">
                           <span className={wordAcc >= 80 ? 'text-emerald-500' : wordAcc >= 50 ? 'text-amber-500' : 'text-rose-500'}>
                             {wordAcc}%
                           </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          {item.wrong === 0 ? (
                            <i className="fi fi-sr-check-circle text-emerald-500"></i>
                          ) : (
                            <span className="text-rose-500 font-bold bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded text-xs">
                              {item.wrong} missed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalApps === 0 && (
          <p className="text-center text-zinc-500">No words played.</p>
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
