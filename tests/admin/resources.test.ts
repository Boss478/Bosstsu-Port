import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../helpers/db';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn(),
}));

describe('Learning Resources Server Actions', () => {
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

  describe('createLearningResource', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { createLearningResource } = await import('@/app/admin/resources/actions');
      const fd = new FormData();
      fd.set('title', 'Test');
      fd.set('description', 'Desc');
      fd.set('subject', 'Math');
      fd.set('type', 'Article');
      const result = await createLearningResource(fd);
      expect(result).toHaveProperty('error');
    });

    it('returns validation error for invalid type', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createLearningResource } = await import('@/app/admin/resources/actions');
      const fd = new FormData();
      fd.set('title', 'Test');
      fd.set('description', 'Desc');
      fd.set('subject', 'Math');
      fd.set('type', 'InvalidType');
      const result = await createLearningResource(fd);
      expect(result).toHaveProperty('error');
      expect((result as { error?: unknown }).error).toBe('ประเภทไม่ถูกต้อง');
    });

    it('returns validation error for missing required fields', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createLearningResource } = await import('@/app/admin/resources/actions');
      const fd = new FormData();
      fd.set('type', 'Article');
      fd.set('title', '');
      const result = await createLearningResource(fd);
      expect(result).toHaveProperty('error');
    });

    it('creates resource with valid data', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createLearningResource } = await import('@/app/admin/resources/actions');
      const fd = new FormData();
      fd.set('title', 'Test Article');
      fd.set('description', 'A test article');
      fd.set('subject', 'Computer Science');
      fd.set('type', 'Article');
      fd.set('tags', 'test, article');
      fd.set('link', 'https://example.com');
      const result = await createLearningResource(fd);
      expect(result).toHaveProperty('id');
      expect(typeof (result as { id?: unknown }).id).toBe('string');
    });

    it('creates resource with all optional fields', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createLearningResource } = await import('@/app/admin/resources/actions');
      const fd = new FormData();
      fd.set('title', 'Full Resource');
      fd.set('description', 'Full description');
      fd.set('subject', 'Science');
      fd.set('type', 'Video');
      fd.set('youtubeId', 'abc123');
      fd.set('canvaEmbed', 'https://canva.com/embed/test');
      fd.set('content', '<p>HTML content</p>');
      fd.set('embedCode', '<iframe></iframe>');
      const result = await createLearningResource(fd);
      expect(result).toHaveProperty('id');
    });
  });

  describe('updateLearningResource', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { updateLearningResource } = await import('@/app/admin/resources/actions');
      const fd = new FormData();
      fd.set('title', 'Test');
      fd.set('type', 'Article');
      fd.set('subject', 'Math');
      fd.set('description', 'Desc');
      const result = await updateLearningResource('507f1f77bcf86cd799439011', fd);
      expect(result).toHaveProperty('error');
    });

    it('updates an existing resource', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createLearningResource, updateLearningResource } =
        await import('@/app/admin/resources/actions');

      const fd1 = new FormData();
      fd1.set('title', 'Original');
      fd1.set('description', 'Original desc');
      fd1.set('subject', 'Math');
      fd1.set('type', 'Article');
      const created = await createLearningResource(fd1);
      const id = (created as { id: string }).id;

      const fd2 = new FormData();
      fd2.set('title', 'Updated Resource');
      fd2.set('description', 'Updated desc');
      fd2.set('subject', 'Science');
      fd2.set('type', 'Video');
      fd2.set('published', 'on');
      const result = await updateLearningResource(id, fd2);
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('saveResourceMedia', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { saveResourceMedia } = await import('@/app/admin/resources/actions');
      const fd = new FormData();
      const result = await saveResourceMedia('507f1f77bcf86cd799439011', fd);
      expect(result).toHaveProperty('error');
    });

    it('saves media to resource', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createLearningResource, saveResourceMedia } =
        await import('@/app/admin/resources/actions');

      const fd1 = new FormData();
      fd1.set('title', 'Media Test');
      fd1.set('description', 'Test media');
      fd1.set('subject', 'Math');
      fd1.set('type', 'Article');
      const created = await createLearningResource(fd1);
      const id = (created as { id: string }).id;

      const fd2 = new FormData();
      fd2.set('thumbnailUrl', '/uploads/thumb.webp');
      fd2.set('fileUrl', '/uploads/file.pdf');
      fd2.set('published', 'on');
      const result = await saveResourceMedia(id, fd2);
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('togglePublished', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { togglePublished } = await import('@/app/admin/resources/actions');
      const result = await togglePublished('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('error');
    });

    it('toggles published status', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createLearningResource, togglePublished } =
        await import('@/app/admin/resources/actions');

      const fd = new FormData();
      fd.set('title', 'Toggle Test');
      fd.set('description', 'Test toggle');
      fd.set('subject', 'Math');
      fd.set('type', 'Article');
      const created = await createLearningResource(fd);
      const id = (created as { id: string }).id;

      const result = await togglePublished(id);
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('deleteLearningResource', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { deleteLearningResource } = await import('@/app/admin/resources/actions');
      const result = await deleteLearningResource('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('error');
    });

    it('deletes a resource', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createLearningResource, deleteLearningResource } =
        await import('@/app/admin/resources/actions');

      const fd = new FormData();
      fd.set('title', 'Delete Test');
      fd.set('description', 'To be deleted');
      fd.set('subject', 'Math');
      fd.set('type', 'Article');
      const created = await createLearningResource(fd);
      const id = (created as { id: string }).id;

      const result = await deleteLearningResource(id);
      expect(result).toEqual({ error: undefined });
    });
  });
});
