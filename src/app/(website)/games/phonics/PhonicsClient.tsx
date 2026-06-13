'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GameContext, type GameContextValue } from './context';
import type { Screen, SaveData, GameRound, RoundConfig, CompanionId, PhonicsQuestion, DefinitionQuestion } from './types';
import {
  getActiveSlot,
  setActiveSlot,
  loadSave,
  writeSave,
  getDefaultSave,
  recordRound,
} from './save';
import { useAudio } from '@/hooks/useAudio';
import { GAME_CONFIG } from './constants';
import SaveSlotScreen from './screens/SaveSlotScreen';
import IslandScreen from './screens/IslandScreen';
import GameScreen from './screens/GameScreen';
import VictoryScreen from './screens/VictoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import TutorialScreen from './screens/TutorialScreen';
import RotateDeviceOverlay from './components/RotateDeviceOverlay';
import { useAnalytics } from '@/lib/analytics';

export default function PhonicsClient() {
  const [mounted, setMounted] = useState(false);
  const [screen, setScreen] = useState<Screen>('slots');
  const [activeSlot, setActiveSlotState] = useState<number | 'guest'>('guest');
  const [save, setSaveState] = useState<SaveData | null>(null);
  const [round, setRound] = useState<GameRound | null>(null);
  const [companion, setCompanion] = useState<CompanionId>('nox');
  const { muted, toggleMute, playSound } = useAudio();
  const [crtEffect, setCrtEffect] = useState(false);
  const [showBoatReturn, setShowBoatReturn] = useState(false);
  const { trackCustomEvent } = useAnalytics();

  // ── Mount guard — no localStorage access before hydration ──────────────────
  useEffect(() => {
    document.body.classList.add('phonics-fullscreen');
    const timer = setTimeout(() => {
      setMounted(true);
      const slot = getActiveSlot();
      setActiveSlotState(slot);
      if (slot !== 'guest') {
        const data = loadSave(slot as number);
        if (data) {
          setSaveState(data);
      setCompanion(data.companion);
      setCrtEffect(data.settings.crtEffect);
      if (data.tutorialCompleted) setScreen('map');
      else setScreen('tutorial');
        }
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      document.body.classList.remove('phonics-fullscreen');
    };
  }, []);

  // ── Screen transition focus management ───────────────────────────────────
  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
    const timer = setTimeout(() => {
      const el = document.querySelector<HTMLElement>(
        '#island-map-wrapper, #game-mute-btn, #settings-back, #save-slot-1, #tutorial-next, #tutorial-start'
      );
      el?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [screen]);

  // ── Save persistence ───────────────────────────────────────────────────────
  const persistSave = useCallback(
    (s: SaveData) => {
      setSaveState(s);
      if (activeSlot !== 'guest') {
        writeSave(activeSlot as number, s);
      }
    },
    [activeSlot],
  );

  // ── visibilitychange save ──────────────────────────────────────────────────
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden' && activeSlot !== 'guest' && saveRef.current) {
        writeSave(activeSlot as number, saveRef.current);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [activeSlot]);

  // ── Slot selection ─────────────────────────────────────────────────────────
  const selectSlot = useCallback(
    (slot: number | 'guest') => {
      setActiveSlot(slot);
      setActiveSlotState(slot);
      if (slot === 'guest') {
        setSaveState(getDefaultSave('Guest'));
      } else {
        const data = loadSave(slot as number) ?? getDefaultSave(`Slot ${slot}`);
        setSaveState(data);
        setCompanion(data.companion);
        setCrtEffect(data.settings.crtEffect);
      }
      setScreen('tutorial');
      trackCustomEvent('game_start', { game: 'phonics', slot: String(slot) });
    },
    [trackCustomEvent],
  );

  // ── Round management ───────────────────────────────────────────────────────
  const startRound = useCallback(
    (config: RoundConfig) => {
      const newRound: GameRound = {
        config,
        questions: [],
        currentIndex: 0,
        score: 0,
        corrects: 0,
        streak: 0,
        maxStreak: 0,
        coinsEarned: 0,
        results: [],
      };
      setRound(newRound);
      setScreen('game');
      trackCustomEvent('game_round_start', {
        game: 'phonics',
        category: config.category,
        level: config.level,
      });
    },
    [trackCustomEvent],
  );

  const answerQuestion = useCallback(
    (answer: string) => {
      const prev = round;
      if (!prev) return;
      const question = prev.questions[prev.currentIndex];
      if (!question) return;

      let correctAnswer = '';
      if (question.category === 'phonics') correctAnswer = question.correctAnswer;
      else if (question.category === 'definitions') correctAnswer = question.correctAnswer;
      else if (question.category === 'spelling') correctAnswer = question.word.word;

      const correct = answer.toLowerCase() === correctAnswer.toLowerCase();
      const start = Date.now();
      const newStreak = correct ? prev.streak + 1 : 0;
      const coinsThisQ = correct
        ? newStreak >= GAME_CONFIG.STREAK_BONUS_THRESHOLD
          ? GAME_CONFIG.COINS_STREAK
          : GAME_CONFIG.COINS_CORRECT
        : 0;

      if (correct) playSound('correct');
      else playSound('wrong');

      trackCustomEvent(correct ? 'game_correct' : 'game_wrong', {
        game: 'phonics',
        category: question.category,
        letter: question.word?.word,
        streak: prev.streak,
      });

      setRound({
        ...prev,
        score: prev.score + (correct ? GAME_CONFIG.SCORE_CORRECT : 0),
        corrects: prev.corrects + (correct ? 1 : 0),
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
        coinsEarned: prev.coinsEarned + coinsThisQ,
        currentIndex: prev.currentIndex + 1,
        results: [
          ...prev.results,
          { question, playerAnswer: answer, correct, timeMs: Date.now() - start },
        ],
      });
    },
    [playSound, round, trackCustomEvent],
  );

  // ── Victory finalization ───────────────────────────────────────────────────
  const finalizeRound = useCallback(() => {
    if (!round || !save) return;
    let updated = recordRound(save, round.corrects, round.maxStreak, round.coinsEarned);

    for (const result of round.results) {
      if (result.question.category === 'phonics') {
        const q = result.question as PhonicsQuestion;
        const prev = updated.phonemeStats[q.phoneme.id] ?? { correct: 0, total: 0, lastSeen: 0 };
        updated = {
          ...updated,
          phonemeStats: {
            ...updated.phonemeStats,
            [q.phoneme.id]: {
              correct: prev.correct + (result.correct ? 1 : 0),
              total: prev.total + 1,
              lastSeen: Date.now(),
            },
          },
        };
      }
      if (result.question.category === 'definitions') {
        const q = result.question as DefinitionQuestion;
        const key = q.direction === 'def-to-word' ? 'defToWord' : 'wordToDef';
        updated = {
          ...updated,
          definitionStats: {
            ...updated.definitionStats,
            [key]: {
              correct: updated.definitionStats[key].correct + (result.correct ? 1 : 0),
              total: updated.definitionStats[key].total + 1,
            },
          },
        };
      }
    }

    persistSave(updated);
    playSound('win');
    setScreen('victory');
    trackCustomEvent('game_complete', {
      game: 'phonics',
      corrects: round.corrects,
      maxStreak: round.maxStreak,
      score: round.score,
      total: round.questions.length,
    });
  }, [round, save, persistSave, playSound, trackCustomEvent]);

  // ── CRT toggle ─────────────────────────────────────────────────────────────
  const toggleCrt = useCallback(() => {
    setCrtEffect((v) => {
      const next = !v;
      if (save) persistSave({ ...save, settings: { ...save.settings, crtEffect: next } });
      return next;
    });
  }, [save, persistSave]);

  // ── Context value ─────────────────────────────────────────────────────────
  const ctx: GameContextValue = {
    screen,
    setScreen,
    activeSlot,
    save,
    setSave: setSaveState,
    persistSave,
    round,
    startRound,
    answerQuestion,
    companion,
    setCompanion,
    muted,
    toggleMute,
    crtEffect,
    toggleCrt,
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#A2D2FF] dark:bg-[#0A1128]">
        <div className="skeleton w-64 h-10 rounded mb-4" />
        <div className="skeleton w-48 h-6 rounded" />
      </div>
    );
  }

  return (
    <GameContext.Provider value={ctx}>
      <div className="phonics-game relative min-h-screen bg-[#A2D2FF] dark:bg-[#0A1128] transition-colors duration-500 motion-reduce:transition-none">
        {/* CRT scanline overlay */}
        {crtEffect && <div className="scanline-overlay" aria-hidden="true" />}

        {screen === 'slots' && <SaveSlotScreen onSelectSlot={selectSlot} />}
        {screen === 'map' && <IslandScreen showBoatReturn={showBoatReturn} onBoatDone={() => setShowBoatReturn(false)} />}
        {screen === 'game' && round && <GameScreen onRoundComplete={finalizeRound} />}
        {screen === 'victory' && round && (
          <VictoryScreen
            round={round}
            onPlayAgain={() => startRound(round.config)}
            onBackToMap={() => { setShowBoatReturn(true); setScreen('map'); }}
          />
        )}
        {screen === 'tutorial' && (
          <TutorialScreen
            onComplete={() => {
              if (save) persistSave({ ...save, tutorialCompleted: true });
              setScreen('map');
            }}
          />
        )}
        {screen === 'settings' && <SettingsScreen />}
        <RotateDeviceOverlay />
      </div>
    </GameContext.Provider>
  );
}
