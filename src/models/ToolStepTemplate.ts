import { Schema, model, models } from 'mongoose';
import type { ToolType } from './ToolSession';

export interface IToolStepTemplate {
  type: ToolType;
  title: string;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ToolStepTemplateSchema = new Schema<IToolStepTemplate>(
  {
    type: {
      type: String,
      required: true,
      enum: ['padlet', 'poll', 'assignment', 'qa_board', 'quiz', 'exit_ticket'],
    },
    title: { type: String, required: true },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

ToolStepTemplateSchema.index({ type: 1, title: 1 }, { unique: true });

export default models.ToolStepTemplate || model<IToolStepTemplate>('ToolStepTemplate', ToolStepTemplateSchema);
