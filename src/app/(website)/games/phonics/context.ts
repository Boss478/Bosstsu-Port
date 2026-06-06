import { createContext, useContext } from "react";
import type { Screen, SaveData, GameRound, RoundConfig, CompanionId } from "./types";

export interface GameContextValue {
  // Navigation
  screen: Screen;
  setScreen: (s: Screen) => void;
  // Save
  activeSlot: number | "guest";
  save: SaveData | null;
  setSave: (s: SaveData) => void;
  persistSave: (s: SaveData) => void;
  // Round
  round: GameRound | null;
  startRound: (config: RoundConfig) => void;
  answerQuestion: (answer: string) => void;
  // Companion
  companion: CompanionId;
  setCompanion: (id: CompanionId) => void;
  // Settings
  muted: boolean;
  toggleMute: () => void;
  crtEffect: boolean;
  toggleCrt: () => void;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within PhonicsClient");
  return ctx;
}
