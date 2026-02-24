import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILearningResource extends Document {
  title: string;
  description: string;
  subject: string;
  type: string;
  link: string;
  thumbnail?: string;
  tags: string[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LearningSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    subject: { type: String, required: true },
    type: { type: String, required: true },
    link: { type: String, required: true },
    thumbnail: { type: String },
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

const Learning: Model<ILearningResource> =
  mongoose.models.Learning || mongoose.model<ILearningResource>('Learning', LearningSchema);

export default Learning;
