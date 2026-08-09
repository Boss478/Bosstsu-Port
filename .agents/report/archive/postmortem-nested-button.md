---
version: v1.10.53
date: 2026-06-29
component: LibraryScreen (Phonics Game)
status: Final
---

# Post-Mortem: Nested `<button>` in LibraryScreen Phoneme Grid

**Version:** v1.10.53 | **Date:** 2026-06-29 | **Component:** LibraryScreen | **Severity:** P3

---

## Summary

The phoneme grid in LibraryScreen (Soundbook tab) had a `<button>` element nested inside another `<button>`, violating the HTML spec ("button cannot be a descendant of button"). React logged a hydration warning in the browser console. Fixed by restructuring into sibling elements: outer `<div>` wrapper, card `<button>`, and absolute-positioned practice `<button>`.

---

## Customer/User Impact

| Dimension | Assessment |
| --------- | ---------- |
| Users affected | All users viewing the Soundbook tab with at least one unlocked phoneme |
| Data integrity | None |
| Business impact | None |
| User-visible symptom | React hydration warning in console (invisible to end user) |
| Workaround available? | Yes — bug is cosmetic, no functional impact |

---

## Symptom

React hydration warning in browser console when navigating to the Soundbook tab with unlocked phonemes:

```
In HTML, button cannot be a descendant of button.
```

No functional breakage — `e.stopPropagation()` on the inner button's `onClick` prevented the outer button's handler from firing, so the app behavior was correct by accident.

---

## Root Cause

**File:** `LibraryScreen.tsx:238` (inner) nested inside `LibraryScreen.tsx:215` (outer)

The phoneme grid card (line 215) was a `<button>` wrapping all card content. Inside it, a "Practice this phoneme" button (line 238) was rendered as a nested `<button>`:

```
<button onClick={setSelectedPhoneme(p)}>     ← outer (line 215)
  <span>{p.example}</span>
  <div>
    <i className="fi fi-sr-volume" />         ← decorative icon (fine)
    <button onClick={handleStartPractice(p)}>  ← nested button (INVALID, line 238)
      <i className="fi fi-sr-play" />
    </button>
  </div>
  <span>{p.ipa}</span>
</button>
```

The inner button used `e.stopPropagation()` to prevent the outer handler from firing — correct logic, but the DOM structure was still invalid per the spec.

---

## Why It Produced The Symptom

React's hydration during SSR/CSR reconciliation validates DOM nesting rules and emits warnings for spec violations. The nested `<button>` was detected during hydration and produced the console warning. The app continued to function correctly because `e.stopPropagation()` prevented the outer click handler from running when the inner button was clicked.

---

## Fix

**File:** `LibraryScreen.tsx:214-286`

Restructured the phoneme card into sibling elements under a `<div>` wrapper:

```tsx
<div key={p.id} className="relative">
  <button onClick={setSelectedPhoneme(p)} ...>         ← card (sibling 1)
    <span>{p.example}</span>
    <i className="fi fi-sr-volume" />                   ← decorative, stays inside
    <span>{p.ipa}</span>
  </button>
  <button onClick={handleStartPractice(p)}               ← practice (sibling 2, absolute positioned)
    className="absolute top-2 right-2 z-10 ..."
  >
    <i className="fi fi-sr-play" />
  </button>
</div>
```

Key decisions:
- Outer `<button>` → `<div>` wrapper with `relative` positioning
- Card stays as `<button>` (no `relative` needed, gained `w-full` for grid fill)
- Practice `<button>` is absolute-positioned sibling (`top-2 right-2 z-10`)
- Only rendered for unlocked phonemes (no practice button on locked cards)
- Removed the `div.gap-1` wrapper; volume icon is now standalone (decorative)

---

## How It Was Found

- **Repro:** Open any phoneme in the Soundbook tab, check browser console
- **Tools:** Browser console inspection during full UI test of Phonics Game (Phase 5: Path Hub)
- **Confirmation:** Console warning visible on every unlocked phoneme card render

---

## Why It Slipped Through

- **Review miss:** The nested `<button>` was introduced during the initial Soundbook implementation (v1.10.x). The `e.stopPropagation()` pattern masked the spec violation functionally, and code review focused on correctness of behavior rather than DOM spec compliance.

---

## Time-to-Resolution Metrics

| Metric | Value |
| ------ | ----- |
| Bug introduced | v1.10.13 (Soundbook tab initial implementation) |
| Bug discovered | 2026-06-29 (browser UI test) |
| Time in wild | ~6 months |
| Fix started | 2026-06-29 |
| Fix deployed | v1.10.53 |
| Time to fix | ~30 minutes |
| Total impact duration | ~6 months |

---

## Pattern Detection

**Primary bug class:** `ui-ux`

**Recurring?** No — first instance of nested interactive element in this codebase. A full codebase search confirmed no other instances of nested `<button>` patterns.

---

## Validation

- `npm run build` — passes
- `npm run lint` — no new errors from `LibraryScreen.tsx`
- `npm test` — 519/704 passed (185 skipped, 15 MongoDB failures — all pre-existing)
- Browser: Soundbook tab loads with zero console warnings
- Browser: practice icon click correctly calls `handleStartPractice` without triggering card click

### Code Coverage Correlation

| Metric | Value |
| ------ | ----- |
| Affected line count | ~21 (214-280 rewritten to 214-286) |
| Lines with test coverage | 0 (no unit tests for LibraryScreen rendering) |
| Coverage % | 0% |
| Coverage gap | LibraryScreen has no component tests |

**Analysis:** Bug was missed because of a coverage gap — the LibraryScreen component has no rendering tests that would catch DOM spec violations (hydration warnings).

---

## Action Items

- None — the fix is sufficient and no class-of-bug follow-up is warranted. The pattern is isolated to this single file.

---

## Related

- `.agents/memory.md` — version table (v1.10.53 entry) added
- `.agents/report/postmortem-nested-button.md` — this report

---

## Knowledge Persistence

- [x] `.agents/memory.md` — version table updated (v1.10.53 entry)
- [x] `.agents/report/` — post-mortem saved
- [ ] Obsidian vault — skipped (MCP server unavailable: missing `rich` module)
