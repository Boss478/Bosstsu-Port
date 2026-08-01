import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/process-words/route';

vi.mock('@/lib/db', () => ({
  default: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn(),
}));

const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();

vi.mock('fs', () => ({
  promises: {
    readFile: (...args: unknown[]) => mockReadFile(...args),
    writeFile: (...args: unknown[]) => mockWriteFile(...args),
  },
}));

describe('/api/process-words', () => {
  let verifyAuth: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const auth = await import('@/lib/auth');
    verifyAuth = auth.verifyAuth as never;
  });

  it('returns 401 without auth', async () => {
    verifyAuth.mockResolvedValue(false);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('processes CSV file successfully', async () => {
    verifyAuth.mockResolvedValue(true);
    const csvContent = 'word,class,level\naccommodate,verb,B1\nachieve,verb,A2\n';
    mockReadFile.mockResolvedValueOnce(csvContent);
    mockWriteFile.mockResolvedValue(undefined);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBeGreaterThan(0);
    expect(mockWriteFile).toHaveBeenCalledTimes(2);
  });

  it('filters out A1/A2 level words', async () => {
    verifyAuth.mockResolvedValue(true);
    const csvContent = 'word,class,level\ntest,verb,B1\nbasic,adj,A1\nsimple,adj,A2\n';
    mockReadFile.mockResolvedValueOnce(csvContent);
    mockWriteFile.mockResolvedValue(undefined);

    const res = await GET();
    const data = await res.json();

    expect(data.success).toBe(true);
    const writtenContent = mockWriteFile.mock.calls[0][1] as string;
    expect(writtenContent).toContain('test');
    expect(writtenContent).not.toContain('basic');
    expect(writtenContent).not.toContain('simple');
  });

  it('returns error on file read failure', async () => {
    verifyAuth.mockResolvedValue(true);
    mockReadFile.mockRejectedValueOnce(new Error('File not found'));

    const res = await GET();
    const data = await res.json();

    expect(data.success).toBe(false);
  });
});
