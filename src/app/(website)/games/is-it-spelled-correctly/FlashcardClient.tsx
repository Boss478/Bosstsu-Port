"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { VocabularyData, VocabularyWord } from "./types";
import FlashcardMenuScreen from "./FlashcardMenuScreen";
import FlashcardResultScreen from "./FlashcardResultScreen";
import FlashcardPlayingScreen from "./FlashcardPlayingScreen";

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
  const [timeLimit, setTimeLimit] = useState<number>(0);
  const [gameState, setGameState] = useState<GameState>("MENU");



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
  const dragStartXRef = useRef<number | null>(null);

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

  // Timer logic
  useEffect(() => {
    if (gameState === "PLAYING" && mode === "TIMER" && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (gameState === "PLAYING" && mode === "TIMER" && timeLeft <= 0) {
      endGame();
    }
  }, [gameState, mode, timeLeft, endGame]);

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
      setTimeLimit(selectedTime || 60);
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
      />
    );
  }

  if (gameState === "PLAYING" && currentWord) {
    return (
      <FlashcardPlayingScreen
        endGame={endGame}
        mode={mode}
        timeLeft={timeLeft}
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
        activeVocab={activeVocab}
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
