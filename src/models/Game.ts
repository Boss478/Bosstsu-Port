import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGame extends Document {
  slug: string;
  title: string;
  description: string;
  category: string;
  playUrl: string;
  thumbnail: string;
  instructions?: string;
  tags: string[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema: Schema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    playUrl: { type: String, required: true },
    thumbnail: { type: String, required: true },
    instructions: { type: String },
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
GameSchema.index({ category: 1 });
GameSchema.index({ published: 1, createdAt: -1 });

const Game: Model<IGame> =
  mongoose.models.Game || mongoose.model<IGame>('Game', GameSchema);

export default Game;
