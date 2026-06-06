import mongoose from 'mongoose';
import { CONFIG } from '@/lib/config';
import { getEnv } from '@/lib/env';

function getMongoUri(): string {
  const uri = getEnv().MONGODB_URI;
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }
  return uri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose as MongooseCache;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: CONFIG.DB.POOL.MAX,
      minPoolSize: CONFIG.DB.POOL.MIN,
      serverSelectionTimeoutMS: CONFIG.DB.TIMEOUTS.SERVER_SELECTION,
      socketTimeoutMS: CONFIG.DB.TIMEOUTS.SOCKET,
      connectTimeoutMS: CONFIG.DB.TIMEOUTS.CONNECT,
    };

    cached.promise = mongoose.connect(getMongoUri(), opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export type SerializedDoc<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K] extends object ? SerializedDoc<T[K]> : T[K];
};

export function serializeDoc<T>(doc: T): SerializedDoc<T> {
  return JSON.parse(JSON.stringify(doc)) as unknown as SerializedDoc<T>;
}

export default dbConnect;
