import { defineConfig } from 'vitest/config';
import path from 'path';
import fs from 'fs';

const setupFile = './tests/setup.ts';
const hasSetup = fs.existsSync(path.resolve(__dirname, setupFile));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: hasSetup ? [setupFile] : [],
    include: ['tests/**/*.test.{ts,tsx}'],
    testTimeout: 30000,
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      exclude: ['tests/unit/phonics/**'],
    },
  },
});
