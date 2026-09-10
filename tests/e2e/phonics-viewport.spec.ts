import { test, expect, type Page } from '@playwright/test';

const LANDSCAPE_VIEWPORTS = [
  { width: 568, height: 320 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
];

async function seedCachedGame(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('phonics_active_slot', 'guest');
    localStorage.setItem('phonics-stage-1-loaded', 'true');
  });
}

async function expectNoDocumentOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    documentHeight: document.documentElement.scrollHeight,
    documentWidth: document.documentElement.scrollWidth,
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
  }));

  expect(metrics.documentHeight).toBeLessThanOrEqual(metrics.viewportHeight);
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
}

test.describe('Phonics Island viewport and accessibility', () => {
  test('fresh loading exposes status semantics', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/games/phonics');
    await page.waitForSelector('[data-testid="phonics-loading"], .phonics-game');

    const loading = page.getByTestId('phonics-loading');
    if (await loading.isVisible()) {
      await expect(loading).toHaveAttribute('role', 'status');
      await expect(loading).toHaveAttribute('aria-live', 'polite');
    }
  });

  for (const viewport of LANDSCAPE_VIEWPORTS) {
    test(`cached gameplay fills ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await seedCachedGame(page);
      await page.setViewportSize(viewport);
      await page.goto('/games/phonics');
      await expect(page.locator('.phonics-game')).toBeVisible();

      const heights = await page.evaluate(() => ({
        game: document.querySelector('.phonics-game')?.getBoundingClientRect().height,
        host: document.querySelector('[data-testid="phonics-guard-host"]')?.getBoundingClientRect()
          .height,
        viewport: window.innerHeight,
      }));
      expect(heights.game).toBe(heights.viewport);
      expect(heights.host).toBe(heights.viewport);
      await expectNoDocumentOverflow(page);
      await expect(page.getByRole('button', { name: /Play as Guest/ })).toHaveCSS(
        'min-height',
        '44px',
      );
    });
  }

  test('portrait prompt is focused and blocks the app at the breakpoint', async ({ page }) => {
    await seedCachedGame(page);
    await page.setViewportSize({ width: 1024, height: 1024 });
    await page.goto('/games/phonics');

    const prompt = page.getByTestId('phonics-orientation-prompt');
    await expect(prompt).toBeVisible();
    await expect(prompt).toBeFocused();
    await expect(
      page.getByTestId('phonics-guard-host').locator(':scope > div').first(),
    ).toHaveAttribute('aria-hidden', 'true');

    await page.setViewportSize({ width: 1025, height: 768 });
    await expect(prompt).toBeHidden();
    await expect(page.locator('.phonics-game')).toBeVisible();
  });

  test('rotation restores focus and save slots support Space', async ({ page }) => {
    await seedCachedGame(page);
    await page.setViewportSize({ width: 1025, height: 768 });
    await page.goto('/games/phonics');

    const slot = page.locator('#save-slot-1');
    await slot.focus();
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.getByTestId('phonics-orientation-prompt')).toBeFocused();
    await page.setViewportSize({ width: 1025, height: 768 });
    await expect(slot).toBeFocused();

    await page.keyboard.press('Space');
    await expect(page.getByRole('dialog', { name: /Welcome to Phonics Island/ })).toBeVisible();
    await expect(page.getByTestId('phonics-screen-content')).toHaveAttribute('inert', '');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /Welcome to Phonics Island/ })).toBeHidden();
    await expect(slot).toBeFocused();
  });
});
