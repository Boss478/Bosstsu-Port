import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  retries: 1,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: 'http://localhost:3300',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  reporter: [['list'], ['html', { outputFolder: '../../playwright-report', open: 'never' }]],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3300',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
