import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/pyodide-input/route';
import { createGetRequest, createPostRequest } from '../helpers/request';

vi.mock('@/lib/db', () => ({
  default: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn(),
}));

describe('/api/pyodide-input', () => {
  let verifyAuth: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const auth = await import('@/lib/auth');
    verifyAuth = auth.verifyAuth as never;
  });

  describe('GET', () => {
    it('returns 401 without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const req = createGetRequest('/api/pyodide-input', { searchParams: { id: 'test-123' } });
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 for missing id', async () => {
      verifyAuth.mockResolvedValue(true);
      const req = createGetRequest('/api/pyodide-input');
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for id too long (>36 chars)', async () => {
      verifyAuth.mockResolvedValue(true);
      const longId = 'a'.repeat(37);
      const req = createGetRequest('/api/pyodide-input', { searchParams: { id: longId } });
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it('long-poll GET resolves after POST delivers value', async () => {
      verifyAuth.mockResolvedValue(true);
      const id = 'poll-resolve-test';

      const getReq = createGetRequest('/api/pyodide-input', { searchParams: { id } });

      const getPromise = GET(getReq);

      await new Promise((r) => setTimeout(r, 50));

      const postReq = createPostRequest('/api/pyodide-input', {
        body: { id, value: 'input-data' },
      });
      const postRes = await POST(postReq);
      expect((await postRes.json()).ok).toBe(true);

      const getRes = await Promise.race([
        getPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
      ]);
      const getResult = await (getRes as Response).json();
      expect(getResult.value).toBe('input-data');
      expect(getResult.cancelled).toBe(false);
    });
  });

  describe('POST', () => {
    it('returns 401 without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const req = createPostRequest('/api/pyodide-input', {
        body: { id: 'test-123', value: 'hello' },
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid body', async () => {
      verifyAuth.mockResolvedValue(true);
      const req = createPostRequest('/api/pyodide-input', {
        body: 'not-json',
        headers: { 'content-type': 'application/json' },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for empty id', async () => {
      verifyAuth.mockResolvedValue(true);
      const req = createPostRequest('/api/pyodide-input', { body: { id: '', value: 'hello' } });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns ok for valid POST', async () => {
      verifyAuth.mockResolvedValue(true);
      const req = createPostRequest('/api/pyodide-input', {
        body: { id: 'valid-id-123', value: 'test input' },
      });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it('resolves pending GET when POST arrives', async () => {
      verifyAuth.mockResolvedValue(true);
      const id = 'resolvable-id';

      const getReq = createGetRequest('/api/pyodide-input', { searchParams: { id } });

      const getPromise = GET(getReq).then((res) => res.json());

      await new Promise((r) => setTimeout(r, 50));

      const postReq = createPostRequest('/api/pyodide-input', {
        body: { id, value: 'user input' },
      });
      await POST(postReq);

      const getResult = await getPromise;
      expect(getResult.value).toBe('user input');
      expect(getResult.cancelled).toBe(false);
    });

    it('returns 400 for value too long (>1000 chars)', async () => {
      verifyAuth.mockResolvedValue(true);
      const req = createPostRequest('/api/pyodide-input', {
        body: { id: 'valid-id', value: 'x'.repeat(1001) },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });
});
