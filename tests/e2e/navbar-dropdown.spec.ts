import { test, expect } from '@playwright/test';

const NAV_ITEM_LABEL = 'ผลงาน';
const SUB_ITEMS = ['ผลงาน', 'แกลเลอรี่'];

test.describe('Navbar dropdown hover animation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('dropdown has transition-all and correct classes', async ({ page }) => {
    const dropdown = page
      .locator('[id="site-header"] .group')
      .filter({ hasText: NAV_ITEM_LABEL })
      .locator('> div.absolute');
    await expect(dropdown).toHaveClass(/transition-all/);
    await expect(dropdown).toHaveClass(/duration-300/);
  });

  test('dropdown slides down on hover and up on unhover', async ({ page }) => {
    const navGroup = page.locator('[id="site-header"] .group').filter({ hasText: NAV_ITEM_LABEL });
    const dropdown = navGroup.locator('> div.absolute');

    const initialOpacity = await dropdown.evaluate((el) => getComputedStyle(el).opacity);
    expect(initialOpacity).toBe('0');

    await navGroup.hover();

    await page.waitForTimeout(100);
    const midOpacity = await dropdown.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
    expect(midOpacity).toBeGreaterThan(0);
    expect(midOpacity).toBeLessThan(1);

    await page.waitForTimeout(400);
    const finalOpacity = await dropdown.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
    expect(finalOpacity).toBe(1);

    for (const item of SUB_ITEMS) {
      await expect(dropdown).toContainText(item);
    }

    await page.locator('body').hover({ position: { x: 0, y: 0 } });
    await page.waitForTimeout(100);
    const exitOpacity = await dropdown.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
    expect(exitOpacity).toBeLessThan(1);

    await page.waitForTimeout(400);
    const finalExitOpacity = await dropdown.evaluate((el) => getComputedStyle(el).opacity);
    expect(finalExitOpacity).toBe('0');
  });

  test('transition-duration is 300ms', async ({ page }) => {
    const dropdown = page
      .locator('[id="site-header"] .group')
      .filter({ hasText: NAV_ITEM_LABEL })
      .locator('> div.absolute');
    const duration = await dropdown.evaluate((el) => getComputedStyle(el).transitionDuration);
    const ms = duration.includes('ms') ? parseFloat(duration) : parseFloat(duration) * 1000;
    expect(ms).toBeCloseTo(300, -1);
  });
});
