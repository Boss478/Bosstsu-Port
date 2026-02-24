import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGame extends Document {
  title: string;
  description: string;
  genre: string;
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
    title: { type: String, required: true },
    description: { type: String, required: true },
    genre: { type: String, required: true },
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

const Game: Model<IGame> =
  mongoose.models.Game || mongoose.model<IGame>('Game', GameSchema);

export default Game;
