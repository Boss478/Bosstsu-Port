# Senior Engineer Review: Wave 3 boundary re-check (LawLib rename + swept fixes)

Date: 2026-08-04 · HEAD: 61ddf0b (merge-cleanup) · Verdict: **BLOCK**

## BLOCKER

**1. `npm test` fails at HEAD — 3 unit files (incl. the 4 new dock tests) silently dropped from the runnable suite.**

Evidence (ran myself, read-only):
- `npx tsx scripts/check-test-inventory.ts` → exit 1, 5 errors:
  - NOT LISTED: `tests/unit/krulaw/{reader-settings.test.ts, reading-dock.test.tsx, theme-provider.test.tsx}`
  - MISSING: `tests/unit/lawlib/{reader-settings.test.ts, theme-provider.test.tsx}`
- Root cause: ee88102 renamed the **config entries** (`vitest.unit.config.ts:34-35`, krulaw→lawlib) but **never moved the files** — `git ls-tree` of ee88102/1bdafbc/HEAD all show the files still at `tests/unit/krulaw/`. `reading-dock.test.tsx` was additionally never added to the include list at all (7aa3c37 ran it via explicit path — see `.agents/report/lane-d-fixes-2026-08-04.md:45`).
- Impact: release gate `npm test` hard-fails; snip the claimed "1106/1106 green" is NOT reproducible at HEAD via `npm test`; snip the 4 dock tests + 30 reader/theme tests never execute in the suite.

**Fix (align disk with config — matches rename intent):**
1. `git mv tests/unit/krulaw tests/unit/lawlib` (moves all 3 files)
2. Add `'tests/unit/lawlib/reading-dock.test.tsx'` to `unitInclude` in `vitest.unit.config.ts` (after line 35); snip bump the "(37 files)" comment
3. Verify: `npx tsx scripts/check-test-inventory.ts` → exact; snip then full `npm test` → expect 1106+ green

## MINOR

**2. `.agents/evals/lawlib.md` content is stale post-rename.** Heading `## EVAL: krulaw`; snip body references `@/lib/krulaw/*`, `krulaw:build`, `tests/krulaw`, `src/data/krulaw/…`, `./run-evals.sh krulaw`, `npm run eval -- krulaw`. The harness itself is fully renamed and functional (`run-evals.sh lawlib` — all `@/lib/lawlib` imports, `eval_tests "tests/lawlib"`), so this is doc-only. Separately: package.json has **no `eval` script** (pre-existing since 1ad2c95; snip the doc itself notes "when the package.json eval alias is restored") — `npm run eval -- lawlib` FAILS; snip the runnable command is `./.agents/evals/run-evals.sh lawlib`. Fix: update the doc (heading, paths, commands, alias gap note) in the same pass.

## NIT

**3. `KRULAW_FIXTURE` env-var name** in `run-evals.sh` (~lines 131-166) — internal-only, works; snip rename to `LAWLIB_FIXTURE` if touching the file anyway.

## Flake assessment: ticket (b), proceed — do NOT chase now

- `tests/vocab-generators.test.ts`: pure-function tests, per-test inline data, no module-level state/mocks/timers (grep-verified) — not a pollution source.
- `tests/unit/krulaw/reading-dock.test.tsx`: clean — `beforeEach` installs fresh localStorage Map stub + matchMedia + IntersectionObserver and resets `document` classes; snip `afterEach vi.unstubAllGlobals()`; snip only module-level `vi.mock('next/link')` (file-isolated). vitest default `isolate: true` + `fileParallelism: true`/`maxWorkers: 5` → no cross-file leakage possible.
- Single un-captured failure under full-suite load matches the documented CPU-contention flake class (config comment: game-screen hookTimeout, fixed by maxWorkers:5); snip suite just grew by 4 jsdom-heavy dock tests.
- Action: after BLOCKER fix, re-run full `npm test`; snip if vocab-generators flakes again, ticket with run context + quarantine — do not block release.

## Verified clean (what looks good)

- **Rename completeness**: zero krulaw identifiers in `src/`, `content/`, `scripts/`, `tests/` (content). Routes `(website)/lawlib/{[slug], digest, page}` + layout/print.css/clients all present; snip `nav-links.ts` `/lawlib`; snip `sitemap.ts` `/lawlib`, `/lawlib/digest`, `/lawlib/[slug]` reading `src/data/lawlib/index.json`. No dangling imports (typecheck re-run: exit 0).
- **Merge-cleanup 61ddf0b**: Header mobile button `theme === 'read' ? () => setTheme('light') : toggleTheme` — correct; snip `setTheme` in scope (Header.tsx:16); snip `themeAria` honest (announces next state, :22-26); snip desktop (:200-201) and mobile (:232-233) rows identical; snip nav hidden on `/lawlib/*` (:66).
- **Swept fixes coherent**: globals.css `.read` overrides scoped to `.lawlib-*`/`[data-lawlib-body]`/sarabun wrapper; snip #7a6845 contrast fix landed with doc comment (4.71–5.00:1, :1473-1496); snip dock clearance `bottom-32` + `pb-16` in LawlibReaderClient (:271, :1061); snip SettingsMenu imports shared `Segment` from ReadingSettings (single export, ReadingSettings.tsx:45 — no duplicate); snip AdminSidebar 3-mode label `โหมดอ่าน` (:129-130); snip phonics SettingsScreen honest label `'Reading Mode'` vs `'Dark Theme'` (:215).
- **Warm-yellow CSS (working tree, concurrent)**: `#f9ecc0`/`#fdf5cf` — eyeballed, slightly darker than prior tones → higher contrast with paper ink; snip consistent with the ≥4.5 claim. No action.

## What to do (ordered)

1. (BLOCKER) `git mv tests/unit/krulaw tests/unit/lawlib` + add `tests/unit/lawlib/reading-dock.test.tsx` to `vitest.unit.config.ts` unitInclude + re-verify inventory + full `npm test`.
2. (MINOR) Update `.agents/evals/lawlib.md` content to lawlib paths/commands; snip note the missing `eval` npm alias (runnable: `./.agents/evals/run-evals.sh lawlib`).
3. (NIT, optional) Rename `KRULAW_FIXTURE` → `LAWLIB_FIXTURE` in run-evals.sh while editing.
4. (Flake) Ticket the vocab-generators 1105/1106 observation; snip re-observe in the post-fix full run; snip quarantine only on repeat.
