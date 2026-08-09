# Post-Mortem: Alphabet Adventure Map Redesign

**Version:** v1.10.60 | **Date:** 2026-07-07 | **Component:** Alphabet Adventure Game | **Severity:** N/A (Feature Redesign)

---

## Summary

Alphabet Adventure's linear 6-level auto-progression was redesigned to a Duolingo-style map with 6 stages × 6 sub-stages each (36 total lessons). Old save data auto-migrates to the new map-v2 format. Round generators now accept `letterPool` parameters for stage-scoped letter selection. The redesign touches 18 files across types, constants, generators, screens, hooks, and save system.

---

## Technical Scope

| Dimension | Detail |
|-----------|--------|
| **Files changed** | 18 (3 new, 15 modified) |
| **New screens** | LevelMapScreen, StageMapScreen |
| **New save format** | `alphabet-adventure-map-v2` (MapSaveData) |
| **Types added** | StageConfig, SubStageConfig, StageProgress, SubStageProgress, MapSaveData, LetterTracker |

---

## Design Decisions

### 1. Stage Structure: 6 stages × 6 sub-stages
- **Letter groups**: A-F, G-L, M-O (literal split of 6 contiguous letters), then YZ + 6 random weak for Stage 5, all 26 for Stage 6.
- **Sub-stage types per stage**: Thai Match, Phonics Match, Letter Match, Missing Capitals, Missing Lowercase, Typing Challenge (same 6 types as old levels).
- **Per-letter minimums**: 5 for stages 1-5 (6-8 letters → 30-40 rounds per sub-stage). Stage 6 reduced to 3 per letter (78 rounds per match sub-stage) — scrutiny finding prevented 468-round estimate.

### 2. Round generators with letter pool
- All 7 generators (`generateMatchRound`, `generateThaiRevertRound`, `generatePhonicsRevertRound`, `generateFillRound`, `generateFillChoices`, `generateTypingRound`) accept optional `pool` / `hiddenLetters` parameters.
- Default behavior (no pool) = full 26-letter alphabet for backward compat.

### 3. Save migration
- Old `alphabet-adventure-progress` key auto-migrates on first load of new code.
- Proportional unlock: old level completions map to stage unlocks.
- After migration, old key is deleted.

### 4. Sub-stage unlock logic
- Derived from previous sub-stage completion (not stored).
- Stage unlock: all 6 sub-stages complete → next stage unlocked.
- StageMapScreen computes: `unlocked = i === 0 || subStages[i-1].completed`.

---

## Issues Encountered

| Issue | Resolution |
|-------|-----------|
| Stage 6 round count too high (468 min) | Scrutiny flagged: reduced to `STAGE6_PER_LETTER_MIN=3` and `hideLetters.length=10` for fill |
| Export block truncation during edit | Previous incident: git restore + careful re-edit |
| `all-words.json` reformat corruption | Avoid `json.dump` default formatting |
| SubStageProgress lacks `unlocked` field | Removed unlock from save data; made it derived from completion |
| Various TypeScript type errors | Fixed unused imports, missing prop types, type mismatches |

---

## Validation

- `npm run build` — passes clean
- Pre-existing LSP errors in phonics game (unrelated) — unchanged
- All new screens render with correct stage/progress data
- Save migration converts old format without data loss

---

## Action Items

- None — feature is complete and self-contained.
