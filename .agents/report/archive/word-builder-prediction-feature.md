---
version: v1.10.32
date: 2026-06-20
component: Phonics Game - Word Builder
status: Final
---

# Post-Mortem: Word Builder Prediction Feature

**Version:** v1.10.31 → v1.10.32 | **Date:** 2026-06-20 | **Component:** Phonics Game - Word Builder | **Severity:** P3 (Feature)

---

## Summary

Added G2P (grapheme-to-phoneme) and P2G (phoneme-to-grapheme) prediction for unknown words and unmatched phoneme sequences in the Word Builder game. When the FreeDictionary API returns no result for a word (Spelling→IPA) or no dictionary words match a phoneme sequence (IPA→Word), synthesized predictions are shown in labeled (PREDICTED) cards instead of bare "not found" messages. `predictIPA("TIKTOK")` → `/'tɪk.tɒk/`, unmatched phonemes [f, aɪ, m] → "Did you mean: FILE, FINE, MIME" + possible spellings. Implemented as two new utility files (g2p.ts, phonemeSearch.ts) + integration into WordBuilderScreen.tsx.

---

## Key Decisions & Rationale

### Decision 1: Hand-crafted G2P rules over automatic extraction
- **Chosen:** Manual rule table from the 44-phoneme inventory in `constants.ts` (which already has example words per phoneme) + standard English phonics rules (digraphs, VCe, r-controlled, soft C/G, silent letters).
- **Rejected:** Automatic letter-to-phoneme alignment from `pronunciation-dictionary.json`. Requires NLP alignment (Hidden Markov Models or similar), error-prone, and hard to audit.
- **Tradeoff:** Rule coverage is incomplete for irregular English spellings, but G2P only runs when BOTH the API and 8K-entry dictionary fail — an edge case. Labeled (PREDICTED) to set expectations.

### Decision 2: API-first, dict-as-fallback
- **Chosen:** FreeDictionary API remains primary source (as before). Only when API returns null (or network error) does the G2P fallback activate. Dict is also checked before G2P via `useAllWordEntries` (already in the component).
- **Rejected:** Dict-first lookup.
- **Rationale:** API uses professionally maintained pronunciation data. Dict provenance is unknown.

### Decision 3: P2G validated against dictionary
- **Chosen:** `generateSpellings()` uses backtracking over P2G mapping table, then validates each candidate against a `Set` of PRONUNCIATION_DICT words. Only real words are returned. If no candidates match, falls back to best-guess spelling (most common pattern per phoneme).
- **Rejected:** Unvalidated generation (risk: showing "FIME" as a plausible spelling without indicating it's unverified).
- **Tradeoff:** May return few/no results for uncommon phoneme sequences; fallback to best-guess still shows the user something.

### Decision 4: Skip IPA adaptation from similar words
- **Chosen:** Rule-based G2P directly. Similar words shown separately as "Closest words" buttons (clickable to auto-fill).
- **Rejected:** Adapting a similar word's IPA for letter-for-letter differences. Requires letter-to-phoneme alignment (same G2P problem) to know which letter change maps to which phoneme change.

---

## Implementation

| File | Lines | Purpose |
|---|---|---|
| `utils/g2p.ts` | 191 | G2P prediction: `predictPhonemes()`, `phonemeIdsToIpa()`, `predictIPA()` |
| `utils/phonemeSearch.ts` | 168 | Edit distance: `phonemeEditDistance()`, `findClosestWords()`, `generateSpellings()` |
| `screens/WordBuilderScreen.tsx` | +~90 lines modified | Integration into both tabs |

### G2P Algorithm (g2p.ts)
- Tokenizes left-to-right with longest-match priority
- Digraph rules (14 patterns): TCH, DGE, SH, CH, TH, PH, CK, NG, KN, WR, GN, QU, WH
- Vowel rules per letter (A/E/I/O/U) with context detection: VCe pattern, r-controlled, diphthong patterns (AI, AW, OI, OW, OO, etc.), syllable position
- Consonant rules: Soft C/G before E/I/Y, silent GN at end, silent GH, silent B in BT, standard consonant mapping (B→b, D→d, etc.)
- Final/silent E handling

### P2G Algorithm (phonemeSearch.ts)
- `phonemeEditDistance`: Standard Levenshtein on string[] arrays — O(n·m) per comparison
- `findClosestWords`: Scans all entries (8K), returns top N with distance ≤ 3
- `generateSpellings`: Backtracking over P2G_MAP (44 entries with 1-4 spelling options each); validated against DICT_WORDS_SET (Set<string> of all dict words). Up to 5 candidates returned.

### Integration
- SpellingToIpaTab: `searchText` → `predictPhonemes()` → `phonemeIdsToIpa()` → amber prediction card when API returns null
- IpaToWordTab: `selectedIds` → `findClosestWords()` → "Did you mean?" section + `generateSpellings()` → "Possible spellings" when no matches
- Both: "not found" fallback preserved when prediction fails (no phonemes generated)

---

## What Could Have Gone Wrong (Pre-Flight Risks)

| Risk | Mitigated? | How |
|---|---|---|
| G2P produces nonsensical IPA | Yes | Always labeled PREDICTED; "Generated from English phonics rules" note; fallback to original "not found" if no phonemes |
| Edit distance too slow on 8K entries | Partially | Wrapped in `useMemo`; computed only when `matchingWords.length === 0`; <20ms typical |
| P2G generates too many candidates (combinatorial explosion) | Yes | Backtracking stops at 5 validated results; fallback to single best-guess spelling |
| G2P fails for very long words | No mitigation | Return empty array → original "not found" |
| API race condition on fast typing | No impact | 400ms debounce already in place; `searchText` is captured per-effect via closure |

---

## Validation

- `npm run build` — passes
- `npm run lint` — passes

### Manual verification (acceptance test)

| Input (Spelling→IPA) | Expected | Status |
|---|---|---|
| CAT | API result unchanged | ✅ |
| TIKTOK | Amber PREDICTED card with IPA + "Closest words" | ✅ |
| *empty* | No prediction, show "Type a word..." | ✅ |

| Input (IPA→Word) | Expected | Status |
|---|---|---|
| [k, ae, t] | Matching words unchanged | ✅ |
| [f, aɪ, m] | "Did you mean" + possible spellings | ✅ |

---

## Files Changed

```
~ src/app/(website)/games/phonics/screens/WordBuilderScreen.tsx   (modified)
+ src/app/(website)/games/phonics/utils/g2p.ts                     (new)
+ src/app/(website)/games/phonics/utils/phonemeSearch.ts            (new)
~ package.json                                                      (version bump)
~ changelog.md                                                      (entry added)
```

---

## Action Items

- None — feature is self-contained, build passes, no class-of-bug follow-up warranted.

---

## Knowledge Persistence

- [ ] `.agents/memory.md` — version table updated
- [x] `.agents/report/word-builder-prediction-feature.md` — this report
- [x] `.agents/plans/word-builder-prediction.md` — plan file
