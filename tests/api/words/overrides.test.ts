import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../../helpers/db';

vi.mock('@/lib/auth', () => ({ verifyAuth: vi.fn() }));

import { verifyAuth } from '@/lib/auth';
const mockedVerifyAuth = vi.mocked(verifyAuth);

describe('GET /api/words/overrides', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAllCollections();
    mockedVerifyAuth.mockResolvedValue(true);
  });

  it('returns 401 without auth', async () => {
    mockedVerifyAuth.mockResolvedValue(false);

    const { GET } = await import('@/app/api/words/overrides/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns empty array when no overrides exist', async () => {
    const { GET } = await import('@/app/api/words/overrides/route');
    const res = await GET();
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });

  it('returns overrides when they exist', async () => {
    const WordOverride = (await import('@/models/WordOverride')).default;
    await WordOverride.create({
      slug: 'apple-a1',
      word: 'apple',
      level: 'a1',
      wordClass: 'noun',
      definition: 'A fruit',
    });

    const { GET } = await import('@/app/api/words/overrides/route');
    const res = await GET();
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].slug).toBe('apple-a1');
    expect(body[0].word).toBe('apple');
    expect(body[0].level).toBe('a1');
  });

  it('returns multiple overrides', async () => {
    const WordOverride = (await import('@/models/WordOverride')).default;
    await WordOverride.insertMany([
      { slug: 'apple-a1', word: 'apple', level: 'a1' },
      { slug: 'banana-a1', word: 'banana', level: 'a1' },
      { slug: 'cherry-a2', word: 'cherry', level: 'a2' },
    ]);

    const { GET } = await import('@/app/api/words/overrides/route');
    const res = await GET();
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(3);
  });
});
