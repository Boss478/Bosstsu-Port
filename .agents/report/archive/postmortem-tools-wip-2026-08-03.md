# Post-mortem: Class Tools WIP review + fix round (process retrospective)

Date: 2026-08-03 · Delivered: **v1.10.87** (`aafc06c`) · Severity: low (no incident — process learnings from a review-gated fix campaign; two fix rounds absorbed by design) · Scope: 18-file uncommitted Class Tools WIP (tools/SSE feature) — 3-agent parallel review → 3-lane fix round → senior gate REJECT → 2-lane fix pass → shipped

## Summary

The 18-file uncommitted tools/SSE WIP was reviewed by **security-reviewer ∥ qa-tester ∥ senior-engineer in parallel on file-disjoint scopes**, with senior synthesis. Verdict: **NOT ship-ready** — 12 MAJORs (8 security + 4 senior) + ~16 MINORs + 2 HIGH test gaps (edit-route + admin-action emissions), 0 CRITICALs. A **3-lane fix round** ran in parallel (A: API hardening · B: UI/hooks · C: TDD tests spec'd against intended behavior). The **senior gate REJECTED the first fix pass (FIX-3)**: 3 BLOCKERs + 1 MAJOR + 2 MINORs — including the masked-index prod divergence and the join-code contract gap. A **2-lane fix pass + 2 micro-fixes** cleared everything: lint 0, tsc 0, **907 vitest** (147 tools-specific), build exit 0. Shipped **v1.10.87** (`aafc06c`, 32 files, **+2010/−219**, pushed). **No deploy** — VPS expired, procurement per ADR-013.

## What worked

1. **3-agent parallel review on disjoint scopes + senior synthesis** — 18 files + 12 MAJOR pins produced in ~1 session; file-disjointness checklist before each spawn is the enabler.
2. **The senior GATE caught what the lanes missed** — the masked-index prod divergence (E11000 risk), the join-code contract gap, the rate-budget shape. The gate paid for itself in one session.
3. **Lane C's TDD tests spec'd against INTENDED behavior** caught the fix lanes' integration — 147 tools tests; the expected-fail list made red-while-lanes-land deliberate, not scary.
4. **Incident recovery**: mid-session `git restore` reverted lane files ×8 — lanes re-applied + grep-verified; senior's incident check confirmed nothing lost.
5. **Same-ms sort tiebreak catch** (`_id:-1` on `createdAt:-1` sort) — a real classroom-vote-rate concern, fixed before it shipped.

## What didn't (lessons)

1. **Cross-lane contract gap (the FIX-3 cost)** — Lane A's join-code API gate landed after Lane B (client) finished → no client sent `code=` → all student reads 400. The gate caught it but it cost a fix round. Future: when lanes touch the same request contract, assign the contract to ONE lane or add a contract-verification step BEFORE the senior gate, not after.
2. **Test/prod index divergence** — `clearAllCollections` never drops indexes; an old same-name non-unique index silently masked the new unique+partial spec (IndexOptionsConflict). **906 green tests gave false confidence against a prod E11000.** Check index specs against the real DB, not just test green.
3. **Rate budget shape** — 10/min tuned for per-(session,IP,token) buckets broke at 50–100 concurrency when keyed per-IP. Budgets must fit the whole classroom per IP (analytics precedent: 600/min).
4. **Flake class: same-ms createdAt ties in shared real Mongo (compose)** — poll ordering test flaked 1/3 runs; vocab-generators flaked 1/3 (unrelated, ticketed). Repeated FULL-suite runs are required to expose these.
5. **Process** — the hook mangles heredocs (use edit/write tools for appends); incident rule added: lanes must never run `git restore`/`checkout` outside their own files.

## Decisions (senior gate, D1–D6)

| # | Finding | Verdict | Disposition |
|---|---|---|---|
| D1 | Step-route rate key | Fixed | B-3 (IP-only key) |
| D2 | `ssr:false` board flash | Accepted | Flash acceptable; no churn |
| D3 | localStorage in updater | Accepted | Idempotent; safe |
| D4 | Whole-list `aria-live` | Accepted | Refinement noted for later |
| D5 | MAJOR-9 static step keys | Accepted | All 6 types keyed |
| D6 | Mascot data in API bundles | Fixed | Id-set |

## Validation

- Review: security 8 MAJOR + 8 MINOR · senior 4 MAJOR + MINORs · qa 35/35 pass but 2 HIGH emission gaps; 0 CRITICALs
- Gate: FIX-3 REJECT → 3 BLOCKER + 1 MAJOR + 2 MINOR → all cleared in pass-2 + 2 micro-fixes
- build: exit 0 · lint: 0 · tsc: 0 · vitest: **907** (147 tools-specific; 906 → 907 net)
- Shipped `aafc06c` — 32 files, +2010/−219, pushed; **NO deploy** (VPS expired — ADR-013)

## Action items

1. **vocab-generators flake** — ticket in todo.md; stabilize before next release (1/3 flake rate is release-blocking material).
2. **`ANALYTICS_SALT` still unset** — required before first VisperHost deploy (S4 guard 500s until set).
3. **VisperHost procurement** (ADR-013) — no prod deploy until provisioned.
4. **Post-deploy watch** — poll-order `_id:-1` tiebreak + SSE invalidation coalescing (≥2s) under real classroom traffic.
