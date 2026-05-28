import mongoose, { Schema, Document, Model } from 'mongoose';

export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'quarterly';

export interface ISubscription extends Document {
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  category: string;
  nextBillingDate: Date;
  active: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    billingCycle: { type: String, required: true, enum: ['monthly', 'yearly', 'weekly', 'quarterly'] },
    category: { type: String, required: true },
    nextBillingDate: { type: Date, required: true },
    active: { type: Boolean, default: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ active: 1 });
SubscriptionSchema.index({ nextBillingDate: 1 });

const Subscription: Model<ISubscription> =
  mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;
