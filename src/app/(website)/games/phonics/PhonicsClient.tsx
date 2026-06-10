'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GameContext, type GameContextValue } from './context';
import type { Screen, SaveData, GameRound, RoundConfig, CompanionId } from './types';
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
import MapScreen from './screens/MapScreen';
import GameScreen from './screens/GameScreen';
import VictoryScreen from './screens/VictoryScreen';
import SettingsScreen from './screens/SettingsScreen';
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
  const { trackCustomEvent } = useAnalytics();

  // ── Mount guard — no localStorage access before hydration ──────────────────
  useEffect(() => {
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
          // Skip slots screen if valid save exists and tutorial done
          if (data.tutorialCompleted) setScreen('map');
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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
      setScreen('map');
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
    const updated = recordRound(save, round.corrects, round.maxStreak, round.coinsEarned);
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

  if (!mounted) return null;

  return (
    <GameContext.Provider value={ctx}>
      <div className="relative min-h-screen bg-[#A2D2FF] dark:bg-[#0A1128] transition-colors duration-500">
        {/* CRT scanline overlay */}
        {crtEffect && <div className="scanline-overlay" aria-hidden="true" />}

        {screen === 'slots' && <SaveSlotScreen onSelectSlot={selectSlot} />}
        {screen === 'map' && <MapScreen />}
        {screen === 'game' && round && <GameScreen onRoundComplete={finalizeRound} />}
        {screen === 'victory' && round && (
          <VictoryScreen
            round={round}
            onPlayAgain={() => startRound(round.config)}
            onBackToMap={() => setScreen('map')}
          />
        )}
        {screen === 'settings' && <SettingsScreen />}
      </div>
    </GameContext.Provider>
  );
}
