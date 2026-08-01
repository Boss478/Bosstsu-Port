import { afterAll, afterEach, vi } from 'vitest';

process.env.MONGODB_URI =
  process.env.TEST_MONGODB_URI ||
  'mongodb://admin:password123@localhost:27017/boss478_test?authSource=admin';
process.env.ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'test-admin-secret-key-2024';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password-1234';
process.env.PRIVATE_TOKEN_SECRET =
  process.env.PRIVATE_TOKEN_SECRET || 'test-private-secret-key-2024';
process.env.PRIVATE_PASSWORD = process.env.PRIVATE_PASSWORD || 'test-private-password-1234';
(process.env as Record<string, string>).NODE_ENV = 'test';

afterAll(() => {
  if (global.mongoose) {
    global.mongoose.conn = null;
    global.mongoose.promise = null;
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});
