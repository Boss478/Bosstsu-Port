import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../helpers/db';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn(),
}));

vi.mock('isomorphic-dompurify', () => ({
  default: { sanitize: (html: string) => html },
}));

describe('Portfolio Server Actions', () => {
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

  describe('createPortfolioItem', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { createPortfolioItem } = await import('@/app/admin/portfolio/actions');
      const fd = new FormData();
      fd.set('title', 'Test');
      fd.set('slug', 'test');
      fd.set('description', 'Desc');
      fd.set('date', '2025-01-01');
      const result = await createPortfolioItem(fd);
      expect(result).toHaveProperty('error');
      expect(typeof (result as { error?: unknown }).error).toBe('string');
    });

    it('returns validation error for missing fields', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createPortfolioItem } = await import('@/app/admin/portfolio/actions');
      const fd = new FormData();
      fd.set('title', '');
      const result = await createPortfolioItem(fd);
      expect(result).toHaveProperty('error');
    });

    it('creates portfolio item with valid data', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createPortfolioItem } = await import('@/app/admin/portfolio/actions');
      const fd = new FormData();
      fd.set('title', 'Test Portfolio');
      fd.set('slug', 'test-portfolio');
      fd.set('description', 'A test portfolio item');
      fd.set('content', '<p>Content</p>');
      fd.set('date', '2025-06-15');
      fd.set('tags', 'test, portfolio');
      fd.set('tools', 'React, TypeScript');
      const result = await createPortfolioItem(fd);
      expect(result).toHaveProperty('id');
      expect(typeof (result as { id?: unknown }).id).toBe('string');
    });

    it('handles tools as comma-separated string', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createPortfolioItem } = await import('@/app/admin/portfolio/actions');
      const fd = new FormData();
      fd.set('title', 'Tools Test');
      fd.set('slug', 'tools-test');
      fd.set('description', 'Testing tools field');
      fd.set('content', '');
      fd.set('date', '2025-07-01');
      fd.set('tools', 'React, Vue, Angular');
      const result = await createPortfolioItem(fd);
      expect(result).toHaveProperty('id');
    });
  });

  describe('updatePortfolioItem', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { updatePortfolioItem } = await import('@/app/admin/portfolio/actions');
      const fd = new FormData();
      fd.set('title', 'Test');
      fd.set('slug', 'test');
      fd.set('description', 'Desc');
      fd.set('date', '2025-01-01');
      const result = await updatePortfolioItem('507f1f77bcf86cd799439011', fd);
      expect(result).toHaveProperty('error');
    });

    it('updates an existing portfolio item', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createPortfolioItem, updatePortfolioItem } =
        await import('@/app/admin/portfolio/actions');

      const fd1 = new FormData();
      fd1.set('title', 'Original');
      fd1.set('slug', 'original');
      fd1.set('description', 'Original desc');
      fd1.set('date', '2025-01-01');
      const created = await createPortfolioItem(fd1);
      const id = (created as { id: string }).id;

      const fd2 = new FormData();
      fd2.set('title', 'Updated');
      fd2.set('slug', 'updated');
      fd2.set('description', 'Updated desc');
      fd2.set('content', '<p>Updated content</p>');
      fd2.set('date', '2025-06-01');
      fd2.set('tags', '');
      fd2.set('published', 'on');
      const result = await updatePortfolioItem(id, fd2);
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('savePortfolioMedia', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { savePortfolioMedia } = await import('@/app/admin/portfolio/actions');
      const fd = new FormData();
      const result = await savePortfolioMedia('507f1f77bcf86cd799439011', fd);
      expect(result).toHaveProperty('error');
    });

    it('saves media to portfolio item', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createPortfolioItem, savePortfolioMedia } =
        await import('@/app/admin/portfolio/actions');

      const fd1 = new FormData();
      fd1.set('title', 'Media Test');
      fd1.set('slug', 'media-test');
      fd1.set('description', 'Test media');
      fd1.set('date', '2025-01-01');
      const created = await createPortfolioItem(fd1);
      const id = (created as { id: string }).id;

      const fd2 = new FormData();
      fd2.set('coverUrl', '/uploads/cover.webp');
      fd2.set('galleryUrls', JSON.stringify(['/uploads/g1.webp', '/uploads/g2.webp']));
      fd2.set('published', 'on');
      const result = await savePortfolioMedia(id, fd2);
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('togglePublished', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { togglePublished } = await import('@/app/admin/portfolio/actions');
      const result = await togglePublished('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('error');
    });

    it('toggles published status', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createPortfolioItem, togglePublished } =
        await import('@/app/admin/portfolio/actions');

      const fd = new FormData();
      fd.set('title', 'Toggle Test');
      fd.set('slug', 'toggle-test');
      fd.set('description', 'Test toggle');
      fd.set('content', '');
      fd.set('date', '2025-01-01');
      fd.set('tags', '');
      const created = await createPortfolioItem(fd);
      expect(created).toHaveProperty('id');
      const id = (created as { id: string }).id;

      const result = await togglePublished(id);
      expect(result).toEqual({ error: undefined });
    });

    it('returns 404 for non-existent item', async () => {
      verifyAuth.mockResolvedValue(true);
      const { togglePublished } = await import('@/app/admin/portfolio/actions');
      const result = await togglePublished('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('error');
    });
  });

  describe('deletePortfolioItem', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { deletePortfolioItem } = await import('@/app/admin/portfolio/actions');
      const result = await deletePortfolioItem('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('error');
    });

    it('deletes a portfolio item', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createPortfolioItem, deletePortfolioItem } =
        await import('@/app/admin/portfolio/actions');

      const fd = new FormData();
      fd.set('title', 'Delete Test');
      fd.set('slug', 'delete-test');
      fd.set('description', 'To be deleted');
      fd.set('content', '');
      fd.set('date', '2025-01-01');
      fd.set('tags', '');
      const created = await createPortfolioItem(fd);
      expect(created).toHaveProperty('id');
      const id = (created as { id: string }).id;

      const result = await deletePortfolioItem(id);
      expect(result).toEqual({ error: undefined });
    });
  });
});
