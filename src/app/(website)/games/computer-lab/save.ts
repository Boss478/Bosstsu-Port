import type { SaveData, StageId, GameSettings, LabCoatColor } from "./types";

const SAVE_KEY = "computer_lab_save";
const CURRENT_VERSION = 2;

const DEFAULT_SETTINGS: GameSettings = {
  lang: "th",
  mode: "student",
  quality: "32",
  muted: false,
  volume: 0.7,
};

function makeDefaultProgress(): Record<StageId, { completed: boolean; stars: number; bestScore: number; unlocked: boolean }> {
  return {
    hardware: { completed: false, stars: 0, bestScore: 0, unlocked: true },
    software: { completed: false, stars: 0, bestScore: 0, unlocked: false },
    workflow: { completed: false, stars: 0, bestScore: 0, unlocked: false },
    build: { completed: false, stars: 0, bestScore: 0, unlocked: false },
    diagnosis: { completed: false, stars: 0, bestScore: 0, unlocked: false },
  };
}

export function getDefaultSave(): SaveData {
  return {
    version: CURRENT_VERSION,
    timestamp: Date.now(),
    progress: makeDefaultProgress(),
    settings: { ...DEFAULT_SETTINGS },
    biosSeen: false,
    completedScenarios: [],
    unlockedMuseum: false,
    playCount: 0,
    lastPlayed: 0,
    playerName: "",
    labCoatColor: "white" as LabCoatColor,
    robotClicks: 0,
    pongUnlocked: false,
    tourCompleted: false,
    dailyChallenge: { date: "", completed: false, score: 0, bestScore: 0, bestTime: 0 },
    cards: [],
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return getDefaultSave();
    const data = JSON.parse(raw) as SaveData;
    if (data.version === 1) {
      data.playerName = data.playerName ?? "";
      data.labCoatColor = data.labCoatColor ?? "white";
      data.robotClicks = data.robotClicks ?? 0;
      data.pongUnlocked = data.pongUnlocked ?? false;
      data.tourCompleted = data.tourCompleted ?? false;
      data.dailyChallenge = data.dailyChallenge ?? { date: "", completed: false, score: 0, bestScore: 0, bestTime: 0 };
      data.cards = data.cards ?? [];
      data.version = 2;
    }
    if (data.version !== CURRENT_VERSION) return getDefaultSave();
    return data;
  } catch {
    return getDefaultSave();
  }
}

export function saveSave(data: SaveData): void {
  try {
    data.timestamp = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
  }
}

export function resetSave(): SaveData {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
  }
  return getDefaultSave();
}

export function canUnlockStage(stage: StageId, progress: Record<StageId, { completed: boolean; stars: number; bestScore: number; unlocked: boolean }>): boolean {
  const order: StageId[] = ["hardware", "software", "workflow", "build", "diagnosis"];
  const idx = order.indexOf(stage);
  if (idx === 0) return true;
  const prev = order[idx - 1];
  return progress[prev]?.completed === true;
}

export function unlockNextStages(data: SaveData): void {
  const order: StageId[] = ["hardware", "software", "workflow", "build", "diagnosis"];
  for (const stage of order) {
    if (!data.progress[stage].unlocked && canUnlockStage(stage, data.progress)) {
      data.progress[stage].unlocked = true;
    }
  }
}
