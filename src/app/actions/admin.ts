'use server';

import dbConnect, { serializeDoc } from '@/lib/db';
import Portfolio from '@/models/Portfolio';
import Gallery from '@/models/Gallery';
import Learning from '@/models/Learning';
import Game from '@/models/Game';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import DailyAnalytics from '@/models/DailyAnalytics';
import { CONFIG } from '@/lib/config';
import { verifyAuth } from '@/lib/auth';
import { getEnv } from '@/lib/env';
import {
  aggregateTopPages,
  aggregateTopEvents,
  aggregateDeviceBreakdown,
  aggregateReferrerBreakdown,
  computeOSDeviceBreakdown,
} from '@/lib/analytics/aggregations';

export interface DbStats {
  connected: boolean;
  dbName: string;
  dbUri: string;
  host: string;
  collections: {
    name: string;
    count: number;
    icon: string;
  }[];
  serverStatus: {
    version: string;
    uptime: string;
  } | null;
}

export async function getDbStats(): Promise<DbStats> {
  const isAuth = await verifyAuth();
  if (!isAuth) throw new Error('Unauthorized');

  try {
    const conn = await dbConnect();
    const db = conn.connection.db;

    const [portfolioCount, galleryCount, learningCount, gameCount] = await Promise.all([
      Portfolio.countDocuments(),
      Gallery.countDocuments(),
      Learning.countDocuments(),
      Game.countDocuments(),
    ]);

    // Get server info
    let serverStatus = null;
    try {
      const info = await db!.admin().serverStatus();
      const uptimeSeconds = info.uptime;
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      serverStatus = {
        version: info.version,
        uptime: `${days}d ${hours}h ${minutes}m`,
      };
    } catch {
      // serverStatus may not be available with limited permissions
    }

    const uri = getEnv().MONGODB_URI || '';
    // Mask password in URI for display
    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');

    return {
      connected: true,
      dbName: conn.connection.name || 'boss478',
      dbUri: maskedUri,
      host: conn.connection.host || 'localhost',
      collections: [
        { name: 'Portfolio', count: portfolioCount, icon: 'fi fi-sr-briefcase' },
        { name: 'Gallery', count: galleryCount, icon: 'fi fi-sr-picture' },
        { name: 'Resources', count: learningCount, icon: 'fi fi-sr-book-alt' },
        { name: 'Game', count: gameCount, icon: 'fi fi-sr-gamepad' },
      ],
      serverStatus,
    };
  } catch {
    return {
      connected: false,
      dbName: '',
      dbUri: '',
      host: '',
      collections: [],
      serverStatus: null,
    };
  }
}

export async function getDashboardStats() {
  const isAuth = await verifyAuth();
  if (!isAuth) throw new Error('Unauthorized');

  await dbConnect();
  const [portfolioItems, galleryAlbums] = await Promise.all([
    Portfolio.find({})
      .sort({ updatedAt: -1 })
      .limit(CONFIG.PAGINATION.DASHBOARD_RECENT)
      .select('title slug coverImage date')
      .lean(),
    Gallery.find({})
      .sort({ updatedAt: -1 })
      .limit(CONFIG.PAGINATION.DASHBOARD_RECENT)
      .select('title slug coverImage date')
      .lean(),
  ]);
  return {
    portfolio: serializeDoc(portfolioItems),
    gallery: serializeDoc(galleryAlbums),
  };
}

export interface AnalyticsStats {
  summary: ReturnType<typeof serializeDoc<unknown[]>>;
  totalViews: number;
  totalEvents: number;
  topPages: { path: string; count: number }[];
  topEvents: { eventName: string; count: number }[];
  today: Record<string, unknown> | null;
  viewsOverTime: { date: string; views: number }[];
  deviceBreakdown: { type: string; count: number }[];
  referrerBreakdown: { referrer: string; count: number }[];
  trends: { todayViews: number; yesterdayViews: number; changePercent: number };
  hourlyDistribution: { hour: number; views: number }[];
  osBreakdown: { name: string; count: number }[];
  deviceModelBreakdown: { name: string; count: number }[];
}

export async function getAnalyticsStats(): Promise<AnalyticsStats> {
  const isAuth = await verifyAuth();
  if (!isAuth) throw new Error('Unauthorized');

  await dbConnect();

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayStr = todayStart.toISOString().slice(0, 10);
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const ninetyDaysAgo = new Date(todayStart.getTime() - 90 * 86400000);
  const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
  const todayStartBangkok = new Date(todayStart.getTime() - BANGKOK_OFFSET_MS);

  const [
    summary,
    totalViews,
    totalEvents,
    topPages,
    topEvents,
    viewsOverTime,
    deviceBreakdown,
    rawReferrerBreakdown,
    todayViews,
    yesterdayViews,
    hourlyDistribution,
    osDeviceModels,
  ] = await Promise.all([
    DailyAnalytics.find().sort({ date: -1 }).limit(90).lean(),
    AnalyticsEvent.countDocuments({ type: 'pageview', path: { $not: /^\/test\//i } }),
    AnalyticsEvent.countDocuments({}),
    aggregateTopPages(ninetyDaysAgo, 20),
    aggregateTopEvents(ninetyDaysAgo, 20),
    AnalyticsEvent.aggregate([
      {
        $match: {
          type: 'pageview',
          path: { $not: /^\/test\//i },
          timestamp: { $gte: ninetyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          views: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 90 },
      { $project: { _id: 0, date: '$_id', views: 1 } },
    ]),
    aggregateDeviceBreakdown(ninetyDaysAgo),
    aggregateReferrerBreakdown(ninetyDaysAgo),
    AnalyticsEvent.countDocuments({
      type: 'pageview',
      path: { $not: /^\/test\//i },
      timestamp: { $gte: todayStart },
    }),
    AnalyticsEvent.countDocuments({
      type: 'pageview',
      path: { $not: /^\/test\//i },
      timestamp: { $gte: yesterdayStart, $lt: todayStart },
    }),
    AnalyticsEvent.aggregate([
      {
        $match: {
          type: 'pageview',
          path: { $not: /^\/test\//i },
          timestamp: { $gte: todayStartBangkok },
        },
      },
      {
        $group: {
          _id: { $hour: { date: '$timestamp', timezone: 'Asia/Bangkok' } },
          views: { $sum: 1 },
        },
      },
      { $project: { _id: 0, hour: '$_id', views: 1 } },
    ]),
    computeOSDeviceBreakdown(ninetyDaysAgo),
  ]);

  const changePercent =
    yesterdayViews > 0 ? Math.round(((todayViews - yesterdayViews) / yesterdayViews) * 100) : 0;

  const todayDoc = summary.find((d: { date?: string }) => d.date === todayStr);
  const osBreakdown = osDeviceModels.osBreakdown;
  const deviceModelBreakdown = osDeviceModels.deviceModelBreakdown;

  return {
    summary: serializeDoc(summary),
    totalViews,
    totalEvents,
    topPages,
    topEvents,
    today: todayDoc ? serializeDoc(todayDoc) : null,
    viewsOverTime,
    deviceBreakdown,
    referrerBreakdown: rawReferrerBreakdown,
    trends: { todayViews, yesterdayViews, changePercent },
    hourlyDistribution,
    osBreakdown,
    deviceModelBreakdown,
  };
}

export async function computeDailyRollup(): Promise<void> {
  const isAuth = await verifyAuth();
  if (!isAuth) throw new Error('Unauthorized');

  await dbConnect();

  const today = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(`${today}T00:00:00.000Z`);

  const existing = await DailyAnalytics.findOne({ date: today }).select('updatedAt').lean();
  if (existing && Date.now() - existing.updatedAt.getTime() < 15 * 60 * 1000) {
    return;
  }

  const [
    totalViews,
    uniqueVisitors,
    topPages,
    deviceBreakdown,
    topEvents,
    referrerBreakdown,
    osDevice,
  ] = await Promise.all([
    AnalyticsEvent.countDocuments({
      timestamp: { $gte: todayDate },
      type: 'pageview',
      path: { $not: /^\/test\//i },
    }),
    AnalyticsEvent.distinct('sessionId', {
      timestamp: { $gte: todayDate },
    }),
    aggregateTopPages(todayDate, 10),
    aggregateDeviceBreakdown(todayDate),
    aggregateTopEvents(todayDate, 10),
    aggregateReferrerBreakdown(todayDate),
    computeOSDeviceBreakdown(todayDate),
  ]);

  await DailyAnalytics.findOneAndUpdate(
    { date: today },
    {
      totalViews,
      uniqueVisitors: uniqueVisitors.length,
      topPages: topPages.slice(0, 10),
      topEvents: topEvents.slice(0, 10),
      deviceBreakdown,
      referrerBreakdown,
      osBreakdown: osDevice.osBreakdown,
      deviceModelBreakdown: osDevice.deviceModelBreakdown,
      updatedAt: new Date(),
    },
    { upsert: true },
  );
}
