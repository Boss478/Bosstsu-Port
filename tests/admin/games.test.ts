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

describe('Games Server Actions', () => {
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

  describe('createGame', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { createGame } = await import('@/app/admin/games/actions');
      const fd = new FormData();
      fd.set('title', 'Test Game');
      fd.set('description', 'Desc');
      fd.set('category', 'Puzzle');
      fd.set('gameType', 'url');
      fd.set('playUrl', '/games/test');
      const result = await createGame(fd);
      expect(result).toHaveProperty('error');
    });

    it('returns validation error for missing fields', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createGame } = await import('@/app/admin/games/actions');
      const fd = new FormData();
      fd.set('title', '');
      const result = await createGame(fd);
      expect(result).toHaveProperty('error');
    });

    it('returns error for invalid URL game type', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createGame } = await import('@/app/admin/games/actions');
      const fd = new FormData();
      fd.set('title', 'Bad URL Game');
      fd.set('description', 'Desc');
      fd.set('category', 'Puzzle');
      fd.set('gameType', 'url');
      fd.set('playUrl', 'not-a-valid-url');
      const result = await createGame(fd);
      expect(result).toHaveProperty('error');
    });

    it('returns error for html game type without content', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createGame } = await import('@/app/admin/games/actions');
      const fd = new FormData();
      fd.set('title', 'Empty HTML Game');
      fd.set('description', 'Desc');
      fd.set('category', 'Puzzle');
      fd.set('gameType', 'html');
      fd.set('htmlContent', '');
      const result = await createGame(fd);
      expect(result).toHaveProperty('error');
    });

    it('creates URL game with valid data', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createGame } = await import('@/app/admin/games/actions');
      const fd = new FormData();
      fd.set('title', 'Test Game');
      fd.set('description', 'A test game');
      fd.set('category', 'Puzzle');
      fd.set('gameType', 'url');
      fd.set('playUrl', '/games/test-game');
      fd.set('tags', 'game, puzzle');
      const result = await createGame(fd);
      expect(result).toHaveProperty('id');
    });

    it('creates HTML game with content', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createGame } = await import('@/app/admin/games/actions');
      const fd = new FormData();
      fd.set('title', 'HTML Game');
      fd.set('description', 'An HTML game');
      fd.set('category', 'Quiz');
      fd.set('gameType', 'html');
      fd.set('playUrl', '/games/html-game');
      fd.set('htmlContent', '<h1>Game</h1><p>Content</p>');
      fd.set('instructions', 'Play this game');
      const result = await createGame(fd);
      expect(result).toHaveProperty('id');
    });

    it('creates game with http URL', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createGame } = await import('@/app/admin/games/actions');
      const fd = new FormData();
      fd.set('title', 'HTTP Game');
      fd.set('description', 'External game');
      fd.set('category', 'Quiz');
      fd.set('gameType', 'url');
      fd.set('playUrl', 'http://example.com/game');
      const result = await createGame(fd);
      expect(result).toHaveProperty('id');
    });
  });

  describe('updateGame', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { updateGame } = await import('@/app/admin/games/actions');
      const fd = new FormData();
      fd.set('title', 'Test');
      fd.set('gameType', 'url');
      fd.set('category', 'Puzzle');
      fd.set('playUrl', '/test');
      const result = await updateGame('507f1f77bcf86cd799439011', fd);
      expect(result).toHaveProperty('error');
    });

    it('updates an existing game', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createGame, updateGame } = await import('@/app/admin/games/actions');

      const fd1 = new FormData();
      fd1.set('title', 'Original Game');
      fd1.set('description', 'Original');
      fd1.set('category', 'Puzzle');
      fd1.set('gameType', 'url');
      fd1.set('playUrl', '/games/original');
      const created = await createGame(fd1);
      const id = (created as { id: string }).id;

      const fd2 = new FormData();
      fd2.set('title', 'Updated Game');
      fd2.set('description', 'Updated');
      fd2.set('category', 'Quiz');
      fd2.set('gameType', 'url');
      fd2.set('playUrl', '/games/updated');
      fd2.set('published', 'on');
      const result = await updateGame(id, fd2);
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('saveGameMedia', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { saveGameMedia } = await import('@/app/admin/games/actions');
      const fd = new FormData();
      const result = await saveGameMedia('507f1f77bcf86cd799439011', fd);
      expect(result).toHaveProperty('error');
    });

    it('saves media to game', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createGame, saveGameMedia } = await import('@/app/admin/games/actions');

      const fd1 = new FormData();
      fd1.set('title', 'Media Game');
      fd1.set('description', 'Test');
      fd1.set('category', 'Puzzle');
      fd1.set('gameType', 'url');
      fd1.set('playUrl', '/games/media');
      const created = await createGame(fd1);
      const id = (created as { id: string }).id;

      const fd2 = new FormData();
      fd2.set('thumbnailUrl', '/uploads/thumb.webp');
      fd2.set('published', 'on');
      const result = await saveGameMedia(id, fd2);
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('togglePublished', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { togglePublished } = await import('@/app/admin/games/actions');
      const result = await togglePublished('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('error');
    });

    it('toggles published status', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createGame, togglePublished } = await import('@/app/admin/games/actions');

      const fd = new FormData();
      fd.set('title', 'Toggle Game');
      fd.set('description', 'Test');
      fd.set('category', 'Puzzle');
      fd.set('gameType', 'url');
      fd.set('playUrl', '/games/toggle');
      const created = await createGame(fd);
      const id = (created as { id: string }).id;

      const result = await togglePublished(id);
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('deleteGame', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { deleteGame } = await import('@/app/admin/games/actions');
      const result = await deleteGame('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('error');
    });

    it('deletes a game', async () => {
      verifyAuth.mockResolvedValue(true);
      const { createGame, deleteGame } = await import('@/app/admin/games/actions');

      const fd = new FormData();
      fd.set('title', 'Delete Game');
      fd.set('description', 'To be deleted');
      fd.set('category', 'Puzzle');
      fd.set('gameType', 'url');
      fd.set('playUrl', '/games/delete');
      const created = await createGame(fd);
      const id = (created as { id: string }).id;

      const result = await deleteGame(id);
      expect(result).toEqual({ error: undefined });
    });
  });
});
