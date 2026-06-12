import AnalyticsEvent from '@/models/AnalyticsEvent';
import type { PipelineStage } from 'mongoose';
import { UAParser } from 'ua-parser-js';
import type { NameCountStat } from '@/models/DailyAnalytics';

export async function computeOSDeviceBreakdown(
  since: Date,
): Promise<{ osBreakdown: NameCountStat[]; deviceModelBreakdown: NameCountStat[] }> {
  const docs = await AnalyticsEvent.find({
    timestamp: { $gte: since },
    userAgent: { $ne: null, $exists: true },
  })
    .select('userAgent')
    .lean()
    .then((d) => d as { userAgent?: string }[]);

  const osMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();

  for (const doc of docs) {
    if (!doc.userAgent) continue;
    const parser = new UAParser(doc.userAgent);
    const os = parser.getOS();
    const device = parser.getDevice();

    const osName = os.name || 'Unknown';
    osMap.set(osName, (osMap.get(osName) || 0) + 1);

    const model =
      device.vendor && device.model
        ? `${device.vendor} ${device.model}`
        : device.model || 'Desktop';
    deviceMap.set(model, (deviceMap.get(model) || 0) + 1);
  }

  return {
    osBreakdown: Array.from(osMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    deviceModelBreakdown: Array.from(deviceMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export function topPagesAggregation(since: Date, limit: number): PipelineStage[] {
  return [
    { $match: { type: 'pageview', path: { $not: /^\/test\//i }, timestamp: { $gte: since } } },
    { $group: { _id: '$path', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { _id: 0, path: '$_id', count: 1 } },
  ];
}

export function topEventsAggregation(since: Date, limit: number): PipelineStage[] {
  return [
    { $match: { type: 'custom', eventName: { $ne: null }, timestamp: { $gte: since } } },
    { $group: { _id: '$eventName', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { _id: 0, eventName: '$_id', count: 1 } },
  ];
}

export function deviceBreakdownAggregation(since: Date): PipelineStage[] {
  return [
    { $match: { timestamp: { $gte: since } } },
    { $group: { _id: '$deviceType', count: { $sum: 1 } } },
    { $project: { _id: 0, type: '$_id', count: 1 } },
  ];
}

export function referrerBreakdownAggregation(since: Date): PipelineStage[] {
  return [
    { $match: { type: 'pageview', path: { $not: /^\/test\//i }, timestamp: { $gte: since } } },
    { $group: { _id: '$referrer', count: { $sum: 1 } } },
    { $project: { _id: 0, referrer: { $ifNull: ['$_id', 'direct'] }, count: 1 } },
  ];
}

export async function aggregateTopPages(since: Date, limit: number) {
  return AnalyticsEvent.aggregate(topPagesAggregation(since, limit));
}

export async function aggregateTopEvents(since: Date, limit: number) {
  return AnalyticsEvent.aggregate(topEventsAggregation(since, limit));
}

export async function aggregateDeviceBreakdown(since: Date) {
  return AnalyticsEvent.aggregate(deviceBreakdownAggregation(since));
}

export async function aggregateReferrerBreakdown(since: Date) {
  return AnalyticsEvent.aggregate(referrerBreakdownAggregation(since));
}
