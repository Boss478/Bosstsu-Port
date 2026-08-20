# Report: Perf Campaign T1–T4 (dev→Turbopack, vitest split, lint cache)
**Created:** 2026-08-04 15:09
**Status:** Done (verify gate PASS)

## Plan
- **Version:** 1.11.0 (lockfile synced via `npm install --package-lock-only`)
- **Approach:** Measure (10-loop scrutiny) → implement → senior review → fixes → verify gate. Source: `.agents/plans/perf-dev-test-lint-2026-08-04.md` §7.

## Actions Taken
- T1: `next dev --webpack` → `next dev` (Turbopack, Next 16 default). Boot 334ms, HMR 70ms; e2e 61/61 host; `analyze` → `next experimental-analyze --output` (81s, `.next/diagnostics/analyze`); `@next/bundle-analyzer` removed.
- T2: vitest split — unit config (37 files, parallel, maxWorkers 5) + db config (19 files, serial — shared Mongo); inventory guard in `test` chain. 57s → 34.0s best; 3× green, 0 flakes; game-screen flake fixed (import hoisted). T5 deferred by user.
- T3: `eslint --cache`; `.eslintcache` gitignored. 34.2s cold / 2.3s warm.
- T4: `babel-plugin-react-compiler` KEPT — removal hard-fails dev boot (package IS the compiler engine; "dead dep" premise wrong). `workflow.md` + CSP comment corrected; app-dev mem 1024M→1536M.

## Files Modified
- `package.json`/lock (scripts, dep removal, version sync) · `next.config.ts` · `vitest.unit.config.ts` + `vitest.db.config.ts` + `scripts/check-test-inventory.ts` (new) · `tests/unit/phonics/game-screen.test.tsx` · `docker-compose.yml` · `.gitignore` · `.agents/reference/workflow.md` (untracked)
- Commits: `26a5584`, `0ab9213` (changelog already updated)

## Decisions Made
- Keep babel-plugin-react-compiler (evidence over premise) · T5 deferred (import cost) · maxWorkers 5 · no deploy (ADR-013)

## Verification Results
- Build: passed (61.9s wall) · Lint: 0 errors, warm 2.3s · Typecheck: clean · Tests: 3× green (unit 19.2s + db 11.8s best) · Eval: green · Manual: routes 200, e2e 61/61
- snip token savings (2026-08-04): 5.4M tokens saved (97.4%); lifetime 34.3M (95.3% Elite)

## Next Steps
- T5 import tuning when wanted · monitor Turbopack dev memory at 1536M · post-mortem: `.agents/post-mortem/post-mortem-Aug_04_2026-perf-campaign.md`
