/**
 * Test-inventory rot guard (npm run test:check-inventory).
 *
 * Every tests/**\/*.test.{ts,tsx} file must appear in EXACTLY ONE of the two
 * vitest suite configs (unit or db) — otherwise `npm run test` silently
 * drops it (rot: a new test file that never runs) or runs it twice, or a
 * config references a deleted file. This script fails (exit 1) on any of:
 *   - a globbed test file that is in NEITHER suite config
 *   - an include entry that is in BOTH suite configs
 *   - an include entry that does not exist on disk (deleted / outside tests/)
 *
 * Configs are imported (not parsed) so the check can never drift from what
 * vitest actually loads. Run: npx tsx scripts/check-test-inventory.ts
 */
import fs from 'fs';
import path from 'path';
import unitConfig from '../vitest.unit.config';
import dbConfig from '../vitest.db.config';

const TESTS_DIR = path.resolve(__dirname, '..', 'tests');

function globTestFiles(): string[] {
  const entries = fs.readdirSync(TESTS_DIR, { recursive: true });
  return entries
    .filter((entry) => /\.test\.(ts|tsx)$/.test(entry))
    .map((entry) => path.posix.join('tests', entry.split(path.sep).join('/')))
    .sort();
}

function includeList(config: unknown, label: string): string[] {
  const include = (config as { test?: { include?: unknown } }).test?.include;
  if (!Array.isArray(include)) {
    console.error(`ERROR: ${label} config has no array include list — cannot verify inventory.`);
    process.exit(1);
  }
  return include.filter((item): item is string => typeof item === 'string').sort();
}

function main(): void {
  const globbed = globTestFiles();
  const unit = includeList(unitConfig, 'unit');
  const db = includeList(dbConfig, 'db');

  const errors: string[] = [];
  const union = [...new Set([...unit, ...db])].sort();
  const duplicated = unit.filter((f) => db.includes(f));

  for (const file of globbed) {
    if (!union.includes(file)) {
      errors.push(
        `NOT LISTED: ${file} — exists on disk but is in neither suite config (silently dropped by npm run test)`,
      );
    }
  }
  for (const file of union) {
    if (!globbed.includes(file)) {
      errors.push(
        `MISSING: ${file} — listed in a suite config but not found on disk (deleted or outside tests/)`,
      );
    }
  }
  for (const file of duplicated) {
    errors.push(`DUPLICATE: ${file} — listed in BOTH unit and db configs (would run twice)`);
  }

  const ok = union.length === globbed.length && errors.length === 0;

  console.log('Test inventory check — tests/**/*.test.{ts,tsx}');
  console.log(`  globbed            : ${globbed.length}`);
  console.log(`  unit include       : ${unit.length}`);
  console.log(`  db include         : ${db.length}`);
  console.log(
    `  union == globs     : ${ok ? 'OK' : 'FAIL'} (${union.length} == ${globbed.length})`,
  );

  if (errors.length > 0) {
    console.error(`\n${errors.length} inventory error(s):`);
    for (const err of errors) console.error(`  - ${err}`);
    process.exit(1);
  }
  console.log('\nInventory is exact — every test file runs exactly once.');
}

main();
