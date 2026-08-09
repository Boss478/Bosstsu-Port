import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/tools/step/route';
import { createGetRequest } from '../helpers/request';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../helpers/db';
import { seedSession } from '../helpers/seed';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('/api/tools/step', () => {
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

    it('returns kicked=true for kicked student via student-token header', async () => {
      const session = await seedSession({
        sessionCode: 'STEP3',
        steps: [{ type: 'padlet', title: 'Step 1' }],
        kickedStudents: ['kicked-student-token'],
      });

      const req = createGetRequest('/api/tools/step', {
        searchParams: { sessionId: session._id.toString() },
        headers: { 'student-token': 'kicked-student-token' },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.kicked).toBe(true);
    });

    it('ignores legacy studentToken query param (header-only)', async () => {
      const session = await seedSession({
        sessionCode: 'STEP4',
        steps: [{ type: 'padlet', title: 'Step 1' }],
        kickedStudents: ['kicked-student-token'],
      });

      const req = createGetRequest('/api/tools/step', {
        searchParams: {
          sessionId: session._id.toString(),
          studentToken: 'kicked-student-token',
        },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.kicked).toBe(false);
    });
  });
});
