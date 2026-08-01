import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../helpers/db';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn(),
}));

describe('Gallery Server Actions', () => {
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

  describe('createGalleryAlbum', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { createGalleryAlbum } = await import('@/app/admin/gallery/actions');
      const fd = new FormData();
      fd.set('title', 'Test');
      fd.set('slug', 'test');
      fd.set('date', '2025-01-01');
      const result = await createGalleryAlbum(fd);
      expect(result).toHaveProperty('error');
      expect(typeof (result as { error?: unknown }).error).toBe('string');
    });

    it('returns validation error for missing fields', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createGalleryAlbum } = await import('@/app/admin/gallery/actions');
      const fd = new FormData();
      fd.set('title', '');
      const result = await createGalleryAlbum(fd);
      expect(result).toHaveProperty('error');
    });

    it('creates gallery album with valid data', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createGalleryAlbum } = await import('@/app/admin/gallery/actions');
      const fd = new FormData();
      fd.set('title', 'Test Gallery');
      fd.set('slug', 'test-gallery');
      fd.set('description', 'A test gallery');
      fd.set('date', '2025-06-15');
      fd.set('tags', 'test, gallery');
      const result = await createGalleryAlbum(fd);
      expect(result).toHaveProperty('id');
      expect(typeof (result as { id?: unknown }).id).toBe('string');
    });
  });

  describe('updateGalleryAlbum', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { updateGalleryAlbum } = await import('@/app/admin/gallery/actions');
      const fd = new FormData();
      fd.set('title', 'Test');
      fd.set('slug', 'test');
      fd.set('date', '2025-01-01');
      const result = await updateGalleryAlbum('507f1f77bcf86cd799439011', fd);
      expect(result).toHaveProperty('error');
    });

    it('updates an existing gallery album', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createGalleryAlbum, updateGalleryAlbum } =
        await import('@/app/admin/gallery/actions');

      const fd1 = new FormData();
      fd1.set('title', 'Original');
      fd1.set('slug', 'original');
      fd1.set('date', '2025-01-01');
      const created = await createGalleryAlbum(fd1);
      const id = (created as { id: string }).id;

      const fd2 = new FormData();
      fd2.set('title', 'Updated Gallery');
      fd2.set('slug', 'updated-gallery');
      fd2.set('description', '');
      fd2.set('date', '2025-06-01');
      fd2.set('tags', '');
      fd2.set('published', 'on');
      const result = await updateGalleryAlbum(id, fd2);
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('saveGalleryMedia', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { saveGalleryMedia } = await import('@/app/admin/gallery/actions');
      const fd = new FormData();
      const result = await saveGalleryMedia('507f1f77bcf86cd799439011', fd);
      expect(result).toHaveProperty('error');
    });

    it('saves media to gallery album', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createGalleryAlbum, saveGalleryMedia } = await import('@/app/admin/gallery/actions');

      const fd1 = new FormData();
      fd1.set('title', 'Media Test');
      fd1.set('slug', 'media-test');
      fd1.set('date', '2025-01-01');
      const created = await createGalleryAlbum(fd1);
      const id = (created as { id: string }).id;

      const fd2 = new FormData();
      fd2.set('coverUrl', '/uploads/cover.webp');
      fd2.set('photoUrls', JSON.stringify(['/uploads/p1.webp']));
      fd2.set('published', 'on');
      const result = await saveGalleryMedia(id, fd2);
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('togglePublished', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { togglePublished } = await import('@/app/admin/gallery/actions');
      const result = await togglePublished('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('error');
    });

    it('toggles published status', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createGalleryAlbum, togglePublished } = await import('@/app/admin/gallery/actions');

      const fd = new FormData();
      fd.set('title', 'Toggle Test');
      fd.set('slug', 'toggle-test');
      fd.set('description', '');
      fd.set('date', '2025-01-01');
      fd.set('tags', '');
      const created = await createGalleryAlbum(fd);
      expect(created).toHaveProperty('id');
      const id = (created as { id: string }).id;

      const result = await togglePublished(id);
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('deleteGalleryAlbum', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { deleteGalleryAlbum } = await import('@/app/admin/gallery/actions');
      const result = await deleteGalleryAlbum('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('error');
    });

    it('deletes a gallery album', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createGalleryAlbum, deleteGalleryAlbum } =
        await import('@/app/admin/gallery/actions');

      const fd = new FormData();
      fd.set('title', 'Delete Test');
      fd.set('slug', 'delete-test');
      fd.set('description', '');
      fd.set('date', '2025-01-01');
      fd.set('tags', '');
      const created = await createGalleryAlbum(fd);
      expect(created).toHaveProperty('id');
      const id = (created as { id: string }).id;

      const result = await deleteGalleryAlbum(id);
      expect(result).toEqual({ error: undefined });
    });
  });
});
