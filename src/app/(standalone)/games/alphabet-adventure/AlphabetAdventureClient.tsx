'use client';

import { startTransition, useState, useEffect, useRef, useCallback } from 'react';
import type { Screen, MapSaveData, StageConfig } from './types';
import { getStage } from './constants';
import { useAudio } from '@/hooks/useAudio';
import { safeGetString, safeSetString, safeRemove } from '@/lib/storage';
import { useGameActions, type SubStageResult } from './hooks/useGameActions';
import { loadMapSave, saveMapSave } from './migrateMapSave';
import { recordLogoTap, recordPerfect, touchPlayDate } from './achievements';
import type { LetterTracker } from './types';
import GameScreen from './screens/GameScreen';
import MenuScreen from './screens/MenuScreen';
import VictoryScreen from './screens/VictoryScreen';
import LevelMapScreen from './screens/LevelMapScreen';
import StageMapScreen from './screens/StageMapScreen';
import AnalysisScreen from './screens/AnalysisScreen';
import GameOverlays from './screens/GameOverlays';
import CardScreen from './beta/screens/CardScreen';
import AllCardsModal from './beta/screens/AllCardsModal';
import LetterExplorerScreen from './screens/LetterExplorerScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import OnboardingOverlay from './screens/OnboardingOverlay';

interface Props {
  beta?: boolean;
}

function mergeLetterTracker(
  prev: Record<string, LetterTracker>,
  session: Record<string, LetterTracker>,
): Record<string, LetterTracker> {
  const merged = { ...prev };
  for (const [letter, stats] of Object.entries(session)) {
    const existing = merged[letter];
    merged[letter] = {
      correct: Math.max(stats.correct, existing?.correct ?? 0),
      total: Math.max(stats.total, existing?.total ?? 0),
    };
  }
  return merged;
}

function buildNextMap(
  prev: MapSaveData,
  result: SubStageResult,
  stageIdx: number,
  subIdx: number,
): MapSaveData {
  const stages = [...prev.stages];
  if (stageIdx < 0 || stageIdx >= stages.length) return prev;

  const subStages = [...stages[stageIdx].subStages];
  const sub = { ...subStages[subIdx] };
  if (!sub.completed || result.stars > sub.stars) {
    sub.completed = true;
    sub.stars = Math.max(sub.stars, result.stars);
    sub.bestScore = Math.max(sub.bestScore, result.score);
  }
  subStages[subIdx] = sub;

  const allDone = subStages.every((s) => s.completed);

  stages[stageIdx] = {
    ...stages[stageIdx],
    subStages,
    completed: allDone,
  };

  if (allDone && stageIdx < stages.length - 1) {
    stages[stageIdx + 1] = {
      ...stages[stageIdx + 1],
      unlocked: true,
    };
  }

  return {
    ...prev,
    totalScore: prev.totalScore + result.score,
    stages,
    letterTracker: mergeLetterTracker(prev.letterTracker, result.letterTracker),
  };
}

export default function AlphabetAdventureClient({ beta = false }: Props) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [showAllCards, setShowAllCards] = useState(false);
  const [mapData, setMapData] = useState<MapSaveData>(() => loadMapSave());

  const [selectedStage, setSelectedStage] = useState<StageConfig | null>(null);
  const [currentStageId, setCurrentStageId] = useState(0);
  const [currentSubIdx, setCurrentSubIdx] = useState(0);
  const stageIdRef = useRef(0);
  const subIdxRef = useRef(0);

  const [lastStars, setLastStars] = useState(0);
  const [lastSessionStats, setLastSessionStats] = useState<
    Record<string, { correct: number; wrong: number }>
  >({});
  const [lastBestStreak, setLastBestStreak] = useState(0);
  const [lastAccuracy, setLastAccuracy] = useState(0);
  const subStageResultsRef = useRef<
    Record<
      number,
      {
        name: string;
        stars: number;
        accuracy: number;
        sessionLetterStats: Record<string, { correct: number; wrong: number }>;
      }
    >
  >({});
  const [subStageSummaries, setSubStageSummaries] = useState<
    Array<{
      name: string;
      stars: number;
      accuracy: number;
      sessionLetterStats: Record<string, { correct: number; wrong: number }>;
    }>
  >([]);
  const [analysisReturnTo, setAnalysisReturnTo] = useState<Screen>('level-map');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [practiceLetters, setPracticeLetters] = useState<string[]>([]);
  const [achievementToast, setAchievementToast] = useState<{
    name: string;
    icon: string;
  } | null>(null);
  const achievedRef = useRef<Set<string>>(new Set());
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onboardingTypeRef = useRef<string>('');
  const sweepRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const { speak, muted, toggleMute, playSequence, voiceURI, setVoiceURI } = useAudio();

  const {
    game: { gameState, roundData, feedback, isTransitioning, hasSavedProgress },
    cardSystem: {
      streakToast,
      cardReveal,
      showCollectionOverlay,
      setShowCollectionOverlay,
      dropPower,
      effectiveStreak,
      dropStreak,
      handleCardKeep,
      newAchievements,
    },
    debug: { showDebug, setShowDebug },
    actions: {
      startSubStage,
      startPracticeSession,
      handleAnswer,
      checkTyping,
      handleSelectCell,
      handleTypingInput,
      runAchievementCheck,
    },
  } = useGameActions();

  useEffect(() => {
    const savedVoice = safeGetString('alphabet-adventure-voice');
    if (savedVoice) setVoiceURI(savedVoice);
  }, [setVoiceURI]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    touchPlayDate();
  }, []);

  useEffect(() => {
    const fresh = newAchievements.filter((a) => !achievedRef.current.has(a.id));
    if (fresh.length === 0) return;

    let idx = 0;
    const showNext = () => {
      if (idx >= fresh.length) return;
      setAchievementToast({ name: fresh[idx].name, icon: fresh[idx].icon });
      achievedRef.current.add(fresh[idx].id);
      idx++;
      toastTimerRef.current = setTimeout(() => {
        setAchievementToast(null);
        toastTimerRef.current = setTimeout(showNext, 400);
      }, 2500);
    };
    showNext();

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [newAchievements]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleVoiceChange = useCallback(
    (uri: string) => {
      setVoiceURI(uri);
      if (uri) safeSetString('alphabet-adventure-voice', uri);
      else safeRemove('alphabet-adventure-voice');
    },
    [setVoiceURI],
  );

  const handleSubStageComplete = useCallback(
    (result: SubStageResult) => {
      const next = buildNextMap(loadMapSave(), result, stageIdRef.current - 1, subIdxRef.current);
      saveMapSave(next);
      setMapData(next);

      setLastStars(result.stars);
      setLastSessionStats(result.sessionLetterStats);
      setLastBestStreak(result.bestStreak);
      setLastAccuracy(result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0);

      const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
      if (accuracy === 100) recordPerfect();

      subStageResultsRef.current[subIdxRef.current] = {
        name: result.subStageName ?? '',
        stars: result.stars,
        accuracy,
        sessionLetterStats: result.sessionLetterStats,
      };

      if (subIdxRef.current === 4) {
        const keys = Object.keys(subStageResultsRef.current);
        if (keys.length === 5 && keys.every((k) => Number(k) >= 0 && Number(k) <= 4)) {
          sweepRef.current = true;
        }
        setSubStageSummaries(Object.values(subStageResultsRef.current));
      }

      runAchievementCheck({ singleSessionSweep: sweepRef.current });

      setScreen('victory');
    },
    [runAchievementCheck],
  );

  const handleSelectStage = useCallback((stageId: number) => {
    const stage = getStage(stageId);
    if (stage) {
      setSelectedStage(stage);
      subStageResultsRef.current = {};
      setSubStageSummaries([]);
      sweepRef.current = false;
      setScreen('stage-map');
    }
  }, []);

  const handleSelectSubStage = useCallback(
    (subIdx: number) => {
      if (!selectedStage) return;
      const subStage = selectedStage.subStages[subIdx];
      if (!subStage) return;

      setCurrentStageId(selectedStage.id);
      setCurrentSubIdx(subIdx);
      stageIdRef.current = selectedStage.id;
      subIdxRef.current = subIdx;

      const easyMode = safeGetString('alphabet-adventure-easyMode') === 'true';
      startSubStage(
        subStage,
        selectedStage.id,
        subIdx,
        handleSubStageComplete,
        easyMode,
        mapData.letterTracker,
      );
      setScreen('game');
    },
    [selectedStage, startSubStage, handleSubStageComplete, mapData.letterTracker],
  );

  useEffect(() => {
    if (screen === 'game' && currentStageId > 0) {
      const stage = getStage(currentStageId);
      if (stage) {
        const subStage = stage.subStages[currentSubIdx];
        if (subStage) {
          const typeKey = subStage.type;
          onboardingTypeRef.current = typeKey;
          const seenKey = `onboarding_${typeKey}`;
          const seen = mapData.stages.some((s) => s.subStages.some((ss) => ss.completed));
          const firstTime = !seen && !safeGetString(seenKey);
          if (firstTime && typeKey) {
            safeSetString(seenKey, '1');
            startTransition(() => setShowOnboarding(true));
          }
        }
      }
    }
  }, [screen, currentStageId, currentSubIdx, mapData.stages]);

  const closeOnboarding = useCallback(() => setShowOnboarding(false), []);

  const handleStartPractice = useCallback(
    (letters: string[]) => {
      setPracticeLetters(letters);
      startPracticeSession(letters, (result) => {
        const prev = loadMapSave();
        const next: MapSaveData = {
          ...prev,
          letterTracker: mergeLetterTracker(prev.letterTracker, result.letterTracker),
        };
        saveMapSave(next);
        setMapData(next);

        const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
        if (accuracy === 100) recordPerfect();

        runAchievementCheck({ singleSessionSweep: false });

        setLastStars(result.stars);
        setLastSessionStats(result.sessionLetterStats);
        setLastBestStreak(result.bestStreak);
        setLastAccuracy(accuracy);
        setScreen('victory');
      });
      setScreen('game');
    },
    [startPracticeSession, runAchievementCheck],
  );

  const handleBackToMap = useCallback(() => {
    setPracticeLetters([]);
    setSelectedStage(null);
    setCurrentStageId(0);
    setCurrentSubIdx(0);
    stageIdRef.current = 0;
    subIdxRef.current = 0;
    setScreen('level-map');
  }, []);

  const handleBackToLevel = useCallback(() => {
    setPracticeLetters([]);
    if (selectedStage) {
      setScreen('stage-map');
    } else {
      handleBackToMap();
    }
  }, [selectedStage, handleBackToMap]);

  const handleNextLesson = useCallback(() => {
    const nextIdx = currentSubIdx + 1;
    if (selectedStage && selectedStage.subStages[nextIdx]) {
      handleSelectSubStage(nextIdx);
    }
  }, [currentSubIdx, selectedStage, handleSelectSubStage]);

  const handleNextStage = useCallback(() => {
    const nextId = currentStageId + 1;
    const stage = getStage(nextId);
    if (stage) {
      setSelectedStage(stage);
      setCurrentStageId(stage.id);
      setCurrentSubIdx(0);
      stageIdRef.current = stage.id;
      subIdxRef.current = 0;
      setScreen('stage-map');
    }
  }, [currentStageId]);

  const handleShowAnalysis = useCallback((returnTo: Screen) => {
    setAnalysisReturnTo(returnTo);
    setScreen('analysis');
  }, []);

  const handleBackFromAnalysis = useCallback(() => {
    setScreen(analysisReturnTo);
  }, [analysisReturnTo]);

  const currentStage = selectedStage || (currentStageId > 0 ? getStage(currentStageId) : null);
  const currentSubStage =
    currentStage && currentStage.subStages[currentSubIdx]
      ? currentStage.subStages[currentSubIdx]
      : null;
  const subStageName = currentSubStage?.name ?? '';
  const subStageType = currentSubStage?.type ?? 'match';
  const totalSubStages = currentStage?.subStages.length ?? 5;
  const isLastSubStage = currentSubIdx === totalSubStages - 1;
  const isLastStage = currentStageId === 6;
  const totalStages = mapData.stages.length;
  const stagesCompleted = mapData.stages.filter((s) => s.completed).length;

  const reviewPrompt =
    screen === 'victory' && Object.keys(lastSessionStats).length > 0
      ? {
          weakLetters: Object.entries(lastSessionStats)
            .filter(([, s]) => s.wrong > 0)
            .map(([l]) => l),
          onStartReview: (letters: string[]) => handleStartPractice(letters),
        }
      : undefined;

  return (
    <div
      ref={containerRef}
      className="alphabet-game flex flex-col items-center justify-center p-4 transition-colors duration-500 fixed inset-0 overflow-hidden overscroll-none bg-violet-50 dark:bg-zinc-950"
      style={{ fontFamily: "'Mali', sans-serif", contain: 'layout style paint' }}
    >
      <div className="w-full max-w-3xl mx-auto relative h-full flex flex-col justify-center">
        {showCards && <CardScreen onBack={() => setShowCards(false)} playSequence={playSequence} />}

        {showAllCards && <AllCardsModal onClose={() => setShowAllCards(false)} />}

        {!showCards && screen === 'menu' && (
          <MenuScreen
            onStart={() => setScreen('level-map')}
            hasProgress={hasSavedProgress}
            isBeta={beta}
            onShowCards={() => setShowCards(true)}
            onShowAllCards={() => setShowAllCards(true)}
            onShowAnalysis={() => handleShowAnalysis('menu')}
            onShowExplorer={() => setScreen('letter-explorer')}
            onShowAchievements={() => setScreen('achievements')}
            onLogoTap={() => {
              recordLogoTap();
              runAchievementCheck();
            }}
            voiceURI={voiceURI}
            onVoiceChange={handleVoiceChange}
          />
        )}

        {!showCards && screen === 'level-map' && (
          <LevelMapScreen
            mapData={mapData}
            onSelectStage={handleSelectStage}
            onBack={() => setScreen('menu')}
            onShowAnalysis={() => handleShowAnalysis('level-map')}
          />
        )}

        {!showCards && screen === 'stage-map' && selectedStage && (
          <StageMapScreen
            stage={selectedStage}
            stageProgress={mapData.stages[selectedStage.id - 1]}
            letterTracker={mapData.letterTracker}
            onSelectSubStage={handleSelectSubStage}
            onBack={handleBackToMap}
            onShowAnalysis={() => handleShowAnalysis('stage-map')}
          />
        )}

        {!showCards && screen === 'letter-explorer' && (
          <LetterExplorerScreen
            onBack={() => setScreen('menu')}
            onSpeak={speak}
            voiceURI={voiceURI}
          />
        )}

        {!showCards && screen === 'achievements' && (
          <AchievementsScreen onBack={() => setScreen('menu')} />
        )}

        {!showCards && screen === 'analysis' && (
          <AnalysisScreen
            totalScore={mapData.totalScore}
            stagesCompleted={stagesCompleted}
            totalStages={totalStages}
            letterTracker={mapData.letterTracker}
            onBack={handleBackFromAnalysis}
            onStartPractice={handleStartPractice}
          />
        )}

        {!showCards && screen === 'game' && (
          <>
            {showOnboarding && (
              <OnboardingOverlay
                name={subStageName}
                type={subStageType}
                onDismiss={closeOnboarding}
              />
            )}
            <GameOverlays
              isBeta={beta}
              showDebug={showDebug}
              showCollectionOverlay={showCollectionOverlay}
              streakToast={streakToast}
              cardReveal={cardReveal}
              dropStreak={dropStreak}
              dropPower={dropPower}
              effectiveStreak={effectiveStreak}
              onToggleCollection={() => setShowCollectionOverlay((v) => !v)}
              onToggleDebug={() => setShowDebug((v) => !v)}
              onCloseCollection={() => setShowCollectionOverlay(false)}
              onViewFullCollection={() => setShowCards(true)}
              onViewAllCards={() => setShowAllCards(true)}
              onCardKeep={handleCardKeep}
              playSequence={playSequence}
            />
            {achievementToast && (
              <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] pointer-events-none">
                <div className="animate-in slide-in-from-top-4 fade-in duration-500">
                  <div className="bg-white dark:bg-zinc-800 border-2 border-yellow-400 dark:border-yellow-500 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
                    <span className="text-3xl animate-bounce">{achievementToast.icon}</span>
                    <div>
                      <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">
                        Achievement Unlocked!
                      </p>
                      <p className="text-base font-black text-zinc-800 dark:text-zinc-100">
                        {achievementToast.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
              onBack={handleBackToLevel}
              onToggleFullscreen={toggleFullscreen}
              onToggleMute={toggleMute}
              onSelectCell={handleSelectCell}
              onTypingInput={handleTypingInput}
              onSpeak={speak}
              onShowCards={beta ? () => setShowCards(true) : undefined}
              dropPower={dropPower}
              effectiveStreak={effectiveStreak}
              subStageName={subStageName}
              subStageSubtitle={currentSubStage?.subtitle ?? ''}
              levelType={subStageType}
              dataPool={currentSubStage?.dataPool}
              target={currentSubStage?.targetMin}
            />
          </>
        )}

        {!showCards && screen === 'victory' && (
          <VictoryScreen
            score={gameState.score}
            stars={lastStars}
            wrongLetters={gameState.wrongLetters}
            stageName={currentStage?.name ?? ''}
            isLastSubStage={isLastSubStage}
            isLastStage={isLastStage}
            onNextLesson={handleNextLesson}
            onNextStage={handleNextStage}
            onRestart={() => {
              if (practiceLetters.length > 0) {
                handleStartPractice(practiceLetters);
              } else if (currentStage) {
                handleSelectSubStage(currentSubIdx);
              }
            }}
            onBackToMenu={handleBackToLevel}
            accuracyPercent={lastAccuracy}
            sessionLetterStats={lastSessionStats}
            bestStreak={lastBestStreak}
            subStageLetters={
              practiceLetters.length > 0 ? practiceLetters : (currentSubStage?.letterPool ?? [])
            }
            subStageSummaries={isLastSubStage ? subStageSummaries : undefined}
            reviewPrompt={reviewPrompt}
          />
        )}
      </div>
    </div>
  );
}
