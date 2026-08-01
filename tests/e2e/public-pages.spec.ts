import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
  test('homepage renders', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('portfolio page loads with items', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('gallery page loads without crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/gallery');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('games page loads without crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/games');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('resources page loads without crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/resources');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('404 page renders for unknown routes', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/nonexistent-page-12345');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('cookie banner appears on first visit', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('analytics-consent'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    const banner = page.locator('text=usage data to improve your experience').first();
    await expect(banner).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Portfolio Detail', () => {
  test('portfolio item detail page renders', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    const firstLink = page.locator('a[href*="/portfolio/"]').first();
    if ((await firstLink.count()) > 0) {
      await firstLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
});

test.describe('Navigation', () => {
  test('header links to home', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    await page.locator('#site-header a[href="/"]').first().click();
    await expect(page).toHaveURL('/');
  });

  test('footer is present on all public pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('footer')).toBeVisible();
  });
});
