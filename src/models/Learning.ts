import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILearningResource extends Document {
  title: string;
  description: string;
  subject: string;
  type: string;
  link?: string;
  thumbnail?: string;
  tags: string[];
  published: boolean;
  content?: string;
  embedCode?: string;
  fileUrl?: string;
  youtubeId?: string;
  canvaEmbed?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LearningSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    subject: { type: String, required: true },
    type: { type: String, required: true },
    link: { type: String },
    thumbnail: { type: String },
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: true },
    content: { type: String },
    embedCode: { type: String },
    fileUrl: { type: String },
    youtubeId: { type: String },
    canvaEmbed: { type: String },
  },
  {
    timestamps: true,
  }
);

LearningSchema.index({ title: 1 });
LearningSchema.index({ published: 1, createdAt: -1 });
LearningSchema.index({ published: 1, type: 1 });
LearningSchema.index({ published: 1, tags: 1 });

const Learning: Model<ILearningResource> =
  mongoose.models.Learning || mongoose.model<ILearningResource>('Learning', LearningSchema);

export default Learning;
