import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/tools/poll/route';
import { createGetRequest, createPostRequest } from '../helpers/request';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../helpers/db';
import { seedSession, seedResponse } from '../helpers/seed';

vi.mock('@/lib/rate-limit', () => ({
  checkToolsRateLimit: vi.fn().mockReturnValue(true),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

describe('/api/tools/poll', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAllCollections();
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 400 without sessionId', async () => {
      const req = createGetRequest('/api/tools/poll');
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it('returns responses for a session', async () => {
      const session = await seedSession({ sessionCode: 'POLL1' });
      const sid = session._id.toString();

      await seedResponse({
        sessionId: sid,
        studentName: 'Alice',
        content: { word: 'hello' },
        studentToken: 'tok1',
      });
      await seedResponse({
        sessionId: sid,
        studentName: 'Bob',
        content: { word: 'world' },
        studentToken: 'tok2',
      });

      const req = createGetRequest('/api/tools/poll', { searchParams: { sessionId: sid } });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.responses).toHaveLength(2);
      expect(data.isActive).toBe(true);
      expect(data.totalCount).toBe(2);
    });

    it('filters by since timestamp', async () => {
      const session = await seedSession({ sessionCode: 'POLL2' });
      const sid = session._id.toString();

      await seedResponse({
        sessionId: sid,
        studentName: 'A',
        content: { word: 'old' },
        studentToken: 't1',
      });

      const oldTime = Date.now() - 10000;
      const sinceStr = (oldTime + 5000).toString();

      await seedResponse({
        sessionId: sid,
        studentName: 'B',
        content: { word: 'new' },
        studentToken: 't2',
      });

      const req = createGetRequest('/api/tools/poll', {
        searchParams: { sessionId: sid, since: sinceStr },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(data.responses.length).toBeGreaterThanOrEqual(1);
    });

    it('filters by stepIndex', async () => {
      const session = await seedSession({ sessionCode: 'POLL3' });
      const sid = session._id.toString();

      await seedResponse({
        sessionId: sid,
        studentName: 'A',
        content: { word: 'step0' },
        studentToken: 't1',
        stepIndex: 0,
      });
      await seedResponse({
        sessionId: sid,
        studentName: 'B',
        content: { word: 'step1' },
        studentToken: 't2',
        stepIndex: 1,
      });

      const req = createGetRequest('/api/tools/poll', {
        searchParams: { sessionId: sid, stepIndex: '0' },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(data.responses).toHaveLength(1);
      expect(data.responses[0].content.word).toBe('step0');
    });

    it('includes cache headers', async () => {
      const session = await seedSession({ sessionCode: 'POLL4' });
      const req = createGetRequest('/api/tools/poll', {
        searchParams: { sessionId: session._id.toString() },
      });
      const res = await GET(req);
      expect(res.headers.get('cache-control')).toContain('public');
    });
  });

  describe('POST', () => {
    it('returns 400 without sessionId', async () => {
      const req = createPostRequest('/api/tools/poll', {
        headers: { 'student-token': 'tok-123' },
        body: { content: { answer: 'test' } },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 without student-token', async () => {
      const session = await seedSession({ sessionCode: 'POLL5' });
      const req = createPostRequest('/api/tools/poll', {
        searchParams: { sessionId: session._id.toString() },
        body: { content: { answer: 'test' } },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for inactive session', async () => {
      const session = await seedSession({ sessionCode: 'POLL6', isActive: false });
      const req = createPostRequest('/api/tools/poll', {
        searchParams: { sessionId: session._id.toString() },
        headers: { 'student-token': 'tok-123' },
        body: { content: { answer: 'test' } },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for non-existent session', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const req = createPostRequest('/api/tools/poll', {
        searchParams: { sessionId: fakeId },
        headers: { 'student-token': 'tok-123' },
        body: { content: { answer: 'test' } },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid content', async () => {
      const session = await seedSession({ sessionCode: 'POLL7' });
      const req = createPostRequest('/api/tools/poll', {
        searchParams: { sessionId: session._id.toString() },
        headers: { 'student-token': 'tok-123' },
        body: { content: 'not-an-object' },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('creates a response successfully', async () => {
      const session = await seedSession({ sessionCode: 'POLL8' });
      const sid = session._id.toString();

      const req = createPostRequest('/api/tools/poll', {
        searchParams: { sessionId: sid },
        headers: { 'student-token': 'tok-new' },
        body: { studentName: 'Charlie', content: { answer: '42' }, stepIndex: 0 },
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.id).toBeDefined();
      expect(data.editToken).toBeDefined();
    });

    it('returns rate limit error when checkToolsRateLimit fails', async () => {
      const { checkToolsRateLimit } = await import('@/lib/rate-limit');
      vi.mocked(checkToolsRateLimit).mockReturnValueOnce(false);

      const session = await seedSession({ sessionCode: 'POLL9' });
      const req = createPostRequest('/api/tools/poll', {
        searchParams: { sessionId: session._id.toString() },
        headers: { 'student-token': 'tok-ratelimit' },
        body: { content: { answer: 'test' } },
      });
      const res = await POST(req);
      expect(res.status).toBe(429);
    });

    it('returns 400 when submission limit reached', async () => {
      const session = await seedSession({
        sessionCode: 'POLL10',
        config: { maxSubmissions: 1 },
      });
      const sid = session._id.toString();
      const token = 'tok-limit-test';

      await seedResponse({
        sessionId: sid,
        studentName: 'X',
        content: { answer: 'first' },
        studentToken: token,
      });

      const req = createPostRequest('/api/tools/poll', {
        searchParams: { sessionId: sid },
        headers: { 'student-token': token },
        body: { content: { answer: 'second' } },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('increments participantCount on first submission', async () => {
      const session = await seedSession({ sessionCode: 'POLL11' });
      const sid = session._id.toString();

      const req = createPostRequest('/api/tools/poll', {
        searchParams: { sessionId: sid },
        headers: { 'student-token': 'tok-first' },
        body: { content: { answer: 'first' } },
      });
      await POST(req);

      const ToolSession = (await import('@/models/ToolSession')).default;
      const updated = await ToolSession.findById(sid).lean();
      expect((updated as { participantCount?: unknown }).participantCount).toBe(1);
      expect((updated as { responseCount?: unknown }).responseCount).toBe(1);
    });
  });
});
