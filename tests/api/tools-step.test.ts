import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { GET, PATCH } from '@/app/api/tools/step/route';
import { createGetRequest, createPatchRequest } from '../helpers/request';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../helpers/db';
import { seedSession } from '../helpers/seed';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn(),
}));

describe('/api/tools/step', () => {
  let verifyAuth: ReturnType<typeof vi.fn>;

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
    verifyAuth = auth.verifyAuth as never;
  });

  describe('GET', () => {
    it('returns 400 without sessionId', async () => {
      const req = createGetRequest('/api/tools/step');
      const res = await GET(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBe('Missing sessionId');
    });

    it('returns 404 for non-existent session', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const req = createGetRequest('/api/tools/step', { searchParams: { sessionId: fakeId } });
      const res = await GET(req);
      const data = await res.json();
      expect(res.status).toBe(404);
      expect(data.error).toBe('Session not found');
    });

    it('returns step info for valid session', async () => {
      const session = await seedSession({
        sessionCode: 'STEP1',
        steps: [
          { type: 'padlet', title: 'Step 1' },
          { type: 'poll', title: 'Step 2' },
        ],
        currentStep: 0,
        allowStudentNavigation: true,
      });

      const req = createGetRequest('/api/tools/step', {
        searchParams: { sessionId: session._id.toString() },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.currentStep).toBe(0);
      expect(data.totalSteps).toBe(2);
      expect(data.allowStudentNavigation).toBe(true);
    });

    it('defaults currentStep to -1 when not set', async () => {
      const session = await seedSession({
        sessionCode: 'STEP2',
        currentStep: -1,
        steps: [{ type: 'padlet', title: 'Single Step' }],
      });

      const req = createGetRequest('/api/tools/step', {
        searchParams: { sessionId: session._id.toString() },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(data.currentStep).toBe(-1);
      expect(data.totalSteps).toBe(1);
    });
  });

  describe('PATCH', () => {
    it('returns 401 without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const req = createPatchRequest('/api/tools/step', {
        body: { sessionId: '123', stepIndex: 0 },
      });
      const res = await PATCH(req);
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 for missing fields', async () => {
      verifyAuth.mockResolvedValue(true);
      const req = createPatchRequest('/api/tools/step', {
        body: { sessionId: '123' },
      });
      const res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent session', async () => {
      verifyAuth.mockResolvedValue(true);
      const fakeId = '507f1f77bcf86cd799439011';
      const req = createPatchRequest('/api/tools/step', {
        body: { sessionId: fakeId, stepIndex: 0 },
      });
      const res = await PATCH(req);
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid step index (too high)', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession({
        sessionCode: 'STEP3',
        steps: [{ type: 'padlet', title: 'Only Step' }],
      });

      const req = createPatchRequest('/api/tools/step', {
        body: { sessionId: session._id.toString(), stepIndex: 5 },
      });
      const res = await PATCH(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBe('Invalid step index');
    });

    it('returns 400 for negative step index (except -1)', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession({
        sessionCode: 'STEP4',
        steps: [{ type: 'padlet', title: 'Step' }],
      });

      const req = createPatchRequest('/api/tools/step', {
        body: { sessionId: session._id.toString(), stepIndex: -2 },
      });
      const res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it('updates currentStep successfully', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession({
        sessionCode: 'STEP5',
        steps: [
          { type: 'padlet', title: 'Step 1' },
          { type: 'poll', title: 'Step 2' },
        ],
        currentStep: -1,
      });

      const req = createPatchRequest('/api/tools/step', {
        body: { sessionId: session._id.toString(), stepIndex: 1 },
      });
      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.currentStep).toBe(1);
    });

    it('allows setting stepIndex to -1 (reset)', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession({
        sessionCode: 'STEP6',
        steps: [{ type: 'padlet', title: 'Step' }],
        currentStep: 0,
      });

      const req = createPatchRequest('/api/tools/step', {
        body: { sessionId: session._id.toString(), stepIndex: -1 },
      });
      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.currentStep).toBe(-1);
    });
  });
});
