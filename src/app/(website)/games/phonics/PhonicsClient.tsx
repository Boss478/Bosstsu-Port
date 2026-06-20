'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { GameContext, type GameContextValue } from './context';
import type { Screen, SaveData, GameRound, RoundConfig, CompanionId, PhonicsQuestion, DefinitionQuestion, Question, StageData, StageLesson, CefrLevel, MapView, SimilarSoundGroup, ActivityData } from './types';
import { getWordFromQuestion } from './types';
import BackgroundDownloadWidget, { type BackgroundDownloadState } from './components/BackgroundDownloadWidget';
import {
  getActiveSlot,
  setActiveSlot,
  loadSave,
  writeSave,
  getDefaultSave,
  recordRound,
} from './save';
import { useAudio } from '@/hooks/useAudio';
import { GAME_CONFIG, PHONEME_EXAMPLE_WORDS, STAGES } from './constants';
import { WORDS } from './words';
import SaveSlotScreen from './screens/SaveSlotScreen';
import StageListScreen from './screens/StageListScreen';
import CompanionBubble from './components/CompanionBubble';
import { useAnalytics } from '@/lib/analytics';
import MascotCanvas from './components/MascotCanvas';

const GameScreen = dynamic(() => import('./screens/GameScreen'), { ssr: false });
const VictoryScreen = dynamic(() => import('./screens/VictoryScreen'), { ssr: false });
const SettingsScreen = dynamic(() => import('./screens/SettingsScreen'), { ssr: false });
const TutorialScreen = dynamic(() => import('./screens/TutorialScreen'), { ssr: false });
const LibraryScreen = dynamic(() => import('./screens/LibraryScreen'), { ssr: false });
const ShopScreen = dynamic(() => import('./screens/ShopScreen'), { ssr: false });
const ProfileScreen = dynamic(() => import('./screens/ProfileScreen'), { ssr: false });
const WordBuilderScreen = dynamic(() => import('./screens/WordBuilderScreen'), { ssr: false });
const WordQuizScreen = dynamic(() => import('./screens/WordQuizScreen'), { ssr: false });

export default function PhonicsClient() {
  const [mounted, setMounted] = useState(false);
  const [screen, setScreen] = useState<Screen>('slots');
  const [tab, setTab] = useState<'sound' | 'vocab' | 'library' | 'shop' | 'profile'>('sound');
  const [activeSlot, setActiveSlotState] = useState<number | 'guest'>('guest');
  const [save, setSaveState] = useState<SaveData | null>(null);
  const [round, setRound] = useState<GameRound | null>(null);
  const [companion, setCompanion] = useState<CompanionId>('nox');
  const [selectedStage, setSelectedStage] = useState<StageData | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<StageLesson | null>(null);
  const [mapView, setMapView] = useState<MapView>('groups');
  const [selectedGroup, setSelectedGroup] = useState<SimilarSoundGroup | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null);
  const [isFirstJoinLoading, setIsFirstJoinLoading] = useState(false);
  const [firstJoinLoaded, setFirstJoinLoaded] = useState(0);
  const [firstJoinTotal, setFirstJoinTotal] = useState(0);
  const [bgDownloadState, setBgDownloadState] = useState<BackgroundDownloadState | null>(null);
  const { muted, toggleMute, playSound, voiceURI, setVoiceURI, voices, prefetchWords, speechRate, setSpeechRate, speechPitch, setSpeechPitch } = useAudio();
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
          if (data.tutorialCompleted) setScreen('path');
          else setScreen('tutorial');
        }
      }
    }, 0);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Check and prefetch Stage 1 audio assets on first join (or cache cleared)
  useEffect(() => {
    if (!mounted) return;

    const checkFirstJoin = async () => {
      const stage1Key = "phonics-stage-1-loaded";
      const isLoaded = localStorage.getItem(stage1Key) === "true";
      if (isLoaded) return;

      const stage = STAGES[0];
      const phonemes = stage.lessons.flatMap((l) => l.phonemeIds);
      const words = new Set<string>();

      phonemes.forEach((p) => {
        const ex = PHONEME_EXAMPLE_WORDS[p];
        if (ex) words.add(ex);
      });

      WORDS.forEach((w) => {
        if (w.phonemes.some((p) => phonemes.includes(p))) {
          words.add(w.word);
        }
      });

      const wordsArray = Array.from(words);
      if (wordsArray.length === 0) return;

      setIsFirstJoinLoading(true);
      setFirstJoinTotal(wordsArray.length);
      setFirstJoinLoaded(0);

      let active = true;
      // Timeout backup of 3.5 seconds to start the game anyway if requests stall
      const timeout = setTimeout(() => {
        if (active) {
          setIsFirstJoinLoading(false);
          localStorage.setItem(stage1Key, "true");
        }
      }, 3500);

      await prefetchWords(wordsArray, async (loaded, total) => {
        if (!active) return;
        setFirstJoinLoaded(loaded);
        if (loaded >= total) {
          clearTimeout(timeout);
          // Wait 1.2 seconds to show completion state
          await new Promise((resolve) => setTimeout(resolve, 1200));
          if (active) {
            setIsFirstJoinLoading(false);
            localStorage.setItem(stage1Key, "true");
          }
        }
      });

      return () => {
        active = false;
        clearTimeout(timeout);
      };
    };

    checkFirstJoin();
  }, [mounted, prefetchWords]);

  // Background prefetching for subsequent stages (staggered to run while user plays or browses)
  useEffect(() => {
    if (!mounted || isFirstJoinLoading) return;

    const runBackgroundPrefetch = async () => {
      // 1. Check immediately to set initial cache status (avoiding a 3-second delay or disappearances)
      let allAlreadyCached = true;
      for (let i = 1; i < STAGES.length; i++) {
        const stage = STAGES[i];
        const stageKey = `phonics-${stage.id}-loaded`;
        if (localStorage.getItem(stageKey) !== "true") {
          allAlreadyCached = false;
        }
      }

      const stage1Key = "phonics-stage-1-loaded";
      const isStage1Loaded = localStorage.getItem(stage1Key) === "true";

      if (!isStage1Loaded) {
        // Guard: wait until Stage 1 is fully loaded before prefetching subsequent stages
        return;
      }

      if (allAlreadyCached) {
        setBgDownloadState({
          isActive: false,
          stageTitle: null,
          pct: 100,
          loaded: 0,
          total: 0,
          isDone: true,
        });
      } else {
        // Show initializing status immediately
        setBgDownloadState({
          isActive: true,
          stageTitle: "Initializing",
          pct: 0,
          loaded: 0,
          total: 0,
          isDone: false,
        });
      }

      // Wait 3 seconds after initial mounting to let everything settle before starting downloads
      await new Promise((r) => setTimeout(r, 3000));

      // Recheck cache status in case it was modified during the 3 seconds
      let recheckCached = true;
      for (let i = 1; i < STAGES.length; i++) {
        const stage = STAGES[i];
        const stageKey = `phonics-${stage.id}-loaded`;
        if (localStorage.getItem(stageKey) !== "true") {
          recheckCached = false;
        }
      }
      if (recheckCached) {
        setBgDownloadState({
          isActive: false,
          stageTitle: null,
          pct: 100,
          loaded: 0,
          total: 0,
          isDone: true,
        });
        return;
      }

      let cachedAny = false;
      for (let i = 1; i < STAGES.length; i++) {
        const stage = STAGES[i];
        const stageKey = `phonics-${stage.id}-loaded`;

        // If already cached/loaded, skip
        if (localStorage.getItem(stageKey) === "true") continue;

        cachedAny = true;
        const phonemes = stage.lessons.flatMap((l) => l.phonemeIds);
        const words = new Set<string>();

        phonemes.forEach((p) => {
          const ex = PHONEME_EXAMPLE_WORDS[p];
          if (ex) words.add(ex);
        });

        WORDS.forEach((w) => {
          if (w.phonemes.some((p) => phonemes.includes(p))) {
            words.add(w.word);
          }
        });

        const wordsArray = Array.from(words);
        if (wordsArray.length === 0) continue;

        setBgDownloadState({
          isActive: true,
          stageTitle: stage.title,
          pct: 0,
          loaded: 0,
          total: wordsArray.length,
          isDone: false,
        });

        // Load in small batches of 3 to be very gentle on network
        const batchSize = 3;
        let loaded = 0;
        for (let j = 0; j < wordsArray.length; j += batchSize) {
          const batch = wordsArray.slice(j, j + batchSize);
          await prefetchWords(batch);
          loaded += batch.length;
          const pct = Math.round((loaded / wordsArray.length) * 100);
          setBgDownloadState({
            isActive: true,
            stageTitle: stage.title,
            pct,
            loaded,
            total: wordsArray.length,
            isDone: false,
          });
          // Wait 500ms between batches
          await new Promise((r) => setTimeout(r, 500));
        }

        // Mark as loaded
        localStorage.setItem(stageKey, "true");
        setBgDownloadState({
          isActive: false,
          stageTitle: stage.title,
          pct: 100,
          loaded: wordsArray.length,
          total: wordsArray.length,
          isDone: true,
        });

        // Wait 3 seconds before starting the next stage prefetch
        await new Promise((r) => setTimeout(r, 3000));
      }

      if (cachedAny) {
        setBgDownloadState({
          isActive: false,
          stageTitle: null,
          pct: 100,
          loaded: 0,
          total: 0,
          isDone: true,
        });
      }
    };

    runBackgroundPrefetch();
  }, [mounted, isFirstJoinLoading, prefetchWords]);

  // ── Screen transition focus management ───────────────────────────────────
  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
    const timer = setTimeout(() => {
      const el = document.querySelector<HTMLElement>(
        '#save-slot-1, #tutorial-next, #tutorial-start, #settings-back'
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

  // ── Slot selection ─────────────────────────────────────────────────────────
  const selectSlot = useCallback(
    (slot: number | 'guest', nameInput?: string, startLevel?: CefrLevel, startPlacement?: boolean) => {
      setActiveSlot(slot);
      setActiveSlotState(slot);

      const defaultName = nameInput || (slot === 'guest' ? 'Guest' : `Slot ${slot}`);
      const initialLevel = startLevel || 'b1';

      const newSave: SaveData = {
        ...getDefaultSave(defaultName),
        cefrLevel: initialLevel,
        cefrUpgradeStreak: 0,
      };

      if (slot === 'guest') {
        setSaveState(newSave);
      } else {
        const data = loadSave(slot as number);
        if (data) {
          setSaveState(data);
          setCompanion(data.companion);
        } else {
          setSaveState(newSave);
          writeSave(slot as number, newSave);
        }
      }

      trackCustomEvent('game_start', { game: 'phonics', slot: String(slot) });

      if (startPlacement) {
        // Start placement test immediately
          startRound({
              category: 'definitions',
              level: 'a1', // dummy level
              length: 30,
              isPlacement: true,
            });
      } else {
        setScreen('tutorial');
      }
    },
    [trackCustomEvent, startRound],
  );

  // ── Stage selection ──────────────────────────────────────────────────────
  const selectStage = useCallback((stage: StageData | null) => {
    setSelectedStage(stage);
    setSelectedLesson(null);
  }, []);

  const selectLesson = useCallback((lesson: StageLesson | null) => {
    setSelectedLesson(lesson);
  }, []);

  const selectGroup = useCallback((group: SimilarSoundGroup | null) => {
    setSelectedGroup(group);
    if (group) setMapView('stages');
    else setMapView('groups');
  }, []);

  const selectActivity = useCallback((activity: ActivityData | null) => {
    setSelectedActivity(activity);
  }, []);

  const answerQuestion = useCallback(
    (answer: string, question: Question) => {
      const prev = round;
      if (!prev) return;

      const start = Date.now();

      let correctAnswer = '';
      const category = question.category;
      if (category === 'phonics') correctAnswer = question.correctAnswer;
      else if (category === 'definitions') correctAnswer = question.correctAnswer;
      else if (category === 'practice') correctAnswer = question.correctAnswer;
      else if (category === 'ipa-word') correctAnswer = question.correctAnswer;
      else if (category === 'word-ipa') correctAnswer = question.correctAnswer;
      else if (category === 'synonyms') correctAnswer = question.correctAnswer;
      else if (category === 'exercise') {
        const e = question as import('./types').ExerciseQuestion;
        correctAnswer = 'correctAnswer' in e.data ? e.data.correctAnswer : '';
      }
      else if (category === 'spelling') {
        correctAnswer = question.inputMode === 'tiles'
          ? question.word.phonemes.join("")
          : question.word.word;
      }

      const correct = answer.toLowerCase() === correctAnswer.toLowerCase();
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
        letter: 'word' in question ? (question as { word: { word: string } }).word.word : undefined,
        streak: prev.streak,
      });

      setRound({
        ...prev,
        score: prev.score + (correct ? GAME_CONFIG.SCORE_CORRECT : 0),
        corrects: prev.corrects + (correct ? 1 : 0),
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
        coinsEarned: prev.coinsEarned + coinsThisQ,
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

    if (round.config.isPlacement) {
      const correctCount = round.results.filter((r) => r.correct).length;
      const pct = round.results.length > 0 ? correctCount / round.results.length : 0;
      let placedLevel: CefrLevel = "a1";
      if (pct >= 0.9) placedLevel = "c1";
      else if (pct >= 0.7) placedLevel = "b2";
      else if (pct >= 0.5) placedLevel = "b1";
      else if (pct >= 0.3) placedLevel = "a2";

      const updated: SaveData = {
        ...save,
        cefrLevel: placedLevel,
        cefrUpgradeStreak: 0,
        tutorialCompleted: true, // Bypass tutorial on placement
      };

      persistSave(updated);
      playSound('win');
      setScreen('victory');
      trackCustomEvent('placement_complete', {
        game: 'phonics',
        placedLevel,
        score: round.score,
      });
      return;
    }

    let updated = recordRound(save, round.corrects, round.maxStreak, round.coinsEarned);

    // Update lesson progress if coming from a lesson
    if (selectedLesson && save) {
      const accuracy = round.results.length > 0
        ? Math.round((round.corrects / round.results.length) * 100)
        : 0;
      updated = {
        ...updated,
        lessonProgress: {
          ...updated.lessonProgress,
          [selectedLesson.id]: {
            completed: accuracy >= 60,
            bestScore: Math.max(
              save.lessonProgress?.[selectedLesson.id]?.bestScore ?? 0,
              round.corrects,
            ),
            lastAccuracy: accuracy,
            questionsAnswered: round.results.length,
          },
        },
      };
    }

    // Update activity progress if coming from an activity
    if (selectedActivity && save) {
      const accuracy = round.results.length > 0
        ? Math.round((round.corrects / round.results.length) * 100)
        : 0;
      updated = {
        ...updated,
        activityProgress: {
          ...updated.activityProgress,
          [selectedActivity.id]: {
            completed: accuracy >= 60,
            bestScore: Math.max(
              save.activityProgress?.[selectedActivity.id]?.bestScore ?? 0,
              round.corrects,
            ),
            lastAccuracy: accuracy,
          },
        },
      };
    }

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

    // Adaptive CEFR Level upgrading/downgrading via performance (only for vocabulary mode)
    if (!round.config.isPlacement && round.config.category === 'definitions') {
      const accuracy = round.results.length > 0
        ? Math.round((round.corrects / round.results.length) * 100)
        : 0;

      let newStreak = updated.cefrUpgradeStreak ?? 0;
      let newCefr = updated.cefrLevel ?? 'a1';
      const cefrOrder: CefrLevel[] = ["a1", "a2", "b1", "b2", "c1", "c2"];
      const currentIdx = cefrOrder.indexOf(newCefr);

      if (accuracy >= 90) {
        newStreak = Math.max(0, newStreak + 1);
        if (newStreak >= 3) {
          if (currentIdx !== -1 && currentIdx < cefrOrder.length - 1) {
            newCefr = cefrOrder[currentIdx + 1];
          }
          newStreak = 0;
        }
      } else if (accuracy < 50) {
        newStreak = Math.min(0, newStreak - 1);
        if (newStreak <= -2) {
          if (currentIdx !== -1 && currentIdx > 0) {
            newCefr = cefrOrder[currentIdx - 1];
          }
          newStreak = 0;
        }
      } else {
        newStreak = 0;
      }

      updated = {
        ...updated,
        cefrLevel: newCefr,
        cefrUpgradeStreak: newStreak,
      };
    }

    persistSave(updated);
    playSound('win');
    setScreen('victory');
    trackCustomEvent('game_complete', {
      game: 'phonics',
      corrects: round.corrects,
      maxStreak: round.maxStreak,
      score: round.score,
      total: round.results.length,
    });
  }, [round, save, selectedLesson, selectedActivity, persistSave, playSound, trackCustomEvent]);

  // ── Glass level mapping ───────────────────────────────────────────────────
  const glassValue = save ? 0.08 + (save.settings.glassLevel / 50) * 0.87 : 0.5;

  const nextQuestion = useCallback(() => {
    setRound((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentIndex: prev.currentIndex + 1,
      };
    });
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────
  const ctx: GameContextValue = {
    screen,
    setScreen,
    tab,
    setTab,
    mapView,
    setMapView,
    selectedGroup,
    selectGroup,
    selectedActivity,
    selectActivity,
    activeSlot,
    save,
    persistSave,
    selectedStage,
    selectStage,
    selectedLesson,
    selectLesson,
    round,
    startRound,
    answerQuestion,
    nextQuestion,
    companion,
    setCompanion,
    muted,
    toggleMute,
    voiceURI,
    setVoiceURI,
    voices: voices as SpeechSynthesisVoice[],
    speechRate,
    setSpeechRate,
    speechPitch,
    setSpeechPitch,
    prefetchWords,
  };

  if (!mounted) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#A2D2FF] dark:bg-[#0A1128]">
        <div className="skeleton w-64 h-10 rounded mb-4" />
        <div className="skeleton w-48 h-6 rounded" />
      </div>
    );
  }

  if (isFirstJoinLoading) {
    const pct = firstJoinTotal > 0 ? Math.round((firstJoinLoaded / firstJoinTotal) * 100) : 0;
    const isDone = firstJoinLoaded >= firstJoinTotal && firstJoinTotal > 0;
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#E8F2FF] via-[#E8EFFF] to-[#FAE8FF] dark:from-[#090D1A] dark:via-[#131B35] dark:to-[#2A1242] px-6 text-center">
        <div className="glass-panel p-8 rounded-3xl border border-white/20 shadow-xl max-w-sm w-full flex flex-col items-center gap-6">
          <MascotCanvas
            companionId={companion}
            size={84}
            animationState={isDone ? "celebrate" : "idle"}
            className="rounded-2xl bg-white/10 p-2"
          />
          <div className="space-y-2 w-full">
            <h3 className={`text-xl font-black text-slate-800 dark:text-white ${isDone ? "" : "animate-pulse"}`} style={{ fontFamily: "var(--font-mali)" }}>
              {isDone ? "Status: Done" : "Status: Downloading..."}
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isDone ? "All audio has been downloaded." : `Downloaded ${firstJoinLoaded}/${firstJoinTotal} ({pct}%)`}
            </p>
          </div>
          <div className="w-full space-y-2">
            <div className="h-4 bg-slate-300/30 dark:bg-slate-900/40 rounded-full border border-white/20 overflow-hidden p-0.5 shadow-inner relative">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${isDone ? "from-emerald-400 to-teal-500" : "from-[#2EC4B6] to-[#C8A44E]"} transition-all duration-300`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              <span>{isDone ? "DOWNLOAD COMPLETE" : "LOADING INTRODUCTION"}</span>
              <span>{firstJoinLoaded} / {firstJoinTotal}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const showHeaderFooter = screen === 'path' || screen === 'settings' || screen === 'victory';

  return (
    <GameContext.Provider value={ctx}>
      <div className="phonics-game relative h-full flex flex-col bg-gradient-to-b from-[#E8F2FF] via-[#E8EFFF] to-[#FAE8FF] dark:from-[#090D1A] dark:via-[#131B35] dark:to-[#2A1242] transition-colors duration-500 motion-reduce:transition-none" style={{ '--glass-level': glassValue } as React.CSSProperties}>
        <div key={screen === 'game' ? 'slots' : screen} className={screen === 'slots' || screen === 'tutorial' || screen === 'game' || screen === 'word-builder' || screen === 'word-quiz' ? 'animate-screen-enter flex-1 flex flex-col overflow-y-auto min-h-0' : ''}>
          {screen === 'slots' && <SaveSlotScreen onSelectSlot={selectSlot} />}
          {screen === 'tutorial' && (
            <TutorialScreen
              onComplete={() => {
                if (save) persistSave({ ...save, tutorialCompleted: true });
                setScreen('path');
              }}
              onStartPractice={() => {
                if (save) persistSave({ ...save, tutorialCompleted: true });
                startRound({
                  category: 'phonics',
                  level: 'a1',
                  length: 3,
                });
              }}
            />
          )}
          {screen === 'game' && round && <GameScreen onRoundComplete={finalizeRound} bgDownloadState={bgDownloadState} />}
          {screen === 'word-builder' && <WordBuilderScreen />}
          {screen === 'word-quiz' && <WordQuizScreen />}
        </div>

        {showHeaderFooter && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <StaticHeader save={save} companion={companion} setScreen={setScreen} screen={screen} />
            
            <div key={screen} className="flex-1 overflow-hidden relative min-h-0 flex flex-col animate-screen-enter">
              <BackgroundDownloadWidget state={bgDownloadState} />
              {screen === 'path' && (
                <>
                  {tab === 'sound' && <StageListScreen mode="sound" />}
                  {tab === 'vocab' && <StageListScreen mode="vocab" />}
                  {tab === 'library' && <LibraryScreen />}
                  {tab === 'shop' && <ShopScreen />}
                  {tab === 'profile' && <ProfileScreen />}
                </>
              )}
              {screen === 'settings' && <SettingsScreen />}
              {screen === 'victory' && round && (
                <VictoryScreen
                  round={round}
                  onPlayAgain={() => {
                    startRound(round.config);
                  }}
                  onRetryIncorrect={() => {
                    const incorrect = round.results
                      .filter((r) => !r.correct)
                      .map((r) => getWordFromQuestion(r.question)?.word)
                      .filter((w): w is string => !!w);
                    const unique = [...new Set(incorrect)];
                    if (unique.length === 0) return;
                    startRound({
                      ...round.config,
                      retryWords: unique,
                      isPlacement: false,
                    });
                  }}
                  onBackToPath={() => { setSelectedStage(null); setSelectedLesson(null); selectActivity(null); setScreen('path'); }}
                />
              )}
            </div>

            <StaticFooter tab={tab} setTab={setTab} screen={screen} setScreen={setScreen} />
          </div>
        )}

        {screen !== 'slots' && screen !== 'game' && screen !== 'word-builder' && screen !== 'word-quiz' && <CompanionBubble />}
      </div>
    </GameContext.Provider>
  );
}

// ── Helper Sub-Components ───────────────────────────────────────────────────

function MascotHeaderAvatar({ companion, size = 32 }: { companion: CompanionId; size?: number }) {
  return (
    <MascotCanvas
      companionId={companion}
      size={size}
      className="rounded-lg bg-white/20 dark:bg-slate-900/30 p-1 border border-white/30 dark:border-slate-800 shadow-xs"
    />
  );
}

function StaticHeader({
  save,
  companion,
  setScreen,
  screen,
}: {
  save: SaveData | null;
  companion: CompanionId;
  setScreen: (s: Screen) => void;
  screen: Screen;
}) {
  return (
    <div className="shrink-0 px-5 py-4 glass-light border-b border-white/30 dark:border-slate-800/60 shadow-xs flex items-center justify-between z-20 relative">
      <div className="flex items-center gap-3">
        <MascotHeaderAvatar companion={companion} size={38} />
        <div className="flex flex-col text-left">
          <span className="text-base font-extrabold text-slate-800 dark:text-white leading-tight" style={{ fontFamily: "var(--font-mali)" }}>
            {save?.name ?? "Guest"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-black text-[#C8A44E] drop-shadow-3xs bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 flex items-center gap-1.5 shadow-2xs">
          <i className="fi fi-sr-wallet text-base" /> {save?.phonemeCoins ?? 0}
        </span>
        <button
          className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center text-base active:scale-90 transition-all cursor-pointer shadow-xs btn-3d ${
            screen === "settings"
              ? "bg-[#C8A44E] text-white border-[#C8A44E]"
              : "bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200"
          }`}
          onClick={() => setScreen(screen === "settings" ? "path" : "settings")}
          style={{ "--border-color": screen === "settings" ? "#91722e" : "rgba(0,0,0,0.1)" } as React.CSSProperties}
          aria-label="Settings"
        >
          <i className="fi fi-sr-settings text-sm" />
        </button>
      </div>
    </div>
  );
}

function StaticFooter({
  tab,
  setTab,
  screen,
  setScreen,
}: {
  tab: 'sound' | 'vocab' | 'library' | 'shop' | 'profile';
  setTab: (t: 'sound' | 'vocab' | 'library' | 'shop' | 'profile') => void;
  screen: Screen;
  setScreen: (s: Screen) => void;
}) {
  const tabs = [
    { id: "sound", name: "Sound", iconClass: "fi fi-sr-volume" },
    { id: "vocab", name: "Vocab", iconClass: "fi fi-sr-graduation-cap" },
    { id: "library", name: "Soundbook", iconClass: "fi fi-sr-book-open-cover" },
    { id: "shop", name: "Bazaar", iconClass: "fi fi-sr-shopping-cart" },
    { id: "profile", name: "Profile", iconClass: "fi fi-sr-user" },
  ] as const;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-[560px] glass-panel rounded-3xl shadow-lg border border-white/20 dark:border-slate-800/40 backdrop-blur-md flex items-center justify-between py-3 px-5">
      {tabs.map((t) => {
        const active = screen === "path" && tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setScreen("path");
            }}
            className={`flex flex-col items-center justify-center flex-1 cursor-pointer transition-all duration-200 select-none relative ${
              active 
                ? "text-[#C8A44E] scale-105 font-bold" 
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
            }`}
          >
            <span className={`text-xl mb-0.5 relative flex flex-col items-center ${active ? "scale-110 font-bold" : ""}`}>
              <i className={t.iconClass} />
              {active && (
                <span className="hidden max-[325px]:block w-1 h-1 rounded-full bg-[#C8A44E] absolute -bottom-1.5 animate-pulse" />
              )}
            </span>
            <span className="text-[9px] font-extrabold tracking-wide uppercase flex flex-col items-center max-[325px]:hidden">
              {t.name}
              {active && (
                <span className="w-1 h-1 rounded-full bg-[#C8A44E] mt-0.5 animate-pulse" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
