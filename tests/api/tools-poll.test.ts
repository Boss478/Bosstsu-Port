import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/tools/poll/route';
import { createGetRequest, createPostRequest } from '../helpers/request';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../helpers/db';
import { seedSession, seedResponse } from '../helpers/seed';

vi.mock('@/lib/rate-limit', () => ({
  checkToolsRateLimit: vi.fn().mockReturnValue(true),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn().mockResolvedValue(true),
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
    const auth = await import('@/lib/auth');
    (auth.verifyAuth as ReturnType<typeof vi.fn>).mockResolvedValue(true);
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

    it('returns server-side counts for options and words', async () => {
      const session = await seedSession({ sessionCode: 'POLL6' });
      const sid = session._id.toString();

      await seedResponse({
        sessionId: sid,
        content: { selectedOption: 'A' },
        studentToken: 't1',
      });
      await seedResponse({
        sessionId: sid,
        content: { selectedOption: 'A' },
        studentToken: 't2',
      });
      await seedResponse({
        sessionId: sid,
        content: { selectedOption: 'B' },
        studentToken: 't3',
      });
      await seedResponse({
        sessionId: sid,
        content: { word: 'cloud' },
        studentToken: 't4',
      });

      const req = createGetRequest('/api/tools/poll', { searchParams: { sessionId: sid } });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.counts.options).toEqual({ A: 2, B: 1 });
      expect(data.counts.words).toEqual({ cloud: 1 });
      expect(data.totalCount).toBe(4);
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

    it('strips tokens and computes isOwn', async () => {
      const session = await seedSession({ sessionCode: 'POLL5' });
      const sid = session._id.toString();

      await seedResponse({
        sessionId: sid,
        studentName: 'Alice',
        content: { word: 'mine' },
        studentToken: 'my-token',
        editToken: 'secret-edit',
        ip: '203.0.113.5',
      });
      await seedResponse({
        sessionId: sid,
        studentName: 'Bob',
        content: { word: 'theirs' },
        studentToken: 'other-token',
        editToken: 'other-edit',
        ip: '203.0.113.9',
      });

      const req = createGetRequest('/api/tools/poll', {
        searchParams: { sessionId: sid },
        headers: { 'student-token': 'my-token' },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.responses).toHaveLength(2);
      for (const r of data.responses) {
        expect(r.studentToken).toBeUndefined();
        expect(r.editToken).toBeUndefined();
        expect(r.ip).toBeUndefined();
      }
      const mine = data.responses.find(
        (r: { content: { word: string } }) => r.content.word === 'mine',
      );
      const theirs = data.responses.find(
        (r: { content: { word: string } }) => r.content.word === 'theirs',
      );
      expect(mine.isOwn).toBe(true);
      expect(theirs.isOwn).toBe(false);
    });

    it('clamps public requests to the default cap', async () => {
      const session = await seedSession({ sessionCode: 'POLL7' });
      const sid = session._id.toString();

      await seedResponse({
        sessionId: sid,
        content: { selectedOption: 'A' },
        studentToken: 't1',
      });

      const req = createGetRequest('/api/tools/poll', {
        searchParams: { sessionId: sid, limit: '10' },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.responses).toHaveLength(1);
    });

    it('requires auth for admin limit above the public cap', async () => {
      const auth = await import('@/lib/auth');
      (auth.verifyAuth as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      const req = createGetRequest('/api/tools/poll', {
        searchParams: { sessionId: '507f1f77bcf86cd799439011', limit: '2000' },
      });
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns full response list for authenticated admin limit', async () => {
      const session = await seedSession({ sessionCode: 'POLL8' });
      const sid = session._id.toString();

      for (let i = 0; i < 55; i++) {
        await seedResponse({
          sessionId: sid,
          content: { selectedOption: `O${i % 4}` },
          studentToken: `tok${i}`,
        });
      }

      const req = createGetRequest('/api/tools/poll', {
        searchParams: { sessionId: sid, limit: '2000' },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.responses).toHaveLength(55);
      expect(res.headers.get('cache-control')).toContain('no-store');
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
