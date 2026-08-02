import mongoose, { Schema, Model } from 'mongoose';

export interface IToolFocusEntry {
  sessionId: mongoose.Types.ObjectId;
  entries: Array<Record<string, unknown>>;
  totalMs?: number;
  userAgent?: string;
  submittedAt: Date;
}

const ToolFocusEntrySchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'ToolSession', required: true },
    entries: { type: [Schema.Types.Mixed], required: true },
    totalMs: { type: Number },
    userAgent: { type: String },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

ToolFocusEntrySchema.index({ sessionId: 1, submittedAt: -1 });

const ToolFocusEntry: Model<IToolFocusEntry> =
  mongoose.models.ToolFocusEntry ||
  mongoose.model<IToolFocusEntry>('ToolFocusEntry', ToolFocusEntrySchema);

export default ToolFocusEntry;
