import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    type: { type: String, required: true, enum: ['income', 'expense'] },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    description: { type: String, default: '' },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

TransactionSchema.index({ date: -1 });
TransactionSchema.index({ type: 1, date: -1 });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
