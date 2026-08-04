/**
 * LawLib — validate-only CLI (thin wrapper; logic lives in src/lib/lawlib/*).
 *
 * Usage:
 *   npx tsx scripts/lawlib/validate.ts                # all laws (except _-prefixed)
 *   npx tsx scripts/lawlib/validate.ts <file.md> ...  # specific files (may include _-prefixed)
 *
 * Parses + validates each file; cross-law codes are checked against
 * content/lawlib/planned-laws.json plus LAW_CODE_ALIASES (src/lib/lawlib/
 * terms.ts) — the same knownCodes build.ts uses. Prints one line per error;
 * exits 1 if any law fails, 0 if all pass.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseLawMarkdown } from '../../src/lib/lawlib/parser';
import { validateLawDoc } from '../../src/lib/lawlib/validate';
import { LAW_CODE_ALIASES } from '../../src/lib/lawlib/terms';

const ROOT = resolve(__dirname, '..', '..');
const LAWS_DIR = join(ROOT, 'content', 'lawlib', 'laws');
const PLANNED_PATH = join(ROOT, 'content', 'lawlib', 'planned-laws.json');

interface PlannedLaw {
  code: string;
  slug: string;
  built: boolean;
}

function main(): void {
  const args = process.argv.slice(2);
  let files: string[];
  if (args.length > 0) {
    files = args;
  } else {
    files = readdirSync(LAWS_DIR)
      .filter((f) => f.endsWith('.md'))
      .filter((f) => !f.startsWith('_'))
      .sort();
  }

  let knownCodes: string[] = [];
  try {
    const planned = JSON.parse(readFileSync(PLANNED_PATH, 'utf8')) as PlannedLaw[];
    // Same knownCodes as build.ts: planned codes + LAW_CODE_ALIASES keys —
    // cross-law refs using the alias form validate identically in both CLIs.
    knownCodes = [...planned.map((p) => p.code), ...Object.keys(LAW_CODE_ALIASES)];
  } catch (err) {
    console.error(`[warn] cannot read ${PLANNED_PATH}: ${(err as Error).message}`);
  }

  let failed = 0;
  for (const file of files) {
    const path = file.includes('/') || file.includes('\\') ? file : join(LAWS_DIR, file);
    let doc;
    try {
      doc = parseLawMarkdown(readFileSync(path, 'utf8'));
    } catch (err) {
      console.error(`[FAIL] ${file}: parse error — ${(err as Error).message}`);
      failed += 1;
      continue;
    }
    const errors = validateLawDoc(doc, knownCodes);
    if (errors.length > 0) {
      console.error(`[FAIL] ${file} (slug "${doc.slug}"): ${errors.length} validation error(s):`);
      for (const e of errors) console.error(`  - ${e}`);
      failed += 1;
    } else {
      console.log(`[OK] ${file} (slug "${doc.slug}")`);
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} law(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`\nAll ${files.length} law(s) valid.`);
  }
}

main();
