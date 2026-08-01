import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/tools/export/files/route';
import { createGetRequest } from '../helpers/request';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../helpers/db';
import { seedSession, seedResponse } from '../helpers/seed';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn(),
}));

vi.mock('archiver', () => {
  class FakeArchiver {
    pipe = vi.fn().mockReturnThis();
    append = vi.fn();
    file = vi.fn();
    async finalize() {}
  }
  return {
    Archiver: FakeArchiver,
  };
});

describe('/api/tools/export/files', () => {
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

  it('returns 401 without auth', async () => {
    verifyAuth.mockResolvedValue(false);
    const req = createGetRequest('/api/tools/export/files', { searchParams: { sessionId: '123' } });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 without sessionId', async () => {
    verifyAuth.mockResolvedValue(true);
    const req = createGetRequest('/api/tools/export/files');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent session', async () => {
    verifyAuth.mockResolvedValue(true);
    const fakeId = '507f1f77bcf86cd799439011';
    const req = createGetRequest('/api/tools/export/files', {
      searchParams: { sessionId: fakeId },
    });
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('returns 400 for non-assignment session type', async () => {
    verifyAuth.mockResolvedValue(true);
    const session = await seedSession({ sessionCode: 'ZIP1', type: 'padlet' });
    const req = createGetRequest('/api/tools/export/files', {
      searchParams: { sessionId: session._id.toString() },
    });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain('Assignment');
  });

  it('returns zip for assignment session (even with no files)', async () => {
    verifyAuth.mockResolvedValue(true);
    const session = await seedSession({ sessionCode: 'ZIP2', type: 'assignment' });

    const req = createGetRequest('/api/tools/export/files', {
      searchParams: { sessionId: session._id.toString() },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/zip');
    expect(res.headers.get('content-disposition')).toContain('ZIP2_files.zip');
  });

  it('includes summary CSV in zip', async () => {
    verifyAuth.mockResolvedValue(true);
    const session = await seedSession({ sessionCode: 'ZIP3', type: 'assignment' });
    const sid = session._id.toString();

    await seedResponse({
      sessionId: sid,
      studentName: 'Frank',
      content: { answer: 'My answer' },
    });

    const req = createGetRequest('/api/tools/export/files', { searchParams: { sessionId: sid } });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/zip');
  });
});
