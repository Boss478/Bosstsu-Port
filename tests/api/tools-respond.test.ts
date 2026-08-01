import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { POST, DELETE } from '@/app/api/tools/respond/route';
import { createPostRequest, createDeleteRequest } from '../helpers/request';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../helpers/db';
import { seedSession, seedResponse } from '../helpers/seed';

vi.mock('@/lib/rate-limit', () => ({
  checkToolsRateLimit: vi.fn().mockReturnValue(true),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
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
});
