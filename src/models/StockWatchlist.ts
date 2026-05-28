import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStockWatchlist extends Document {
  symbols: string[];
  createdAt: Date;
  updatedAt: Date;
}

const StockWatchlistSchema: Schema = new Schema(
  {
    symbols: { type: [String], default: [] },
  },
  { timestamps: true }
);

const StockWatchlist: Model<IStockWatchlist> =
  mongoose.models.StockWatchlist || mongoose.model<IStockWatchlist>('StockWatchlist', StockWatchlistSchema);

export default StockWatchlist;
