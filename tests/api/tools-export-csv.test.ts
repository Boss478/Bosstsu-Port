import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/tools/export/csv/route';
import { createGetRequest } from '../helpers/request';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../helpers/db';
import { seedSession, seedResponse } from '../helpers/seed';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn(),
}));

describe('/api/tools/export/csv', () => {
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
    const req = createGetRequest('/api/tools/export/csv', { searchParams: { sessionId: '123' } });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 without sessionId', async () => {
    verifyAuth.mockResolvedValue(true);
    const req = createGetRequest('/api/tools/export/csv');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent session', async () => {
    verifyAuth.mockResolvedValue(true);
    const fakeId = '507f1f77bcf86cd799439011';
    const req = createGetRequest('/api/tools/export/csv', { searchParams: { sessionId: fakeId } });
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('exports CSV for padlet session', async () => {
    verifyAuth.mockResolvedValue(true);
    const session = await seedSession({ sessionCode: 'CSV1', type: 'padlet' });
    const sid = session._id.toString();

    await seedResponse({
      sessionId: sid,
      studentName: 'Alice',
      content: { message: 'Hello world' },
    });
    await seedResponse({ sessionId: sid, studentName: 'Bob', content: { message: 'Hi there' } });

    const req = createGetRequest('/api/tools/export/csv', { searchParams: { sessionId: sid } });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(res.headers.get('content-disposition')).toContain('CSV1_results.csv');

    const text = await res.text();
    expect(text).toContain('studentName');
    expect(text).toContain('Alice');
    expect(text).toContain('Hello world');
  });

  it('exports CSV for poll session', async () => {
    verifyAuth.mockResolvedValue(true);
    const session = await seedSession({ sessionCode: 'CSV2', type: 'poll' });
    const sid = session._id.toString();

    await seedResponse({
      sessionId: sid,
      studentName: 'Charlie',
      content: { selectedOption: 'Option A' },
    });

    const req = createGetRequest('/api/tools/export/csv', { searchParams: { sessionId: sid } });
    const res = await GET(req);
    const text = await res.text();

    expect(text).toContain('Charlie');
    expect(text).toContain('Option A');
  });

  it('exports CSV for quiz session', async () => {
    verifyAuth.mockResolvedValue(true);
    const session = await seedSession({ sessionCode: 'CSV3', type: 'quiz' });
    const sid = session._id.toString();

    await seedResponse({
      sessionId: sid,
      studentName: 'Dave',
      content: { score: 8, total: 10, answers: { q1: 1, q2: 2 } },
    });

    const req = createGetRequest('/api/tools/export/csv', { searchParams: { sessionId: sid } });
    const res = await GET(req);
    const text = await res.text();

    expect(text).toContain('Dave');
    expect(text).toContain('8');
  });

  it('exports CSV for assignment session', async () => {
    verifyAuth.mockResolvedValue(true);
    const session = await seedSession({ sessionCode: 'CSV4', type: 'assignment' });
    const sid = session._id.toString();

    await seedResponse({
      sessionId: sid,
      studentName: 'Eve',
      content: { answer: 'My homework' },
      fileUrl: '/uploads/hw.pdf',
    });

    const req = createGetRequest('/api/tools/export/csv', { searchParams: { sessionId: sid } });
    const res = await GET(req);
    const text = await res.text();

    expect(text).toContain('Eve');
    expect(text).toContain('My homework');
  });

  it('includes BOM character for Excel compatibility', async () => {
    verifyAuth.mockResolvedValue(true);
    const session = await seedSession({ sessionCode: 'CSV5', type: 'padlet' });

    const req = createGetRequest('/api/tools/export/csv', {
      searchParams: { sessionId: session._id.toString() },
    });
    const res = await GET(req);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);

    expect(bytes[0]).toBe(0xef);
    expect(bytes[1]).toBe(0xbb);
    expect(bytes[2]).toBe(0xbf);
  });
});
