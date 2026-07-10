import type { MapSaveData } from './types';
import { emptyMapSaveData } from './types';
import { MAP_SAVE_KEY } from './constants';

export function loadMapSave(): MapSaveData {
  if (typeof window === 'undefined') return emptyMapSaveData();

  try {
    const raw = localStorage.getItem(MAP_SAVE_KEY);
    if (!raw) return emptyMapSaveData();
    const data = JSON.parse(raw) as MapSaveData;
    if (data.version < 4) return emptyMapSaveData();
    return data;
  } catch {
    return emptyMapSaveData();
  }
}

export function saveMapSave(data: MapSaveData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MAP_SAVE_KEY, JSON.stringify(data));
}
