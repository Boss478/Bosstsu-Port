import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { PATCH } from '@/app/api/tools/edit/route';
import { createMultipartRequest } from '../helpers/request';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../helpers/db';
import { seedSession, seedResponse } from '../helpers/seed';
import { addClient } from '@/lib/sse-server';

vi.mock('@/lib/upload', () => ({
  saveFile: vi.fn().mockResolvedValue('/uploads/edited.webp'),
  sanitizeFilename: vi.fn().mockReturnValue('test_student'),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkToolsRateLimit: vi.fn().mockReturnValue(true),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  hashClientId: vi.fn().mockReturnValue('hashed-client-123'),
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(false),
    unlinkSync: vi.fn(),
  },
}));

describe('/api/tools/edit', () => {
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

  function createEditForm(data: Record<string, string>): FormData {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      formData.set(key, value);
    }
    return formData;
  }

  it('returns 400 without multipart content-type', async () => {
    const req = createMultipartRequest('/api/tools/edit', new FormData(), {
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  describe('vote action', () => {
    it('returns 400 without responseId', async () => {
      const formData = createEditForm({ action: 'vote' });
      const req = createMultipartRequest('/api/tools/edit', formData);
      const res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it('returns 401 without student-token', async () => {
      const formData = createEditForm({ action: 'vote', responseId: '123' });
      const req = createMultipartRequest('/api/tools/edit', formData);
      const res = await PATCH(req);
      expect(res.status).toBe(401);
    });

    it('increments upvotes successfully', async () => {
      const session = await seedSession({ sessionCode: 'EDT1', type: 'qa_board' });
      const resp = await seedResponse({ sessionId: session._id.toString() });

      const formData = createEditForm({ action: 'vote', responseId: resp._id.toString() });
      const req = createMultipartRequest('/api/tools/edit', formData, {
        headers: { 'student-token': 'tok-voter' },
      });
      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('rejects votes on non-qa sessions', async () => {
      const session = await seedSession({ sessionCode: 'EDT9', type: 'padlet' });
      const resp = await seedResponse({ sessionId: session._id.toString() });

      const formData = createEditForm({ action: 'vote', responseId: resp._id.toString() });
      const req = createMultipartRequest('/api/tools/edit', formData, {
        headers: { 'student-token': 'tok-voter' },
      });
      const res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it('rejects votes when rate limited', async () => {
      const rateLimit = await import('@/lib/rate-limit');
      // one-shot: must not poison the edit-branch rate check in later tests
      (rateLimit.checkToolsRateLimit as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);
      const session = await seedSession({ sessionCode: 'EDT10', type: 'qa_board' });
      const resp = await seedResponse({ sessionId: session._id.toString() });

      const formData = createEditForm({ action: 'vote', responseId: resp._id.toString() });
      const req = createMultipartRequest('/api/tools/edit', formData, {
        headers: { 'student-token': 'tok-voter' },
      });
      const res = await PATCH(req);
      expect(res.status).toBe(429);
    });
  });

  describe('edit action', () => {
    it('returns 400 without responseId and editToken', async () => {
      const formData = createEditForm({ content: '{}' });
      const req = createMultipartRequest('/api/tools/edit', formData);
      const res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for non-existent response', async () => {
      const formData = createEditForm({
        responseId: '507f1f77bcf86cd799439011',
        editToken: 'tok',
        content: '{}',
      });
      const req = createMultipartRequest('/api/tools/edit', formData);
      const res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when editToken mismatch', async () => {
      const session = await seedSession({ sessionCode: 'EDT2', type: 'assignment' });
      const resp = await seedResponse({
        sessionId: session._id.toString(),
        editToken: 'correct-token',
      });

      const formData = createEditForm({
        responseId: resp._id.toString(),
        editToken: 'wrong-token',
        content: JSON.stringify({ answer: 'updated' }),
      });
      const req = createMultipartRequest('/api/tools/edit', formData);
      const res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for inactive session', async () => {
      const session = await seedSession({
        sessionCode: 'EDT3',
        type: 'assignment',
        isActive: false,
      });
      const resp = await seedResponse({
        sessionId: session._id.toString(),
        editToken: 'my-token',
      });

      const formData = createEditForm({
        responseId: resp._id.toString(),
        editToken: 'my-token',
        content: JSON.stringify({ answer: 'updated' }),
      });
      const req = createMultipartRequest('/api/tools/edit', formData);
      const res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for non-editable tool type', async () => {
      const session = await seedSession({ sessionCode: 'EDT4', type: 'quiz' });
      const resp = await seedResponse({
        sessionId: session._id.toString(),
        editToken: 'my-token',
      });

      const formData = createEditForm({
        responseId: resp._id.toString(),
        editToken: 'my-token',
        content: JSON.stringify({ score: 10 }),
      });
      const req = createMultipartRequest('/api/tools/edit', formData);
      const res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it('updates content successfully for assignment type', async () => {
      const session = await seedSession({ sessionCode: 'EDT5', type: 'assignment' });
      const resp = await seedResponse({
        sessionId: session._id.toString(),
        editToken: 'my-token',
        content: { answer: 'old' },
      });

      const formData = createEditForm({
        responseId: resp._id.toString(),
        editToken: 'my-token',
        content: JSON.stringify({ answer: 'new answer' }),
      });
      const req = createMultipartRequest('/api/tools/edit', formData);
      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('returns 400 for file too large', async () => {
      const session = await seedSession({
        sessionCode: 'EDT6',
        type: 'assignment',
        config: { allowFileUpload: true },
      });
      const resp = await seedResponse({
        sessionId: session._id.toString(),
        editToken: 'my-token',
      });

      const bigFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'big.pdf', {
        type: 'application/pdf',
      });
      const formData = new FormData();
      formData.set('responseId', resp._id.toString());
      formData.set('editToken', 'my-token');
      formData.set('content', '{}');
      formData.set('file', bigFile);

      const req = createMultipartRequest('/api/tools/edit', formData);
      const res = await PATCH(req);
      expect(res.status).toBe(400);
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

    function decodeResponsesFrame(controller: ReadableStreamDefaultController) {
      const frame = new TextDecoder().decode(
        (controller.enqueue as ReturnType<typeof vi.fn>).mock.calls[0][0],
      );
      expect(frame.startsWith('event: responses\n')).toBe(true);
      return JSON.parse(
        frame
          .split('\n')
          .find((l) => l.startsWith('data: '))!
          .slice(6),
      ) as { type: string };
    }

    it('vote action emits a responses event to connected clients', async () => {
      const session = await seedSession({ sessionCode: 'EDT7', type: 'qa_board' });
      const resp = await seedResponse({ sessionId: session._id.toString() });
      const controller = makeController();
      const cleanup = addClient(session._id.toString(), controller);

      try {
        const formData = createEditForm({ action: 'vote', responseId: resp._id.toString() });
        const req = createMultipartRequest('/api/tools/edit', formData, {
          headers: { 'student-token': 'tok-voter' },
        });
        const res = await PATCH(req);
        expect(res.status).toBe(200);

        expect(controller.enqueue).toHaveBeenCalledTimes(1);
        expect(decodeResponsesFrame(controller)).toEqual({ type: 'responses' });
      } finally {
        cleanup();
      }
    });

    it('content-edit action emits a responses event to connected clients', async () => {
      const session = await seedSession({ sessionCode: 'EDT8', type: 'assignment' });
      const resp = await seedResponse({
        sessionId: session._id.toString(),
        editToken: 'my-token',
        content: { answer: 'old' },
      });
      const controller = makeController();
      const cleanup = addClient(session._id.toString(), controller);

      try {
        const formData = createEditForm({
          responseId: resp._id.toString(),
          editToken: 'my-token',
          content: JSON.stringify({ answer: 'new answer' }),
        });
        const req = createMultipartRequest('/api/tools/edit', formData);
        const res = await PATCH(req);
        expect(res.status).toBe(200);

        expect(controller.enqueue).toHaveBeenCalledTimes(1);
        expect(decodeResponsesFrame(controller)).toEqual({ type: 'responses' });
      } finally {
        cleanup();
      }
    });
  });
});
