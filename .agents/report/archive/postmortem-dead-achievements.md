# Post-mortem: Four achievements were unachievable since v1.10.75 (dead ctx wiring)

Date: 2026-08-02 · Fix: `a75038b` (v1.10.79) · Found: plan scrutiny of the achievements expansion · Owner: build agent

## Summary

Four shipped achievements could **never unlock**: `perfect_lesson` (100% on a lesson), `perfect_stage` (3★ on every lesson in a stage), `first_practice` (complete a practice session), `vowel_master` (all vowels ≥80%). `runAchievementCheck` (`useGameActions.ts:115`) built its context from just 4 fields (cardCount, currentStreak, stagesCompleted, totalScore) — the `AchievementContext` fields the awards read (`lessonPerfect`, `stagePerfect`, `isPractice`, `letterTracker`) were declared in the interface but **never set by any caller**. They shipped broken in the v1.10.75 achievement launch and stayed broken through v1.10.78 (three releases). Fixed in `a75038b` by wiring the full context.

## Symptom

- Player earns 100% accuracy on a lesson → no `perfect_lesson` unlock, ever
- Player completes a practice session → no `first_practice` unlock, ever
- Player masters all vowels → no `vowel_master` unlock, ever
- Player 3-stars every sub-stage of a stage → no `perfect_stage` unlock, ever
- Discovered during plan scrutiny of the achievements expansion (plan `alphabet-adventure-achievements-v2.md` §3) when tracing where `letterTracker` was passed — it wasn't

## Root cause

`checkAndAward(ctx)` is a pure awards function reading whatever `ctx` it's given; `runAchievementCheck` is its **only** caller (`achievements.ts:185`, `useGameActions.ts:122`). The caller built a 4-field ctx:

```
cardCount, currentStreak, stagesCompleted, totalScore   // nothing else, ever
```

`lessonPerfect`/`stagePerfect`/`isPractice`/`letterTracker` existed in `AchievementContext` (some since the v1.10.75 launch) but had **zero producers** — the interface described a contract nobody fulfilled. The completion path (`handleSubStageComplete`) never re-ran the check at all, so even the *idea* of completion-scoped awards had no hook. The awards were dead code that looked alive: they rendered, they were counted, they just never fired.

Related latent bug found in the same trace: the client's map save happened **inside a React setState updater** (runs at render, not call time), so any completion-time check would have read a stale save anyway — completion/star/stage awards would have lagged one check behind (or never fired, as happened).

## Why it slipped through

- **Interface-claims-persistence trap**: the ctx fields were declared in the type, so grepping the interface or reading `checkAndAward` suggested they were wired. Nothing verified that every interface field had a producer.
- **No tests**: `checkAndAward` had zero unit tests. No test ever called it with `lessonPerfect: true` and asserted the award — the dead path was invisible to the suite.
- **No completion-path check**: the check only ran on answer events; completion achievements had no trigger moment to expose the gap.
- **Not playtested**: the v1.10.75 browser verification exercised card drops and streaks, not 100% runs / practice completions.

## Fix

`a75038b` (v1.10.79):

- `runAchievementCheck(extra?)` now builds the full ctx: `tierCounts`/`letterFull` from `loadCollection()`, `subStagesCompleted`/`starCount` from `loadMapSave()`, `letterTracker` from `letterTrackerRef`, `bestStreak` from state, play-stats values — and merges a **completion ctx** stashed by `handleSubStageComplete` (`lessonPerfect`, `stagePerfect`, `isPractice`, `accuracyPercent`, `lessonSeconds`, `easyModeOff`, `cardsInSubStage`, `quickFastStreak`, `rebuiltStreak`, `jackpot`, `firstTry`, `maxConsecutiveWrongs`, `perfectMan`).
- Completion ordering fixed: client's `handleSubStageComplete` now writes the map save **synchronously** (pure `buildNextMap` helper) *before* calling `runAchievementCheck` — completion/star/stage awards fire on the run they're earned, not one check late.
- Practice handler now also runs the check (fixes `first_practice`) and merges its `letterTracker` into the map save (practice answers now persist across reloads — a data-fidelity gap found in the same trace).
- **23 new unit tests** pin the awards, including explicit wiring tests for all four dead achievements (`lessonPerfect → perfect_lesson`, `stagePerfect → perfect_stage`, `isPractice → first_practice`, vowel tracker → `vowel_master`) plus persistence/idempotency (a real `localStorage` shim via `vi.stubGlobal`).

## Validation

- `tests/unit/alphabet-adventure.test.ts`: **167/167 pass** (was 144; +23 new). The four wiring tests fail against the pre-fix code and pass after.
- `npx tsc --noEmit` clean · eslint 0 errors (1 pre-existing warning) · `npm run build` ✓ Compiled (22.6s)
- Not validated in a live browser (Docker dev container still paused) — the manual playtest items from the plan (achievement toasts in real play, secret-section reveal) are deferred.

## Action items

- **Browser playtest** of the achievements when the dev container is up: trigger first_rare / revisit / days_3 / no_trainer / power_10 / double_drop cheaply; verify completion achievements fire on win *after* the save; verify the Secret section appears only after the first egg; no double-fire on checkpoint resume. (Tracking: next session.)
- No further — the interface-producer gap is now covered by tests; the full-ctx pattern is the new baseline for any future award.
