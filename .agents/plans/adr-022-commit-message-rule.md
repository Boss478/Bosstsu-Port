# ADR-022: Commit Message Rule — enforced lightweight hook (v3.1)

Date: 2026-08-09 · Status: **ACCEPTED** (user-approved v3.1; build authorized)
Plan: `.agents/plans/commit-message-rule.md`

## Context
No commit message convention existed — house style drifted (`T23:` prefixes, `Fix:`, `feat(krulaw):`, free-form). User requested an enforced rule for humans AND AI agents, all branches. Host constraints irrelevant (dev-tooling, zero runtime impact).

## Decision
1. **Enforcement: lightweight custom `commit-msg` hook** (`scripts/commit-msg-check.mjs`, zero deps) over commitlint — matches project's keep-it-simple value; +0 dependencies. Rejected: commitlint (+dep tree, rigid), doc-only (unenforced).
2. **Grammar v3.1:** `<type>: <description> (<ref1>; <ref2>; …)` — optional parenthesized ref/task group at END of subject (`(T23)`, `(T25; lawlib)`, `(#42; PR-7)`); **no scope syntax** (module labels move into end refs). Types (13, lowercase): `feat fix docs style refactor perf test build ci chore revert infra release`.
3. **`release` special form:** `release: (vX.Y.Z) <details>` — version paren REQUIRED (generic-enum bypass closed post-review). Old `Release vX.Y.Z:` / `vX.Y.Z:` exempt for history compat only.
4. **Micro-rules:** no `.` at very end of subject line; header-trim; body-leading-blank WARNING (advisory); >72-char advisory — **all advisories TTY-only** (agent commits stay quiet) with `--advisories` force flag.
5. **Exempt:** `Merge ` / `fixup!` / `squash!` / `Revert "` on first non-empty line.
6. **Refs-at-end semantics (documented):** linking only — auto-close lives in `Closes #…` body trailer; Jira needs ≥2-letter keys + `#command`; changelog tooling caveat; TH/EN one language per subject.
7. **Enforcement scope:** everyone, all branches (local hook; `git commit --no-verify` escape hatch documented).

## Rejected alternatives
- **commitlint + config-conventional**: rigid defaults conflict with dense bilingual house style (53% subjects >100 chars), dep weight, case rules break Thai text (documented commitlint failure class).
- **Scope syntax `feat(T23):`**: user rejected — refs-at-end preferred; scope also mis-parsed risk with end refs.
- **Mandatory refs**: user chose optional ("at least `<type>: <short details>` is ok").
- **Hard length cap**: rejected — would block half of existing history; advisory only.

## Consequences
- Migration: `T23: x` → `feat: x (T23)`; `feat(krulaw): x` → `feat: x (krulaw)`; `merge:` type dropped (Merge commits auto-exempt).
- **Gotcha discovered (env):** `npx husky <arg>` in husky 9.1.7 writes argv[2] into `core.hooksPath` → corrupted to `--help/_`, killing ALL hooks. Repair: `git config core.hooksPath .husky/_` or `npm run prepare`. **Never run `npx husky <arg>`.**

## Resource cost
+0 deps; Node ~15–30ms at commit time only; local dev machine only; never on VPS/request path; concurrency envelope unaffected.
