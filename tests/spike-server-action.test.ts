import { describe, it, expect, vi } from 'vitest';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: () => undefined,
  }),
}));

vi.mock('@/lib/db', () => ({
  default: vi.fn().mockResolvedValue(true),
}));

describe('Server Action import spike', () => {
  it('can import and call a server action', async () => {
    const { createPortfolioItem } = await import('@/app/admin/portfolio/actions');

    const formData = new FormData();
    formData.set('title', 'Test');
    formData.set('slug', 'test');
    formData.set('description', 'Test desc');
    formData.set('date', '2025-01-01');
    formData.set('tags', 'test');

    const result = await createPortfolioItem(formData);
    expect(result).toBeDefined();
  });

  it('returns auth error without valid cookie', async () => {
    const { createPortfolioItem } = await import('@/app/admin/portfolio/actions');

    const formData = new FormData();
    formData.set('title', 'Test');
    formData.set('slug', 'test');
    formData.set('description', 'Test desc');
    formData.set('date', '2025-01-01');
    formData.set('tags', 'test');

    const result = await createPortfolioItem(formData);
    expect(result).toHaveProperty('error');
    expect(typeof (result as { error: string }).error).toBe('string');
  });
});
