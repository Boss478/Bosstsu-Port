export type ToolType = 'padlet' | 'poll' | 'assignment' | 'qa_board' | 'quiz' | 'exit_ticket';

export type DeviceTier = 'max' | 'ultra' | 'high' | 'medium' | 'low' | 'fast';

export interface ToolQuestion {
  question?: string;
  options?: string[];
  correctAnswer?: number;
  maxSubmissions?: number;
  allowFileUpload?: boolean;
}

export interface ToolStep {
  type: string;
  title: string;
  config?: Record<string, unknown>;
}

export interface ToolSessionConfig {
  description?: string;
  prompt?: string;
  pollMode?: string;
  allowCustomChoices?: boolean;
  maxSubmissions?: number;
  enableMascots?: boolean;
  allowFileUpload?: boolean;
  forceTier?: DeviceTier;
  customTierConfig?: Record<string, unknown>;
  questions?: ToolQuestion[];
}

export interface ToolSessionClient {
  _id: string;
  title?: string;
  sessionCode?: string;
  type?: ToolType;
  isActive?: boolean;
  endedAt?: string;
  requireStudentName?: boolean;
  allowStudentNavigation?: boolean;
  currentStep?: number;
  lastActiveStep?: number;
  config?: ToolSessionConfig;
  steps?: ToolStep[];
}
