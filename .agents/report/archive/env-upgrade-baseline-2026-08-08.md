# Env Upgrade — Baseline on Node 24 (T2)

**Date**: 2026-08-08 | **Phase**: T2 of env-upgrade-2026-08 (before any dependency upgrade)
**Branch**: `env-nextjs-16.3.0` | **HEAD**: `54fa6af` (clean at start; T1 edits to `.nvmrc`/`package.json` in working tree — expected, uncommitted)

## Environment

| Item | Value |
|---|---|
| node | v24.19.0 (`/opt/homebrew/opt/node@24/bin/node` — Homebrew keg, PATH-prepended) |
| npm | 11.17.0 |
| MongoDB | UP on :27017 (local) |
| Dependencies | UNCHANGED from `54fa6af` (next 16.2.12, mongoose 9.8.0, sharp 0.34.5, react 19.2.3, …) except T1: `@types/node` ^24.0.0 (resolved 24.13.3), `.nvmrc`=24, `engines.node` added |

## Gate results (all on Node 24, old deps)

| Gate | Result | Notes |
|---|---|---|
| `npm run typecheck` | ✅ PASS | clean, 0 errors (types ^24.0.0 → 24.13.3) |
| `npm run lint` | ✅ PASS | clean, 0 problems |
| `npm test` | ✅ PASS | chain `check-inventory && test:unit && test:db` exit 0; visible summary: 19 files / 234 tests passed |
| `npm run build` | ✅ PASS | exit 0; full route table emitted |
| `npm run eval` | ✅ PASS | **34 passed, 0 failed** — report: `.agents/report/eval-20260808-135147.md` |

## Pre-existing warnings (baseline noise — NOT introduced by this phase)

- `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` — Next 16.x build warning (present on 16.2.12).
- Mongoose `new` option deprecation for `findOneAndUpdate()` — emitted during db tests (mongoose 9.8.0).
- `npm install` (T1) audit summary at baseline: **12 vulnerabilities (5 moderate, 7 high)** — expected pre-upgrade state; T5/T8 re-audit records post-upgrade state.
- npm 11 `allow-scripts` warnings (fsevents, sharp, unrs-resolver) — global Homebrew npmrc config (`/opt/homebrew/etc/npmrc`, `strict-allow-scripts=false`); sharp's `@img/sharp-darwin-arm64` + `sharp-libvips-darwin-arm64` prebuilt binaries ARE present, so the blocked check/rebuild script is a non-issue.

## Conclusion

Known green state reproduced on Node 24 LTS with the old dependency set. Upgrade (T3–T5) may proceed; any gate failure after T3+ is attributable to the upgrade.
