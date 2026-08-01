import { test, expect } from '@playwright/test';

test.describe('Protected API — Broadcast', () => {
  test('returns 401 without auth cookie', async ({ page }) => {
    const response = await page.request.post('/api/tools/broadcast', {
      data: { sessionId: 'test', message: 'hi', messageType: 'message' },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Protected API — Word Overrides', () => {
  test('returns 401 without auth cookie', async ({ page }) => {
    const response = await page.request.get('/api/words/overrides');
    expect(response.status()).toBe(401);
  });
});

test.describe('Protected API — Upload', () => {
  test('returns 401 without auth cookie', async ({ page }) => {
    const response = await page.request.post('/api/upload');
    expect(response.status()).toBe(401);
  });
});

test.describe('Protected API — Process Words', () => {
  test('returns 401 without auth cookie', async ({ page }) => {
    const response = await page.request.get('/api/process-words');
    expect(response.status()).toBe(401);
  });
});

test.describe('Protected API — Admin Routes (middleware)', () => {
  test('admin page returns login redirect without auth', async ({ page }) => {
    const response = await page.request.get('/admin');
    expect(response.status()).toBe(200);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('boss478 page returns login redirect without auth', async ({ page }) => {
    await page.goto('/boss478');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/boss478\/login/);
  });
});
