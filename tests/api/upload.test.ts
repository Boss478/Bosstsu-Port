import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/upload/route';
import { createMultipartRequest } from '../helpers/request';

vi.mock('@/lib/db', () => ({
  default: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/upload', () => ({
  saveFile: vi.fn().mockResolvedValue('/uploads/test-file.webp'),
  isHeicFile: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn(),
}));

describe('/api/upload', () => {
  let verifyAuth: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const auth = await import('@/lib/auth');
    verifyAuth = auth.verifyAuth as never;
  });

  it('returns 401 without auth', async () => {
    verifyAuth.mockResolvedValue(false);
    const formData = new FormData();
    const req = createMultipartRequest('/api/upload', formData);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 without file', async () => {
    verifyAuth.mockResolvedValue(true);
    const formData = new FormData();
    formData.set('folder', 'portfolio');

    const req = createMultipartRequest('/api/upload', formData);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid folder', async () => {
    verifyAuth.mockResolvedValue(true);
    const formData = new FormData();
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    formData.set('file', file);
    formData.set('folder', 'invalid-folder');

    const req = createMultipartRequest('/api/upload', formData);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 413 for file too large', async () => {
    verifyAuth.mockResolvedValue(true);
    const formData = new FormData();
    const bigFile = new File([new ArrayBuffer(35 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    formData.set('file', bigFile);
    formData.set('folder', 'portfolio');

    const req = createMultipartRequest('/api/upload', formData);
    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('returns 415 for disallowed file type', async () => {
    verifyAuth.mockResolvedValue(true);
    const { isHeicFile } = await import('@/lib/upload');
    vi.mocked(isHeicFile).mockReturnValueOnce(false);

    const formData = new FormData();
    const file = new File(['test'], 'test.exe', { type: 'application/exe' });
    formData.set('file', file);
    formData.set('folder', 'portfolio');

    const req = createMultipartRequest('/api/upload', formData);
    const res = await POST(req);
    expect(res.status).toBe(415);
  });

  it('uploads a valid file successfully', async () => {
    verifyAuth.mockResolvedValue(true);
    const formData = new FormData();
    const file = new File(['fake image data'], 'photo.png', { type: 'image/png' });
    formData.set('file', file);
    formData.set('folder', 'portfolio');

    const req = createMultipartRequest('/api/upload', formData);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.url).toBe('/uploads/test-file.webp');
  });

  it('defaults folder to misc', async () => {
    verifyAuth.mockResolvedValue(true);
    const formData = new FormData();
    const file = new File(['data'], 'test.png', { type: 'image/png' });
    formData.set('file', file);

    const req = createMultipartRequest('/api/upload', formData);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
