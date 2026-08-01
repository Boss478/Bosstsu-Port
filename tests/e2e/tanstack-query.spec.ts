import { test, expect } from '@playwright/test';

test.describe('TanStack Query — Foundation', () => {
  test('public pages render without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('React Query Devtools toggle is registered', async ({ page }) => {
    await page.goto('/boss478/stocks');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => typeof (window as Record<string, unknown>).toggleReactQueryDevtools === 'function',
    );
    expect(
      await page.evaluate(
        () => typeof (window as Record<string, unknown>).toggleReactQueryDevtools,
      ),
    ).toBe('function');
  });
});

test.describe('TanStack Query — Finance API (availability)', () => {
  test('budgets endpoint is reachable', async ({ page }) => {
    const response = await page.request.get('/boss478/finance/api/budgets?month=2026-07');
    expect(response.status()).not.toBe(404);
    expect(response.status()).not.toBe(500);
  });

  test('transactions endpoint is reachable', async ({ page }) => {
    const response = await page.request.get('/boss478/finance/api/transactions?month=2026-07');
    expect(response.status()).not.toBe(404);
    expect(response.status()).not.toBe(500);
  });

  test('subscriptions endpoint is reachable', async ({ page }) => {
    const response = await page.request.get('/boss478/finance/api/subscriptions');
    expect(response.status()).not.toBe(404);
    expect(response.status()).not.toBe(500);
  });
});

test.describe('TanStack Query — Stocks API (availability)', () => {
  test('holdings endpoint is reachable', async ({ page }) => {
    const response = await page.request.get('/boss478/api/holdings');
    expect(response.status()).not.toBe(404);
    expect(response.status()).not.toBe(500);
  });

  test('watchlist endpoint is reachable', async ({ page }) => {
    const response = await page.request.get('/boss478/api/watchlist');
    expect(response.status()).not.toBe(404);
    expect(response.status()).not.toBe(500);
  });

  test('quotes endpoint validates input', async ({ page }) => {
    const response = await page.request.post('/api/stocks', {
      data: { type: 'quotes', symbols: [] },
    });
    expect(response.status()).toBe(400);
  });
});

test.describe('TanStack Query — Classroom Tools API (availability)', () => {
  test('poll endpoint validates input', async ({ page }) => {
    const response = await page.request.get('/api/tools/poll');
    expect(response.status()).toBe(400);
  });

  test('participants endpoint is reachable', async ({ page }) => {
    const response = await page.request.get('/api/tools/participants?sessionId=test');
    expect(response.status()).not.toBe(404);
    expect(response.status()).not.toBe(500);
  });

  test('step endpoint validates sessionId', async ({ page }) => {
    const response = await page.request.get('/api/tools/step');
    expect(response.status()).toBe(400);
  });
});

test.describe('TanStack Query — Analytics API (availability)', () => {
  test('analytics data endpoint is reachable', async ({ page }) => {
    const response = await page.request.get('/admin/analytics/api/data');
    expect(response.status()).not.toBe(404);
    expect(response.status()).not.toBe(500);
  });
});

test.describe('TanStack Query — Hydration', () => {
  test('no hydration mismatch warnings', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning' && msg.text().includes('hydration')) {
        warnings.push(msg.text());
      }
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(warnings).toEqual([]);
  });

  test('pages with query hooks render without crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/study');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('finance page renders without crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/boss478/finance');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('stocks page renders without crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/boss478/stocks');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
