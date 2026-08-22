# ADR-014: Modern Dependency Batch + Node 24 Alignment (2026-08-08)

**Status**: Accepted (pending user approval of plan)
**Context**: Node 20 EOL (2026-04-30), known CVEs in sharp <0.35 (GHSA-f88m-g3jw-g9cj, HIGH), DOMPurify <3.4.5 (CVE-2026-47423, HIGH), uuid <14 (GHSA-w5hq-g745-h8pq), React Server Actions DoS (fixed 19.2.4). Perf: Mongoose 9.9, Next 16.3 native Node streams (~22% more req/s), Turbopack build cache.

**Decision**: Upgrade in one batch: next 16.3.0 + eslint-config-next 16.3.0 + sharp 0.35.3 (coupled), mongoose 9.9.1, isomorphic-dompurify 3.22.0, uuid 14.0.1, jsdom 30.0.1, lint-staged 17.3.0, postcss 8.5.26, react/react-dom 19.2.8 (unpin to `^`), @types/node ^24, `.nvmrc` → 24, add `engines.node >=24.15.0`.

**Alternatives rejected**:
- ESLint 10 now: eslint-config-next 16.3.0's bundled plugins (eslint-plugin-react/import/jsx-a11y) not v10-ready — lint crashes. Track next#91702/#91710. ESLint 9.39.5 is final v9 (EOL 2026-08-06).
- TypeScript 7 now: needs tsconfig `types` fix, typescript-eslint dual-alias (@typescript/typescript6), JSDoc audit — separate milestone (MED risk).
- Node 26 as prod runtime: Current, not LTS until 2026-10-28. Prod = Node 24 LTS (EOL 2028-04-30). Local dev stays 26.7 (satisfies all floors incl. jsdom 30's `>=26`).
- Skipping sharp upgrade: leaves known libvips CVEs on the user-upload image path (unacceptable).
- Force sharp 0.35 on next 16.2.x: known dlopen deploy crash (next#96064) — upgrade order is next+sharp together.
- postcss 8.5.25: has `list.split()` regression fixed only in 8.5.26 — go straight to 8.5.26.

**Constraints honored**: DB pool 3 unchanged, no schema change, no data migration, rate limits unchanged, concurrency envelope unchanged, no prod deploy (ADR-013: VPS not provisioned).

**User decisions (2026-08-08, /plan-task)**: ① NO agent-generated files — `agentRules: false` in next.config.ts at T9 (prevents 16.3 auto-upsert of AGENTS.md/CLAUDE.md blocks; single sanctioned config change). ② Version bump target 1.11.1-b → **1.12.0**. ③ Local runtime switches to **Node 24 LTS** (26.7 retired locally; `.nvmrc`+engines+types aligned; T1 reordered before baseline so every gate runs on the final runtime).

**Review**: senior-engineer verdict APPROVE-WITH-CHANGES (2026-08-08) — 8 findings applied (see plan). **5-loop scrutiny (2026-08-08, user-requested)**: 4 real flaws + 3 gaps found & applied — react range `^19.2.8`→`~19.2.8` (caret would allow surprise 19.3; project convention = tight react pinning), T1/T8 Mongo+eval prerequisites, sharp/jsdom single-copy dedupe checks, **AGENTS.md auto-upsert gate** (16.3 `next dev` writes managed agent-rules block; user decided: opt out via `agentRules: false`), AVIF visual check (sharp 0.35 quality-metric change), T9 login rate-limit awareness (5/15min), **T9.5 k6 load smoke added** (50 VUs vs baseline p95 20.2ms), T10 target 1.11.1-b→1.12.0, rollback covers committed state. Plan: `.agents/plans/env-upgrade-2026-08.md`
