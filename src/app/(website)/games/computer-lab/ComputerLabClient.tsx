"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { Screen, LangCode, GameMode, SpriteQuality, GameSettings, SaveData } from "./types";
import { CRT_CLASS } from "./constants";
import { loadSave, saveSave, unlockNextStages, getDefaultSave } from "./save";
import { audioEngine } from "./audio";
import { GameContext } from "./context";

import TopBar from "./components/TopBar";
import LoadingScreen from "./components/LoadingScreen";
import BootScreen from "./components/BootScreen";

import MenuScreen from "./screens/MenuScreen";
import HardwareScreen from "./screens/HardwareScreen";
import SoftwareScreen from "./screens/SoftwareScreen";
import WorkflowScreen from "./screens/WorkflowScreen";
import BuildScreen from "./screens/BuildScreen";
import DiagnosisScreen from "./screens/DiagnosisScreen";
import VictoryScreen from "./screens/VictoryScreen";
import PongScreen from "./screens/PongScreen";

const SCREEN_MAP: Record<Screen, React.ComponentType<{ onNavigate: (screen: Screen) => void }>> = {
  boot: BootScreen as unknown as React.ComponentType<{ onNavigate: (screen: Screen) => void }>,
  menu: MenuScreen,
  hardware: HardwareScreen,
  software: SoftwareScreen,
  workflow: WorkflowScreen,
  build: BuildScreen,
  diagnosis: DiagnosisScreen,
  victory: VictoryScreen,
  pong: PongScreen,
};

export default function ComputerLabClient() {
  const [saveData, setSaveData] = useState(() => getDefaultSave());
  const [screen, setScreen] = useState<Screen>("boot");
  const [loading, setLoading] = useState(false);
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    const saved = loadSave();
    const timer = setTimeout(() => {
      setSaveData(saved);
      if (saved.biosSeen) setScreen("menu");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const { lang, mode, quality, muted } = saveData.settings;

  const updateSettings = useCallback((partial: Partial<GameSettings>) => {
    setSaveData((prev) => {
      const next = { ...prev, settings: { ...prev.settings, ...partial } };
      saveSave(next);
      return next;
    });
  }, []);

  const updateSave = useCallback((partial: Partial<SaveData>) => {
    setSaveData((prev) => {
      const next = { ...prev, ...partial };
      saveSave(next as SaveData);
      return next as SaveData;
    });
  }, []);

  const playSfx = useCallback((name: string) => {
    audioEngine.playSfx(name);
  }, []);

  useEffect(() => {
    audioEngine.init();
    return () => { audioEngine.dispose(); };
  }, []);

  useEffect(() => {
    audioEngine.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    audioEngine.setVolume(saveData.settings.volume);
  }, [saveData.settings.volume]);

  useEffect(() => {
    const header = document.getElementById("site-header");
    const footer = document.getElementById("site-footer");
    header?.classList.add("hidden");
    footer?.classList.add("hidden");
    return () => {
      header?.classList.remove("hidden");
      footer?.classList.remove("hidden");
    };
  }, []);

  useEffect(() => {
    if (screen === "menu") audioEngine.playMusic("menu");
    else if (screen === "hardware") audioEngine.playMusic("hardware");
    else if (screen === "software") audioEngine.playMusic("software");
    else if (screen === "workflow") audioEngine.playMusic("workflow");
    else if (screen === "build") audioEngine.playMusic("build");
    else if (screen === "diagnosis") audioEngine.playMusic("diagnosis");
    else if (screen === "victory") audioEngine.playMusic("victory");
  }, [screen]);

  const navigate = useCallback((target: Screen) => {
    if (target === screen) return;
    setLoading(true);
    audioEngine.playSfx("click");
    setTimeout(() => {
      setScreen(target);
      setLoading(false);
    }, 800);
  }, [screen]);

  const handleBootComplete = useCallback(() => {
    setSaveData((prev) => {
      const next = { ...prev, biosSeen: true, playCount: prev.playCount + 1 };
      saveSave(next);
      return next;
    });
    audioEngine.playSfx("boot");
    navigate("menu");
  }, [navigate]);

  const handleDevMode = useCallback(() => {
    setDevMode(true);
    setSaveData((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next.progress)) {
        next.progress[key as keyof typeof next.progress].unlocked = true;
      }
      saveSave(next);
      return next;
    });
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const handleLangChange = useCallback((newLang: LangCode) => {
    updateSettings({ lang: newLang });
  }, [updateSettings]);

  const handleModeChange = useCallback((newMode: GameMode) => {
    updateSettings({ mode: newMode });
  }, [updateSettings]);

  const handleQualityChange = useCallback((q: SpriteQuality) => {
    updateSettings({ quality: q });
  }, [updateSettings]);

  const handleMuteToggle = useCallback(() => {
    updateSettings({ muted: !muted });
  }, [updateSettings, muted]);

  const handleStageComplete = useCallback((stageId: string, stars: number, score: number) => {
    setSaveData((prev) => {
      const key = stageId as keyof typeof prev.progress;
      const current = prev.progress[key];
      if (!current || (current.completed && current.stars >= stars)) return prev;

      const next = {
        ...prev,
        progress: {
          ...prev.progress,
          [key]: {
            ...current,
            completed: true,
            stars: Math.max(current.stars, stars),
            bestScore: Math.max(current.bestScore, score),
            unlocked: true,
          },
        },
      };
      unlockNextStages(next as typeof prev);
      saveSave(next);
      return next;
    });
    audioEngine.playSfx("victory");
  }, []);

  const contextValue = useMemo(() => ({
    lang,
    mode,
    quality,
    settings: saveData.settings,
    save: saveData,
    updateSettings,
    updateSave,
    navigate,
    playSfx,
    isMuted: muted,
    onStageComplete: handleStageComplete,
    devMode,
  }), [lang, mode, quality, saveData, updateSettings, updateSave, navigate, playSfx, muted, handleStageComplete, devMode]);

  const CurrentScreen = SCREEN_MAP[screen];
  const showTopBar = screen !== "boot";

  return (
    <GameContext.Provider value={contextValue}>
      <div className="relative w-full h-screen overflow-hidden bg-black text-white font-mono">
        <LoadingScreen
          visible={loading}
        />

        <div className={`absolute inset-0 z-10 pointer-events-none ${CRT_CLASS}`} />

        <div className="flex flex-col h-full relative z-0">
          {showTopBar && (
            <TopBar
              onFullscreen={handleFullscreen}
              onBack={() => navigate("menu")}
              lang={lang}
              mode={mode}
              quality={quality}
              muted={muted}
              onLangChange={handleLangChange}
              onModeChange={handleModeChange}
              onQualityChange={handleQualityChange}
              onMuteToggle={handleMuteToggle}
            />
          )}

          <div className="flex-1 overflow-y-auto">
            {screen === "boot" ? (
              <BootScreen
                lang={lang}
                mode={mode}
                onComplete={handleBootComplete}
                onDevMode={handleDevMode}
              />
            ) : (
              <CurrentScreen onNavigate={navigate} />
            )}
          </div>
        </div>

        <style>{`
          .${CRT_CLASS}::before {
            content: "";
            position: absolute;
            inset: 0;
            background: repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.08) 2px,
              rgba(0,0,0,0.08) 4px
            );
            pointer-events: none;
            z-index: 9999;
          }
        `}</style>
      </div>
    </GameContext.Provider>
  );
}
