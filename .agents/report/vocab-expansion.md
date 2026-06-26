# Vocab Activity Expansion — Engineering Report

## Summary

Added 4 new Vocab question types (antonyms, collocations, fill-blank, word-assoc) to the Phonics game, with CEFR + accuracy-based question count scaling, 8-activity stage configuration, and complete UI integration. Delivered in commit `0c25534` (v1.10.48).

## Architecture & Files

### New Files
| File | Purpose |
|------|---------|
| `components/FillBlankQuestion.tsx` | Renders blanked-sentence card with 4-option grid + CompanionHint |
| `components/WordAssocQuestion.tsx` | Renders target word + word-class button picker (noun/verb/adjective/adverb/preposition/pronoun) |

### Modified Files
| File | Change |
|------|--------|
| `types.ts` | Added 4 types to `GameCategory`/`ActivityType`, 4 question interfaces to `Question` union, `antonyms: string[]` to `WordData` |
| `question-generators.ts` | Created 4 generators after `generateSynonymQuestions`, wired into `buildQuestions`/`buildRetryQuestions`/`buildActivityRetryQuestions`/`computeCorrectAnswer` |
| `constants.ts` | Added `getVocabActivityLength` (CEFR + accuracy scaling), updated `getVocabActivitiesForStage` → 8 activities |
| `GameScreen.tsx` | Added `isAntonyms`/`isFillBlank`/`isWordAssoc`/`isCollocations` flags + rendering branches |
| `StageListScreen.tsx` | Added 4 icon/color entries, dynamic `{completedCount}/{N}` |
| `words.ts` | Added `antonyms: []` to 91 legacy word entries |
| `all-words.json` | Added `"antonyms": []` to all 5648 words via Python script |

### Question Rendering Logic
- `isSynonyms || isAntonyms || isCollocations` → `SynonymQuestionComponent` (same shape)
- `isFillBlank` → `FillBlankQuestionComponent` (blanked sentence)
- `isWordAssoc` → `WordAssocQuestionComponent` (word-class picker)
- Exercise sub-questions unchanged (exercise doesn't generate new types)

### CEFR Scaling
```
A1=6, A2=8, B1=10, B2=10, C1=12, C2=12
                  ↓ + accuracy adjustment (< 0.4 → +2, > 0.8 → -2)
                  ↓ clamp to [4, 14]
```

## Key Discoveries

### 1. Generators Didn't Exist (Critical)
Earlier session summaries claimed `generateAntonymQuestions`, `generateFillBlankQuestions`, `generateWordAssociationQuestions`, `generateCollocationQuestions` existed internally. **They did not.** Grep returned 0 results. Created all 4 from scratch. Lesson: **verify session summaries against actual code — don't trust compressed state.**

### 2. Export Block Truncation (17 Test Failures)
When inserting 4 new generator functions after `generateSynonymQuestions`, the edit tool replaced more content than intended — the entire export block was reduced from 22 entries to 9. This caused `selectWordByCefr`, `weightedRandomSelect`, and other internal functions to be unexported, breaking 17 tests. Root cause: the edit match window was too broad.

### 3. all-words.json Format Destabilization
The Python script that added `"antonyms": []` to all 5648 words reformatted the entire JSON file (111877 line changes). While runtime behavior was unchanged, diff size made review impractical. Future data patches should use targeted Python scripts that preserve original formatting (sort_keys, indent).

## Post-Mortem: Export Block Truncation

**Root cause:** The `edit` tool's `oldString` match included content on both sides of the insertion point. When the surrounding code matched, the replacement string omitted the original export block, truncating it.

**Fix:** Restored the full original 22-entry export block from `git show HEAD` and added the 4 new entries.

**Why it slipped through:** The `tsc --noEmit` check passed because the missing exports only affected internal-use functions that weren't re-exported. Tests caught it — 17 failures across `features.test.ts` and `question-generators.test.ts`.

## Validation
- `npm run build` — exit 0
- `npx vitest run` — 45 pass, 1 pre-existing fail (`imports useLocalStorage`)
- 25 new tests in `tests/vocab-generators.test.ts`

## Open Questions
- Should `computeCorrectAnswer` be kept or removed? Currently dead code (0 callers in production), only tested by test file. Decision: kept for now since generators return it and future features may use it.
