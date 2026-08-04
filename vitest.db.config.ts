import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

/**
 * DB suite — SERIAL (fileParallelism: false), alphabetical order preserved.
 * Explicit include list (19 files) = every test file that connects to the
 * shared real MongoDB (tests/helpers/db.ts). Verified 2026-08-04 via
 * connectTestDb / clearAllCollections / clearCollection imports.
 *
 * MUST stay serial: every file wipes ALL collections in beforeEach
 * (clearAllCollections), so cross-file parallelism would clobber seeds
 * mid-test (perf plan §3.2 — provably flaky, do NOT parallelize).
 */
const dbInclude = [
  'tests/admin/gallery.test.ts',
  'tests/admin/games.test.ts',
  'tests/admin/portfolio.test.ts',
  'tests/admin/resources.test.ts',
  'tests/admin/tools.test.ts',
  'tests/admin/words.test.ts',
  'tests/api/tools-edit.test.ts',
  'tests/api/tools-export-csv.test.ts',
  'tests/api/tools-export-files.test.ts',
  'tests/api/tools-focus.test.ts',
  'tests/api/tools-participants.test.ts',
  'tests/api/tools-poll.test.ts',
  'tests/api/tools-respond.test.ts',
  'tests/api/tools-session.test.ts',
  'tests/api/tools-step.test.ts',
  'tests/api/words/overrides.test.ts',
  'tests/unit/models/daily-analytics.test.ts',
  'tests/unit/models/tool-session.test.ts',
  'tests/unit/models/word-override.test.ts',
];

const config = mergeConfig(baseConfig, {
  test: {
    // Explicit (inherits false from base anyway) — shared-Mongo suite must
    // run file-by-file. Include list is explicit paths, so vitest runs them
    // in alphabetical order, matching the historical order.
    fileParallelism: false,
  },
});

// mergeConfig concatenates arrays, so the base's glob include must be
// REPLACED here, not merged — otherwise every test file would run twice.
config.test!.include = dbInclude;

export default defineConfig(config);
