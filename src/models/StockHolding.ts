import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStockHolding extends Document {
  symbol: string;
  shares: number;
  avgCost: number;
  manualPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const StockHoldingSchema: Schema = new Schema(
  {
    symbol: { type: String, required: true, unique: true, uppercase: true },
    shares: { type: Number, required: true },
    avgCost: { type: Number, required: true },
    manualPrice: { type: Number },
  },
  { timestamps: true }
);

const StockHolding: Model<IStockHolding> =
  mongoose.models.StockHolding || mongoose.model<IStockHolding>('StockHolding', StockHoldingSchema);

export default StockHolding;
