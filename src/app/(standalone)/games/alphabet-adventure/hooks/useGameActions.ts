'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { CardTier } from '../cards/cards';
import {
  rollCardDrop,
  pickLetter,
  addCard,
  getEffectiveStreak,
  loadCollection,
  saveCollection,
} from '../cards/cards';
import type {
  SubStageConfig,
  GameState,
  RoundData,
  FeedbackState,
  GridCell,
  LetterTracker,
} from '../types';
import { initialGameState, emptyRoundData } from '../types';
import { pushAnalytics } from '../analytics';
import { useAnalytics } from '@/lib/analytics';
import {
  GAME_CONFIG,
  randomPraise,
  streakPraise,
  calcStars,
  generateMatchRound,
  generateThaiRevertRound,
  generatePhonicsRevertRound,
  generateFillRound,
  generateFillChoices,
  generateTypingRound,
} from '../constants';
import { loadMapSave } from '../migrateMapSave';
import { playCardSfx, playSingleCorrect, playWrong } from '../sfx';

const CHECKPOINT_KEY = 'alphabet-adventure-checkpoint';

function saveCheckpoint(state: GameState, stageId: number, subStageId: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHECKPOINT_KEY, JSON.stringify({ stageId, subStageId, gameState: state }));
}

function clearCheckpoint() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CHECKPOINT_KEY);
}

export function loadCheckpoint(): {
  stageId: number;
  subStageId: number;
  gameState: GameState;
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CHECKPOINT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export interface SubStageResult {
  score: number;
  correct: number;
  total: number;
  stars: number;
  letterTracker: Record<string, LetterTracker>;
  sessionLetterStats: Record<string, { correct: number; wrong: number }>;
  bestStreak: number;
  subStageName: string;
}

export function useGameActions() {
  const { trackCustomEvent } = useAnalytics();
  const dropPowerRef = useRef(0);

  const subStageRef = useRef<SubStageConfig | null>(null);
  const onCompleteRef = useRef<((result: SubStageResult) => void) | null>(null);
  const letterTrackerRef = useRef<Record<string, LetterTracker>>({});
  const sessionLetterStatsRef = useRef<Record<string, { correct: number; wrong: number }>>({});

  const [gameState, setGameState] = useState<GameState>(initialGameState());
  const [roundData, setRoundData] = useState<RoundData>(emptyRoundData());
  const [feedback, setFeedback] = useState<FeedbackState>({ text: '', type: '' });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentStageId, setCurrentStageId] = useState(0);
  const [currentSubStageId, setCurrentSubStageId] = useState(0);

  const [hasSavedProgress] = useState(() => {
    if (typeof window === 'undefined') return false;
    const data = loadMapSave();
    return data.stages.some((s) => s.subStages.some((ss) => ss.completed));
  });

  const [dropPower, setDropPower] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return loadCollection().dropPower || 0;
  });
  const [dropStreak, setDropStreak] = useState(0);
  const [lastCardDropped, setLastCardDropped] = useState<{
    letter: string;
    tier: CardTier;
    isNew: boolean;
  } | null>(null);
  const [streakToast, setStreakToast] = useState('');
  const [cardReveal, setCardReveal] = useState<{
    letter: string;
    tier: CardTier;
    isNew: boolean;
  } | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showCollectionOverlay, setShowCollectionOverlay] = useState(false);

  const stateRef = useRef(gameState);
  const dropStreakRef = useRef(0);
  const cardToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streakToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardDroppedRef = useRef(false);
  const pendingCompleteRef = useRef<SubStageResult | null>(null);

  useEffect(() => {
    stateRef.current = gameState;
  });

  useEffect(() => {
    dropPowerRef.current = dropPower;
  }, [dropPower]);

  useEffect(() => {
    return () => {
      if (cardToastRef.current) clearTimeout(cardToastRef.current);
      if (streakToastRef.current) clearTimeout(streakToastRef.current);
      if (cardRevealTimerRef.current) clearTimeout(cardRevealTimerRef.current);
    };
  }, []);

  const showFeedback = useCallback(
    (text: string, type: 'correct' | 'wrong', showCorrect?: string) => {
      setFeedback({ text, type, showCorrect });
      const duration =
        type === 'correct'
          ? GAME_CONFIG.FEEDBACK_DURATION_CORRECT
          : GAME_CONFIG.FEEDBACK_DURATION_WRONG;
      setTimeout(() => setFeedback({ text: '', type: '' }), duration);
    },
    [],
  );

  const generateRound = useCallback((state: GameState): RoundData => {
    const sub = subStageRef.current;
    if (!sub) return emptyRoundData();

    const numChoices = state.easyMode ? 2 : 3;

    if (sub.type === 'match') {
      const pool = sub.letterPool;
      if (!pool) return emptyRoundData();

      const sortedPool = [...pool].sort((a, b) => {
        const ta = letterTrackerRef.current[a.toUpperCase()];
        const tb = letterTrackerRef.current[b.toUpperCase()];
        const accA = ta ? ta.correct / ta.total : 1;
        const accB = tb ? tb.correct / tb.total : 1;
        return accA - accB;
      });

      if (sub.dataPool === 'thai') {
        const { targetLetter, correctChar, choices } = generateThaiRevertRound(
          state.round,
          sortedPool,
          numChoices,
        );
        return {
          targetLetter,
          correctChar,
          choices,
          grid: [],
          missingIndices: [],
          activeIndex: -1,
          revert: true,
          wrongChoices: [],
        };
      }
      if (sub.dataPool === 'phonics') {
        const { targetLetter, correctChar, choices } = generatePhonicsRevertRound(
          state.round,
          sortedPool,
          numChoices,
        );
        return {
          targetLetter,
          correctChar,
          choices,
          grid: [],
          missingIndices: [],
          activeIndex: -1,
          revert: true,
          wrongChoices: [],
        };
      }
      const { targetLetter, correctChar, choices } = generateMatchRound(
        state.round,
        sortedPool,
        numChoices,
      );
      return {
        targetLetter,
        correctChar,
        choices,
        grid: [],
        missingIndices: [],
        activeIndex: -1,
        wrongChoices: [],
      };
    } else if (sub.type === 'fill-upper' || sub.type === 'fill-lower') {
      const numFillChoices = state.easyMode ? 3 : 4;
      const pool = sub.letterPool;
      const hidden = sub.hideLetters;
      if (!pool || !hidden) return emptyRoundData();
      const { grid, missingIndices, activeIndex, choices } = generateFillRound(
        sub.type,
        hidden,
        pool,
        numFillChoices,
      );
      return { choices, grid, missingIndices, activeIndex, wrongChoices: [] };
    } else if (sub.type === 'typing') {
      const pool = sub.letterPool;
      if (!pool) return emptyRoundData();
      const { grid, missingIndices } = generateTypingRound(pool);
      return { grid, missingIndices, activeIndex: -1, choices: [], wrongChoices: [] };
    }
    return emptyRoundData();
  }, []);

  const startSubStage = useCallback(
    (
      subStage: SubStageConfig,
      stageId: number,
      subId: number,
      onComplete: (result: SubStageResult) => void,
      easyMode?: boolean,
    ) => {
      subStageRef.current = subStage;
      onCompleteRef.current = onComplete;
      clearCheckpoint();

      const initialState = initialGameState();
      if (easyMode) initialState.easyMode = true;
      setCurrentStageId(stageId);
      setCurrentSubStageId(subId);
      setGameState(initialState);
      setRoundData(generateRound(initialState));
      setFeedback({ text: '', type: '' });
      setIsTransitioning(false);
      cardDroppedRef.current = false;
      dropStreakRef.current = 0;
      setDropStreak(0);
      sessionLetterStatsRef.current = {};

      trackCustomEvent('substage_start', {
        game: 'alphabet-adventure',
        stageId,
        subId,
        type: subStage.type,
      });
    },
    [generateRound, trackCustomEvent],
  );

  const handleSubStageComplete = useCallback((score: number, correct: number, total: number) => {
    const sub = subStageRef.current;
    if (!sub) return;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const stars = calcStars(accuracy);

    const result: SubStageResult = {
      score,
      correct,
      total,
      stars,
      letterTracker: { ...letterTrackerRef.current },
      sessionLetterStats: { ...sessionLetterStatsRef.current },
      bestStreak: stateRef.current.bestStreak,
      subStageName: subStageRef.current?.name ?? '',
    };

    pendingCompleteRef.current = result;
    onCompleteRef.current?.(result);
    onCompleteRef.current = null;
    subStageRef.current = null;
    clearCheckpoint();
  }, []);

  const trackLetter = useCallback((letter: string, correct: boolean) => {
    const t = letterTrackerRef.current;
    const entry = t[letter] || { correct: 0, total: 0 };
    t[letter] = { correct: entry.correct + (correct ? 1 : 0), total: entry.total + 1 };
    const s = sessionLetterStatsRef.current;
    if (!s[letter]) s[letter] = { correct: 0, wrong: 0 };
    if (correct) s[letter].correct++;
    else s[letter].wrong++;
  }, []);

  const advanceMatchRound = useCallback(
    (currentState: GameState, newScore: number, newLevelCorrect: number, newLevelTotal: number) => {
      const sub = subStageRef.current;
      if (!sub) return;

      const nextRound = currentState.round + 1;
      const newState = {
        ...currentState,
        score: newScore,
        round: nextRound,
        levelCorrect: newLevelCorrect,
        levelTotal: newLevelTotal,
        wrongAttempts: 0,
      };

      if (nextRound > sub.targetMin) {
        handleSubStageComplete(newScore, newLevelCorrect, newLevelTotal);
      } else {
        setGameState(newState);
        saveCheckpoint(newState, currentStageId, currentSubStageId);
        setRoundData(generateRound(newState));
      }
    },
    [generateRound, handleSubStageComplete, currentStageId, currentSubStageId],
  );

  const handleAnswer = useCallback(
    (selected: string) => {
      if (isTransitioning) return;
      const sub = subStageRef.current;
      if (!sub) return;

      const isMatch = sub.type === 'match';
      const correct = isMatch ? roundData.correctChar : roundData.grid[roundData.activeIndex]?.char;

      if (selected === correct) {
        let cardDropped = false;

        dropStreakRef.current += 1;
        setDropStreak(dropStreakRef.current);
        const tier = rollCardDrop(dropStreakRef.current, dropPowerRef.current);
        if (tier) {
          cardDropped = true;
          cardDroppedRef.current = true;
          playCardSfx(tier);
          dropStreakRef.current = Math.max(0, dropStreakRef.current - 5);
          setDropStreak(dropStreakRef.current);
          const newPower = Math.min(10, dropPowerRef.current + 1);

          dropPowerRef.current = newPower;
          setDropPower(newPower);
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
            }, 2000);
          }
        }

        if (!cardDropped) {
          playSingleCorrect();
        }

        trackCustomEvent('game_correct', {
          game: 'alphabet-adventure',
          stageId: currentStageId,
          type: sub.type,
          letter: isMatch ? roundData.targetLetter || correct! : correct!,
          streak: stateRef.current.currentStreak + 1,
          cardDropped,
        });
        pushAnalytics({
          type: 'correct',
          level: currentStageId,
          letter: sub.type === 'match' ? roundData.targetLetter || correct! : correct!,
          streak: stateRef.current.currentStreak + 1,
        });

        const letter = isMatch ? roundData.targetLetter || correct! : correct!;
        trackLetter(letter, true);

        const points =
          sub.type === 'typing' ? GAME_CONFIG.SCORE_TYPING_CORRECT : GAME_CONFIG.SCORE_CORRECT;
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
          streakToastRef.current = setTimeout(() => setStreakToast(''), 1500);
        }
        showFeedback(`${randomPraise('correct')} +${points}`, 'correct');

        if (isMatch) {
          advanceMatchRound(newState, newScore, newState.levelCorrect + 1, newState.levelTotal + 1);
        } else {
          const newGrid = [...roundData.grid];
          newGrid[roundData.activeIndex] = {
            ...newGrid[roundData.activeIndex],
            isHidden: false,
            isCorrect: true,
          };
          const nextMissing = roundData.missingIndices.filter((i) => i !== roundData.activeIndex);
          newState.levelCorrect += 1;
          newState.levelTotal += 1;

          if (nextMissing.length === 0) {
            const newWins = stateRef.current.winsInLevel + 1;
            newState.winsInLevel = newWins;
            if (newWins >= sub.targetMin!) {
              handleSubStageComplete(newScore, newState.levelCorrect, newState.levelTotal);
              saveCheckpoint(newState, currentStageId, currentSubStageId);
            } else {
              setIsTransitioning(true);
              setGameState(newState);
              saveCheckpoint(newState, currentStageId, currentSubStageId);
              showFeedback(randomPraise('correct'), 'correct');
              setTimeout(() => {
                setRoundData(generateRound(newState));
                setIsTransitioning(false);
              }, GAME_CONFIG.FEEDBACK_DURATION_CORRECT);
            }
          } else {
            const pool = sub.letterPool;
            if (!pool) return;
            const nextActive = nextMissing[0];
            const alphabet =
              sub.type === 'fill-upper'
                ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
                : 'abcdefghijklmnopqrstuvwxyz'.split('');
            const nextCorrect = alphabet[nextActive];
            const numFillChoices = stateRef.current.easyMode ? 3 : 4;
            const choices = generateFillChoices(nextCorrect, numFillChoices, pool);
            setRoundData({
              ...roundData,
              grid: newGrid,
              missingIndices: nextMissing,
              activeIndex: nextActive,
              choices,
              wrongChoices: [],
            });
            setGameState(newState);
            saveCheckpoint(newState, currentStageId, currentSubStageId);
          }
        }
      } else {
        cardDroppedRef.current = false;
        dropStreakRef.current = 0;
        setDropStreak(0);
        setStreakToast('');
        if (cardRevealTimerRef.current) {
          clearTimeout(cardRevealTimerRef.current);
          cardRevealTimerRef.current = null;
        }
        if (streakToastRef.current) {
          clearTimeout(streakToastRef.current);
          streakToastRef.current = null;
        }
        playWrong();

        trackCustomEvent('game_wrong', {
          game: 'alphabet-adventure',
          stageId: currentStageId,
          type: sub.type,
          letter: isMatch ? roundData.targetLetter || correct! : correct!,
        });
        pushAnalytics({
          type: 'wrong',
          level: currentStageId,
          letter: isMatch ? roundData.targetLetter || correct! : correct!,
          streak: 0,
        });

        const letter = isMatch ? roundData.targetLetter || correct! : correct!;
        trackLetter(letter, false);

        const points =
          sub.type === 'typing' ? GAME_CONFIG.SCORE_TYPING_WRONG : GAME_CONFIG.SCORE_WRONG;
        const newWrongLetters = isMatch
          ? roundData.targetLetter
            ? [...stateRef.current.wrongLetters, roundData.targetLetter]
            : stateRef.current.wrongLetters
          : correct
            ? [...stateRef.current.wrongLetters, correct]
            : stateRef.current.wrongLetters;
        const newState = {
          ...stateRef.current,
          score: Math.max(0, stateRef.current.score - points),
          levelTotal: stateRef.current.levelTotal + 1,
          currentStreak: 0,
          wrongAttempts: stateRef.current.wrongAttempts + 1,
          wrongLetters: newWrongLetters,
        };

        const newWrongChoices = [...(roundData.wrongChoices || []), selected];
        setRoundData((prev) => ({ ...prev, wrongChoices: newWrongChoices }));
        setGameState(newState);

        if (isMatch && newState.wrongAttempts >= GAME_CONFIG.WRONG_LIMIT) {
          showFeedback(`${randomPraise('wrong')} -${points}`, 'wrong', correct);
          saveCheckpoint(newState, currentStageId, currentSubStageId);
          setIsTransitioning(true);
          setTimeout(() => {
            advanceMatchRound(newState, newState.score, newState.levelCorrect, newState.levelTotal);
            setIsTransitioning(false);
          }, GAME_CONFIG.FEEDBACK_DURATION_WRONG);
        } else {
          showFeedback(`${randomPraise('wrong')} -${points}`, 'wrong');
        }
      }
    },
    [
      isTransitioning,
      roundData,
      generateRound,
      handleSubStageComplete,
      advanceMatchRound,
      trackCustomEvent,
      showFeedback,
      trackLetter,
      currentStageId,
      currentSubStageId,
    ],
  );

  const checkTyping = useCallback(() => {
    if (isTransitioning) return;
    const sub = subStageRef.current;
    if (!sub || sub.type !== 'typing') return;

    let allCorrect = true;
    const newGrid: GridCell[] = roundData.grid.map((item) => {
      if (!item.isHidden) return item;
      const isCorrect = item.value?.toUpperCase() === item.char.toUpperCase();
      if (!isCorrect) allCorrect = false;
      return { ...item, isCorrect, isWrong: !isCorrect };
    });

    setRoundData({ ...roundData, grid: newGrid });

    if (allCorrect) {
      playSingleCorrect();
      trackCustomEvent('game_correct', {
        game: 'alphabet-adventure',
        stageId: currentStageId,
        type: 'typing',
        letter: roundData.grid
          .filter((g) => g.isHidden)
          .map((g) => g.char)
          .join(''),
        streak: stateRef.current.currentStreak + 1,
      });
      pushAnalytics({
        type: 'correct',
        level: currentStageId,
        letter: roundData.grid
          .filter((g) => g.isHidden)
          .map((g) => g.char)
          .join(''),
        streak: stateRef.current.currentStreak + 1,
      });

      roundData.grid.filter((g) => g.isHidden).forEach((g) => trackLetter(g.char, true));

      const newScore = stateRef.current.score + GAME_CONFIG.SCORE_TYPING_CORRECT;
      const newWins = stateRef.current.winsInLevel + 1;
      const newDifficulty = Math.min(
        GAME_CONFIG.MAX_DIFFICULTY,
        stateRef.current.difficulty + GAME_CONFIG.DIFFICULTY_INCREASE,
      );
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
      const pool = sub.letterPool;
      const target = pool ? pool.length : 26;

      if (newStreak === 3 || newStreak === 5 || (newStreak >= 10 && newStreak % 5 === 0)) {
        if (streakToastRef.current) clearTimeout(streakToastRef.current);
        setStreakToast(streakPraise(newStreak));
        streakToastRef.current = setTimeout(() => setStreakToast(''), 1500);
      }
      showFeedback(`${randomPraise('correct')} +${GAME_CONFIG.SCORE_TYPING_CORRECT}`, 'correct');

      if (newWins >= target) {
        handleSubStageComplete(newScore, newState.levelCorrect, newState.levelTotal);
        saveCheckpoint(newState, currentStageId, currentSubStageId);
      } else {
        setIsTransitioning(true);
        setGameState(newState);
        saveCheckpoint(newState, currentStageId, currentSubStageId);
        setTimeout(() => {
          const round = generateTypingRound(pool || []);
          setRoundData({ choices: [], wrongChoices: [], ...round });
          setIsTransitioning(false);
        }, GAME_CONFIG.FEEDBACK_DURATION_CORRECT);
      }
    } else {
      cardDroppedRef.current = false;
      dropStreakRef.current = 0;
      setDropStreak(0);
      setStreakToast('');
      if (cardRevealTimerRef.current) {
        clearTimeout(cardRevealTimerRef.current);
        cardRevealTimerRef.current = null;
      }
      if (streakToastRef.current) {
        clearTimeout(streakToastRef.current);
        streakToastRef.current = null;
      }
      playWrong();
      trackCustomEvent('game_wrong', {
        game: 'alphabet-adventure',
        stageId: currentStageId,
        type: 'typing',
        letter: roundData.grid
          .filter((g) => g.isHidden)
          .map((g) => g.char)
          .join(''),
      });
      pushAnalytics({
        type: 'wrong',
        level: currentStageId,
        letter: roundData.grid
          .filter((g) => g.isHidden)
          .map((g) => g.char)
          .join(''),
        streak: 0,
      });

      roundData.grid.filter((g) => g.isWrong).forEach((g) => trackLetter(g.char, false));

      const typingWrongLetters = newGrid.filter((g) => g.isWrong).map((g) => g.char);
      const newErrors = stateRef.current.consecutiveErrors + 1;
      const newState: GameState = {
        ...stateRef.current,
        score: Math.max(0, stateRef.current.score - GAME_CONFIG.SCORE_TYPING_WRONG),
        consecutiveErrors: newErrors,
        levelTotal: stateRef.current.levelTotal + stateRef.current.difficulty,
        currentStreak: 0,
        wrongAttempts: stateRef.current.wrongAttempts + 1,
        wrongLetters: [...stateRef.current.wrongLetters, ...typingWrongLetters],
      };
      const pool = sub.letterPool;

      if (newErrors >= GAME_CONFIG.ERROR_THRESHOLD) {
        showFeedback('Difficulty decreased!', 'wrong');
        const easierState = {
          ...newState,
          difficulty: Math.max(1, stateRef.current.difficulty - 1),
          consecutiveErrors: 0,
        };
        setGameState(easierState);
        saveCheckpoint(easierState, currentStageId, currentSubStageId);
        setIsTransitioning(true);
        setTimeout(() => {
          const round = generateTypingRound(pool || []);
          setRoundData({ choices: [], wrongChoices: [], ...round });
          setIsTransitioning(false);
        }, GAME_CONFIG.FEEDBACK_DURATION_WRONG + 500);
      } else {
        setGameState(newState);
        showFeedback(randomPraise('wrong'), 'wrong');
        setIsTransitioning(true);
        setTimeout(() => {
          setRoundData((prev) => ({
            ...prev,
            grid: prev.grid.map((g) => (g.isWrong ? { ...g, isWrong: false } : g)),
          }));
          setIsTransitioning(false);
        }, 800);
      }
    }
  }, [
    isTransitioning,
    roundData,
    generateRound,
    handleSubStageComplete,
    trackCustomEvent,
    showFeedback,
    trackLetter,
    currentStageId,
    currentSubStageId,
  ]);

  const handleSelectCell = useCallback((index: number) => {
    setRoundData((prev) => ({ ...prev, activeIndex: index }));
  }, []);

  const handleTypingInput = useCallback((index: number, value: string) => {
    setRoundData((prev) => {
      const newGrid = [...prev.grid];
      newGrid[index] = { ...newGrid[index], value };
      return { ...prev, grid: newGrid };
    });
  }, []);

  const handleCardKeep = useCallback(() => {
    setCardReveal(null);
    if (pendingCompleteRef.current) {
      const result = pendingCompleteRef.current;
      pendingCompleteRef.current = null;
      onCompleteRef.current?.(result);
      onCompleteRef.current = null;
    }
  }, []);

  return {
    gameState,
    roundData,
    feedback,
    isTransitioning,
    hasSavedProgress,
    lastCardDropped,
    streakToast,
    cardReveal,
    showDebug,
    showCollectionOverlay,
    setShowDebug,
    setShowCollectionOverlay,
    dropPower,
    effectiveStreak: getEffectiveStreak(dropStreak, dropPower),
    dropStreak,
    handleCardKeep,
    startSubStage,
    handleAnswer,
    checkTyping,
    handleSelectCell,
    handleTypingInput,
    currentStageId,
    currentSubStageId,
  };
}
