---
version: v1.10.50
date: 2026-06-27
component: Alphabet Adventure (useGameActions, CardRevealModal)
status: Final
---

# Post-Mortem: Alphabet Adventure Race Conditions & State Leaks

**Version:** v1.10.50 | **Date:** 2026-06-27 | **Component:** Alphabet Adventure | **Severity:** P2

---

## Summary

Five bugs in Alphabet Adventure: (1) `cardDroppedRef` race — multiple correct answers per level lost earlier card-drop triggers; (2) `pendingFinishRef` leak — Escape on CardRevealModal prevented score finalization; (3) `onboardingSeen` not persisted across refreshes; (4) `roundSeed` module-scoped without reset between games; (5) VictoryScreen `stageStars` division by zero. All fixed in v1.10.50 with 78 new tests.

---

## Symptom

1. **cardDroppedRef race**: Only the last correct answer's card drop triggered the reveal modal; earlier drops were silently lost.
2. **pendingFinishRef leak**: Pressing Escape dismissed the modal without finalizing score; game stuck.
3. **onboardingSeen not persisted**: `useRef<Set<number>>` reset on every page refresh.
4. **roundSeed module-scope leak**: Module-scoped `let roundSeed` never reset between games → same shuffle pattern.
5. **VictoryScreen 0/0**: Empty `stageStars` → `0 / 0` = `NaN`.

---

## Root Cause

### Bug 1: cardDroppedRef race (`hooks/useGameActions.ts:312`)
Ref reset at top of `handleAnswer`/`checkTyping` cleared the accumulator on every answer. Correct answers set `cardDroppedRef = true`, but the next answer's top-of-function reset cleared it before `handleLevelComplete` could read it.

### Bug 2: pendingFinishRef leak (`beta/screens/CardRevealModal.tsx`)
No Escape key handler. Browser default closes modal without calling `onKeep()`, leaving `pendingFinishRef.current` stale.

### Bug 3: onboardingSeen not persisted (`AlphabetAdventureClient.tsx`)
`GameState.onboardingSeen: boolean[]` existed in types but was never populated; client used separate `useRef<Set<number>>`.

### Bug 4: roundSeed module-scope (`constants.ts`)
Module-scoped `let roundSeed = Math.random()` initialized once, never reset. `startGame` had no call to reinitialize.

### Bug 5: VictoryScreen 0/0 (`screens/VictoryScreen.tsx`)
`stageStars.reduce(...)` without guard produced `NaN` on empty array.

---

## Fix

| Bug | File | Change |
| --- | ---- | ------ |
| 1 | `hooks/useGameActions.ts` | Moved `cardDroppedRef.current = false` into wrong-answer branches only |
| 2 | `beta/screens/CardRevealModal.tsx` | Added `useEffect` keydown listener for Escape → `onKeep()` |
| 3 | `hooks/useGameActions.ts` + `AlphabetAdventureClient.tsx` | Added `markOnboardingSeen(level)` updating `gameState.onboardingSeen[]` + save |
| 4 | `constants.ts` + `hooks/useGameActions.ts` | Added `resetRoundSeed()`, called in `startGame` |
| 5 | `screens/VictoryScreen.tsx` | Wrapped stars section in `{stageStars.length > 0 && (...)}` |

---

## Why It Slipped

- **No test coverage**: 5,595 lines, 0 tests. Ref-based concurrency bugs are hard to catch without targeted tests.
- **Bug 2 blind spot**: v1.9.55 fix deferred finishGame until KEEP but didn't consider Escape key as dismiss path.

---

## Pattern Detection

**Primary class:** `concurrency` (bug 1, 2), `validation` (bug 3, 4, 5)

**Recurring:** Yes — third ref-scoping bug in Alphabet Adventure (v1.9.55, v1.9.60, v1.10.50). All three are ref-scope errors.

---

## Validation

- `npm run build` — passes
- `npx vitest run tests/unit/alphabet-adventure.test.ts` — 78 tests pass
- Full suite: 476 passed, 185 skipped (15 MongoDB — pre-existing)

---

## Action Items

- Add hook/component integration tests for `useGameActions` (follow-up)
- **Pattern note for ref-scoping**: When adding a `useRef` whose value is set and read across different event handlers, verify: (1) accumulating or per-event? (2) Reset at right scope? (3) Dismiss paths (Escape, click-outside) that bypass setter?
