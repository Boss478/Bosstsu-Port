export type Screen = "menu" | "game" | "victory";

export type LevelType = "match" | "fill-upper" | "fill-lower" | "typing";

export interface LevelConfig {
  name: string;
  subtitle: string;
  target: number;
  type: LevelType;
  hideCount?: number;
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
}

export interface FeedbackState {
  text: string;
  type: "correct" | "wrong" | "";
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