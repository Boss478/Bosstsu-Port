export type Screen =
  | "boot"
  | "menu"
  | "hardware"
  | "software"
  | "workflow"
  | "build"
  | "diagnosis"
  | "victory"
  | "pong";

export type StageId = "hardware" | "software" | "workflow" | "build" | "diagnosis";
export type LangCode = "th" | "en";
export type LabCoatColor = "white" | "blue" | "green" | "red" | "purple" | "black";

export type GameMode = "student" | "advanced";
export type SpriteQuality = "16" | "32";

export interface SpriteData {
  width: number;
  height: number;
  pixels: number[][];
}

export interface StageProgress {
  completed: boolean;
  stars: number;
  bestScore: number;
  unlocked: boolean;
}

export interface GameSettings {
  lang: LangCode;
  mode: GameMode;
  quality: SpriteQuality;
  muted: boolean;
  volume: number;
}

export interface DailyChallengeData {
  date: string;
  completed: boolean;
  score: number;
  bestScore: number;
  bestTime: number;
}

export interface SaveData {
  version: number;
  timestamp: number;
  progress: Record<StageId, StageProgress>;
  settings: GameSettings;
  biosSeen: boolean;
  completedScenarios: string[];
  unlockedMuseum: boolean;
  playCount: number;
  lastPlayed: number;
  playerName: string;
  labCoatColor: LabCoatColor;
  robotClicks: number;
  pongUnlocked: boolean;
  tourCompleted: boolean;
  dailyChallenge: DailyChallengeData;
  cards: string[];
}

export interface GameCtx {
  lang: LangCode;
  mode: GameMode;
  quality: SpriteQuality;
  settings: GameSettings;
  save: SaveData;
  updateSettings: (partial: Partial<GameSettings>) => void;
  updateSave: (partial: Partial<SaveData>) => void;
  navigate: (screen: Screen) => void;
  playSfx: (name: string) => void;
  isMuted: boolean;
  onStageComplete: (stageId: string, stars: number, score: number) => void;
  devMode: boolean;
}

export interface ScreenShellProps {
  onNavigate: (screen: Screen) => void;
}
