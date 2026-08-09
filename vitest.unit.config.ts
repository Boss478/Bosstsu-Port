import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

/**
 * UNIT suite — parallel (fileParallelism: true is vitest's default).
 * Explicit include list (38 files) = every test file that does NOT touch
 * MongoDB. Verified 2026-08-04: none of these import tests/helpers/db
 * (connectTestDb / clearAllCollections / clearCollection) or helpers/seed.
 * Cross-file parallelism is safe: they are pure unit tests (no shared state).
 * Inventory (unit ∪ db == globs) is guarded by scripts/check-test-inventory.ts.
 */
const unitInclude = [
  'tests/admin/login.test.ts',
  'tests/api/process-words.test.ts',
  'tests/api/pyodide-input.test.ts',
  'tests/api/stocks.test.ts',
  'tests/api/tools-broadcast.test.ts',
  'tests/api/upload.test.ts',
  'tests/auth.test.ts',
  'tests/games/g2p.test.ts',
  'tests/games/phonemeSearch.test.ts',
  'tests/games/phonics.test.ts',
  'tests/games/vocab.test.ts',
  'tests/lawlib/copy-print.test.ts',
  'tests/lawlib/digest-view.test.ts',
  'tests/lawlib/format.test.ts',
  'tests/lawlib/highlight-store.test.ts',
  'tests/lawlib/normalize.test.ts',
  'tests/lawlib/parser.test.ts',
  'tests/lawlib/validate.test.ts',
  'tests/lawlib/view-key.test.ts',
  'tests/spike-server-action.test.ts',
  'tests/unit/alphabet-adventure.test.ts',
  'tests/unit/backtotop.test.tsx',
  'tests/unit/challenge-generators.test.ts',
  'tests/unit/lawlib/compact-routing.test.tsx',
  'tests/unit/lawlib/glass-formulas.test.ts',
  'tests/unit/lawlib/quick-note.test.tsx',
  'tests/unit/lawlib/reader-settings.test.ts',
  'tests/unit/lawlib/reading-dock.test.tsx',
  'tests/unit/lawlib/search-panel.test.tsx',
  'tests/unit/lawlib/settings-panel.test.tsx',
  'tests/unit/lawlib/theme-provider.test.tsx',
  'tests/unit/lawlib/tooltip.test.tsx',
  'tests/unit/phonics/achievement-checker.test.ts',
  'tests/unit/phonics/companion.test.ts',
  'tests/unit/phonics/features.test.ts',
  'tests/unit/phonics/game-screen.test.tsx',
  'tests/unit/phonics/question-components.test.tsx',
  'tests/unit/phonics/question-generators.test.ts',
  'tests/unit/phonics/quiz-fixes.test.tsx',
  'tests/unit/phonics/save.test.ts',
  'tests/unit/phonics/shuffle.test.ts',
  'tests/unit/phonics/word-merge.test.ts',
  'tests/unit/tools/sse-server.test.ts',
  'tests/unit/tools/use-sse.test.tsx',
  'tests/unit/tools/use-tool-poll.test.tsx',
  'tests/vocab-generators.test.ts',
];

const config = mergeConfig(baseConfig, {
  test: {
    // Override the base's `fileParallelism: false` — unit files are
    // parallel-safe. Cap at 5 workers: 8-core machine sharing 8GB RAM with
    // the DB suite's Mongo; 7 workers starved heavy imports (game-screen
    // hookTimeout flake, 1/3 runs).
    fileParallelism: true,
    maxWorkers: 5,
    // Default hookTimeout (10s) is calibrated for serial runs. Under
    // multi-worker parallelism, heavy imports contend for CPU and can
    // exceed 10s. Raise to match testTimeout (30s) as a safety margin.
    hookTimeout: 30000,
  },
});

// mergeConfig concatenates arrays, so the base's glob include must be
// REPLACED here, not merged — otherwise every test file would run twice.
config.test!.include = unitInclude;

export default defineConfig(config);
