import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/tools/participants/route';
import { createGetRequest } from '../helpers/request';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../helpers/db';
import { seedSession, seedResponse } from '../helpers/seed';

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn(),
}));

describe('/api/tools/participants', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAllCollections();
    vi.clearAllMocks();
    const auth = await import('@/lib/auth');
    (auth.verifyAuth as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  });

  it('returns 401 without auth', async () => {
    const auth = await import('@/lib/auth');
    (auth.verifyAuth as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const req = createGetRequest('/api/tools/participants');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 without sessionId', async () => {
    const req = createGetRequest('/api/tools/participants');
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid session ID');
  });

  it('returns 400 for invalid ObjectId', async () => {
    const req = createGetRequest('/api/tools/participants', {
      searchParams: { sessionId: 'not-valid' },
    });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid session ID');
  });

  it('returns empty participants for session with no responses', async () => {
    const session = await seedSession({ sessionCode: 'PAR1' });
    const req = createGetRequest('/api/tools/participants', {
      searchParams: { sessionId: session._id.toString() },
    });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.participants).toEqual([]);
  });

  it('aggregates participants by student token', async () => {
    const session = await seedSession({ sessionCode: 'PAR2' });
    const sid = session._id.toString();
    const token1 = 'token-alice';
    const token2 = 'token-bob';

    await seedResponse({ sessionId: sid, studentName: 'Alice', studentToken: token1 });
    await seedResponse({ sessionId: sid, studentName: 'Alice', studentToken: token1 });
    await seedResponse({ sessionId: sid, studentName: 'Bob', studentToken: token2 });

    const req = createGetRequest('/api/tools/participants', { searchParams: { sessionId: sid } });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.participants).toHaveLength(2);

    const alice = data.participants.find((p: { studentName: string }) => p.studentName === 'Alice');
    const bob = data.participants.find((p: { studentName: string }) => p.studentName === 'Bob');
    expect(alice.responseCount).toBe(2);
    expect(bob.responseCount).toBe(1);
  });

  it('returns no-store cache header', async () => {
    const session = await seedSession({ sessionCode: 'PAR3' });
    const req = createGetRequest('/api/tools/participants', {
      searchParams: { sessionId: session._id.toString() },
    });
    const res = await GET(req);
    expect(res.headers.get('cache-control')).toContain('no-store');
  });
});
