import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../helpers/db';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn(),
}));

// Mock dbConnect to prevent 5-second timeout when MongoDB is unavailable
vi.mock('@/lib/db', () => ({ default: vi.fn().mockResolvedValue(undefined) }));

// In-memory store for mock data persistence
const dataStore = new Map<string, { slug: string; _id: string; [key: string]: unknown }>();

function createQuery(result: unknown) {
  const query = {
    select: vi.fn(() => query),
    lean: vi.fn(async () => result),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
  return query;
}

const mockModel = {
  find: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      lean: vi.fn().mockImplementation(async () =>
        Array.from(dataStore.values()).map((data) => ({
          slug: data.slug,
          _id: { toString: () => data._id },
        })),
      ),
    }),
  }),
  create: vi.fn().mockImplementation(async (data: { slug: string; [key: string]: unknown }) => {
    const slug = data.slug;
    const id = 'mock-' + slug;
    dataStore.set(slug, { ...data, _id: id });
    return { _id: id, toString: () => id };
  }),
  findOne: vi.fn().mockImplementation(({ slug }: { slug: string }) => {
    const data = dataStore.get(slug);
    return createQuery(data ? { ...data } : null);
  }),
  findOneAndUpdate: vi
    .fn()
    .mockImplementation(
      async (
        filter: { slug: string },
        update: { $set: Record<string, unknown> },
        options?: { upsert?: boolean },
      ) => {
        const slug = filter.slug;
        const existing = dataStore.get(slug);
        if (existing) {
          Object.assign(existing, update.$set);
        } else if (options?.upsert) {
          const id = 'mock-' + slug;
          dataStore.set(slug, { slug, _id: id, ...(update.$set || {}) });
        }
        return { _id: 'mock-' + slug, toString: () => 'mock-' + slug };
      },
    ),
  findByIdAndDelete: vi.fn().mockImplementation(async (id: string) => {
    for (const [slug, data] of dataStore.entries()) {
      if (data._id === id) {
        dataStore.delete(slug);
        break;
      }
    }
    return null;
  }),
};
vi.mock('@/models/WordOverride', () => ({ default: mockModel }));

describe('WordOverride Server Actions', () => {
  let verifyAuth: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAllCollections();
    dataStore.clear();
    const mod = await import('@/lib/auth');
    mod.verifyAuth.mockReset();
    verifyAuth = mod.verifyAuth as never;
  });

  describe('upsertWordOverride', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { upsertWordOverride } = await import('@/app/admin/words/actions');
      const fd = new FormData();
      fd.set('word', 'test');
      fd.set('level', 'a1');
      const result = await upsertWordOverride(fd);
      expect(result).toHaveProperty('error');
      expect(typeof (result as { error?: unknown }).error).toBe('string');
    });

    it('returns validation error for empty word', async () => {
      verifyAuth.mockResolvedValue(true);
      const { upsertWordOverride } = await import('@/app/admin/words/actions');
      const fd = new FormData();
      fd.set('word', '');
      fd.set('level', 'a1');
      const result = await upsertWordOverride(fd);
      expect(result).toHaveProperty('error');
    });

    it('creates word override with valid data', async () => {
      verifyAuth.mockResolvedValue(true);
      const { upsertWordOverride } = await import('@/app/admin/words/actions');
      const fd = new FormData();
      fd.set('word', 'apple');
      fd.set('level', 'a1');
      fd.set('wordClass', 'noun');
      fd.set('ipa', '/ˈæp.əl/');
      fd.set('definition', 'A fruit');
      fd.set('example', 'I eat an apple');
      const result = await upsertWordOverride(fd);
      expect(result).toEqual({ error: undefined });
    });

    it('upserts existing word override by slug', async () => {
      verifyAuth.mockResolvedValue(true);
      const { upsertWordOverride } = await import('@/app/admin/words/actions');

      const fd1 = new FormData();
      fd1.set('word', 'apple');
      fd1.set('level', 'a1');
      fd1.set('definition', 'First definition');
      const result1 = await upsertWordOverride(fd1);
      expect(result1).toEqual({ error: undefined });

      const fd2 = new FormData();
      fd2.set('word', 'apple');
      fd2.set('level', 'a1');
      fd2.set('definition', 'Updated definition');
      fd2.set('published', 'on');
      const result2 = await upsertWordOverride(fd2);
      expect(result2).toEqual({ error: undefined });
    });
  });

  describe('toggleWordPublished', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { toggleWordPublished } = await import('@/app/admin/words/actions');
      const result = await toggleWordPublished('apple-a1');
      expect(result).toHaveProperty('error');
    });

    it('creates override and toggles published for non-existent slug', async () => {
      verifyAuth.mockResolvedValue(true);
      const { toggleWordPublished } = await import('@/app/admin/words/actions');
      const result = await toggleWordPublished('banana-a1');
      expect(result).toEqual({ error: undefined });
    });

    it('toggles published on existing override', async () => {
      verifyAuth.mockResolvedValue(true);
      const { upsertWordOverride, toggleWordPublished } = await import('@/app/admin/words/actions');

      const fd = new FormData();
      fd.set('word', 'cherry');
      fd.set('level', 'a1');
      await upsertWordOverride(fd);

      const result = await toggleWordPublished('cherry-a1');
      expect(result).toEqual({ error: undefined });
    });

    it('returns error for invalid slug format', async () => {
      verifyAuth.mockResolvedValue(true);
      const { toggleWordPublished } = await import('@/app/admin/words/actions');
      const result = await toggleWordPublished('invalid-slug');
      expect(result).toHaveProperty('error');
    });
  });

  describe('deleteWordOverride', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { deleteWordOverride } = await import('@/app/admin/words/actions');
      const result = await deleteWordOverride('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('error');
    });

    it('deletes an existing word override', async () => {
      verifyAuth.mockResolvedValue(true);
      const { upsertWordOverride, deleteWordOverride } = await import('@/app/admin/words/actions');

      const fd = new FormData();
      fd.set('word', 'delete-me');
      fd.set('level', 'b1');
      await upsertWordOverride(fd);

      const WordOverride = (await import('@/models/WordOverride')).default;
      const doc = await WordOverride.findOne({ slug: 'delete-me-b1' });
      expect(doc).not.toBeNull();

      const result = await deleteWordOverride(doc!._id.toString());
      expect(result).toEqual({ error: undefined });

      const deleted = await WordOverride.findOne({ slug: 'delete-me-b1' });
      expect(deleted).toBeNull();
    });
  });
});

describe('searchStaticWords', () => {
  beforeEach(async () => {
    await clearAllCollections();
  });

  it('returns paginated results for empty query', async () => {
    const { searchStaticWords } = await import('@/app/admin/words/actions');
    const result = await searchStaticWords('', 1, 20);
    expect(result.words.length).toBeLessThanOrEqual(20);
    expect(result.total).toBeGreaterThan(20);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBeGreaterThan(1);
  });

  it('searches by word field', async () => {
    const { searchStaticWords } = await import('@/app/admin/words/actions');
    const result = await searchStaticWords('about', 1, 50);
    expect(result.words.length).toBeGreaterThan(0);
    expect(result.words.some((w: { word: string }) => w.word.toLowerCase() === 'about')).toBe(true);
  });

  it('searches by definition field', async () => {
    const { searchStaticWords } = await import('@/app/admin/words/actions');
    const result = await searchStaticWords('fruit', 1, 10);
    expect(result.words.length).toBeGreaterThan(0);
  });

  it('returns empty result for non-existent word', async () => {
    const { searchStaticWords } = await import('@/app/admin/words/actions');
    const result = await searchStaticWords('zzzznotawordxxxx', 1, 50);
    expect(result.words).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('paginates correctly', async () => {
    const { searchStaticWords } = await import('@/app/admin/words/actions');
    const page1 = await searchStaticWords('', 1, 10);
    const page2 = await searchStaticWords('', 2, 10);
    expect(page1.words).toHaveLength(10);
    expect(page2.words).toHaveLength(10);
    expect(page1.words[0].word).not.toBe(page2.words[0].word);
  });

  it('includes override map with slugs', async () => {
    const WordOverride = (await import('@/models/WordOverride')).default;
    await WordOverride.create({
      slug: 'about-a1',
      word: 'about',
      level: 'a1',
      definition: 'Edited definition',
    });

    const { searchStaticWords } = await import('@/app/admin/words/actions');
    const result = await searchStaticWords('about', 1, 50);
    expect(result.overrideMap['about-a1']).toBeDefined();
    expect(typeof result.overrideMap['about-a1']).toBe('string');
  });
});
