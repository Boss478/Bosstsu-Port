import mongoose, { Schema, Document, Model } from 'mongoose';

export type CefrLevel = 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2';

export interface IWordOverride extends Document {
  slug: string;
  word: string;
  level: CefrLevel;
  wordClass?: string;
  ipa?: string;
  ipaUs?: string;
  ipaUk?: string;
  stress?: number[];
  syllables?: string[];
  phonemes?: string[];
  definition?: string;
  example?: string;
  wordFamily?: string[];
  synonyms?: string[];
  collocations?: string[];
  spellingDistractors?: string[];
  tags?: string[];
  published?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WordOverrideSchema: Schema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    word: { type: String, required: true },
    level: {
      type: String,
      required: true,
      enum: ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'],
    },
    wordClass: { type: String },
    ipa: { type: String },
    ipaUs: { type: String },
    ipaUk: { type: String },
    stress: { type: [Number] },
    syllables: { type: [String] },
    phonemes: { type: [String] },
    definition: { type: String },
    example: { type: String },
    wordFamily: { type: [String] },
    synonyms: { type: [String] },
    collocations: { type: [String] },
    spellingDistractors: { type: [String] },
    tags: { type: [String], default: [] },
    published: { type: Boolean },
  },
  {
    timestamps: true,
  },
);

WordOverrideSchema.index({ word: 1 });
WordOverrideSchema.index({ level: 1, word: 1 });
WordOverrideSchema.index({ slug: 1, published: 1 });
WordOverrideSchema.index({ word: 'text', definition: 'text' });

const WordOverride: Model<IWordOverride> =
  mongoose.models.WordOverride || mongoose.model<IWordOverride>('WordOverride', WordOverrideSchema);

export default WordOverride;
