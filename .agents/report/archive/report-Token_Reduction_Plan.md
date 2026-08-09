# Plan: Reduce Token Usage — Less Token, More Efficient

**Created:** 2026-07-13 11:00  
**Version:** v1.10.63  
**Status:** Planning  

---

## Objective

Reduce total token consumption across **two dimensions**:
1. **Session/Agent efficiency** — consume fewer tokens per AI session (immediate, no code changes)
2. **Codebase size** — reduce source file sizes so AI reads/writes fewer tokens (code changes, phased)

---

## Executive Summary

Current codebase: **~28,000 lines** of TS/TSX source, **~7,900 lines** of tests.  
Top 10 files account for **~15,000 lines** (54% of all source).  
Session report: 125.5M tokens for a single session, with `read` tool consuming 34.5% and tool definitions consuming ~13K tokens per call.

**Three-phased approach:** Immediate session habits → High-impact code reductions → Ongoing discipline.

---

## Phase 1: Session/Agent Token Efficiency (Immediate — Zero Code Changes)

These require no code changes — they're habits and configuration that reduce token burn per session.

### 1.1 Use `compress` More Aggressively

| Current | Recommended |
|---------|-------------|
| Compress only when sections feel "closed" | Compress every 3-5 tool calls that close a topic |
| Let raw context accumulate | Compress research findings, dead-end attempts, and verbose tool outputs immediately |
| Skip compression for exploration | Always compress exploration results into dense findings |

**Impact:** Each compression replaces 10-50K tokens of raw conversation with ~500-1,500 tokens of summary. Over a full session: **30-50% reduction in carried context.**

### 1.2 Batch Independent Tool Calls

| Current | Recommended |
|---------|-------------|
| Sequential reads (3-5 separate calls) | Parallel reads in a single message |
| Sequential subagent launches | Launch 3-4 subagents in parallel |
| Forgetting to batch | Always scan: "can these 3 calls be parallel?" |

**Impact:** Each parallel batch saves ~1-2K tokens of overhead (tool definitions repeated per message). The current session had 155 `grep` + 344 `read` calls — batching could cut message count by 40%.

### 1.3 Avoid Redundant Reads

| Current | Recommended |
|---------|-------------|
| Re-read files already in context | Reference already-read content |
| Read entire files for small edits | Read with offset/limit, target only needed lines |
| Read 2000-line default | Use `limit` parameter (e.g., `limit: 50` for targeted reads) |

**Impact:** `read` tool was 34.5% of all tokens in the sample session. Targeted reads could cut this by 50%.

### 1.4 Subagent Batching Strategy

| Current | Recommended |
|---------|-------------|
| One subagent per task | Group related explorations into one subagent |
| Detailed subagent prompts | Concise prompts with clear "return this data only" instructions |
| 23 subagents = 309 calls = 20.9M tokens | Target: 12-15 subagents per heavy session |

**Impact:** Subagent overhead (prompt, tools, definitions) costs ~500-800K tokens per child. Fewer subagents = significant savings.

### 1.5 Use Question Tool with Presets

The `question` tool with preset options is more cacheable than free-form conversation. When asking the user:
- Provide 3-5 concrete options
- Let them pick, don't ask open-ended

**Impact:** Better cache hit rates (currently only 13%). Each cached prompt saves ~10-20K tokens.

### 1.6 Load Skills Lazily

Don't load `development-workflow` or other large skills unless the task requires them. Each skill load costs ~5-15K tokens.

**Impact:** Save 5-15K per skill load not needed.

### 1.7 Session Start Protocol Efficiency

When starting a session:
- Read `.agents/memory.md` only (not full vault scan)
- Skip full directory tree reads — use `glob`/`grep` for targeted lookups
- Only load relevant files, not entire directories

---

## Phase 2: Codebase Reduction (High Impact — Code Changes)

### 2.1 [HIGH] Phonics — Remove 81 Duplicate Legacy Words

**File:** `src/app/(website)/games/phonics/words.ts`  
**Current:** 1,509 lines, ~50KB  
**Problem:** 81 of 91 `LEGACY_WORDS` entries duplicate those already in `all-words.json`  
**Fix:** Remove duplicates, keep only 10 unique entries  
**Savings:** ~1,200 lines (80% of file)  
**Risk:** Low — pure data removal, no logic change  
**Verification:** All phonics tests must pass; build must pass  
**Dependency:** None — `all-words.json` already has the data

### 2.2 [HIGH] Admin — Create Shared List Page Component

**Files:** `src/app/admin/portfolio/page.tsx`, `gallery/page.tsx`, `games/page.tsx`, `resources/page.tsx`  
**Current:** ~732 total lines across 4 files  
**Pattern:** 80% identical — only model name, sort field, and table columns vary  
**Fix:** Create `AdminListPage` HOF or wrapper sharing: search params, pagination setup, pagination JSX, table shell, outer container, breadcrumb/title/add button  
**Savings:** ~290 lines  
**Risk:** Medium — requires careful abstraction to not break per-entity differences  
**Dependency:** Must create shared component(s) first, then refactor each page

### 2.3 [HIGH] Alphabet Adventure — SVG Wrapper for CardIllustrations

**File:** `src/app/(standalone)/games/alphabet-adventure/cards/CardIllustrations.tsx`  
**Current:** 969 lines  
**Pattern:** 26 identical SVG wrappers (6 lines each = 156 lines of boilerplate)  
**Fix:** Create shared `SvgWrapper` component or factory function  
**Savings:** ~130 lines  
**Risk:** Low — mechanical refactor, pure presentation  
**Verification:** Visual check of card illustrations; build must pass

### 2.4 [MEDIUM] Phonics — Merge Synonym/Antonym/Collocation Generators

**File:** `src/app/(website)/games/phonics/question-generators.ts`  
**Current:** 1,911 lines  
**Pattern:** `generateSynonymQuestions`, `generateAntonymQuestions`, `generateCollocationQuestions` have the identical structure (only the field name differs)  
**Fix:** Create `generateFieldQuestions(field, count, level, phonemeIds, words)` — pass `'synonyms'`, `'antonyms'`, `'collocations'` as field param  
**Savings:** ~100 lines  
**Risk:** Low — pure refactor, same logic  
**Verification:** All phonics tests must pass

### 2.5 [MEDIUM] Alphabet Adventure — Extract Duplicated Helpers in useGameActions

**File:** `src/app/(standalone)/games/alphabet-adventure/hooks/useGameActions.ts`  
**Current:** 771 lines  
**Patterns:**
- Streak toast logic duplicated in `handleAnswer` and `checkTyping` (8 lines × 2 = 16 lines)
- Card-drop reset block duplicated (13 lines × 2 = 26 lines)
- Analytics event pattern duplicated (15 lines × 4 = 60 lines)  
**Fix:** Extract `triggerStreakToast()`, `resetCardDrop()`, and `pushGameAnalytics()` helpers  
**Savings:** ~75 lines  
**Risk:** Low-medium — careful not to break state references  
**Verification:** Alphabet adventure tests must pass

### 2.6 [MEDIUM] Phonics — Remove Redundant PHONEME_EXAMPLE_WORDS

**File:** `src/app/(website)/games/phonics/constants.ts`  
**Current:** 42 lines of data fully derivable from `PHONEMES[].example`  
**Fix:** Remove the constant, replace references with computed value  
**Savings:** ~42 lines  
**Risk:** Low  
**Verification:** All phonics tests pass

### 2.7 [MEDIUM] Admin — Extract Test Boilerplate

**Files:** `tests/admin/portfolio.test.ts`, `gallery.test.ts`, `games.test.ts`, `resources.test.ts`, `tools.test.ts`  
**Current:** 13 lines of identical boilerplate per file × 5 = 65 lines duplicated  
**Fix:** Create `tests/helpers/admin-test-setup.ts` with shared mocks and test lifecycle  
**Savings:** ~52 lines  
**Risk:** Low  
**Verification:** All admin tests pass

### 2.8 [LOW] CardFrame — Programmatic Gradient Generation

**File:** `src/app/(standalone)/games/alphabet-adventure/cards/CardFrame.tsx`  
**Current:** ~180 lines of per-tier gradient definitions  
**Fix:** Generate gradients programmatically from `TIER_FRAME` data  
**Savings:** ~120 lines  
**Risk:** Medium — SVG rendering must be visually identical

### 2.9 [LOW] Phonics — Extract Large Data to JSON

**Files:** `constants.ts` sections (COMPANIONS 569L, STAGES 392L, ACHIEVEMENTS 205L)  
**Fix:** Move to JSON files, import at runtime  
**Savings:** ~1,166 lines removed from TS, added as JSON  
**Risk:** Medium — changes import paths, needs verification  
**Note:** Lower priority since data is inherently verbose regardless of format

### 2.10 [LOW] Delete Empty/Legacy Files

- `sprites.json` (0 bytes placeholder) — delete
- Any other empty/dead files found during cleanup

---

## Phase 3: Continuous Optimization (Ongoing)

### 3.1 Code Review Token Budget

Before merging any PR, ask: "Does this add more tokens than necessary?"
- Prefer one-liners over multi-line conditionals
- Prefer early returns over nested ifs
- Prefer data-driven patterns over switch/if chains

### 3.2 Component Size Budget

Set a soft limit of **400 lines per component file**. Files exceeding this should justify why (e.g., SVG data, word lists).

### 3.3 Keep Duplication Scanner Active

Every 3-4 sessions, run a quick scan for new duplication patterns using:
```bash
# Check for similar admin page patterns
# Check for test boilerplate growth
# Check for large file growth
```

### 3.4 Tool Call Efficiency Checklist

Before each tool call, consider:
1. Can this be batched with other calls? (parallel)
2. Do I need the full file or just 50 lines? (`limit` parameter)
3. Did I already read this file? (reference context)
4. Is this a subagent task or can I do it directly?

---

## Impact Summary

| Category | Lines Saved | Token Impact | Effort | Risk |
|----------|-------------|-------------|--------|------|
| **Phase 1 — Session Habits** | N/A | **30-50% per session** | None | None |
| 2.1 — Remove duplicate words | ~1,200 | ~60K/batch read | Low | Low |
| 2.2 — Shared admin list page | ~290 | ~15K/batch read | Medium | Medium |
| 2.3 — SVG wrapper | ~130 | ~7K/batch read | Low | Low |
| 2.4 — Merge generators | ~100 | ~5K/batch read | Low | Low |
| 2.5 — useGameActions helpers | ~75 | ~4K/batch read | Low-Med | Medium |
| 2.6 — Remove PHONEME_EXAMPLE_WORDS | ~42 | ~2K/batch read | Low | Low |
| 2.7 — Admin test boilerplate | ~52 | ~3K/batch read | Low | Low |
| 2.8 — Programmatic gradients | ~120 | ~6K/batch read | Medium | Medium |
| 2.9 — Data to JSON | ~1,166 | ~58K/batch read | Medium | Medium |
| **Total Code Changes** | **~3,177 lines** | **~160K saved per full read** | | |

*Note: Token estimates assume 50 tokens/line average for TS/TSX, excluding whitespace.*

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/admin/AdminListPage.tsx` | Shared HOF for CRUD list pages |
| `src/components/admin/AdminPagination.tsx` | Pagination component |
| `src/components/shared/SvgWrapper.tsx` | Shared SVG wrapper for illustrations |
| `tests/helpers/admin-test-setup.ts` | Shared admin test boilerplate |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/(website)/games/phonics/words.ts` | Remove 81 duplicate legacy words |
| `src/app/(website)/games/phonics/question-generators.ts` | Merge synonym/antonym/collocation generators |
| `src/app/(website)/games/phonics/constants.ts` | Remove PHONEME_EXAMPLE_WORDS |
| `src/app/(standalone)/games/alphabet-adventure/cards/CardIllustrations.tsx` | Use shared SvgWrapper |
| `src/app/(standalone)/games/alphabet-adventure/hooks/useGameActions.ts` | Extract duplicated helpers |
| `src/app/(standalone)/games/alphabet-adventure/cards/CardFrame.tsx` | Programmatic gradients |
| `src/app/admin/portfolio/page.tsx` | Use AdminListPage |
| `src/app/admin/gallery/page.tsx` | Use AdminListPage |
| `src/app/admin/games/page.tsx` | Use AdminListPage |
| `src/app/admin/resources/page.tsx` | Use AdminListPage |
| `tests/admin/portfolio.test.ts` | Use shared test setup |
| `tests/admin/gallery.test.ts` | Use shared test setup |
| `tests/admin/games.test.ts` | Use shared test setup |
| `tests/admin/resources.test.ts` | Use shared test setup |
| `tests/admin/tools.test.ts` | Use shared test setup |

## Files to Delete

| File | Reason |
|------|--------|
| `src/app/(website)/games/phonics/sprites.json` | Empty placeholder (if exists) |

---

## Execution Order

```
Phase 1 (habits) → start immediately
  │
  ▼
2.6 Remove redundant constants ───────────────────────────── easiest
2.1 Remove duplicate words ───────────────────────────────── high impact, low risk
2.6 Delete sprites.json ──────────────────────────────────── 1 file deletion
  │
  ▼
2.3 SVG wrapper (CardIllustrations) ──────────────────────── mechanical refactor
2.4 Merge generators (question-generators.ts) ────────────── pure refactor
  │
  ▼
2.5 Extract useGameActions helpers ───────────────────────── logic refactor
2.8 Programmatic gradients (CardFrame) ───────────────────── visual refactor
  │
  ▼
2.2 Shared admin list page ───────────────────────────────── medium complexity
2.7 Shared admin test setup ──────────────────────────────── test refactor
  │
  ▼
2.9 Extract data to JSON ─────────────────────────────────── optional, lower priority
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Admin shared component breaks entity-specific features | Low | High | Incremental refactor, one page at a time |
| SVG visual change from wrapper refactor | Low | Medium | Visual comparison before/after |
| Duplicate word removal breaks tests | Very Low | Low | All tests pass before merging |
| useGameActions helper extraction breaks state | Low | High | Extract one helper at a time, test each |
| Gradient programmatic generation changes visuals | Medium | Medium | Compare screenshots |

---

## Session Token Protocol (Quick Reference Card)

```
┌────────────────────────────────────────────────────┐
│              TOKEN EFFICIENCY CHEAT SHEET           │
├────────────────────────────────────────────────────┤
│                                                    │
│  BEFORE EVERY TOOL CALL, ASK:                      │
│                                                    │
│  □ Can I parallel this with other calls?           │
│  □ Do I need the full file or just 50 lines?       │
│  □ Have I already read this? (check context)       │
│  □ Is this a subagent task or direct work?         │
│                                                    │
│  EVERY 5 MESSAGES:                                 │
│  □ Can I compress a closed section?                │
│  □ Are there dead ends I can compress?             │
│                                                    │
│  SESSION START:                                    │
│  □ Read .agents/memory.md only                     │
│  □ Skip full directory scans                       │
│  □ Use glob/grep for targeted lookups              │
│                                                    │
│  PREFER:                                           │
│  □ question tool with presets (cacheable)          │
│  □ subagents for research (offloads context)       │
│  □ small targeted reads over full file reads       │
└────────────────────────────────────────────────────┘
```
