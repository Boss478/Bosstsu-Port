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


