export type Screen = 'menu' | 'game' | 'victory';

export type LevelType = 'match' | 'fill-upper' | 'fill-lower' | 'typing';
export type DataPool = 'lowercase' | 'thai' | 'phonics';

export interface LevelConfig {
  name: string;
  subtitle: string;
  target: number;
  type: LevelType;
  hideCount?: number;
  dataPool?: DataPool;
  revert?: boolean;
}

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
    onboardingSeen: [false, false, false, false, false, false],
  };
}

export function emptyRoundData(): RoundData {
  return {
    choices: [],
    grid: [],
    missingIndices: [],
    activeIndex: -1,
  };
}
