'use server';

import dbConnect, { serializeDoc } from '@/lib/db';
import Portfolio from '@/models/Portfolio';
import Gallery from '@/models/Gallery';
import Learning from '@/models/Learning';
import Game from '@/models/Game';
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
    Portfolio.find({}).sort({ updatedAt: -1 }).limit(CONFIG.PAGINATION.DASHBOARD_RECENT)
      .select('title slug coverImage date')
      .lean(),
    Gallery.find({}).sort({ updatedAt: -1 }).limit(CONFIG.PAGINATION.DASHBOARD_RECENT)
      .select('title slug coverImage date')
      .lean(),
  ]);
  return {
    portfolio: serializeDoc(portfolioItems),
    gallery: serializeDoc(galleryAlbums),
  };
}
