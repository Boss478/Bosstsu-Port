import mongoose, { Schema, Document, Model } from 'mongoose';

interface IToolResponse extends Document {
  sessionId: mongoose.Types.ObjectId;
  studentName?: string;
  content: Record<string, unknown>;
  fileUrl?: string;
  studentToken?: string;
  editToken?: string;
  ip?: string;
  stepIndex?: number;
  createdAt: Date;
}

const ToolResponseSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'ToolSession', required: true },
    studentName: { type: String },
    content: { type: Schema.Types.Mixed, required: true },
    fileUrl: { type: String },
    studentToken: { type: String },
    editToken: { type: String },
    ip: { type: String },
    stepIndex: { type: Number },
  },
  { timestamps: true }
);

ToolResponseSchema.index({ sessionId: 1, createdAt: -1 });
ToolResponseSchema.index({ sessionId: 1, studentToken: 1 });
ToolResponseSchema.index({ sessionId: 1, ip: 1 });
ToolResponseSchema.index({ editToken: 1 });
ToolResponseSchema.index({ sessionId: 1, stepIndex: 1 });

const ToolResponse: Model<IToolResponse> =
  mongoose.models.ToolResponse || mongoose.model<IToolResponse>('ToolResponse', ToolResponseSchema);

export default ToolResponse;