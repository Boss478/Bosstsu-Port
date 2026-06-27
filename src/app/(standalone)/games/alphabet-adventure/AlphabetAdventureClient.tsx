'use client';

import { startTransition, useState, useEffect, useRef, useCallback } from 'react';
import type { Screen } from './types';
import { useAudio } from '@/hooks/useAudio';
import { useGameActions } from './hooks/useGameActions';
import GameScreen from './screens/GameScreen';
import MenuScreen from './screens/MenuScreen';
import VictoryScreen from './screens/VictoryScreen';
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

  const containerRef = useRef<HTMLDivElement>(null);
  const { playSound, speak, muted, toggleMute, playSequence, voiceURI, setVoiceURI } = useAudio();

  const [showOnboarding, setShowOnboarding] = useState(false);

  const {
    gameState,
    roundData,
    feedback,
    isTransitioning,
    stageStars,
    hasSavedProgress,
    easyMode,
    setEasyMode,
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
    startGame,
    continueGame,
    handleAnswer,
    checkTyping,
    handleSelectCell,
    handleTypingInput,
    markOnboardingSeen,
  } = useGameActions({ playSound, playSequence, setScreen });

  useEffect(() => {
    if (screen === 'game' && !gameState.onboardingSeen[gameState.level - 1]) {
      markOnboardingSeen(gameState.level);
      startTransition(() => setShowOnboarding(true));
    }
  }, [screen, gameState.level, gameState.onboardingSeen, markOnboardingSeen]);

  const closeOnboarding = useCallback(() => setShowOnboarding(false), []);

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
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    const savedVoice = localStorage.getItem('alphabet-adventure-voice');
    if (savedVoice) setVoiceURI(savedVoice);
  }, [setVoiceURI]);

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

  return (
    <div
      ref={containerRef}
      className="alphabet-game flex flex-col items-center justify-center p-4 transition-colors duration-500 fixed inset-0 overflow-hidden overscroll-none bg-violet-50 dark:bg-zinc-950"
      style={{ fontFamily: "'Mali', sans-serif", contain: 'layout style paint' }}
    >
      <div className="w-full max-w-3xl mx-auto relative">
        {showCards && <CardScreen onBack={() => setShowCards(false)} playSequence={playSequence} />}

        {!showCards && screen === 'menu' && (
          <MenuScreen
            onStart={() => startGame(undefined, undefined, easyMode)}
            onContinue={continueGame}
            hasProgress={hasSavedProgress}
            easyMode={easyMode}
            onToggleEasy={() => setEasyMode((v) => !v)}
            isBeta={beta}
            onShowCards={() => setShowCards(true)}
            voiceURI={voiceURI}
            onVoiceChange={handleVoiceChange}
          />
        )}

        {!showCards && screen === 'game' && (
          <>
            {showOnboarding && (
              <OnboardingOverlay level={gameState.level} onDismiss={closeOnboarding} />
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
              onBack={() => setScreen('menu')}
              onToggleFullscreen={toggleFullscreen}
              onToggleMute={toggleMute}
              onSelectCell={handleSelectCell}
              onTypingInput={handleTypingInput}
              onSpeak={speak}
              onShowCards={beta ? () => setShowCards(true) : undefined}
              dropPower={dropPower}
              effectiveStreak={effectiveStreak}
            />
          </>
        )}

        {!showCards && screen === 'victory' && (
          <VictoryScreen
            score={gameState.score}
            stageStars={stageStars}
            wrongLetters={gameState.wrongLetters}
            onRestart={() => startGame(undefined, undefined, easyMode)}
            onBackToMenu={() => setScreen('menu')}
          />
        )}
      </div>
    </div>
  );
}
