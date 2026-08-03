import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { POST, DELETE } from '@/app/api/tools/respond/route';
import { createPostRequest, createDeleteRequest } from '../helpers/request';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../helpers/db';
import { seedSession, seedResponse } from '../helpers/seed';
import { addClient } from '@/lib/sse-server';

vi.mock('@/lib/rate-limit', () => ({
  checkToolsRateLimit: vi.fn().mockReturnValue(true),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  hashClientId: vi.fn().mockReturnValue('hashed-client-123'),
}));

vi.mock('@/lib/upload', () => ({
  saveFile: vi.fn().mockResolvedValue('/uploads/test.webp'),
  sanitizeFilename: vi.fn().mockReturnValue('test_student'),
}));

describe('/api/tools/respond', () => {
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

  describe('POST', () => {
    it('returns 400 without student-token', async () => {
      const formData = new FormData();
      formData.set('sessionId', '123');
      const req = createPostRequest('/api/tools/respond', { body: formData });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 without sessionId', async () => {
      const formData = new FormData();
      const req = createPostRequest('/api/tools/respond', {
        body: formData,
        headers: { 'student-token': 'tok-123' },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for non-existent session', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const formData = new FormData();
      formData.set('sessionId', fakeId);
      formData.set('content', '{}');
      const req = createPostRequest('/api/tools/respond', {
        body: formData,
        headers: { 'student-token': 'tok-123' },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for inactive session', async () => {
      const session = await seedSession({ sessionCode: 'RESP1', isActive: false });
      const formData = new FormData();
      formData.set('sessionId', session._id.toString());
      formData.set('content', '{}');
      const req = createPostRequest('/api/tools/respond', {
        body: formData,
        headers: { 'student-token': 'tok-123' },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('creates a response successfully', async () => {
      const session = await seedSession({ sessionCode: 'RESP2' });
      const formData = new FormData();
      formData.set('sessionId', session._id.toString());
      formData.set('studentName', 'Alice');
      formData.set('content', JSON.stringify({ message: 'Hello' }));

      const req = createPostRequest('/api/tools/respond', {
        body: formData,
        headers: { 'student-token': 'tok-alice' },
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

      const session = await seedSession({ sessionCode: 'RESP3' });
      const formData = new FormData();
      formData.set('sessionId', session._id.toString());
      formData.set('content', '{}');

      const req = createPostRequest('/api/tools/respond', {
        body: formData,
        headers: { 'student-token': 'tok-rl' },
      });
      const res = await POST(req);
      expect(res.status).toBe(429);
    });

    it('returns 400 when submission limit reached', async () => {
      const session = await seedSession({
        sessionCode: 'RESP4',
        config: { maxSubmissions: 1 },
      });
      const sid = session._id.toString();
      const token = 'tok-limit';

      await seedResponse({ sessionId: sid, studentName: 'X', content: {}, studentToken: token });

      const formData = new FormData();
      formData.set('sessionId', sid);
      formData.set('content', '{}');

      const req = createPostRequest('/api/tools/respond', {
        body: formData,
        headers: { 'student-token': token },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE', () => {
    it('returns 400 without student-token', async () => {
      const req = createDeleteRequest('/api/tools/respond', {
        body: { responseId: '123', editToken: 'tok' },
      });
      const res = await DELETE(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 without responseId/editToken', async () => {
      const req = createDeleteRequest('/api/tools/respond', {
        body: {},
        headers: { 'student-token': 'tok-123' },
      });
      const res = await DELETE(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for non-existent response', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const req = createDeleteRequest('/api/tools/respond', {
        body: { responseId: fakeId, editToken: 'tok' },
        headers: { 'student-token': 'tok-123' },
      });
      const res = await DELETE(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when editToken does not match', async () => {
      const session = await seedSession({ sessionCode: 'RESP5' });
      const resp = await seedResponse({
        sessionId: session._id.toString(),
        editToken: 'correct-token',
      });

      const req = createDeleteRequest('/api/tools/respond', {
        body: { responseId: resp._id.toString(), editToken: 'wrong-token' },
        headers: { 'student-token': 'tok-del' },
      });
      const res = await DELETE(req);
      expect(res.status).toBe(400);
    });

    it('deletes a response with correct editToken', async () => {
      const session = await seedSession({ sessionCode: 'RESP6' });
      const resp = await seedResponse({
        sessionId: session._id.toString(),
        editToken: 'my-edit-token',
      });

      const req = createDeleteRequest('/api/tools/respond', {
        body: { responseId: resp._id.toString(), editToken: 'my-edit-token' },
        headers: { 'student-token': 'tok-del-ok' },
      });
      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('DB side-effects', () => {
    it('persists the created response and increments responseCount/participantCount', async () => {
      const session = await seedSession({ sessionCode: 'RESP7' });
      const sid = session._id.toString();
      const formData = new FormData();
      formData.set('sessionId', sid);
      formData.set('studentName', 'Alice');
      formData.set('content', JSON.stringify({ message: 'Hello' }));

      const req = createPostRequest('/api/tools/respond', {
        body: formData,
        headers: { 'student-token': 'tok-alice' },
      });
      const res = await POST(req);
      expect(res.status).toBe(200);

      const ToolResponse = (await import('@/models/ToolResponse')).default;
      const ToolSession = (await import('@/models/ToolSession')).default;

      const doc = await ToolResponse.findOne({ sessionId: session._id }).lean();
      expect(doc).not.toBeNull();
      expect((doc as { studentName?: string }).studentName).toBe('Alice');
      expect((doc as { studentToken?: string }).studentToken).toBe('tok-alice');
      expect((doc as { editToken?: string }).editToken).toBeDefined();

      const updated = await ToolSession.findById(session._id).lean();
      expect((updated as { responseCount?: unknown }).responseCount).toBe(1);
      expect((updated as { participantCount?: unknown }).participantCount).toBe(1);
    });

    it('keeps participantCount flat for repeat submissions from the same token', async () => {
      const session = await seedSession({ sessionCode: 'RESP8' });
      const sid = session._id.toString();

      const submit = async (content: string) => {
        const formData = new FormData();
        formData.set('sessionId', sid);
        formData.set('content', JSON.stringify({ message: content }));
        const req = createPostRequest('/api/tools/respond', {
          body: formData,
          headers: { 'student-token': 'tok-repeat' },
        });
        return POST(req);
      };

      expect((await submit('one')).status).toBe(200);
      expect((await submit('two')).status).toBe(200);

      const ToolSession = (await import('@/models/ToolSession')).default;
      const updated = await ToolSession.findById(session._id).lean();
      expect((updated as { responseCount?: unknown }).responseCount).toBe(2);
      expect((updated as { participantCount?: unknown }).participantCount).toBe(1);
    });

    it('DELETE removes the document and decrements responseCount', async () => {
      const session = await seedSession({ sessionCode: 'RESP9' });
      const resp = await seedResponse({
        sessionId: session._id.toString(),
        editToken: 'my-edit-token',
        studentToken: 'tok-del-db',
      });

      const req = createDeleteRequest('/api/tools/respond', {
        body: { responseId: resp._id.toString(), editToken: 'my-edit-token' },
        headers: { 'student-token': 'tok-del-db' },
      });
      const res = await DELETE(req);
      expect(res.status).toBe(200);

      const ToolResponse = (await import('@/models/ToolResponse')).default;
      const ToolSession = (await import('@/models/ToolSession')).default;

      expect(await ToolResponse.findById(resp._id).lean()).toBeNull();
      const updated = await ToolSession.findById(session._id).lean();
      // seedResponse bypasses the session counter → baseline 0, so delta is -1
      expect((updated as { responseCount?: unknown }).responseCount).toBe(-1);
    });
  });

  describe('DELETE rate limit (per-IP)', () => {
    it('returns 429 when rate limited and does not delete the response', async () => {
      const session = await seedSession({ sessionCode: 'RESP10' });
      const resp = await seedResponse({
        sessionId: session._id.toString(),
        editToken: 'ok-token',
        studentToken: 'tok-rl-del',
      });

      const { checkToolsRateLimit } = await import('@/lib/rate-limit');
      vi.mocked(checkToolsRateLimit).mockReturnValueOnce(false);

      const req = createDeleteRequest('/api/tools/respond', {
        body: { responseId: resp._id.toString(), editToken: 'ok-token' },
        headers: { 'student-token': 'tok-rl-del' },
      });
      const res = await DELETE(req);
      expect(res.status).toBe(429);

      const ToolResponse = (await import('@/models/ToolResponse')).default;
      expect(await ToolResponse.findById(resp._id).lean()).not.toBeNull();
    });

    it('checks the rate limit BEFORE the DB read — invalid id still 429 when limited', async () => {
      const { checkToolsRateLimit } = await import('@/lib/rate-limit');
      vi.mocked(checkToolsRateLimit).mockReturnValueOnce(false);

      const req = createDeleteRequest('/api/tools/respond', {
        body: { responseId: '507f1f77bcf86cd799439011', editToken: 'tok' },
        headers: { 'student-token': 'tok-rl-before' },
      });
      const res = await DELETE(req);
      expect(res.status).toBe(429);
    });

    it('keys the DELETE rate limit on IP only — not the client-controlled token', async () => {
      const session = await seedSession({ sessionCode: 'RESP12' });
      const resp = await seedResponse({
        sessionId: session._id.toString(),
        editToken: 'ok-token',
        studentToken: 'tok-del-key',
      });

      const { checkToolsRateLimit } = await import('@/lib/rate-limit');
      vi.mocked(checkToolsRateLimit).mockClear();

      const req = createDeleteRequest('/api/tools/respond', {
        body: { responseId: resp._id.toString(), editToken: 'ok-token' },
        headers: { 'student-token': 'tok-del-key' },
      });
      const res = await DELETE(req);
      expect(res.status).toBe(200);

      const key = vi.mocked(checkToolsRateLimit).mock.calls[0][0] as string;
      expect(key).not.toContain('tok-del-key');
    });

    it('keys the POST rate limit on IP only — not the client-controlled token', async () => {
      const session = await seedSession({ sessionCode: 'RESP11' });

      const { checkToolsRateLimit } = await import('@/lib/rate-limit');
      vi.mocked(checkToolsRateLimit).mockClear();

      const formData = new FormData();
      formData.set('sessionId', session._id.toString());
      formData.set('content', '{}');
      const req = createPostRequest('/api/tools/respond', {
        body: formData,
        headers: { 'student-token': 'tok-post-key' },
      });
      const res = await POST(req);
      expect(res.status).toBe(200);

      const key = vi.mocked(checkToolsRateLimit).mock.calls[0][0] as string;
      expect(key).not.toContain('tok-post-key');
    });
  });

  describe('step-scoped maxSubmissions', () => {
    it('enforces maxSubmissions per step — step counts do not leak across steps', async () => {
      const session = await seedSession({
        sessionCode: 'RESP13',
        steps: [
          { type: 'assignment', title: 'S0', config: { maxSubmissions: 1 } },
          { type: 'assignment', title: 'S1', config: { maxSubmissions: 2 } },
        ],
        config: { maxSubmissions: 1 },
      });
      const sid = session._id.toString();
      const token = 'tok-step';

      const submit = async (stepIndex: string) => {
        const formData = new FormData();
        formData.set('sessionId', sid);
        formData.set('stepIndex', stepIndex);
        formData.set('content', '{}');
        const req = createPostRequest('/api/tools/respond', {
          body: formData,
          headers: { 'student-token': token },
        });
        return POST(req);
      };

      // step 0: cap 1 → first allowed, second rejected
      expect((await submit('0')).status).toBe(200);
      expect((await submit('0')).status).toBe(400);

      // step 1: cap 2 → both allowed (not blocked by step-0 count)
      expect((await submit('1')).status).toBe(200);
      expect((await submit('1')).status).toBe(200);

      // step 1 now at its own cap → rejected
      expect((await submit('1')).status).toBe(400);
    });
  });

  describe('SSE responses event (wire integration)', () => {
    function makeController() {
      return {
        enqueue: vi.fn(),
        error: vi.fn(),
        close: vi.fn(),
      } as unknown as ReadableStreamDefaultController;
    }

    it('POST emits an additive responses event to connected clients', async () => {
      const session = await seedSession({ sessionCode: 'SSE1' });
      const controller = makeController();
      const cleanup = addClient(session._id.toString(), controller);

      try {
        const formData = new FormData();
        formData.set('sessionId', session._id.toString());
        formData.set('content', JSON.stringify({ text: 'hello' }));
        formData.set('studentName', 'Alice');
        const req = createPostRequest('/api/tools/respond', {
          body: formData,
          headers: { 'student-token': 'tok-sse1' },
        });
        const res = await POST(req);
        expect(res.status).toBe(200);

        const frame = new TextDecoder().decode(
          (controller.enqueue as ReturnType<typeof vi.fn>).mock.calls[0][0],
        );
        expect(frame.startsWith('event: responses\n')).toBe(true);
        const data = JSON.parse(
          frame
            .split('\n')
            .find((l) => l.startsWith('data: '))!
            .slice(6),
        );
        expect(data).toEqual({ type: 'responses' });
      } finally {
        cleanup();
      }
    });

    it('DELETE emits a responses event to connected clients', async () => {
      const session = await seedSession({ sessionCode: 'SSE2' });
      const controller = makeController();
      const cleanup = addClient(session._id.toString(), controller);

      try {
        const resp = await seedResponse({
          sessionId: session._id.toString(),
          editToken: 'del-token',
          studentToken: 'tok-del-sse',
        });
        const req = createDeleteRequest('/api/tools/respond', {
          body: { responseId: resp._id.toString(), editToken: 'del-token' },
          headers: { 'student-token': 'tok-del-sse' },
        });
        const res = await DELETE(req);
        expect(res.status).toBe(200);
        expect(controller.enqueue).toHaveBeenCalledTimes(1);
      } finally {
        cleanup();
      }
    });
  });
});
