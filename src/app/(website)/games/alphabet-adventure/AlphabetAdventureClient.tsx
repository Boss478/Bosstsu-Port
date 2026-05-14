"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAudio } from "@/hooks/useAudio";
import type { Screen, GameState, RoundData, FeedbackState, GridCell } from "./types";
import { initialGameState, emptyRoundData } from "./types";
import {
  LEVELS,
  GAME_CONFIG,
  randomPraise,
  calcStars,
  generateMatchRound,
  generateFillRound,
  generateTypingRound,
} from "./constants";

import MenuScreen from "./screens/MenuScreen";
import GameScreen from "./screens/GameScreen";
import VictoryScreen from "./screens/VictoryScreen";

export default function AlphabetAdventureClient() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [gameState, setGameState] = useState<GameState>(initialGameState());
  const [roundData, setRoundData] = useState<RoundData>(emptyRoundData());
  const [feedback, setFeedback] = useState<FeedbackState>({ text: "", type: "" });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stageStars, setStageStars] = useState<number[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { playSound, muted, toggleMute } = useAudio();

  const stateRef = useRef(gameState);
  stateRef.current = gameState;

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

  const showFeedback = useCallback((text: string, type: "correct" | "wrong") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback({ text: "", type: "" }), GAME_CONFIG.FEEDBACK_DURATION);
  }, []);

  const generateRound = useCallback((state: GameState): RoundData => {
    const config = LEVELS[state.level];
    if (!config) return emptyRoundData();

    if (config.type === "match") {
      const { targetLetter, correctChar, choices } = generateMatchRound(state.round);
      return { targetLetter, correctChar, choices, grid: [], missingIndices: [], activeIndex: -1 };
    } else if (config.type.startsWith("fill")) {
      const { grid, missingIndices, activeIndex, choices } = generateFillRound(config.type);
      return { choices, grid, missingIndices, activeIndex };
    } else if (config.type === "typing") {
      const { grid, missingIndices } = generateTypingRound(state.difficulty);
      return { grid, missingIndices, activeIndex: -1, choices: [] };
    }
    return emptyRoundData();
  }, []);

  const startGame = useCallback(() => {
    const initialState = initialGameState();
    setGameState(initialState);
    setScreen("game");
    setRoundData(generateRound(initialState));
    setStageStars([]);
  }, [generateRound]);

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
      const newScore = stateRef.current.score + points;
      const newState = { ...stateRef.current, score: newScore };

      if (isMatch) {
        const nextRound = stateRef.current.round + 1;
        newState.round = nextRound;
        newState.levelCorrect += 1;
        newState.levelTotal += 1;
        showFeedback(randomPraise("correct"), "correct");
        if (nextRound > config.target) {
          handleLevelComplete(newScore, newState.levelCorrect, newState.levelTotal);
        } else {
          setGameState(newState);
          setRoundData(generateRound(newState));
        }
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
          } else {
            setIsTransitioning(true);
            setGameState(newState);
            showFeedback(randomPraise("correct"), "correct");
            setTimeout(() => {
              setRoundData(generateRound(newState));
              setIsTransitioning(false);
            }, GAME_CONFIG.FEEDBACK_DURATION);
          }
        } else {
          const isUpper = config.type === "fill-upper";
          const alphabet = isUpper ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("") : "abcdefghijklmnopqrstuvwxyz".split("");
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
        }
      }
    } else {
      playSound("wrong");
      const points = config.type === "typing" ? GAME_CONFIG.SCORE_TYPING_WRONG : GAME_CONFIG.SCORE_WRONG;
      const newState = {
        ...stateRef.current,
        score: Math.max(0, stateRef.current.score - points),
        levelTotal: stateRef.current.levelTotal + 1,
      };
      setGameState(newState);
      showFeedback(randomPraise("wrong"), "wrong");
    }
  }, [isTransitioning, roundData, generateRound, playSound, showFeedback]);

  const handleLevelComplete = useCallback((score: number, correct: number, total: number) => {
    playSound("win");
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const stars = calcStars(accuracy);
    setStageStars(prev => [...prev, stars]);
    showFeedback("Level Complete!", "correct");

    const nextLevel = stateRef.current.level + 1;
    if (nextLevel > 4) {
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
      };
      setIsTransitioning(true);
      setGameState(nextState);
      setTimeout(() => {
        setRoundData(generateRound(nextState));
        setIsTransitioning(false);
      }, GAME_CONFIG.FEEDBACK_DURATION + 500);
    }
  }, [playSound, showFeedback, generateRound]);

  const finishGame = useCallback((score: number) => {
    playSound("win");
    setGameState(prev => ({ ...prev, score }));
    setScreen("victory");
  }, [playSound]);

  const checkTyping = useCallback(() => {
    if (isTransitioning) return;
    const config = LEVELS[4];
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
      const newState: GameState = {
        ...stateRef.current,
        score: newScore,
        winsInLevel: newWins,
        difficulty: newDifficulty,
        consecutiveErrors: 0,
        levelCorrect: stateRef.current.levelCorrect + stateRef.current.difficulty,
        levelTotal: stateRef.current.levelTotal + stateRef.current.difficulty,
      };

      if (newWins >= config.target) {
        handleLevelComplete(newScore, newState.levelCorrect, newState.levelTotal);
      } else {
        setIsTransitioning(true);
        setGameState(newState);
        showFeedback(randomPraise("correct"), "correct");
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
      };

      if (newErrors >= GAME_CONFIG.ERROR_THRESHOLD) {
        showFeedback("Difficulty decreased!", "wrong");
        const easierState = {
          ...newState,
          difficulty: Math.max(1, stateRef.current.difficulty - 1),
          consecutiveErrors: 0,
        };
        setGameState(easierState);
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
  }, [isTransitioning, roundData, playSound, showFeedback, handleLevelComplete]);

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
        {screen === "menu" && <MenuScreen onStart={startGame} />}

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
          />
        )}

        {screen === "victory" && (
          <VictoryScreen score={gameState.score} stageStars={stageStars} />
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