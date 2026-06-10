import mongoose, { Schema, Document, Model } from 'mongoose';

export interface PageStat {
  path: string;
  count: number;
}

export interface EventStat {
  eventName: string;
  count: number;
}

export interface DeviceStat {
  type: string;
  count: number;
}

export interface ReferrerStat {
  referrer: string;
  count: number;
}

export interface IDailyAnalytics {
  date: string;
  totalViews: number;
  uniqueVisitors: number;
  topPages: PageStat[];
  topEvents: EventStat[];
  deviceBreakdown: DeviceStat[];
  referrerBreakdown: ReferrerStat[];
  updatedAt: Date;
}

export interface DailyAnalyticsDocument extends IDailyAnalytics, Document {}

const DailyAnalyticsSchema: Schema = new Schema(
  {
    date: { type: String, required: true, unique: true },
    totalViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    topPages: [{ path: String, count: Number }],
    topEvents: [{ eventName: String, count: Number }],
    deviceBreakdown: [{ type: String, count: Number }],
    referrerBreakdown: [{ referrer: String, count: Number }],
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

const DailyAnalytics: Model<DailyAnalyticsDocument> =
  mongoose.models.DailyAnalytics ||
  mongoose.model<DailyAnalyticsDocument>('DailyAnalytics', DailyAnalyticsSchema);

export default DailyAnalytics;
