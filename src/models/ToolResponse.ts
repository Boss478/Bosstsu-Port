import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IToolResponse extends Document {
  sessionId: mongoose.Types.ObjectId;
  studentName?: string;
  content: Record<string, unknown>;
  fileUrl?: string;
  ipHash?: string;
  editToken?: string;
  createdAt: Date;
}

const ToolResponseSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'ToolSession', required: true },
    studentName: { type: String },
    content: { type: Schema.Types.Mixed, required: true },
    fileUrl: { type: String },
    ipHash: { type: String },
    editToken: { type: String },
  },
  { timestamps: true }
);

ToolResponseSchema.index({ sessionId: 1, createdAt: -1 });
ToolResponseSchema.index({ sessionId: 1, ipHash: 1 });
ToolResponseSchema.index({ editToken: 1 });

const ToolResponse: Model<IToolResponse> =
  mongoose.models.ToolResponse || mongoose.model<IToolResponse>('ToolResponse', ToolResponseSchema);

export default ToolResponse;