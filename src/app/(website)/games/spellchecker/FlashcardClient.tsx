"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { VocabularyWord, WordStat } from "./types";
import FlashcardMenuScreen from "./FlashcardMenuScreen";
import FlashcardResultScreen from "./FlashcardResultScreen";
import FlashcardPlayingScreen from "./FlashcardPlayingScreen";
import { fetchVocabBatch } from "./actions";

type Language = "THAI" | "ENGLISH" | null;
type GameMode = "PRACTICE" | "ENDLESS" | "TEST" | "TIMER" | "LIFE" | "HARDCORE" | null;
type GameState = "MENU" | "PLAYING" | "RESULT";

export default function FlashcardClient() {
  // Config state
  const [language, setLanguage] = useState<Language>(null);
  const [mode, setMode] = useState<GameMode>(null);
  const [timeLimit, setTimeLimit] = useState<number>(0);
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isFetchingRef = useRef<boolean>(false);

  // Game state
  const [activeVocab, setActiveVocab] = useState<VocabularyWord[]>([]);
  const [currentWord, setCurrentWord] = useState<VocabularyWord | null>(null);
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  // Analytics & Streaks
  const [wordStats, setWordStats] = useState<Record<string, WordStat>>({});
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
  const dragStartXRef = useRef<number | null>(null);

  // History Buffer (Issue #1 Fix)
  const [recentWordHistory, setRecentWordHistory] = useState<string[]>([]);

  // Feedback State
  const [feedback, setFeedback] = useState<"CORRECT" | "WRONG" | null>(null);
  const [feedbackHint, setFeedbackHint] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [failedHardcoreWord, setFailedHardcoreWord] = useState<VocabularyWord | null>(null);

  const endGame = useCallback(() => {
    setSessionEndTime(Date.now());
    setTimeout(() => setGameState("RESULT"), 100);
  }, []);

  const goHome = useCallback(() => {
    setGameState("MENU");
    setLanguage(null);
    setMode(null);
    setFeedback(null);
    setFeedbackHint(null);
    setTestWordCounts({});
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
  }, []);

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

  // Timer logic (Issue #2 Fix - Eliminate drift)
  useEffect(() => {
    if (gameState === "PLAYING" && mode === "TIMER") {
      // Establish the true end time once when the timer mode begins
      const endTime = Date.now() + (timeLeft * 1000);
      
      const interval = setInterval(() => {
        // Always calculate remaining time against the absolute wall-clock
        const remainingSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        
        // Only trigger state update if the second actually changed
        setTimeLeft((prev) => {
          if (prev !== remainingSeconds) return remainingSeconds;
          return prev;
        });
        
        if (remainingSeconds <= 0) {
          clearInterval(interval);
          endGame();
        }
      }, 100); // Poll every 100ms for high responsiveness
      
      return () => clearInterval(interval);
    }
    // We intentionally omit timeLeft from deps so endTime doesn't reset every second
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, mode, endGame]);

  // Background Queue Logic
  useEffect(() => {
    if (gameState !== "PLAYING" || !language) return;
    
    // Check how many unique words the player has encountered
    const uniqueWordsPlayed = Object.keys(wordStats).length;
    
    // If they have less than 15 fresh words left in the pool, fetch the next batch!
    // This happens completely silently in the background.
    if (uniqueWordsPlayed >= activeVocab.length - 15 && !isFetchingRef.current) {
      isFetchingRef.current = true;
      fetchVocabBatch(language, 50).then(newWords => {
        setActiveVocab(prev => {
          // Prevent duplicates in the pool
          const existingWords = new Set(prev.map(w => w.word));
          const uniqueNew = newWords.filter(w => !existingWords.has(w.word));
          let nextState = [...prev, ...uniqueNew];

          // Rolling window: cap activeVocab at ~150 items for non-stat modes
          // Practice/Test modes need the full pool for weighted selection
          if ((mode === "ENDLESS" || mode === "TIMER" || mode === "LIFE" || mode === "HARDCORE") && nextState.length > 200) {
            nextState = nextState.slice(nextState.length - 150);
          }

          return nextState;
        });
        isFetchingRef.current = false;
      }).catch(err => {
        console.error("Background fetch failed", err);
        isFetchingRef.current = false;
      });
    }
  }, [wordStats, activeVocab.length, gameState, language, mode]);

  const startGame = async (selectedMode: GameMode, selectedTime?: number) => {
    if (!language) return;
    
    setIsLoading(true);
    const initialBatch = await fetchVocabBatch(language, 50);
    setIsLoading(false);

    if (!initialBatch || initialBatch.length === 0) {
      alert("No vocabulary words available!");
      return;
    }

    setActiveVocab(initialBatch);
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
    setRecentWordHistory([]); // Reset history on new game
    isFetchingRef.current = false;
    
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);

    if (selectedMode === "TIMER") {
      setTimeLimit(selectedTime || 60);
      setTimeLeft(selectedTime || 60);
    }
    
    // Pick the first word using the shared logic
    pickNextWord(initialBatch, {}, selectedMode, {});
  };

  const pickNextWord = (
    vocab: VocabularyWord[],
    currentStats: Record<string, WordStat>,
    currentMode: GameMode,
    currentTestCounts: Record<string, number>
  ) => {
    // Filter out words in the history buffer to prevent duplicates
    const candidatePool = vocab.filter(w => !recentWordHistory.includes(w.word));
    // Fallback exactly to vocab if the pool is somehow fully exhausted (e.g. extremely small vocab)
    const safeVocab = candidatePool.length > 0 ? candidatePool : vocab;

    if (currentMode === "PRACTICE" || currentMode === "TEST") {
      let candidateWords = safeVocab;
      
      if (currentMode === "TEST") {
        // Only consider words that haven't been answered 2 times yet
        candidateWords = safeVocab.filter(w => (currentTestCounts[w.word] || 0) < 2);
        if (candidateWords.length === 0) {
          endGame();
          return;
        }
      } else {
        // PRACTICE mode end condition - check against FULL vocab, not safeVocab
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
          // Push to history buffer (max 20)
          setRecentWordHistory(prev => [w.word.word, ...prev].slice(0, 20));
          return;
        }
        rand -= w.weight;
      }
    }

    // Default uniform random for ENDLESS, TIMER, LIFE, HARDCORE
    const randomIndex = Math.floor(Math.random() * safeVocab.length);
    const nextUniformWord = safeVocab[randomIndex];
    setCurrentWord(nextUniformWord);
    setRecentWordHistory(prev => [nextUniformWord.word, ...prev].slice(0, 20));
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
            // Data Decoupling: cache metadata at first encounter for Result Screen
            definition: stats.definition ?? currentWord!.definition,
            isCorrectSpelling: stats.isCorrectSpelling ?? currentWord!.isCorrect,
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

  // Touch Handlers for Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating || feedbackHint) return;
    dragStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isAnimating || dragStartXRef.current === null || feedbackHint) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - dragStartXRef.current;
    setSwipeOffset(diffX);
  };

  const handleTouchEnd = () => {
    if (isAnimating || dragStartXRef.current === null || feedbackHint) return;
    dragStartXRef.current = null;
    
    if (swipeOffset < -100) {
      handleAnswer(true); // Swiped left -> Guessed Correct spelling
    } else if (swipeOffset > 100) {
      handleAnswer(false); // Swiped right -> Guessed Incorrect spelling
    } else {
      setSwipeOffset(0); // Snap back
    }
  };

  if (gameState === "MENU") {
    return (
      <FlashcardMenuScreen 
        language={language}
        setLanguage={setLanguage}
        startGame={startGame}
        isLoading={isLoading}
      />
    );
  }

  if (gameState === "PLAYING" && currentWord) {
    return (
      <FlashcardPlayingScreen
        endGame={endGame}
        mode={mode}
        timeLeft={timeLeft}
        sessionStartTime={sessionStartTime}
        lives={lives}
        showStreakToast={showStreakToast}
        feedback={feedback}
        feedbackHint={feedbackHint}
        currentWord={currentWord}
        cardRef={cardRef}
        swipeOffset={swipeOffset}
        isAnimating={isAnimating}
        handleTouchStart={handleTouchStart}
        handleTouchMove={handleTouchMove}
        handleTouchEnd={handleTouchEnd}
        dragStartXRef={dragStartXRef}
        setSwipeOffset={setSwipeOffset}
        proceedAfterAnswer={proceedAfterAnswer}
        handleAnswer={handleAnswer}
      />
    );
  }

  // RESULT SCREEN
  if (gameState === "RESULT") {
    return (
      <FlashcardResultScreen
        mode={mode}
        timeLimit={timeLimit}
        wordStats={wordStats}
        maxStreak={maxStreak}
        sessionStartTime={sessionStartTime}
        sessionEndTime={sessionEndTime}
        failedHardcoreWord={failedHardcoreWord}
        startGame={startGame}
        goHome={goHome}
      />
    );
  }

  return null;
}
