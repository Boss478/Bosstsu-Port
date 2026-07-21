import { createContext, useContext } from 'react';
import type {
  Screen,
  SaveData,
  GameRound,
  RoundConfig,
  CompanionId,
  Question,
  StageData,
  StageLesson,
  MapView,
  Tab,
  ActivityData,
  SimilarSoundGroup,
  VocabGroupDef,
} from './types';

export interface GameContextValue {
  // Navigation
  screen: Screen;
  setScreen: (s: Screen) => void;
  tab: Tab;
  setTab: (t: Tab) => void;
  // Map view navigation (groups → stages → activities)
  mapView: MapView;
  setMapView: (v: MapView) => void;
  selectedGroup: SimilarSoundGroup | VocabGroupDef | null;
  selectGroup: (g: SimilarSoundGroup | VocabGroupDef | null) => void;
  selectedActivity: ActivityData | null;
  selectActivity: (a: ActivityData | null) => void;
  // Save
  activeSlot: number | 'guest';
  save: SaveData | null;
  persistSave: (s: SaveData) => void;
  deleteSaveSlot: () => void;
  // Stage selection (path → confirm popup)
  selectedStage: StageData | null;
  selectStage: (stage: StageData | null) => void;
  // Lesson from stage popup
  selectedLesson: StageLesson | null;
  selectLesson: (lesson: StageLesson | null) => void;
  // Round
  round: GameRound | null;
  startRound: (config: RoundConfig) => void;
  answerQuestion: (answer: string, question: Question) => void;
  nextQuestion: () => void;
  // Companion
  companion: CompanionId;
  setCompanion: (id: CompanionId) => void;
  // Settings
  muted: boolean;
  toggleMute: () => void;
  // Settings
  gridColumns: 2 | 3;
  setGridColumns: (cols: 2 | 3) => void;
  companionSnap: 'left' | 'right' | 'free';
  setCompanionSnap: (snap: 'left' | 'right' | 'free') => void;
  // Voice settings
  voiceURI: string;
  setVoiceURI: (uri: string) => void;
  voices: SpeechSynthesisVoice[];
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  speechPitch: number;
  setSpeechPitch: (pitch: number) => void;
  // Prefetch
  prefetchWords: (
    words: string[],
    onProgress?: (loaded: number, total: number) => void,
  ) => Promise<void>;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within PhonicsClient');
  return ctx;
}
