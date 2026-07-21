'use client';

import { startTransition, useState, useEffect, useRef, useCallback } from 'react';
import type { Screen, MapSaveData, StageConfig } from './types';
import { emptyMapSaveData } from './types';
import { getStage } from './constants';
import { useAudio } from '@/hooks/useAudio';
import { useGameActions, type SubStageResult } from './hooks/useGameActions';
import { loadMapSave, saveMapSave } from './migrateMapSave';
import GameScreen from './screens/GameScreen';
import MenuScreen from './screens/MenuScreen';
import VictoryScreen from './screens/VictoryScreen';
import LevelMapScreen from './screens/LevelMapScreen';
import StageMapScreen from './screens/StageMapScreen';
import AnalysisScreen from './screens/AnalysisScreen';
import GameOverlays from './screens/GameOverlays';
import CardScreen from './beta/screens/CardScreen';
import OnboardingOverlay from './screens/OnboardingOverlay';

interface Props {
  beta?: boolean;
}

export default function AlphabetAdventureClient({ beta = false }: Props) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [mapData, setMapData] = useState<MapSaveData>(() => {
    if (typeof window === 'undefined') return emptyMapSaveData();
    return loadMapSave();
  });

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
  const onboardingTypeRef = useRef<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const { speak, muted, toggleMute, playSequence, voiceURI, setVoiceURI } = useAudio();

  const {
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
    effectiveStreak,
    dropStreak,
    handleCardKeep,
    startSubStage,
    handleAnswer,
    checkTyping,
    handleSelectCell,
    handleTypingInput,
  } = useGameActions();

  useEffect(() => {
    const savedVoice = localStorage.getItem('alphabet-adventure-voice');
    if (savedVoice) setVoiceURI(savedVoice);
  }, [setVoiceURI]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

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
      if (typeof window !== 'undefined') {
        if (uri) localStorage.setItem('alphabet-adventure-voice', uri);
        else localStorage.removeItem('alphabet-adventure-voice');
      }
    },
    [setVoiceURI],
  );

  const updateMapSave = useCallback((updater: (prev: MapSaveData) => MapSaveData) => {
    setMapData((prev) => {
      const next = updater(prev);
      saveMapSave(next);
      return next;
    });
  }, []);

  const handleSubStageComplete = useCallback(
    (result: SubStageResult) => {
      updateMapSave((prev) => {
        const stages = [...prev.stages];
        const stageIdx = stageIdRef.current - 1;
        if (stageIdx < 0 || stageIdx >= stages.length) return prev;

        const subStages = [...stages[stageIdx].subStages];
        const sub = { ...subStages[subIdxRef.current] };
        if (!sub.completed || result.stars > sub.stars) {
          sub.completed = true;
          sub.stars = Math.max(sub.stars, result.stars);
          sub.bestScore = Math.max(sub.bestScore, result.score);
        }
        subStages[subIdxRef.current] = sub;

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

        const mergedTracker = { ...prev.letterTracker };
        for (const [letter, stats] of Object.entries(result.letterTracker)) {
          const existing = mergedTracker[letter];
          mergedTracker[letter] = {
            correct: Math.max(stats.correct, existing?.correct ?? 0),
            total: Math.max(stats.total, existing?.total ?? 0),
          };
        }

        return {
          ...prev,
          totalScore: prev.totalScore + result.score,
          stages,
          letterTracker: mergedTracker,
        };
      });

      setLastStars(result.stars);
      setLastSessionStats(result.sessionLetterStats);
      setLastBestStreak(result.bestStreak);
      setLastAccuracy(result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0);

      subStageResultsRef.current[subIdxRef.current] = {
        name: result.subStageName ?? '',
        stars: result.stars,
        accuracy: result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0,
        sessionLetterStats: result.sessionLetterStats,
      };

      if (subIdxRef.current === 4) {
        setSubStageSummaries(Object.values(subStageResultsRef.current));
      }

      setScreen('victory');
    },
    [updateMapSave],
  );

  const handleSelectStage = useCallback((stageId: number) => {
    const stage = getStage(stageId);
    if (stage) {
      setSelectedStage(stage);
      subStageResultsRef.current = {};
      setSubStageSummaries([]);
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

      const easyMode =
        typeof window !== 'undefined' &&
        localStorage.getItem('alphabet-adventure-easyMode') === 'true';
      startSubStage(subStage, selectedStage.id, subIdx, handleSubStageComplete, easyMode, mapData.letterTracker);
      setScreen('game');
    },
    [selectedStage, startSubStage, handleSubStageComplete],
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
          const firstTime =
            !seen && typeof window !== 'undefined' && !localStorage.getItem(seenKey);
          if (firstTime && typeKey) {
            localStorage.setItem(seenKey, '1');
            startTransition(() => setShowOnboarding(true));
          }
        }
      }
    }
  }, [screen, currentStageId, currentSubIdx, mapData.stages]);

  const closeOnboarding = useCallback(() => setShowOnboarding(false), []);

  const handleBackToMap = useCallback(() => {
    setSelectedStage(null);
    setCurrentStageId(0);
    setCurrentSubIdx(0);
    stageIdRef.current = 0;
    subIdxRef.current = 0;
    setScreen('level-map');
  }, []);

  const handleBackToLevel = useCallback(() => {
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

  return (
    <div
      ref={containerRef}
      className="alphabet-game flex flex-col items-center justify-center p-4 transition-colors duration-500 fixed inset-0 overflow-hidden overscroll-none bg-violet-50 dark:bg-zinc-950"
      style={{ fontFamily: "'Mali', sans-serif", contain: 'layout style paint' }}
    >
      <div className="w-full max-w-3xl mx-auto relative h-full">
        {showCards && <CardScreen onBack={() => setShowCards(false)} playSequence={playSequence} />}

        {!showCards && screen === 'menu' && (
          <MenuScreen
            onStart={() => setScreen('level-map')}
            hasProgress={hasSavedProgress}
            isBeta={beta}
            onShowCards={() => setShowCards(true)}
            onShowAnalysis={() => handleShowAnalysis('menu')}
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

        {!showCards && screen === 'analysis' && (
          <AnalysisScreen
            totalScore={mapData.totalScore}
            stagesCompleted={stagesCompleted}
            totalStages={totalStages}
            letterTracker={mapData.letterTracker}
            onBack={handleBackFromAnalysis}
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
              lastCardDropped={lastCardDropped}
              cardReveal={cardReveal}
              dropStreak={dropStreak}
              dropPower={dropPower}
              effectiveStreak={effectiveStreak}
              onToggleCollection={() => setShowCollectionOverlay((v) => !v)}
              onToggleDebug={() => setShowDebug((v) => !v)}
              onCloseCollection={() => setShowCollectionOverlay(false)}
              onViewFullCollection={() => setShowCards(true)}
              onCardKeep={handleCardKeep}
              playSequence={playSequence}
            />
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
              if (currentStage) {
                handleSelectSubStage(currentSubIdx);
              }
            }}
            onBackToMenu={handleBackToLevel}
            accuracyPercent={lastAccuracy}
            sessionLetterStats={lastSessionStats}
            bestStreak={lastBestStreak}
            subStageLetters={currentSubStage?.letterPool ?? []}
            subStageSummaries={isLastSubStage ? subStageSummaries : undefined}
          />
        )}
      </div>
    </div>
  );
}
