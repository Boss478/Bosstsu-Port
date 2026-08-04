/**
 * LawLib — build pipeline CLI.
 *
 * Usage: npx tsx scripts/lawlib/build.ts [--check] [--include-sample]
 *
 *  - Reads every `*.md` in content/lawlib/laws/ EXCEPT `_`-prefixed files.
 *    `--include-sample` ALSO builds `_sample.md` (slug 'sample').
 *  - TWO PASSES (SCRUTINY-L1-11): pass 1 parses + validates EVERY law (plus
 *    duplicate-slug, planned-laws manifest and alias-collision checks) with
 *    NO writes; pass 2 writes only when everything passed. Any failure in
 *    build mode → exit code 1 with NO writes (no silent partial state).
 *  - `--check` mode: validate only; exits non-zero if ANY law fails.
 *  - Emits: src/data/lawlib/laws/<slug>.json (LawDoc),
 *    src/data/lawlib/index.json (list metadata),
 *    src/data/lawlib/registry.ts (static-literal lazy loaders ONLY — never
 *    template-literal dynamic imports, webpack-safe).
 *
 * Thin CLI — all real logic lives in src/lib/lawlib/*.
 */

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseLawMarkdown } from '../../src/lib/lawlib/parser';
import {
  validateLawDoc,
  validatePlannedLaws,
  type PlannedLawEntry,
} from '../../src/lib/lawlib/validate';
import { LAW_CODE_ALIASES } from '../../src/lib/lawlib/terms';
import type { LawDoc } from '../../src/types/lawlib';

const ROOT = resolve(__dirname, '..', '..');
const LAWS_DIR = join(ROOT, 'content', 'lawlib', 'laws');
const PLANNED_PATH = join(ROOT, 'content', 'lawlib', 'planned-laws.json');
const OUT_DIR = join(ROOT, 'src', 'data', 'lawlib');
const LAWS_OUT_DIR = join(OUT_DIR, 'laws');

interface IndexEntry {
  slug: string;
  code: string;
  titleTh: string;
  subject: string;
  part: 'ก' | 'ข';
  tags: string[];
  verifiedAt: string;
  editionCount: number;
  articleCount: number;
  definitionTerms: string[];
}

function plannedLaws(): PlannedLawEntry[] {
  try {
    return JSON.parse(readFileSync(PLANNED_PATH, 'utf8')) as PlannedLawEntry[];
  } catch (err) {
    console.error(`[warn] cannot read ${PLANNED_PATH}: ${(err as Error).message}`);
    return [];
  }
}

function plannedCodes(planned: PlannedLawEntry[]): string[] {
  return planned.map((p) => p.code);
}

function writeJson(path: string, data: unknown): void {
  // Compact emit (NFR2 — 150KB per-law JSON ceiling; pretty-print pushed the
  // largest law past it). Git diffs are less readable, but size wins per NFR2.
  writeFileSync(path, `${JSON.stringify(data)}\n`, 'utf8');
}

function articleCountOf(doc: LawDoc): number {
  return doc.chapters.reduce(
    (n, c) => n + c.articles.length + (c.sections?.reduce((m, s) => m + s.articles.length, 0) ?? 0),
    0,
  );
}

/**
 * Alias-map guard: an alias code must not collide with a planned code (or
 * point at a different slug) — codeToSlug is keyed by code, last-wins would
 * silently break refs.
 */
function aliasErrors(planned: PlannedLawEntry[]): string[] {
  const out: string[] = [];
  const owner = new Map(planned.filter((p) => p.code !== '').map((p) => [p.code, p.slug]));
  for (const [code, slug] of Object.entries(LAW_CODE_ALIASES)) {
    const existing = owner.get(code);
    if (existing === undefined) continue;
    out.push(
      existing === slug
        ? `alias "${code}" ซ้ำกับ planned code (entry เดียวกัน) — ลบ alias`
        : `alias "${code}" ชี้ slug "${slug}" แต่ planned entry ชี้ "${existing}"`,
    );
  }
  return out;
}

function main(): void {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const includeSample = args.includes('--include-sample');

  const files = readdirSync(LAWS_DIR)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => !f.startsWith('_') || includeSample)
    .sort();

  const planned = plannedLaws();
  // Cross-law rule 2 accepts BOTH the canonical planned codes and the alias
  // ref forms (authors write either in [[…|code]]).
  const knownCodes = [...plannedCodes(planned), ...Object.keys(LAW_CODE_ALIASES)];

  // --- PASS 1: parse + validate everything, NO writes ------------------------
  interface PassResult {
    file: string;
    doc: LawDoc;
  }
  const passing: PassResult[] = [];
  const failed: Array<{ file: string; slug: string; errors: string[] }> = [];
  /** Every parsed doc (valid or not) — duplicate-slug detection needs all. */
  const parsedSlugs: Array<{ file: string; slug: string }> = [];

  for (const file of files) {
    const md = readFileSync(join(LAWS_DIR, file), 'utf8');

    let doc: LawDoc;
    try {
      doc = parseLawMarkdown(md);
    } catch (err) {
      const msg = (err as Error).message;
      console.error(`[FAIL] ${file}: parse error — ${msg}`);
      failed.push({ file, slug: file.replace(/\.md$/, ''), errors: [`parse error: ${msg}`] });
      continue;
    }
    parsedSlugs.push({ file, slug: doc.slug });

    const errors = validateLawDoc(doc, knownCodes);
    if (errors.length > 0) {
      console.error(`[FAIL] ${file} (slug "${doc.slug}"): ${errors.length} validation error(s):`);
      for (const e of errors) console.error(`  - ${e}`);
      failed.push({ file, slug: doc.slug, errors });
      continue;
    }

    passing.push({ file, doc });
    console.log(`[OK] ${file} (slug "${doc.slug}") — ${articleCountOf(doc)} มาตรา`);
  }

  // --- duplicate slug detection: hard failure across ALL parsed docs --------
  const slugOwner = new Map<string, string>();
  const dupes: string[] = [];
  for (const { file, slug } of parsedSlugs) {
    if (slugOwner.has(slug)) {
      if (!dupes.includes(slug)) dupes.push(slug);
    } else {
      slugOwner.set(slug, file);
    }
  }
  if (dupes.length > 0) {
    const msg = `duplicate law slug(s) — each law file must have a unique slug: ${dupes.join(', ')}`;
    console.error(`[FAIL] ${msg}`);
    failed.push({ file: '(dup-slug)', slug: dupes.join(', '), errors: [msg] });
  }

  // --- planned-laws manifest + alias-map integrity --------------------------
  const plannedErrors = validatePlannedLaws(planned);
  for (const e of plannedErrors) console.error(`[FAIL] planned-laws.json: ${e}`);
  if (plannedErrors.length > 0) {
    failed.push({ file: 'planned-laws.json', slug: '', errors: plannedErrors });
  }
  const aliasCheck = aliasErrors(planned);
  for (const e of aliasCheck) console.error(`[FAIL] alias map: ${e}`);
  if (aliasCheck.length > 0) {
    failed.push({
      file: 'LAW_CODE_ALIASES (src/lib/lawlib/terms.ts)',
      slug: '',
      errors: aliasCheck,
    });
  }

  // --- built slug ↔ planned entry consistency (wave-2 MAJOR-2) --------------
  // codeToSlug (emitted below) maps every authored code — planned codes +
  // LAW_CODE_ALIASES keys — to the slug of its planned entry. Runtime
  // cross-law lookups (loadCrossLaw) resolve the ref's authored code through
  // codeToSlug → registry[slug], so a built law whose frontmatter slug is NOT
  // a codeToSlug target is UNREACHABLE: every hover on it silently degrades
  // to "ยังไม่เปิดให้อ่าน". Pass 1 verifies each built law's slug equals the
  // planned slug for its code (planned entries ∪ alias targets) BEFORE any
  // write — a divergence must fail the build, not ship.
  const plannedSlugs = new Set(planned.filter((p) => p.code !== '').map((p) => p.slug));
  for (const slug of Object.values(LAW_CODE_ALIASES)) plannedSlugs.add(slug);
  for (const { file, doc } of passing) {
    // The 'sample' preview fixture (--include-sample only) is deliberately
    // outside planned-laws.json — never in the list, its code intentionally
    // not a codeToSlug target (preview-only).
    if (doc.slug === 'sample') continue;
    if (!plannedSlugs.has(doc.slug)) {
      const msg = `frontmatter slug "${doc.slug}" ไม่ตรงกับ planned-laws.json — codeToSlug ชี้ slug ที่ไม่ได้ build → cross-law hover จะแสดง "ยังไม่เปิดให้อ่าน"`;
      console.error(`[FAIL] ${file} (slug "${doc.slug}"): ${msg}`);
      failed.push({ file, slug: doc.slug, errors: [msg] });
    }
  }

  if (check) {
    if (failed.length > 0) {
      console.error(`\n${failed.length} law(s) failed validation — check failed.`);
      process.exitCode = 1;
    }
    return; // check mode never writes
  }

  // --- PASS 2: write ONLY when everything passed ----------------------------
  if (failed.length > 0) {
    console.error(
      `\n${failed.length} law(s) failed — build ABORTED with NO writes (no silent partial state).`,
    );
    process.exitCode = 1;
    return;
  }

  // clean output dir before writing — stale files from failed/renamed laws
  // must be gone first (safe now: nothing failed)
  rmSync(LAWS_OUT_DIR, { recursive: true, force: true });
  mkdirSync(LAWS_OUT_DIR, { recursive: true });

  const indexEntries: IndexEntry[] = [];
  for (const { file, doc } of passing) {
    writeJson(join(LAWS_OUT_DIR, `${doc.slug}.json`), doc);
    indexEntries.push({
      slug: doc.slug,
      code: doc.code,
      titleTh: doc.titleTh,
      subject: doc.subject,
      part: doc.part,
      tags: doc.tags,
      verifiedAt: doc.verifiedAt,
      editionCount: doc.editions.length,
      articleCount: articleCountOf(doc),
      definitionTerms: doc.definitions.map((d) => d.term),
    });
    console.log(
      `[BUILT] ${file} → src/data/lawlib/laws/${doc.slug}.json (${articleCountOf(doc)} มาตรา)`,
    );
  }

  indexEntries.sort((a, b) => a.slug.localeCompare(b.slug));
  writeJson(join(OUT_DIR, 'index.json'), indexEntries);

  const registryLines = indexEntries.map(
    (e) => `  ${JSON.stringify(e.slug)}: () => import('./laws/${e.slug}.json') as Promise<LawDoc>,`,
  );
  // codeToSlug — keyed by the AUTHORED code forms from planned-laws.json +
  // LAW_CODE_ALIASES (what authors write in [[…|code]] refs), NOT by doc.code
  // (full พ.ศ. forms differ). Aliases point at the SAME canonical slug.
  // Unbuilt laws map too — lookups fall through to null at runtime
  // ("ยังไม่เปิดให้อ่าน") until they are built.
  const codeToSlugLines: string[] = [];
  for (const p of planned) {
    if (p.code.length > 0 && p.slug.length > 0) {
      codeToSlugLines.push(`  ${JSON.stringify(p.code)}: ${JSON.stringify(p.slug)},`);
    }
  }
  for (const [code, slug] of Object.entries(LAW_CODE_ALIASES)) {
    codeToSlugLines.push(`  ${JSON.stringify(code)}: ${JSON.stringify(slug)},`);
  }
  const registry = `// AUTO-GENERATED by \`npm run lawlib:build\` — do not edit manually.
import type { LawDoc } from '../../types/lawlib';

// The cast is sound: TS JSON-module inference widens \`kind\` to string, but every
// emitted JSON was zod-validated (validate.ts) before being written.
/** Static-literal lazy loaders only — template-literal imports break webpack. */
export const registry: Record<string, () => Promise<LawDoc>> = {
${registryLines.join('\n')}
};

/** Authored ref code (planned-laws.json \`code\` + LAW_CODE_ALIASES) → registry slug. */
export const codeToSlug: Record<string, string> = {
${codeToSlugLines.join('\n')}
};
`;
  writeFileSync(join(OUT_DIR, 'registry.ts'), registry, 'utf8');
  console.log(`[EMIT] src/data/lawlib/index.json (${indexEntries.length} law(s))`);
  console.log('[EMIT] src/data/lawlib/registry.ts');
}

main();
