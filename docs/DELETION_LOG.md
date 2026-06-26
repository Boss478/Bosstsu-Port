# Code Deletion Log

## [2026-06-24] Refactor Session — Dead Code Cleanup

### Unused Files Deleted

| File | Reason | Lines |
|------|--------|-------|
| `src/app/(website)/games/phonics/components/PathNode.tsx` | No imports from anywhere; component never rendered | 82 |
| `src/hooks/useSpeechRecognition.ts` | No imports from anywhere; hook never used | 153 |
| `scripts/words/dictionary-wordlist.ts` | No imports from anywhere; never referenced by any script or npm command | 133 |

### Unused Exports Removed (from barrel, kept as internal functions)

**`question-generators.ts`** — Removed 15 functions from the barrel export block that were only used internally within the file (no external imports):
- `selectWordByCefr`, `weightedRandomSelect`, `generatePhonicsQuestions`
- `generateSpellingQuestions`, `generateDefinitionQuestions`, `buildPlacementTest30`
- `generatePracticeQuestions`, `generateIpaToWordQuestions`, `generateWordToIpaQuestions`
- `generateSynonymQuestions`, `generateGraphemePatternQuestions`
- `generateMinimalPairsQuestions`, `generateStressQuestions`
- `generateExerciseQuestions`, `buildActivityRetryQuestions`

Kept in barrel (externally imported): `generateCardFlipCards`, `buildQuestions`, `buildRetryQuestions`, `computeCorrectAnswer`, `generatePhonemeMatchRound`, `generateSoundSortQuestions`, `generateRhymeTimeQuestions`, `generateSpeedSpellQuestions`, `generateSyllableSmashQuestions`

### Unused Functions Removed

| File | Function | Reason | Lines |
|------|----------|--------|-------|
| `constants.ts` | `getQuestionCount()` | Exported but never called anywhere (dead code from earlier changelog entry) | 15 |
| `constants.ts` | `SaveData` import | Became unused after `getQuestionCount` removal | 1 |
| `analytics.ts` (alphabet-adventure) | `clearAnalytics()` | Exported but never called anywhere | 5 |
| `question-generators.ts` | `buildActivityRetryQuestions()` | Defined (70 lines) but never called anywhere | 70 |

### Unused Sprite Data Removed

| Sprite | Reason | Lines |
|--------|--------|-------|
| `BUILDING_PHONICS` (16×24) | Exported but never used anywhere | 31 |
| `AVATAR_NOX` full-body (16×16) | Only `AVATAR_NOX_HEAD` is used by MascotCanvas | 22 |
| `AVATAR_MIRA` full-body (16×16) | Only `AVATAR_MIRA_HEAD` is used | 22 |
| `AVATAR_CHIP` full-body (16×16) | Only `AVATAR_CHIP_HEAD` is used | 22 |
| `AVATAR_FOX` full-body (16×16) | Only `AVATAR_FOX_HEAD` is used | 22 |
| `AVATAR_CAT` full-body (16×16) | Only `AVATAR_CAT_HEAD` is used | 22 |
| `AVATAR_BEAR` full-body (16×16) | Only `AVATAR_BEAR_HEAD` is used | 22 |
| `AVATAR_BUNNY` full-body (16×16) | Only `AVATAR_BUNNY_HEAD` is used | 22 |
| `AVATAR_PENGUIN` full-body (16×16) | Only `AVATAR_PENGUIN_HEAD` is used | 22 |
| `AVATAR_ALIEN` full-body (16×16) | Only `AVATAR_ALIEN_HEAD` is used | 22 |
| `AVATAR_NINJA` full-body (16×16) | Only `AVATAR_NINJA_HEAD` is used | 22 |

### Impact

| Metric | Value |
|--------|-------|
| Files deleted | 4 |
| Files modified | 4 |
| Lines of code removed | **740** |
| Unused exports cleaned | 26 |
| Stale test file removed (untracked, from dropped WIP) | 1 |
| Unused dependencies removed | 0 (postcss/tailwindcss depcheck false positives) |

### Verification

- `npm run build` — passes
- `npm run lint` — passes
- `npx vitest run tests/games/phonics.test.ts` — 13/13 passed
- All full-body avatar sprites retained as `_HEAD` variants for runtime rendering
