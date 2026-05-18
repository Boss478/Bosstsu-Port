import mongoose from 'mongoose';
import { DB } from './constants';

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
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
      maxPoolSize: DB.POOL.MAX,
      minPoolSize: DB.POOL.MIN,
      serverSelectionTimeoutMS: DB.TIMEOUTS.SERVER_SELECTION,
      socketTimeoutMS: DB.TIMEOUTS.SOCKET,
      connectTimeoutMS: DB.TIMEOUTS.CONNECT,
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

export function serializeDoc<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

export default dbConnect;
