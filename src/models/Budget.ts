import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBudgetCategory {
  category: string;
  limit: number;
}

export interface IBudget extends Document {
  month: string;
  budgets: IBudgetCategory[];
  createdAt: Date;
  updatedAt: Date;
}

const BudgetCategorySchema = new Schema(
  {
    category: { type: String, required: true },
    limit: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const BudgetSchema: Schema = new Schema(
  {
    month: { type: String, required: true, unique: true },
    budgets: { type: [BudgetCategorySchema], default: [] },
  },
  { timestamps: true }
);

BudgetSchema.index({ month: 1 }, { unique: true });

const Budget: Model<IBudget> =
  mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);

export default Budget;
