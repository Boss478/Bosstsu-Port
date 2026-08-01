import { test, expect } from '@playwright/test';

const ADMIN_PASSWORD = 'boss478admin';

test.describe('Admin Auth', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');
  });

  test('login page renders', async ({ page }) => {
    await expect(page.locator('h1, h2, [data-testid="login-title"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('rejects wrong password', async ({ page }) => {
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page
      .locator('button[type="submit"], button:has-text("เข้าสู่ระบบ"), button:has-text("Login")')
      .click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('accepts correct password', async ({ page }) => {
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page
      .locator('button[type="submit"], button:has-text("เข้าสู่ระบบ"), button:has-text("Login")')
      .click();
    await page.waitForURL(/\/admin(\/|$)/, { timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/admin/portfolio');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('redirects to login when unauthenticated for gallery', async ({ page }) => {
    await page.goto('/admin/gallery');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('redirects to login when unauthenticated for tools', async ({ page }) => {
    await page.goto('/admin/tools');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"], button:has-text("เข้าสู่ระบบ")').click();
    await page.waitForURL(/\/admin(\/|$)/, { timeout: 10000 });
  });

  test('dashboard loads with heading', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('can navigate to portfolio list', async ({ page }) => {
    await page.goto('/admin/portfolio');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('can navigate to gallery list', async ({ page }) => {
    await page.goto('/admin/gallery');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('can navigate to games list', async ({ page }) => {
    await page.goto('/admin/games');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('can navigate to words list', async ({ page }) => {
    await page.goto('/admin/words');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
});
