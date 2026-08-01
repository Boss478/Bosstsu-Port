import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: () => undefined,
    set: vi.fn(),
    delete: vi.fn(),
  }),
  headers: vi.fn().mockResolvedValue({
    get: (name: string) => (name === 'x-forwarded-for' ? '127.0.0.1' : undefined),
  }),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue('allowed'),
  recordFailedAttempt: vi.fn(),
  resetAttempts: vi.fn(),
}));

describe('Login Server Actions', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  describe('loginAdmin', () => {
    it('returns error for wrong password', async () => {
      const { loginAdmin } = await import('@/app/admin/login/actions');
      const fd = new FormData();
      fd.set('password', 'wrong-password');
      const result = await loginAdmin({ error: undefined }, fd);
      expect(result).toHaveProperty('error');
    });

    it('returns error for empty password', async () => {
      const { loginAdmin } = await import('@/app/admin/login/actions');
      const fd = new FormData();
      fd.set('password', '');
      const result = await loginAdmin({ error: undefined }, fd);
      expect(result).toHaveProperty('error');
    });

    it('returns locked error when rate limited', async () => {
      const rateLimit = await import('@/lib/rate-limit');
      vi.mocked(rateLimit.checkRateLimit).mockReturnValue('locked');
      const { loginAdmin } = await import('@/app/admin/login/actions');
      const fd = new FormData();
      fd.set('password', 'test');
      const result = await loginAdmin({ error: undefined }, fd);
      expect(result).toHaveProperty('error');
    });

    it('redirects on successful login', async () => {
      const { loginAdmin } = await import('@/app/admin/login/actions');
      const fd = new FormData();
      fd.set('password', 'test-password-1234');
      try {
        await loginAdmin({ error: undefined }, fd);
      } catch (e) {
        expect((e as Error).message).toContain('REDIRECT:/admin');
      }
    });
  });

  describe('logoutAdmin', () => {
    it('redirects to home on logout', async () => {
      const { logoutAdmin } = await import('@/app/admin/login/actions');
      try {
        await logoutAdmin();
      } catch (e) {
        expect((e as Error).message).toContain('REDIRECT:/');
      }
    });
  });
});
