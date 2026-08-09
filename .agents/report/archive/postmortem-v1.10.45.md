# Post-Mortem: Phonics Game Bugs (v1.10.45)

## 1. Summary
During testing of the newly introduced Phonics Sound Path revamp (which added Grapheme Match, Minimal Pairs, and Stress activities), multiple critical bugs were observed:
1. New choice-based activities were graded as incorrect (`✗`) regardless of the user's correct choice.
2. Achievements unlock toasts never auto-dismissed.
3. Lessons targeting the `/æ/` sound group incorrectly focused on unrelated phoneme symbols (like `/p/` or `/s/`).

These bugs were resolved by:
1. Dynamic retrieval of the correct answer directly from the question object in `answerQuestion` inside `PhonicsClient.tsx`.
2. Stabilizing the `onDismiss` callback with `useCallback` and adding `ids` to `useEffect` inside `AchievementToast.tsx`.
3. Updating `generateIpaToWordQuestions`, `generateWordToIpaQuestions`, and `generateStressQuestions` in `question-generators.ts` to search for and prioritize target phonemes matching `phonemeIds` rather than defaulting to `word.phonemes[0]`.

All fixes have been validated with build compilation and test suite execution.

---

## 2. Symptom
- **Grading Issue**: User selects `a` for grapheme matching `/æ/` (correct choice), but the feedback panel shows `Incorrect ✗` and registers a wrong answer.
- **Toast Issue**: When an achievement badge is unlocked, the overlay toast appears on screen but never fades or auto-dismisses, blocking the game layout permanently unless clicked.
- **Phoneme Focus Mismatch**: In a stage focusing on `/æ/`, questions such as "Which word matches this symbol? /p/" or "Which word matches this symbol? /s/" are generated, asking the user to identify `/p/` or `/s/` instead of `/æ/`.

---

## 3. Root Cause
1. **Answer Grading**: The `answerQuestion` function in `PhonicsClient.tsx` had a hardcoded conditional routing block for grading correctness. It checked the question category to decide how to fetch the correct answer, but had no entry for the newly added categories (`grapheme`, `minimal-pairs`, `stress`), causing it to fall back to an incorrect key or empty string.
2. **Toast Dismissal**: The toast's `useEffect` register-and-dismiss timer was reset on every parent rerender because the `onDismiss` handler passed down was an inline function. Since the effect relied on `onDismiss` without dependency synchronization, the timer restarted constantly.
3. **Phoneme Focus**: In `generateIpaToWordQuestions`, `generateWordToIpaQuestions`, and `generateStressQuestions` inside `question-generators.ts`, the word pool was correctly filtered to contain the target `phonemeIds`. However, the generators extracted the target phoneme using `const phonemeId = word.phonemes[0];`. For a word like `propaganda` (selected because it contains `/æ/`), `word.phonemes[0]` is `/p/`. Thus, the generated question targeted `/p/` instead of the stage's target `/æ/`.

---

## 4. Why it produced the symptom
1. Without grading logic for the new formats, the correct answer variable evaluated to undefined, matching none of the selectable options and marking all inputs incorrect.
2. Inline arrow function handlers created new function references on every state change, re-triggering the toast component's mounting effects and clearing/restarting the `setTimeout` continuously.
3. By looking only at `word.phonemes[0]`, any selected vocabulary words that contained the target phoneme but did not start with it had their initial letter's phoneme assigned as the question's target.

---

## 5. Fix
1. **Grading**: Simplified `answerQuestion` to verify if the question contains `correctAnswer` directly. If yes, it uses it, eliminating the category-based switch statement block.
2. **Toast**: Wrapped `onDismiss` in `useCallback` in `PhonicsClient.tsx` and refactored `AchievementToast.tsx` to watch `[ids, onDismiss]` to prevent infinite effect triggers.
3. **Phoneme Mismatch**: Refactored the question generators to scan `word.phonemes` for any elements included in the stage's `phonemeIds` parameters:
   ```typescript
   let phonemeId = word.phonemes[0];
   if (phonemeIds && phonemeIds.length > 0) {
     const match = word.phonemes.find((p) => phonemeIds.includes(p));
     if (match) phonemeId = match;
   }
   ```

---

## 6. How it was found
- Tested via manual user screenshots in the local runtime.
- Mismatch traced using source analysis of `question-generators.ts` showing explicit `word.phonemes[0]` calls.

---

## 7. Why it slipped through
- **CI/Test Coverage Gap**: The existing unit tests in `tests/games/phonics.test.ts` checked that questions were generated, but did not assert that the generated question's target phoneme matched the lesson's config parameters.
- **Review Miss**: The inclusion of `word.phonemes[0]` was a legacy pattern carried over from stages where words were only selected if they started with the target sound.

---

## 8. Validation
- **Unit Tests**: Executed the Vitest suite using `npm run eval -- games`. All 132 tests passed successfully:
  - `tests/admin/games.test.ts` (15 tests)
  - `tests/games/phonics.test.ts` (13 tests)
  - `tests/games/g2p.test.ts` (80 tests)
  - `tests/games/phonemeSearch.test.ts` (21 tests)
  - `tests/games/vocab.test.ts` (3 tests)
- **Production Build**: Verified clean Next.js static page compilation and routing checks via `npm run build`.

---

## 9. Action items / follow-ups
- Update the phonics test suite to assert that the generated questions' target phoneme is exactly matching the filtered `phonemeIds` from the lesson config. (Owner: AI Builder / Test Engineer)
- Ensure all future question generators use matching arrays rather than hardcoded index offsets. (Owner: AI Builder)
