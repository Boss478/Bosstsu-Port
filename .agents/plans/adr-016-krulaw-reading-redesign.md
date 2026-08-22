# ADR-016 — KruLAW Reading Redesign (Cards, Dock, 3-Mode Theme, Settings Menu)

Status: Draft (pending senior-engineer review + user approval) · Date: 2026-08-04

## Context
User reported 8 issues on the KRULAW section: card design for TOC/content, floating reading tools above BackToTop, broken icons, light-mode white text, a 3rd Yellow Read theme, paper-like design, navbar hidden on law pages, and a settings menu. Discovery confirmed root causes (see plan §2).

## Decisions

### D1 — Theme system extended to 3 modes (`light | dark | read`)
- `read` = yellow/paper tone (`--background:#f6efd9`, `--foreground:#3a2f1f`), applied via `.read` class on `<html>` alongside `.light`/`.dark`.
- **Alternatives rejected**: site-wide read mode (touches every component; rejected — scope is KRULAW per user), CSS filter sepia (cheap but destroys images/colors; rejected).
- **Reason**: smallest safe change that meets the requirement; non-KRULAW pages degrade to paper body + light components (acceptable, documented).

### D2 — Light-mode white-text bug fixed at the CSS variable layer
- Root cause: `@media (prefers-color-scheme: dark)` forced `--foreground:#ededed` on `:root` even when site theme = light (OS dark + site light). Fix: explicit `:root.light` (and `.read`) rules AFTER the media query + ThemeProvider toggling all three classes; plus explicit text color on `[data-krulaw-body]`.
- **Alternatives rejected**: removing the media query (loses OS-default behavior), per-component color patches (whack-a-mole).

### D3 — Reading settings become global (`krulaw:settings`)
- Per-law `krulaw:<slug>:settings` keys replaced by one global key; bookmarks/notes/highlights stay per-law.
- **Alternatives rejected**: keeping per-law settings while adding header-gear settings (two sources of truth).
- **Reason**: settings menu lives in the navbar (visible on list page) and must apply wherever the user reads.

### D4 — Floating ReadingDock replaces the reader header toolbar
- All 9 toolbar actions + 4 reading controls move into a fixed right-edge stack above BackToTop; drawer settings panel removed (`ReadingSettings` reused in the header Settings menu).
- **Alternatives rejected**: keeping the header toolbar (user asked to move ALL actions), bottom sheet (mobile complexity).
- **Reason**: single, predictable reading control surface; follows scroll by being fixed.

### D5 — Settings menu = Header gear + full settings
- Gear (`fi-sr-settings`, already in subset) → theme segmented control + ReadingSettings (font size/line height/width). Keyboard-accessible dropdown (Escape, click-outside, focus management).
- **Reason**: user choice; header is visible on all non-reader pages including the KRULAW list.

### D6 — Navbar hidden on reader + digest only
- `Header.tsx` returns `null` when `pathname.startsWith('/krulaw/') && pathname !== '/krulaw'`; offsets re-tuned (`lg:top-24` → `lg:top-6`, `scroll-mt-24` → `scroll-mt-20`); back-to-list link added to the reader header.
- **Alternatives rejected**: hiding on all `/krulaw/**` (list page still needs nav), slim bar (extra component for little value).
- **Reason**: immersive reading where it matters; navigation preserved on the list page.

### D7 — Card/paper design: one content card + one TOC card; list/digest restyled
- Flat warm-white paper (no texture) — **Alternatives rejected**: per-article cards (DOM weight for 300+ articles), texture/noise (paint cost on 1 vCPU).
- **Reason**: document feel at low cost; consistent across list/reader/digest.

### D8 — Icon subset repaired, not replaced (41 glyphs, not 2)
- Script audit (2026-08-04) found **41 real icon names used in `src/` but missing from `flaticon-subset.css`** — 4 of the 9 KRULAW reader toolbar buttons render blank today (bookmark, note-sticky, book-bookmark, sliders-h) + digest arrows (arrow-small-right) + ~35 more across admin/boss478/games/cookie-policy. P1 adds ALL of them in ONE subset rebuild (same effort as fixing a few). Template-expanded names verified: `angle-up` + `angle-down` only (angle-small-* already present).
- Full font is NOT local (`node_modules/@flaticon` empty; only subset + ttx exist) → one-time fetch from the official Flaticon CDN or user-provided export; names absent from the official set get the nearest official glyph + code swap (never fake codepoints).
- **Alternatives rejected**: loading the full Flaticon font (314 KB — the exact regression the subset fixed), fixing only KRULAW icons (leaves ~36 blank site-wide for zero effort savings).

### D9 — Parallel delegation: 5 exclusive-ownership lanes, 3 waves
- Work is re-bucketed by **file ownership** (plan §8.5): Lane A Theme Core (fonts/ThemeProvider/layout/globals/ArticleView = P1+P2+P6-scroll-mt), Lane B Storage (useReaderStorage = P3), Lane C Nav & Settings (Header/SettingsMenu = P4+P2-icon+P6-null), Lane D Reader (KrulawReaderClient/TocSidebar/print.css = P5+P7+P6-offsets+body), Lane E Paper (list/digest clients = P8+P6-FAB+body). No file has two owners → zero merge conflicts by construction.
- **Waves**: W1 = qa-tester TDD-first (red tests for P2/P3) → A ∥ B (A runs P2 first to unblock; font fetch in background) → senior review boundary → W2 = C ∥ D ∥ E (deps: setTheme/setPaperTone/helpers/.read CSS all from W1) → W3 = verify + senior + parallel reviewers + perf + gate.
- **Ops rules (L9)**: ONE shared dev server on port 3300 (orchestrator-started; Playwright `reuseExistingServer:true`; lanes never start their own — bind conflict); per-lane git branches (`lane-a`…`lane-e`), merge order A+B → C+D+E after senior review; final gate includes `npm test` (vitest) alongside typecheck/lint/build/eval.
- **Alternatives rejected**: parallel-by-phase (P2/P4/P6/P7/P8 collide on Header/globals/print.css/reader files); single sequential handoff (14.5h, no pipelining); per-lane dev servers (port conflict on 3300).
- **Reason**: 5 juniors, ~17% wall-clock reduction (12h vs 14.5h), critical path = Lane D (5.75h) with a mid-lane checkpoint.
- **Roles**: qa-tester FIRST (TDD red tests), junior-engineer×5, senior-engineer (both boundaries, ALWAYS), ui-ux ∥ a11y ∥ locale (parallel), performance-reviewer, verify, reporter-doc. Skipped w/ reason: devops (no deploy), database-reviewer (no DB), security-reviewer (no auth/input).

### D10 — Paper tone is user-adjustable (soft / classic / warm)
- User chose: default = **cream/sepia**, but settings let the user choose how much yellow. Implemented as 3 tone levels — `soft` (cream #f5ecd9, default), `classic` (sepia #f2e8d5), `warm` (yellow #f6efd9) — driven by CSS variables (`--read-bg`/`--read-card`, `--read-ink` constant #3a2f1f) + `data-paper-tone` attribute on `<html>`, set by ThemeProvider's new `setPaperTone()`.
- Stored in its own localStorage key `krulaw:paperTone` (validated; default `classic` per user) — deliberately NOT in `ReadingSettingsValue` (keeps the frozen reader-props contract unchanged).
- Controls: SettingsMenu (tone segmented) + ReadingDock (palette cycle button, `fi-sr-palette` — already in subset; dock = 16 buttons).
- **Alternatives rejected**: single fixed yellow (user asked for adjustment), slider 0–100 (3 discrete levels are simpler, enough range, fewer a11y states), tone inside reader settings (would break the frozen contract).
- **Reason**: user requirement; CSS-variable approach costs ~0.5 KB CSS and one extra state in ThemeProvider; contrast audited per tone in P8 (≥4.5:1 on every card bg).

## Consequences
- `ThemeProvider` API grows `setTheme(next)`; `toggleTheme` stays light↔dark (AdminSidebar + phonics SettingsScreen must not regress).
- `.read #main-content` background override required (main's `bg-blue-50` would otherwise cover the paper vars).
- `useReaderStorage` settings key scope change (old per-law keys ignored, not deleted).
- Reader toolbar block + settings panel removed from `KrulawReaderClient.tsx`; `ReadingDock` owns them; group-2 actions stay mounted (focus-restore contract).
- Article column gets `pr-14 lg:pr-16` dock clearance; expanded dock capped `max-h-[60vh]` on mobile.
- `krulaw-immersive` body hook owned by client components (reader + digest effects), not the server layout.
- Print CSS hides `.krulaw-dock` + strips card chrome.
- Header theme button gains a third (read) state + dynamic aria-label.
- Version bump (minor) + changelog entry on completion.
- **Rollback (L5-4)**: every change is git-revertible; font artifacts (css/woff2/ttx) are versioned files; theme change is confined to ThemeProvider + globals.css + layout head script — a revert restores previous behavior without data migration.

## Review status
- **senior-engineer (2026-08-04): APPROVE WITH CHANGES** — 1 blocker (icon scope 2→42), 4 majors (`.read #main-content` dead CSS; `toggleTheme` 3-way cycle regresses AdminSidebar/phonics; dock overlap 768–1279px + mobile expanded height; read-mode muted-text contrast), 3 minors (TOC `lg:max-h` re-tune; Header blank button in read; print card chrome). All incorporated into the plan (§4, §8, §9).
- **Manager (PM): approve** — requirements coverage complete, scope matches user decisions, resource cost (zero server, ~+20 KB font, ~10 KB JS) within 1 vCPU/4GB envelope.
- **Scrutiny loops (manager, 2026-08-04, 8× — no subagents, per user; loops 6–8 = whole-file passes)**:
  - L1–L5: see prior log (dock in-file, pre-hydration script, validator, disclosure pattern, unit tests, FR1–FR14 checklist, rollback).
  - L6 (whole file): **count corrected 42→41** (angle-small-up not needed; arrow-small-right deduped; 39 literals + angle-up/angle-down); **"5 of 9" corrected → "4 of 9"** blank toolbar buttons (search/glossary/copy/share/print icons verified present); stale version/overview/NF numbers fixed; duplicate `@custom-variant` + §4.6 heading deduped; dock position made explicit (`right-6 md:right-10`); **NEW: digest page would have NO theme control** (navbar hidden, no dock/gear) → floating 3-mode theme FAB added to DigestStudyClient (P6).
  - L7 (whole file): button count corrected 13→**15 (≈700px)**; TOC card example de-`read:`'d (strategy consistency); **Escape conflict resolved: drawer wins over dock expander**; dead-code check += inert `.krulaw-toolbar` print rule; mobile 60vh + desktop calc caps both kept.
  - L8 (whole file): estimate math corrected (13.5h eng, not 14.5h); digest theme FAB gets `krulaw-theme-fab` class + print-hide; §3 NF Print line expanded; ADR D8 synced to 41.
  - **Stopped at 8 loops (user minimum 5, max 10): loops 8 produced only numeric/consistency nits — no new design or technical issues.**
- **User decisions (2026-08-04)**: fix ALL 41 icons site-wide; 5–10 whole-file scrutiny loops (8 run); concise recap after; **parallel delegation plan (D9, 5 lanes / 3 waves)**.
