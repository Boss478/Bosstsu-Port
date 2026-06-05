"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CardTier } from "./cards/cards";
import { rollCardDrop, pickLetter, addCard, getDropRate, getNoneDropRate, getEffectiveStreak, loadCollection, saveCollection, TIER_ORDER, TIER_LABELS, CARD_EMOJIS, CARD_WORDS } from "./cards/cards";
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
  generateThaiRevertRound,
  generatePhonicsRound,
  generatePhonicsRevertRound,
  generateFillRound,
  generateTypingRound,
  PROGRESS_KEY,
} from "./constants";

import MenuScreen from "./screens/MenuScreen";
import GameScreen from "./screens/GameScreen";
import VictoryScreen from "./screens/VictoryScreen";
import CardScreen from "./beta/screens/CardScreen";
import CardRevealModal from "./beta/screens/CardRevealModal";

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

interface Props {
  beta?: boolean;
}

export default function AlphabetAdventureClient({ beta = false }: Props) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [gameState, setGameState] = useState<GameState>(initialGameState());
  const [roundData, setRoundData] = useState<RoundData>(emptyRoundData());
  const [feedback, setFeedback] = useState<FeedbackState>({ text: "", type: "" });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stageStars, setStageStars] = useState<number[]>([]);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [easyMode, setEasyMode] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [lastCardDropped, setLastCardDropped] = useState<{ letter: string; tier: CardTier; isNew: boolean } | null>(null);
  const [streakToast, setStreakToast] = useState("");
  const [cardReveal, setCardReveal] = useState<{ letter: string; tier: CardTier; isNew: boolean } | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showCollectionOverlay, setShowCollectionOverlay] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const { playSound, speak, muted, toggleMute, playSequence, voiceURI, setVoiceURI } = useAudio();

  const stateRef = useRef(gameState);
  const betaRef = useRef(beta);
  const dropStreakRef = useRef(0);
  const dropPowerRef = useRef(0);
  const cardToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streakToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const CARD_TIER_SOUNDS: Record<CardTier, number[]> = {
    common: [500],
    uncommon: [500, 700],
    rare: [500, 700, 900],
    "ultra-rare": [500, 800, 1100, 1300],
    legendary: [523, 659, 784, 1047],
  };

  useEffect(() => {
    stateRef.current = gameState;
  });

  useEffect(() => {
    betaRef.current = beta;
  }, [beta]);

  useEffect(() => {
    setHasSavedProgress(!!loadSavedProgress());
    if (beta) {
      dropPowerRef.current = loadCollection().dropPower || 0;
    }
    const savedVoice = localStorage.getItem("alphabet-adventure-voice");
    if (savedVoice) setVoiceURI(savedVoice);
  }, [beta, setVoiceURI]);

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
        const isRevert = betaRef.current;
        const gen = isRevert ? generateThaiRevertRound : generateThaiRound;
        const { targetLetter, correctChar, choices } = gen(state.round, numChoices);
        return { targetLetter, correctChar, choices, grid: [], missingIndices: [], activeIndex: -1, revert: isRevert };
      }
      if (config.dataPool === "phonics") {
        const isRevert = betaRef.current;
        const gen = isRevert ? generatePhonicsRevertRound : generatePhonicsRound;
        const { targetLetter, correctChar, choices } = gen(state.round, numChoices);
        return { targetLetter, correctChar, choices, grid: [], missingIndices: [], activeIndex: -1, revert: isRevert };
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
      let cardDropped = false;

      if (beta) {
        dropStreakRef.current += 1;
        const tier = rollCardDrop(dropStreakRef.current, dropPowerRef.current);
        if (tier) {
          cardDropped = true;
          playSequence(CARD_TIER_SOUNDS[tier]);
          dropStreakRef.current = 0;
          const newPower = Math.min(10, dropPowerRef.current + 1);
          dropPowerRef.current = newPower;
          const collection = loadCollection();
          collection.dropPower = newPower;
          saveCollection(collection);
          const letter = pickLetter(tier);
          const { isNew } = addCard(letter, tier);
          if (stateRef.current.easyMode) {
            if (cardToastRef.current) clearTimeout(cardToastRef.current);
            setLastCardDropped({ letter, tier, isNew });
            cardToastRef.current = setTimeout(() => setLastCardDropped(null), 2500);
          } else {
            if (cardRevealTimerRef.current) clearTimeout(cardRevealTimerRef.current);
            cardRevealTimerRef.current = setTimeout(() => {
              setCardReveal({ letter, tier, isNew });
            }, 1000);
          }
        }
      }

      if (!cardDropped) {
        playSound("correct");
      }

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

      if (newStreak === 3 || newStreak === 5 || (newStreak >= 10 && newStreak % 5 === 0)) {
        if (streakToastRef.current) clearTimeout(streakToastRef.current);
        setStreakToast(streakPraise(newStreak));
        streakToastRef.current = setTimeout(() => setStreakToast(""), 1500);
      }
      showFeedback(`${randomPraise("correct")} +${points}`, "correct");

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
      dropStreakRef.current = 0;
      setStreakToast("");
      if (cardRevealTimerRef.current) { clearTimeout(cardRevealTimerRef.current); cardRevealTimerRef.current = null; }
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

      if (newStreak === 3 || newStreak === 5 || (newStreak >= 10 && newStreak % 5 === 0)) {
        if (streakToastRef.current) clearTimeout(streakToastRef.current);
        setStreakToast(streakPraise(newStreak));
        streakToastRef.current = setTimeout(() => setStreakToast(""), 1500);
      }
      showFeedback(`${randomPraise("correct")} +${GAME_CONFIG.SCORE_TYPING_CORRECT}`, "correct");

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
      dropStreakRef.current = 0;
      setStreakToast("");
      if (cardRevealTimerRef.current) { clearTimeout(cardRevealTimerRef.current); cardRevealTimerRef.current = null; }
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

  const handleVoiceChange = useCallback((uri: string) => {
    setVoiceURI(uri);
    if (typeof window !== "undefined") {
      if (uri) localStorage.setItem("alphabet-adventure-voice", uri);
      else localStorage.removeItem("alphabet-adventure-voice");
    }
  }, [setVoiceURI]);

  const handleCardKeep = useCallback(() => {
    setCardReveal(null);
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
        {showCards && (
          <CardScreen onBack={() => setShowCards(false)} />
        )}

        {!showCards && screen === "menu" && (
          <MenuScreen
            onStart={() => startGame(undefined, undefined, easyMode)}
            onContinue={continueGame}
            hasProgress={hasSavedProgress}
            easyMode={easyMode}
            onToggleEasy={() => setEasyMode(v => !v)}
            isBeta={beta}
            onShowCards={() => setShowCards(true)}
            voiceURI={voiceURI}
            onVoiceChange={handleVoiceChange}
          />
        )}

        {!showCards && screen === "game" && (
          <>
            {beta && (
              <>
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
                  <span className="inline-block px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                    BETA
                  </span>
                  <button
                    onClick={() => setShowCollectionOverlay(v => !v)}
                    className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all"
                    title="Collection"
                  >
                    <i className="fi fi-sr-template text-xs"></i>
                  </button>
                  <button
                    onClick={() => setShowDebug((v) => !v)}
                    className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all"
                    title="Toggle debug panel"
                  >
                    <i className="fi fi-sr-eye text-xs"></i>
                  </button>
                </div>
                {showDebug && (
                <div className="fixed top-4 left-4 z-50 animate-in fade-in duration-300">
                  <div className="bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl border border-zinc-700 shadow-2xl min-w-[140px]">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                      Eff {getEffectiveStreak(dropStreakRef.current, dropPowerRef.current)} | Drop {dropStreakRef.current} | Pwr {dropPowerRef.current}
                    </p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-zinc-500">None</span>
                        <span className="text-zinc-500 tabular-nums">{getNoneDropRate(getEffectiveStreak(dropStreakRef.current, dropPowerRef.current)).toFixed(0)}%</span>
                      </div>
                      {(() => {
                        const eff = getEffectiveStreak(dropStreakRef.current, dropPowerRef.current);
                        return TIER_ORDER.map((tier) => {
                          const rate = getDropRate(tier, eff);
                          return (
                            <div key={tier} className="flex justify-between text-[10px] font-bold">
                              <span className="text-zinc-400">{TIER_LABELS[tier]}</span>
                              <span className="text-amber-400 tabular-nums">{rate.toFixed(1)}%</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}
              {showCollectionOverlay && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="bg-black/85 backdrop-blur-xl px-5 py-4 rounded-2xl border border-zinc-700 shadow-2xl min-w-[260px]">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Collection</p>
                      <button
                        onClick={() => setShowCollectionOverlay(false)}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <i className="fi fi-sr-cross text-xs"></i>
                      </button>
                    </div>
                    {(() => {
                      const col = loadCollection();
                      const total = col.cards.length;
                      const recent = [...col.cards].sort((a, b) => (b.lastCollected ?? 0) - (a.lastCollected ?? 0)).slice(0, 3);
                      return (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-zinc-300">{total} / 26 cards</span>
                            <span className="text-xs font-bold text-amber-400">{col.totalPoints} pts</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-zinc-700 overflow-hidden">
                            <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${(total / 26) * 100}%` }} />
                          </div>
                          {recent.length > 0 && (
                            <div>
                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Recent</p>
                              <div className="flex gap-2">
                                {recent.map(card => (
                                  <div key={`${card.letter}-${card.tier}`} className="flex items-center gap-1.5 bg-zinc-800/60 px-2 py-1 rounded-lg">
                                    <span className="text-base">{CARD_EMOJIS[card.letter] || "🃏"}</span>
                                    <span className="text-xs font-bold text-zinc-300">{card.letter}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => { setShowCollectionOverlay(false); setShowCards(true); }}
                            className="w-full py-1.5 rounded-lg bg-violet-600/80 hover:bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            View Full Collection
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
              </>
            )}
            {streakToast && (
              <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <div className="bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl border-2 border-orange-400 flex items-center gap-3">
                    <span className="text-lg">🔥</span>
                    <span className="text-sm font-black text-orange-600 dark:text-orange-400 whitespace-nowrap">
                      {streakToast}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {lastCardDropped && (() => {
                  const emojiKey = lastCardDropped.letter.toUpperCase();
                  const emoji = CARD_EMOJIS[emojiKey] || "🃏";
                  const word = CARD_WORDS[emojiKey] || "";
                  const tierColors: Record<string, string> = {
                    common: "border-zinc-300 dark:border-zinc-600 shadow-zinc-400/30",
                    uncommon: "border-green-300 dark:border-green-600 shadow-green-400/30",
                    rare: "border-blue-300 dark:border-blue-600 shadow-blue-400/30",
                    "ultra-rare": "border-purple-300 dark:border-purple-600 shadow-purple-400/30",
                    legendary: "border-amber-300 dark:border-amber-500 shadow-amber-400/40",
                  };
                  const tierBg: Record<string, string> = {
                    common: "bg-zinc-50 dark:bg-zinc-800",
                    uncommon: "bg-green-50 dark:bg-green-900/20",
                    rare: "bg-blue-50 dark:bg-blue-900/20",
                    "ultra-rare": "bg-purple-50 dark:bg-purple-900/20",
                    legendary: "bg-amber-50 dark:bg-amber-900/20",
                  };
                  const borderColor = tierColors[lastCardDropped.tier] || tierColors.common;
                  const bgColor = tierBg[lastCardDropped.tier] || tierBg.common;
                  const label = TIER_LABELS[lastCardDropped.tier] || lastCardDropped.tier;
                  const tierSparkleColor: Record<string, string> = {
                    common: "#a1a1aa",
                    uncommon: "#4ade80",
                    rare: "#60a5fa",
                    "ultra-rare": "#c084fc",
                    legendary: "#fbbf24",
                  };
                  const sparkleColor = tierSparkleColor[lastCardDropped.tier] || "#a1a1aa";
                  return (
                    <>
                      <div className="animate-in zoom-in duration-300 relative">
                        <div className="absolute -top-1 -left-1 w-1.5 h-1.5 rounded-full pointer-events-none opacity-0" style={{ backgroundColor: sparkleColor, animation: "sparkle-pop 1s ease-out forwards", animationDelay: "0s" }} />
                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full pointer-events-none opacity-0" style={{ backgroundColor: sparkleColor, animation: "sparkle-pop 1s ease-out forwards", animationDelay: "0.15s" }} />
                        <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full pointer-events-none opacity-0" style={{ backgroundColor: sparkleColor, animation: "sparkle-pop 1s ease-out forwards", animationDelay: "0.3s" }} />
                        <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 rounded-full pointer-events-none opacity-0" style={{ backgroundColor: sparkleColor, animation: "sparkle-pop 1s ease-out forwards", animationDelay: "0.45s" }} />
                        <div className={`w-44 rounded-2xl border-2 ${borderColor} ${bgColor} shadow-2xl shadow-[0_0_20px_var(--tw-shadow-color)] p-4 flex flex-col items-center gap-1 relative overflow-hidden`}>
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-2xl">{emoji}</span>
                            {lastCardDropped.isNew && (
                              <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded animate-pulse">
                                NEW!
                              </span>
                            )}
                          </div>
                          <span className="text-4xl font-black text-zinc-800 dark:text-zinc-100 leading-none">
                            {lastCardDropped.letter}
                          </span>
                          {word && (
                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                              {word}
                            </span>
                          )}
                          <span className={`text-[9px] font-black uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full ${
                            lastCardDropped.tier === "legendary"
                              ? "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30"
                              : lastCardDropped.tier === "ultra-rare"
                              ? "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30"
                              : lastCardDropped.tier === "rare"
                              ? "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30"
                              : lastCardDropped.tier === "uncommon"
                              ? "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30"
                              : "text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800"
                          }`}>
                            {label}
                          </span>
                        </div>
                      </div>
                      <style>{`@keyframes sparkle-pop{0%{transform:scale(0);opacity:0}40%{transform:scale(1.2);opacity:1}100%{transform:scale(0.3);opacity:0}}`}</style>
                    </>
                  );
                })()}
            {cardReveal && (
              <CardRevealModal
                letter={cardReveal.letter}
                tier={cardReveal.tier}
                isNew={cardReveal.isNew}
                onKeep={handleCardKeep}
                onPlaySound={playSequence}
              />
            )}
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
              onShowCards={beta ? () => setShowCards(true) : undefined}
            />
          </>
        )}

        {!showCards && screen === "victory" && (
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
