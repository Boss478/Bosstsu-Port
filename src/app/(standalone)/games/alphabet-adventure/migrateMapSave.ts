import type { MapSaveData } from './types';
import { emptyMapSaveData } from './types';
import { MAP_SAVE_KEY, PROGRESS_KEY, HIGH_SCORE_KEY } from './constants';

interface OldSave {
  gameState: { score?: number; level?: number };
  stageStars?: number[];
}

export function migrateOldSave(): MapSaveData {
  if (typeof window === 'undefined') return emptyMapSaveData();

  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) return emptyMapSaveData();

  try {
    const old: OldSave = JSON.parse(raw);
    const completedCount = old.stageStars?.filter((s) => s > 0)?.length ?? 0;

    const data = emptyMapSaveData();
    data.totalScore = old.gameState?.score ?? 0;

    if (data.totalScore === 0) {
      const oldHighScore = localStorage.getItem(HIGH_SCORE_KEY);
      if (oldHighScore) data.totalScore = Number(oldHighScore);
    }

    for (let i = 0; i < 6; i++) {
      if (i < completedCount) {
        const stars = old.stageStars?.[i] ?? 3;
        data.stages[i] = {
          unlocked: true,
          subStages: Array.from({ length: 5 }, () => ({
            stars,
            completed: true,
            bestScore: Math.round(data.totalScore / Math.max(completedCount, 1)),
          })),
          completed: true,
        };
      } else if (i === completedCount) {
        data.stages[i].unlocked = true;
      }
    }

    localStorage.removeItem(PROGRESS_KEY);
    data.version = 3;

    localStorage.setItem(MAP_SAVE_KEY, JSON.stringify(data));
    return data;
  } catch {
    return emptyMapSaveData();
  }
}

export function migrateV2ToV3(data: MapSaveData): MapSaveData {
  if (data.version === 3) return data;

  for (const stage of data.stages) {
    if (stage.subStages.length === 6) {
      const oldSubs = stage.subStages;
      stage.subStages = [oldSubs[0], oldSubs[1], oldSubs[2], oldSubs[3], oldSubs[5]];
    }
  }
  data.version = 3;
  return data;
}

export function loadMapSave(): MapSaveData {
  if (typeof window === 'undefined') return emptyMapSaveData();

  try {
    const raw = localStorage.getItem(MAP_SAVE_KEY);
    if (!raw) return migrateOldSave();
    const data = JSON.parse(raw) as MapSaveData;
    return migrateV2ToV3(data);
  } catch {
    return emptyMapSaveData();
  }
}

export function saveMapSave(data: MapSaveData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MAP_SAVE_KEY, JSON.stringify(data));
}
