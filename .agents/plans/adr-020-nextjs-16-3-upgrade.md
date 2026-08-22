# ADR-020 — Upgrade Next.js to 16.3.0

- **Status**: Proposed (pending user approval — "CHOOSE UPGRADE")
- **Date**: 2026-08-08
- **Decision maker**: user (approval pending)
- **Related**: ADR-013 (hosting), `.agents/plans/next-16-3-upgrade-assessment-2026-08-08.md` (research), `.agents/plans/next-16-3-upgrade-plan-2026-08-08.md` (execution)

## Context
Project runs `next ^16.2.9` (16.2.12 installed), React 19.2.3 pinned, eslint-config-next ^16.2.9. Next.js 16.3.0 released 2026-08-03 (marked Latest; 16.3.1-canary in progress). Upgrade is a single minor bump; all headline features are opt-in ("zero changes to application code" for existing apps); Node ≥20.9 / TS ≥5.1 / React 19.x requirements satisfied (Node 20 dockerfile, TS ^5).

## Decision
Adopt `next@^16.3.0` + `eslint-config-next@^16.3.0` lockstep, keeping `react`/`react-dom` pinned at 19.2.3 and TS at ^5 (TS7 crashes 16.3 builds — #95400). Caret range auto-picks 16.3.1 stable when released.

## Rationale
1. **Dev**: memory eviction default-on (−90% RAM, community-verified 20GB→5GB); route-handler HMR; `.next/dev/lock`; browser errors → terminal.
2. **Build**: Turbopack filesystem build cache default-on (1.4–5.5× repeat builds — local win; Docker needs cache mount or accept wasted I/O).
3. **Runtime/VPS**: native Node.js streams → +22% SSR throughput under load (fits 50–100 concurrency envelope); vendored lodash **CVE-2025-13465** fixed; `next start` boots faster.
4. **Risk check**: our top risk (turbopackIgnore markers in `upload.ts`) was a real 16.3-preview bug (#95125) **fixed in 16.3.0 stable** (PR #95144); the one serious stable regression (#96650, Vercel bytecode crash) does not affect Docker standalone self-hosting.

## Alternatives rejected
- **Wait for 16.3.1 stable**: canary line active; but 16.3.0's regressions don't touch our platform and caret range absorbs 16.3.1 automatically. No blocking reason to wait.
- **Stay on 16.2.12**: loses CVE fix + dev/build/runtime wins; not justified.

## Consequences
- **Positive**: memory/throughput wins, security patch, faster builds/dev.
- **Negative/risks**: SSE/streams internals changed (re-test mandatory); standalone tracing internals changed (markers must be re-verified); AGENTS.md may be auto-mutated by `next dev` (agentRules default) — decide allow-vs-opt-out; Docker builds write an unread cache unless BuildKit mount added.
- **Required validations**: standalone trace of sharp/heic deps, SSE e2e, real-file upload, middleware redirects, images, docker container smoke, eval + unit + db suites (plan steps 4–8).
- **Deferred**: VPS validation until VisperHost provisioned (ADR-013); 16.3.1 watch item.

## Notes
- Remove dead `experimental.proxyClientMaxBodySize` (next.config.ts:15, no proxy.ts) during this change.
- 16.3.0 has a Vercel-only production crash (#96650) — evidence to keep test-before-prod discipline.
