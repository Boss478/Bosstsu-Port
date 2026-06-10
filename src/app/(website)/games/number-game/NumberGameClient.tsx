'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '@/hooks/useAudio';
import { getNumberData } from '@/lib/numbers';
import { useAnalytics } from '@/lib/analytics';
import type { Screen, Question, GameState, FeedbackState, RangeOption } from './types';
import { RANGES, EMOJIS, GAME_CONFIG, randomPraise, calcStars } from './constants';
import MenuScreen from './screens/MenuScreen';
import RangeScreen from './screens/RangeScreen';
import GameScreen from './screens/GameScreen';
import VictoryScreen from './screens/VictoryScreen';

function computeStageMax(game: GameState): number {
  if (game.isEndless) return Infinity;
  if (game.stage === 1 && game.sequentialMode) return game.seqTotal + GAME_CONFIG.REVIEW_COUNT;
  return 5;
}

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(correct: string, min: number, max: number): string[] {
  const opts = [correct];
  while (opts.length < 3) {
    const rand = Math.floor(Math.random() * (max - min + 1)) + min;
    const d = getNumberData(rand).eng;
    if (!opts.includes(d)) opts.push(d);
  }
  return fisherYates(opts);
}

function generateQuestion(game: GameState, r: RangeOption): Question {
  let activeStage = game.stage;
  if (game.isEndless) activeStage = Math.floor(Math.random() * 5) + 1;

  if (game.sequentialMode && !game.isEndless && activeStage === 1) {
    if (game.sequentialIndex < game.seqTotal) {
      const targetNum = r.min + game.sequentialIndex;
      const numData = getNumberData(targetNum);
      return {
        text: numData.num.toString(),
        correct: numData.eng,
        options: buildOptions(numData.eng, r.min, r.max),
        stageType: 1,
      };
    }
  }

  if (game.reviewRoundActive && !game.isEndless && activeStage === 1) {
    if (game.reviewIndex < game.reviewNumbers.length) {
      const targetNum = game.reviewNumbers[game.reviewIndex];
      const numData = getNumberData(targetNum);
      return {
        text: numData.num.toString(),
        correct: numData.eng,
        options: buildOptions(numData.eng, r.min, r.max),
        stageType: 1,
      };
    }
  }

  const targetNum = Math.floor(Math.random() * (r.max - r.min + 1)) + r.min;
  const numData = getNumberData(targetNum);

  if (activeStage === 1)
    return {
      text: numData.num.toString(),
      correct: numData.eng,
      options: buildOptions(numData.eng, r.min, r.max),
      stageType: 1,
    };
  if (activeStage === 2) {
    const ans = numData.thai;
    const opts = [ans];
    while (opts.length < 3) {
      const rand = Math.floor(Math.random() * (r.max - r.min + 1)) + r.min;
      const d = getNumberData(rand).thai;
      if (!opts.includes(d)) opts.push(d);
    }
    return {
      text: `${numData.num} ${numData.eng}`,
      correct: ans,
      options: fisherYates(opts),
      stageType: 2,
    };
  }
  if (activeStage === 3)
    return {
      text: `${numData.num} = ${numData.spell}`,
      correct: numData.missing,
      options: fisherYates([numData.missing, ...numData.wrongLetters]),
      stageType: 3,
    };
  if (activeStage === 4) {
    const count = Math.min(20, targetNum);
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const ans = getNumberData(count).eng;
    const opts = [ans];
    while (opts.length < 3) {
      const rand = Math.floor(Math.random() * 20) + 1;
      const d = getNumberData(rand).eng;
      if (!opts.includes(d)) opts.push(d);
    }
    return {
      text: '',
      correct: ans,
      options: fisherYates(opts),
      stageType: 4,
      visualData: { emoji, count },
    };
  }
  if (activeStage === 5) {
    const total = Math.floor(Math.random() * (r.max > 20 ? 19 : r.max - 1)) + 2;
    const a = Math.floor(Math.random() * (total - 1)) + 1;
    const b = total - a;
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const ans = getNumberData(total).eng;
    const opts = [ans];
    while (opts.length < 3) {
      const rand = Math.floor(Math.random() * 20) + 1;
      const d = getNumberData(rand).eng;
      if (!opts.includes(d)) opts.push(d);
    }
    return {
      text: '',
      correct: ans,
      options: fisherYates(opts),
      stageType: 5,
      visualData: { emoji, count: total, countA: a, countB: b },
    };
  }
  return {
    text: numData.num.toString(),
    correct: numData.eng,
    options: buildOptions(numData.eng, r.min, r.max),
    stageType: 1,
  };
}

function initialGameState(r: RangeOption): GameState {
  const seqTotal = r.max - r.min + 1;
  return {
    score: 0,
    stage: 1,
    isEndless: false,
    questionsDone: 0,
    seqTotal,
    sequentialMode: seqTotal <= GAME_CONFIG.SEQUENTIAL_LIMIT,
    sequentialIndex: 0,
    reviewRoundActive: false,
    reviewNumbers: [],
    reviewIndex: 0,
    stageCorrect: 0,
    stageTotal: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    bestStreak: 0,
    currentStreak: 0,
    stageDone: 0,
  };
}

export default function NumberGameClient() {
  const { trackCustomEvent } = useAnalytics();
  const [screen, setScreen] = useState<Screen>('menu');
  const [range, setRange] = useState<RangeOption>(RANGES[0]);
  const [gameState, setGameState] = useState<GameState>(() => initialGameState(RANGES[0]));
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>({ text: '', type: '' });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stageStars, setStageStars] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(gameState);
  const prevStateRef = useRef(gameState);
  const { playSound, speak, muted, toggleMute } = useAudio();

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = gameState;

    if (gameState.stage > prev.stage && prev.stageTotal > 0) {
      const accuracy = Math.round((prev.stageCorrect / prev.stageTotal) * 100);
      setStageStars((s) => [...s, calcStars(accuracy)]);
    }
  }, [gameState.stage, gameState.stageCorrect, gameState.stageTotal]);

  useEffect(() => {
    const header = document.getElementById('site-header');
    const footer = document.getElementById('site-footer');
    if (screen === 'game') {
      header?.classList.add('hidden');
      footer?.classList.add('hidden');
    } else {
      header?.classList.remove('hidden');
      footer?.classList.remove('hidden');
    }
    return () => {
      header?.classList.remove('hidden');
      footer?.classList.remove('hidden');
    };
  }, [screen]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  useEffect(() => {
    const handle = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handle);
    return () => document.removeEventListener('fullscreenchange', handle);
  }, []);

  const startGame = useCallback(
    (r: RangeOption) => {
      setRange(r);
      const initial = initialGameState(r);
      setGameState(initial);
      stateRef.current = initial;
      prevStateRef.current = initial;
      setStageStars([]);
      setScreen('game');
      setCurrentQuestion(generateQuestion(initial, r));
      trackCustomEvent('game_start:number_game', { mode: 'normal', range: r.id });
    },
    [trackCustomEvent],
  );

  const handleAnswer = useCallback(
    (selected: string) => {
      if (!currentQuestion || isTransitioning) return;
      const isCorrect = selected === currentQuestion.correct;

      if (isCorrect) {
        playSound('correct');
        trackCustomEvent('game_correct:number_game', {
          stage: gameState.stage,
          score: gameState.score,
          isEndless: gameState.isEndless,
        });
        const newScore = gameState.score + GAME_CONFIG.SCORE_CORRECT;
        const newStreak = gameState.currentStreak + 1;
        const nextDone = gameState.questionsDone + 1;

        if (gameState.sequentialMode && !gameState.isEndless) {
          const nextIndex = gameState.sequentialIndex + 1;
          if (nextIndex >= gameState.seqTotal) {
            const reviewNums = fisherYates(
              Array.from({ length: gameState.seqTotal }, (_, i) => i + range.min),
            ).slice(0, GAME_CONFIG.REVIEW_COUNT);
            const next = {
              ...gameState,
              score: newScore,
              sequentialMode: false,
              reviewRoundActive: true,
              reviewNumbers: reviewNums,
              reviewIndex: 0,
              questionsDone: nextDone,
              currentStreak: newStreak,
              bestStreak: Math.max(gameState.bestStreak, newStreak),
              totalCorrect: gameState.totalCorrect + 1,
              totalQuestions: gameState.totalQuestions + 1,
              stageCorrect: gameState.stageCorrect + 1,
              stageTotal: gameState.stageTotal + 1,
              stageDone: gameState.stageDone + 1,
            };
            setGameState(next);
            stateRef.current = next;
            setFeedback({ text: `${randomPraise('correct')} +3`, type: 'correct' });
            setIsTransitioning(true);
            setTimeout(() => {
              setFeedback({ text: '', type: '' });
              setIsTransitioning(false);
              setCurrentQuestion(generateQuestion(next, range));
            }, GAME_CONFIG.FEEDBACK_DURATION);
          } else {
            const next = {
              ...gameState,
              score: newScore,
              sequentialIndex: nextIndex,
              questionsDone: nextDone,
              currentStreak: newStreak,
              bestStreak: Math.max(gameState.bestStreak, newStreak),
              totalCorrect: gameState.totalCorrect + 1,
              totalQuestions: gameState.totalQuestions + 1,
              stageCorrect: gameState.stageCorrect + 1,
              stageTotal: gameState.stageTotal + 1,
              stageDone: gameState.stageDone + 1,
            };
            setGameState(next);
            stateRef.current = next;
            setFeedback({ text: `${randomPraise('correct')} +3`, type: 'correct' });
            setIsTransitioning(true);
            setTimeout(() => {
              setFeedback({ text: '', type: '' });
              setIsTransitioning(false);
              setCurrentQuestion(generateQuestion({ ...next, questionsDone: nextDone }, range));
            }, GAME_CONFIG.FEEDBACK_DURATION);
          }
          return;
        }

        if (gameState.reviewRoundActive && !gameState.isEndless) {
          const nextReviewIndex = gameState.reviewIndex + 1;
          if (nextReviewIndex >= gameState.reviewNumbers.length) {
            const next = {
              ...gameState,
              score: newScore,
              stage: 2,
              reviewRoundActive: false,
              questionsDone: nextDone,
              currentStreak: newStreak,
              bestStreak: Math.max(gameState.bestStreak, newStreak),
              totalCorrect: gameState.totalCorrect + 1,
              totalQuestions: gameState.totalQuestions + 1,
              stageCorrect: 0,
              stageTotal: 0,
              stageDone: 0,
            };
            setGameState(next);
            stateRef.current = next;
            setFeedback({ text: `${randomPraise('correct')} +3`, type: 'correct' });
            setIsTransitioning(true);
            setTimeout(() => {
              setFeedback({ text: '', type: '' });
              setIsTransitioning(false);
              setCurrentQuestion(generateQuestion(next, range));
            }, GAME_CONFIG.FEEDBACK_DURATION);
          } else {
            const next = {
              ...gameState,
              score: newScore,
              reviewIndex: nextReviewIndex,
              questionsDone: nextDone,
              currentStreak: newStreak,
              bestStreak: Math.max(gameState.bestStreak, newStreak),
              totalCorrect: gameState.totalCorrect + 1,
              totalQuestions: gameState.totalQuestions + 1,
              stageCorrect: gameState.stageCorrect + 1,
              stageTotal: gameState.stageTotal + 1,
              stageDone: gameState.stageDone + 1,
            };
            setGameState(next);
            stateRef.current = next;
            setFeedback({ text: `${randomPraise('correct')} +3`, type: 'correct' });
            setIsTransitioning(true);
            setTimeout(() => {
              setFeedback({ text: '', type: '' });
              setIsTransitioning(false);
              setCurrentQuestion(generateQuestion(next, range));
            }, GAME_CONFIG.FEEDBACK_DURATION);
          }
          return;
        }

        let nextStage = gameState.stage;
        if (!gameState.isEndless) {
          if (gameState.stage === 1 && nextDone >= GAME_CONFIG.STAGE_1_COUNT) nextStage = 2;
          else if (gameState.stage === 2 && nextDone >= GAME_CONFIG.STAGE_2_COUNT) nextStage = 3;
          else if (gameState.stage === 3 && nextDone >= GAME_CONFIG.STAGE_3_COUNT) nextStage = 4;
          else if (gameState.stage === 4 && nextDone >= GAME_CONFIG.STAGE_4_COUNT) nextStage = 5;
          else if (gameState.stage === 5 && nextDone >= GAME_CONFIG.STAGE_5_COUNT) {
            playSound('win');
            const stageAccuracy =
              gameState.stageTotal > 0
                ? Math.round((gameState.stageCorrect / gameState.stageTotal) * 100)
                : 0;
            setStageStars((s) => [...s, calcStars(stageAccuracy)]);
            const finalState = {
              ...gameState,
              score: newScore,
              questionsDone: nextDone,
              currentStreak: newStreak,
              bestStreak: Math.max(gameState.bestStreak, newStreak),
              totalCorrect: gameState.totalCorrect + 1,
              totalQuestions: gameState.totalQuestions + 1,
              stageCorrect: gameState.stageCorrect + 1,
              stageTotal: gameState.stageTotal + 1,
              stageDone: gameState.stageDone + 1,
            };
            setGameState(finalState);
            stateRef.current = finalState;
            trackCustomEvent('game_complete:number_game', {
              score: newScore,
              totalCorrect: finalState.totalCorrect,
              totalQuestions: finalState.totalQuestions,
              bestStreak: finalState.bestStreak,
              isEndless: finalState.isEndless,
            });
            setScreen('victory');
            return;
          }
        }

        const next = {
          ...gameState,
          score: newScore,
          stage: nextStage === gameState.stage ? gameState.stage : nextStage,
          questionsDone: nextDone,
          currentStreak: newStreak,
          bestStreak: Math.max(gameState.bestStreak, newStreak),
          totalCorrect: gameState.totalCorrect + 1,
          totalQuestions: gameState.totalQuestions + 1,
          stageCorrect: nextStage !== gameState.stage ? 0 : gameState.stageCorrect + 1,
          stageTotal: gameState.stageTotal + 1,
          stageDone: nextStage !== gameState.stage ? 0 : gameState.stageDone + 1,
        };
        setGameState(next);
        stateRef.current = next;
        setFeedback({ text: `${randomPraise('correct')} +3`, type: 'correct' });
        setIsTransitioning(true);
        setTimeout(() => {
          setFeedback({ text: '', type: '' });
          setIsTransitioning(false);
          setCurrentQuestion(generateQuestion(next, range));
        }, GAME_CONFIG.FEEDBACK_DURATION);
      } else {
        playSound('wrong');
        trackCustomEvent('game_wrong:number_game', {
          stage: gameState.stage,
          score: gameState.score,
        });
        const next = {
          ...gameState,
          score: Math.max(0, gameState.score - GAME_CONFIG.SCORE_WRONG),
          currentStreak: 0,
          totalQuestions: gameState.totalQuestions + 1,
          stageTotal: gameState.stageTotal + 1,
          stageDone: gameState.stageDone + 1,
        };
        setGameState(next);
        stateRef.current = next;
        setFeedback({
          text: `${randomPraise('wrong')} -2`,
          type: 'wrong',
          showCorrect: currentQuestion.correct,
        });
        speak(currentQuestion.correct, 'en-US');
        setIsTransitioning(true);
        setTimeout(() => {
          setFeedback({ text: '', type: '' });
          setIsTransitioning(false);
        }, GAME_CONFIG.FEEDBACK_DURATION);
      }
    },
    [currentQuestion, isTransitioning, gameState, range, playSound, speak, trackCustomEvent],
  );

  const startEndless = useCallback(() => {
    const next = {
      ...gameState,
      isEndless: true,
      stage: 1,
      questionsDone: 0,
      stageCorrect: 0,
      stageTotal: 0,
      stageDone: 0,
    };
    setGameState(next);
    stateRef.current = next;
    setScreen('game');
    setCurrentQuestion(generateQuestion(next, range));
    trackCustomEvent('game_start:number_game', { mode: 'endless', range: range.id });
  }, [gameState, range, trackCustomEvent]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center justify-center p-4 transition-all duration-500 ${screen === 'game' ? 'h-screen overflow-hidden bg-fuchsia-50 dark:bg-zinc-950' : 'min-h-screen bg-fuchsia-50 dark:bg-zinc-950 pt-24'}`}
      style={{ fontFamily: "'Mali', sans-serif" }}
    >
      <div className="w-full max-w-3xl mx-auto relative">
        {screen === 'menu' && <MenuScreen onStart={() => setScreen('range')} />}
        {screen === 'range' && (
          <RangeScreen onSelect={startGame} onBack={() => setScreen('menu')} />
        )}
        {screen === 'game' && currentQuestion && (
          <GameScreen
            question={currentQuestion}
            feedback={feedback}
            isTransitioning={isTransitioning}
            score={gameState.score}
            stage={gameState.stage}
            stageDone={gameState.stageDone}
            stageMax={computeStageMax(gameState)}
            isEndless={gameState.isEndless}
            isFullscreen={isFullscreen}
            muted={muted}
            onAnswer={handleAnswer}
            onBack={() => setScreen('menu')}
            onToggleFullscreen={toggleFullscreen}
            onToggleMute={toggleMute}
            onSpeak={speak}
          />
        )}
        {screen === 'victory' && (
          <VictoryScreen
            score={gameState.score}
            totalCorrect={gameState.totalCorrect}
            totalQuestions={gameState.totalQuestions}
            bestStreak={gameState.bestStreak}
            onPlayEndless={startEndless}
            onChangeRange={() => setScreen('range')}
            currentRangeId={range.id}
            stageStars={stageStars}
          />
        )}
      </div>
    </div>
  );
}
