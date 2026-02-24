import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGalleryAlbum extends Document {
  slug: string;
  title: string;
  description?: string;
  cover: string;
  tags: string[];
  date: Date;
  photos: string[];
  published: boolean;
  relatedPortfolioId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GallerySchema: Schema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    cover: { type: String, required: true },
    tags: { type: [String], default: [] },
    date: { type: Date, default: Date.now },
    photos: { type: [String], default: [] },
    published: { type: Boolean, default: true, index: true },
    relatedPortfolioId: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
GallerySchema.index({ date: -1 });
GallerySchema.index({ slug: 1 }, { unique: true });
GallerySchema.index({ title: 'text', description: 'text', tags: 'text' });
GallerySchema.index({ relatedPortfolioId: 1 });

const Gallery: Model<IGalleryAlbum> =
  mongoose.models.Gallery || mongoose.model<IGalleryAlbum>('Gallery', GallerySchema);

export default Gallery;
