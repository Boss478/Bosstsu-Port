import AnalyticsEvent from '@/models/AnalyticsEvent';
import type { PipelineStage } from 'mongoose';

export function topPagesAggregation(since: Date, limit: number): PipelineStage[] {
  return [
    { $match: { type: 'pageview', timestamp: { $gte: since } } },
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
    { $match: { timestamp: { $gte: since }, type: 'pageview' } },
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
