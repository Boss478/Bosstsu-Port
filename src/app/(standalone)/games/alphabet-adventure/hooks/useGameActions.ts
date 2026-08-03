'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { CardTier } from '../cards/cards';
import {
  rollCardDrop,
  rollWinDrop,
  resolveDropTier,
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
  ALPHABET_UPPER,
  ALPHABET_LOWER,
  generateMatchRound,
  generateThaiRevertRound,
  generatePhonicsRevertRound,
  generateFillRound,
  generateFillChoices,
  generateTypingRound,
} from '../constants';
import { loadMapSave } from '../migrateMapSave';
import { playCardSfx, playSingleCorrect, playWrong } from '../sfx';
import {
  checkAndAward,
  getPlayStats,
  type Achievement,
  type AchievementContext,
} from '../achievements';

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

  const [dropPower, setDropPower] = useState(() => loadCollection().dropPower || 0);
  const [dropStreak, setDropStreak] = useState(0);
  const [streakToast, setStreakToast] = useState('');
  const [cardReveal, setCardReveal] = useState<{
    letter: string;
    tier: CardTier;
    isNew: boolean;
  } | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showCollectionOverlay, setShowCollectionOverlay] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  const stateRef = useRef(gameState);
  const dropStreakRef = useRef(0);
  const streakToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongsInSubStageRef = useRef(0);
  const subStageStartRef = useRef(0);
  const lastAnswerTimeRef = useRef(0);
  const fastAnswerRef = useRef(0);
  const comebackArmedRef = useRef(false);
  const revisitRef = useRef(false);
  const cardsInSubStageRef = useRef(0);
  const consecutiveWrongsRef = useRef(0);
  const maxConsecutiveWrongsRef = useRef(0);
  const consecutiveDropsRef = useRef(0);
  const noDropStreakRef = useRef(0);
  const firstAnswerRef = useRef(true);
  const firstAnswerDroppedRef = useRef(false);
  const completionCtxRef = useRef<Partial<AchievementContext> | null>(null);
  const cardDroppedRef = useRef(false);
  const revealPendingRef = useRef(false);
  const pendingCompleteRef = useRef<SubStageResult | null>(null);

  const runAchievementCheck = useCallback((extra?: Partial<AchievementContext>) => {
    const collection = loadCollection();
    const map = loadMapSave();
    const tierCounts: Record<CardTier, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      'ultra-rare': 0,
      legendary: 0,
    };
    const lettersByTier: Record<string, Set<CardTier>> = {};
    for (const card of collection.cards) {
      tierCounts[card.tier]++;
      (lettersByTier[card.letter] ??= new Set()).add(card.tier);
    }
    const stats = getPlayStats();
    const ctx: AchievementContext = {
      cardCount: collection.cards.length,
      tierCounts,
      letterFull: Object.values(lettersByTier).some((tiers) => tiers.size === 5),
      currentStreak: stateRef.current.currentStreak,
      bestStreak: stateRef.current.bestStreak,
      stagesCompleted: map.stages.filter((s) => s.completed).length,
      subStagesCompleted: map.stages.reduce(
        (n, s) => n + s.subStages.filter((ss) => ss.completed).length,
        0,
      ),
      starCount: map.stages.reduce((n, s) => n + s.subStages.reduce((m, ss) => m + ss.stars, 0), 0),
      totalScore: map.totalScore,
      letterTracker: { ...letterTrackerRef.current },
      dropPower: dropPowerRef.current,
      logoTaps: stats.logoTaps,
      perfectCount: stats.perfectCount,
      revisit: revisitRef.current,
      stagePerfect: map.stages.some(
        (s) => s.subStages.length > 0 && s.subStages.every((ss) => ss.completed && ss.stars === 3),
      ),
      consecutiveDrops: consecutiveDropsRef.current,
      noDropStreak: noDropStreakRef.current,
      earlyBird: firstAnswerDroppedRef.current,
      quickFastStreak: fastAnswerRef.current,
      rebuiltStreak: stateRef.current.currentStreak >= 10 && comebackArmedRef.current,
      ...(completionCtxRef.current ?? {}),
      ...extra,
    };
    completionCtxRef.current = null;
    const unlocked = checkAndAward(ctx);
    if (unlocked.length > 0) {
      setNewAchievements((prev) => [...prev, ...unlocked]);
    }
  }, []);

  useEffect(() => {
    stateRef.current = gameState;
  });

  useEffect(() => {
    dropPowerRef.current = dropPower;
  }, [dropPower]);

  useEffect(() => {
    return () => {
      if (streakToastRef.current) clearTimeout(streakToastRef.current);
      if (cardRevealTimerRef.current) clearTimeout(cardRevealTimerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const showFeedback = useCallback(
    (text: string, type: 'correct' | 'wrong', showCorrect?: string) => {
      setFeedback({ text, type, showCorrect });
      const duration =
        type === 'correct'
          ? GAME_CONFIG.FEEDBACK_DURATION_CORRECT
          : GAME_CONFIG.FEEDBACK_DURATION_WRONG;
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => setFeedback({ text: '', type: '' }), duration);
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
      initialTracker?: Record<string, LetterTracker>,
    ) => {
      subStageRef.current = subStage;
      onCompleteRef.current = onComplete;

      const initialState = initialGameState();
      if (easyMode) initialState.easyMode = true;
      setCurrentStageId(stageId);
      setCurrentSubStageId(subId);
      setGameState(initialState);
      setRoundData(generateRound(initialState));
      setFeedback({ text: '', type: '' });
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
      setIsTransitioning(false);
      cardDroppedRef.current = false;
      dropStreakRef.current = 0;
      setDropStreak(0);
      sessionLetterStatsRef.current = {};
      wrongsInSubStageRef.current = 0;
      subStageStartRef.current = Date.now();
      lastAnswerTimeRef.current = 0;
      fastAnswerRef.current = 0;
      comebackArmedRef.current = false;
      cardsInSubStageRef.current = 0;
      consecutiveWrongsRef.current = 0;
      maxConsecutiveWrongsRef.current = 0;
      firstAnswerRef.current = true;
      firstAnswerDroppedRef.current = false;
      revisitRef.current = loadMapSave().stages[stageId - 1]?.subStages[subId]?.completed ?? false;
      if (initialTracker && Object.keys(letterTrackerRef.current).length === 0) {
        letterTrackerRef.current = { ...initialTracker };
      }

      trackCustomEvent('substage_start', {
        game: 'alphabet-adventure',
        stageId,
        subId,
        type: subStage.type,
      });
    },
    [generateRound, trackCustomEvent],
  );

  const startPracticeSession = useCallback(
    (letters: string[], onComplete: (result: SubStageResult) => void) => {
      if (letters.length === 0) return;

      const practiceConfig: SubStageConfig = {
        id: 0,
        name: 'Practice',
        subtitle: letters.join(' '),
        type: 'match',
        letterPool: letters,
        targetMin: letters.length * 5,
      };

      subStageRef.current = practiceConfig;
      onCompleteRef.current = onComplete;

      const initialState = initialGameState();
      initialState.easyMode = true;
      setCurrentStageId(0);
      setCurrentSubStageId(0);
      setGameState(initialState);
      setRoundData(generateRound(initialState));
      setFeedback({ text: '', type: '' });
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
      setIsTransitioning(false);
      cardDroppedRef.current = false;
      dropStreakRef.current = 0;
      setDropStreak(0);
      sessionLetterStatsRef.current = {};
      wrongsInSubStageRef.current = 0;
      subStageStartRef.current = Date.now();
      lastAnswerTimeRef.current = 0;
      fastAnswerRef.current = 0;
      comebackArmedRef.current = false;
      cardsInSubStageRef.current = 0;
      consecutiveWrongsRef.current = 0;
      maxConsecutiveWrongsRef.current = 0;
      firstAnswerRef.current = true;
      firstAnswerDroppedRef.current = false;
      revisitRef.current = false;
    },
    [generateRound],
  );

  const applyCardDrop = useCallback(
    (tier: CardTier) => {
      playCardSfx(tier);
      dropStreakRef.current = Math.max(0, dropStreakRef.current - 5);
      setDropStreak(dropStreakRef.current);
      const newPower = Math.min(10, dropPowerRef.current + 1);
      dropPowerRef.current = newPower;
      setDropPower(newPower);
      cardsInSubStageRef.current += 1;
      consecutiveDropsRef.current += 1;
      noDropStreakRef.current = 0;
      if (firstAnswerRef.current) firstAnswerDroppedRef.current = true;
      const collection = loadCollection();
      collection.dropPower = newPower;
      saveCollection(collection);
      const letter = pickLetter(tier, collection);
      const { isNew } = addCard(letter, tier);
      revealPendingRef.current = true;
      setIsTransitioning(true);
      setCardReveal({ letter, tier, isNew });
    },
    [setDropStreak, setDropPower, setCardReveal, setIsTransitioning],
  );

  const handleSubStageComplete = useCallback(
    (score: number, correct: number, total: number) => {
      const sub = subStageRef.current;
      if (!sub) return;

      const winTier = revealPendingRef.current ? null : rollWinDrop();
      if (winTier) {
        cardDroppedRef.current = true;
        applyCardDrop(resolveDropTier(winTier));
      }

      const accuracy = total > 0 ? (correct / total) * 100 : 0;
      const stars = calcStars(accuracy);

      completionCtxRef.current = {
        accuracyPercent: accuracy,
        lessonSeconds:
          subStageStartRef.current > 0 ? (Date.now() - subStageStartRef.current) / 1000 : undefined,
        easyModeOff: !stateRef.current.easyMode,
        lessonPerfect: accuracy >= 100,
        isPractice: sub.id === 0,
        cardsInSubStage: cardsInSubStageRef.current,
        quickFastStreak: fastAnswerRef.current,
        rebuiltStreak: stateRef.current.currentStreak >= 10 && comebackArmedRef.current,
        maxConsecutiveWrongs: maxConsecutiveWrongsRef.current,
        perfectMan: (sub.letterPool?.length ?? 0) === 26 && wrongsInSubStageRef.current === 0,
        jackpot: winTier === 'legendary' && sub.id !== 0,
        firstTry: stars === 3 && !revisitRef.current,
      };

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
      if (revealPendingRef.current) return;
      onCompleteRef.current?.(result);
      onCompleteRef.current = null;
      subStageRef.current = null;
    },
    [applyCardDrop],
  );

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
        setRoundData(generateRound(newState));
      }
    },
    [generateRound, handleSubStageComplete],
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
          applyCardDrop(resolveDropTier(tier));
        }

        if (!cardDropped) {
          playSingleCorrect();
          consecutiveDropsRef.current = 0;
          noDropStreakRef.current += 1;
        }

        const answerNow = Date.now();
        if (firstAnswerRef.current) firstAnswerRef.current = false;
        consecutiveWrongsRef.current = 0;
        const isFirstTry = stateRef.current.wrongAttempts === 0;
        fastAnswerRef.current =
          isFirstTry &&
          (lastAnswerTimeRef.current === 0 || answerNow - lastAnswerTimeRef.current < 3000)
            ? fastAnswerRef.current + 1
            : 0;
        lastAnswerTimeRef.current = answerNow;

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

        const letter = isMatch ? correct!.toUpperCase() : correct!;
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
        runAchievementCheck();

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
            } else {
              setIsTransitioning(true);
              setGameState(newState);
              showFeedback(randomPraise('correct'), 'correct');
              runAchievementCheck();
              transitionTimerRef.current = setTimeout(() => {
                setRoundData(generateRound(newState));
                if (!revealPendingRef.current) setIsTransitioning(false);
              }, GAME_CONFIG.FEEDBACK_DURATION_CORRECT);
            }
          } else {
            const pool = sub.letterPool;
            if (!pool) return;
            const nextActive = nextMissing[0];
            const alphabet = sub.type === 'fill-upper' ? ALPHABET_UPPER : ALPHABET_LOWER;
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
          }
        }
      } else {
        cardDroppedRef.current = false;
        dropStreakRef.current = 0;
        setDropStreak(0);
        setStreakToast('');
        wrongsInSubStageRef.current += 1;
        if (firstAnswerRef.current) firstAnswerRef.current = false;
        consecutiveWrongsRef.current += 1;
        maxConsecutiveWrongsRef.current = Math.max(
          maxConsecutiveWrongsRef.current,
          consecutiveWrongsRef.current,
        );
        fastAnswerRef.current = 0;
        comebackArmedRef.current = true;
        consecutiveDropsRef.current = 0;
        noDropStreakRef.current = 0;
        lastAnswerTimeRef.current = Date.now();
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

        const letter = isMatch ? correct!.toUpperCase() : correct!;
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
          setIsTransitioning(true);
          transitionTimerRef.current = setTimeout(() => {
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
      runAchievementCheck,
      applyCardDrop,
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
      const answerNow = Date.now();
      consecutiveWrongsRef.current = 0;
      const isFirstTry = stateRef.current.wrongAttempts === 0;
      fastAnswerRef.current =
        isFirstTry &&
        (lastAnswerTimeRef.current === 0 || answerNow - lastAnswerTimeRef.current < 3000)
          ? fastAnswerRef.current + 1
          : 0;
      lastAnswerTimeRef.current = answerNow;
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
      const newStreak = stateRef.current.currentStreak + 1;
      const newState: GameState = {
        ...stateRef.current,
        score: newScore,
        winsInLevel: newWins,
        consecutiveErrors: 0,
        levelCorrect: stateRef.current.levelCorrect + 1,
        levelTotal: stateRef.current.levelTotal + 1,
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
      runAchievementCheck();

      if (newWins >= target) {
        handleSubStageComplete(newScore, newState.levelCorrect, newState.levelTotal);
      } else {
        setIsTransitioning(true);
        setGameState(newState);
        transitionTimerRef.current = setTimeout(() => {
          const round = generateTypingRound(pool || []);
          setRoundData({ choices: [], wrongChoices: [], ...round });
          if (!revealPendingRef.current) setIsTransitioning(false);
        }, GAME_CONFIG.FEEDBACK_DURATION_CORRECT);
      }
    } else {
      cardDroppedRef.current = false;
      const wrongCellCount = newGrid.filter((g) => g.isWrong).length;
      if (wrongCellCount > 0) {
        wrongsInSubStageRef.current += wrongCellCount;
        if (firstAnswerRef.current) firstAnswerRef.current = false;
        consecutiveWrongsRef.current += wrongCellCount;
        maxConsecutiveWrongsRef.current = Math.max(
          maxConsecutiveWrongsRef.current,
          consecutiveWrongsRef.current,
        );
        fastAnswerRef.current = 0;
        comebackArmedRef.current = true;
        consecutiveDropsRef.current = 0;
        noDropStreakRef.current = 0;
        lastAnswerTimeRef.current = Date.now();
      }
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

      newGrid.filter((g) => g.isWrong).forEach((g) => trackLetter(g.char, false));

      const typingWrongLetters = newGrid.filter((g) => g.isWrong).map((g) => g.char);
      const newErrors = stateRef.current.consecutiveErrors + 1;
      const newState: GameState = {
        ...stateRef.current,
        score: Math.max(0, stateRef.current.score - GAME_CONFIG.SCORE_TYPING_WRONG),
        consecutiveErrors: newErrors,
        levelTotal: stateRef.current.levelTotal + 1,
        currentStreak: 0,
        wrongAttempts: stateRef.current.wrongAttempts + 1,
        wrongLetters: [...stateRef.current.wrongLetters, ...typingWrongLetters],
      };
      const pool = sub.letterPool;

      if (newErrors >= GAME_CONFIG.ERROR_THRESHOLD) {
        showFeedback('Take a breather!', 'wrong');
        const easierState = {
          ...newState,
          consecutiveErrors: 0,
        };
        setGameState(easierState);
        setIsTransitioning(true);
        transitionTimerRef.current = setTimeout(() => {
          const round = generateTypingRound(pool || []);
          setRoundData({ choices: [], wrongChoices: [], ...round });
          setIsTransitioning(false);
        }, GAME_CONFIG.FEEDBACK_DURATION_WRONG + 500);
      } else {
        setGameState(newState);
        showFeedback(randomPraise('wrong'), 'wrong');
        setIsTransitioning(true);
        transitionTimerRef.current = setTimeout(() => {
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
    handleSubStageComplete,
    trackCustomEvent,
    showFeedback,
    trackLetter,
    currentStageId,
    runAchievementCheck,
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
    revealPendingRef.current = false;
    setIsTransitioning(false);
    setCardReveal(null);
    if (pendingCompleteRef.current) {
      const result = pendingCompleteRef.current;
      pendingCompleteRef.current = null;
      onCompleteRef.current?.(result);
      onCompleteRef.current = null;
    }
  }, [setIsTransitioning]);

  const effectiveStreak = getEffectiveStreak(dropStreak, dropPower);

  const game = {
    gameState,
    roundData,
    feedback,
    isTransitioning,
  };

  const cardSystem = {
    streakToast,
    cardReveal,
    showCollectionOverlay,
    setShowCollectionOverlay,
    dropPower,
    effectiveStreak,
    dropStreak,
    handleCardKeep,
    newAchievements,
  };

  const debug = {
    showDebug,
    setShowDebug,
  };

  const actions = {
    startSubStage,
    startPracticeSession,
    handleAnswer,
    checkTyping,
    handleSelectCell,
    handleTypingInput,
    runAchievementCheck,
  };

  const ids = {
    currentStageId,
    currentSubStageId,
  };

  return { game, cardSystem, debug, actions, ids };
}
