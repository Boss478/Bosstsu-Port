import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalyticsEvent {
  type: 'pageview' | 'custom';
  path: string;
  timestamp: Date;
  sessionId: string;
  eventName?: string;
  metadata?: Record<string, unknown>;
  referrer?: string;
  userAgent?: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  ipHash?: string;
}

export interface AnalyticsEventDocument extends IAnalyticsEvent, Document {}

const AnalyticsEventSchema: Schema = new Schema(
  {
    type: { type: String, enum: ['pageview', 'custom'], required: true },
    path: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    sessionId: { type: String, required: true },
    eventName: { type: String },
    metadata: { type: Schema.Types.Mixed },
    referrer: { type: String },
    userAgent: { type: String },
    deviceType: { type: String, enum: ['desktop', 'tablet', 'mobile'], required: true },
    ipHash: { type: String },
  },
  { timestamps: false, strict: true },
);

AnalyticsEventSchema.index({ timestamp: -1 });
AnalyticsEventSchema.index({ path: 1, timestamp: -1 });
AnalyticsEventSchema.index({ eventName: 1, timestamp: -1 });

const AnalyticsEvent: Model<AnalyticsEventDocument> =
  mongoose.models.AnalyticsEvent ||
  mongoose.model<AnalyticsEventDocument>('AnalyticsEvent', AnalyticsEventSchema);

export default AnalyticsEvent;
