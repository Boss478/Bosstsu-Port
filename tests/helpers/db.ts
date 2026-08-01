import mongoose from 'mongoose';

const TEST_MONGODB_URI =
  process.env.TEST_MONGODB_URI ||
  'mongodb://admin:password123@localhost:27017/boss478_test?authSource=admin';

let isConnected = false;

export async function connectTestDb(): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  await mongoose.connect(TEST_MONGODB_URI, {
    bufferCommands: false,
    maxPoolSize: 3,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    connectTimeoutMS: 5000,
  });

  if (global.mongoose) {
    global.mongoose.conn = mongoose;
    global.mongoose.promise = null;
  } else {
    global.mongoose = { conn: mongoose, promise: null };
  }

  isConnected = true;
  return mongoose;
}

export async function disconnectTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (global.mongoose) {
    global.mongoose.conn = null;
    global.mongoose.promise = null;
  } else {
    global.mongoose = { conn: null, promise: null };
  }
  isConnected = false;
}

export async function clearCollection(collectionName: string): Promise<void> {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    await mongoose.connection.db.collection(collectionName).deleteMany({});
  }
}

export async function clearAllCollections(): Promise<void> {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) return;

  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const col of collections) {
    if (col.name.startsWith('system.')) continue;
    await mongoose.connection.db.collection(col.name).deleteMany({});
  }
}

export function getTestDbUri(): string {
  return TEST_MONGODB_URI;
}
