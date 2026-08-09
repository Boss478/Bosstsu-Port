---
version: v1.10.33
date: 2026-06-20
component: Phonics Game
status: Final
---

# Post-Mortem: Phonics Game Refactoring v1.10.33

**Version:** v1.10.33 | **Date:** 2026-06-20 | **Component:** Phonics Game | **Type:** Refactoring

---

## Summary

Systematic refactoring of the Phonics Game codebase across 6 phases, eliminating 5 categories of duplication (type definitions, question buttons, glass card classes, panel classes, word pills) and deleting one orphaned component. No behavior changes. Build/lint/tests all pass (104/104).

---

## What Changed

### Phase 0 — Dead Code Cleanup
- **Deleted** `components/GlassCard.tsx` (phonics version, 22 lines) — already had zero imports, orphaned since creation

### Phase 1 — Type Consolidation
- Moved `DictEntry` interface to shared `types.ts` (line 295+)
- Removed 3 local definitions from `useAllWordEntries.ts`, `phonemeSearch.ts`, `WordBuilderScreen.tsx`

### Phase 2 — QuestionChoiceButton Component
- Created `components/QuestionChoiceButton.tsx` encapsulating 5-state visual feedback logic (correct/green+bounce, wrong-correct/muted, wrong-incorrect/pink+shake, selected/gold, default/slate)
- Updated 4 consumers: `WordToIpaQuestion.tsx`, `IpaToWordQuestion.tsx`, `SynonymQuestion.tsx`, `GameScreen.tsx`
- Removed 4 copies of identical ~70-char class string + 5-state if-else (~250 lines → ~50 lines)

### Phase 3 — Question Card CSS Constant
- Added `QUESTION_CARD_CLASSES` to `constants.ts`
- Updated 4 consumers to use the constant instead of inline ~100-char Tailwind string

### Phase 4 — WordBuilder Panel CSS Constant
- Added `WB_PANEL_BASE` to `constants.ts`
- Updated 4 glass panel instances in `WordBuilderScreen.tsx`

### Phase 5 — WordPill Component
- Created `components/WordPill.tsx` with 3 variants (default/muted/inert), 3 sizes (sm/md/lg), and active boolean
- Updated all 6 pill button instances in `WordBuilderScreen.tsx`

### Bonus — Scroll Bug Fix
- Added `overflow-y-auto min-h-0` to `PhonicsClient.tsx:740` — parent flex container clipped overflow without scrollbar

---

## Root Cause

The phonics game grew organically: new screens, question types, and components were added incrementally without a dedicated quality pass. Three patterns emerged:
1. **Copy-paste class strings** — glass panel styles, question button styles, and pill button styles were inlined in every file
2. **Orphaned component** — GlassCard was created early but never used; the CSS class `glass-panel` was used directly instead
3. **Type drift** — DictEntry was independently defined wherever pronunciation dictionary data was consumed

---

## Files Changed / Created

| File | Status | Lines |
|---|---|---|
| `components/QuestionChoiceButton.tsx` | **NEW** | ~80 |
| `components/WordPill.tsx` | **NEW** | ~60 |
| `components/WordToIpaQuestion.tsx` | **MODIFIED** | −45 |
| `components/IpaToWordQuestion.tsx` | **MODIFIED** | −45 |
| `components/SynonymQuestion.tsx` | **MODIFIED** | −40 |
| `components/GlassCard.tsx` | **DELETED** | −22 |
| `screens/GameScreen.tsx` | **MODIFIED** | −85 |
| `screens/WordBuilderScreen.tsx` | **MODIFIED** | −180 |
| `PhonicsClient.tsx` | **MODIFIED** | +1 (scroll fix) |
| `constants.ts` | **MODIFIED** | +8 (2 constants) |
| `types.ts` | **MODIFIED** | +5 (DictEntry) |
| `hooks/useAllWordEntries.ts` | **MODIFIED** | −4 |
| `utils/phonemeSearch.ts` | **MODIFIED** | −4 |

---

## Key Metrics

| Metric | Before | After |
|---|---|---|
| WordBuilderScreen.tsx | 1106 lines | ~926 |
| Question choice button copies | 4 files (identical 5-state logic) | 1 shared component |
| Glass-panel class copies | 4 inline instances | 1 constant |
| Word pill button copies | 6 inline instances | 1 component |
| DictEntry definitions | 3 files | 1 (types.ts) |
| Orphaned components | 1 (GlassCard) | 0 |
| Duplicate Tailwind strings | ~15 inline copies | 3 shared constants |

---

## Why It Slipped Through

Normal incremental development: each new screen added its own glass panel div, each new question type copied the same button pattern, and the orphaned GlassCard was never noticed because `glass-panel` CSS class was used directly. Detection required a comprehensive grep across all phonics files — something that doesn't happen during feature work.

---

## Pattern Detection

- **Bug class:** `code-quality`, `refactoring`, `dead-code`, `duplication`
- **Detection method:** Systematic grep for identical class strings across the phonics directory
- **Future prevention:** After 3rd instance of identical class string, extract to constant before adding 4th

---

## Related

- Obsidian: `boss-project/2026-06-20_16-00_Phonics_Game_Refactoring_v1.10.33.md`
- Previous: `boss-project/2026-06-05_17-00_Alphabet_Adventure_Refactoring_v1.9.42.md`
- Obsidian: `boss-project/2026-06-20_15-30_Word_Builder_Prediction_Feature_PostMortem.md`
