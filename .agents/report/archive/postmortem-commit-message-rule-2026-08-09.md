# Post-mortem: Commit Message Rule (ADR-022) — 2026-08-09

Feature: enforced commit message convention via zero-dep `commit-msg` hook.
Commits: `6e3aafd` (rule + validator + tests) · `c26f0bf` (changelog).
Plan: `.agents/plans/commit-message-rule.md` · ADR: `.agents/plans/adr-022-commit-message-rule.md`

## What went well
- **Spec-first process worked**: user decisions → research (2 rounds) → broad + technical review gates → user approval gate → build in 2 runs with a mid-build checkpoint (compliance report before hook activation). Zero rework after build start; both reviews caught real bugs (release-enum bypass, worktree false-green, `(# 123)` acceptance, acronym false-positives).
- **Lightweight stayed lightweight**: +0 dependencies, ~158-line validator, 15–30ms at commit time only. Runtime/DB/VPS impact: none.
- **Dogfooding**: our own commits (`6e3aafd`, `c26f0bf`) were validated by the live hook — instant real-world proof.
- **Compliance checkpoint worked**: user saw the 14.7% pass rate (legacy styles) before the hook went live — no surprises, expectation set correctly.
- **TTY-only advisories**: agent/pipe commits stay silent; humans still get the >72-char nudge.

## What went wrong / caught
1. **`npx husky <arg>` footgun (self-inflicted during review)**: husky 9.1.7 treats argv[2] as the hooks dir → `core.hooksPath` corrupted to `--help/_` → ALL hooks died silently (pre-commit included). Discovered by the reviewer, disclosed immediately, repaired (task 0). → **AGENTS.md gotcha added; never run `npx husky <anything>`.**
2. **Worktree e2e false-green**: `.husky/_/` shim + hook are untracked → absent in fresh worktrees → shim silently skips → invalid commits pass. Caught in senior review before it could produce a false "verified" claim; e2e now copies hooks into the worktree and asserts the hook actually ran.
3. **Regex spec drift risk**: first review found the scope regex rejected its own flagship example; re-review found `release: v1.13.0 notes` passed the generic enum (contradicting the spec) and `(# 123)` passed. Lesson: **always test the spec's own examples + every fixture against the literal regex** before calling it done.
4. **Expected legacy friction**: 14.7% pass rate on history (T23: 36, scope 29, uppercase 28, missing `:` 27). Not a defect — rule applies to new commits only. Advisory warning fires on ~69% of historical subjects (TTY-only, exit 0).

## Lessons for FUTURE commit-rule work (user-requested capture)
- **Tuning the rule** (types, refs, length, exemptions): change fixtures FIRST, then the script; run `npx vitest run --config vitest.unit.config.ts tests/commit-msg` + `npm run test:check-inventory` (inventory enforces registration of any new test file — free guard).
- **Re-running the compliance report**: `node scripts/commit-msg-check.mjs --advisories <file>` (force flag) or batch via `git log --format=%s -150`. Use it before ANY rule change to quantify impact.
- **Known accepted edge cases (documented, not bugs):** `feat: x(T23)` (no space) = free text · `(PR 7)` = free text · multi-ref `(#1) (#2)` passes · `Merge:` capital rejected · double-space after colon passes · acronyms `(TLS)`/`(TTS)` pass (digit-anchored scan is intentional).
- **Jira reality check**: `(T23)` is local-task linking only — Jira needs ≥2-letter keys + `#command`; `Closes #42` trailer is the auto-close mechanism. If Jira integration is ever adopted, revisit (possibly `references-empty`-style requirement).
- **Changelog hand-maintenance**: validator does NOT check bodies/footers — changelog entries live outside the rule. If changelog automation is ever adopted, `(module)` refs ride along verbatim (cosmetic noise) and per-module grouping needs scope syntax (rejected) or trailers.
- **.husky/_/ untracked**: fresh worktrees/clones silently skip hooks until `npm run prepare`. Documented in AGENTS.md; user chose keep-ignored (husky standard). Anyone debugging "hook not running" should check `git config core.hooksPath` first.
- **Version**: no bump (dev-tooling); changelog entry rides under v1.12.1.
- **Future changes to the rule need**: senior-engineer regex blessing (history shows regex drift is the #1 failure class) + updated AGENTS.md cheat-sheet + compliance re-run.

## Artifacts
- Plan (spec + compliance report): `.agents/plans/commit-message-rule.md`
- ADR: `.agents/plans/adr-022-commit-message-rule.md`
- Validator: `scripts/commit-msg-check.mjs` · Hook: `.husky/commit-msg`
- Tests: `tests/commit-msg/` (41 tests, 37 fixtures)
- Docs: AGENTS.md "Commit Message Convention" · memory capture in `.agents/memory.md`
