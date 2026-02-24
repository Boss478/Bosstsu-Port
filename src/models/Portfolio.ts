import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPortfolioItem extends Document {
  slug: string;
  title: string;
  description: string;
  content?: string;
  gallery?: string[];
  tools?: string[];
  cover: string;
  tags: string[];
  date: Date;
  published: boolean;
  relatedGalleryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioSchema: Schema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    content: { type: String },
    gallery: { type: [String], default: [] },
    tools: { type: [String], default: [] },
    cover: { type: String, required: true },
    tags: { type: [String], default: [] },
    date: { type: Date, required: true },
    published: { type: Boolean, default: true, index: true },
    relatedGalleryId: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
PortfolioSchema.index({ date: -1 });
PortfolioSchema.index({ slug: 1 }, { unique: true });
PortfolioSchema.index({ title: 'text', description: 'text', tags: 'text' });
PortfolioSchema.index({ relatedGalleryId: 1 });

const Portfolio: Model<IPortfolioItem> =
  mongoose.models.Portfolio || mongoose.model<IPortfolioItem>('Portfolio', PortfolioSchema);

export default Portfolio;
