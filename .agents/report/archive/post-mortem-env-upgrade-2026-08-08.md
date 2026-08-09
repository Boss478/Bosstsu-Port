# Post-mortem: Env upgrade v1.12.0 — next 16.3.0 + Node 24 (process retrospective)

Date: 2026-08-08 · Delivered: **v1.12.0** (commit 17c03ab) · Severity: low (no incident — successful major env upgrade; one type break handled by ask-first) · Scope: 10 deps (next 16.2.12→16.3.0, sharp 0.34.5→0.35.3, mongoose 9.8.0→9.9.1, isomorphic-dompurify 3.19→3.22, uuid 13→14, react/react-dom 19.2.3→~19.2.8, jsdom 29→30, lint-staged 17.2→17.3, postcss 8.5.26, @types/node ^20→^24) + Node 20→24 LTS + `agentRules: false`; one src/ change (2-line mongoose `Model<T>` fix, user-approved). No prod deploy (VisperHost pending, ADR-013).

## Summary

Full-stack environment upgrade delivered as v1.12.0 with every gate green: baseline 5/5 · eval 34/34 pass³ · build cold 96s / warm 11.35s · tests 1,314 pass · SSE prod smoke (step event +444ms, ~30s heartbeat, disconnect/reconnect, 9th same-IP connection NOT 429) · Playwright 52/52 + lawlib 9/9 · k6 p95 12.15ms @50 VU vs 20.2ms baseline @100 VU, 0% errors, no pool-3 saturation · audit 12→6 (2 out-of-scope highs remain) · verify 6/6. A/B benchmark vs old commit 54fa6af showed large wins (dev startup −67%, dev idle RSS −73%, prod idle RSS −75%, prod under-load RSS −18%, CWV 0.78→0.81) and one real regression (cold build CPU +68% — mitigated by 11s warm builds).

## What went well

1. **Ask-first on every judgment call** — mongoose type break fix, react tilde pinning, `agentRules: false`, Node 24 runtime choice: all went to the user with evidence, all approved. Zero guessing.
2. **Verify-agnostic gates** — build ×2, full test suite, eval, Playwright, k6, audit, and a live SSE prod smoke (real event timing, not just "it compiles").
3. **A/B benchmark with honest numbers** — measured old vs new on the same machine; the cold-build CPU regression was reported, not hidden.
4. **Minimal src/ surface** — the entire upgrade touched exactly 2 lines of source code (mongoose generic fix).

## What surprised

1. **Mongoose 9.9 type break** — `Model<T>` generic regression surfaced as 2 type errors in `src/lib/admin-crud.ts:32,54`. Fix pattern: explicit generic annotation. Stop → ask → minimal fix.
2. **Docker Desktop holds :3300 even when PAUSED** — paused ≠ stopped for port binding → EADDRINUSE saga. Workaround: `/tmp` config port-override pattern (dev on an alternate port).
3. **Stale app-dev container (next 16.2.9)** — a container from an older release sat on the old toolchain; rebuild status now on the watch-list.
4. **k6 host contamination** — a game tab at 190% CPU skewed a load run; results only count on a quiet host.
5. **Torn-write `.next/dev/types/validator.ts`** — partially written during `next dev` (possible Next 16.3 dev-server bug) — watch after the next dev run.
6. **R1/R4 parallel edits survived a server restart** — uncommitted work persisted across restarts; tree state must be checked via `git status`, not assumed.

## Process improvements

- **Quiet-host gate** — before load testing: close heavy apps/tabs, verify idle CPU; otherwise the numbers measure the wrong thing.
- **Stop-condition discipline** — first type break = stop and ask, not "fix forward" mid-upgrade.
- **/tmp-config pattern** — port overrides via a /tmp config file instead of fighting Docker Desktop.
- **Watch-list discipline** — validator.ts torn write + app-dev rebuild tracked as explicit follow-ups.

## Metrics | Metric | Old (54fa6af) | New (v1.12.0) | Δ |
|--------|--------------|---------------|-----|
| Dev startup | baseline | — | **−67%** |
| Dev idle RSS | baseline | — | **−73%** |
| Prod idle RSS | baseline | — | **−75%** |
| Prod under-load RSS | baseline | — | **−18%** |
| CWV score | 0.78 | 0.81 | **+0.03** |
| Cold build CPU | baseline | — | **+68% (regression)** |
| Warm build | — | 11.35s | mitigates cold build |
| k6 poll p95 | 20.2ms @100 VU | 12.15ms @50 VU | faster, 0% errors |
| Audit | 12 | 6 | 2 out-of-scope highs remain |

## Validation

build clean ×2 (matching outputs) · typecheck/lint clean · eval 34/34 pass³ = 1.00 · tests 1,314 · Playwright 52/52 + lawlib 9/9 · k6 0% errors · SSE prod smoke clean (leak loop clean) · verify 6/6. No prod deploy — VisperHost pending (ADR-013).
