# Env Upgrade T9b — lawlib-reader e2e gate: PASSED

**Date:** 2026-08-08 · **Branch:** `env-nextjs-16.3.0` · **Gate:** lawlib-reader e2e (react 19.2.8 + next 16.3.0)

## Result: PASSED — 9/9 tests green (47.3s)

```
Running 9 tests using 1 worker
  ✓ 1 [chromium] › lawlib-reader.spec.ts:113 › reader defaults
  ✓ 2 [chromium] › lawlib-reader.spec.ts:131 › mobile 375px
  ✓ 3 [chromium] › lawlib-reader.spec.ts:186 › digest-ref
  ✓ 4 [chromium] › lawlib-reader.spec.ts:214 › digest-ref (variants)
  ✓ 5 [chromium] › lawlib-reader.spec.ts:261 › repealed article
  ✓ 6 [chromium] › lawlib-reader.spec.ts:292 › prose range
  ✓ 7 [chromium] › lawlib-reader.spec.ts:307 › cross-law ref
  ✓ 8 [chromium] › lawlib-reader.spec.ts:321 › digest-ref (more)
  ✓ 9 [chromium] › lawlib-reader.spec.ts:342 › dock is directory
9 passed (47.3s)
```

Exit code 0. Playwright's webServer booted `next dev -p 3305` (node v24.19.0 keg PATH) and cleaned it up after the run (port 3305 released, verified via lsof). One informational note: webServer logged the Next middleware→proxy deprecation warning — non-fatal, not part of the gate.

## Prior attempt (blocked) → resolution

First attempt (earlier today) failed at webServer boot: a wedged 14:27 `next dev -p 3300` process tree (PIDs 97233/97266/97267) held Next 16's per-project dev-lock (`.next/dev/lock`), refusing ANY second dev server in the same project directory regardless of port. The 3300 bind had collided with Docker Desktop's listener on `*:3300`.

**Resolution (manager):** killed the wedged tree; `.next/dev/lock` removed. Re-run verified: no next dev processes besides the prod server, port 3305 free.

## /tmp config approach (no repo changes)

`/tmp/env-upgrade-lawlib.config.ts` — imports the repo's real `playwright.config.ts` and overrides only:
- `testDir` → absolute repo path (`tests/e2e`)
- `use.baseURL` → `http://localhost:3305`
- `webServer.command` → `export PATH="/opt/homebrew/opt/node@24/bin:$PATH" && cd <repo> && npx next dev -p 3305`
- `webServer.url` → `http://localhost:3305` (`reuseExistingServer: true` kept from base)
- `reporter` html `outputFolder` → `/tmp/env-upgrade-playwright-report` (absolute, artifacts kept out of the repo)

Browser/projects/workers/timeouts/retries inherited from the real config. Node v24.19.0 + Playwright 1.62.0 confirmed before the run.

## agentRules re-verification

- `git status --short` after the run shows **only the branch's pre-existing modifications** — `.nvmrc`, `next.config.ts`, `package-lock.json`, `package.json`, `src/lib/admin-crud.ts`. **No AGENTS.md / CLAUDE.md mutation.**
- `next.config.ts` line 10: `agentRules: false, // Prevent next dev 16.3 auto-upsert of AGENTS.md/CLAUDE.md blocks (user decision 2026-08-08)` — confirmed in place before the run.
- No new files/artifacts in the repo (`.next` is gitignored; report artifacts in /tmp).

## Environment notes

- Prod smoke server on `:3301` (PID 96298) — running, untouched.
- Port 3300 remains Docker Desktop's (`com.docke` listener) — untouched; the 3305 override worked as designed.
- No commits, no src/ changes made.
