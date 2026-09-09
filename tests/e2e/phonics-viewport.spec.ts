import { test, expect, type Page } from '@playwright/test';

const PORTRAIT_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
];

const LANDSCAPE_VIEWPORTS = [
  { width: 568, height: 320 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
];

async function openPhonics(page: Page, viewport: { width: number; height: number }) {
  const consoleMessages: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleMessages.push(message.text());
  });
  await page.setViewportSize(viewport);
  await page.goto('/games/phonics');
  return consoleMessages;
}

async function expectNoDocumentOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    documentHeight: document.documentElement.scrollHeight,
    documentWidth: document.documentElement.scrollWidth,
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
    rootHeight: document.querySelector('.phonics-standalone-root')?.getBoundingClientRect().height,
  }));

  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(dimensions.documentHeight).toBeLessThanOrEqual(dimensions.viewportHeight);
  expect(dimensions.rootHeight).toBe(dimensions.viewportHeight);
}

for (const viewport of PORTRAIT_VIEWPORTS) {
  test(`Phonics Island prompts rotation at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    const consoleMessages = await openPhonics(page, viewport);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Please rotate your device' })).toBeVisible();
    await expectNoDocumentOverflow(page);
    await expect(consoleMessages).toEqual([]);
  });
}

for (const viewport of LANDSCAPE_VIEWPORTS) {
  test(`Phonics Island fills landscape viewport at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    const consoleMessages = await openPhonics(page, viewport);
    await expect(page.locator('.phonics-orientation-prompt')).toBeHidden();
    await expect(page.locator('.phonics-game')).toBeVisible();
    await expectNoDocumentOverflow(page);
    await expect(consoleMessages).toEqual([]);
  });
}
