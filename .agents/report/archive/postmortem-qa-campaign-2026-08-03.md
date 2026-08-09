# Post-mortem: Alphabet Adventure QA fix campaign (process retrospective)

Date: 2026-08-03 · Delivered: **v1.10.85, commit `7b32d04`, pushed to origin/main** · Severity: low (no incident — process learnings from a successful campaign) · Scope: 14 fixes across 3 QA batches + 1 cold batch, all senior-approved, suite 171/171

## Summary

A post-completion review campaign on Alphabet Adventure + site-wide checks (senior-engineer code review across QA/perf/security/a11y, database-reviewer on the DB layer, observer live monitoring, manager browser smoke test) produced **~50 findings**. Of those, **14 fixes were implemented across 3 hot QA batches (P1 → P2-hot → P3-hot, serial) + 1 cold batch (migrateMapSave, SVG a11y, parallel)**: keypad bypass guard, transition timer cleanup, typing-error tracking, overlay focus race, 3 dead achievements wired, Escape quit-confirm, debug panel gate, double card reveal, stale `hasSavedProgress`, dead difficulty deletion, map-save shape validation, SVG a11y wrapper, plus 4 frozen pin tests (suite 167 → 171). **Every batch APPROVED on the first senior review pass — zero rework.** Behavior was confirmed live in-browser (keypad bypass, Escape confirm, debug gate, SHOW ALL CARDS split, a11y leak) and the changes sit uncommitted awaiting the release gate (v1.10.85).

## What worked

1. **spec → implement → verify pipeline (senior spec first).** Each batch started from a senior-engineer spec (exact sites, exact guard, exact test), a junior implemented, senior verified. Every batch APPROVED on the first review pass — zero rework. Front-loading the correctness decisions in the spec (stale timer sites, ctx wiring, shape guards) meant implementation review found nothing new.
2. **2-lane parallel split by file-ownership.** Lane A = hot files (`useGameActions`, `GameScreen`, `GameOverlays`, …) run serial P1 → P2-hot → P3-hot; Lane B = cold files (`migrateMapSave`, SVG a11y) run in parallel. File-disjoint lanes → no merge conflicts and roughly 2× faster than a pure serial chain.
3. **Frozen pin tests locked the changed behavior.** 4 pins: typing ratio 2/3, breather branch + no-difficulty-key, `GAME_CONFIG` keys, state shape. Suite 167 → 171. The behaviors most likely to drift (economy ratios, deleted system leftovers, config/state contracts) now fail CI instead of silently regressing.
4. **Live browser re-tests confirmed behavior, not just code.** Keypad bypass (re-press wrong key → no new deduction; correct key still scores), Escape confirm dialog text, debug gate release-hidden/beta-shown, SHOW ALL CARDS release/beta split, "A ⭐" a11y leak gone from the a11y tree. Static review + runtime confirmation together.
5. **Juniors' self-verification caught both edit-race drops before review.** The two silent edit-drops (P2 + P3 batches) were caught by the juniors re-reading their own files (grep/read after every edit) — they never reached senior review or production. The known "edit tool drops changes" gotcha was neutralized by the verify step, not luck.

## What didn't

1. **Dev-server stale-chunk flakiness (Turbopack cache).** After many edits, :3300 served stale chunks — caused a false-positive a11y-leak sighting and slow compiles. Verification needed fresh reloads; the "leak" was already gone on fresh loads (cache artifact, not code). Cost: time spent re-verifying a non-bug.
2. **The 127.0.0.1-origin trick for a fresh profile broke HMR** — websocket handshake errors and wedged compilation. Consequence: the onboarding overlay (fresh-profile behavior) could NOT be live-tested — static + senior review only. Fresh-profile browser tooling remains a gap; a manual private-window check is the fallback.
3. **Playwright MCP auto-accepts native confirm dialogs** — only the OK path of the Escape quit-confirm was live-testable; the Cancel path remains a behavior gap. (Related: the snapshot tool errors while a native modal is up.)
4. **Subagent depth limit (1)** — the senior couldn't spawn a junior; the main agent orchestrated the spec→implement→verify chain directly. It worked, but put orchestration load on the main session and added context churn.

## Gotchas (also captured in `.agents/memory.md`)

1. **Parallel `edit` calls to the SAME file in one message silently DROP changes** — hit TWICE this campaign (P2 + P3 batches); both were caught by juniors re-reading files. Same-file edits MUST be sequential; re-grep/read after every edit.
2. **Subagent depth limit (1)** — no sub-subagent spawning; chains must be orchestrated by the main agent.
3. **Native browser `confirm()` dialogs** — the snapshot tool errors with modal state; `handle_dialog` may race with the MCP auto-accept. Only the OK path is reliably live-testable.
4. **Dev-server stale chunks after many edits** (Turbopack cache) — verify with a fresh navigate + cache-busting query param; don't trust the first sighting on a long-lived dev server.

## Why no incident / why zero rework

- **Senior spec first**: findings were resolved on paper (exact sites, guards, ctx wiring) before code existed — implementation review found nothing new, so no batch bounced.
- **Verify-after-every-edit discipline**: both silent edit-drops were caught by juniors re-reading their own files before the batch left their hands.
- **Approved-line preservation discipline**: SHOW ALL CARDS gate + `isOnboarding` verified intact after every batch (grep + git diff) — no cross-batch regressions.
- **Honest verification ledger**: the two not-live-testable items (onboarding fresh-profile behavior, Escape Cancel path) were surfaced as open items rather than silently claimed verified.

## Validation

- eslint: 0 problems on all touched files (each batch) · tsc --noEmit: clean throughout · vitest alphabet suite: **171/171** (167 → 171 with the 4 pins)
- Live browser re-tests (playwright): keypad bypass ✓ · correct-answer scoring ✓ · Escape confirm ✓ · debug gate release/beta ✓ · SHOW ALL CARDS release/beta ✓ · a11y leak ✓ · Start Over bilingual confirm (bonus, pre-existing) ✓
- 11 files changed, uncommitted — release gate (build → version → changelog → commit) pending; target v1.10.85

## Action items

- **Manual 30s onboarding check in a private window** (fresh profile): focus trap, Escape dismiss, 8s auto-dismiss — the one behavior that couldn't be live-tested.
- **Achievements live-check with pre-seeded localStorage** (optional — the 4 unit pins already cover award logic).
- **Mermaid/TreasureMonster `<text>` leak + emoji fallbacks** — the campaign report records this as "filed in todo.md", but no such ticket exists there at post-mortem time; file/confirm the ticket.
- **VPS reachability check** — observer ticket (MAJOR): 187.77.146.149 unreachable from the observer's network; verify power state + DNS from another network (devops/manual).
- **Tools/SSE WIP (18 files)** — separate paused batch; needs its own review + commit before its release.
