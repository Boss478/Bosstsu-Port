"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode, MutableRefObject, RefObject } from "react";
import type { VocabularyWord, WordStat } from "./types";
import { fetchVocabBatch } from "./actions";

export type Language = "THAI" | "ENGLISH" | null;
export type GameMode = "PRACTICE" | "ENDLESS" | "TEST" | "TIMER" | "LIFE" | "HARDCORE" | null;
export type GameState = "MENU" | "PLAYING" | "RESULT";

interface FlashcardContextType {
  language: Language;
  setLanguage: (l: Language) => void;
  mode: GameMode;
  setMode: (m: GameMode) => void;
  timeLimit: number;
  gameState: GameState;
  setGameState: (s: GameState) => void;
  isLoading: boolean;
  
  activeVocab: VocabularyWord[];
  currentWord: VocabularyWord | null;
  lives: number;
  timeLeft: number;
  
  wordStats: Record<string, WordStat>;
  currentStreak: number;
  maxStreak: number;
  showStreakToast: number | null;
  sessionStartTime: number;
  sessionEndTime: number;
  failedHardcoreWord: VocabularyWord | null;
  
  swipeOffset: number;
  setSwipeOffset: (o: number) => void;
  isAnimating: boolean;
  cardRef: RefObject<HTMLDivElement | null>;
  dragStartXRef: MutableRefObject<number | null>;
  
  feedback: "CORRECT" | "WRONG" | null;
  feedbackHint: string | null;
  
  endGame: () => void;
  goHome: () => void;
  startGame: (selectedMode: GameMode, selectedTime?: number) => void;
  handleAnswer: (userGuessedCorrect: boolean) => void;
  proceedAfterAnswer: (isActuallyCorrect: boolean, userGuessedCorrect: boolean) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
}

const FlashcardContext = createContext<FlashcardContextType | undefined>(undefined);

export function FlashcardProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(null);
  const [mode, setMode] = useState<GameMode>(null);
  const [timeLimit, setTimeLimit] = useState<number>(0);
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isFetchingRef = useRef<boolean>(false);

  const [activeVocab, setActiveVocab] = useState<VocabularyWord[]>([]);
  const [currentWord, setCurrentWord] = useState<VocabularyWord | null>(null);
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  const [wordStats, setWordStats] = useState<Record<string, WordStat>>({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [showStreakToast, setShowStreakToast] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [sessionEndTime, setSessionEndTime] = useState<number>(0);
  
  const [testWordCounts, setTestWordCounts] = useState<Record<string, number>>({});
  
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef<number | null>(null);

  const [recentWordHistory, setRecentWordHistory] = useState<string[]>([]);
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
    setTimeout(() => {
        setLanguage(null);
        setMode(null);
        setFeedback(null);
        setFeedbackHint(null);
        setTestWordCounts({});
    }, 150);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
  }, []);

  const stateRef = useRef({ gameState, isAnimating, feedbackHint });
  useEffect(() => {
    stateRef.current = { gameState, isAnimating, feedbackHint };
  }, [gameState, isAnimating, feedbackHint]);

  const handleAnswerRef = useRef((_userGuessedCorrect: boolean) => {});
  useEffect(() => {
    handleAnswerRef.current = handleAnswerInternal;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { gameState, isAnimating, feedbackHint } = stateRef.current;
      if (gameState !== "PLAYING" || isAnimating || feedbackHint) return;
      if (e.key === "ArrowLeft") handleAnswerRef.current(true);
      if (e.key === "ArrowRight") handleAnswerRef.current(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (gameState === "PLAYING" && mode === "TIMER") {
      const endTime = Date.now() + (timeLeft * 1000);
      const interval = setInterval(() => {
        const remainingSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        setTimeLeft((prev) => {
          if (prev !== remainingSeconds) return remainingSeconds;
          return prev;
        });
        if (remainingSeconds <= 0) {
          clearInterval(interval);
          endGame();
        }
      }, 100);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, mode, endGame]);

  useEffect(() => {
    if (gameState !== "PLAYING" || !language) return;
    const uniqueWordsPlayed = Object.keys(wordStats).length;
    if (uniqueWordsPlayed >= activeVocab.length - 15 && !isFetchingRef.current) {
      isFetchingRef.current = true;
      fetchVocabBatch(language, 50).then(newWords => {
        if (!newWords || newWords.length === 0) {
          isFetchingRef.current = false;
          return;
        }
        setActiveVocab(prev => {
          const existingWords = new Set(prev.map(w => w.word));
          const uniqueNew = newWords.filter(w => !existingWords.has(w.word));
          let nextState = [...prev, ...uniqueNew];
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
    try {
      const initialBatch = await fetchVocabBatch(language, 50);
      setIsLoading(false);

      if (!initialBatch || initialBatch.length === 0) {
        alert("Failed to connect to the game server or load vocabulary. Please check your network and try again.");
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
    setRecentWordHistory([]);
    isFetchingRef.current = false;
    
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);

    if (selectedMode === "TIMER") {
      setTimeLimit(selectedTime || 60);
      setTimeLeft(selectedTime || 60);
    }
    
    
    pickNextWord(initialBatch, {}, selectedMode, {});
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      alert("Failed to connect to the game server or load vocabulary. Please check your network and try again.");
    }
  };

  const pickNextWord = (
    vocab: VocabularyWord[],
    currentStats: Record<string, WordStat>,
    currentMode: GameMode,
    currentTestCounts: Record<string, number>
  ) => {
    const candidatePool = vocab.filter(w => !recentWordHistory.includes(w.word));
    const safeVocab = candidatePool.length > 0 ? candidatePool : vocab;

    if (currentMode === "PRACTICE" || currentMode === "TEST") {
      let candidateWords = safeVocab;
      
      if (currentMode === "TEST") {
        candidateWords = safeVocab.filter(w => (currentTestCounts[w.word] || 0) < 2);
        if (candidateWords.length === 0) {
          endGame();
          return;
        }
      } else {
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
          setRecentWordHistory(prev => [w.word.word, ...prev].slice(0, 20));
          return;
        }
        rand -= w.weight;
      }
    }

    const randomIndex = Math.floor(Math.random() * safeVocab.length);
    const nextUniformWord = safeVocab[randomIndex];
    setCurrentWord(nextUniformWord);
    setRecentWordHistory(prev => [nextUniformWord.word, ...prev].slice(0, 20));
  };

  const handleAnswerInternal = (userGuessedCorrect: boolean) => {
    if (!currentWord || isAnimating || feedbackHint) return;

    const isActuallyCorrect = currentWord.isCorrect === userGuessedCorrect;

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

    if (isActuallyCorrect) {
      setFeedback("CORRECT");
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 800);
    } else {
      setFeedback("WRONG");
      if (mode === "PRACTICE") {
        const correctForm = currentWord.isCorrect ? "Correct spelling" : "Incorrect spelling";
        setFeedbackHint(`The answer was: ${correctForm}`);
        return; 
      }
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 800);
    }

    proceedAfterAnswerInternal(isActuallyCorrect, userGuessedCorrect);
  };

  const proceedAfterAnswerInternal = (isActuallyCorrect: boolean, userGuessedCorrect: boolean) => {
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
          setSwipeOffset(0);
          setIsAnimating(false);
          setFeedback(null);
          setFeedbackHint(null);
        }

        return newStats;
      });
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating || feedbackHint) return;
    dragStartXRef.current = e.touches[0].clientX;
    if (cardRef.current) {
        cardRef.current.style.transition = 'none';
        cardRef.current.style.transform = `translateX(0px) rotate(0deg)`;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isAnimating || dragStartXRef.current === null || feedbackHint) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - dragStartXRef.current;
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${diffX}px) rotate(${diffX * 0.05}deg)`;
    }
  };

  const handleTouchEnd = () => {
    if (isAnimating || dragStartXRef.current === null || feedbackHint) return;
    
    let finalOffset = 0;
    if (cardRef.current) {
      const transformValue = cardRef.current.style.transform;
      const match = transformValue.match(/translateX\(([-.0-9]+)px\)/);
      if (match) {
        finalOffset = parseFloat(match[1]);
      }
    }

    dragStartXRef.current = null;
    
    if (finalOffset < -100) {
      handleAnswerInternal(true);
    } else if (finalOffset > 100) {
      handleAnswerInternal(false);
    } else {
      setSwipeOffset(0); 
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.3s ease';
        cardRef.current.style.transform = `translateX(0px) rotate(0deg)`;
      }
    }
  };

  return (
    <FlashcardContext.Provider value={{
      language, setLanguage, mode, setMode, timeLimit, gameState, setGameState,
      isLoading, activeVocab, currentWord, lives, timeLeft, wordStats, currentStreak,
      maxStreak, showStreakToast, sessionStartTime, sessionEndTime, failedHardcoreWord,
      swipeOffset, setSwipeOffset, isAnimating, cardRef, dragStartXRef,
      feedback, feedbackHint, endGame, goHome, startGame, 
      handleAnswer: handleAnswerInternal, proceedAfterAnswer: proceedAfterAnswerInternal,
      handleTouchStart, handleTouchMove, handleTouchEnd
    }}>
      {children}
    </FlashcardContext.Provider>
  );
}

export function useFlashcardContext() {
  const context = useContext(FlashcardContext);
  if (context === undefined) {
    throw new Error("useFlashcardContext must be used within a FlashcardProvider");
  }
  return context;
}
