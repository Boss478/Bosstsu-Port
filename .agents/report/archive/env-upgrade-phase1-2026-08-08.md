# Env Upgrade Phase 1 — PROGRESS REPORT (T1–T6 complete, stopped before T7)

**Date**: 2026-08-08 | **Branch**: `env-nextjs-16.3.0` | **HEAD**: `54fa6af` (tree deliberately dirty — no commits per instructions; T10 commits)
**Status**: ✅ T1–T6 complete. Approved mongoose fix applied. Awaiting go-ahead for T7 (test suites) — T7/T8 are next (per execution order, no stop conditions pending).

---

## What completed cleanly

| Task | Result |
|---|---|
| **T1 — Node 24 alignment** | ✅ node v24.19.0 (Homebrew keg PATH), `.nvmrc`=24, `@types/node` ^24.0.0 (lock: 24.13.3), `engines.node: >=24.15.0` added, typecheck clean |
| **T2 — Baseline on Node 24** | ✅ typecheck / lint / `npm test` / build / eval **all green** (eval: 34/34 PASS). Report: `.agents/report/env-upgrade-baseline-2026-08-08.md` |
| **T3 — Framework core** | ✅ `npm ls` → next **16.3.0**, eslint-config-next **16.3.0**, sharp **0.35.3** single copy (deduped w/ next's optionalDep). No ERESOLVE. Audit 12→9 (high 7→4) |
| **T4 — Data/security** | ✅ installed (mongoose 9.9.1, isomorphic-dompurify 3.22.0, uuid 14.0.1) — **blocked on typecheck** → resolved by approved generic fix (below) |
| **T5 — Tooling/runtime** | ✅ jsdom 30.0.1 (single copy, deduped), lint-staged 17.3.0, postcss 8.5.26, react/react-dom **~19.2.8** (tilde, user decision). No ERESOLVE. Audit 9→**7** (5 moderate, 2 high) |
| **T6 — Static gates** | ✅ typecheck clean; lint **0 errors, 5 warnings** (new-rule noise — see below) |

## The mongoose 9.9.1 typecheck break → APPROVED FIX (user decision 2026-08-08)

**Failure**: `TS2345` — `Model<Concrete>` not assignable to `Model<unknown>` in 4 files × 2 call sites (gallery/games/portfolio/resources admin actions). Root cause: `src/lib/admin-crud.ts` helper factories typed params as `Model<unknown>`; mongoose 9.9.x tightened the `Model<unknown>` instantiation.

**Fix applied** (generic, exactly 2 lines, nothing else touched — call sites infer `T`):

```diff
- export function createTogglePublished(
-   Model: Model<unknown>,
+ export function createTogglePublished<T>(
+   Model: Model<T>,
   adminPath: string,
   publicPath: string,
 ) {
...
- export function createDeleteItem(Model: Model<unknown>, adminPath: string, publicPath: string) {
+ export function createDeleteItem<T>(Model: Model<T>, adminPath: string, publicPath: string) {
```

**Grep proof** (verified immediately after edit — project gotcha: silent edit drops):

```
$ grep -n "Model<T>" src/lib/admin-crud.ts
32:  Model: Model<T>,
54:export function createDeleteItem<T>(Model: Model<T>, adminPath: string, publicPath: string) {
$ grep -n "Model<unknown>" src/lib/admin-crud.ts   # → no output (zero remaining)
```

`git diff src/lib/admin-crud.ts` shows ONLY the two signature lines changed. `npm run typecheck` after fix: **clean (0 errors)**.

## T5 verification evidence

```
npm ls jsdom            → jsdom@30.0.1 (ONE copy; deduped w/ isomorphic-dompurify + vitest)
npm ls react react-dom  → react@19.2.8 / react-dom@19.2.8 (deduped everywhere incl. next, @tanstack, @testing-library)
npm ls mongoose isomorphic-dompurify uuid → 9.9.1 / 3.22.0 / 14.0.1
npm ls next eslint-config-next sharp      → 16.3.0 / 16.3.0 / 0.35.3 (single copy)
package.json ranges: react/react-dom = "~19.2.8" (tilde confirmed in package.json)
```

Install history: `npm install -D jsdom@^30.0.1 lint-staged@^17.3.0 postcss@^8.5.26` (exit 0) → `npm install react@~19.2.8 react-dom@~19.2.8` (exit 0). No ERESOLVE, no `--force`/`--legacy-peer-deps` used anywhere.

## Audit trajectory

| Stage | Total | Moderate | High | Critical |
|---|---|---|---|---|
| Baseline (T2) | 12 | 5 | 7 | 0 |
| After T3 | 9 | 5 | 4 | 0 |
| **After T5 (current)** | **7** | **5** | **2** | **0** |

**Current findings (`npm audit --omit=dev`, 2026-08-08)**:

| Advisory | Sev | Chain | Status |
|---|---|---|---|
| sharp (3×) | high | — | ✅ cleared by 0.35.3 (T3) |
| uuid | high | — | ✅ cleared by 14.0.1 (T4) |
| next-related | high | — | ✅ cleared by 16.3.0 (T3) |
| dompurify ≤3.4.12 | moderate | isomorphic-dompurify → dompurify 3.4.12 | ⚠️ **NOT cleared** — see flag below |
| brace-expansion 4.0.0–5.0.8 | high | archiver 8.0.0 → readdir-glob | pre-existing chain (archiver not part of this upgrade); non-breaking fix exists |
| fast-uri 3.0.0–3.1.4 | high | yahoo-finance2 → @modelcontextprotocol/sdk → ajv | pre-existing chain — yahoo-finance2 explicitly **out of scope** (intake) |
| hono ≤4.12.33 (4 advisories) | moderate | same yahoo-finance2/MCP chain | out of scope; fix = breaking yahoo-finance2 downgrade (NOT applied) |
| @hono/node-server <2.0.5 | moderate | same yahoo-finance2/MCP chain | out of scope; fix = breaking |

**No new highs/criticals introduced by T3–T5 — strictly downward trend.** The 2 remaining highs are both pre-existing out-of-scope chains (archiver, yahoo-finance2).

### ⚠️ Flag for manager/senior: dompurify CVE not fully cleared

Plan T5 expected "evidence DOMPurify/uuid/sharp CVEs cleared". uuid + sharp cleared; **dompurify 3.4.12 is still flagged** (GHSA-55q2-fjhq-7xh7, moderate). Registry check: **dompurify 3.4.13 exists** and satisfies isomorphic-dompurify 3.22.0's declared range (`^3.4.12`) — the lockfile simply froze 3.4.12 at T4 install time. Clearing requires `npm update dompurify` (lockfile-level, no package.json change) or a direct-dep bump — **NOT done** (outside sanctioned install list; no improvisation). Recommend approving at T8 (which re-records audit anyway).

## T6 evidence

```
$ npm run typecheck   → "typecheck: clean (no errors)"
$ npm run lint        → 5 problems (0 errors, 5 warnings) — exit 0
```

The 5 warnings are all `@next/next/no-location-assign-relative-destination` (new rule shipped in eslint-config-next 16.3.0) on pre-existing `window.location.assign/href` patterns in:

- `src/components/admin/AdminSessionProvider.tsx`
- `src/components/admin/SessionManager.tsx`
- `src/components/tools/MultiStepSessionView.tsx`
- `src/components/tools/StudentSettings.tsx`
- `src/components/tools/ToolSessionView.tsx`

Baseline lint was 0 problems ⇒ these are **new warnings from the sanctioned eslint-config-next upgrade**, not from code changes. T6 AC is "zero new **errors**" — met. Fixing them requires src/ edits (navigation refactors) → **forbidden by intake global rule**; left as-is, flagged for senior review. Options if desired later: (a) accept as known noise, (b) user-approved follow-up refactor ticket.

## Current tree state

- Modified (uncommitted, per instructions): `.nvmrc`, `package.json`, `package-lock.json`, `src/lib/admin-crud.ts` (approved 2-line fix), `.agents/report/env-upgrade-phase1-2026-08-08.md` (+ baseline report from T2)
- Installed (resolved): next 16.3.0, eslint-config-next 16.3.0, sharp 0.35.3, mongoose 9.9.1, isomorphic-dompurify 3.22.0, uuid 14.0.1, jsdom 30.0.1, lint-staged 17.3.0, postcss 8.5.26, react 19.2.8, react-dom 19.2.8
- NOT yet done: T7 (test suites — MongoDB up, ready), T8 (build ×2 + standalone sharp + eval + audit), T9/T9.5/T10
- Rollback per plan §Rollback: `git checkout -- package.json package-lock.json .nvmrc src/lib/admin-crud.ts && npm ci` (uncommitted — clean revert)
