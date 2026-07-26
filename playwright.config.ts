import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3300',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
