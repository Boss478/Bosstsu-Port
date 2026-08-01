import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { GET } from '@/app/api/tools/session/route';
import { createGetRequest } from '../helpers/request';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../helpers/db';
import { seedSession } from '../helpers/seed';

describe('/api/tools/session', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAllCollections();
  });

  it('returns 400 without session code', async () => {
    const req = createGetRequest('/api/tools/session');
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe('Missing session code');
  });

  it('returns 404 for non-existent session', async () => {
    const req = createGetRequest('/api/tools/session', { searchParams: { code: 'XXXXX' } });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBe('Session not found');
  });

  it('returns session data for valid code', async () => {
    await seedSession({ sessionCode: 'TEST1', title: 'My Session', type: 'padlet' });

    const req = createGetRequest('/api/tools/session', { searchParams: { code: 'TEST1' } });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.sessionCode).toBe('TEST1');
    expect(data.title).toBe('My Session');
    expect(data.type).toBe('padlet');
    expect(data.isActive).toBe(true);
  });

  it('returns cache headers', async () => {
    await seedSession({ sessionCode: 'CHC1' });
    const req = createGetRequest('/api/tools/session', { searchParams: { code: 'CHC1' } });
    const res = await GET(req);
    expect(res.headers.get('cache-control')).toContain('public');
  });

  it('uppercases session code in query', async () => {
    await seedSession({ sessionCode: 'UPPR1' });
    const req = createGetRequest('/api/tools/session', { searchParams: { code: 'uppr1' } });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.sessionCode).toBe('UPPR1');
  });
});
