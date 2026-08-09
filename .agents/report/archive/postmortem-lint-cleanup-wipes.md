# Post-mortem: Lint cleanup wiped twice by concurrent commits (process failure)

Date: 2026-08-02 · Fixed: `e06a9f3` (v1.10.82) · Severity: low (no user-facing impact — dev-process only) · Time-to-fix: ~2 cleanup runs + 1 redo (~1h wall, incl. two detection cycles)

## Summary

A tree-wide ESLint cleanup (82 errors across ~20 files) was completed and verified (0 errors) **twice**, and both times the working-tree changes were silently wiped by the user's concurrent commit flow (`96b57aa` v1.10.80, `e699ea2` v1.10.81 — Class Tools releases landing while the cleanup ran). The agents' fixes were never committed; HEAD captured pre-fix versions of most files; the working tree was then reverted to match, so the fixes vanished unrecoverably (the two `lint-staged automatic backup` stashes contained stale snapshots, not the fixes). The cleanup was redone a third time with explicit coordination ("you pause commits until I commit in one shot") and landed as `e06a9f3` (v1.10.82).

## Symptom

- Cleanup run #1: 82 errors → 0 verified (eslint --quiet exit 0, 489 tests pass). Next check: 76 errors back, agents' files identical to HEAD (pre-fix), fixes gone.
- Cleanup run #2 (re-applied): same wipe — 76 errors back, working tree = HEAD again.
- ~7 of the *warning-level* fixes (FillLevel, CardFlipGame, sse-server, 4 phonics components) survived inside v1.10.80 because they were swept into the commit by timing; none of the *error-level* fixes did.
- The wipe was discovered by re-running the gate, not by any signal — no error, no conflict message.

## Root cause

Two concurrent writers on the same working tree with no coordination:

1. **The user's commit flow operated on a live, dirty tree.** Their releases (v1.10.80/81) staged and committed while 3 cleanup agents were mid-edit. Evidence shows selective staging (agent-fixed files absent from both commits despite being fixed at commit time), followed by a restore that left the tree matching HEAD exactly — i.e., the uncommitted fixes were discarded, not committed and not kept. The `lint-staged` pre-commit mechanism stashes unstaged changes during the hook run; if the stash restore is interrupted or the user/IDE discards remaining changes (restore/checkout/discard-all), uncommitted work vanishes without a trace.
2. **No exclusive-tree protocol.** The cleanup ran in the same checkout the user was committing from. Nothing prevented the collision; nothing detected the loss until the gate was re-run.

Secondary factor: **the gate was run once and the tree was assumed stable.** After run #1 verified 0 errors, the state was trusted until the next check; the verification itself was correct — the *tree* had changed underneath.

## Why it slipped through

- **Silent loss**: `git restore`-style discards (or a failed lint-staged stash restore) leave no message, no conflict, no reflog entry for working-tree content.
- **No ownership signal**: uncommitted changes have no owner; both the user's commit flow and the cleanup agents legitimately believed they "owned" the tree.
- **Verification-then-assume**: the gate ran once; nothing re-verified until the next explicit check.
- **Stale-stash misdirection**: the two `lint-staged automatic backup` stashes looked like they might hold the fixes (they were recent by name) but contained old session content — cost investigation time.

## Fix (process)

1. **Redo with coordination** (what worked): user paused commits; 3 agents + 1 main pass redid the full cleanup; the main agent ran the complete gate (eslint 0 errors, typecheck, build, 475 tests) and committed everything **in one commit** (`e06a9f3`, v1.10.82) with no window for a second writer.
2. **Follow-up guard (recommended, not yet implemented)**: for any future multi-agent change while the user is committing, either (a) work on a branch and merge, or (b) an explicit "tree is mine until I say done" handoff before starting, and (c) re-run the gate immediately before committing (not just after the fix).

## Validation

- `e06a9f3` post-state: `npm run lint` 0 errors · typecheck clean · build 33/33 pages · 475 unit tests pass.
- The wipe is not reproducible against a single-writer tree: with commits paused, run #3 survived end-to-end.

## Action items

- **Branch discipline** for parallel work streams (cleanup vs. feature releases) — track in `.agents/memory.md`.
- No product regression: the wiped fixes were lint/type-only; no shipped behavior was affected.
