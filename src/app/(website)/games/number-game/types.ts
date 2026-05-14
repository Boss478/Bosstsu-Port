export type Screen = "menu" | "range" | "game" | "victory";

export interface VisualData {
  emoji: string;
  count: number;
  countA?: number;
  countB?: number;
}

export interface Question {
  text: string;
  correct: string;
  options: string[];
  stageType: number;
  visualData?: VisualData;
}

export interface GameState {
  score: number;
  stage: number;
  isEndless: boolean;
  questionsDone: number;
  seqTotal: number;
  sequentialMode: boolean;
  sequentialIndex: number;
  reviewRoundActive: boolean;
  reviewNumbers: number[];
  reviewIndex: number;
  stageCorrect: number;
  stageTotal: number;
  totalCorrect: number;
  totalQuestions: number;
  bestStreak: number;
  currentStreak: number;
  stageDone: number;
}

export interface FeedbackState {
  text: string;
  type: "correct" | "wrong" | "";
  showCorrect?: string;
}

export interface RangeOption {
  id: string;
  label: string;
  min: number;
  max: number;
}

export type GameAction =
  | { type: "START_GAME"; range: RangeOption }
  | { type: "CORRECT_ANSWER"; range: RangeOption }
  | { type: "WRONG_ANSWER" }
  | { type: "ADVANCE_SEQUENTIAL"; range: RangeOption }
  | { type: "FINISH_SEQUENTIAL" }
  | { type: "ADVANCE_REVIEW" }
  | { type: "FINISH_REVIEW"; range: RangeOption }
  | { type: "PROGRESS_STAGE"; nextStage: number }
  | { type: "VICTORY" }
  | { type: "START_ENDLESS" }
  | { type: "GO_MENU" }
  | { type: "GO_RANGE" }
  | { type: "GO_GAME"; state: GameState };
