# Lane D Fixes — Task 6 (Wave 3) — 2026-08-04

Branch: `lane-d-fixes` (from `main` @ `6e01846`). Files: `KrulawReaderClient.tsx`, `print.css`, `tests/unit/krulaw/reading-dock.test.tsx` (new). Committed locally only — **push pending approval**.

## Changes

### 1. [MAJOR] Mobile/sm clearance — `src/app/(website)/krulaw/[slug]/KrulawReaderClient.tsx` (~line 1055)
Card classes changed:
- **Before**: `p-4 pr-14 … sm:p-6 md:pr-24` — Tailwind v4 emits `.sm:p-6` after `.pr-14`, so at 640–767px padding-right collapsed to 24px → ~45px of text ran under the dock.
- **After**: `p-4 pr-18 sm:p-6 sm:pr-18 md:pr-24` (`pr-18` = 72px). `sm:pr-18` explicitly restores the right padding inside the sm media block; `md:pr-24` (96px) unchanged.

### 2. [MINOR] Automated dock test — `tests/unit/krulaw/reading-dock.test.tsx` (new, 4 tests)
`ReadingDock` is module-local to KrulawReaderClient (not exported — checked), so the dock is exercised through the full client: `render(<ThemeProvider><KrulawReaderClient law={sample.json} /></ThemeProvider>)` (jsdom, pattern of `theme-provider.test.tsx`). Stubs: in-memory localStorage, `matchMedia`, `IntersectionObserver` (TocSidebar scroll-spy), `vi.mock('next/link')` → plain `<a>`. The reader's mount `setTimeout(0)` (first-article activation) is flushed inside `act`. Tests:
1. Chevron disclosure toggles `aria-expanded` `false→true→false`; `aria-controls="krulaw-dock-actions"`; group-2 `hidden` class tracks it.
2. Escape collapses the expander and returns focus to the chevron (`document.activeElement`).
3. **Drawer wins**: with the search drawer open, Escape closes the drawer and leaves the expander open (the dock's Escape listener is not attached while `activePanel !== null`).
4. Group-2 stays **mounted** (hidden class) when collapsed — the drawer's `opener.isConnected` focus-restore depends on it.

### 3. [NIT] Stale comments
- `KrulawReaderClient.tsx:11` — removed ReadingSettings from the reader leaf-panel list (it now mounts only in SettingsMenu; the reader imports only SearchPanel/GlossaryPanel/EditionTimeline). Also fixed the sibling "four leaf panels" → "three leaf panels" comment (same stale fact).
- `print.css:15-16` — `.krulaw-panel` contract: "SearchPanel, GlossaryPanel — both carry this class" (ReadingSettings dropped).
- `print.css:~86` — removed the dead `.krulaw-toc` entry from the card-strip rule (`.krulaw-toc` is `display:none`-ed above at line ~58, so the strip entry never applies) + comment updated. The `display:none` entry stays — it is the live one.

## Browser verification (shared Docker dev :3300, law page `/krulaw/national-education-act-2542`, viewport 800px tall)

Geometry — card content right edge vs dock left edge, with article text scrolled into the dock's vertical band (smooth-scroll settled):

| viewport | card padding-right | text edge (px from left) | dock left (px) | worst text right in dock band | clearance |
|---|---|---|---|---|---|
| 375 | **72** (`pr-18`) | 287 | 289 | 286 | **+3px** |
| 640 | **72** (`sm:pr-18` — the bug width) | 552 | 554 | 551 | **+3px** |
| 768 | **96** (`md:pr-24`) | 656 | 666 | 655 | **+11px** |
| 1024 | **96** (`md:pr-24`) | 912 | 922 | 911 | **+11px** |

No text under the dock at any width (previously 640–767 collapsed to 24px → ~45px overlap). The `sm:pr-18` computed value of 72px at 640px proves the override wins over `sm:p-6`.

Live dock behaviors (Playwright, 375px):
- Chevron click → `aria-expanded="true"`, group-2 visible, focus moved to first action button (`ที่คั่นมาตรานี้` — L4-1).
- Escape → `aria-expanded="false"`, group-2 hidden but still mounted, focus back on the chevron.
- Search drawer open → Escape closes the drawer, expander **stays** `aria-expanded="true"` (drawer wins); second Escape then collapses the expander.

## Verification evidence

- `npx tsc --noEmit` — **clean**.
- `npx vitest run tests/unit/krulaw` — **34/34 passed** (30 existing + 4 new dock tests).
- `npx eslint` on `KrulawReaderClient.tsx` + `reading-dock.test.tsx` — **clean** (print.css is not ESLint-targeted; no stylelint configured).

## Known risks / for senior review

- Clearance at 375/640 is exactly **3px** (senior's estimate: 89px vs 86px edge → 3px). Matches the plan's geometry; any future dock widening or `right-6`→`right-10` change at <768px would need a re-check. 768/1024 have 11px of slack.
- The dock test renders the full reader client (needed since `ReadingDock` is module-local). It depends on `sample.json` staying schema-valid (it is a build-pinned fixture used by `tests/krulaw/copy-print.test.ts`). If a future refactor exports `ReadingDock` with a props contract, the test could be slimmed to render it directly.
- Noted (out of scope, not fixed): `src/lib/copy-print.ts` `printLaw` throws `TypeError: win.focus is not a function` when `window.open` returns null (popup blocked) — seen in the shared browser's console during unrelated manual testing. Suggest a follow-up ticket.
- Shared dev server was flaky mid-session (parallel juniors' Fast Refresh rebuilds + other sessions driving the shared browser); measurements were captured while the page was stable, and the live behavior pass was re-run via a single self-contained Playwright script to survive reloads.
- Working tree contains OTHER juniors' uncommitted Task 2/4 changes (Header/SettingsMenu/globals.css etc.) — this commit contains ONLY the three Lane D files + this report.
