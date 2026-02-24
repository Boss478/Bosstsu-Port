import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITag extends Document {
  name: string;
  category: string;
  createdAt: Date;
}

const TagSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

TagSchema.index({ name: 1, category: 1 }, { unique: true });

const Tag: Model<ITag> =
  mongoose.models.Tag || mongoose.model<ITag>('Tag', TagSchema);

export default Tag;
