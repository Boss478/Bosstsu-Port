import { describe, it, expect, vi } from 'vitest';
import { createPostRequest } from '../helpers/request';

vi.mock('@/lib/auth', () => ({ verifyAuth: vi.fn() }));
vi.mock('@/lib/sse-server', () => ({ broadcastToSession: vi.fn() }));

import { verifyAuth } from '@/lib/auth';
const mockedVerifyAuth = vi.mocked(verifyAuth);

describe('POST /api/tools/broadcast', () => {
  it('returns 401 without auth', async () => {
    mockedVerifyAuth.mockResolvedValue(false);

    const { POST } = await import('@/app/api/tools/broadcast/route');
    const req = createPostRequest('/api/tools/broadcast', {
      body: { sessionId: 'test', message: 'hi', messageType: 'message' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing fields', async () => {
    mockedVerifyAuth.mockResolvedValue(true);

    const { POST } = await import('@/app/api/tools/broadcast/route');
    const req = createPostRequest('/api/tools/broadcast', {
      body: { sessionId: 'test' },
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Missing required fields');
  });

  it('returns 400 for invalid messageType', async () => {
    mockedVerifyAuth.mockResolvedValue(true);

    const { POST } = await import('@/app/api/tools/broadcast/route');
    const req = createPostRequest('/api/tools/broadcast', {
      body: { sessionId: 'test', message: 'hi', messageType: 'invalid' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 200 with valid payload', async () => {
    mockedVerifyAuth.mockResolvedValue(true);

    const { POST } = await import('@/app/api/tools/broadcast/route');
    const req = createPostRequest('/api/tools/broadcast', {
      body: { sessionId: 'test', message: 'hi', messageType: 'message' },
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});
