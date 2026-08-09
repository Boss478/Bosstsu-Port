# Task Report — unit-inventory fix (krulaw→lawlib) — 2026-08-04

**Branch:** `lane-fix-unit-inventory` (commit `aedd039`, based on `main` `61ddf0b`) — NOT pushed.

## Diff summary (commit aedd039)

```
 rename tests/unit/{krulaw => lawlib}/reader-settings.test.ts (100%)
 rename tests/unit/{krulaw => lawlib}/reading-dock.test.tsx    (100%)
 rename tests/unit/{krulaw => lawlib}/theme-provider.test.tsx  (100%)
 vitest.unit.config.ts | 3 ++-  (comment 37→38 files; +'tests/unit/lawlib/reading-dock.test.tsx' entry)
```
Pure `git mv` renames (100% similarity — zero content change) + the minimal
config edit. The eval doc fix (below) is disk-only: `.agents/` is gitignored
(.gitignore:68), so it cannot be committed — consistent with the report path
being gitignored too.

## Verification

### check-test-inventory (exit 0)
```
Test inventory check — tests/**/*.test.{ts,tsx}
  globbed            : 57
  unit include       : 38
  db include         : 19
  union == globs     : OK (57 == 57)
Inventory is exact — every test file runs exactly once.
```

### Official `npm test` (all green, run twice — see Surprises #2)
```
test:unit:  Test Files  38 passed (38) | Tests  872 passed (872) | Duration 24.79s
test:db:    Test Files  19 passed (19) | Tests  234 passed (234) | Duration 12.37s
```
**Totals: 872 + 234 = 1106 tests** — exactly the historical healthy count.
**Delta vs broken HEAD: +34** (reader-settings 15 + theme-provider 15 +
reading-dock 4) — confirms all three files were silently excluded before:
broken state ran 35 unit files / 838 tests = 1072 total. 1102 → 1106 per the
in-flight changelog entry (dock suite) is consistent with this.

### Hygiene
- `npm run typecheck` — clean
- `npm run lint` — clean
- Eval `run-evals.sh lawlib`: 14 passed / 1 failed — the 1 failure is a
  pre-existing harness quirk, not caused by this change (see Surprises #4).

## Stale-ref fixes (Step 4)

- `grep -rn -i krulaw tests/unit/lawlib/` → **zero matches**. The rename
  commit ee88102/1bdafbc had already swept reader-settings + theme-provider
  in place, and reading-dock.test.tsx (added pre-rename) already imports the
  lawlib equivalents (`@/app/(website)/lawlib/[slug]/LawlibReaderClient`,
  `@/types/lawlib`, `@/data/lawlib/laws/sample.json`) — all resolve on disk.
  No test-content edits were needed. No legacy storage-key tests exist.
- `.agents/evals/lawlib.md` (senior MINOR): `## EVAL: krulaw` → `## EVAL:
  lawlib`; `@/lib/krulaw/*` → `@/lib/lawlib/*`; `krulaw:build` → `lawlib:build`;
  regression rows `tests/krulaw` → `tests/lawlib`, `src/data/krulaw/` →
  `src/data/lawlib/` (verified on disk); grader commands `run-evals.sh
  krulaw` → `run-evals.sh lawlib` (mirrors actual script invocation).
  Deliberately KEPT: env var `KRULAW_FIXTURE` (run-evals.sh still reads/sets
  that exact name — renaming in the doc alone would lie; added a note).
  Noted the missing package.json `eval` alias (pre-existing gap, not added —
  out of scope).

## Surprises / notes

1. **`main` was NOT at 97c59ef.** Task said "branch from current main HEAD =
   97c59ef"; actual `main` HEAD is `61ddf0b` — `97c59ef` is the tip of
   `lane-fix-warm-yellow` (another agent's branch). The bug exists on main
   too (rename landed via 1bdafbc). Followed the explicit procedure
   (checkout main → branch); based on `61ddf0b`. If the parent expected the
   fix layered on `97c59ef`, rebase/cherry-pick is trivial (theme commit
   touches unrelated files).
2. **First `npm test` run failed on the DB suite** — `MongooseServerSelectionError:
   connect ECONNREFUSED ::1:27017, connect ECONNREFUSED 127.0.0.1:27017` (all
   19 DB files, 6 passed/228 skipped). Cause: the `boss478` docker-compose
   stack (mongo container) was down at that moment; it restarted ~30s later
   (another agent brought the stack up). Re-ran `npm test` → all green.
   Unit suite (the part this fix affects) passed 38/38 on BOTH runs.
3. **`changelog.md` modified in the shared tree by another agent** (their
   reading-redesign entry, which already documents this very fix's outcome:
   "unit dir realigned to `tests/unit/lawlib/` + dock added to `unitInclude`").
   Left unstaged, excluded from my commit. Also confirms the 1102→1106 count
   narrative.
4. **`run-evals.sh lawlib` regression step `[FAIL] tests: tests/lawlib`** —
   pre-existing quirk: `eval_tests` runs `npm test -- tests/lawlib`, and npm
   appends the positional filter only to the LAST script in the `&&` chain
   (`test:db tests/lawlib`), which matches nothing in the db config → vitest
   exits 1. Unrelated to this change (at broken HEAD the same step failed
   even earlier at check-inventory). Out of scope (run-evals.sh untouched);
   flagging for senior — either eval_tests should run `vitest run <pattern>`
   with the unit config, or the regression row's command in lawlib.md should
   change.
5. **`.agents/` is gitignored** — the eval md fix and this report are
   disk-only; they will not appear in git history. (If the parent wants the
   eval md tracked, that's a separate decision — needs a .gitignore change.)
6. Self-caused hiccup (resolved): two parallel edits to the same file in one
   batch raced and one was lost; re-applied serially. No lasting impact.

## Files touched

- `tests/unit/krulaw/{reader-settings.test.ts,reading-dock.test.tsx,theme-provider.test.tsx}` → `tests/unit/lawlib/` (git mv, no content change)
- `vitest.unit.config.ts` — +reading-dock entry, comment 37→38
- `.agents/evals/lawlib.md` — krulaw→lawlib throughout (disk-only, gitignored)

## For senior review

- #1 (base commit discrepancy) — confirm 61dbf0b-based is acceptable, or ask
  for rebase onto 97c59ef.
- #4 (eval_tests filter quirk) — decide whether to fix run-evals.sh or amend
  the regression row.
- #5 (gitignored .agents/) — eval doc fix is untracked by design.
