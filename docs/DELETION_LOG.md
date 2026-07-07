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

## [2026-06-26] Refactor Clean — Dead Code Cleanup

### Unused Files Deleted

| File | Reason | Lines |
|------|--------|-------|
| `scripts/harness-audit.js` | Only referenced in eslint `globalIgnores` config | ~50 |

### Unused Exports Removed (removed `export` keyword, kept internal code)

**`cards/cards.ts` (Alphabet Adventure)** — Removed exports/entirely removed:
- `TIER_POINTS` — no external usage (kept as internal, used by `loadCollection`)
- `TIER_COLORS` — entirely unused, removed entirely (36 lines)
- `CARD_EMOJIS` — entirely unused, removed entirely (27 lines)
- `emptyCollection` — no external usage (kept as internal, used by `loadCollection`)

**`constants.ts` (Alphabet Adventure)** — Removed exports:
- `THAI_NAMES` — kept as internal, used by `generateThaiRevertRound`
- `PHONICS_SOUNDS` — kept as internal, used by `generatePhonicsRevertRound`
- `generateThaiRound` — entirely unused even internally, removed (17 lines)
- `generatePhonicsRound` — entirely unused even internally, removed (17 lines)

**`sprites.ts` (Phonics)** — Removed exports (all unused even internally, removed entirely):
- `SUN_16`, `SUN_16B`, `CLOUDS`, `BIRD_V`, `FISH`, `BOAT`, `DOCK`, `SPLASH`, `ROTATE_PHONE`
- `drawSpriteFlipped`, `drawMascotIdle`
- `PALETTE` — kept internal, used by `drawSprite`

**`types.ts` (Phonics)** — Removed:
- `getCorrectAnswerFromQuestion` — confirmed 0 callers anywhere (52 lines)

**`mascot-bridge.ts`** — Removed:
- `PHONICS_THAI_NAMES`, `getPhonicsMascot`, `getPhonicsThaiName` — no references
- Kept `PHONICS_MASCOTS` (imported by mascot-data.ts)

**`mascot-data.ts`** — Removed:
- `MASCOTS`, `MASCOT_MAP`, `getAllMascots`, `getAnyMascot` — no external references
- Kept `ALL_MASCOTS`, `ALL_MASCOT_MAP` (imported by MascotCompanion, MascotAvatar)

**`analytics/index.ts`** — Removed re-export:
- `getConsent`, `setConsent`, `hasConsent` from consent module

**`analytics/aggregations.ts`** — Removed exports:
- `topPagesAggregation`, `topEventsAggregation`, `deviceBreakdownAggregation`, `referrerBreakdownAggregation`
- All kept as internal (used by `aggregateTopPages` etc.)

**`charts/index.ts`** — Removed re-export:
- `TrendBadge` (component itself IS used by `SummaryCard`)

**`StockDataContext.tsx`** — Removed export:
- `StockData` interface (kept as internal, extended by `ExtendedStockData`)

**`scripts/ipa-parser.ts`** — Removed export:
- `normalizeIpa` (kept as internal, used within the file)

### Impact

| Metric | Value |
|--------|-------|
| Files deleted | 1 |
| Files modified | 11 |
| Lines of code removed | **~450** |
| Unused exports cleaned | 30+ |

### Verification

- `npm run build` — passes (ignoreBuildErrors: true)
- `npx vitest run` — all pass (pre-existing DB-dependent failures unchanged)
- No new lint errors introduced

## [2026-07-07] Refactor Clean — Dead Code & Duplicate Consolidation

### Unused Function Removed

| File | Function | Reason | Lines |
|------|----------|--------|-------|
| `question-generators.ts` | `scoreToPlacementTier()` | Zero references in production code AND tests (confirmed via grep) | 5 |

### Unused DevDependency Removed

| Package | Reason |
|---------|--------|
| `@testing-library/react` | Never imported anywhere in codebase or tests (vitest uses `node` environment, no DOM testing) |

### Duplicate Code Consolidated

**`parseTagString` / `parseWordArray`** — Two identical functions in `format.ts` and `validation.ts`:
- Kept `parseTagString` in `format.ts` as canonical version
- Removed duplicate `parseWordArray` from `validation.ts`
- Updated `admin/words/actions.ts` to import `parseTagString` (aliased as `parseWordArray`)

**`useFocusTrap`** — Two implementations:
- `src/hooks/useFocusTrap.ts` (robust: uses `requestAnimationFrame` + `useCallback`)
- `src/lib/hooks/useFocusTrap.ts` (simpler: direct `useEffect`)
- Consolidated to use robust version from `src/hooks/useFocusTrap.ts`
- Updated `ModeSelectModal.tsx` and `CardRevealModal.tsx` imports
- Deleted `src/lib/hooks/useFocusTrap.ts`

### Impact

| Metric | Value |
|--------|-------|
| Files deleted | 1 |
| Files modified | 5 |
| Lines of code removed | ~60 |
| Unused dependency removed | 1 |

### Verification

- `npm run build` — compiled successfully
- `npx vitest run tests/games/phonics.test.ts tests/games/g2p.test.ts tests/games/phonemeSearch.test.ts tests/unit/phonics/features.test.ts tests/vocab-generators.test.ts tests/unit/phonics/question-generators.test.ts` — 196/196 passed
- No new lint errors introduced
