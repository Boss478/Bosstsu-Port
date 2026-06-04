"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAudio } from "@/hooks/useAudio";
import type { Screen, GameState, RoundData, FeedbackState, GridCell } from "./types";
import { initialGameState, emptyRoundData } from "./types";
import {
  LEVELS,
  GAME_CONFIG,
  randomPraise,
  streakPraise,
  calcStars,
  generateMatchRound,
  generateThaiRound,
  generatePhonicsRound,
  generateFillRound,
  generateTypingRound,
  PROGRESS_KEY,
} from "./constants";

import MenuScreen from "./screens/MenuScreen";
import GameScreen from "./screens/GameScreen";
import VictoryScreen from "./screens/VictoryScreen";

function saveProgress(state: GameState, stars: number[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ gameState: state, stageStars: stars }));
}

function clearProgress() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROGRESS_KEY);
}

function loadSavedProgress(): { gameState: GameState; stageStars: number[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function AlphabetAdventureClient() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [gameState, setGameState] = useState<GameState>(initialGameState());
  const [roundData, setRoundData] = useState<RoundData>(emptyRoundData());
  const [feedback, setFeedback] = useState<FeedbackState>({ text: "", type: "" });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stageStars, setStageStars] = useState<number[]>([]);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [easyMode, setEasyMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const { playSound, speak, muted, toggleMute } = useAudio();

  const stateRef = useRef(gameState);

  useEffect(() => {
    stateRef.current = gameState;
  });

  useEffect(() => {
    setHasSavedProgress(!!loadSavedProgress());
  }, []);

  useEffect(() => {
    const header = document.getElementById("site-header");
    const footer = document.getElementById("site-footer");
    if (screen === "game") {
      header?.classList.add("hidden");
      footer?.classList.add("hidden");
    } else {
      header?.classList.remove("hidden");
      footer?.classList.remove("hidden");
    }
    return () => {
      header?.classList.remove("hidden");
      footer?.classList.remove("hidden");
    };
  }, [screen]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const showFeedback = useCallback((text: string, type: "correct" | "wrong", showCorrect?: string) => {
    setFeedback({ text, type, showCorrect });
    setTimeout(() => setFeedback({ text: "", type: "" }), GAME_CONFIG.FEEDBACK_DURATION);
  }, []);

  const generateRound = useCallback((state: GameState): RoundData => {
    const config = LEVELS[state.level];
    if (!config) return emptyRoundData();
    const numChoices = state.easyMode ? 2 : 3;

    if (config.type === "match") {
      if (config.dataPool === "thai") {
        const { targetLetter, correctChar, choices } = generateThaiRound(state.round, numChoices);
        return { targetLetter, correctChar, choices, grid: [], missingIndices: [], activeIndex: -1 };
      }
      if (config.dataPool === "phonics") {
        const { targetLetter, correctChar, choices } = generatePhonicsRound(state.round, numChoices);
        return { targetLetter, correctChar, choices, grid: [], missingIndices: [], activeIndex: -1 };
      }
      const { targetLetter, correctChar, choices } = generateMatchRound(state.round, numChoices);
      return { targetLetter, correctChar, choices, grid: [], missingIndices: [], activeIndex: -1 };
    } else if (config.type === 'fill-upper' || config.type === 'fill-lower') {
      const numFillChoices = state.easyMode ? 3 : 4;
      const { grid, missingIndices, activeIndex, choices } = generateFillRound(config.type, numFillChoices);
      return { choices, grid, missingIndices, activeIndex };
    } else if (config.type === "typing") {
      const { grid, missingIndices } = generateTypingRound(state.difficulty);
      return { grid, missingIndices, activeIndex: -1, choices: [] };
    }
    return emptyRoundData();
  }, []);

  const startGame = useCallback((savedState?: GameState, savedStars?: number[], easyMode = false) => {
    clearProgress();
    const initialState = savedState || { ...initialGameState(), easyMode };
    setGameState(initialState);
    setScreen("game");
    setRoundData(generateRound(initialState));
    setStageStars(savedStars || []);
  }, [generateRound]);

  const continueGame = useCallback(() => {
    const saved = loadSavedProgress();
    if (saved) {
      setGameState(saved.gameState);
      setStageStars(saved.stageStars);
      setScreen("game");
      setRoundData(generateRound(saved.gameState));
    }
  }, [generateRound]);

  const finishGame = useCallback((score: number) => {
    playSound("win");
    clearProgress();
    setGameState(prev => ({ ...prev, score }));
    setScreen("victory");
  }, [playSound]);

  const handleLevelComplete = useCallback((score: number, correct: number, total: number) => {
    playSound("win");
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const stars = calcStars(accuracy);
    setStageStars(prev => [...prev, stars]);
    showFeedback("Level Complete!", "correct");

    const nextLevel = stateRef.current.level + 1;
    const maxLevel = stateRef.current.easyMode ? 5 : 6;
    if (nextLevel > maxLevel) {
      setTimeout(() => finishGame(score), GAME_CONFIG.FEEDBACK_DURATION + 500);
    } else {
      const nextState: GameState = {
        ...stateRef.current,
        level: nextLevel,
        score,
        round: 1,
        winsInLevel: 0,
        difficulty: GAME_CONFIG.INITIAL_DIFFICULTY,
        consecutiveErrors: 0,
        levelCorrect: 0,
        levelTotal: 0,
        currentStreak: 0,
        bestStreak: stateRef.current.bestStreak,
        wrongAttempts: 0,
      };
      setIsTransitioning(true);
      setGameState(nextState);
      saveProgress(nextState, [...stageStars, stars]);
      setTimeout(() => {
        setRoundData(generateRound(nextState));
        setIsTransitioning(false);
      }, GAME_CONFIG.FEEDBACK_DURATION + 500);
    }
  }, [playSound, showFeedback, generateRound, finishGame, stageStars]);

  const advanceMatchRound = useCallback((currentState: GameState, newScore: number, newLevelCorrect: number, newLevelTotal: number) => {
    const nextRound = currentState.round + 1;
    const newState = {
      ...currentState,
      score: newScore,
      round: nextRound,
      levelCorrect: newLevelCorrect,
      levelTotal: newLevelTotal,
      wrongAttempts: 0,
    };

    const matchTarget = currentState.easyMode ? 15 : (LEVELS[currentState.level]?.target ?? 35);
    if (nextRound > matchTarget) {
      handleLevelComplete(newScore, newLevelCorrect, newLevelTotal);
    } else {
      setGameState(newState);
      saveProgress(newState, stageStars);
      setRoundData(generateRound(newState));
    }
  }, [generateRound, handleLevelComplete, stageStars]);

  const handleAnswer = useCallback((selected: string) => {
    if (isTransitioning) return;
    const config = LEVELS[stateRef.current.level];
    if (!config) return;

    const isMatch = config.type === "match";
    const correct = isMatch
      ? roundData.correctChar
      : roundData.grid[roundData.activeIndex]?.char;

    if (selected === correct) {
      playSound("correct");
      const points = config.type === "typing" ? GAME_CONFIG.SCORE_TYPING_CORRECT : GAME_CONFIG.SCORE_CORRECT;
      const newStreak = stateRef.current.currentStreak + 1;
      const newScore = stateRef.current.score + points;
      const newState = {
        ...stateRef.current,
        score: newScore,
        currentStreak: newStreak,
        bestStreak: Math.max(newStreak, stateRef.current.bestStreak),
        wrongAttempts: 0,
      };

      const streakText = newStreak >= 2 ? ` ${streakPraise(newStreak)}` : "";
      showFeedback(`${randomPraise("correct")} +${points}${streakText}`, "correct");

      if (isMatch) {
        advanceMatchRound(newState, newScore, newState.levelCorrect + 1, newState.levelTotal + 1);
      } else {
        const newGrid = [...roundData.grid];
        newGrid[roundData.activeIndex] = { ...newGrid[roundData.activeIndex], isHidden: false, isCorrect: true };
        const nextMissing = roundData.missingIndices.filter(i => i !== roundData.activeIndex);
        newState.levelCorrect += 1;
        newState.levelTotal += 1;

        if (nextMissing.length === 0) {
          const newWins = stateRef.current.winsInLevel + 1;
          newState.winsInLevel = newWins;
          if (newWins >= config.target) {
            handleLevelComplete(newScore, newState.levelCorrect, newState.levelTotal);
            saveProgress(newState, stageStars);
          } else {
            setIsTransitioning(true);
            setGameState(newState);
            saveProgress(newState, stageStars);
            showFeedback(randomPraise("correct"), "correct");
            setTimeout(() => {
              setRoundData(generateRound(newState));
              setIsTransitioning(false);
            }, GAME_CONFIG.FEEDBACK_DURATION);
          }
        } else {
          const isUpper = config.type === "fill-upper";
          const alphabet = isUpper
            ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
            : "abcdefghijklmnopqrstuvwxyz".split("");
          const nextActive = nextMissing[0];
          const nextCorrect = alphabet[nextActive];
          const choices = [nextCorrect];
          while (choices.length < 4) {
            const r = alphabet[Math.floor(Math.random() * 26)];
            if (!choices.includes(r)) choices.push(r);
          }
          setRoundData({
            ...roundData,
            grid: newGrid,
            missingIndices: nextMissing,
            activeIndex: nextActive,
            choices: shuffleArray(choices),
          });
          setGameState(newState);
          saveProgress(newState, stageStars);
        }
      }
    } else {
      playSound("wrong");
      const points = config.type === "typing" ? GAME_CONFIG.SCORE_TYPING_WRONG : GAME_CONFIG.SCORE_WRONG;
      const newWrong = stateRef.current.wrongAttempts + 1;
      const newWrongLetters = isMatch && roundData.targetLetter
        ? [...stateRef.current.wrongLetters, roundData.targetLetter]
        : stateRef.current.wrongLetters;
      const newState = {
        ...stateRef.current,
        score: Math.max(0, stateRef.current.score - points),
        levelTotal: stateRef.current.levelTotal + 1,
        currentStreak: 0,
        wrongAttempts: newWrong,
        wrongLetters: newWrongLetters,
      };

      if (isMatch && newWrong >= GAME_CONFIG.WRONG_LIMIT) {
        const correctAnswer = roundData.correctChar || "";
        setFeedback({ text: `${correctAnswer}!`, type: "correct", showCorrect: correctAnswer });
        setIsTransitioning(true);
        setTimeout(() => {
          advanceMatchRound(newState, newState.score, newState.levelCorrect, newState.levelTotal);
          setFeedback({ text: "", type: "" });
          setIsTransitioning(false);
        }, GAME_CONFIG.FEEDBACK_DURATION);
      } else {
        setGameState(newState);
        showFeedback(`${randomPraise("wrong")} -${points}`, "wrong", correct);
      }
    }
  }, [isTransitioning, roundData, generateRound, playSound, showFeedback, handleLevelComplete, advanceMatchRound, stageStars]);

  const checkTyping = useCallback(() => {
    if (isTransitioning) return;
    const config = LEVELS[6];
    if (!config) return;

    let allCorrect = true;
    const newGrid: GridCell[] = roundData.grid.map(item => {
      if (!item.isHidden) return item;
      const isCorrect = item.value?.toUpperCase() === item.char.toUpperCase();
      if (!isCorrect) allCorrect = false;
      return { ...item, isCorrect, isWrong: !isCorrect };
    });

    setRoundData({ ...roundData, grid: newGrid });

    if (allCorrect) {
      playSound("correct");
      const newScore = stateRef.current.score + GAME_CONFIG.SCORE_TYPING_CORRECT;
      const newWins = stateRef.current.winsInLevel + 1;
      const newDifficulty = Math.min(GAME_CONFIG.MAX_DIFFICULTY, stateRef.current.difficulty + GAME_CONFIG.DIFFICULTY_INCREASE);
      const newStreak = stateRef.current.currentStreak + 1;
      const newState: GameState = {
        ...stateRef.current,
        score: newScore,
        winsInLevel: newWins,
        difficulty: newDifficulty,
        consecutiveErrors: 0,
        levelCorrect: stateRef.current.levelCorrect + stateRef.current.difficulty,
        levelTotal: stateRef.current.levelTotal + stateRef.current.difficulty,
        currentStreak: newStreak,
        bestStreak: Math.max(newStreak, stateRef.current.bestStreak),
        wrongAttempts: 0,
      };

      const streakText = newStreak >= 2 ? ` ${streakPraise(newStreak)}` : "";
      showFeedback(`${randomPraise("correct")} +${GAME_CONFIG.SCORE_TYPING_CORRECT}${streakText}`, "correct");

      if (newWins >= config.target) {
        handleLevelComplete(newScore, newState.levelCorrect, newState.levelTotal);
        saveProgress(newState, stageStars);
      } else {
        setIsTransitioning(true);
        setGameState(newState);
        saveProgress(newState, stageStars);
        setTimeout(() => {
          const round = generateTypingRound(newDifficulty);
          setRoundData({ choices: [], ...round });
          setIsTransitioning(false);
        }, GAME_CONFIG.FEEDBACK_DURATION);
      }
    } else {
      playSound("wrong");
      const newErrors = stateRef.current.consecutiveErrors + 1;
      const newState: GameState = {
        ...stateRef.current,
        score: Math.max(0, stateRef.current.score - GAME_CONFIG.SCORE_TYPING_WRONG),
        consecutiveErrors: newErrors,
        levelTotal: stateRef.current.levelTotal + stateRef.current.difficulty,
        currentStreak: 0,
        wrongAttempts: stateRef.current.wrongAttempts + 1,
      };

      if (newErrors >= GAME_CONFIG.ERROR_THRESHOLD) {
        showFeedback("Difficulty decreased!", "wrong");
        const easierState = {
          ...newState,
          difficulty: Math.max(1, stateRef.current.difficulty - 1),
          consecutiveErrors: 0,
        };
        setGameState(easierState);
        saveProgress(easierState, stageStars);
        setIsTransitioning(true);
        setTimeout(() => {
          const round = generateTypingRound(easierState.difficulty);
          setRoundData({ choices: [], ...round });
          setIsTransitioning(false);
        }, GAME_CONFIG.FEEDBACK_DURATION + 500);
      } else {
        setGameState(newState);
        showFeedback(randomPraise("wrong"), "wrong");
        setIsTransitioning(true);
        setTimeout(() => {
          setRoundData(prev => ({
            ...prev,
            grid: prev.grid.map(g => g.isWrong ? { ...g, isWrong: false } : g),
          }));
          setIsTransitioning(false);
        }, 800);
      }
    }
  }, [isTransitioning, roundData, playSound, showFeedback, handleLevelComplete, stageStars]);

  const handleSelectCell = useCallback((index: number) => {
    setRoundData(prev => ({ ...prev, activeIndex: index }));
  }, []);

  const handleTypingInput = useCallback((index: number, value: string) => {
    setRoundData(prev => {
      const newGrid = [...prev.grid];
      newGrid[index] = { ...newGrid[index], value };
      return { ...prev, grid: newGrid };
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center justify-center p-4 transition-colors duration-500 ${
        screen === "game"
          ? "h-screen overflow-hidden bg-violet-50 dark:bg-zinc-950"
          : "min-h-screen bg-violet-50 dark:bg-zinc-950 pt-24"
      }`}
      style={{ fontFamily: "'Mali', sans-serif" }}
    >
      <div className="w-full max-w-3xl mx-auto relative">
        {screen === "menu" && (
          <MenuScreen
            onStart={() => startGame(undefined, undefined, easyMode)}
            onContinue={continueGame}
            hasProgress={hasSavedProgress}
            easyMode={easyMode}
            onToggleEasy={() => setEasyMode(v => !v)}
          />
        )}

        {screen === "game" && (
          <GameScreen
            gameState={gameState}
            roundData={roundData}
            feedback={feedback}
            isTransitioning={isTransitioning}
            isFullscreen={isFullscreen}
            muted={muted}
            onAnswer={handleAnswer}
            onCheckTyping={checkTyping}
            onBack={() => setScreen("menu")}
            onToggleFullscreen={toggleFullscreen}
            onToggleMute={toggleMute}
            onSelectCell={handleSelectCell}
            onTypingInput={handleTypingInput}
            onSpeak={speak}
          />
        )}

        {screen === "victory" && (
          <VictoryScreen score={gameState.score} stageStars={stageStars} wrongLetters={gameState.wrongLetters} />
        )}
      </div>
    </div>
  );
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
