# QA Fix Campaign Report — Alphabet Adventure (2026-08-03)

Status: COMPLETE · All batches senior-approved · Uncommitted (11 alphabet files) · Suite 171/171 · tsc/lint clean

## Campaign structure
2-lane parallel (approved): Lane A = hot files (useGameActions/GameScreen/etc, serial P1→P2-hot→P3-hot); Lane B = cold files (migrateMapSave, SVG a11y) in parallel. Chain: senior spec → junior implement → senior verify, per batch. Junior spawns blocked at subagent-depth — main agent orchestrated directly.

## Batch 1 — P1 (4 MAJORs) — APPROVE
1. Keypad bypass — keydown guard now rejects `wrongChoices` members (+deps). **Live-verified**: re-press wrong key → no new deduction/feedback; correct key still scores.
2. Transition timer race — `transitionTimerRef` + `feedbackTimerRef` (5 sites + showFeedback), cleared in startSubStage/startPracticeSession/unmount; Back disabled while `isTransitioning`.
3. Typing errors never tracked — `newGrid.filter(g => g.isWrong)` (was stale `roundData.grid` → always []).
4. Overlay focus race — OnboardingOverlay: useFocusTrap + role=dialog + aria-modal + labelledby + restart-on-focusin 8s timer; GameScreen `isOnboarding` gates keydown + auto-focus; client passes the prop. **Live-verified partially** (fresh-profile test blocked by dev-tooling; static + senior verified; manual check: private-window first lesson).

## Batch 2 — P2-hot (4 + 2 NITs) — APPROVE
5. 3 dead achievements (`perfect_3x`, `perfect_stage`, `revisit`) — ctx now receives perfectCount/revisit/stagePerfect (recordPerfect + revisitRef were already wired; only ctx never read them).
6. Escape quit-confirm — bilingual `window.confirm` (mirrors Start Over pattern). **Live-verified**: dialog text exact; OK path exits to stage.
7. Debug panel gate — 👁️ button + panel behind `isBeta`. **Live-verified**: release hidden, beta shown.
8. Double card reveal — `winTier = revealPendingRef.current ? null : rollWinDrop()` (one-liner; single-drop economy).
NITs: feedback-timer clear-before-set; overlay Escape-to-dismiss (stopPropagation).

## Batch 3 — P3-hot (3) — APPROVE (with optional pin, now landed)
9. `hasSavedProgress` stale — replaced frozen mount-time state with derived `hasProgress` from live `mapData` (client 3-line change; hook cleanup).
10. `isThaiText` dead branch — kept + invariant comment (removal would ripple 13 edits across 3 files for a NIT).
11. Difficulty deletion — knob was live-but-invisible (only inflated levelCorrect/levelTotal; ratio-identical to +1/+1). Deleted: constants/types/hook sites; error-threshold branch kept, feedback 'Difficulty decreased!' → 'Take a breather!'. Grep-proof: zero references remain.
12. **Pin test** — 4 frozen pins (typing ratio 2/3, breather branch + no-difficulty-key, GAME_CONFIG keys, state shape). Suite 167 → 171.

## Batch 4 — cold (2) — APPROVE
13. Map-save validation (stages/letterTracker shape guards → degrade to fresh save instead of white-screen).
14. SVG a11y — aria-hidden wrapper at 2 leaf components covers all 122 SVGs + CaptainAlph mascot. **Live-verified**: "A ⭐" leak gone from a11y tree (fresh loads; dev-server stale-chunk flakiness on :3300 is a Turbopack cache issue, not code).

## Verification evidence
- eslint: 0 problems on all touched files (each batch)
- tsc --noEmit: clean throughout
- vitest alphabet suite: 171/171
- Live browser re-tests (playwright): keypad bypass ✓, correct-answer scoring ✓, Escape confirm ✓, debug gate release/beta ✓, SHOW ALL CARDS release/beta ✓, a11y leak ✓, Start Over bilingual confirm (bonus, pre-existing) ✓
- Approved-line preservation: SHOW ALL CARDS gate + isOnboarding verified intact after every batch (grep + git diff)

## Files changed (11, uncommitted — commit scope)
AlphabetAdventureClient.tsx, GameScreen.tsx, useGameActions.ts, OnboardingOverlay.tsx, GameOverlays.tsx, constants.ts, types.ts, migrateMapSave.ts, characters/CaptainAlph.tsx, cards/CardWordArt.tsx, cards/CardIllustrations.tsx, tests/unit/alphabet-adventure.test.ts

## Runtime gotchas surfaced (worth memory)
- Subagent depth limit (1): seniors/juniors can't spawn sub-subagents — main agent must orchestrate.
- Parallel `edit` calls to the SAME file in one message silently DROP changes (hit twice, both self-caught) — same-file edits must be sequential.

## Open items (not in this batch)
- Manual check (30s): onboarding overlay in a private-browsing window (fresh profile) — focus trap + Escape + 8s dismiss.
- Achievements live-check needs pre-seeded localStorage — unit suite pins award logic; optional.
- Ticket filed: Mermaid/TreasureMonster `<text>` leak + emoji fallbacks (todo.md).
- VPS unreachable — devops/user verify from another network (observer ticket, MAJOR).
- Tools/SSE WIP (18 files) — separate paused batch, needs its own review + commit (excluded here).
