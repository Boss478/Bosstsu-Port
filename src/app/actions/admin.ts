'use server';

import dbConnect from '@/lib/db';
import Portfolio from '@/models/Portfolio';
import Gallery from '@/models/Gallery';

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
  try {
    const conn = await dbConnect();
    const db = conn.connection.db;

    const [portfolioCount, galleryCount] = await Promise.all([
      Portfolio.countDocuments(),
      Gallery.countDocuments(),
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

    const uri = process.env.MONGODB_URI || '';
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
        { name: 'Resources', count: 0, icon: 'fi fi-sr-book-alt' },
        { name: 'Game', count: 0, icon: 'fi fi-sr-gamepad' },
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

export async function getRecentItems() {
  await dbConnect();
  const [portfolioItems, galleryAlbums] = await Promise.all([
    Portfolio.find({}).sort({ updatedAt: -1 }).limit(5).lean(),
    Gallery.find({}).sort({ updatedAt: -1 }).limit(5).lean(),
  ]);
  return {
    portfolio: JSON.parse(JSON.stringify(portfolioItems)),
    gallery: JSON.parse(JSON.stringify(galleryAlbums)),
  };
}
