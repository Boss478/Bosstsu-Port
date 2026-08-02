import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { POST } from '@/app/api/tools/focus/route';
import { createPostRequest } from '../helpers/request';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../helpers/db';
import { seedSession } from '../helpers/seed';
import ToolSession from '@/models/ToolSession';
import ToolFocusEntry from '@/models/ToolFocusEntry';

describe('/api/tools/focus', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAllCollections();
  });

  it('returns 400 without sessionId', async () => {
    const req = createPostRequest('/api/tools/focus', { body: { entries: [] } });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid sessionId format', async () => {
    const req = createPostRequest('/api/tools/focus', {
      body: { sessionId: 'bad', entries: [] },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when entries is not an array', async () => {
    const session = await seedSession({ sessionCode: 'FOC0' });
    const req = createPostRequest('/api/tools/focus', {
      body: { sessionId: session._id.toString(), entries: 'nope' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent session', async () => {
    const req = createPostRequest('/api/tools/focus', {
      body: { sessionId: '507f1f77bcf86cd799439011', entries: [] },
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 400 for inactive session', async () => {
    const session = await seedSession({ sessionCode: 'FOC1', isActive: false });
    const req = createPostRequest('/api/tools/focus', {
      body: { sessionId: session._id.toString(), entries: [] },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('stores focus snapshots in the focus collection, not the session doc', async () => {
    const session = await seedSession({ sessionCode: 'FOC2' });
    const sid = session._id.toString();

    for (let i = 0; i < 25; i++) {
      const req = createPostRequest('/api/tools/focus', {
        body: { sessionId: sid, entries: [{ t: i }], totalMs: i * 100 },
        headers: { 'user-agent': 'x'.repeat(500) },
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
    }

    const entries = await ToolFocusEntry.find({ sessionId: sid }).sort({ submittedAt: 1 }).lean();
    expect(entries).toHaveLength(25);
    const last = entries[24] as { totalMs?: number; userAgent?: string; entries?: unknown[] };
    expect(last.totalMs).toBe(2400);
    expect((last.userAgent ?? '').length).toBeLessThanOrEqual(200);
    expect((last.entries ?? []).length).toBeLessThanOrEqual(200);

    const updated = await ToolSession.findById(sid).lean();
    expect(updated?.focusData ?? []).toHaveLength(0);
  });
});
