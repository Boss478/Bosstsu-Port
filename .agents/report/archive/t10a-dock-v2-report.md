# T10a — Dock v2: Task Report

**Date:** 2026-08-06 · **Owner:** junior-engineer → senior-engineer review
**Intake:** `.agents/tasks/t10a-dock-v2.md` · **Plan T10a:** `.agents/plans/lawlib-ui-glassmorphism-fixes.md` · **ADR:** adr-019 (D1/D2/D3/D4/D5/D6/D7/D8)

## Changed Files

| File | Change |
|---|---|
| `src/lib/lawlib/paper-tone.ts` | **NEW** — paperTone 0-100 → `--read-bg`/`--read-card` piecewise-linear interpolation through the legacy soft/classic/warm colors (30/50/80 exact — no visual change for existing users); `PAPER_TONE_STOPS` exported for the layout pre-paint script (ADR-019 D8) |
| `src/app/(website)/lawlib/lib/reader-props.ts` | Contract change: `fontSize: number` (8-32), `width: number` (40-80ch), `lineHeight` clamp [1.0, 2.0], `favoriteToolKeys: DockToolKey[]` (11-tool union type) |
| `src/hooks/useReaderStorage.ts` | `DEFAULT_READING_SETTINGS` numeric (16px/1.8/60ch/curated favorites); `validateReadingSettings` legacy migration (`s/m/l/xl`→14/16/18/24, `narrow/normal/wide`→40/60/80), clamps, favorites filter+dedupe; `DOCK_TOOL_KEYS` runtime list |
| `src/components/ThemeProvider.tsx` | Theme 3→5 (`light/dark/read/sepia/night`); `paperTone` enum→number 0-100 (legacy strings migrate 30/50/80); writes inline CSS vars; `parsePaperTone`/`paperToneVars` wired |
| `src/app/layout.tsx` | Pre-paint script: 5-theme validation + numeric paperTone with embedded `PAPER_TONE_STOPS` + inline lerp |
| `src/app/globals.css` | `:root.sepia`/`:root.night`; `dark` variant extends to `.night`, `read` variant to `.sepia`; removed `html.read[data-paper-tone=…]` selectors; `.sepia` added to every `.read` override; dock dead-blur rule (T3) via undefined-var trick (see decisions) |
| `src/components/LawlibDock.tsx` | **NEW** — dock v2: Level 0/1/2, 8 positions + anchor flip + safe-area, favorites + pin toggles, "อ่านต่อ" button, position selector, Esc/outside/re-click close (no auto-collapse) |
| `src/components/LawlibPickers.tsx` | **NEW** — portal PickerPopover (measure+flip, Esc/outside, focus-first) + 4 pickers: theme (5 + paper slider shown for read/sepia), fontSize (−/+ steppers + 14/16/18/24 preset chips), lineHeight slider, width slider |
| `src/components/BookmarksPanel.tsx` | **NEW** — bookmarks grouped by chapter/section (jump/delete) for dock Level 2 |
| `src/components/LawTooltip.tsx` | Article-actions hub (same-law refs only): bookmark ± (aria-pressed), copy-link (flash), quick-note textarea (500ms debounced autosave, flush on blur/unmount) + "เปิดโน้ตทั้งแผง" (goes through onClose) — all inside the registered root |
| `src/components/ReadingSettings.tsx` | Numeric contract UI (sliders 8-32px / 1.0-2.0 / 40-80ch) |
| `src/components/SettingsMenu.tsx` | D8 dedupe: paper-tone + ReadingSettings removed from header; theme segment now 5 modes |
| `src/app/(website)/lawlib/[slug]/LawlibReaderClient.tsx` | Old dock/cycles/BookmarksPanel drawer removed; dock v2 wired; CSS-var typography (see decisions); tooltip hub wiring; quick-note upsert; bookmarks PanelKind dropped |
| `tests/unit/lawlib/reader-settings.test.ts` | Rewritten for the numeric contract + legacy migration (22 tests) |
| `tests/unit/lawlib/theme-provider.test.tsx` | 5-mode + numeric paperTone + inline vars + migration (20 tests) |
| `tests/unit/lawlib/reading-dock.test.tsx` | Rewritten for dock v2 (14 tests: levels, close paths, pickers, bookmark, pins, positions, 375 structure) |
| `package.json` | Added `"eval": "./.agents/evals/run-evals.sh"` — the alias the eval doc says is missing; the intake verify step (`npm run eval -- lawlib`) requires it |

## Behavior Contract (must still hold)

- useLawTooltip.ts **untouched** — T1 semantics intact (tooltip.test.tsx 28 blocks green); hub controls live inside the registered root; only "เปิดโน้ตทั้งแผง" closes via onClose.
- CompactView/TocSidebar/ArticleView/SearchInput/BackToTop/fonts **untouched** — compact receives `text-[length:var(--lawlib-font-size)]` / `max-w-[length:var(--lawlib-width)]` + the vars set on the reader root (verified compiled CSS: `font-size:var(--lawlib-font-size)` etc.).
- Paper tone colors at legacy stops are pixel-identical to before (30/50/80 pass through exact legacy colors).
- `backdrop-blur-xs/3xs` + glass-1/2/3 untouched; read/sepia dock blur killed only on the dock surfaces (light/dark/night keep blur — measured).
- Legacy stored settings (enum strings) migrate in the validator — a user on `l`/`wide`/`warm` keeps 18px/80ch/tone-80 (verified in-browser: stored `'s'`→14px displayed, `'warm'`→tone-80 colors).

## Verification Evidence

| Gate | Result |
|---|---|
| `npx vitest run tests/lawlib tests/unit/lawlib` | **293/293 pass** (13 files; incl. tooltip 28, compact-routing 21, dock 14, theme 20, settings 22) |
| `npm run eval -- lawlib` | **17/17 pass** (alias added; regression + capability graders) |
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| `npm run build` | clean exit (route table incl. all 4 lawlib slugs) |
| Manual smoke (dev :3300, restarted) | see below |

**Manual smoke (playwright, /lawlib/sample):**
- Collapse/expand: 1 plain icon (no badge) → Level-1 panel; stays open through picker open/select; Esc (focus returns to icon), outside click, X, re-click all close.
- Pickers show current values (ธีม สว่าง→มืด→กระดาษ, 14px, 1.8, 60ch) — direct choice, no cycling; paper slider appears on กระดาษ/sepia; slider write persists numeric tone + inline vars update (rgb(244,234,215) at 40 = exact interpolation).
- Bookmark: toggle + filled state + count badge + persisted (`lawlib:sample:bookmarks`); Level-2 list grouped by chapter ("บททั่วไป → มาตรา 3") with jump/delete.
- Tooltip hub: bookmark ± ("เพิ่มที่คั่นหน้า"→"ที่คั่นแล้ว"), copy-link, quick-note autosave (localStorage after 500ms), เปิดโน้ตทั้งแผง closes tooltip + opens drawer with the note visible; "มีบันทึก" indicator shows.
- 8 positions: top-left applied (wrapper at 80px/16px), persisted `lawlib:dockPosition`; bottom-right clears BackToTop (dock bottom 571 < BackToTop top 597); safe-area classes present.
- Mobile 375px: panel 345px fits, Level-1 row wraps 2 rows, Level-2 scrolls (scrollHeight > clientHeight).
- Themes: read/sepia = paper surface + `backdrop-filter: none` (T3); light/night = glass blur intact; night = dark slate glass on near-black page.

## Key Decisions (flag for senior review)

1. **`resumePosition` NOT added to `ReadingSettingsValue`** — the existing per-slug `lastPosition` (`lawlib:<slug>:last-position`) already IS the per-slug resume position, and the "อ่านต่อ" Level-1 button uses it. Adding a per-slug map to the device-wide settings blob would create two sources of truth + unbounded growth. Deviation from the intake's contract list — 10-line revert if you disagree.
2. **Hub close semantics**: bookmark/copy/copy-link/note-autosave keep the tooltip OPEN (quick actions — closing on every toggle would be hostile); only "เปิดโน้ตทั้งแผง" navigates → calls `onClose()` (closeTooltip) first. Read the intake constraint "their buttons call onClose" as *the sanctioned close path when closing is needed* (pointerdown-outside already exempts the root). If the intent was "every hub button closes the tooltip", that's a one-line change per button.
3. **Bookmark drawer removed** (PanelKind 'bookmarks' + old flat BookmarksPanel) — the list lives in dock Level 2 per D3; keeping both would restore the redundancy the user removed.
4. **Empty `favoriteToolKeys` is valid** (unpin-all → Level 1 shows only เพิ่มเติม) — an explicit array wins even empty; only missing/non-array falls back to defaults.
5. **Quick-note upsert edits/deletes the LATEST note** of the article (notes are a list per article; quick-write is a single-draft surface).
6. **Sepia/night implemented as real themes** (the picker must offer them per intake): sepia reuses the `.read` paper chain via the `read` custom-variant + fixed sepia ink; night reuses `.dark` styles via the `dark` variant + near-black page. Colors are my choice — user gave no spec (review the look).
7. **CSS-var typography trick** for CompactView (frozen): `--lawlib-font-size`/`--lawlib-width` set on the reader root; static arbitrary-value classes `text-[length:var(--lawlib-font-size)]` / `max-w-[length:var(--lawlib-width)]` (JIT-safe — verified in compiled CSS).
8. **Dead-blur rule rides an UNDEFINED custom property** (`backdrop-filter: var(--lawlib-dock-blur)`) because LightningCSS dead-code-eliminates `backdrop-filter: none` (it equals the property's initial value — empirically confirmed, even with `!important`; only the `-webkit-` declaration survived and Chrome then computed the utility's blur). Undefined var → guaranteed-invalid → computes to `none`. Comment documents this.
9. **`npm run eval` alias added** to package.json (eval doc explicitly notes it's missing; the intake verify step depends on it).
10. **Content reserve removed** (`pr-18 sm:pr-18 md:pr-24` on the FULL article card) — the dock is no longer a right-edge rail (T9's "ตัด reserve" direction).
11. **Dock Level-2 bookmark jump closes the dock** (navigation intent — mirrors the old drawer's jump-close).
12. **`lawlib-dock` class added to the panel + collapsed icon** (surfaces), not just the wrapper — the `.read .lawlib-dock` paper override + dead-blur must hit the element that carries the background/blur (found via smoke: wrapper-only left glass white + blur in read mode).
13. **lineHeight default stays 1.8** (inside the new 1.0-2.0 clamp; old default preserved).

## Notes / Deferred

- **Tooltip read-mode surface** (pre-existing T5 item): `.lawlib-tooltip` bg stays white on paper in read mode; the new hub inherits it. Out of T10a scope (T5 owns it) — flagged for sequencing.
- **Contrast spot-checks** of the new surfaces (dock buttons, hub buttons, pickers) were NOT measured with a composited-pixel tool — recommend ui-ux re-inspect per AC "contrast AA พื้นผิวใหม่".
- ⚙️ settings row = disabled placeholder (T10b).
- Dev server was serving stale CSS (my earlier `npm run build` clobbered its `.next`); I restarted it (nohup, port 3300) — smoke ran against the fresh compile. A concurrent session's `npm run lawlib:build` regenerated `src/data/lawlib/{index.json,registry.ts,laws/*}` + new ministry act mid-session (mtimes 12:30, not my commands); all gates re-ran green afterwards, and the final build includes all 4 laws.
- vitest count is 293 (intake said "237+") — the suite grew with the rewritten tests.
