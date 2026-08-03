import type { MapSaveData } from './types';
import { emptyMapSaveData } from './types';
import { MAP_SAVE_KEY } from './constants';
import { safeGetJSON, safeSetJSON } from '@/lib/storage';

export function loadMapSave(): MapSaveData {
  const data = safeGetJSON<MapSaveData>(MAP_SAVE_KEY);
  if (!data || data.version < 4) return emptyMapSaveData();
  if (!Array.isArray(data.stages) || data.stages.length === 0) return emptyMapSaveData();
  if (
    !data.letterTracker ||
    typeof data.letterTracker !== 'object' ||
    Array.isArray(data.letterTracker)
  ) {
    return emptyMapSaveData();
  }
  return data;
}

export function saveMapSave(data: MapSaveData): void {
  safeSetJSON(MAP_SAVE_KEY, data);
}
