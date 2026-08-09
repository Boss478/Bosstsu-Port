# R1 — Lint-Cleanup Refactor (window.location → router.push): Review Report

- **Date**: 2026-08-08
- **Branch**: `env-nextjs-16.3.0` (base: `17c03ab` Release v1.12.0)
- **Rule**: `@next/next/no-location-assign-relative-destination` (eslint-config-next 16.3.0, enabled as `warn` — verified present in installed plugin)
- **Status**: ✅ **COMPLETED (RETRY 2026-08-08) — commit `64e4bc8`, all gates green.**

---

## Step 4 — Final Verification (RETRY after env fix)

Environment blocker resolved by manager: Docker VM disk was full (Mongo ENOSPC crash-loop) → 2.15GB dangling volumes pruned → `boss478-mongo-1` restarted. Verified `docker ps`: **`Up About a minute (healthy)`** before the run. Also removed a stale `.next/dev/lock` (dead PID 62985, same pattern as t9b) so Playwright's webServer could boot.

### `npm test` (check-inventory + unit + db) — ✅ PASSED

```
Test Files  44 passed (44)   [unit] 1080 tests passed
Test Files  19 passed (19)   [db]   234 tests passed   ← data-integrity proof post-crash
Duration    40.32s + 24.75s  · exit code 0
```

All 19 DB-touching suites green — the ECONNRESET failure class from Step 2 is fully resolved. (Only informational: pre-existing Mongoose `findOneAndUpdate new option` deprecation warnings in stderr.)

### Playwright e2e (port-3305 override) — ✅ PASSED

Config `/tmp/env-upgrade-r1.config.ts` (same recipe as t9b: imports repo `playwright.config.ts`, overrides `baseURL`/`webServer` to 3305, absolute report dir `/tmp/env-upgrade-r1-playwright-report`; run with `NODE_PATH=<repo>/node_modules` so the /tmp config can resolve `@playwright/test`).

```
3 spec files: class-tools + admin-auth + tanstack-query
  42 passed (1.2m) · exit code 0
```

webServer booted `next dev -p 3305` (node v24.19.0 keg PATH), cleaned up after run (no process left; stale `.next/dev/lock` it left behind was removed, PID confirmed dead). Known informational warnings only: middleware→proxy deprecation + smooth-scroll notice.

### `npm run build` — ✅ PASSED (exit 0)

Full route table emitted, no errors. Known informational: middleware→proxy deprecation warning (non-fatal, same as t9b).

### `npm run lint` — ✅ PASSED (`lint: clean (no problems)`)

Confirms the `eslint-disable-next-line @next/next/no-location-assign-relative-destination` directive in `AdminSessionProvider.tsx` is valid and used (no unused-directive noise).

### Commit — ✅ `64e4bc8`

```
refactor: window.location internal navs → router.push (lint-cleanup, 5 sites)
 5 files changed, 36 insertions(+), 8 deletions(-)
```

Committed exactly: `src/components/tools/ToolSessionView.tsx`, `src/components/tools/MultiStepSessionView.tsx`, `src/components/tools/StudentSettings.tsx`, `src/components/admin/SessionManager.tsx`, `src/components/admin/AdminSessionProvider.tsx`.

### Post-commit tree — ✅ CLEAN

`git status --short --untracked-files=all` → **empty**. Note: `dockerfile.dev` (R4's) was already committed in `d1408c6` ("infra: app-dev Docker image → node 24") on this branch, so nothing beyond the 5 files was ever staged — tree is fully clean after the commit.

---

## Step 1 — Review of the interrupted work

### Per-site decision table

| # | File | Old code | New code | Choice | Reason (verified) | Verdict |
|---|------|----------|----------|--------|-------------------|---------|
| 1 | `src/components/tools/ToolSessionView.tsx` | `window.location.assign('/study')` (SSE `onKicked`, name-confirmed path) | `setForceTier(undefined)` + `setCustomConfig(undefined)` + `router.push('/study')` | Soft nav + explicit tier reset | A hard reload used to wipe root-mounted device-tier overrides; the soft nav preserves `/study` state machine (same route, no server fetch needed — `/study` is client-driven) so the reset is required to keep behavior identical. Comment documents this. | ✅ Correct |
| 2 | `src/components/tools/MultiStepSessionView.tsx` | `window.location.assign('/study')` (SSE `onKicked`) | Same reset + `router.push('/study')` | Soft nav + explicit tier reset | Same rationale as #1. | ✅ Correct |
| 3 | `src/components/tools/StudentSettings.tsx` | `window.location.href = '/study'` (Leave classroom button) | Reset + `router.push('/study')` | Soft nav + explicit tier reset | Same rationale. Comment: "a hard reload used to wipe them on leaving the classroom." | ✅ Correct |
| 4 | `src/components/admin/SessionManager.tsx` | `window.location.href = '/admin/tools'` (after `endSession`) | `router.push('/admin/tools')` | Soft nav (no disable) | **Checked the same-route no-op hazard**: `SessionManager` renders on the session **detail** page (`SessionDetailShell`), and `/admin/tools/page.tsx` is a `force-dynamic` **server component** that re-fetches sessions server-side. Cross-route soft nav → fresh RSC render → ended session correctly drops from the list. Behavior preserved. | ✅ Correct |
| 5 | `src/components/admin/AdminSessionProvider.tsx` | `window.location.assign('/admin/login')` (auth-failure redirect) | **Kept** hard reload + `eslint-disable-next-line @next/next/no-location-assign-relative-destination` | Documented hard reload | Legit hard-reload semantics: must wipe root-mounted admin state (`isUploading`/`isAFK`/`isLoggingOut`), React Query cache and in-memory token holders that survive a soft push under the shared `/admin` layout, and let middleware re-evaluate the invalid session cookie server-side. Rule name verified to exist (`@next/eslint-plugin-next/dist/rules/no-location-assign-relative-destination.js`). | ✅ Correct |

### Review findings

- **No wrong choices found** — all 5 sites picked the right mechanism for their semantics. The interrupted work is sound; no fixes were needed.
- **Hook ordering**: in #1/#2, `useDeviceTier()` was moved above the `useSSE(...)` call (its callback now closes over `setForceTier`/`setCustomConfig`). Hook call order is unchanged (same unconditional hooks, just relocated) — no conditional-hook risk.
- **Diff hygiene**: `git status` shows exactly the 5 component files + `dockerfile.dev` (R4's, untouched, left out of any commit). No stray edits, no debug logs, no dead imports.
- **Project-wide gates (DB-free)**: `npm run lint` → clean (no problems); `npm run typecheck` → clean (no errors); eslint on the 5 files → clean. Disable directive is used (rule fires only on that site), no unused-directive noise.

---

## Step 2 — Tests: ⛔ FAILED (environment, not code)

### `npm test` (vitest: check-inventory + unit + db)

```
Test Files  19 failed (19)
Tests       6 passed | 228 skipped (234)
Duration    170.25s
```

- **All 19 DB-touching suites fail** at `mongoose.connect()` in `tests/helpers/db.ts:14` — *before any test logic runs* — with `MongooseServerSelectionError: read ECONNRESET` (handshake reset, labels: `HandshakeError`, `SystemOverloadedError`, `RetryableError`, `ResetPool`).
- The 6 passing tests are pure-unit tests with no Mongo dependency.
- **None of the failing suites import any of the 5 modified components** — failures cannot be a code regression.

### Root cause (environment): Docker MongoDB is crash-looping — disk full

- `docker ps`: `boss478-mongo-1` → **`Restarting (133) 3 seconds ago`** (crash loop). Port 27017 is held by Docker's port proxy (`com.docke`), so `nc` succeeds while the container has no live mongod → ECONNRESET on every handshake.
- Container logs (last boot):
  - `E | WiredTiger: __posix_file_write: pwrite: failed to write 128 bytes at offset 0 — "No space left on device" (error 28)`
  - `E | __log_fs_write: fatal log failure — "No space left on device"`
  - `E | WT_PANIC: WiredTiger library panic — the process must exit and restart`
  - `F | Fatal assertion (wiredtiger_util.cpp:644) → aborting after fassert() → Got signal: 6 (Aborted)`
- Also observed: `Detected unclean shutdown - Lock file is not empty` + `Recovering data from the last clean checkpoint` (consequence of the crash).
- **Fix needed (devops/manager scope, NOT applied here):** free disk space on the Docker volume (e.g., prune unused images/volumes/build cache, check `/var/lib/docker` / Docker Desktop VM disk usage), then `docker compose restart boss478-mongo-1`.

### Playwright — NOT run (stop condition)

Per task stop conditions ("any test failure = STOP + report, no improvisation"), Playwright was **not** executed: the `class-tools` / `admin-auth` / `tanstack-query` specs all exercise flows backed by MongoDB (sessions, admin users, query cache seeding), which is down. Running them now would produce guaranteed false negatives and waste the 3305 override cycle. They should run after the DB is healthy (same override recipe as `env-upgrade-t9b-lawlib-2026-08-08.md`: dev on 3305, `use.baseURL` + `webServer.command` in the tmp config).

---

## Step 3 — Commit: ⛔ NOT performed (blocked)

The commit (`refactor: window.location internal navs → router.push (lint-cleanup, 5 sites)`) is staged-ready but **must wait** until the test gate passes: the 5 files are uncommitted on the branch, `dockerfile.dev` remains untouched/outside scope. Working tree is unchanged from this review.

---

## Recommendation for next steps

1. Free disk space for the Docker MongoDB volume (prune Docker, check VM disk), verify container exits crash loop (`docker ps` shows `Up`).
2. Re-run `npm test` → expect 19/19 suites green (6 unit + all DB suites).
3. Re-run Playwright specs `class-tools` + `admin-auth` + `tanstack-query` on the 3305 override.
4. Commit the 5 files (exact message from the plan), then run `npm run build` as final gate.
