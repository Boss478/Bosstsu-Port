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
  const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 86400000);

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
  ] = await Promise.all([
    DailyAnalytics.find().sort({ date: -1 }).limit(90).lean(),
    AnalyticsEvent.countDocuments({ type: 'pageview' }),
    AnalyticsEvent.countDocuments({}),
    AnalyticsEvent.aggregate([
      { $match: { type: 'pageview' } },
      { $group: { _id: '$path', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $project: { _id: 0, path: '$_id', count: 1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { type: 'custom', eventName: { $ne: null } } },
      { $group: { _id: '$eventName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $project: { _id: 0, eventName: '$_id', count: 1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: ninetyDaysAgo } } },
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
    AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: ninetyDaysAgo } } },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } },
      { $project: { _id: 0, type: '$_id', count: 1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: ninetyDaysAgo }, type: 'pageview' } },
      { $group: { _id: '$referrer', count: { $sum: 1 } } },
      { $project: { _id: 0, referrer: { $ifNull: ['$_id', 'direct'] }, count: 1 } },
    ]),
    AnalyticsEvent.countDocuments({ timestamp: { $gte: todayStart } }),
    AnalyticsEvent.countDocuments({
      timestamp: { $gte: yesterdayStart, $lt: todayStart },
    }),
    AnalyticsEvent.aggregate([
      { $match: { type: 'pageview', timestamp: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $hour: { date: '$timestamp', timezone: 'Asia/Bangkok' } },
          views: { $sum: 1 },
        },
      },
      { $project: { _id: 0, hour: '$_id', views: 1 } },
    ]),
  ]);

  const changePercent =
    yesterdayViews > 0 ? Math.round(((todayViews - yesterdayViews) / yesterdayViews) * 100) : 0;

  const todayDoc = summary.find((d: { date?: string }) => d.date === todayStr);

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
  };
}

export async function computeDailyRollup(): Promise<void> {
  const isAuth = await verifyAuth();
  if (!isAuth) throw new Error('Unauthorized');

  await dbConnect();

  const today = new Date().toISOString().slice(0, 10);

  const todayDate = new Date(`${today}T00:00:00.000Z`);

  const [totalViews, uniqueVisitors, topPages, deviceBreakdown, topEvents, referrerBreakdown] =
    await Promise.all([
      AnalyticsEvent.countDocuments({
        timestamp: { $gte: todayDate },
        type: 'pageview',
      }),
      AnalyticsEvent.distinct('sessionId', {
        timestamp: { $gte: todayDate },
      }),
      AnalyticsEvent.aggregate([
        { $match: { timestamp: { $gte: todayDate }, type: 'pageview' } },
        { $group: { _id: '$path', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, path: '$_id', count: 1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { timestamp: { $gte: todayDate } } },
        { $group: { _id: '$deviceType', count: { $sum: 1 } } },
        { $project: { _id: 0, type: '$_id', count: 1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { timestamp: { $gte: todayDate }, type: 'custom', eventName: { $ne: null } } },
        { $group: { _id: '$eventName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, eventName: '$_id', count: 1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { timestamp: { $gte: todayDate }, type: 'pageview' } },
        { $group: { _id: '$referrer', count: { $sum: 1 } } },
        { $project: { _id: 0, referrer: { $ifNull: ['$_id', 'direct'] }, count: 1 } },
      ]),
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
      updatedAt: new Date(),
    },
    { upsert: true },
  );
}
