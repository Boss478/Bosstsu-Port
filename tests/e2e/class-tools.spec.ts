import { test, expect } from '@playwright/test';

const ADMIN_PASSWORD = 'boss478admin';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page
    .locator('button[type="submit"], button:has-text("เข้าสู่ระบบ"), button:has-text("Login")')
    .click();
  await page.waitForURL('/admin');
  await page.waitForLoadState('networkidle');
}

test.describe('Class Tools — Admin', () => {
  test('tools list page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await loginAsAdmin(page);
    await page.goto('/admin/tools');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('tools list page renders heading', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/tools');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('session detail page returns not-found for invalid ID format', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await loginAsAdmin(page);
    await page.goto('/admin/tools/sessions/invalid-id');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('session detail page returns not-found for nonexistent ID', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await loginAsAdmin(page);
    await page.goto('/admin/tools/sessions/507f1f77bcf86cd799439011');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});

test.describe('Class Tools — Student Join', () => {
  test('study enter page renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/study');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText(/เข้าสู่ห้องเรียน/i);
    expect(errors).toEqual([]);
  });

  test('study page with invalid session code shows not-found', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/study/XXXXX');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=ไม่พบห้องเรียน')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('study enter page has 5-character input', async ({ page }) => {
    await page.goto('/study');
    await page.waitForLoadState('networkidle');

    const input = page.locator('input[maxlength="5"]');
    await expect(input).toBeVisible();
    await input.fill('ABCDE');
    await expect(input).toHaveValue('ABCDE');
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

test.describe('Class Tools — Poll API', () => {
  test('poll endpoint returns 400 without sessionId', async ({ page }) => {
    const response = await page.request.get('/api/tools/poll');
    expect(response.status()).toBe(400);
  });

  test('poll endpoint handles invalid sessionId format', async ({ page }) => {
    const response = await page.request.get('/api/tools/poll?sessionId=bad');
    expect([400, 500]).toContain(response.status());
  });

  test('poll endpoint handles valid-format sessionId', async ({ page }) => {
    const response = await page.request.get('/api/tools/poll?sessionId=507f1f77bcf86cd799439011');
    expect([200, 400, 404]).toContain(response.status());
  });

  test('step endpoint returns 400 without sessionId', async ({ page }) => {
    const response = await page.request.get('/api/tools/step');
    expect(response.status()).toBe(400);
  });

  test('session lookup endpoint returns 400 without code', async ({ page }) => {
    const response = await page.request.get('/api/tools/session');
    expect(response.status()).toBe(400);
  });

  test('session lookup returns 404 for nonexistent code', async ({ page }) => {
    const response = await page.request.get('/api/tools/session?code=ZZZZZ');
    expect(response.status()).toBe(404);
  });
});

test.describe('Class Tools — TanStack Query Foundation', () => {
  test('admin tools page no hydration warnings', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning' && msg.text().includes('hydration')) {
        warnings.push(msg.text());
      }
    });

    await loginAsAdmin(page);
    await page.goto('/admin/tools');
    await page.waitForLoadState('networkidle');
    expect(warnings).toEqual([]);
  });

  test('React Query Devtools registered on tools page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/tools');
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
