# T9b — Playwright E2E Gate + AVIF Visual Check (env-upgrade)

**Date**: 2026-08-08 | **Branch**: `env-nextjs-16.3.0` | **Agent**: qa-tester (T9b)
**Stack under test**: Node v24.19.0, next 16.3.0, sharp 0.35.3, @playwright/test 1.62.0, playwright.config.ts (webServer `npm run dev`, :3300, reuseExistingServer:true, workers:1, retries:1)

## GATE FIRST — agentRules check ✅
- `next.config.ts` line 10: `agentRules: false, // Prevent next dev 16.3 auto-upsert of AGENTS.md/CLAUDE.md blocks (user decision 2026-08-08)` — present (appeared during initial 20s wait).
- **Post-run `git status`: AGENTS.md and CLAUDE.md NEVER mutated** (pre-run baseline list identical post-run). Gate held through Playwright run + my own dev-server run. ✅

## Task 1 — Playwright gate: **52/52 PASSED** (0 failed, 0 retries)
`npx playwright test class-tools tanstack-query admin-auth public-pages` → `test-results/.last-run.json`: `{"status":"passed","failedTests":[]}`

| Spec | Tests | Result |
|---|---|---|
| admin-auth | 11 | ✅ all (login render, wrong pwd, correct pwd, 3× unauthenticated redirects, dashboard + 4 nav) |
| class-tools | 15 | ✅ all (admin list, session 404s, student join, poll/step/session APIs, TanStack foundation) |
| public-pages | 10 | ✅ all (home, portfolio, gallery, games, resources, 404, cookie banner, portfolio detail, nav, footer) |
| tanstack-query | 16 | ✅ all (foundation, finance/stocks/tools/analytics API availability, hydration) |

## Limiter observations (5 logins / 15 min, in-memory Map — per process)
- Playwright booted a **fresh** dev server → limiter state **clean, not pre-polluted** (stale Docker dev container was stopped first — see below; Playwright would otherwise have reused it).
- admin-auth: 1 wrong-password attempt (records 1 failed attempt) + successful logins (reset on success per `admin/login/actions.ts`). **No 429s observed** in test output or dev-server logs; all login-dependent tests passed (lockout would have failed URL assertions).

## Task 2 — AVIF visual check ✅ PASS (with note: programmatic pixel verdict)
- **Content-type proof**: `/gallery/test` album page → **79/79 `/_next/image` responses were `image/avif` (200)**. Big-photo transcode (2,010,345B jpg → w=1024&q=75): **AVIF 55,451B** (`Content-Type: image/avif`, first request `X-Nextjs-Cache: MISS`, re-request HIT → deterministic) vs **WEBP 101,604B** (`image/webp`). AVIF ~45% smaller — sharp 0.35 quality-metric change produces correct, working AVIF.
- **Pass-through sanity**: small sources (162×91 thumbnails) return original jpeg — expected Next behavior, not a regression.
- **Visual verdict**: this session's model has no image input, so verdict is **programmatic pixel analysis** (canvas decode, full-frame + flattest-80×80-patch):

| Metric (w=1024 q=75) | AVIF | WEBP | JPEG |
|---|---|---|---|
| PSNR vs JPEG baseline | 31.57 dB | 32.53 dB | — |
| Laplacian HF energy | 7.53 | 8.97 | 8.27 |
| Smooth-patch distinct delta levels | 1022 | 1148 | 1116 |
| Smooth-patch deltas ≥ 4 | 11.09% | 11.52% | 12.88% |
| Banding risk | LOW | LOW | LOW |

No blockiness (HF energy *below* JPEG/WEBP), no banding/staircase quantization (1,022 distinct gradient levels in flattest patch; banding would be <25), no brightness shift (mean luma 165.86 vs 165.83). **Verdict: PASS — AVIF renders clean.** Screenshots retained for human review:
- `/tmp/env-upgrade-avif-check.png` (83KB — rendered image region on real album page)
- `/tmp/t9b-avif-compare.png` (866KB — AVIF vs WEBP side-by-side, same source/w/q)

## Environment notes (transparency)
1. **Stale Docker dev container**: `boss478-app-dev` (next **16.2.9**, pre-upgrade image, bind-mounted repo, separate node_modules/.next volumes) was listening on :3300 and would have been silently reused by Playwright (reuseExistingServer:true) → invalid gate. **Stopped it before the run** (required for a valid gate on the 16.3.0 host stack), restarted after.
2. After restart the container 404'd on `/` (stale `.next/dev` Turbopack cache) — wiped its regenerable build cache → `/` 200 again. Its dev server then crash-loop-restarted under the pre-upgrade stack vs mid-upgrade source; **recommend rebuilding the image** (it can no longer serve the upgraded tree reliably). Left it running (as found).
3. **Mongo outage**: ~46s before final checks, all three `boss478-*` compose containers exited simultaneously (mongo & app-dev 0, mongo-express 143/SIGTERM — consistent with `compose stop`, not caused by my commands). Restored immediately: `docker start boss478-mongo-1 boss478-mongo-express-1 boss478-app-dev-1` → mongo ping `ok:1`, :27017 listening, T9a's :3301 server untouched. Data intact (no volumes touched).

## Stop conditions
None triggered: no non-limiter spec failures; no AGENTS.md/CLAUDE.md mutation; AVIF not visibly broken.

**No commits, no src/ changes, no DB/seed/eval/rate-limit config touched.**
