import mongoose, { Schema, Document, Model } from 'mongoose';

export type ToolType = 'padlet' | 'poll' | 'assignment' | 'qa_board' | 'quiz' | 'exit_ticket' | 'discussion';

export interface ISessionConfig {
  prompt?: string;
  allowAnonymous?: boolean;
  maxSubmissions?: number;
  allowFileUpload?: boolean;
  maxFileSize?: number;
  pollMode?: 'mcq' | 'wordcloud';
  allowCustomChoices?: boolean;
  questions?: Array<{
    question?: string;
    options?: string[];
    correctAnswer?: number;
  }>;
}

export interface IToolSession extends Document {
  sessionCode: string;
  type: ToolType;
  title: string;
  config: ISessionConfig;
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
  participantCount: number;
  responseCount: number;
  createdAt: Date;
}

const ToolSessionSchema = new Schema(
  {
    sessionCode: { type: String, required: true, unique: true },
    type: {
      type: String,
      required: true,
      enum: ['padlet', 'poll', 'assignment', 'qa_board', 'quiz', 'exit_ticket', 'discussion'],
    },
    title: { type: String, required: true },
    config: {
      prompt: { type: String },
      allowAnonymous: { type: Boolean, default: false },
      maxSubmissions: { type: Number, default: 10 },
      allowFileUpload: { type: Boolean, default: false },
      maxFileSize: { type: Number, default: 10 * 1024 * 1024 },
      pollMode: { type: String, enum: ['mcq', 'wordcloud'], default: 'mcq' },
      allowCustomChoices: { type: Boolean, default: false },
      questions: [{
        question: { type: String },
        options: [String],
        correctAnswer: { type: Number },
      }],
    },
    isActive: { type: Boolean, default: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    participantCount: { type: Number, default: 0 },
    responseCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ToolSessionSchema.index({ sessionCode: 1 });
ToolSessionSchema.index({ isActive: 1, sessionCode: 1 });

const ToolSession: Model<IToolSession> =
  mongoose.models.ToolSession || mongoose.model<IToolSession>('ToolSession', ToolSessionSchema);

export default ToolSession;