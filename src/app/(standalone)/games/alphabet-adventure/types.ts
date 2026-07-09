export type Screen = 'menu' | 'level-map' | 'stage-map' | 'game' | 'victory';

export type LevelType = 'match' | 'fill-upper' | 'fill-lower' | 'typing';
export type DataPool = 'lowercase' | 'thai' | 'phonics';

export interface GameState {
  level: number;
  score: number;
  round: number;
  winsInLevel: number;
  difficulty: number;
  consecutiveErrors: number;
  levelCorrect: number;
  levelTotal: number;
  currentStreak: number;
  bestStreak: number;
  wrongAttempts: number;
  wrongLetters: string[];
  easyMode: boolean;
  onboardingSeen: boolean[];
}

export interface SubStageConfig {
  id: number;
  name: string;
  subtitle: string;
  type: LevelType;
  dataPool?: DataPool;
  letterPool?: string[];
  hideLetters?: string[];
  revert?: boolean;
  targetMin: number;
}

export interface StageConfig {
  id: number;
  name: string;
  subtitle: string;
  letterGroup: string[];
  subStages: SubStageConfig[];
  perLetterMin: number;
}

export interface LetterTracker {
  correct: number;
  total: number;
}

export interface SubStageProgress {
  stars: number;
  completed: boolean;
  bestScore: number;
}

export interface StageProgress {
  unlocked: boolean;
  subStages: SubStageProgress[];
  completed: boolean;
}

export interface MapSaveData {
  version: number;
  totalScore: number;
  stages: StageProgress[];
  letterTracker: Record<string, LetterTracker>;
}

export interface GridCell {
  char: string;
  isHidden: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  value?: string;
}

export interface RoundData {
  targetLetter?: string;
  correctChar?: string;
  choices: string[];
  wrongChoices: string[];
  grid: GridCell[];
  missingIndices: number[];
  activeIndex: number;
  revert?: boolean;
}

export interface FeedbackState {
  text: string;
  type: 'correct' | 'wrong' | '';
  showCorrect?: string;
}

export function initialGameState(): GameState {
  return {
    level: 1,
    score: 0,
    round: 1,
    winsInLevel: 0,
    difficulty: 3,
    consecutiveErrors: 0,
    levelCorrect: 0,
    levelTotal: 0,
    currentStreak: 0,
    bestStreak: 0,
    wrongAttempts: 0,
    wrongLetters: [],
    easyMode: false,
    onboardingSeen: [false, false, false, false, false],
  };
}

export function emptyRoundData(): RoundData {
  return {
    choices: [],
    wrongChoices: [],
    grid: [],
    missingIndices: [],
    activeIndex: -1,
  };
}

export function initialStageProgress(unlocked: boolean): StageProgress {
  return {
    unlocked,
    subStages: Array.from({ length: 5 }, () => ({
      stars: 0,
      completed: false,
      bestScore: 0,
    })),
    completed: false,
  };
}

export function emptyMapSaveData(): MapSaveData {
  return {
    version: 3,
    totalScore: 0,
    stages: [
      initialStageProgress(true),
      initialStageProgress(false),
      initialStageProgress(false),
      initialStageProgress(false),
      initialStageProgress(false),
      initialStageProgress(false),
    ],
    letterTracker: {},
  };
}
