"use client";

import { createContext, useContext } from "react";
import type { LangCode, GameMode, SpriteQuality, GameSettings, SaveData, Screen } from "./types";

export interface GameCtx {
  lang: LangCode;
  mode: GameMode;
  quality: SpriteQuality;
  settings: GameSettings;
  save: SaveData;
  updateSettings: (partial: Partial<GameSettings>) => void;
  navigate: (screen: Screen) => void;
  playSfx: (name: string) => void;
  isMuted: boolean;
  onStageComplete: (stageId: string, stars: number, score: number) => void;
  devMode: boolean;
}

export const GameContext = createContext<GameCtx | null>(null);

export function useGame(): GameCtx {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
