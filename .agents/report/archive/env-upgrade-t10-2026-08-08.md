# T10 — Release Protocol (env-upgrade: next 16.3.0 / Node 24)

**Date**: 2026-08-08 | **Branch**: `env-nextjs-16.3.0` | **Runner**: junior-engineer (build)
**Inputs**: intake `.agents/tasks/env-upgrade-intake.md` T10 · T9.5 final verdict (CONDITIONAL PASS → PASS, p95 12.15ms measured on quiet host)
**Version**: `1.11.1-b` → `1.12.0` (user pre-approved 2026-08-08)

## 1. Changelog entry (added at top of `changelog.md`, matches existing format)

```
## v1.12.0 (2026-08-08)
+ **Env upgrade — Next.js 16.3.0 / Node 24 LTS (ADR-014, 10 deps)**: next 16.2.12→16.3.0 (native Node streams in the prod runtime — SSE verified live: prompt step event, ~30s heartbeat, disconnect/reconnect, 9th same-IP connection NOT 429 · Turbopack persistent build cache default — cold/warm builds match · prefetch bundling) · eslint-config-next 16.3.0 · sharp 0.34.5→0.35.3 (libvips 8.18, CVE fixes; single deduped copy; standalone nft trace carries both darwin-arm64 binaries; AVIF visual check passed) · mongoose 9.8.0→9.9.1 (perf + type fixes; 2-line generic fix in `src/lib/admin-crud.ts` — the only src/ change) · isomorphic-dompurify 3.19.0→3.22.0 (DOMPurify 3.4.5 XSS fix — GHSA-55q2-fjhq-7xh7 cleared) · uuid 13.0.2→14.0.1 (OOB-write fix cleared) · react/react-dom 19.2.3→~19.2.8 (Server Actions DoS hardening cleared) · jsdom 29→30 (single copy, deduped with isomorphic-dompurify) · lint-staged 17.2→17.3 · postcss 8.5.23→8.5.26.
+ **Node 20 → 24 LTS** (runtime v24.19.0): `@types/node` ^20→^24 · `"engines": { "node": ">=24.15.0" }` · `.nvmrc` 20→24.
+ **`agentRules: false`** in next.config.ts (user decision 2026-08-08): stops next dev 16.3 auto-upsert of managed AGENTS.md/CLAUDE.md blocks — tree verified free of agent-generated files after the dev run.
- **Gates**: typecheck/lint clean · build clean ×2 (matching outputs) · eval 34/34, pass³ = 1.00 · k6 50 VU — poll p95 12.15ms (vs 20.2ms baseline @100 VU), public p95 20.56ms, 0% errors, no pool-3 saturation · audit 12→9→7→6 (remaining = known out-of-scope yahoo-finance2/archiver chains) · Playwright specs pass. OPS NOTE: no prod deploy — VisperHost pending (ADR-013).
```

Note: pre-commit lint-staged prettier pass reflowed the `- **Gates**` line (markdown printWidth wrap) — content verified identical in `HEAD:changelog.md` after commit.

## 2. Version verification

- `grep '"version"' package.json` → `"version": "1.12.0"` ✓
- `package-lock.json` root + packages.`""` entries both `1.12.0` ✓ (bumped via `npm version 1.12.0 --no-git-tag-version`)
- Latest changelog header `## v1.12.0 (2026-08-08)` matches package.json ✓

## 3. Pre-commit gates

- `npm run typecheck` → **clean** (after artifact fix, see §6)
- `npm run lint` → **0 errors, 5 warnings** — exit 0. Warnings are the documented new `@next/next/no-location-assign-relative-destination` rule set from eslint-config-next 16.3.0 flagging pre-existing src/ code (phase-1 report accepted; matches T6 state, no errors).

## 4. Commit

- Staged (exactly 6 files, verified via `git status --short` before commit — no `.agents/` files, no untracked):

| File | Change |
|---|---|
| `.nvmrc` | 20 → 24 |
| `changelog.md` | + v1.12.0 entry |
| `next.config.ts` | + `agentRules: false` (sanctioned T9 change) |
| `package-lock.json` | full dep tree for 10 upgrades + version |
| `package.json` | 10 deps, engines, @types/node ^24, version |
| `src/lib/admin-crud.ts` | 2-line generic fix (`Model<T>` in `createTogglePublished`/`createDeleteItem`) |

- **Commit**: `17c03ab` — `Release v1.12.0: env upgrade — next 16.3.0, node 24, sharp 0.35.3, react 19.2.8, mongoose 9.9.1 (10 deps) + agentRules` (6 files, +398/−299)
- **Final tree**: `git status` clean (no untracked files); `git --no-pager log --oneline -1` → `17c03ab` on `env-nextjs-16.3.0` ✓

## 5. Behavior contract (unchanged)

- No src/ logic changes beyond the sanctioned admin-crud.ts generic fix; no DB/seed/rate-limit/evals/tests touched; no push (manager asks user first); prod smoke server on :3301 untouched (manager's process).

## 6. Environmental incident (non-blocking, discovered at T10 gate)

- **Corrupted dev-generated type artifact**: `.next/dev/types/validator.ts` (gitignored) contained a torn write (mtime **15:30:16** — during T9's window, predates T10): `AppPageConfig` type declaration missing, `LayoutConfig` duplicated as a truncated fragment → TS1109/TS1005 syntax errors broke `npm run typecheck` (9 errors).
- **Fix**: backed up to `/private/var/folders/.../T/opencode/t10-artifacts/validator.ts.corrupt-bak` and removed. Typecheck clean immediately after (file is dev-overlay-only; regenerates on next `next dev` recompile; prod `.next/types` path untouched — T8 build already proved it). No impact on the commit (gitignored).
- **Caveat for manager/verify**: if the dev server regenerates a corrupt validator again on recompile, that points to a Next 16.3.0 dev-server writer bug worth reporting upstream; watch `.next/dev/types/validator.ts` after the next dev restart.

## 7. Known risks / for senior review

- Changelog gates line cites T8–T9.5 report numbers (eval 34/34, k6 p95 12.15/20.56ms, audit 6) — consistent with `.agents/report/env-upgrade-t8/t95`.
- The 5 lint warnings are new-rule noise (documented), not regressions.
- Next stop: verify agent (build + lint + version/changelog consistency) per intake T10 step 5.
